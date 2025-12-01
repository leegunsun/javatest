package com.example.open.domain.order.kafka.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ============================================================
 * 순서 보장 데모 API
 * ============================================================
 *
 * 이 API를 통해 Kafka 키의 중요성을 직접 테스트할 수 있습니다.
 *
 * 테스트 순서:
 * 1. POST /demo/ordering/reset - 상태 초기화
 * 2. POST /demo/ordering/without-key - 키 없이 전송 (순서 문제 발생 가능)
 * 3. GET /demo/ordering/result - 결과 확인
 *
 * 또는:
 * 1. POST /demo/ordering/reset - 상태 초기화
 * 2. POST /demo/ordering/with-key - 키와 함께 전송 (순서 보장)
 * 3. GET /demo/ordering/result - 결과 확인
 */
@RestController
@RequestMapping("/demo/ordering")
public class OrderingDemoController {

    private final OrderingDemoProducer producer;
    private final OrderingDemoConsumer consumer;

    public OrderingDemoController(OrderingDemoProducer producer, OrderingDemoConsumer consumer) {
        this.producer = producer;
        this.consumer = consumer;
    }

    /**
     * 상태 초기화
     */
    @PostMapping("/reset")
    public ResponseEntity<String> reset() {
        consumer.reset();
        return ResponseEntity.ok("Consumer 상태가 초기화되었습니다. 테스트를 시작하세요.");
    }

