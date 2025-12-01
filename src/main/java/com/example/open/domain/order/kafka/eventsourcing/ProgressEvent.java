package com.example.open.domain.order.kafka.eventsourcing;

import java.time.Instant;
import java.util.UUID;

/**
 * 진행률 이벤트 (Event Store에 저장되는 불변 이벤트)
 *
 * Event Sourcing 패턴:
 * - 이벤트는 불변(immutable)
 * - 상태 변경은 이벤트로 기록
 * - 이벤트 리플레이로 상태 복구 가능
 */
public record ProgressEvent(
        String eventId,         // 이벤트 고유 ID
        String taskId,          // 작업 ID
        String userId,          // 사용자 ID
        int currentStep,        // 현재 단계
        int totalSteps,         // 전체 단계
        int percentage,         // 진행률 (%)
        String stepName,        // 단계 이름
        EventType eventType,    // 이벤트 타입
        Instant timestamp       // 이벤트 발생 시간
) {
    public enum EventType {
        STARTED,      // 작업 시작
        PROGRESS,     // 진행 중
        COMPLETED,    // 완료
        FAILED        // 실패
    }

    /**
     * 진행 이벤트 생성
     */
    public static ProgressEvent progress(String taskId, String userId, int currentStep, int totalSteps, String stepName) {
        int percentage = (int) ((currentStep / (double) totalSteps) * 100);
        return new ProgressEvent(
                UUID.randomUUID().toString(),
                taskId,
                userId,
                currentStep,
                totalSteps,
                percentage,
                stepName,
                EventType.PROGRESS,
                Instant.now()
        );
    }

    /**
     * 시작 이벤트 생성
     */
    public static ProgressEvent started(String taskId, String userId, int totalSteps) {
        return new ProgressEvent(
                UUID.randomUUID().toString(),
                taskId,
                userId,
                0,
                totalSteps,
                0,
                "시작",
                EventType.STARTED,
                Instant.now()
        );
    }

    /**
     * 완료 이벤트 생성
     */
    public static ProgressEvent completed(String taskId, String userId, int totalSteps) {
        return new ProgressEvent(
                UUID.randomUUID().toString(),
                taskId,
                userId,
                totalSteps,
                totalSteps,
                100,
                "완료",
                EventType.COMPLETED,
                Instant.now()
        );
    }

    /**
     * 실패 이벤트 생성
     */
    public static ProgressEvent failed(String taskId, String userId, String reason) {
        return new ProgressEvent(
                UUID.randomUUID().toString(),
                taskId,
                userId,
                0,
                0,
                0,
                reason,
                EventType.FAILED,
                Instant.now()
        );
    }
}
