package com.example.open.domain.order.kafka.controller;

import com.example.open.domain.order.kafka.consumer.BenchmarkConsumer;
import com.example.open.domain.order.kafka.producer.BenchmarkProducer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * ============================================================
 * Kafka Benchmark Controller
 * ============================================================
 *
 * Consumer Group과 파티션의 이점을 시연하기 위한 REST API
 *
 * 제공 기능:
 * 1. 대량 메시지 발행 테스트
 * 2. 처리 통계 조회
 * 3. Consumer 장애 시뮬레이션
 * 4. 통계 초기화
 *
 * 테스트 시나리오:
 * 1. POST /benchmark/publish?count=1000 → 1000건 메시지 발행
 * 2. GET /benchmark/stats → 처리 통계 확인
 * 3. POST /benchmark/simulate-failure → Consumer 장애 시뮬레이션
 */
@RestController
@RequestMapping("/api/kafka/benchmark")
public class BenchmarkController {

    private final BenchmarkProducer benchmarkProducer;
    private final BenchmarkConsumer benchmarkConsumer;

    public BenchmarkController(BenchmarkProducer benchmarkProducer,
                               BenchmarkConsumer benchmarkConsumer) {
        this.benchmarkProducer = benchmarkProducer;
        this.benchmarkConsumer = benchmarkConsumer;
    }

    /**
     * ============================================================
     * 대량 메시지 발행
     * ============================================================
     *
     * POST /api/kafka/benchmark/publish?count=1000
     *
     * Key 기반 파티션 분배:
     * - order-0, order-1, order-2 키를 순환 사용
     * - 같은 키는 항상 같은 파티션으로 전송
     */
    @PostMapping("/publish")
    public ResponseEntity<Map<String, Object>> publishMessages(
            @RequestParam(defaultValue = "1000") int count) {


        String threadName = Thread.currentThread().getName();

        System.out.println(
            "[스레드: " + threadName + "] "
        );


        // ═══════════════════════════════════════════════════════════════
        // [실행순서 1] HTTP 요청 진입
        // ═══════════════════════════════════════════════════════════════
        // @RequestParam: URL 쿼리 파라미터를 메서드 인자로 바인딩
        // - /publish?count=500 → count = 500
        // - /publish (파라미터 없음) → count = 1000 (defaultValue)

        // ═══════════════════════════════════════════════════════════════
        // [실행순서 2] Consumer 통계 초기화
        // ═══════════════════════════════════════════════════════════════
        // 왜 필요한가?
        // - 이전 테스트의 처리 결과가 섞이지 않도록 초기화
        // - Consumer가 메시지를 처리한 통계를 0으로 리셋
        benchmarkConsumer.resetStats();

        // ═══════════════════════════════════════════════════════════════
        // [실행순서 3] Producer에게 메시지 발행 요청 (핵심!)
        // ═══════════════════════════════════════════════════════════════
        // 이 한 줄이 실제로 하는 일:
        //   1. 1000개의 메시지를 Kafka로 비동기 전송
        //   2. 모든 전송이 완료될 때까지 내부에서 대기
        //   3. 완료 후 통계(성공/실패 수, 소요시간 등)를 담은 결과 반환
        //
        // BenchmarkResult는 Java record 타입:
        //   - 불변(immutable) 데이터 객체
        //   - 자동으로 생성자, getter, equals, hashCode, toString 생성
        //   - result.totalMessages() 형태로 값 접근
        BenchmarkProducer.BenchmarkResult result = benchmarkProducer.publishMessages(count);

        // ═══════════════════════════════════════════════════════════════
        // [실행순서 4] HTTP 응답 생성
        // ═══════════════════════════════════════════════════════════════
        // HashMap: 키-값 쌍을 저장하는 자료구조
        // - put(키, 값): 데이터 추가
        // - JSON으로 변환되어 클라이언트에게 전달됨
        Map<String, Object> response = new HashMap<>();

        // [4-1] 기본 통계 정보 추가
        response.put("status", "completed");                    // 상태: 완료
        response.put("totalMessages", result.totalMessages());  // 전체 메시지 수: 1000
        response.put("successCount", result.successCount());    // 성공 수: 예) 1000
        response.put("failCount", result.failCount());          // 실패 수: 예) 0
        response.put("publishDurationMs", result.durationMs()); // 소요시간(ms): 예) 523

        // [4-2] 처리량 계산 (초당 메시지 수)
        // String.format(): 문자열 포맷팅
        // - "%.2f": 소수점 2자리까지 표시
        // - result.throughput(): 1000 * 1000.0 / 523 = 1912.05
        response.put("publishThroughput", String.format("%.2f msg/sec", result.throughput()));

        // ═══════════════════════════════════════════════════════════════
        // [실행순서 5] 파티션 분배 정보 변환
        // ═══════════════════════════════════════════════════════════════
        // partitionCounts: Map<Integer, AtomicInteger>
        //   - Key: 파티션 번호 (0, 1, 2)
        //   - Value: 해당 파티션으로 전송된 메시지 수 (AtomicInteger)
        //
        // AtomicInteger란?
        //   - 멀티스레드 환경에서 안전하게 숫자를 증가시키는 클래스
        //   - .get(): 현재 값을 int로 반환
        //
        // forEach: 각 항목에 대해 람다 함수 실행
        //   - (partition, count1) -> : 파티션번호, 카운트를 인자로 받음
        Map<String, Integer> partitionDist = new HashMap<>();
        result.partitionCounts().forEach((partition, count1) ->
                partitionDist.put("partition-" + partition, count1.get()));
        // 결과 예시: { "partition-0": 334, "partition-1": 333, "partition-2": 333 }
        response.put("partitionDistribution", partitionDist);

        // ═══════════════════════════════════════════════════════════════
        // [실행순서 6] HTTP 200 OK 응답 반환
        // ═══════════════════════════════════════════════════════════════
        // ResponseEntity: HTTP 응답 전체(상태코드, 헤더, 본문)를 표현하는 객체
        // - ResponseEntity.ok(body): 200 OK + 응답 본문
        // - response Map은 자동으로 JSON으로 변환됨
        //
        // 최종 응답 예시:
        // {
        //   "status": "completed",
        //   "totalMessages": 1000,
        //   "successCount": 1000,
        //   "failCount": 0,
        //   "publishDurationMs": 523,
        //   "publishThroughput": "1912.05 msg/sec",
        //   "partitionDistribution": {
        //     "partition-0": 334,
        //     "partition-1": 333,
        //     "partition-2": 333
        //   }
        // }
        return ResponseEntity.ok(response);
    }

