package com.example.open.domain.order.kafka.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.listener.ConsumerSeekAware;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ============================================================
 * Benchmark Consumer
 * ============================================================
 *
 * Consumer Group과 파티션의 이점을 시연하기 위한 Consumer
 *
 * 핵심 개념 시연:
 *
 * 1. 병렬 처리 (Parallel Processing)
 *    - 3개 파티션 + 3개 Consumer = 3배 처리량
 *    - 각 Consumer는 할당된 파티션만 처리
 *
 * 2. 파티션 재할당 (Rebalancing)
 *    - Consumer 추가/제거 시 자동으로 파티션 재분배
 *    - ConsumerSeekAware로 재할당 이벤트 감지
 *
 * 3. 장애 복구 (Fault Tolerance)
 *    - Consumer 장애 시 다른 Consumer가 파티션 인수
 *    - 메시지 손실 없이 처리 계속
 */
@Service
public class BenchmarkConsumer implements ConsumerSeekAware {
    private static final Logger log = LoggerFactory.getLogger(BenchmarkConsumer.class);

    // ============================================================
    // 처리 통계
    // ============================================================
    private final AtomicInteger totalProcessed = new AtomicInteger(0);
    private final Map<Integer, AtomicInteger> partitionProcessed = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> consumerProcessed = new ConcurrentHashMap<>();
    private final AtomicLong processingStartTime = new AtomicLong(0);
    private final AtomicLong lastProcessedTime = new AtomicLong(0);

    // Consumer 중단 시뮬레이션 플래그
    private final AtomicBoolean simulateFailure = new AtomicBoolean(false);
    private volatile String failingConsumerId = null;

    // 리밸런싱 이벤트 카운터
    private final AtomicInteger rebalanceCount = new AtomicInteger(0);

    /**
     * ============================================================
     * 메인 Benchmark Consumer (3개 스레드)
     * ============================================================
     *
     * containerFactory = "benchmarkListenerFactory"
     * - KafkaBenchmarkConfig에서 concurrency=3으로 설정
     * - 3개의 Consumer 스레드가 각각 파티션 할당받음
     *
     * 처리 흐름:
     * 1. 메시지 수신
     * 2. 처리 시간 시뮬레이션 (10ms)
     * 3. 통계 업데이트
     * 4. 수동 커밋 (Acknowledgment)
     */
    @KafkaListener(
            topics = "benchmark-topic",
            groupId = "benchmark-group",
            containerFactory = "benchmarkListenerFactory"
    )
    public void consumeBenchmark(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String consumerId = Thread.currentThread().getName();

        System.out.println(
            "[benchmark 스레드: " + consumerId + "] "
        );

        // 장애 시뮬레이션: 특정 Consumer 중단
        if (simulateFailure.get() && consumerId.equals(failingConsumerId)) {
            log.warn("========================================");
            log.warn("[FAILURE SIMULATION] Consumer {} is DOWN!", consumerId);
            log.warn("  Partition {} will be reassigned", record.partition());
            log.warn("========================================");

            // 장애 시뮬레이션: 메시지 처리하지 않고 지연
            try {
                Thread.sleep(15000); // 15초 대기 (session.timeout 초과)
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return;
        }

        // 처리 시작 시간 기록 (첫 메시지)
        processingStartTime.compareAndSet(0, System.currentTimeMillis());

        // 처리 시간 시뮬레이션 (실제 비즈니스 로직 대신)
        simulateProcessing(10);

        // 통계 업데이트
        updateStats(record.partition(), consumerId);

        // 로깅 (100건마다)
        int processed = totalProcessed.get();
        if (processed % 100 == 0) {
            logProgress(record, consumerId, processed);
        }

        // 마지막 처리 시간 업데이트
        lastProcessedTime.set(System.currentTimeMillis());

        // 수동 커밋 - 처리 완료 확인
        ack.acknowledge();
    }

    /**
     * ============================================================
     * 파티션 할당 이벤트 핸들러
     * ============================================================
     *
     * Consumer Group 리밸런싱 발생 시 호출
     * - 새 Consumer 참여
     * - 기존 Consumer 이탈
     * - 파티션 수 변경
     */
    @Override
    public void onPartitionsAssigned(Map<TopicPartition, Long> assignments, ConsumerSeekCallback callback) {
        rebalanceCount.incrementAndGet();

        log.info("========================================");
        log.info("[REBALANCE] Partitions Assigned!");
        log.info("========================================");
        log.info("Consumer: {}", Thread.currentThread().getName());
        log.info("Rebalance Count: {}", rebalanceCount.get());
        log.info("Assigned Partitions:");
        assignments.forEach((tp, offset) ->
                log.info("  {} - offset: {}", tp, offset));
        log.info("========================================");
    }

    /**
     * ============================================================
     * 파티션 해제 이벤트 핸들러
     * ============================================================
     *
     * 리밸런싱으로 파티션이 다른 Consumer에게 넘어갈 때 호출
     */
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        log.info("========================================");
        log.info("[REBALANCE] Partitions Revoked!");
        log.info("========================================");
        log.info("Consumer: {}", Thread.currentThread().getName());
        log.info("Revoked Partitions: {}", partitions);
        log.info("========================================");
    }

