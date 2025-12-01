package com.example.open.domain.order.kafka.eventsourcing;

import java.util.List;
import java.util.Optional;

/**
 * Event Store 인터페이스
 *
 * 구현체:
 * - InMemoryEventStore: 학습/테스트용
 * - RedisEventStore: 프로덕션용 (다중 서버 지원)
 * - JpaEventStore: 영구 저장 필요 시
 */
public interface EventStore {

    /**
     * 이벤트 저장
     */
    void append(ProgressEvent event);

    /**
     * 특정 작업의 모든 이벤트 조회 (시간순)
     */
    List<ProgressEvent> getEventsByTaskId(String taskId);

    /**
     * 특정 사용자의 모든 이벤트 조회
     */
    List<ProgressEvent> getEventsByUserId(String userId);

    /**
     * 특정 작업의 최신 이벤트 조회
     */
    Optional<ProgressEvent> getLatestEvent(String taskId);

    /**
     * 특정 작업의 현재 상태 조회 (이벤트 리플레이)
     */
    Optional<ProgressSnapshot> getSnapshot(String taskId);

    /**
     * 오래된 이벤트 정리 (TTL)
     */
    void cleanup(long ttlMillis);
}
