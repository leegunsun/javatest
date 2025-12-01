package com.example.open.domain.order.kafka.eventsourcing;

import java.util.function.Consumer;

/**
 * 이벤트 브로드캐스터 인터페이스
 *
 * 이벤트를 구독자들에게 실시간으로 전파
 *
 * 구현체:
 * - InMemoryEventBroadcaster: 단일 서버용
 * - RedisEventBroadcaster: 다중 서버용 (Redis Pub/Sub)
 */
public interface EventBroadcaster {

    /**
     * 이벤트 발행 (모든 구독자에게 전파)
     */
    void publish(ProgressEvent event);

    /**
     * 특정 사용자의 이벤트 구독
     *
     * @param userId 구독할 사용자 ID
     * @param listener 이벤트 수신 시 호출될 콜백
     * @return 구독 ID (구독 취소 시 사용)
     */
    String subscribe(String userId, Consumer<ProgressEvent> listener);

    /**
     * 구독 취소
     *
     * @param subscriptionId 구독 ID
     */
    void unsubscribe(String subscriptionId);
}