    /**
     * ============================================================
     * 시나리오 1: 키 없이 전송
     * ============================================================
     *
     * 예상 결과:
     * - 메시지가 여러 파티션에 분산
     * - 처리 순서가 보장되지 않음
     * - 순서 오류 또는 잔액 부족 오류 발생 가능
     *
     * curl -X POST http://localhost:8082/demo/ordering/without-key
     */
    @PostMapping("/without-key")
    public ResponseEntity<Map<String, Object>> sendWithoutKey() {
        producer.sendWithoutKey("ACC-001");

        // Consumer가 처리할 시간을 줌
        sleep(2000);

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "message", "키 없이 전송 완료",
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "note", "순서 오류가 발생했다면 키의 중요성을 확인했습니다!"
        ));
    }

    /**
     * ============================================================
     * 시나리오 2: 키와 함께 전송
     * ============================================================
     *
     * 예상 결과:
     * - 같은 키(계좌)의 메시지는 같은 파티션으로
     * - 처리 순서가 보장됨
     * - 오류 없이 정상 처리
     *
     * curl -X POST http://localhost:8082/demo/ordering/with-key
     */
    @PostMapping("/with-key")
    public ResponseEntity<Map<String, Object>> sendWithKey() {
        producer.sendWithKey("ACC-001");

        // Consumer가 처리할 시간을 줌
        sleep(2000);

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "message", "키와 함께 전송 완료",
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "note", "순서가 보장되어 오류 없이 처리되었습니다!"
        ));
    }

    /**
     * ============================================================
     * 시나리오 3: 여러 계좌 동시 거래
     * ============================================================
     *
     * 실제 상황 시뮬레이션:
     * - 3개 계좌가 동시에 거래
     * - 각 계좌별로 순서가 보장됨
     *
     * curl -X POST http://localhost:8082/demo/ordering/multi-account
     */
    @PostMapping("/multi-account")
    public ResponseEntity<Map<String, Object>> sendMultiAccount() {
        producer.sendMultipleAccounts();

        // Consumer가 처리할 시간을 줌
        sleep(3000);

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "message", "여러 계좌 거래 완료",
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "note", "각 계좌별로 순서가 보장되었습니다!"
        ));
    }

    /**
     * 결과 조회
     */
    @GetMapping("/result")
    public ResponseEntity<Map<String, Object>> getResult() {
        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "finalBalances", result.finalBalances().entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                    Map.Entry::getKey,
                    e -> e.getValue().get()
                ))
        ));
    }

    /**
     * ============================================================
     * 시나리오 4: 지연을 두고 키 없이 전송 (순서 문제 재현)
     * ============================================================
     *
     * Sticky Partitioner를 우회하여 순서 문제를 명확하게 재현
     *
     * curl -X POST "http://localhost:8082/demo/ordering/delayed-without-key?delayMs=100"
     */
    @PostMapping("/delayed-without-key")
    public ResponseEntity<Map<String, Object>> sendDelayedWithoutKey(
            @RequestParam(defaultValue = "100") long delayMs) {

        producer.sendWithoutKeyDelayed("ACC-DELAYED", delayMs);

        sleep(3000);

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "message", "지연 전송 완료 (키 없음)",
            "delayMs", delayMs,
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "note", "지연으로 인해 Sticky Partitioner가 우회되어 파티션이 분산됩니다"
        ));
    }

    /**
     * ============================================================
     * 시나리오 5: 대량 메시지 키 없이 전송 (파티션 분산 확인)
     * ============================================================
     *
     * 많은 메시지를 보내 파티션 분산과 순서 문제를 확인
     *
     * curl -X POST "http://localhost:8082/demo/ordering/bulk-without-key?accounts=10&txPerAccount=5"
     */
    @PostMapping("/bulk-without-key")
    public ResponseEntity<Map<String, Object>> sendBulkWithoutKey(
            @RequestParam(defaultValue = "10") int accounts,
            @RequestParam(defaultValue = "5") int txPerAccount) {

        producer.sendBulkWithoutKey(accounts, txPerAccount);

        sleep(5000);

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "message", "대량 전송 완료 (키 없음)",
            "accounts", accounts,
            "transactionsPerAccount", txPerAccount,
            "totalMessages", accounts * txPerAccount,
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "note", "같은 계좌의 거래가 여러 파티션에 분산되어 순서 문제 발생!"
        ));
    }

    /**
     * ============================================================
     * 시나리오 6: 대량 메시지 키와 함께 전송 (순서 보장 확인)
     * ============================================================
     *
     * 같은 조건에서 키를 사용하면 순서가 보장됨을 확인
     *
     * curl -X POST "http://localhost:8082/demo/ordering/bulk-with-key?accounts=10&txPerAccount=5"
     */
    @PostMapping("/bulk-with-key")
    public ResponseEntity<Map<String, Object>> sendBulkWithKey(
            @RequestParam(defaultValue = "10") int accounts,
            @RequestParam(defaultValue = "5") int txPerAccount) {

        producer.sendBulkWithKey(accounts, txPerAccount);

        sleep(5000);

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport();

        return ResponseEntity.ok(Map.of(
            "message", "대량 전송 완료 (키 사용)",
            "accounts", accounts,
            "transactionsPerAccount", txPerAccount,
            "totalMessages", accounts * txPerAccount,
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "note", "키를 사용하여 같은 계좌의 거래는 순서가 보장됩니다!"
        ));
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // 키 유무 비교 테스트 API (핵심!)
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * ============================================================
     * 🔬 핵심 비교 테스트: 단일 계좌
     * ============================================================
     *
     * 동일한 조건에서 키 유무만 다르게 테스트하여 차이점 확인
     *
     * 테스트 흐름:
     * 1. Consumer 리셋
     * 2. 키 없이 전송 → 결과 저장
     * 3. Consumer 리셋
     * 4. 키와 함께 전송 → 결과 저장
     * 5. 두 결과 비교 리포트 출력
     *
     * curl -X POST "http://localhost:8082/demo/ordering/compare?txCount=10&delayMs=10"
     */
    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareKeyEffect(
            @RequestParam(defaultValue = "10") int txCount,
            @RequestParam(defaultValue = "10") long delayMs) {

        System.out.println("\n");
        System.out.println("╔════════════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                     🔬 키 유무 비교 테스트 시작                              ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.printf("║  거래 수: %d건, 메시지 간 지연: %dms                                         ║%n", txCount, delayMs);
        System.out.println("║  테스트 조건: 동일한 데이터, 동일한 전송 순서, 키만 다름                       ║");
        System.out.println("╚════════════════════════════════════════════════════════════════════════════╝");

        // ═══════════════════════════════════════════════════════════════
        // 테스트 1: 키 없이 전송
        // ═══════════════════════════════════════════════════════════════
        consumer.reset();
        sleep(500);

        producer.sendOrderedTransactions("TEST-ACC-001", txCount, false, delayMs);
        sleep(Math.max(3000, txCount * 100)); // 처리 대기

        OrderingDemoConsumer.DemoResult resultWithoutKey = consumer.getResult();

        // ═══════════════════════════════════════════════════════════════
        // 테스트 2: 키와 함께 전송
        // ═══════════════════════════════════════════════════════════════
        consumer.reset();
        sleep(500);

        producer.sendOrderedTransactions("TEST-ACC-002", txCount, true, delayMs);
        sleep(Math.max(3000, txCount * 100)); // 처리 대기

        OrderingDemoConsumer.DemoResult resultWithKey = consumer.getResult();

        // ═══════════════════════════════════════════════════════════════
        // 비교 리포트 출력
        // ═══════════════════════════════════════════════════════════════
        OrderingDemoConsumer.printComparisonReport(resultWithoutKey, resultWithKey, txCount);

        // API 응답
        int expectedBalance = resultWithKey.calculateExpectedBalance(txCount);
        return ResponseEntity.ok(Map.of(
            "testConditions", Map.of(
                "txCount", txCount,
                "delayMs", delayMs,
                "expectedBalance", expectedBalance
            ),
            "withoutKey", Map.of(
                "accountId", "TEST-ACC-001",
                "orderingErrors", resultWithoutKey.orderingErrors(),
                "insufficientFundsErrors", resultWithoutKey.insufficientFundsErrors(),
                "processingOrder", resultWithoutKey.getProcessingOrders(),
                "partitionDistribution", resultWithoutKey.getPartitionDistribution().toString(),
                "finalBalance", resultWithoutKey.finalBalances().isEmpty() ? 0 :
                    resultWithoutKey.finalBalances().values().iterator().next().get()
            ),
            "withKey", Map.of(
                "accountId", "TEST-ACC-002",
                "orderingErrors", resultWithKey.orderingErrors(),
                "insufficientFundsErrors", resultWithKey.insufficientFundsErrors(),
                "processingOrder", resultWithKey.getProcessingOrders(),
                "partitionDistribution", resultWithKey.getPartitionDistribution().toString(),
                "finalBalance", resultWithKey.finalBalances().isEmpty() ? 0 :
                    resultWithKey.finalBalances().values().iterator().next().get()
            ),
            "conclusion", resultWithoutKey.orderingErrors() > 0 && resultWithKey.orderingErrors() == 0
                ? "✅ 키 사용 시 순서가 보장됨을 확인!"
                : "⚠️ 결과를 확인하세요 (txCount나 delayMs 조절 필요할 수 있음)"
        ));
    }

    /**
     * ============================================================
     * 🔬 핵심 비교 테스트: 다중 계좌
     * ============================================================
     *
     * 여러 계좌가 동시에 거래하는 실제 상황 시뮬레이션
     *
     * curl -X POST "http://localhost:8082/demo/ordering/compare-multi?accounts=5&txPerAccount=10&delayMs=5"
     */
    @PostMapping("/compare-multi")
    public ResponseEntity<Map<String, Object>> compareKeyEffectMultiAccount(
            @RequestParam(defaultValue = "5") int accounts,
            @RequestParam(defaultValue = "10") int txPerAccount,
            @RequestParam(defaultValue = "5") long delayMs) {

        System.out.println("\n");
        System.out.println("╔════════════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                 🔬 다중 계좌 키 유무 비교 테스트 시작                         ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.printf("║  계좌 수: %d개, 계좌당 거래: %d건, 총 거래: %d건                              ║%n",
            accounts, txPerAccount, accounts * txPerAccount);
        System.out.println("╚════════════════════════════════════════════════════════════════════════════╝");

        // 테스트 1: 키 없이
        consumer.reset();
        sleep(500);
        producer.sendMultiAccountOrderedTransactions(accounts, txPerAccount, false, delayMs);
        sleep(Math.max(5000, accounts * txPerAccount * 50));
        OrderingDemoConsumer.DemoResult resultWithoutKey = consumer.getResult();

        // 테스트 2: 키와 함께
        consumer.reset();
        sleep(500);
        producer.sendMultiAccountOrderedTransactions(accounts, txPerAccount, true, delayMs);
        sleep(Math.max(5000, accounts * txPerAccount * 50));
        OrderingDemoConsumer.DemoResult resultWithKey = consumer.getResult();

        // 비교 리포트
        OrderingDemoConsumer.printComparisonReport(resultWithoutKey, resultWithKey, txPerAccount);

        int expectedBalance = resultWithKey.calculateExpectedBalance(txPerAccount);
        return ResponseEntity.ok(Map.of(
            "testConditions", Map.of(
                "accounts", accounts,
                "txPerAccount", txPerAccount,
                "totalTransactions", accounts * txPerAccount,
                "expectedBalance", expectedBalance
            ),
            "withoutKey", Map.of(
                "orderingErrors", resultWithoutKey.orderingErrors(),
                "insufficientFundsErrors", resultWithoutKey.insufficientFundsErrors(),
                "accountsWithCorrectOrder", resultWithoutKey.transactionHistory().keySet().stream()
                    .filter(resultWithoutKey::isOrderCorrect).count()
            ),
            "withKey", Map.of(
                "orderingErrors", resultWithKey.orderingErrors(),
                "insufficientFundsErrors", resultWithKey.insufficientFundsErrors(),
                "accountsWithCorrectOrder", resultWithKey.transactionHistory().keySet().stream()
                    .filter(resultWithKey::isOrderCorrect).count()
            ),
            "conclusion", resultWithoutKey.orderingErrors() > resultWithKey.orderingErrors()
                ? "✅ 키 사용 시 순서 오류가 감소함을 확인!"
                : "⚠️ 결과를 확인하세요"
        ));
    }

    /**
     * ============================================================
     * 단일 테스트: 키 유무 선택
     * ============================================================
     *
     * 한 번에 하나의 모드만 테스트
     *
     * curl -X POST "http://localhost:8082/demo/ordering/test?useKey=true&txCount=10"
     * curl -X POST "http://localhost:8082/demo/ordering/test?useKey=false&txCount=10"
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testOrdering(
            @RequestParam boolean useKey,
            @RequestParam(defaultValue = "10") int txCount,
            @RequestParam(defaultValue = "10") long delayMs) {

        String mode = useKey ? "WITH KEY" : "WITHOUT KEY";
        String accountId = useKey ? "SINGLE-TEST-KEY" : "SINGLE-TEST-NOKEY";

        consumer.reset();
        sleep(500);

        producer.sendOrderedTransactions(accountId, txCount, useKey, delayMs);
        sleep(Math.max(3000, txCount * 100));

        OrderingDemoConsumer.DemoResult result = consumer.getResult();
        result.printReport(txCount);

        int expectedBalance = result.calculateExpectedBalance(txCount);
        return ResponseEntity.ok(Map.of(
            "mode", mode,
            "accountId", accountId,
            "txCount", txCount,
            "expectedBalance", expectedBalance,
            "actualBalance", result.finalBalances().isEmpty() ? 0 :
                result.finalBalances().values().iterator().next().get(),
            "orderingErrors", result.orderingErrors(),
            "insufficientFundsErrors", result.insufficientFundsErrors(),
            "processingOrder", result.getProcessingOrders(),
            "partitionDistribution", result.getPartitionDistribution().toString(),
            "isOrderCorrect", result.transactionHistory().keySet().stream()
                .allMatch(result::isOrderCorrect)
        ));
    }
}
