package com.example.open.domain.order.kafka.handler;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Dead Letter Topic 메시지 처리기
 *
 * DLT에 도착한 실패 메시지를 처리:
 * - 로깅 (분석용)
 * - DB 저장 (나중에 재처리용)
 * - 모니터링 대시보드 연동
 */
@Component
public class DltHandler {

    private static final Logger log = LoggerFactory.getLogger(DltHandler.class);

    /**
     * order-events DLT 처리
     */
    @KafkaListener(
            topics = "order-events-dlt",
            groupId = "dlt-handler-group"
    )
    public void handleOrderEventsDlt(ConsumerRecord<String, String> record) {
        handleDltMessage(record);
    }

    /**
     * DLT 메시지 공통 처리 로직
     */
    private void handleDltMessage(ConsumerRecord<String, String> record) {
        log.warn("┌─────────────────────────────────────────────────────────────┐");
        log.warn("│            DEAD LETTER TOPIC MESSAGE RECEIVED               │");
        log.warn("├─────────────────────────────────────────────────────────────┤");
        log.warn("│ DLT Topic   : {}", record.topic());
        log.warn("│ Partition   : {}", record.partition());
        log.warn("│ Offset      : {}", record.offset());
        log.warn("│ Key         : {}", record.key());
        log.warn("│ Value       : {}", record.value());
        log.warn("│ Timestamp   : {}", record.timestamp());
        log.warn("└─────────────────────────────────────────────────────────────┘");

        // TODO: 실패 메시지 DB 저장 (나중에 재처리 또는 분석용)
        // failedMessageRepository.save(FailedMessage.from(record));

        // TODO: 메트릭 증가
        // dltMessageCounter.labels(record.topic()).inc();
    }
}
