package com.example.open.domain.order.kafka.eventsourcing;

import java.time.Instant;

/**
 * 진행률 스냅샷 (이벤트 리플레이 결과)
 *
 * Event Store의 이벤트들을 리플레이하여 현재 상태를 나타냄
 */
public record ProgressSnapshot(
        String taskId,
        String userId,
        int currentStep,
        int totalSteps,
        int percentage,
        String stepName,
        ProgressEvent.EventType status,
        Instant startedAt,
        Instant updatedAt,
        int eventCount       // 총 이벤트 수
) {
    /**
     * 이벤트 목록으로부터 스냅샷 생성 (리플레이)
     */
    public static ProgressSnapshot fromEvents(java.util.List<ProgressEvent> events) {
        if (events == null || events.isEmpty()) {
            return null;
        }

        ProgressEvent first = events.get(0);
        ProgressEvent last = events.get(events.size() - 1);

        return new ProgressSnapshot(
                last.taskId(),
                last.userId(),
                last.currentStep(),
                last.totalSteps(),
                last.percentage(),
                last.stepName(),
                last.eventType(),
                first.timestamp(),
                last.timestamp(),
                events.size()
        );
    }
}
