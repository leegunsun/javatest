package com.example.open.domain.order.kafka.dto;

public record OrderRequest(
        String taskId,
        String userId,
        String orderId,
        String productName,
        int quantity
) {
}
