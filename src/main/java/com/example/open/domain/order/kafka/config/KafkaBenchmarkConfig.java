package com.example.open.domain.order.kafka.config;

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
 * Kafka Benchmark Configuration
 * ============================================================
 *
 * Consumer Group과 파티션의 이점을 시연하기 위한 Kafka 설정
 *
 * 핵심 개념:
 * 1. 파티션(Partition): 토픽을 여러 조각으로 나눠 병렬 처리 가능
 * 2. Consumer Group: 같은 그룹의 Consumer들이 파티션을 나눠 처리
 * 3. 리밸런싱: Consumer 추가/제거 시 파티션 자동 재할당
 *
 * 이 설정에서는:
 * - 3개 파티션을 가진 benchmark-topic 생성
 * - Consumer Group 기반 병렬 처리 설정
 * - 수동 커밋으로 정확한 처리 시간 측정
 */
@Configuration
public class KafkaBenchmarkConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    /**
     * ============================================================
     * 벤치마크용 토픽 생성 (3개 파티션)
     * ============================================================
     *
     * 파티션 수 = 최대 병렬 Consumer 수
     *
     * 예시:
     * - 파티션 3개, Consumer 1개 → 1개 Consumer가 3개 파티션 모두 처리
     * - 파티션 3개, Consumer 3개 → 각 Consumer가 1개 파티션씩 처리 (최적)
     * - 파티션 3개, Consumer 5개 → 2개 Consumer는 유휴 상태
     */
    @Bean
    public NewTopic benchmarkTopic() {
        return TopicBuilder.name("benchmark-topic")
                .partitions(3)           // 3개 파티션으로 병렬 처리 가능
                .replicas(1)             // 단일 노드이므로 복제본 1개
                .build();
    }

    /**
     * ============================================================
     * Consumer Factory 설정
     * ============================================================
     *
     * 벤치마크를 위한 Consumer 설정:
     * - 수동 커밋: 정확한 처리 완료 시점 제어
     * - 세션 타임아웃: 빠른 리밸런싱을 위해 10초로 설정
     * - 하트비트 간격: 3초마다 Coordinator에게 생존 신호 전송
     */
    @Bean
    public ConsumerFactory<String, String> benchmarkConsumerFactory() {
        Map<String, Object> props = new HashMap<>();

        // 기본 연결 설정
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        // Consumer Group 설정
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "benchmark-group");

        // 오프셋 설정 - earliest: 토픽의 처음부터 읽기
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        // 수동 커밋 설정 - 정확한 처리 완료 시점 측정
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        // 리밸런싱 관련 설정
        // session.timeout.ms: Consumer가 죽었다고 판단하는 시간
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10000);
        // heartbeat.interval.ms: Coordinator에게 생존 신호 전송 간격
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3000);

        // 한 번에 가져올 최대 레코드 수
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);

        // Consumer 인스턴스 식별을 위한 클라이언트 ID 패턴
        props.put(ConsumerConfig.CLIENT_ID_CONFIG, "benchmark-consumer");

        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * ============================================================
     * Kafka Listener Container Factory
     * ============================================================
     *
     * ConcurrentKafkaListenerContainerFactory 설정:
     * - concurrency: 하나의 @KafkaListener가 생성할 Consumer 스레드 수
     * - AckMode.MANUAL: 수동 커밋으로 정확한 처리 제어
     *
     * 중요: concurrency 값은 파티션 수를 초과해도 의미 없음
     * 예: 파티션 3개일 때 concurrency=5 → 실제 활성 Consumer는 3개
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> benchmarkListenerFactory(
            ConsumerFactory<String, String> benchmarkConsumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(benchmarkConsumerFactory);

        // concurrency: 동시에 실행될 Consumer 스레드 수
        // 이 값을 변경하여 Consumer 1개 vs 3개 성능 비교 가능
        factory.setConcurrency(3);

        // 수동 커밋 모드 설정
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        return factory;
    }

    /**
     * ============================================================
     * 단일 Consumer Factory (비교 테스트용)
     * ============================================================
     *
     * Consumer 1개만 사용하는 설정으로 성능 비교용
     * - 모든 파티션을 단일 Consumer가 순차 처리
     * - 병렬 처리 없음 → 처리 시간 증가
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> singleConsumerFactory(
            ConsumerFactory<String, String> benchmarkConsumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(benchmarkConsumerFactory);
        factory.setConcurrency(1);  // 단일 Consumer
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        return factory;
    }
}
