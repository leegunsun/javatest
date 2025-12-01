package com.example.open.domain.order.kafka.producer;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ============================================================
 * Benchmark Producer
 * ============================================================
 *
 * Consumer Group과 파티션의 이점을 시연하기 위한 Producer
 *
 * 주요 기능:
 * 1. 대량 메시지 발행 (1000건)
 * 2. 파티션별 메시지 분배 확인
 * 3. 발행 성능 측정
 *
 * Key 전략에 따른 파티션 분배:
 * - Key 없음: Round-robin 방식으로 고르게 분배
 * - Key 있음: 같은 Key는 항상 같은 파티션으로 (순서 보장)
 */
@Service
public class BenchmarkProducer {
    private static final Logger log = LoggerFactory.getLogger(BenchmarkProducer.class);
    private static final String BENCHMARK_TOPIC = "benchmark-topic";

    private final KafkaTemplate<String, String> kafkaTemplate;

    // 발행 통계
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger failCount = new AtomicInteger(0);
    private final Map<Integer, AtomicInteger> partitionCounts = new ConcurrentHashMap<>();

    public BenchmarkProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * ============================================================
     * 대량 메시지 발행 (성능 벤치마크용)
     * ============================================================
     *
     * @param messageCount 발행할 메시지 수 (예: 1000)
     * @return 발행 결과 통계
     *
     * 파티션 분배 방식:
     * - Key를 사용하여 특정 파티션에 메시지 라우팅
     * - Key의 해시값으로 파티션 결정: hash(key) % partition_count
     */
    public BenchmarkResult publishMessages(int messageCount) {
        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 1] 로깅 - 시작 알림
        // ═══════════════════════════════════════════════════════════════
        log.info("========================================");
        log.info("[Benchmark] Starting to publish {} messages", messageCount);
        log.info("========================================");

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 2] 통계 초기화
        // ═══════════════════════════════════════════════════════════════
        // 이전 테스트 결과가 남아있으면 안 되므로 모두 0으로 초기화
        // - successCount = 0 (성공 카운터)
        // - failCount = 0 (실패 카운터)
        // - partitionCounts = {} (파티션별 카운터 비움)
        resetStats();

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 3] 시작 시간 기록
        // ═══════════════════════════════════════════════════════════════
        // System.currentTimeMillis(): 1970년 1월 1일부터 현재까지의 밀리초
        // 예: 1701388800000 (2023년 12월 1일 기준)
        // 나중에 종료 시간과 비교하여 소요 시간 계산
        long startTime = System.currentTimeMillis();

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 4] CountDownLatch 생성 (동기화 도구)
        // ═══════════════════════════════════════════════════════════════
        // CountDownLatch란?
        //   - "N개의 작업이 완료될 때까지 기다리겠다"는 약속
        //   - 비유: 놀이공원 롤러코스터 - "10명 다 타면 출발"
        //
        // 동작 원리:
        //   - new CountDownLatch(1000): 내부 카운터를 1000으로 설정
        //   - countDown(): 카운터를 1 감소 (999, 998, 997...)
        //   - await(): 카운터가 0이 될 때까지 현재 스레드를 대기시킴
        //
        // 왜 필요한가?
        //   - 비동기 전송이므로 for문이 끝나도 전송이 안 끝났을 수 있음
        //   - 모든 전송 완료를 확인한 후에 결과를 반환해야 함
        CountDownLatch latch = new CountDownLatch(messageCount);

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 5] 메시지 발행 루프 (핵심!)
        // ═══════════════════════════════════════════════════════════════
        for (int i = 0; i < messageCount; i++) {
            // [5-1] 메시지 키 생성
            // i % 3: 나머지 연산으로 0, 1, 2가 순환됨
            //   - i=0: 0 % 3 = 0 → "order-0"
            //   - i=1: 1 % 3 = 1 → "order-1"
            //   - i=2: 2 % 3 = 2 → "order-2"
            //   - i=3: 3 % 3 = 0 → "order-0" (다시 순환)
            //
            // 왜 3개인가?
            //   - Kafka 토픽의 파티션 수가 3개이므로 균등 분배를 위해
            //   - 같은 키는 항상 같은 파티션으로 감 (순서 보장)
            String messageKey = "order-" + (i % 3);

            // [5-2] 메시지 값(본문) 생성
            // JSON 형태의 주문 데이터:
            // {"orderId":"ORD-000042","timestamp":1701388800000,"amount":523.45}
            String messageValue = createOrderMessage(i);

            // [5-3] 비동기로 Kafka에 메시지 전송
            // 주의: 이 메서드는 즉시 반환됨! (전송 완료를 기다리지 않음)
            // 실제 전송 완료는 콜백에서 처리됨
            publishWithCallback(messageKey, messageValue, latch);
        }
        // for문이 끝났다고 전송이 끝난 게 아님!
        // 1000개의 전송 "요청"만 한 상태

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 6] 모든 전송 완료 대기
        // ═══════════════════════════════════════════════════════════════
        // latch.await(): 카운터가 0이 될 때까지 여기서 대기
        //
        // 백그라운드에서 일어나는 일:
        //   1. Kafka가 메시지를 전송
        //   2. 전송 완료되면 콜백(whenComplete) 실행
        //   3. 콜백에서 latch.countDown() 호출
        //   4. 카운터가 0이 되면 await() 통과
        //
        // TimeUnit.SECONDS: 시간 단위를 초로 지정
        // 30초 내에 완료되지 않으면 false 반환 (타임아웃)
        try {
            boolean completed = latch.await(30, TimeUnit.SECONDS);
            if (!completed) {
                log.warn("[Benchmark] Timeout waiting for all messages to be sent");
            }
        } catch (InterruptedException e) {
            // 다른 스레드가 이 스레드를 중단시킨 경우
            Thread.currentThread().interrupt();  // 인터럽트 상태 복원
            log.error("[Benchmark] Interrupted while waiting for messages", e);
        }

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 7] 종료 시간 기록 및 소요 시간 계산
        // ═══════════════════════════════════════════════════════════════
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;  // 예: 1701388800523 - 1701388800000 = 523ms

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 8] 결과 객체 생성
        // ═══════════════════════════════════════════════════════════════
        // BenchmarkResult: Java record 타입 (불변 데이터 객체)
        //
        // 각 필드 설명:
        //   - messageCount: 요청한 메시지 수 (1000)
        //   - successCount.get(): 성공한 메시지 수 (AtomicInteger → int 변환)
        //   - failCount.get(): 실패한 메시지 수
        //   - duration: 소요 시간 (ms)
        //   - partitionCounts: 파티션별 전송 수
        //
        // ConcurrentHashMap 복사:
        //   - 원본 수정이 결과에 영향 주지 않도록 복사본 생성
        BenchmarkResult result = new BenchmarkResult(
                messageCount,
                successCount.get(),
                failCount.get(),
                duration,
                new ConcurrentHashMap<>(partitionCounts)
        );

        // ═══════════════════════════════════════════════════════════════
        // [Producer 실행순서 9] 결과 로깅 및 반환
        // ═══════════════════════════════════════════════════════════════
        printResult(result);
        return result;  // Controller로 결과 반환
    }

    /**
     * ============================================================
     * Round-Robin 방식 발행 (Key 없음)
     * ============================================================
     *
     * Key 없이 발행하면 Kafka가 자동으로 파티션에 분배
     * Sticky Partitioner가 기본값: 배치 단위로 같은 파티션에 전송
     */
    public BenchmarkResult publishMessagesRoundRobin(int messageCount) {
        log.info("========================================");
        log.info("[Benchmark] Publishing {} messages (Round-Robin)", messageCount);
        log.info("========================================");

        resetStats();
        long startTime = System.currentTimeMillis();
        CountDownLatch latch = new CountDownLatch(messageCount);

        for (int i = 0; i < messageCount; i++) {
            String messageValue = createOrderMessage(i);
            // Key 없이 발행 → Round-robin 방식
            publishWithCallback(null, messageValue, latch);
        }

        try {
            latch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        long duration = System.currentTimeMillis() - startTime;

        BenchmarkResult result = new BenchmarkResult(
                messageCount, successCount.get(), failCount.get(),
                duration, new ConcurrentHashMap<>(partitionCounts)
        );

        printResult(result);
        return result;
    }

    /**
     * ============================================================
     * 특정 파티션에 직접 발행
     * ============================================================
     *
     * 테스트 목적으로 특정 파티션에 직접 메시지 전송
     */
    public void publishToPartition(int partition, String message) {
        ProducerRecord<String, String> record =
                new ProducerRecord<>(BENCHMARK_TOPIC, partition, null, message);

        kafkaTemplate.send(record)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("[Benchmark] Message sent to partition {}: {}",
                                partition, message);
                    } else {
                        log.error("[Benchmark] Failed to send to partition {}", partition, ex);
                    }
                });
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 콜백을 통한 비동기 발행 및 통계 수집
     * ═══════════════════════════════════════════════════════════════
     *
     * 이 메서드가 비동기 전송의 핵심!
     *
     * @param key   메시지 키 (파티션 결정에 사용, 예: "order-0")
     * @param value 메시지 본문 (JSON 형태의 주문 데이터)
     * @param latch 모든 전송 완료를 추적하는 카운터
     */
    private void publishWithCallback(String key, String value, CountDownLatch latch) {
        // ═══════════════════════════════════════════════════════════════
        // [콜백 실행순서 1] Kafka로 메시지 전송 요청
        // ═══════════════════════════════════════════════════════════════
        // kafkaTemplate.send(): Spring Kafka가 제공하는 메시지 전송 메서드
        //
        // 매개변수:
        //   - BENCHMARK_TOPIC: 토픽 이름 ("benchmark-topic")
        //   - key: 메시지 키 → 파티션 결정에 사용
        //   - value: 메시지 본문
        //
        // 반환값: CompletableFuture<SendResult>
        //   - CompletableFuture: "나중에 결과가 올 것"을 약속하는 객체
        //   - 비유: 배달 앱 주문 → 주문번호 받고 배달은 나중에
        //   - 이 시점에서는 전송이 완료된 게 아님!
        CompletableFuture<SendResult<String, String>> future =
                kafkaTemplate.send(BENCHMARK_TOPIC, key, value);

        // ═══════════════════════════════════════════════════════════════
        // [콜백 실행순서 2] 전송 완료/실패 시 실행할 콜백 등록
        // ═══════════════════════════════════════════════════════════════
        // whenComplete(): "전송이 끝나면 이 코드를 실행해줘"
        //
        // 람다 매개변수:
        //   - result: 전송 성공 시 결과 정보 (SendResult)
        //   - ex: 전송 실패 시 예외 정보 (Exception)
        //   - 둘 중 하나만 값이 있음 (성공이면 ex=null, 실패면 result=null)
        //
        // 중요: 이 콜백은 "지금" 실행되는 게 아니라 "나중에" 전송이 끝나면 실행됨!
        future.whenComplete((result, ex) -> {
            // ═══════════════════════════════════════════════════════════
            // [콜백 내부] 전송 완료 후 실행되는 코드
            // ═══════════════════════════════════════════════════════════
            try {
                if (ex == null) {
                    // ───────────────────────────────────────────────────
                    // 전송 성공
                    // ───────────────────────────────────────────────────
                    // incrementAndGet(): 현재 값을 1 증가시키고 증가된 값 반환
                    // 왜 AtomicInteger인가?
                    //   - 여러 콜백이 동시에 실행될 수 있음 (멀티스레드)
                    //   - 일반 int++는 동시 접근 시 값이 손실될 수 있음
                    successCount.incrementAndGet();

                    // getRecordMetadata(): 전송된 메시지의 메타데이터
                    //   - partition(): 어느 파티션에 저장되었는지
                    //   - offset(): 파티션 내 위치
                    int partition = result.getRecordMetadata().partition();

                    // computeIfAbsent(): "없으면 생성하고, 있으면 그대로 사용"
                    //   - partition 키가 없으면 새 AtomicInteger(0) 생성
                    //   - 있으면 기존 AtomicInteger 반환
                    // .incrementAndGet(): 해당 파티션 카운터 1 증가
                    partitionCounts.computeIfAbsent(partition, k -> new AtomicInteger(0))
                            .incrementAndGet();
                } else {
                    // ───────────────────────────────────────────────────
                    // 전송 실패
                    // ───────────────────────────────────────────────────
                    failCount.incrementAndGet();
                    log.error("[Benchmark] Send failed: {}", ex.getMessage());
                }
            } finally {
                // ───────────────────────────────────────────────────────
                // 성공/실패 상관없이 항상 실행
                // ───────────────────────────────────────────────────────
                // countDown(): Latch 카운터를 1 감소
                // 모든 메시지가 countDown()을 호출하면 await()가 통과됨
                //
                // finally 블록에 있는 이유:
                //   - 성공하든 실패하든 카운터는 감소해야 함
                //   - 안 그러면 await()가 영원히 대기하게 됨
                latch.countDown();
            }
        });
        // 이 메서드는 여기서 즉시 반환됨!
        // 콜백은 나중에 다른 스레드에서 실행됨
    }

    /**
     * 주문 메시지 생성
     */
    private String createOrderMessage(int index) {
        return String.format(
                "{\"orderId\":\"ORD-%06d\",\"timestamp\":%d,\"amount\":%.2f}",
                index,
                System.currentTimeMillis(),
                Math.random() * 1000
        );
    }

    /**
     * 통계 초기화
     */
    private void resetStats() {
        successCount.set(0);
        failCount.set(0);
        partitionCounts.clear();
    }

    /**
     * 결과 출력
     */
    private void printResult(BenchmarkResult result) {
        log.info("========================================");
        log.info("[Benchmark] PUBLISH RESULTS");
        log.info("========================================");
        log.info("Total Messages: {}", result.totalMessages());
        log.info("Success: {} | Failed: {}", result.successCount(), result.failCount());
        log.info("Duration: {} ms", result.durationMs());
        log.info("Throughput: {:.2f} msg/sec",
                result.totalMessages() * 1000.0 / result.durationMs());
        log.info("----------------------------------------");
        log.info("Partition Distribution:");
        result.partitionCounts().forEach((partition, count) ->
                log.info("  Partition {}: {} messages", partition, count.get()));
        log.info("========================================");
    }

    /**
     * ============================================================
     * 벤치마크 결과 Record
     * ============================================================
     */
    public record BenchmarkResult(
            int totalMessages,
            int successCount,
            int failCount,
            long durationMs,
            Map<Integer, AtomicInteger> partitionCounts
    ) {
        public double throughput() {
            return totalMessages * 1000.0 / durationMs;
        }
    }
}
