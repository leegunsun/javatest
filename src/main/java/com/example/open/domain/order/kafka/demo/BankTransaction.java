package com.example.open.domain.order.kafka.demo;

/**
 * ============================================================
 * 은행 거래 레코드
 * ============================================================
 *
 * 순서 보장이 왜 중요한지 보여주기 위한 예제
 *
 * 시나리오: 한 계좌에서 여러 거래가 발생
 * - 입금, 출금이 순서대로 처리되어야 잔액이 정확함
 * - 순서가 뒤바뀌면 "잔액 부족" 오류 또는 잘못된 잔액 발생
 */
public record BankTransaction(
    String accountId,      // 계좌 번호 (이것이 Kafka Key가 됨)
    String transactionId,  // 거래 고유 ID
    String type,           // DEPOSIT(입금) or WITHDRAW(출금)
    int amount,            // 거래 금액
    int sequence,          // 거래 순서 (1, 2, 3...)
    long timestamp         // 발생 시간
) {

    public String toJson() {
        return String.format(
            "{\"accountId\":\"%s\",\"transactionId\":\"%s\",\"type\":\"%s\",\"amount\":%d,\"sequence\":%d,\"timestamp\":%d}",
            accountId, transactionId, type, amount, sequence, timestamp
        );
    }

    public static BankTransaction fromJson(String json) {
        // 간단한 파싱 (실제로는 Jackson 사용)
        String accountId = extractValue(json, "accountId");
        String transactionId = extractValue(json, "transactionId");
        String type = extractValue(json, "type");
        int amount = Integer.parseInt(extractValue(json, "amount"));
        int sequence = Integer.parseInt(extractValue(json, "sequence"));
        long timestamp = Long.parseLong(extractValue(json, "timestamp"));

        return new BankTransaction(accountId, transactionId, type, amount, sequence, timestamp);
    }

    private static String extractValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int startIndex = json.indexOf(searchKey) + searchKey.length();

        if (json.charAt(startIndex) == '"') {
            // String value
            startIndex++;
            int endIndex = json.indexOf('"', startIndex);
            return json.substring(startIndex, endIndex);
        } else {
            // Numeric value
            int endIndex = startIndex;
            while (endIndex < json.length() &&
                   (Character.isDigit(json.charAt(endIndex)) || json.charAt(endIndex) == '-')) {
                endIndex++;
            }
            return json.substring(startIndex, endIndex);
        }
    }
}