    // ============================================================
    // 시뮬레이션 제어 메서드
    // ============================================================

    /**
     * Consumer 장애 시뮬레이션 시작
     *
     * @param consumerId 중단할 Consumer 스레드 이름
     */
    public void startFailureSimulation(String consumerId) {
        this.failingConsumerId = consumerId;
        this.simulateFailure.set(true);
        log.info("[SIMULATION] Failure simulation started for: {}", consumerId);
    }

    /**
     * Consumer 장애 시뮬레이션 종료
     */
    public void stopFailureSimulation() {
        this.simulateFailure.set(false);
        this.failingConsumerId = null;
        log.info("[SIMULATION] Failure simulation stopped");
    }

    /**
     * 통계 초기화
     */
    public void resetStats() {
        totalProcessed.set(0);
        partitionProcessed.clear();
        consumerProcessed.clear();
        processingStartTime.set(0);
        lastProcessedTime.set(0);
        rebalanceCount.set(0);
        log.info("[STATS] Statistics reset");
    }

    /**
     * 현재 통계 조회
     */
    public BenchmarkStats getStats() {
        long startTime = processingStartTime.get();
        long endTime = lastProcessedTime.get();
        long duration = (startTime > 0 && endTime > 0) ? endTime - startTime : 0;

        return new BenchmarkStats(
                totalProcessed.get(),
                duration,
                new ConcurrentHashMap<>(partitionProcessed),
                new ConcurrentHashMap<>(consumerProcessed),
                rebalanceCount.get()
        );
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    /**
     * 처리 시간 시뮬레이션
     */
    private void simulateProcessing(int delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 통계 업데이트
     */
    private void updateStats(int partition, String consumerId) {
        totalProcessed.incrementAndGet();
        partitionProcessed.computeIfAbsent(partition, k -> new AtomicInteger(0)).incrementAndGet();
        consumerProcessed.computeIfAbsent(consumerId, k -> new AtomicInteger(0)).incrementAndGet();
    }

    /**
     * 진행 상황 로깅
     */
    private void logProgress(ConsumerRecord<String, String> record, String consumerId, int processed) {
        log.info("[Benchmark] Processed: {} | Partition: {} | Consumer: {}",
                processed, record.partition(), consumerId);
    }

    /**
     * ============================================================
     * 벤치마크 통계 Record
     * ============================================================
     */
    public record BenchmarkStats(
            int totalProcessed,
            long durationMs,
            Map<Integer, AtomicInteger> partitionStats,
            Map<String, AtomicInteger> consumerStats,
            int rebalanceCount
    ) {
        public double throughput() {
            return durationMs > 0 ? totalProcessed * 1000.0 / durationMs : 0;
        }

        public void printReport() {
            System.out.println("========================================");
            System.out.println("[Benchmark] CONSUMER STATISTICS");
            System.out.println("========================================");
            System.out.println("Total Processed: " + totalProcessed);
            System.out.println("Duration: " + durationMs + " ms");
            System.out.printf("Throughput: %.2f msg/sec%n", throughput());
            System.out.println("Rebalance Events: " + rebalanceCount);
            System.out.println("----------------------------------------");
            System.out.println("By Partition:");
            partitionStats.forEach((partition, count) ->
                    System.out.println("  Partition " + partition + ": " + count.get() + " messages"));
            System.out.println("----------------------------------------");
            System.out.println("By Consumer:");
            consumerStats.forEach((consumer, count) ->
                    System.out.println("  " + consumer + ": " + count.get() + " messages"));
            System.out.println("========================================");
        }
    }
}
