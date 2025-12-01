package com.example.open.domain.order.kafka.eventsourcing;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Event Sourcing 설정
 *
 * - Kafka 토픽 생성 (order-events-v2)
 * - 스케줄링 활성화 (이벤트 정리용)
 */
@Configuration
@EnableScheduling
public class EventSourcingConfig {

    /**
     * Event Sourcing 버전용 Kafka 토픽
     */
    @Bean
    public NewTopic orderEventsV2Topic() {
        return TopicBuilder.name("order-events-v2")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