    /**
     * ============================================================
     * Round-Robin 방식 발행
     * ============================================================
     *
     * POST /api/kafka/benchmark/publish/round-robin?count=1000
     *
     * Key 없이 발행하여 자동 분배
     */
    @PostMapping("/publish/round-robin")
    public ResponseEntity<Map<String, Object>> publishMessagesRoundRobin(
            @RequestParam(defaultValue = "1000") int count) {

        benchmarkConsumer.resetStats();

        BenchmarkProducer.BenchmarkResult result = benchmarkProducer.publishMessagesRoundRobin(count);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "completed");
        response.put("mode", "round-robin");
        response.put("totalMessages", result.totalMessages());
        response.put("successCount", result.successCount());
        response.put("publishDurationMs", result.durationMs());

        Map<String, Integer> partitionDist = new HashMap<>();
        result.partitionCounts().forEach((partition, count1) ->
                partitionDist.put("partition-" + partition, count1.get()));
        response.put("partitionDistribution", partitionDist);

        return ResponseEntity.ok(response);
    }

    /**
     * ============================================================
     * Consumer 처리 통계 조회
     * ============================================================
     *
     * GET /api/kafka/benchmark/stats
     *
     * 반환 정보:
     * - 총 처리 건수
     * - 처리 시간
     * - 처리량 (msg/sec)
     * - 파티션별 처리 건수
     * - Consumer별 처리 건수
     * - 리밸런싱 횟수
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        BenchmarkConsumer.BenchmarkStats stats = benchmarkConsumer.getStats();

        Map<String, Object> response = new HashMap<>();
        response.put("totalProcessed", stats.totalProcessed());
        response.put("durationMs", stats.durationMs());
        response.put("throughput", String.format("%.2f msg/sec", stats.throughput()));
        response.put("rebalanceCount", stats.rebalanceCount());

        // 파티션별 통계
        Map<String, Integer> partitionStats = new HashMap<>();
        stats.partitionStats().forEach((partition, count) ->
                partitionStats.put("partition-" + partition, count.get()));
        response.put("byPartition", partitionStats);

        // Consumer별 통계
        Map<String, Integer> consumerStats = new HashMap<>();
        stats.consumerStats().forEach((consumer, count) ->
                consumerStats.put(consumer, count.get()));
        response.put("byConsumer", consumerStats);

        return ResponseEntity.ok(response);
    }

    /**
     * ============================================================
     * Consumer 장애 시뮬레이션
     * ============================================================
     *
     * POST /api/kafka/benchmark/simulate-failure?consumerId=xxx
     *
     * 시뮬레이션 과정:
     * 1. 지정된 Consumer가 메시지 처리 중단
     * 2. session.timeout (10초) 후 리밸런싱 발생
     * 3. 다른 Consumer가 해당 파티션 인수
     * 4. 처리 중단 없이 계속 진행
     */
    @PostMapping("/simulate-failure")
    public ResponseEntity<Map<String, String>> simulateFailure(
            @RequestParam(required = false) String consumerId) {

        // consumerId가 없으면 현재 Consumer 중 하나 선택
        BenchmarkConsumer.BenchmarkStats stats = benchmarkConsumer.getStats();
        String targetConsumer = consumerId;

        if (targetConsumer == null && !stats.consumerStats().isEmpty()) {
            targetConsumer = stats.consumerStats().keySet().iterator().next();
        }

        if (targetConsumer == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "No active consumers found",
                    "hint", "First publish some messages to activate consumers"
            ));
        }

        benchmarkConsumer.startFailureSimulation(targetConsumer);

        return ResponseEntity.ok(Map.of(
                "status", "simulation_started",
                "targetConsumer", targetConsumer,
                "message", "Consumer will stop processing. Watch for rebalancing!"
        ));
    }

    /**
     * ============================================================
     * 장애 시뮬레이션 중지
     * ============================================================
     *
     * POST /api/kafka/benchmark/stop-failure
     */
    @PostMapping("/stop-failure")
    public ResponseEntity<Map<String, String>> stopFailure() {
        benchmarkConsumer.stopFailureSimulation();

        return ResponseEntity.ok(Map.of(
                "status", "simulation_stopped",
                "message", "Consumer failure simulation stopped"
        ));
    }

    /**
     * ============================================================
     * 통계 초기화
     * ============================================================
     *
     * POST /api/kafka/benchmark/reset
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetStats() {
        benchmarkConsumer.resetStats();

        return ResponseEntity.ok(Map.of(
                "status", "reset",
                "message", "All statistics have been reset"
        ));
    }

    /**
     * ============================================================
     * 벤치마크 가이드
     * ============================================================
     *
     * GET /api/kafka/benchmark/guide
     *
     * Consumer Group과 파티션의 이점 설명
     */
    @GetMapping("/guide")
    public ResponseEntity<Map<String, Object>> getGuide() {
        Map<String, Object> guide = new HashMap<>();

        guide.put("title", "Kafka Consumer Group & Partition Benchmark Guide");

        guide.put("concepts", Map.of(
                "partition", "토픽을 여러 조각으로 나눠 병렬 처리 가능. 파티션 수 = 최대 병렬 Consumer 수",
                "consumerGroup", "같은 그룹의 Consumer들이 파티션을 나눠 처리. 부하 분산 및 장애 복구",
                "rebalancing", "Consumer 추가/제거 시 파티션 자동 재할당"
        ));

        guide.put("testScenarios", Map.of(
                "scenario1", Map.of(
                        "name", "Single Consumer vs Multiple Consumers",
                        "steps", new String[]{
                                "1. POST /benchmark/publish?count=1000",
                                "2. GET /benchmark/stats - Check throughput",
                                "3. Compare with KafkaBenchmarkConfig concurrency=1 vs 3"
                        }
                ),
                "scenario2", Map.of(
                        "name", "Consumer Failure Recovery",
                        "steps", new String[]{
                                "1. POST /benchmark/publish?count=1000",
                                "2. POST /benchmark/simulate-failure",
                                "3. Watch logs for rebalancing",
                                "4. GET /benchmark/stats - Verify no message loss"
                        }
                )
        ));

        guide.put("endpoints", Map.of(
                "POST /benchmark/publish", "Publish messages (default: 1000)",
                "POST /benchmark/publish/round-robin", "Publish without key (round-robin)",
                "GET /benchmark/stats", "Get processing statistics",
                "POST /benchmark/simulate-failure", "Simulate consumer failure",
                "POST /benchmark/stop-failure", "Stop failure simulation",
                "POST /benchmark/reset", "Reset all statistics"
        ));

        return ResponseEntity.ok(guide);
    }
}
