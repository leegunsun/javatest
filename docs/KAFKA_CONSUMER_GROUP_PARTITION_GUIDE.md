# Kafka Consumer Group & Partition Benchmark Guide

> KRaft 기반 Kafka에서 Consumer Group과 파티션을 활용한 병렬 처리 및 장애 복구 시연

---

## 목차

1. [아키텍처 개념](#1-아키텍처-개념)
2. [KRaft 모드 설정](#2-kraft-모드-설정)
3. [Spring Boot Producer/Consumer](#3-spring-boot-producerconsumer)
4. [시뮬레이션 시나리오](#4-시뮬레이션-시나리오)
5. [실행 가이드](#5-실행-가이드)
6. [성능 비교 결과](#6-성능-비교-결과)

---

## 1. 아키텍처 개념

### 1.1 파티션 (Partition)

파티션은 토픽을 여러 조각으로 나눈 것입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    Topic: benchmark-topic                    │
├─────────────────────┬─────────────────────┬─────────────────┤
│     Partition 0     │     Partition 1     │    Partition 2  │
│  ┌───┬───┬───┬───┐  │  ┌───┬───┬───┬───┐  │  ┌───┬───┬───┐  │
│  │ 0 │ 1 │ 2 │ 3 │  │  │ 0 │ 1 │ 2 │ 3 │  │  │ 0 │ 1 │ 2 │  │
│  └───┴───┴───┴───┘  │  └───┴───┴───┴───┘  │  └───┴───┴───┘  │
│     (offset)        │     (offset)        │    (offset)     │
└─────────────────────┴─────────────────────┴─────────────────┘
```

**파티션의 이점:**
- **병렬 처리**: 파티션 수만큼 동시 처리 가능
- **순서 보장**: 같은 파티션 내에서는 순서 보장
- **확장성**: 파티션 추가로 처리량 증가

**Key 기반 파티션 분배:**
```java
// 같은 Key는 항상 같은 파티션으로
partition = hash(key) % partition_count

// 예시: 3개 파티션
"order-0" → hash → partition 0
"order-1" → hash → partition 1
"order-2" → hash → partition 2
```

### 1.2 Consumer Group

Consumer Group은 여러 Consumer가 협력하여 토픽을 처리하는 구조입니다.

```
┌──────────────────────────────────────────────────────────────┐
│                    Consumer Group: benchmark-group            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Consumer 1          Consumer 2          Consumer 3         │
│   ┌─────────┐         ┌─────────┐         ┌─────────┐        │
│   │ Thread  │         │ Thread  │         │ Thread  │        │
│   │   #1    │         │   #2    │         │   #3    │        │
│   └────┬────┘         └────┬────┘         └────┬────┘        │
│        │                   │                   │              │
│        ▼                   ▼                   ▼              │
│   Partition 0         Partition 1         Partition 2        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Consumer Group 규칙:**
1. 한 파티션은 그룹 내 하나의 Consumer만 할당
2. Consumer 수 > 파티션 수 → 일부 Consumer 유휴
3. Consumer 수 < 파티션 수 → 일부 Consumer가 여러 파티션 처리

### 1.3 리밸런싱 (Rebalancing)

Consumer 추가/제거 시 파티션을 자동으로 재분배합니다.

```
[초기 상태: Consumer 3개]
Consumer 1 → Partition 0
Consumer 2 → Partition 1
Consumer 3 → Partition 2

[Consumer 2 장애 발생]
Consumer 1 → Partition 0, Partition 1  ← 파티션 1 인수
Consumer 3 → Partition 2

[Consumer 2 복구]
Consumer 1 → Partition 0
Consumer 2 → Partition 1  ← 다시 할당
Consumer 3 → Partition 2
```

---

## 2. KRaft 모드 설정

### 2.1 KRaft vs ZooKeeper

```
┌─────────────────────────────────────────────────────────────┐
│                    기존 아키텍처 (ZooKeeper)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐        │
│   │ ZooKeeper │     │ ZooKeeper │     │ ZooKeeper │        │
│   │    #1     │────▶│    #2     │────▶│    #3     │        │
│   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘        │
│         │                 │                 │               │
│         └────────────────┼─────────────────┘               │
│                          ▼                                  │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐        │
│   │   Kafka   │     │   Kafka   │     │   Kafka   │        │
│   │  Broker   │     │  Broker   │     │  Broker   │        │
│   └───────────┘     └───────────┘     └───────────┘        │
│                                                             │
│   문제점: 별도 ZooKeeper 클러스터 필요, 복잡한 운영           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    KRaft 아키텍처 (ZooKeeper 없음)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────────────────────────────────────────┐    │
│   │              Kafka Cluster (KRaft)                 │    │
│   │                                                    │    │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐        │    │
│   │   │ Node 1  │   │ Node 2  │   │ Node 3  │        │    │
│   │   │ Broker  │──▶│ Broker  │──▶│ Broker  │        │    │
│   │   │Controller│  │Controller│  │Controller│        │    │
│   │   └─────────┘   └─────────┘   └─────────┘        │    │
│   │                                                    │    │
│   │   메타데이터: Raft 프로토콜로 내부 관리              │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│   장점: 단순화된 아키텍처, 빠른 복구, 운영 용이              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 docker-compose.yml (KRaft 모드)

```yaml
version: '3'
services:
  kafka:
    image: apache/kafka:3.7.0
    container_name: kafka-kraft
    ports:
      - "9092:9092"   # 클라이언트 연결용
      - "9093:9093"   # 컨트롤러 통신용
    environment:
      # ============================================================
      # KRaft 핵심 설정
      # ============================================================

      # 클러스터 내 고유 노드 식별자
      KAFKA_NODE_ID: 1

      # broker: 메시지 처리, controller: 클러스터 관리
      KAFKA_PROCESS_ROLES: broker,controller

      # 컨트롤러 노드 목록 (형식: {node_id}@{host}:{port})
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093

      # ============================================================
      # 리스너 설정
      # ============================================================
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT

      # ============================================================
      # 클러스터 및 토픽 설정
      # ============================================================
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_NUM_PARTITIONS: 3  # 기본 파티션 수

      # 단일 노드이므로 복제본 1개
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
```

**KRaft 핵심 설정 설명:**

| 설정 | 설명 |
|------|------|
| `KAFKA_NODE_ID` | 클러스터 내 노드 고유 ID |
| `KAFKA_PROCESS_ROLES` | `broker`: 메시지 처리, `controller`: 메타데이터 관리 |
| `KAFKA_CONTROLLER_QUORUM_VOTERS` | 컨트롤러 노드 목록 (Raft 합의) |
| `CLUSTER_ID` | 클러스터 식별자 (Base64) |

---

## 3. Spring Boot Producer/Consumer

### 3.1 프로젝트 구조

```
src/main/java/com/example/open/domain/order/kafka/
├── config/
│   └── KafkaBenchmarkConfig.java    # 토픽 및 Consumer 설정
├── producer/
│   ├── OrderProducer.java           # 기본 Producer
│   └── BenchmarkProducer.java       # 벤치마크용 Producer
├── consumer/
│   ├── OrderConsumer.java           # 기본 Consumer
│   └── BenchmarkConsumer.java       # 벤치마크용 Consumer
└── controller/
    ├── OrderController.java         # 기본 API
    └── BenchmarkController.java     # 벤치마크 API
```

### 3.2 토픽 설정 (KafkaBenchmarkConfig.java)

```java
@Configuration
public class KafkaBenchmarkConfig {

    /**
     * 3개 파티션을 가진 벤치마크 토픽 생성
     *
     * 파티션 수 = 최대 병렬 Consumer 수
     */
    @Bean
    public NewTopic benchmarkTopic() {
        return TopicBuilder.name("benchmark-topic")
                .partitions(3)    // 3개 파티션
                .replicas(1)      // 단일 노드
                .build();
    }

    /**
     * Consumer Factory 설정
     *
     * - 수동 커밋: 정확한 처리 완료 시점 제어
     * - session.timeout: 10초 (Consumer 장애 감지)
     * - heartbeat.interval: 3초 (생존 신호)
     */
    @Bean
    public ConsumerFactory<String, String> benchmarkConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "benchmark-group");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3000);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * 3개 Consumer 스레드 설정
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> benchmarkListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(benchmarkConsumerFactory());
        factory.setConcurrency(3);  // 3개 Consumer 스레드
        factory.getContainerProperties().setAckMode(AckMode.MANUAL);
        return factory;
    }
}
```

### 3.3 Producer (KafkaTemplate 활용)

```java
@Service
public class BenchmarkProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * Key 기반 파티션 분배
     *
     * 같은 Key → 같은 파티션 (순서 보장)
     * partition = hash(key) % partition_count
     */
    public BenchmarkResult publishMessages(int messageCount) {
        long startTime = System.currentTimeMillis();
        CountDownLatch latch = new CountDownLatch(messageCount);

        for (int i = 0; i < messageCount; i++) {
            String key = "order-" + (i % 3);  // 3개 키로 분배
            String value = createOrderMessage(i);

            kafkaTemplate.send("benchmark-topic", key, value)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        // 성공: 파티션 정보 기록
                        int partition = result.getRecordMetadata().partition();
                        partitionCounts.get(partition).incrementAndGet();
                    }
                    latch.countDown();
                });
        }

        latch.await(30, TimeUnit.SECONDS);
        return new BenchmarkResult(/* ... */);
    }
}
```

### 3.4 Consumer (@KafkaListener 활용)

```java
@Service
public class BenchmarkConsumer implements ConsumerSeekAware {

