package com.example.open.domain.order.kafka.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class OrderConsumer {

    @KafkaListener(topics = "order-events", groupId = "order-group")
    public void processOrder(ConsumerRecord<String, String> record) {
        System.out.println("========================================");
        System.out.println("[KRaft Consumer] Message Received!");
        System.out.println("  Topic     : " + record.topic());
        System.out.println("  Partition : " + record.partition());
        System.out.println("  Offset    : " + record.offset());
        System.out.println("  Key       : " + record.key());
        System.out.println("  Value     : " + record.value());
        System.out.println("  Timestamp : " + record.timestamp());
        System.out.println("========================================");
    }
}
