package com.example.open.domain.order.kafka.demo;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * ============================================================
 * 순서 보장 데모 Consumer
 * ============================================================
 *
 * 이 Consumer가 보여주는 것:
 *
 * 1. 메시지가 어떤 순서로 도착하는지
 * 2. 순서가 잘못되면 어떤 문제가 발생하는지
 * 3. 키를 사용하면 순서가 보장됨을 증명
 *
 * 핵심 학습 포인트:
 * - 같은 파티션 내에서는 순서가 보장됨
 * - 다른 파티션 간에는 순서가 보장되지 않음
 * - 키를 사용하면 관련 메시지가 같은 파티션으로 감
 */
@Service
public class OrderingDemoConsumer {
    private static final Logger log = LoggerFactory.getLogger(OrderingDemoConsumer.class);

    // 초기 잔액
    private static final int INITIAL_BALANCE = 10000;

    // 계좌별 현재 잔액
    private final Map<String, AtomicInteger> balances = new ConcurrentHashMap<>();

    // 계좌별 처리된 거래 순서 기록
    private final Map<String, List<ProcessedTransaction>> processedOrders = new ConcurrentHashMap<>();

    // 순서 오류 카운터
    private final AtomicInteger orderingErrors = new AtomicInteger(0);

    // 잔액 부족 오류 카운터
    private final AtomicInteger insufficientFundsErrors = new AtomicInteger(0);

    /**
     * ============================================================
     * 메인 Consumer
     * ============================================================
     *
     * concurrency=3: 3개의 Consumer 스레드가 각각 파티션 담당
     *
     * 키 없이 전송된 메시지:
     * - 여러 파티션에 분산
     * - 각 Consumer가 독립적으로 처리
     * - 순서가 뒤바뀔 수 있음!
     *
     * 키와 함께 전송된 메시지:
     * - 같은 키는 같은 파티션
     * - 한 Consumer가 순서대로 처리
     * - 순서 보장!
     */
    @KafkaListener(
        topics = "ordering-demo-topic",
        groupId = "ordering-demo-group",
        containerFactory = "orderingDemoListenerFactory"
    )
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String consumerId = Thread.currentThread().getName();
        BankTransaction tx = BankTransaction.fromJson(record.value());

        log.info("────────────────────────────────────────");
        log.info("[Consumer: {}] 메시지 수신", consumerId);
        log.info("  파티션: {}, 오프셋: {}", record.partition(), record.offset());
        log.info("  키: {}", record.key() == null ? "(없음)" : record.key());
        log.info("  계좌: {}, 순서: {}, 타입: {}, 금액: {}",
            tx.accountId(), tx.sequence(), tx.type(), tx.amount());

        // 거래 처리
        processTransaction(tx, record.partition(), consumerId);

