package com.example.open.domain.order.kafka.demo;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================
 * 순서 보장 데모 Kafka 설정
 * ============================================================
 *
 * 핵심 포인트:
 * - 3개 파티션: 병렬 처리 가능, 순서 문제 발생 가능
 * - 3개 Consumer: 각 파티션을 독립적으로 처리
 *
 * 이 설정이 순서 문제를 재현하는 이유:
 * - 파티션이 여러 개면 메시지가 분산될 수 있음
 * - 분산된 메시지는 다른 Consumer가 처리
 * - 처리 속도 차이로 순서가 뒤바뀔 수 있음
 */
@Configuration
public class OrderingDemoConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    /**
     * ============================================================
     * 데모용 토픽 (3개 파티션)
     * ============================================================
     *
     * 파티션 3개인 이유:
     * - 병렬 처리를 통해 순서 문제가 발생할 수 있는 환경 구성
     * - 키 없이 전송하면 라운드로빈으로 분산
     * - 키와 함께 전송하면 같은 파티션에 집중
     */
    @Bean
    public NewTopic orderingDemoTopic() {
        return TopicBuilder.name("ordering-demo-topic")
            .partitions(3)   // 3개 파티션 → 순서 문제 발생 가능
            .replicas(1)
            .build();
    }

    /**
     * ============================================================
     * Consumer Factory
     * ============================================================
     */
    @Bean
    public ConsumerFactory<String, String> orderingDemoConsumerFactory() {
        Map<String, Object> props = new HashMap<>();

        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ordering-demo-group");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        // 빠른 리밸런싱을 위한 설정
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3000);

        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * ============================================================
     * Listener Container Factory (3개 Consumer)
     * ============================================================
     *
     * concurrency=3인 이유:
     * - 각 파티션을 별도 Consumer가 처리
     * - 파티션 간 처리 순서가 다를 수 있음
     * - 이것이 순서 문제의 원인!
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> orderingDemoListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(orderingDemoConsumerFactory());
        factory.setConcurrency(3);  // 3개 Consumer 스레드
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        return factory;
    }
}
