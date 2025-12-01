# Event Sourcing 기반 진행률 시스템 가이드

## 목차
1. [개요](#1-개요)
2. [아키텍처](#2-아키텍처)
3. [구성 요소](#3-구성-요소)
4. [데이터 흐름](#4-데이터-흐름)
5. [API 명세](#5-api-명세)
6. [기존 SSE 방식과의 비교](#6-기존-sse-방식과의-비교)
7. [확장 가이드](#7-확장-가이드)
8. [테스트 방법](#8-테스트-방법)

---

## 1. 개요

### 패턴: 메시지 큐 + Event Store + 실시간 전파

```
[Kafka] → [Consumer] → [Event Store] → [Broadcaster] → [SSE] → [Frontend]
                              ↓
                       [REST API로 조회 가능]
```

### 핵심 특징

| 특징 | 설명 |
|------|------|
| **이벤트 영속성** | 모든 진행률 변경이 Event Store에 저장됨 |
| **히스토리 조회** | 작업의 전체 이벤트 히스토리를 조회할 수 있음 |
| **상태 복구** | 연결 끊김 후 재접속 시 현재 상태 자동 복구 |
| **확장성** | Redis/DB 기반 구현으로 다중 서버 지원 가능 |

---

## 2. 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Event Sourcing 아키텍처                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────────┐     ┌───────────────────────┐   │
│  │  Kafka   │────▶│ ConsumerV2   │────▶│ ProgressEventService  │   │
│  │ Producer │     │              │     │                       │   │
│  └──────────┘     └──────────────┘     └───────────┬───────────┘   │
│                                                    │               │
│                          ┌─────────────────────────┼───────────┐   │
│                          │                         │           │   │
│                          ▼                         ▼           │   │
│                   ┌─────────────┐          ┌─────────────┐     │   │
│                   │ EventStore  │          │ Broadcaster │     │   │
│                   │ (InMemory)  │          │ (InMemory)  │     │   │
│                   └──────┬──────┘          └──────┬──────┘     │   │
│                          │                        │            │   │
│                          │                        ▼            │   │
│                          │                 ┌─────────────┐     │   │
│                          │                 │ SSEManager  │     │   │
│                          │                 └──────┬──────┘     │   │
│                          │                        │            │   │
│                          ▼                        ▼            │   │
│                   ┌─────────────┐          ┌─────────────┐     │   │
│                   │  REST API   │          │     SSE     │     │   │
│                   │ (히스토리)   │          │ (실시간)    │     │   │
│                   └─────────────┘          └─────────────┘     │   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 계층 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                         │
│  ProgressEventController (REST + SSE endpoints)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ProgressEventService (이벤트 발행/조회 통합 서비스)              │
│  ProgressSSEManager (SSE 연결 관리)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│  EventStore (InMemoryEventStore)                                │
│  EventBroadcaster (InMemoryEventBroadcaster)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 구성 요소

### 3.1 ProgressEvent (이벤트 객체)

```java
public record ProgressEvent(
    String eventId,         // 이벤트 고유 ID
    String taskId,          // 작업 ID
    String userId,          // 사용자 ID
    int currentStep,        // 현재 단계
    int totalSteps,         // 전체 단계
    int percentage,         // 진행률 (%)
    String stepName,        // 단계 이름
    EventType eventType,    // STARTED, PROGRESS, COMPLETED, FAILED
    Instant timestamp       // 발생 시간
) { }
```

**특징:**
- 불변(Immutable) 객체
- 모든 상태 변경은 새 이벤트로 기록
- 이벤트 리플레이로 상태 복구 가능

### 3.2 EventStore (이벤트 저장소)

**인터페이스:**
```java
public interface EventStore {
    void append(ProgressEvent event);                    // 저장
    List<ProgressEvent> getEventsByTaskId(String id);   // 조회
    Optional<ProgressSnapshot> getSnapshot(String id);  // 현재 상태
    void cleanup(long ttlMillis);                       // 정리
}
```

**구현체:**
- `InMemoryEventStore`: 학습/테스트용 (현재)
- `RedisEventStore`: 프로덕션용 (확장 시)
- `JpaEventStore`: 영구 저장 필요 시

### 3.3 EventBroadcaster (이벤트 전파)

**인터페이스:**
```java
public interface EventBroadcaster {
    void publish(ProgressEvent event);                           // 발행
    String subscribe(String userId, Consumer<ProgressEvent> l);  // 구독
    void unsubscribe(String subscriptionId);                     // 구독 취소
}
```

**구현체:**
- `InMemoryEventBroadcaster`: 단일 서버용 (현재)
- `RedisEventBroadcaster`: 다중 서버용 (Redis Pub/Sub)

### 3.4 ProgressEventService (통합 서비스)

```
[Consumer] ──▶ ProgressEventService ──┬──▶ EventStore (저장)
                                      │
                                      └──▶ Broadcaster (전파)
```

**책임:**
- 이벤트 발행 (저장 + 전파)
- 이벤트 조회 (히스토리, 스냅샷)
- 구독 관리

### 3.5 ProgressSSEManager (SSE 관리)

```
[Controller] ──▶ SSEManager ──┬──▶ SseEmitter 생성
                              │
                              ├──▶ Broadcaster 구독
                              │
                              └──▶ 이벤트 → SSE 변환 및 전송
```

**책임:**
- SseEmitter 생명주기 관리
- Broadcaster와 SSE 연결
- 재접속 시 현재 상태 전송

---

## 4. 데이터 흐름

### 4.1 주문 생성 → 진행률 전송 흐름

```
1. [Client] POST /api/v2/progress/orders
      │
      ▼
2. [Controller] Kafka로 메시지 발행 (topic: order-events-v2)
      │
      ▼
3. [Kafka] 메시지 저장 및 전달
      │
      ▼
4. [OrderConsumerV2] 메시지 수신
      │
      ├── Step 1: publishProgress(1/4, "주문 검증")
      ├── Step 2: publishProgress(2/4, "재고 확인")
      ├── Step 3: publishProgress(3/4, "결제 처리")
      └── Step 4: publishCompleted()
      │
      ▼
5. [ProgressEventService]
      │
      ├──▶ [EventStore] 이벤트 저장 (영속성)
      │
      └──▶ [Broadcaster] 이벤트 전파
                │
                ▼
6. [SSEManager] 이벤트 수신
      │
      ▼
7. [SseEmitter] SSE 형식으로 변환하여 전송
      │
      ▼
8. [Client] 진행률 수신 (25% → 50% → 75% → 100%)
```

### 4.2 재접속 시 상태 복구 흐름

```
1. [Client] 연결 끊김 (네트워크 오류 등)
      │
      ▼
2. [Client] SSE 재연결 시도
      │
      ▼
3. [SSEManager] createConnection() 호출
      │
      ├── Broadcaster 구독 등록
      │
      └── sendCurrentState() 호출
                │
                ▼
4. [EventStore] 현재 스냅샷 조회
      │
      ▼
5. [Client] "recovery" 이벤트로 현재 상태 수신
      │
      ▼
6. [Client] UI 복구 (예: 75%에서 재개)
```

---

## 5. API 명세

### 5.1 SSE 구독

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v2/progress/subscribe?userId={userId}` | 전체 작업 구독 |
| GET | `/api/v2/progress/subscribe/{taskId}?userId={userId}` | 특정 작업 구독 |

**SSE 이벤트 형식:**
```
event:progress
data:{"eventId":"abc","taskId":"task-1","percentage":50,"stepName":"재고 확인",...}

event:recovery
data:{"eventId":"xyz","taskId":"task-1","percentage":75,"stepName":"결제 처리",...}
```

### 5.2 REST API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v2/progress/status/{taskId}` | 작업 현재 상태 (스냅샷) |
| GET | `/api/v2/progress/history/{taskId}` | 작업 이벤트 히스토리 |
| GET | `/api/v2/progress/user/{userId}` | 사용자의 모든 이벤트 |
| POST | `/api/v2/progress/orders` | 주문 생성 (V2) |
| GET | `/api/v2/progress/monitor` | 시스템 상태 |

### 5.3 응답 예시

**스냅샷 조회 (`/status/{taskId}`):**
```json
{
  "taskId": "abc-123",
  "userId": "user1",
  "currentStep": 3,
  "totalSteps": 4,
  "percentage": 75,
  "stepName": "결제 처리",
  "status": "PROGRESS",
  "startedAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:05Z",
  "eventCount": 4
}
```

**히스토리 조회 (`/history/{taskId}`):**
```json
[
  {"eventId":"e1","eventType":"STARTED","percentage":0,"timestamp":"..."},
  {"eventId":"e2","eventType":"PROGRESS","percentage":25,"stepName":"주문 검증","timestamp":"..."},
  {"eventId":"e3","eventType":"PROGRESS","percentage":50,"stepName":"재고 확인","timestamp":"..."},
  {"eventId":"e4","eventType":"PROGRESS","percentage":75,"stepName":"결제 처리","timestamp":"..."},
  {"eventId":"e5","eventType":"COMPLETED","percentage":100,"timestamp":"..."}
]
```

---

## 6. 기존 SSE 방식과의 비교

### 기존 방식 (V1)

```
[Kafka] → [Consumer] → [TaskProgressService] → [SSE] → [Client]
                              │
                              └── Map<userId, SseEmitter>
```

**특징:**
- 단순한 구조
- 이벤트 저장 없음
- 연결 끊기면 상태 소실

### Event Sourcing 방식 (V2)

```
[Kafka] → [Consumer] → [ProgressEventService] → [EventStore] + [Broadcaster]
                                                      │              │
                                                      ▼              ▼
                                                 [REST API]      [SSE]
```

**특징:**
- 이벤트 영속성
- 히스토리 조회 가능
- 상태 복구 가능
- 다중 서버 확장 가능

### 비교표

| 항목 | V1 (기존) | V2 (Event Sourcing) |
|------|----------|-------------------|
| 구조 복잡도 | 낮음 | 중간 |
| 이벤트 저장 | ❌ | ✅ |
| 히스토리 조회 | ❌ | ✅ |
| 상태 복구 | ❌ | ✅ |
| 다중 서버 | ❌ | ✅ (확장 필요) |
| 적합한 상황 | 단순한 진행률 | 감사 로그, MSA |

---

## 7. 확장 가이드

### 7.1 Redis 기반 구현 (프로덕션)

**RedisEventStore:**
```java
@Component
@ConditionalOnProperty(name = "spring.redis.enabled", havingValue = "true")
public class RedisEventStore implements EventStore {
    private final RedisTemplate<String, ProgressEvent> redisTemplate;

    @Override
    public void append(ProgressEvent event) {
        String key = "events:" + event.taskId();
        redisTemplate.opsForList().rightPush(key, event);
        redisTemplate.expire(key, Duration.ofHours(1));
    }
}
```

**RedisEventBroadcaster (Pub/Sub):**
```java
@Component
@ConditionalOnProperty(name = "spring.redis.enabled", havingValue = "true")
public class RedisEventBroadcaster implements EventBroadcaster {
    private final RedisTemplate<String, ProgressEvent> redisTemplate;

    @Override
    public void publish(ProgressEvent event) {
        redisTemplate.convertAndSend("progress:" + event.userId(), event);
    }
}
```

### 7.2 JPA 기반 구현 (영구 저장)

```java
@Entity
@Table(name = "progress_events")
public class ProgressEventEntity {
    @Id
    private String eventId;
    private String taskId;
    private String userId;
    private int currentStep;
    private int totalSteps;
    private String stepName;
    private String eventType;
    private Instant timestamp;
}
```

### 7.3 다중 서버 아키텍처

```
┌─────────────┐     ┌─────────────┐
│  Server A   │     │  Server B   │
│ (Consumer)  │     │ (Consumer)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│           Redis                 │
│  ┌─────────────────────────┐   │
│  │ EventStore (List/Hash)  │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Pub/Sub (Broadcaster)   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
       │                   │
       ▼                   ▼
┌──────────────┐     ┌──────────────┐
│  SSE Client  │     │  SSE Client  │
│  (Server A)  │     │  (Server B)  │
└──────────────┘     └──────────────┘
```

---

## 8. 테스트 방법

### 8.1 curl 테스트

```bash
# 1. SSE 연결 (터미널 1)
curl -N "http://localhost:8082/api/v2/progress/subscribe?userId=user123"

# 2. 주문 생성 (터미널 2)
curl -X POST "http://localhost:8082/api/v2/progress/orders?userId=user123&productName=노트북&quantity=1"

# 3. 상태 조회
curl "http://localhost:8082/api/v2/progress/status/{taskId}"

# 4. 히스토리 조회
curl "http://localhost:8082/api/v2/progress/history/{taskId}"
```

### 8.2 JavaScript 테스트

```html
<!DOCTYPE html>
<html>
<head>
    <title>Event Sourcing Progress Test</title>
</head>
<body>
    <h1>주문 진행률 (Event Sourcing)</h1>
    <div id="status">대기 중</div>
    <progress id="progressBar" value="0" max="100"></progress>
    <div id="history"></div>
    <button onclick="createOrder()">주문하기</button>
    <button onclick="loadHistory()">히스토리 조회</button>

    <script>
        const userId = 'user' + Math.random().toString(36).substr(2, 9);
        let currentTaskId = null;

        // SSE 연결
        const eventSource = new EventSource(`/api/v2/progress/subscribe?userId=${userId}`);

        eventSource.addEventListener('progress', (event) => {
            const data = JSON.parse(event.data);
            currentTaskId = data.taskId;
            document.getElementById('status').textContent =
                `${data.stepName}: ${data.percentage}%`;
            document.getElementById('progressBar').value = data.percentage;
        });

        eventSource.addEventListener('recovery', (event) => {
            const data = JSON.parse(event.data);
            console.log('상태 복구:', data);
            document.getElementById('status').textContent =
                `[복구] ${data.stepName}: ${data.percentage}%`;
            document.getElementById('progressBar').value = data.percentage;
        });

        function createOrder() {
            fetch(`/api/v2/progress/orders?userId=${userId}&productName=노트북&quantity=1`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                console.log('주문 접수:', data);
                currentTaskId = data.taskId;
            });
        }

        function loadHistory() {
            if (!currentTaskId) {
                alert('먼저 주문을 생성하세요');
                return;
            }
            fetch(`/api/v2/progress/history/${currentTaskId}`)
            .then(res => res.json())
            .then(events => {
                const html = events.map(e =>
                    `<div>${e.eventType}: ${e.stepName} (${e.percentage}%)</div>`
                ).join('');
                document.getElementById('history').innerHTML = html;
            });
        }
    </script>
</body>
</html>
```

---

## 파일 구조

```
src/main/java/com/example/open/domain/order/kafka/eventsourcing/
├── ProgressEvent.java           # 이벤트 객체
├── ProgressSnapshot.java        # 스냅샷 (이벤트 리플레이 결과)
├── EventStore.java              # 저장소 인터페이스
├── InMemoryEventStore.java      # 인메모리 구현체
├── EventBroadcaster.java        # 전파 인터페이스
├── InMemoryEventBroadcaster.java # 인메모리 구현체
├── ProgressEventService.java    # 통합 서비스
├── ProgressSSEManager.java      # SSE 연결 관리
├── ProgressEventController.java # REST + SSE 컨트롤러
└── EventSourcingConfig.java     # 설정

src/main/java/com/example/open/domain/order/kafka/consumer/
└── OrderConsumerV2.java         # Event Sourcing 버전 Consumer
```
