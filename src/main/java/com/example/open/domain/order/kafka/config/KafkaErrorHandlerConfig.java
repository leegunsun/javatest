package com.example.open.domain.order.kafka.config;

import com.example.open.domain.order.kafka.handler.KafkaFailureAlertService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;

/**
 * Kafka Consumer 에러 처리 설정
 *
 * 재시도 전략:
 * - 최대 3회 재시도
 * - 지수 백오프: 1초 → 2초 → 4초
 * - 최종 실패 시: DLT 전송 + 로깅 + 알람
 */
@Configuration
public class KafkaErrorHandlerConfig {

    private static final Logger log = LoggerFactory.getLogger(KafkaErrorHandlerConfig.class);

    private final KafkaFailureAlertService alertService;

    public KafkaErrorHandlerConfig(KafkaFailureAlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * Dead Letter Topic Recoverer
     *
     * 최종 실패한 메시지를 원본토픽-dlt로 전송
     * 예: order-events → order-events-dlt
     */
    @Bean
    public DeadLetterPublishingRecoverer deadLetterPublishingRecoverer(
            KafkaTemplate<String, String> kafkaTemplate) {

        return new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, exception) -> {
                    // DLT 토픽명: 원본토픽-dlt
                    String dltTopic = record.topic() + "-dlt";

                    log.error("[DLT] 메시지를 Dead Letter Topic으로 전송: topic={}, partition={}, offset={}, dlt={}",
                            record.topic(), record.partition(), record.offset(), dltTopic);

                    return new org.apache.kafka.common.TopicPartition(dltTopic, record.partition());
                });
    }

    /**
     * 기본 에러 핸들러
     *
     * 재시도 + DLT + 로깅/알람 통합 처리
     */
    @Bean
    public CommonErrorHandler kafkaErrorHandler(
            DeadLetterPublishingRecoverer deadLetterPublishingRecoverer) {

        // 지수 백오프 설정: 1초 시작, 2배씩 증가, 최대 3회
        ExponentialBackOffWithMaxRetries backOff = new ExponentialBackOffWithMaxRetries(3);
        backOff.setInitialInterval(1000L);  // 첫 재시도: 1초 후
        backOff.setMultiplier(2.0);         // 2배씩 증가
        backOff.setMaxInterval(10000L);     // 최대 대기: 10초

        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                (consumerRecord, exception) -> {
                    // DLT 전송
                    deadLetterPublishingRecoverer.accept(consumerRecord, exception);

                    // 로깅 및 알람 처리
                    handleFinalFailure(consumerRecord, exception);
                },
                backOff
        );

        // 재시도 로깅
        errorHandler.setRetryListeners((record, ex, deliveryAttempt) -> {
            log.warn("[Kafka Retry] 재시도 #{}: topic={}, partition={}, offset={}, error={}",
                    deliveryAttempt,
                    record.topic(),
                    record.partition(),
                    record.offset(),
                    ex.getMessage());
        });

        return errorHandler;
    }

    /**
     * 최종 실패 처리: 로깅 + 알람
     */
    private void handleFinalFailure(ConsumerRecord<?, ?> record, Exception exception) {
        // 상세 로깅
        log.error("[Kafka Final Failure] 메시지 처리 최종 실패!");
        log.error("  Topic     : {}", record.topic());
        log.error("  Partition : {}", record.partition());
        log.error("  Offset    : {}", record.offset());
        log.error("  Key       : {}", record.key());
        log.error("  Value     : {}", record.value());
        log.error("  Timestamp : {}", record.timestamp());
        log.error("  Exception : {}", exception.getClass().getSimpleName());
        log.error("  Message   : {}", exception.getMessage());

        // 알람 서비스 호출
        alertService.sendAlert(record, exception);
    }
}