        ack.acknowledge();
    }

    /**
     * ============================================================
     * 거래 처리 로직
     * ============================================================
     *
     * 이 메서드가 순서 문제를 명확하게 보여줌:
     *
     * 1. 순서 검증: 이전 거래가 처리되었는지 확인
     * 2. 잔액 계산: 입금/출금 처리
     * 3. 잔액 부족 체크: 출금 시 잔액이 충분한지 확인
     */
    private void processTransaction(BankTransaction tx, int partition, String consumerId) {
        String accountId = tx.accountId();

        // 계좌 초기화 (처음 보는 계좌면)
        balances.computeIfAbsent(accountId, k -> new AtomicInteger(INITIAL_BALANCE));
        processedOrders.computeIfAbsent(accountId, k -> new ArrayList<>());

        int currentBalance = balances.get(accountId).get();
        List<ProcessedTransaction> orders = processedOrders.get(accountId);

        // ═══════════════════════════════════════════════════════════
        // 순서 검증
        // ═══════════════════════════════════════════════════════════
        int expectedSequence = orders.size() + 1;
        boolean outOfOrder = (tx.sequence() != expectedSequence);

        if (outOfOrder) {
            orderingErrors.incrementAndGet();
            log.warn("  ⚠️  순서 오류! 예상: {}, 실제: {}", expectedSequence, tx.sequence());
            log.warn("      이전에 처리된 거래: {}", orders.stream().map(o -> o.sequence).toList());
        }

        // ═══════════════════════════════════════════════════════════
        // 잔액 계산
        // ═══════════════════════════════════════════════════════════
        int newBalance;
        boolean insufficientFunds = false;

        if ("DEPOSIT".equals(tx.type())) {
            newBalance = currentBalance + tx.amount();
            balances.get(accountId).set(newBalance);
            log.info("  💰 입금: {} + {} = {}", currentBalance, tx.amount(), newBalance);
        } else { // WITHDRAW
            if (currentBalance < tx.amount()) {
                insufficientFunds = true;
                insufficientFundsErrors.incrementAndGet();
                newBalance = currentBalance; // 출금 실패, 잔액 유지
                log.error("  ❌ 잔액 부족! 현재: {}, 출금 요청: {}", currentBalance, tx.amount());
                log.error("      이것이 순서 문제의 결과입니다!");
            } else {
                newBalance = currentBalance - tx.amount();
                balances.get(accountId).set(newBalance);
                log.info("  💸 출금: {} - {} = {}", currentBalance, tx.amount(), newBalance);
            }
        }

        // 처리 기록
        orders.add(new ProcessedTransaction(
            tx.sequence(),
            tx.type(),
            tx.amount(),
            currentBalance,
            newBalance,
            outOfOrder,
            insufficientFunds,
            partition,
            consumerId
        ));

        log.info("  현재 잔액: {}", balances.get(accountId).get());
    }

    /**
     * ============================================================
     * 결과 리포트 생성
     * ============================================================
     */
    public DemoResult getResult() {
        return new DemoResult(
            new ConcurrentHashMap<>(balances),
            new ConcurrentHashMap<>(processedOrders),
            orderingErrors.get(),
            insufficientFundsErrors.get()
        );
    }

    /**
     * 상태 초기화
     */
    public void reset() {
        balances.clear();
        processedOrders.clear();
        orderingErrors.set(0);
        insufficientFundsErrors.set(0);
        log.info("[RESET] Consumer 상태 초기화 완료");
    }

    /**
     * 처리된 거래 정보
     */
    public record ProcessedTransaction(
        int sequence,
        String type,
        int amount,
        int balanceBefore,
        int balanceAfter,
        boolean outOfOrder,
        boolean insufficientFunds,
        int partition,
        String consumerId
    ) {}

    /**
     * 데모 결과
     */
    public record DemoResult(
        Map<String, AtomicInteger> finalBalances,
        Map<String, List<ProcessedTransaction>> transactionHistory,
        int orderingErrors,
        int insufficientFundsErrors
    ) {
        /**
         * 기대 잔액 계산
         * seq 1~n에서 홀수는 입금(+1000*seq), 짝수는 출금(-1000*seq)
         * 예: n=5 → 10000 + 1000 - 2000 + 3000 - 4000 + 5000 = 13000
         */
        public int calculateExpectedBalance(int txCount) {
            int balance = 10000; // 초기 잔액
            for (int seq = 1; seq <= txCount; seq++) {
                if (seq % 2 == 1) {
                    balance += 1000 * seq; // 입금
                } else {
                    balance -= 1000 * seq; // 출금
                }
            }
            return balance;
        }

        public void printReport() {
            printReport(5); // 기본값: 5개 거래
        }

        public void printReport(int txPerAccount) {
            int expectedBalance = calculateExpectedBalance(txPerAccount);

            System.out.println("\n" + "═".repeat(60));
            System.out.println("                    데모 결과 리포트");
            System.out.println("═".repeat(60));

            // 최종 잔액
            System.out.println("\n📊 계좌별 최종 잔액:");
            finalBalances.forEach((account, balance) -> {
                String status = balance.get() == expectedBalance ? "✅ 정상" : "❌ 오류";
                System.out.printf("  %s: %,d원 (기대값: %,d원) %s%n",
                    account, balance.get(), expectedBalance, status);
            });

            // 오류 요약
            System.out.println("\n⚠️  오류 요약:");
            System.out.printf("  순서 오류 발생 횟수: %d%n", orderingErrors);
            System.out.printf("  잔액 부족 오류 횟수: %d%n", insufficientFundsErrors);

            // 거래 처리 순서
            System.out.println("\n📝 거래 처리 순서:");
            transactionHistory.forEach((account, txs) -> {
                System.out.printf("\n  [%s]%n", account);
                List<Integer> receivedOrder = txs.stream().map(t -> t.sequence).toList();
                System.out.printf("    수신 순서: %s%n", receivedOrder);

                for (ProcessedTransaction tx : txs) {
                    String status = "";
                    if (tx.outOfOrder) status += " ⚠️순서오류";
                    if (tx.insufficientFunds) status += " ❌잔액부족";

                    System.out.printf("    seq=%d %s %,d원: %,d → %,d (파티션:%d)%s%n",
                        tx.sequence, tx.type, tx.amount,
                        tx.balanceBefore, tx.balanceAfter,
                        tx.partition, status);
                }
            });

            // 결론
            System.out.println("\n" + "─".repeat(60));
            if (orderingErrors == 0 && insufficientFundsErrors == 0) {
                System.out.println("✅ 결론: 모든 거래가 올바른 순서로 처리됨");
                System.out.println("   → 키를 사용하여 순서가 보장되었습니다!");
            } else {
                System.out.println("❌ 결론: 순서 문제로 인한 오류 발생");
                System.out.println("   → 키 없이 전송하면 순서가 보장되지 않습니다!");
                System.out.println("   → 같은 엔티티의 메시지는 반드시 같은 키를 사용하세요.");
            }
            System.out.println("═".repeat(60) + "\n");
        }

        /**
         * 계좌별 처리 순서 요약 반환
         */
        public Map<String, List<Integer>> getProcessingOrders() {
            Map<String, List<Integer>> orders = new java.util.HashMap<>();
            transactionHistory.forEach((account, txs) -> {
                orders.put(account, txs.stream().map(t -> t.sequence).toList());
            });
            return orders;
        }

        /**
         * 파티션 분배 정보 반환
         */
        public Map<String, Set<Integer>> getPartitionDistribution() {
            Map<String, Set<Integer>> distribution = new java.util.HashMap<>();
            transactionHistory.forEach((account, txs) -> {
                Set<Integer> partitions = txs.stream()
                    .map(t -> t.partition)
                    .collect(java.util.stream.Collectors.toSet());
                distribution.put(account, partitions);
            });
            return distribution;
        }

        /**
         * 순서가 올바른지 확인
         */
        public boolean isOrderCorrect(String accountId) {
            List<ProcessedTransaction> txs = transactionHistory.get(accountId);
            if (txs == null || txs.isEmpty()) return true;

            for (int i = 0; i < txs.size(); i++) {
                if (txs.get(i).sequence != i + 1) return false;
            }
            return true;
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 비교 테스트용 추가 메서드
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * 두 결과 비교 리포트 출력
     */
    public static void printComparisonReport(DemoResult withoutKey, DemoResult withKey, int txPerAccount) {
        int expectedBalance = withKey.calculateExpectedBalance(txPerAccount);

        System.out.println("\n");
        System.out.println("╔════════════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                     🔬 키 유무 비교 테스트 결과                              ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                                            ║");
        System.out.println("║  테스트 조건:                                                               ║");
        System.out.printf("║    • 거래 수: %d건/계좌                                                     ║%n", txPerAccount);
        System.out.printf("║    • 기대 잔액: %,d원                                                       ║%n", expectedBalance);
        System.out.println("║    • 동일한 전송 순서 (seq 1 → 2 → 3 → ...)                                 ║");
        System.out.println("║    • 유일한 차이점: 키 사용 여부                                             ║");
        System.out.println("║                                                                            ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                                            ║");

        // 키 없이 전송 결과
        System.out.println("║  ┌──────────────────────────────────────────────────────────────────────┐  ║");
        System.out.println("║  │ ❌ 키 없이 전송 (WITHOUT KEY)                                        │  ║");
        System.out.println("║  ├──────────────────────────────────────────────────────────────────────┤  ║");
        System.out.printf("║  │   순서 오류: %d건                                                     │  ║%n", withoutKey.orderingErrors);
        System.out.printf("║  │   잔액 오류: %d건                                                     │  ║%n", withoutKey.insufficientFundsErrors);

        // 계좌별 상세
        for (var entry : withoutKey.transactionHistory.entrySet()) {
            List<Integer> order = entry.getValue().stream().map(t -> t.sequence).toList();
            Set<Integer> partitions = entry.getValue().stream().map(t -> t.partition).collect(java.util.stream.Collectors.toSet());
            int finalBal = withoutKey.finalBalances.get(entry.getKey()).get();
            String balStatus = finalBal == expectedBalance ? "✅" : "❌";

            System.out.printf("║  │   [%s]                                                  │  ║%n", entry.getKey());
            System.out.printf("║  │     파티션: %s (분산됨!)                                          │  ║%n", partitions);
            System.out.printf("║  │     수신순서: %s                                       │  ║%n", formatOrder(order));
            System.out.printf("║  │     최종잔액: %,d원 %s                                           │  ║%n", finalBal, balStatus);
        }
        System.out.println("║  └──────────────────────────────────────────────────────────────────────┘  ║");

        System.out.println("║                                                                            ║");

        // 키와 함께 전송 결과
        System.out.println("║  ┌──────────────────────────────────────────────────────────────────────┐  ║");
        System.out.println("║  │ ✅ 키와 함께 전송 (WITH KEY)                                         │  ║");
        System.out.println("║  ├──────────────────────────────────────────────────────────────────────┤  ║");
        System.out.printf("║  │   순서 오류: %d건                                                     │  ║%n", withKey.orderingErrors);
        System.out.printf("║  │   잔액 오류: %d건                                                     │  ║%n", withKey.insufficientFundsErrors);

        for (var entry : withKey.transactionHistory.entrySet()) {
            List<Integer> order = entry.getValue().stream().map(t -> t.sequence).toList();
            Set<Integer> partitions = entry.getValue().stream().map(t -> t.partition).collect(java.util.stream.Collectors.toSet());
            int finalBal = withKey.finalBalances.get(entry.getKey()).get();
            String balStatus = finalBal == expectedBalance ? "✅" : "❌";

            System.out.printf("║  │   [%s]                                                   │  ║%n", entry.getKey());
            System.out.printf("║  │     파티션: %s (단일!)                                             │  ║%n", partitions);
            System.out.printf("║  │     수신순서: %s                                        │  ║%n", formatOrder(order));
            System.out.printf("║  │     최종잔액: %,d원 %s                                           │  ║%n", finalBal, balStatus);
        }
        System.out.println("║  └──────────────────────────────────────────────────────────────────────┘  ║");

        System.out.println("║                                                                            ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                           📊 비교 분석                                      ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                                            ║");
        System.out.printf("║  순서 오류:  키 없음 %d건  vs  키 사용 %d건                                  ║%n",
            withoutKey.orderingErrors, withKey.orderingErrors);
        System.out.printf("║  잔액 오류:  키 없음 %d건  vs  키 사용 %d건                                  ║%n",
            withoutKey.insufficientFundsErrors, withKey.insufficientFundsErrors);
        System.out.println("║                                                                            ║");

        // 핵심 결론
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                           💡 핵심 결론                                      ║");
        System.out.println("╠════════════════════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                                            ║");

        if (withoutKey.orderingErrors > 0 && withKey.orderingErrors == 0) {
            System.out.println("║  🎯 키 사용의 효과가 명확히 증명되었습니다!                                  ║");
            System.out.println("║                                                                            ║");
            System.out.println("║  • 키 없음: 메시지가 여러 파티션에 분산 → Consumer 병렬 처리 → 순서 뒤바뀜    ║");
            System.out.println("║  • 키 사용: 같은 키 = 같은 파티션 → 단일 Consumer 처리 → 순서 보장           ║");
        } else if (withoutKey.orderingErrors == 0 && withKey.orderingErrors == 0) {
            System.out.println("║  ⚠️  두 경우 모두 순서 오류가 없습니다.                                      ║");
            System.out.println("║      → 거래 수를 늘리거나 지연을 조절해 보세요.                              ║");
        } else {
            System.out.println("║  ⚠️  예상과 다른 결과입니다. 설정을 확인해 주세요.                           ║");
        }

        System.out.println("║                                                                            ║");
        System.out.println("╚════════════════════════════════════════════════════════════════════════════╝");
        System.out.println();
    }

    private static String formatOrder(List<Integer> order) {
        if (order.size() <= 10) {
            return order.toString();
        }
        return order.subList(0, 5).toString() + "..." + order.subList(order.size() - 3, order.size());
    }
}
