# SSE (Server-Sent Events) 연결 흐름 가이드

## 목차
1. [개요](#1-개요)
2. [전체 아키텍처](#2-전체-아키텍처)
3. [Phase 1: 연결 시작](#3-phase-1-연결-시작)
4. [Phase 2: 이벤트 전송](#4-phase-2-이벤트-전송)
5. [Phase 3: 연결 종료](#5-phase-3-연결-종료)
6. [내부 동작 상세](#6-내부-동작-상세)
7. [SSE vs WebSocket vs Polling](#7-sse-vs-websocket-vs-polling)
8. [전체 시퀀스 다이어그램](#8-전체-시퀀스-다이어그램)

---

## 1. 개요

SSE(Server-Sent Events)는 서버에서 클라이언트로 **단방향 실시간 데이터 스트리밍**을 제공하는 웹 기술입니다.

### 특징
- HTTP/1.1 기반 (별도 프로토콜 불필요)
- 서버 → 클라이언트 단방향 통신
- 자동 재연결 지원 (브라우저 내장)
- 텍스트 기반 데이터 전송

### 사용 사례
- 작업 진행률 표시
- 실시간 알림
- 주식/암호화폐 시세
- 소셜 미디어 피드

---

## 2. 전체 아키텍처

```
[Frontend]                              [Spring Boot Server]

┌──────────┐    1. HTTP GET Request     ┌──────────────────┐
│          │ ─────────────────────────> │ Controller       │
│ Browser  │    Accept: text/event-     │                  │
│   or     │    stream                  └────────┬─────────┘
│  Client  │                                     │
│          │                                     ▼
│          │                            ┌──────────────────┐
│          │    2. SseEmitter 생성       │ Service          │
│          │ <───────────────────────── │ (TaskProgress)   │
│          │    HTTP 연결 유지           └────────┬─────────┘
│          │    (Keep-Alive)                     │
│          │                                     │ Map에 저장
│          │                                     ▼
│          │                            ┌──────────────────┐
│          │    3. 이벤트 Push           │ emitters Map     │
│          │ <═══════════════════════   │ userId → Emitter │
│          │    data: {...}             └──────────────────┘
│          │
│          │    4. 연결 종료
│          │    - 클라이언트 종료
│          │    - 타임아웃
│          │    - 서버 close()
└──────────┘
```

---

## 3. Phase 1: 연결 시작

### 3.1 클라이언트 요청

**JavaScript 코드:**
```javascript
const eventSource = new EventSource('/api/progress/subscribe?userId=user123');
```

**실제 HTTP 요청:**
```http
GET /api/progress/subscribe?userId=user123 HTTP/1.1
Host: localhost:8082
Accept: text/event-stream        ← SSE 전용 MIME 타입
Cache-Control: no-cache
Connection: keep-alive           ← 연결 유지 요청
```

### 3.2 서버 수신 (Controller)

**파일:** `TaskProgressController.java`
```java
@GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter subscribe(@RequestParam String userId) {
    return taskProgressService.createEmitter(userId);
}
```

**핵심 포인트:**
- `produces = MediaType.TEXT_EVENT_STREAM_VALUE`
  - 응답 헤더: `Content-Type: text/event-stream`
- 반환 타입 `SseEmitter` → Spring이 특별하게 처리

### 3.3 SseEmitter 생성 및 등록

**파일:** `TaskProgressService.java`
```java
public SseEmitter createEmitter(String userId) {
    // 1. SseEmitter 객체 생성 (타임아웃: 1시간)
    SseEmitter emitter = new SseEmitter(60 * 60 * 1000L);

    // 2. 생명주기 콜백 등록
    emitter.onCompletion(() -> {
        log.info("[SSE] 연결 종료: userId={}", userId);
        emitters.remove(userId);
    });

    emitter.onTimeout(() -> {
        log.info("[SSE] 타임아웃: userId={}", userId);
        emitters.remove(userId);
    });

    emitter.onError(e -> {
        log.error("[SSE] 에러 발생: userId={}", userId, e);
        emitters.remove(userId);
    });

    // 3. Map에 저장 (나중에 이벤트 전송에 사용)
    emitters.put(userId, emitter);

    return emitter;
}
```

### 3.4 HTTP 응답 (연결 수립 완료)

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8
Transfer-Encoding: chunked      ← 스트리밍 전송
Connection: keep-alive
Cache-Control: no-cache, no-store, max-age=0

← 연결 유지 (응답 본문이 열린 상태)
```

### 3.5 이 시점의 상태

```
┌─────────────┐                    ┌─────────────┐
│   Client    │ ═══════════════════│   Server    │
│             │   HTTP Connection  │             │
│ EventSource │   (Open/Waiting)   │  SseEmitter │
└─────────────┘                    └─────────────┘

        연결 수립 완료 (데이터 대기 상태)
```

---

## 4. Phase 2: 이벤트 전송

### 4.1 Kafka Consumer에서 진행률 업데이트

**파일:** `OrderConsumer.java`
```java
// Step 1: 주문 검증 (25%)
taskProgressService.updateProgress(taskId, userId, 1, TOTAL_STEPS, "주문 검증");
validateOrder(order);
simulateProcessingTime(500);

// Step 2: 재고 확인 (50%)
taskProgressService.updateProgress(taskId, userId, 2, TOTAL_STEPS, "재고 확인");
checkInventory(order);
simulateProcessingTime(500);

// Step 3: 결제 처리 (75%)
taskProgressService.updateProgress(taskId, userId, 3, TOTAL_STEPS, "결제 처리");
processPayment(order);
simulateProcessingTime(500);

// Step 4: 주문 완료 (100%)
taskProgressService.complete(taskId, userId);
```

### 4.2 SSE 이벤트 전송

**파일:** `TaskProgressService.java`
```java
public void updateProgress(String taskId, String userId, int currentStep, int totalSteps, String stepName) {
    TaskProgress progress = TaskProgress.of(taskId, userId, currentStep, totalSteps, stepName);
    sendToUser(userId, progress);
}

private void sendToUser(String userId, TaskProgress progress) {
    SseEmitter emitter = emitters.get(userId);  // Map에서 조회

    if (emitter == null) {
        log.warn("[SSE] 연결 없음: userId={}", userId);
        return;
    }

    try {
        emitter.send(SseEmitter.event()
                .name("progress")           // 이벤트 타입
                .data(progress));           // JSON 직렬화
    } catch (IOException e) {
        emitters.remove(userId);
    }
}
```

### 4.3 전송되는 데이터 형식

```
event:progress
data:{"taskId":"abc-123","userId":"user123","currentStep":1,"totalSteps":4,"percentage":25,"stepName":"주문 검증","status":"PROCESSING"}

event:progress
data:{"taskId":"abc-123","userId":"user123","currentStep":2,"totalSteps":4,"percentage":50,"stepName":"재고 확인","status":"PROCESSING"}

event:progress
data:{"taskId":"abc-123","userId":"user123","currentStep":3,"totalSteps":4,"percentage":75,"stepName":"결제 처리","status":"PROCESSING"}

event:progress
data:{"taskId":"abc-123","userId":"user123","currentStep":4,"totalSteps":4,"percentage":100,"stepName":"완료","status":"COMPLETED"}
```

### 4.4 클라이언트 수신

```javascript
eventSource.addEventListener('progress', (event) => {
    const progress = JSON.parse(event.data);

    console.log(`${progress.stepName}: ${progress.percentage}%`);
    // 출력:
    // 주문 검증: 25%
    // 재고 확인: 50%
    // 결제 처리: 75%
    // 완료: 100%

    updateProgressBar(progress.percentage);

    if (progress.status === 'COMPLETED') {
        eventSource.close();  // 완료 시 연결 종료
    }
});
```

---

## 5. Phase 3: 연결 종료

### 5.1 종료 시나리오

| 시나리오 | 트리거 | 서버 콜백 |
|---------|-------|----------|
| 클라이언트 정상 종료 | `eventSource.close()` | `onCompletion()` |
| 서버 타임아웃 | `SSE_TIMEOUT` 초과 (1시간) | `onTimeout()` |
| 서버 명시적 종료 | `emitter.complete()` | `onCompletion()` |
| 네트워크 오류 | 연결 끊김, 브라우저 닫기 | `onError()` |
| 에러 발생 | `emitter.completeWithError()` | `onError()` |

### 5.2 콜백 처리

```java
emitter.onCompletion(() -> {
    // 정상 종료 또는 클라이언트 연결 해제
    log.info("[SSE] 연결 종료: userId={}", userId);
    emitters.remove(userId);  // Map에서 제거 (메모리 정리)
});

emitter.onTimeout(() -> {
    // 타임아웃 발생
    log.info("[SSE] 타임아웃: userId={}", userId);
    emitters.remove(userId);
});

emitter.onError(e -> {
    // 에러 발생 (IOException 등)
    log.error("[SSE] 에러 발생: userId={}", userId, e);
    emitters.remove(userId);
});
```

### 5.3 클라이언트 자동 재연결

```javascript
// EventSource는 기본적으로 자동 재연결을 시도함
eventSource.onerror = (error) => {
    if (eventSource.readyState === EventSource.CLOSED) {
        console.log('연결이 완전히 종료됨');
    } else {
        console.log('연결 끊김, 자동 재연결 시도 중...');
        // 브라우저가 자동으로 재연결 시도 (보통 3초 후)
    }
};

// 자동 재연결을 막으려면 명시적으로 닫아야 함
eventSource.close();
```

---

## 6. 내부 동작 상세

### 6.1 Spring의 SseEmitter 처리 흐름

```
1. Controller에서 SseEmitter 반환
   ↓
2. Spring MVC가 ResponseBodyEmitterReturnValueHandler 사용
   ↓
3. AsyncContext 생성 (비동기 처리 모드)
   ↓
4. Tomcat 스레드 반환 (스레드 풀로 돌려보냄)
   ↓
5. HTTP 연결은 유지 (응답 스트림 열린 상태)
   ↓
6. emitter.send() 호출 시
   → 별도 스레드에서 실행 가능
   → 직접 OutputStream에 쓰기
   ↓
7. emitter.complete() 또는 타임아웃
   → AsyncContext 종료
   → HTTP 연결 닫힘
```

### 6.2 스레드 관점

```
[Tomcat Worker Thread]
│
├─▶ HTTP 요청 수신
├─▶ Controller.subscribe() 호출
├─▶ SseEmitter 생성 & Map 저장
├─▶ SseEmitter 반환
└─▶ 스레드 반환 (블로킹 없음!) ← 핵심!

[Kafka Consumer Thread]
│
├─▶ 메시지 수신
├─▶ taskProgressService.updateProgress()
├─▶ emitter.send() ← Map에서 emitter 조회 후 직접 전송
└─▶ 다음 메시지 처리

[클라이언트 연결]
│
└─▶ HTTP 연결은 유지되지만 서버 스레드를 점유하지 않음
    (Tomcat NIO의 비동기 I/O 활용)
```

**핵심 포인트:** SSE 연결은 스레드를 점유하지 않습니다. 수천 개의 동시 연결도 적은 스레드로 처리 가능합니다.

---

## 7. SSE vs WebSocket vs Polling

| 항목 | SSE | WebSocket | Polling |
|-----|-----|-----------|---------|
| **통신 방향** | 서버 → 클라이언트 (단방향) | 양방향 | 클라이언트 → 서버 (반복) |
| **프로토콜** | HTTP/1.1 | WebSocket (별도) | HTTP/1.1 |
| **연결 유지** | ✅ Keep-Alive | ✅ Persistent | ❌ 매번 새 연결 |
| **자동 재연결** | ✅ 브라우저 지원 | ❌ 직접 구현 | N/A |
| **프록시/방화벽** | ✅ 통과 용이 | ⚠️ 문제 가능 | ✅ 문제 없음 |
| **바이너리 데이터** | ❌ 텍스트만 | ✅ 지원 | ✅ 지원 |
| **구현 복잡도** | 낮음 | 중간 | 매우 낮음 |
| **서버 리소스** | 낮음 | 중간 | 높음 (반복 요청) |

### 사용 권장 사례

| 기술 | 적합한 사용처 |
|-----|-------------|
| **SSE** | 진행률 표시, 실시간 알림, 뉴스 피드, 주가 업데이트 |
| **WebSocket** | 채팅, 게임, 실시간 협업 도구, 양방향 소통 필요 시 |
| **Polling** | 간단한 상태 확인, 레거시 시스템 호환 |

---

## 8. 전체 시퀀스 다이어그램

```
┌─────────┐       ┌──────────┐       ┌─────────┐       ┌─────────┐
│Frontend │       │Controller│       │ Service │       │  Kafka  │
└────┬────┘       └────┬─────┘       └────┬────┘       └────┬────┘
     │                 │                  │                 │
     │ 1. EventSource  │                  │                 │
     │ GET /subscribe  │                  │                 │
     │────────────────>│                  │                 │
     │                 │                  │                 │
     │                 │ 2. createEmitter │                 │
     │                 │─────────────────>│                 │
     │                 │                  │                 │
     │                 │                  │ 3. Map에 저장    │
     │                 │                  │ emitters.put()  │
     │                 │                  │                 │
     │                 │<─────────────────│                 │
     │                 │                  │                 │
     │ 4. HTTP 200 OK  │                  │                 │
     │ (연결 유지)      │                  │                 │
     │<────────────────│                  │                 │
     │                 │                  │                 │
     │ ══════════════════════════════════════════════════  │
     │              연결 유지 상태 (이벤트 대기)              │
     │ ══════════════════════════════════════════════════  │
     │                 │                  │                 │
     │ 5. POST /orders │                  │                 │
     │────────────────>│                  │                 │
     │                 │                  │                 │
     │                 │ 6. sendOrder     │                 │
     │                 │ Request()        │                 │
     │                 │─────────────────>│                 │
     │                 │                  │                 │
     │                 │                  │ 7. Kafka        │
     │                 │                  │ Produce         │
     │                 │                  │────────────────>│
     │                 │                  │                 │
     │ 8. Response     │                  │                 │
     │ {taskId: "..."}│                  │                 │
     │<────────────────│                  │                 │
     │                 │                  │                 │
     │                 │                  │ 9. Kafka        │
     │                 │                  │ Consume         │
     │                 │                  │<────────────────│
     │                 │                  │                 │
     │ 10. SSE Event   │                  │                 │
     │ progress: 25%   │                  │ updateProgress  │
     │<═══════════════════════════════════│ (1/4)          │
     │                 │                  │                 │
     │ 11. SSE Event   │                  │                 │
     │ progress: 50%   │                  │ updateProgress  │
     │<═══════════════════════════════════│ (2/4)          │
     │                 │                  │                 │
     │ 12. SSE Event   │                  │                 │
     │ progress: 75%   │                  │ updateProgress  │
     │<═══════════════════════════════════│ (3/4)          │
     │                 │                  │                 │
     │ 13. SSE Event   │                  │                 │
     │ progress: 100%  │                  │ complete()      │
     │<═══════════════════════════════════│                 │
     │                 │                  │                 │
     │ 14. close()     │                  │                 │
     │────────────────>│                  │                 │
     │                 │                  │ onCompletion()  │
     │                 │                  │ emitters.remove │
     │                 │                  │                 │
     ▼                 ▼                  ▼                 ▼
```

---

## 부록: 테스트 방법

### curl로 테스트

```bash
# 터미널 1: SSE 연결
curl -N "http://localhost:8082/api/progress/subscribe?userId=user123"

# 터미널 2: 주문 생성
curl -X POST "http://localhost:8082/api/orders?userId=user123&productName=노트북&quantity=1"
```

### JavaScript로 테스트

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE Progress Test</title>
</head>
<body>
    <h1>주문 진행률</h1>
    <div id="progress">0%</div>
    <progress id="progressBar" value="0" max="100"></progress>
    <button onclick="createOrder()">주문하기</button>

    <script>
        const userId = 'user' + Math.random().toString(36).substr(2, 9);

        // SSE 연결
        const eventSource = new EventSource(`/api/progress/subscribe?userId=${userId}`);

        eventSource.addEventListener('progress', (event) => {
            const data = JSON.parse(event.data);
            document.getElementById('progress').textContent =
                `${data.stepName}: ${data.percentage}%`;
            document.getElementById('progressBar').value = data.percentage;

            if (data.status === 'COMPLETED') {
                eventSource.close();
                alert('주문 완료!');
            }
        });

        eventSource.onerror = () => {
            console.log('SSE 연결 오류');
        };

        function createOrder() {
            fetch(`/api/orders?userId=${userId}&productName=노트북&quantity=1`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => console.log('주문 접수:', data));
        }
    </script>
</body>
</html>
```

---

## 관련 파일

| 파일 | 설명 |
|-----|------|
| `dto/TaskProgress.java` | 진행률 데이터 전송 객체 |
| `dto/OrderRequest.java` | 주문 요청 객체 |
| `service/TaskProgressService.java` | SSE 연결 관리 + 진행률 전송 |
| `controller/TaskProgressController.java` | SSE 구독 엔드포인트 |
| `controller/OrderController.java` | 주문 생성 API |
| `consumer/OrderConsumer.java` | Kafka 메시지 처리 + 진행률 업데이트 |
| `producer/OrderProducer.java` | Kafka 메시지 발행 |
