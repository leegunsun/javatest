package com.example.open.domain.order.kafka.consumer;

import com.example.open.domain.order.kafka.dto.OrderRequest;
import com.example.open.domain.order.kafka.service.TaskProgressService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/**
 * Order 이벤트 Consumer
 *
 * kafkaListenerContainerFactory를 사용하여 자동으로:
 * - 재시도 (3회, 지수 백오프)
 * - 실패 시 DLT 전송
 * - 로깅 및 알람
 *
 * 4단계 진행률:
 * 1. 주문 검증 (25%)
 * 2. 재고 확인 (50%)
 * 3. 결제 처리 (75%)
 * 4. 주문 완료 (100%)
 */
@Service
public class OrderConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderConsumer.class);
    private static final int TOTAL_STEPS = 4;

    private final TaskProgressService taskProgressService;
    private final ObjectMapper objectMapper;

    public OrderConsumer(TaskProgressService taskProgressService, ObjectMapper objectMapper) {
        this.taskProgressService = taskProgressService;
        this.objectMapper = objectMapper;
    }

    /**
     * containerFactory를 명시하지 않으면 기본 kafkaListenerContainerFactory 사용
     * → KafkaConsumerConfig에서 설정한 에러 핸들러가 자동 적용됨
     */
    @KafkaListener(topics = "order-events", groupId = "order-group")
    public void processOrder(ConsumerRecord<String, String> record) {
        log.info("========================================");
        log.info("[Order Consumer] Message Received!");
        log.info("  Topic     : {}", record.topic());
        log.info("  Partition : {}", record.partition());
        log.info("  Offset    : {}", record.offset());
        log.info("  Key       : {}", record.key());
        log.info("  Value     : {}", record.value());
        log.info("  Timestamp : {}", record.timestamp());
        log.info("========================================");

        // 비즈니스 로직 처리
        processOrderMessage(record.value());
    }

    /**
     * 주문 메시지 처리 로직 (4단계 진행률 업데이트)
     */
    private void processOrderMessage(String message) {
        OrderRequest order;
        try {
            order = objectMapper.readValue(message, OrderRequest.class);
        } catch (JsonProcessingException e) {
            log.error("[Order Consumer] JSON 파싱 실패: {}", message, e);
            throw new RuntimeException("주문 파싱 실패: " + message, e);
        }

        String taskId = order.taskId();
        String userId = order.userId();

        try {
            // Step 1: 주문 검증 (25%)
            taskProgressService.updateProgress(taskId, userId, 1, TOTAL_STEPS, "주문 검증");
            validateOrder(order);
            simulateProcessingTime(500);

            // Step 2: 재고 확인 (50%)
            taskProgressService.updateProgress(taskId, userId, 2, TOTAL_STEPS, "재고 확인");
            checkInventory(order);
            simulateProcessingTime(500);

            // Step 3: 결제 처리 (75%)
            taskProgressService.updateProgress(taskId, userId, 3, TOTAL_STEPS, "결제 처리");
            processPayment(order);
            simulateProcessingTime(500);

            // Step 4: 주문 완료 (100%)
            taskProgressService.complete(taskId, userId);
            log.info("[Order Consumer] 주문 처리 완료: taskId={}, orderId={}", taskId, order.orderId());

        } catch (Exception e) {
            taskProgressService.fail(taskId, userId, e.getMessage());
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
        // 실제로는 재고 서비스 호출
    }

    private void processPayment(OrderRequest order) {
        log.info("[Step 3] 결제 처리: orderId={}", order.orderId());
        // 실제로는 결제 서비스 호출
    }

    private void simulateProcessingTime(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
