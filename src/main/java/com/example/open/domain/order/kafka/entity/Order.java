package com.example.open.domain.order.kafka.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    private String id;
    private String status;

    protected Order() {}  // JPA 기본 생성자

    public Order(String id, String status) {
        this.id = id;
        this.status = status;
    }
}

