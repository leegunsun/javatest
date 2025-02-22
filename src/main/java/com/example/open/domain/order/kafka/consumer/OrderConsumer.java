package com.example.open.domain.order.kafka.consumer;

import com.example.open.domain.order.kafka.service.OrderService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class OrderConsumer {
//    private final OrderService orderService;
//
//    public OrderConsumer(OrderService orderService) {
//        this.orderService = orderService;
//    }
//
//    @KafkaListener(topics = "order-events", groupId = "order-group")
//    public void processOrder(String orderId) {
//        System.out.println("🛒 주문 처리 중: " + orderId);
//        orderService.saveOrder(orderId);
//    }
}