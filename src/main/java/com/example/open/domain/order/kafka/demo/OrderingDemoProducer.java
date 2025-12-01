package com.example.open.domain.order.kafka.demo;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * ============================================================
 * 순서 보장 데모 Producer
 * ============================================================
 *
 * 이 예제의 목적:
 * "왜 Kafka에서 키(Key)를 사용해야 하는가?"를 명확하게 보여줌
 *
 * 시나리오:
 * - 계좌 A-001: 초기 잔액 10,000원
 * - 거래 1: 입금 +5,000원 → 잔액 15,000원
 * - 거래 2: 출금 -12,000원 → 잔액 3,000원
 * - 거래 3: 입금 +7,000원 → 잔액 10,000원
 *
 * 문제 상황 (키 없을 때):
 * - 거래들이 다른 파티션으로 분산됨
 * - 처리 순서: 출금 → 입금 → 입금 (뒤죽박죽)
 * - 결과: 출금 시 "잔액 부족" 오류 발생! (실제로는 가능해야 함)
 */
@Service
public class OrderingDemoProducer {
    private static final Logger log = LoggerFactory.getLogger(OrderingDemoProducer.class);
    private static final String TOPIC = "ordering-demo-topic";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public OrderingDemoProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * ============================================================
     * 시나리오 1: 키 없이 전송 (순서 보장 안됨)
     * ============================================================
     *
     * 결과 예측:
     * - 메시지가 여러 파티션에 분산됨
     * - 각 파티션의 Consumer가 독립적으로 처리
     * - 처리 순서가 뒤바뀔 수 있음
     */
    public void sendWithoutKey(String accountId) {
        log.info("========================================");
        log.info("[WITHOUT KEY] 키 없이 거래 전송 시작");
        log.info("========================================");

        List<BankTransaction> transactions = createTransactions(accountId);
        CountDownLatch latch = new CountDownLatch(transactions.size());

        for (BankTransaction tx : transactions) {
            // 키 없이 전송 → 라운드로빈으로 파티션 분배
            kafkaTemplate.send(TOPIC, null, tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("[WITHOUT KEY] 전송 성공: seq={}, type={}, amount={} → 파티션 {}",
                            tx.sequence(), tx.type(), tx.amount(),
                            result.getRecordMetadata().partition());
                    } else {
                        log.error("[WITHOUT KEY] 전송 실패: {}", ex.getMessage());
                    }
                    latch.countDown();
                });
        }

        waitForCompletion(latch);
        log.info("[WITHOUT KEY] 모든 거래 전송 완료");
        log.info("⚠️  주의: 메시지가 여러 파티션에 분산되어 순서가 보장되지 않음!");
    }

    /**
     * ============================================================
     * 시나리오 2: 키 있이 전송 (순서 보장됨)
     * ============================================================
     *
     * 결과 예측:
     * - 같은 accountId를 키로 사용
     * - 같은 키 = 같은 파티션 = 같은 Consumer
     * - 처리 순서가 보장됨
     */
    public void sendWithKey(String accountId) {
        log.info("========================================");
        log.info("[WITH KEY] 키와 함께 거래 전송 시작");
        log.info("========================================");

        List<BankTransaction> transactions = createTransactions(accountId);
        CountDownLatch latch = new CountDownLatch(transactions.size());

        for (BankTransaction tx : transactions) {
            // accountId를 키로 사용 → 같은 파티션에 전송
            kafkaTemplate.send(TOPIC, accountId, tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("[WITH KEY] 전송 성공: seq={}, type={}, amount={} → 파티션 {}",
                            tx.sequence(), tx.type(), tx.amount(),
                            result.getRecordMetadata().partition());
                    } else {
                        log.error("[WITH KEY] 전송 실패: {}", ex.getMessage());
                    }
                    latch.countDown();
                });
        }

        waitForCompletion(latch);
        log.info("[WITH KEY] 모든 거래 전송 완료");
        log.info("✅ 같은 계좌의 거래는 모두 같은 파티션으로 전송됨 → 순서 보장!");
    }

    /**
     * ============================================================
     * 여러 계좌 동시 거래 (실제 상황 시뮬레이션)
     * ============================================================
     *
     * 실제 은행에서는 여러 계좌가 동시에 거래함
     * 각 계좌별로 순서가 보장되어야 함
     */
    public void sendMultipleAccounts() {
        log.info("========================================");
        log.info("[MULTI ACCOUNT] 여러 계좌 동시 거래 시작");
        log.info("========================================");

        // 3개 계좌, 각 계좌당 3개 거래
        String[] accounts = {"ACC-001", "ACC-002", "ACC-003"};
        List<BankTransaction> allTransactions = new ArrayList<>();

        for (String accountId : accounts) {
            allTransactions.addAll(createTransactions(accountId));
        }

        CountDownLatch latch = new CountDownLatch(allTransactions.size());

        // 모든 거래를 섞어서 전송 (실제 상황처럼)
        for (BankTransaction tx : allTransactions) {
            // accountId를 키로 사용
            kafkaTemplate.send(TOPIC, tx.accountId(), tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("[MULTI] {}의 거래 seq={} → 파티션 {}",
                            tx.accountId(), tx.sequence(),
                            result.getRecordMetadata().partition());
                    }
                    latch.countDown();
                });
        }

        waitForCompletion(latch);
        log.info("[MULTI ACCOUNT] 완료");
        log.info("✅ 각 계좌의 거래는 같은 파티션에서 순서대로 처리됨");
    }

    /**
     * 테스트용 거래 생성
     *
     * 시나리오: 초기 잔액 10,000원
     * 1. 입금 +5,000원 → 15,000원
     * 2. 출금 -12,000원 → 3,000원  (순서 중요! 1번이 먼저 처리되어야 함)
     * 3. 입금 +7,000원 → 10,000원
     */
    private List<BankTransaction> createTransactions(String accountId) {
        long now = System.currentTimeMillis();
        return List.of(
            new BankTransaction(accountId, "TX-001", "DEPOSIT", 5000, 1, now),
            new BankTransaction(accountId, "TX-002", "WITHDRAW", 12000, 2, now + 1),
            new BankTransaction(accountId, "TX-003", "DEPOSIT", 7000, 3, now + 2)
        );
    }

    /**
     * ============================================================
     * 시나리오 4: 지연을 두고 키 없이 전송 (순서 문제 재현)
     * ============================================================
     *
     * Sticky Partitioner를 우회하기 위해 각 메시지 사이에 지연을 둠
     * → 다른 배치로 처리되어 파티션이 분산됨
     * → 순서 문제 발생!
     *
     * 왜 이게 중요한가?
     * - 실제 운영에서는 거래가 동시에 발생하지 않음
     * - 분 단위, 초 단위로 떨어져서 발생
     * - 이 테스트가 실제 상황과 더 유사함
     */
    public void sendWithoutKeyDelayed(String accountId, long delayMs) {
        log.info("========================================");
        log.info("[WITHOUT KEY + DELAY] 지연을 두고 키 없이 전송");
        log.info("  각 메시지 사이 지연: {}ms", delayMs);
        log.info("========================================");

        List<BankTransaction> transactions = createTransactions(accountId);
        CountDownLatch latch = new CountDownLatch(transactions.size());

        for (int i = 0; i < transactions.size(); i++) {
            BankTransaction tx = transactions.get(i);

            // 첫 번째 메시지 이후부터 지연 추가
            if (i > 0) {
                sleep(delayMs);
            }

            // 키 없이 전송
            kafkaTemplate.send(TOPIC, null, tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("[DELAYED] seq={}, type={}, amount={} → 파티션 {}",
                            tx.sequence(), tx.type(), tx.amount(),
                            result.getRecordMetadata().partition());
                    } else {
                        log.error("[DELAYED] 전송 실패: {}", ex.getMessage());
                    }
                    latch.countDown();
                });

            // 배치 강제 플러시 (Sticky Partitioner 우회)
            kafkaTemplate.flush();
        }

        waitForCompletion(latch);
        log.info("[WITHOUT KEY + DELAY] 전송 완료");
        log.info("⚠️  메시지가 다른 배치로 전송되어 파티션이 분산될 수 있음!");
    }

    /**
     * ============================================================
     * 시나리오 5: 대량 메시지 테스트 (파티션 분산 확인)
     * ============================================================
     *
     * 많은 메시지를 보내면 Sticky Partitioner도 파티션을 변경함
     * → 같은 계좌의 거래가 다른 파티션으로 분산
     * → 순서 문제 발생!
     *
     * 시나리오:
     * - 10개 계좌가 각각 10번의 거래를 함 (총 100건)
     * - 키 없이 전송하면 파티션이 분산됨
     */
    public void sendBulkWithoutKey(int accountCount, int transactionsPerAccount) {
        log.info("========================================");
        log.info("[BULK WITHOUT KEY] 대량 메시지 테스트");
        log.info("  계좌 수: {}, 계좌당 거래 수: {}", accountCount, transactionsPerAccount);
        log.info("  총 메시지 수: {}", accountCount * transactionsPerAccount);
        log.info("========================================");

        List<BankTransaction> allTransactions = new ArrayList<>();

        // 모든 거래 생성
        for (int acc = 1; acc <= accountCount; acc++) {
            String accountId = String.format("BULK-ACC-%03d", acc);
            for (int seq = 1; seq <= transactionsPerAccount; seq++) {
                String type = (seq % 2 == 1) ? "DEPOSIT" : "WITHDRAW";
                int amount = 1000 * seq;
                allTransactions.add(new BankTransaction(
                    accountId,
                    String.format("TX-%03d-%03d", acc, seq),
                    type,
                    amount,
                    seq,
                    System.currentTimeMillis()
                ));
            }
        }

        // 거래 순서를 섞음 (실제 상황처럼)
        java.util.Collections.shuffle(allTransactions);

        CountDownLatch latch = new CountDownLatch(allTransactions.size());
        java.util.Map<Integer, java.util.concurrent.atomic.AtomicInteger> partitionCounts =
            new java.util.concurrent.ConcurrentHashMap<>();

        for (BankTransaction tx : allTransactions) {
            // 키 없이 전송
            kafkaTemplate.send(TOPIC, null, tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        int partition = result.getRecordMetadata().partition();
                        partitionCounts.computeIfAbsent(partition,
                            k -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                    }
                    latch.countDown();
                });
        }

        waitForCompletion(latch);

        log.info("[BULK WITHOUT KEY] 전송 완료");
        log.info("파티션별 분포:");
        partitionCounts.forEach((partition, count) ->
            log.info("  파티션 {}: {} 메시지", partition, count.get()));
        log.info("⚠️  같은 계좌의 거래가 여러 파티션에 분산되어 순서 문제 발생!");
    }

    /**
     * ============================================================
     * 시나리오 6: 대량 메시지 + 키 사용 (순서 보장)
     * ============================================================
     *
     * 같은 조건에서 키를 사용하면 순서가 보장됨
     */
    public void sendBulkWithKey(int accountCount, int transactionsPerAccount) {
        log.info("========================================");
        log.info("[BULK WITH KEY] 대량 메시지 + 키 테스트");
        log.info("  계좌 수: {}, 계좌당 거래 수: {}", accountCount, transactionsPerAccount);
        log.info("========================================");

        List<BankTransaction> allTransactions = new ArrayList<>();

        for (int acc = 1; acc <= accountCount; acc++) {
            String accountId = String.format("BULK-ACC-%03d", acc);
            for (int seq = 1; seq <= transactionsPerAccount; seq++) {
                String type = (seq % 2 == 1) ? "DEPOSIT" : "WITHDRAW";
                int amount = 1000 * seq;
                allTransactions.add(new BankTransaction(
                    accountId,
                    String.format("TX-%03d-%03d", acc, seq),
                    type,
                    amount,
                    seq,
                    System.currentTimeMillis()
                ));
            }
        }

        // 거래 순서를 섞음
        java.util.Collections.shuffle(allTransactions);

        CountDownLatch latch = new CountDownLatch(allTransactions.size());
        java.util.Map<String, Integer> accountToPartition = new java.util.concurrent.ConcurrentHashMap<>();

        for (BankTransaction tx : allTransactions) {
            // accountId를 키로 사용
            kafkaTemplate.send(TOPIC, tx.accountId(), tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        int partition = result.getRecordMetadata().partition();
                        accountToPartition.put(tx.accountId(), partition);
                    }
                    latch.countDown();
                });
        }

        waitForCompletion(latch);

        log.info("[BULK WITH KEY] 전송 완료");
        log.info("계좌별 파티션 할당:");
        accountToPartition.entrySet().stream()
            .sorted(java.util.Map.Entry.comparingByKey())
            .forEach(e -> log.info("  {} → 파티션 {}", e.getKey(), e.getValue()));
        log.info("✅ 같은 계좌의 거래는 항상 같은 파티션으로 → 순서 보장!");
    }

    private void waitForCompletion(CountDownLatch latch) {
        try {
            latch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 키 유무 비교 테스트용 메서드 (동일 조건, 키만 다름)
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * ============================================================
     * 핵심 비교 테스트: 동일 조건에서 키 유무만 다르게 전송
     * ============================================================
     *
     * 이 메서드의 핵심:
     * - 동일한 데이터
     * - 동일한 전송 순서 (seq 1 → 2 → 3 → ... → n)
     * - 동일한 전송 방식
     * - 유일한 차이점: 키 사용 여부
     *
     * @param accountId 계좌 ID
     * @param txCount 거래 수
     * @param useKey true면 accountId를 키로 사용, false면 키 없음
     * @param delayMs 각 메시지 사이 지연 (Sticky Partitioner 우회용)
     * @return 전송 결과 (파티션 분배 정보 포함)
     */
    public SendResult sendOrderedTransactions(String accountId, int txCount, boolean useKey, long delayMs) {
        String mode = useKey ? "WITH KEY" : "WITHOUT KEY";
        log.info("════════════════════════════════════════════════════════════");
        log.info("[{}] 순서 보장 테스트 시작", mode);
        log.info("  계좌: {}, 거래 수: {}, 메시지 간 지연: {}ms", accountId, txCount, delayMs);
        log.info("════════════════════════════════════════════════════════════");

        // 거래 생성 (순서대로! shuffle 없음!)
        List<BankTransaction> transactions = createOrderedTransactions(accountId, txCount);

        // 전송 결과 추적
        java.util.Map<Integer, java.util.concurrent.atomic.AtomicInteger> partitionCounts =
            new java.util.concurrent.ConcurrentHashMap<>();
        java.util.List<Integer> sendOrder = java.util.Collections.synchronizedList(new java.util.ArrayList<>());

        CountDownLatch latch = new CountDownLatch(transactions.size());

        // 파티션 수 (토픽 설정에서 3개로 되어있음)
        final int PARTITION_COUNT = 3;

        // 순서대로 전송
        for (int i = 0; i < transactions.size(); i++) {
            BankTransaction tx = transactions.get(i);

            log.info("[{}] 전송 중: seq={}, type={}, amount={}, key={}",
                mode, tx.sequence(), tx.type(), tx.amount(), useKey ? tx.accountId() : "(null)");

            // ═══════════════════════════════════════════════════════════════
            // 핵심 차이점: 키 유무에 따른 파티션 결정
            // ═══════════════════════════════════════════════════════════════
            ProducerRecord<String, String> record;

            if (useKey) {
                // 키 사용: Kafka가 키 해시로 파티션 결정 → 같은 키 = 같은 파티션
                record = new ProducerRecord<>(TOPIC, tx.accountId(), tx.toJson());
            } else {
                // 키 없음: 명시적으로 라운드로빈 파티션 지정
                // → 파티션이 분산되어 순서 문제 발생!
                int partition = i % PARTITION_COUNT;
                record = new ProducerRecord<>(TOPIC, partition, null, tx.toJson());
            }

            final int seqNum = tx.sequence();
            kafkaTemplate.send(record)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        int partition = result.getRecordMetadata().partition();
                        partitionCounts.computeIfAbsent(partition,
                            k -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                        sendOrder.add(seqNum);
                        log.info("[{}] 전송 완료: seq={} → 파티션 {}, 오프셋 {}",
                            mode, seqNum, partition, result.getRecordMetadata().offset());
                    } else {
                        log.error("[{}] 전송 실패: seq={}, error={}", mode, seqNum, ex.getMessage());
                    }
                    latch.countDown();
                });

            kafkaTemplate.flush();

            // 메시지 간 지연 (옵션)
            if (delayMs > 0 && i < transactions.size() - 1) {
                sleep(delayMs);
            }
        }

        waitForCompletion(latch);

        // 결과 로깅
        log.info("────────────────────────────────────────────────────────────");
        log.info("[{}] 전송 완료!", mode);
        log.info("  파티션 분배:");
        partitionCounts.entrySet().stream()
            .sorted(java.util.Map.Entry.comparingByKey())
            .forEach(e -> log.info("    파티션 {}: {} 메시지", e.getKey(), e.getValue().get()));

        if (useKey) {
            log.info("  ✅ 키 사용 → 모든 메시지가 같은 파티션으로!");
        } else {
            log.info("  ⚠️ 키 없음 → 메시지가 여러 파티션에 분산됨!");
        }
        log.info("════════════════════════════════════════════════════════════");

        return new SendResult(
            java.util.Map.copyOf(partitionCounts.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                    java.util.Map.Entry::getKey,
                    e -> e.getValue().get()))),
            java.util.List.copyOf(sendOrder),
            useKey
        );
    }

    /**
     * 여러 계좌에 대한 순서 보장 테스트
     */
    public SendResult sendMultiAccountOrderedTransactions(int accountCount, int txPerAccount, boolean useKey, long delayMs) {
        String mode = useKey ? "WITH KEY" : "WITHOUT KEY";
        log.info("════════════════════════════════════════════════════════════");
        log.info("[MULTI-ACCOUNT {}] 다중 계좌 순서 보장 테스트", mode);
        log.info("  계좌 수: {}, 계좌당 거래: {}, 총 거래: {}", accountCount, txPerAccount, accountCount * txPerAccount);
        log.info("════════════════════════════════════════════════════════════");

        // 모든 거래 생성 (계좌별로 순서대로)
        List<BankTransaction> allTransactions = new ArrayList<>();
        for (int acc = 1; acc <= accountCount; acc++) {
            String accountId = String.format("COMPARE-ACC-%03d", acc);
            allTransactions.addAll(createOrderedTransactions(accountId, txPerAccount));
        }

        // ═══════════════════════════════════════════════════════════════
        // 핵심: 실제 상황처럼 여러 계좌의 거래가 섞여서 들어옴
        // 하지만! 전송 순서는 동일하게 유지 (shuffle 결과를 저장해서 재사용)
        // ═══════════════════════════════════════════════════════════════
        java.util.Collections.shuffle(allTransactions, new java.util.Random(12345)); // 고정 시드로 동일한 섞기

        // 전송 결과 추적
        java.util.Map<Integer, java.util.concurrent.atomic.AtomicInteger> partitionCounts =
            new java.util.concurrent.ConcurrentHashMap<>();
        java.util.Map<String, java.util.List<Integer>> accountPartitions =
            new java.util.concurrent.ConcurrentHashMap<>();

        CountDownLatch latch = new CountDownLatch(allTransactions.size());

        for (int i = 0; i < allTransactions.size(); i++) {
            BankTransaction tx = allTransactions.get(i);
            String key = useKey ? tx.accountId() : null;

            kafkaTemplate.send(TOPIC, key, tx.toJson())
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        int partition = result.getRecordMetadata().partition();
                        partitionCounts.computeIfAbsent(partition,
                            k -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                        accountPartitions.computeIfAbsent(tx.accountId(),
                            k -> java.util.Collections.synchronizedList(new java.util.ArrayList<>())).add(partition);
                    }
                    latch.countDown();
                });

            kafkaTemplate.flush();

            if (delayMs > 0 && i < allTransactions.size() - 1) {
                sleep(delayMs);
            }
        }

        waitForCompletion(latch);

        // 계좌별 파티션 분산 분석
        log.info("────────────────────────────────────────────────────────────");
        log.info("[{}] 계좌별 파티션 분배 분석:", mode);

        int accountsWithMultiplePartitions = 0;
        for (var entry : accountPartitions.entrySet().stream()
                .sorted(java.util.Map.Entry.comparingByKey()).toList()) {
            java.util.Set<Integer> uniquePartitions = new java.util.HashSet<>(entry.getValue());
            String status = uniquePartitions.size() == 1 ? "✅ 단일 파티션" : "⚠️ 분산됨!";
            log.info("  {}: 파티션 {} {}", entry.getKey(), uniquePartitions, status);
            if (uniquePartitions.size() > 1) {
                accountsWithMultiplePartitions++;
            }
        }

        if (useKey) {
            log.info("  ✅ 결과: 모든 계좌가 각자 단일 파티션 사용 → 계좌별 순서 보장!");
        } else {
            log.info("  ⚠️ 결과: {}개 계좌가 여러 파티션에 분산 → 순서 문제 발생!", accountsWithMultiplePartitions);
        }
        log.info("════════════════════════════════════════════════════════════");

        return new SendResult(
            java.util.Map.copyOf(partitionCounts.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                    java.util.Map.Entry::getKey,
                    e -> e.getValue().get()))),
            java.util.List.of(),
            useKey
        );
    }

    /**
     * 순서대로 거래 생성 (shuffle 없음!)
     *
     * 거래 패턴:
     * - 홀수 seq: 입금 (1000 * seq)
     * - 짝수 seq: 출금 (1000 * seq)
     *
     * 예: seq 1~5
     * 1. 입금 1000 → 11000
     * 2. 출금 2000 → 9000
     * 3. 입금 3000 → 12000
     * 4. 출금 4000 → 8000
     * 5. 입금 5000 → 13000
     *
     * 최종 기대 잔액: 10000 + 1000 - 2000 + 3000 - 4000 + 5000 = 13000
     */
    private List<BankTransaction> createOrderedTransactions(String accountId, int count) {
        List<BankTransaction> transactions = new ArrayList<>();
        long baseTime = System.currentTimeMillis();

        for (int seq = 1; seq <= count; seq++) {
            String type = (seq % 2 == 1) ? "DEPOSIT" : "WITHDRAW";
            int amount = 1000 * seq;
            transactions.add(new BankTransaction(
                accountId,
                String.format("TX-%s-%03d", accountId, seq),
                type,
                amount,
                seq,
                baseTime + seq
            ));
        }

        return transactions;
    }

    /**
     * 전송 결과 레코드
     */
    public record SendResult(
        java.util.Map<Integer, Integer> partitionDistribution,
        java.util.List<Integer> sendOrder,
        boolean usedKey
    ) {}
}