    /**
     * 벤치마크 Consumer
     *
     * containerFactory = "benchmarkListenerFactory" → concurrency=3
     * → 3개 Consumer 스레드가 각각 파티션 할당
     */
    @KafkaListener(
            topics = "benchmark-topic",
            groupId = "benchmark-group",
            containerFactory = "benchmarkListenerFactory"
    )
    public void consumeBenchmark(ConsumerRecord<String, String> record,
                                  Acknowledgment ack) {
        String consumerId = Thread.currentThread().getName();

        // 처리 시간 시뮬레이션 (10ms)
        Thread.sleep(10);

        // 통계 업데이트
        totalProcessed.incrementAndGet();
        partitionProcessed.get(record.partition()).incrementAndGet();
        consumerProcessed.get(consumerId).incrementAndGet();

        // 수동 커밋
        ack.acknowledge();
    }

    /**
     * 리밸런싱 이벤트 핸들러
     *
     * Consumer 추가/제거 시 호출
     */
    @Override
    public void onPartitionsAssigned(Map<TopicPartition, Long> assignments,
                                      ConsumerSeekCallback callback) {
        log.info("[REBALANCE] Partitions Assigned: {}", assignments.keySet());
    }

    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        log.info("[REBALANCE] Partitions Revoked: {}", partitions);
    }
}
```

---

## 4. 시뮬레이션 시나리오

### 4.1 시나리오 1: Consumer 1개 vs 3개 처리 속도 비교

```
┌─────────────────────────────────────────────────────────────┐
│                 Consumer 1개 (순차 처리)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Consumer 1                                                │
│   ┌─────────┐                                               │
│   │ Thread  │───▶ Partition 0                               │
│   │   #1    │───▶ Partition 1                               │
│   │         │───▶ Partition 2                               │
│   └─────────┘                                               │
│                                                             │
│   처리 방식: 파티션 0 → 파티션 1 → 파티션 2 (순차)            │
│   예상 처리 시간: 1000건 × 10ms = 10,000ms (10초)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Consumer 3개 (병렬 처리)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Consumer 1        Consumer 2        Consumer 3            │
│   ┌─────────┐       ┌─────────┐       ┌─────────┐           │
│   │ Thread  │──▶P0  │ Thread  │──▶P1  │ Thread  │──▶P2      │
│   │   #1    │       │   #2    │       │   #3    │           │
│   └─────────┘       └─────────┘       └─────────┘           │
│                                                             │
│   처리 방식: 3개 파티션 동시 처리 (병렬)                      │
│   예상 처리 시간: 333건 × 10ms = 3,333ms (3.3초)             │
│                                                             │
│   성능 향상: 약 3배 (파티션 수만큼)                           │
└─────────────────────────────────────────────────────────────┘
```

**테스트 방법:**

```bash
# 1. Consumer 3개 설정으로 테스트
# KafkaBenchmarkConfig에서 concurrency=3
curl -X POST "http://localhost:8082/api/kafka/benchmark/publish?count=1000"
curl http://localhost:8082/api/kafka/benchmark/stats

