package com.example.open.domain.order.kafka.handler;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Kafka 메시지 처리 실패 시 알람 서비스
 *
 * 확장 포인트:
 * - Slack 웹훅 연동
 * - Email 발송
 * - SMS 알림
 * - PagerDuty 연동
 * - 모니터링 시스템 (Prometheus, Grafana) 메트릭 전송
 */
@Service
public class KafkaFailureAlertService {

    private static final Logger log = LoggerFactory.getLogger(KafkaFailureAlertService.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 알람 전송 메인 메서드
     */
    public void sendAlert(ConsumerRecord<?, ?> record, Exception exception) {
        KafkaFailureAlert alert = buildAlert(record, exception);

        // 1. 구조화된 로그 출력 (ELK, CloudWatch 등에서 검색 용이)
        logStructuredAlert(alert);

        // 2. 알람 채널로 전송 (확장 포인트)
        sendToAlertChannels(alert);
    }

    /**
     * 알람 객체 생성
     */
    private KafkaFailureAlert buildAlert(ConsumerRecord<?, ?> record, Exception exception) {
        LocalDateTime timestamp = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(record.timestamp()),
                ZoneId.systemDefault()
        );

        return new KafkaFailureAlert(
                record.topic(),
                record.partition(),
                record.offset(),
                String.valueOf(record.key()),
                String.valueOf(record.value()),
                timestamp,
                exception.getClass().getSimpleName(),
                exception.getMessage(),
                getStackTraceSummary(exception)
        );
    }

    /**
     * 구조화된 로그 출력
     */
    private void logStructuredAlert(KafkaFailureAlert alert) {
        log.error("┌─────────────────────────────────────────────────────────────┐");
        log.error("│              KAFKA MESSAGE PROCESSING FAILED                │");
        log.error("├─────────────────────────────────────────────────────────────┤");
        log.error("│ Topic       : {}", alert.topic());
        log.error("│ Partition   : {}", alert.partition());
        log.error("│ Offset      : {}", alert.offset());
        log.error("│ Key         : {}", alert.key());
        log.error("│ Timestamp   : {}", alert.messageTimestamp().format(FORMATTER));
        log.error("├─────────────────────────────────────────────────────────────┤");
        log.error("│ Exception   : {}", alert.exceptionType());
        log.error("│ Message     : {}", alert.exceptionMessage());
        log.error("├─────────────────────────────────────────────────────────────┤");
        log.error("│ Value       : {}", truncate(alert.value(), 100));
        log.error("├─────────────────────────────────────────────────────────────┤");
        log.error("│ Stack Trace : {}", alert.stackTraceSummary());
        log.error("└─────────────────────────────────────────────────────────────┘");
    }

    /**
     * 알람 채널로 전송 (확장 포인트)
     *
     * TODO: 실제 프로덕션에서는 아래 채널 중 선택하여 구현
     */
    private void sendToAlertChannels(KafkaFailureAlert alert) {
        // Slack 웹훅 예시 (주석 해제하여 사용)
        // sendSlackAlert(alert);

        // Email 알람 예시
        // sendEmailAlert(alert);

        // Prometheus 메트릭 증가 예시
        // kafkaFailureCounter.labels(alert.topic()).inc();

        log.info("[Alert] 알람이 전송되었습니다. (현재: 로그만 출력)");
    }

    /**
     * Slack 웹훅 전송 예시 (RestTemplate/WebClient 사용)
     */
    // private void sendSlackAlert(KafkaFailureAlert alert) {
    //     String webhookUrl = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL";
    //     String message = String.format(
    //         ":rotating_light: *Kafka 메시지 처리 실패*\n" +
    //         "• Topic: `%s`\n" +
    //         "• Partition: %d, Offset: %d\n" +
    //         "• Error: %s\n" +
    //         "• Time: %s",
    //         alert.topic(), alert.partition(), alert.offset(),
    //         alert.exceptionMessage(),
    //         alert.messageTimestamp().format(FORMATTER)
    //     );
    //     // restTemplate.postForEntity(webhookUrl, new SlackMessage(message), String.class);
    // }

    private String getStackTraceSummary(Exception exception) {
        StackTraceElement[] stackTrace = exception.getStackTrace();
        if (stackTrace.length > 0) {
            StackTraceElement element = stackTrace[0];
            return String.format("%s.%s(%s:%d)",
                    element.getClassName(),
                    element.getMethodName(),
                    element.getFileName(),
                    element.getLineNumber());
        }
        return "Unknown";
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "null";
        if (value.length() <= maxLength) return value;
        return value.substring(0, maxLength) + "...";
    }

    /**
     * 알람 정보 레코드
     */
    public record KafkaFailureAlert(
            String topic,
            int partition,
            long offset,
            String key,
            String value,
            LocalDateTime messageTimestamp,
            String exceptionType,
            String exceptionMessage,
            String stackTraceSummary
    ) {}
}
