package com.example.open.domain.order.kafka.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class OrderProducer {
    private static final Logger log = LoggerFactory.getLogger(OrderProducer.class);
    private static final String ORDER_TOPIC = "order-events";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public OrderProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrder(String orderId) {
        CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(ORDER_TOPIC, orderId);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("[KRaft] Order event published: {} | partition: {} | offset: {}",
                    orderId,
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
            } else {
                log.error("[KRaft] Failed to publish order event: {}", orderId, ex);
            }
        });
    }

    public void sendOrderWithKey(String key, String orderId) {
        kafkaTemplate.send(ORDER_TOPIC, key, orderId)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("[KRaft] Order event published with key: {} -> {}", key, orderId);
                } else {
                    log.error("[KRaft] Failed to publish order event with key: {} -> {}", key, orderId, ex);
                }
            });
    }
}
