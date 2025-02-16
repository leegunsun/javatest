package com.example.open.domain.order.kafka.service;

import com.example.open.domain.order.kafka.entity.Order;
import com.example.open.domain.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public void saveOrder(String orderId) {
        Order order = new Order(orderId, "PENDING");
        orderRepository.save(order);
        System.out.println("✅ 주문 저장 완료: " + orderId);
    }
}