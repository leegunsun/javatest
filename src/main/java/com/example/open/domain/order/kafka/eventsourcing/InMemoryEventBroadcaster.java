package com.example.open.domain.order.kafka.eventsourcing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * 인메모리 이벤트 브로드캐스터
 *
 * 단일 서버용 구현체
 * - 같은 JVM 내의 구독자에게만 이벤트 전파
 *
 * 다중 서버 환경에서는 RedisEventBroadcaster 사용 권장
 */
@Component
public class InMemoryEventBroadcaster implements EventBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(InMemoryEventBroadcaster.class);

    // subscriptionId -> Subscription 정보
    private final Map<String, Subscription> subscriptions = new ConcurrentHashMap<>();

    // userId -> subscriptionId 목록 (빠른 조회용)
    private final Map<String, Set<String>> subscriptionsByUser = new ConcurrentHashMap<>();

    @Override
    public void publish(ProgressEvent event) {
        String userId = event.userId();
        Set<String> userSubscriptions = subscriptionsByUser.get(userId);

        if (userSubscriptions == null || userSubscriptions.isEmpty()) {
            log.debug("[Broadcaster] 구독자 없음: userId={}", userId);
            return;
        }

        int deliveredCount = 0;
        for (String subscriptionId : userSubscriptions) {
            Subscription subscription = subscriptions.get(subscriptionId);
            if (subscription != null) {
                try {
                    subscription.listener().accept(event);
                    deliveredCount++;
                } catch (Exception e) {
                    log.error("[Broadcaster] 이벤트 전달 실패: subscriptionId={}", subscriptionId, e);
                    // 실패한 구독 제거
                    unsubscribe(subscriptionId);
                }
            }
        }

        log.debug("[Broadcaster] 이벤트 전파 완료: userId={}, 구독자 수={}", userId, deliveredCount);
    }

    @Override
    public String subscribe(String userId, Consumer<ProgressEvent> listener) {
        String subscriptionId = UUID.randomUUID().toString();

        Subscription subscription = new Subscription(subscriptionId, userId, listener);
        subscriptions.put(subscriptionId, subscription);

        subscriptionsByUser.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                .add(subscriptionId);

        log.info("[Broadcaster] 구독 등록: userId={}, subscriptionId={}", userId, subscriptionId);
        return subscriptionId;
    }

    @Override
    public void unsubscribe(String subscriptionId) {
        Subscription subscription = subscriptions.remove(subscriptionId);
        if (subscription != null) {
            Set<String> userSubscriptions = subscriptionsByUser.get(subscription.userId());
            if (userSubscriptions != null) {
                userSubscriptions.remove(subscriptionId);
                if (userSubscriptions.isEmpty()) {
                    subscriptionsByUser.remove(subscription.userId());
                }
            }
            log.info("[Broadcaster] 구독 취소: userId={}, subscriptionId={}", subscription.userId(), subscriptionId);
        }
    }

    /**
     * 현재 구독자 수 (모니터링용)
     */
    public int getSubscriptionCount() {
        return subscriptions.size();
    }

    /**
     * 구독 정보
     */
    private record Subscription(
            String subscriptionId,
            String userId,
            Consumer<ProgressEvent> listener
    ) {}
}