# 2. Consumer 1개 설정으로 테스트
# KafkaBenchmarkConfig에서 concurrency=1로 변경 후 재시작
curl -X POST "http://localhost:8082/api/kafka/benchmark/publish?count=1000"
curl http://localhost:8082/api/kafka/benchmark/stats
```

### 4.2 시나리오 2: Consumer 장애 시 파티션 재할당

```
┌─────────────────────────────────────────────────────────────┐
│            시간 T0: 정상 상태                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Consumer 1 ────▶ Partition 0  (처리 중)                   │
│   Consumer 2 ────▶ Partition 1  (처리 중)                   │
│   Consumer 3 ────▶ Partition 2  (처리 중)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            시간 T1: Consumer 2 장애 발생                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Consumer 1 ────▶ Partition 0  (처리 중)                   │
│   Consumer 2 ──X── Partition 1  (장애!)                     │
│   Consumer 3 ────▶ Partition 2  (처리 중)                   │
│                                                             │
│   * session.timeout (10초) 후 리밸런싱 시작                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            시간 T2: 리밸런싱 완료                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Consumer 1 ────▶ Partition 0  (처리 중)                   │
│                ────▶ Partition 1  (인수!)                   │
│   Consumer 3 ────▶ Partition 2  (처리 중)                   │
│                                                             │
│   * Consumer 1이 Partition 1 인수                           │
│   * 메시지 손실 없이 처리 계속                               │
└─────────────────────────────────────────────────────────────┘
```

**테스트 방법:**

```bash
# 1. 메시지 발행 시작
curl -X POST "http://localhost:8082/api/kafka/benchmark/publish?count=1000"

