package com.example.open.domain.order.kafka.consumer;

import com.example.open.domain.order.kafka.dto.OrderRequest;
import com.example.open.domain.order.kafka.eventsourcing.ProgressEventService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/**
 * Order Consumer V2 (Event Sourcing 버전)
 *
 * 메시지 큐 + Event Store + 실시간 전파 패턴 적용
 *
 * 흐름:
 * 1. Kafka에서 메시지 수신
 * 2. ProgressEventService를 통해 이벤트 발행
 *    - Event Store에 저장 (영속성, 히스토리)
 *    - Broadcaster를 통해 SSE 구독자에게 전파
 *
 * 기존 OrderConsumer와의 차이:
 * - 직접 SSE 전송 대신 Event Sourcing 패턴 사용
 * - 이벤트 히스토리 조회 가능
 * - 재접속 시 상태 복구 가능
 * - 다중 서버 환경 확장 용이
 */
@Service
public class OrderConsumerV2 {

    private static final Logger log = LoggerFactory.getLogger(OrderConsumerV2.class);
    private static final int TOTAL_STEPS = 4;

    private final ProgressEventService progressEventService;
    private final ObjectMapper objectMapper;

    public OrderConsumerV2(ProgressEventService progressEventService, ObjectMapper objectMapper) {
        this.progressEventService = progressEventService;
        this.objectMapper = objectMapper;
    }

    /**
     * 주문 이벤트 처리 (Event Sourcing 버전)
     *
     * 토픽: order-events-v2
     * 그룹: order-group-v2
     */
    @KafkaListener(topics = "order-events-v2", groupId = "order-group-v2")
    public void processOrder(ConsumerRecord<String, String> record) {
        log.info("========================================");
        log.info("[OrderConsumerV2] Message Received!");
        log.info("  Topic     : {}", record.topic());
        log.info("  Partition : {}", record.partition());
        log.info("  Offset    : {}", record.offset());
        log.info("  Key       : {}", record.key());
        log.info("  Value     : {}", record.value());
        log.info("========================================");

        processOrderMessage(record.value());
    }

    /**
     * 주문 메시지 처리 (4단계)
     */
    private void processOrderMessage(String message) {
        OrderRequest order;
        try {
            order = objectMapper.readValue(message, OrderRequest.class);
        } catch (JsonProcessingException e) {
            log.error("[OrderConsumerV2] JSON 파싱 실패: {}", message, e);
            throw new RuntimeException("주문 파싱 실패: " + message, e);
        }

        String taskId = order.taskId();
        String userId = order.userId();

        try {
            // 작업 시작 이벤트
            progressEventService.publishStarted(taskId, userId, TOTAL_STEPS);

            // Step 1: 주문 검증 (25%)
            progressEventService.publishProgress(taskId, userId, 1, TOTAL_STEPS, "주문 검증");
            validateOrder(order);
            simulateProcessingTime(500);

            // Step 2: 재고 확인 (50%)
            progressEventService.publishProgress(taskId, userId, 2, TOTAL_STEPS, "재고 확인");
            checkInventory(order);
            simulateProcessingTime(500);

            // Step 3: 결제 처리 (75%)
            progressEventService.publishProgress(taskId, userId, 3, TOTAL_STEPS, "결제 처리");
            processPayment(order);
            simulateProcessingTime(500);

            // Step 4: 완료 (100%)
            progressEventService.publishCompleted(taskId, userId, TOTAL_STEPS);
            log.info("[OrderConsumerV2] 주문 처리 완료: taskId={}, orderId={}", taskId, order.orderId());

        } catch (Exception e) {
            progressEventService.publishFailed(taskId, userId, e.getMessage());
            throw e;
        }
    }

    private void validateOrder(OrderRequest order) {
        log.info("[Step 1] 주문 검증: orderId={}", order.orderId());
        if (order.quantity() <= 0) {
            throw new RuntimeException("유효하지 않은 수량: " + order.quantity());
        }
    }

    private void checkInventory(OrderRequest order) {
        log.info("[Step 2] 재고 확인: productName={}, quantity={}", order.productName(), order.quantity());
    }

    private void processPayment(OrderRequest order) {
        log.info("[Step 3] 결제 처리: orderId={}", order.orderId());
    }

    private void simulateProcessingTime(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
