package com.example.open.domain.order.controller;

import com.example.open.domain.order.kafka.producer.OrderProducer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderProducer orderProducer;

    public OrderController(OrderProducer orderProducer) {
        this.orderProducer = orderProducer;
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
