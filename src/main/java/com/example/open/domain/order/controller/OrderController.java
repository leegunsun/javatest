package com.example.open.domain.order.controller;

import com.example.open.domain.order.kafka.producer.OrderProducer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Tag(name = "Order", description = "주문 API")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderProducer orderProducer;

    public OrderController(OrderProducer orderProducer) {
        this.orderProducer = orderProducer;
    }

    /**
     * 주문 생성 (SSE 진행률 추적 지원)
     */
    @Operation(summary = "주문 생성", description = "주문을 생성하고 taskId를 반환합니다. SSE로 진행률을 추적할 수 있습니다.")
    @PostMapping
    public ResponseEntity<Map<String, String>> createOrder(
            @RequestParam String userId,
            @RequestParam String productName,
            @RequestParam int quantity
    ) {
        String orderId = "ORDER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String taskId = orderProducer.sendOrderRequest(userId, orderId, productName, quantity);

        return ResponseEntity.ok(Map.of(
                "taskId", taskId,
                "orderId", orderId,
                "message", "주문이 접수되었습니다. SSE를 통해 진행률을 확인하세요."
        ));
    }

    /**
     * KRaft 모드 테스트용 엔드포인트
     * 주문 이벤트를 Kafka로 발행
     */
    @PostMapping("/kafka/test")
    public ResponseEntity<Map<String, String>> testKafkaKraft(@RequestBody(required = false) Map<String, String> request) {
        String orderId = (request != null && request.containsKey("orderId"))
            ? request.get("orderId")
            : "ORDER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        orderProducer.sendOrder(orderId);

        return ResponseEntity.ok(Map.of(
            "status", "sent",
            "orderId", orderId,
            "topic", "order-events",
            "mode", "KRaft"
        ));
    }

    /**
     * 여러 주문 이벤트 발행 테스트
     */
    @PostMapping("/kafka/test/batch")
    public ResponseEntity<Map<String, Object>> testKafkaBatch(@RequestParam(defaultValue = "5") int count) {
        for (int i = 0; i < count; i++) {
            String orderId = "ORDER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            orderProducer.sendOrder(orderId);
        }

        return ResponseEntity.ok(Map.of(
            "status", "sent",
            "count", count,
            "topic", "order-events",
            "mode", "KRaft"
        ));
    }
}
