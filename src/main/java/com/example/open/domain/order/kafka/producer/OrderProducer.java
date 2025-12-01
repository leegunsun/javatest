package com.example.open.domain.order.kafka.producer;

import com.example.open.domain.order.kafka.dto.OrderRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class OrderProducer {
    private static final Logger log = LoggerFactory.getLogger(OrderProducer.class);
    private static final String ORDER_TOPIC = "order-events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public OrderProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 주문 요청 전송 (진행률 추적 지원)
     *
     * @return taskId (프론트엔드에서 진행률 추적에 사용)
     */
    public String sendOrderRequest(String userId, String orderId, String productName, int quantity) {
        String taskId = UUID.randomUUID().toString();
        OrderRequest request = new OrderRequest(taskId, userId, orderId, productName, quantity);

        try {
            String message = objectMapper.writeValueAsString(request);
            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(ORDER_TOPIC, userId, message);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("[KRaft] Order request published: taskId={} | userId={} | partition={} | offset={}",
                            taskId, userId,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                } else {
                    log.error("[KRaft] Failed to publish order request: taskId={}", taskId, ex);
                }
            });

            return taskId;
        } catch (JsonProcessingException e) {
            log.error("[KRaft] Failed to serialize order request", e);
            throw new RuntimeException("주문 요청 직렬화 실패", e);
        }
    }

    // 기존 메서드 유지 (하위 호환성)
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