# 2. 처리 중에 Consumer 장애 시뮬레이션
curl -X POST "http://localhost:8082/api/kafka/benchmark/simulate-failure"

# 3. 로그에서 리밸런싱 확인
# [REBALANCE] Partitions Revoked: [benchmark-topic-1]
# [REBALANCE] Partitions Assigned! Consumer: ... Partition: [benchmark-topic-0, benchmark-topic-1]

# 4. 통계 확인 - 메시지 손실 없음 확인
curl http://localhost:8082/api/kafka/benchmark/stats

# 5. 장애 시뮬레이션 중지
curl -X POST "http://localhost:8082/api/kafka/benchmark/stop-failure"
```

---

## 5. 실행 가이드

### 5.1 사전 준비

```bash
# 1. Docker 실행 확인
docker --version

# 2. Kafka 컨테이너 시작
docker-compose up -d

# 3. Kafka 상태 확인
docker logs kafka-kraft

# 4. 토픽 확인 (Kafka UI)
# http://localhost:8080 접속
```

### 5.2 애플리케이션 실행

```bash
# Gradle로 실행
./gradlew bootRun

# 또는 JAR로 실행
./gradlew build
java -jar build/libs/open-0.0.1-SNAPSHOT.jar
```

### 5.3 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/kafka/benchmark/publish?count=1000` | 메시지 발행 |
| POST | `/api/kafka/benchmark/publish/round-robin?count=1000` | Round-robin 발행 |
| GET | `/api/kafka/benchmark/stats` | 처리 통계 조회 |
| POST | `/api/kafka/benchmark/simulate-failure` | 장애 시뮬레이션 |
| POST | `/api/kafka/benchmark/stop-failure` | 장애 시뮬레이션 중지 |
| POST | `/api/kafka/benchmark/reset` | 통계 초기화 |
| GET | `/api/kafka/benchmark/guide` | 가이드 조회 |

### 5.4 테스트 순서

```bash
# Step 1: 통계 초기화
curl -X POST http://localhost:8082/api/kafka/benchmark/reset

# Step 2: 1000건 메시지 발행
curl -X POST "http://localhost:8082/api/kafka/benchmark/publish?count=1000"

# Step 3: 처리 완료 대기 (약 3-4초)
sleep 5

# Step 4: 통계 확인
curl http://localhost:8082/api/kafka/benchmark/stats | jq .
```

---

## 6. 성능 비교 결과

### 6.1 예상 결과

| 구성 | Consumer 수 | 파티션 수 | 1000건 처리 시간 | 처리량 |
|------|------------|----------|-----------------|--------|
| Single | 1 | 3 | ~10,000ms | ~100 msg/sec |
| Parallel | 3 | 3 | ~3,333ms | ~300 msg/sec |

### 6.2 실제 테스트 결과 예시

**Consumer 3개 (병렬 처리):**
```json
{
  "totalProcessed": 1000,
  "durationMs": 3456,
  "throughput": "289.35 msg/sec",
  "rebalanceCount": 1,
  "byPartition": {
    "partition-0": 334,
    "partition-1": 333,
    "partition-2": 333
  },
  "byConsumer": {
    "benchmark-consumer-0-C-1": 334,
    "benchmark-consumer-1-C-1": 333,
    "benchmark-consumer-2-C-1": 333
  }
}
```

**Consumer 1개 (순차 처리):**
```json
{
  "totalProcessed": 1000,
  "durationMs": 10234,
  "throughput": "97.71 msg/sec",
  "byPartition": {
    "partition-0": 334,
    "partition-1": 333,
    "partition-2": 333
  },
  "byConsumer": {
    "benchmark-consumer-0-C-1": 1000
  }
}
```

### 6.3 결론

| 이점 | 설명 |
|------|------|
| **병렬 처리** | 파티션 수만큼 처리량 증가 (3배) |
| **장애 복구** | Consumer 장애 시 자동 파티션 재할당 |
| **순서 보장** | 같은 Key는 같은 파티션 → 순서 유지 |
| **확장성** | Consumer 추가만으로 처리량 증가 |
| **부하 분산** | 파티션별로 자동 분배 |

---

## 부록: 관련 파일

- `docker-compose.yml` - KRaft Kafka 설정
- `src/main/resources/application.yml` - Spring Boot Kafka 설정
- `KafkaBenchmarkConfig.java` - 토픽 및 Consumer 설정
- `BenchmarkProducer.java` - 벤치마크 Producer
- `BenchmarkConsumer.java` - 벤치마크 Consumer
- `BenchmarkController.java` - REST API

---

*Last Updated: 2025-12-01*
