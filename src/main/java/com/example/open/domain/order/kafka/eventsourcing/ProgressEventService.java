package com.example.open.domain.order.kafka.eventsourcing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

/**
 * 진행률 이벤트 통합 서비스
 *
 * 메시지 큐 + Event Store + 실시간 전파 패턴 구현
 *
 * 흐름:
 * 1. Kafka Consumer가 메시지 처리
 * 2. 이 서비스를 통해 이벤트 발행
 * 3. Event Store에 저장 (영속성)
 * 4. Broadcaster를 통해 실시간 전파 (SSE)
 */
@Service
public class ProgressEventService {

    private static final Logger log = LoggerFactory.getLogger(ProgressEventService.class);
    private static final long EVENT_TTL_MILLIS = 60 * 60 * 1000L; // 1시간

    private final EventStore eventStore;
    private final EventBroadcaster eventBroadcaster;

    public ProgressEventService(EventStore eventStore, EventBroadcaster eventBroadcaster) {
        this.eventStore = eventStore;
        this.eventBroadcaster = eventBroadcaster;
    }

    // ==================== 이벤트 발행 ====================

    /**
     * 작업 시작 이벤트 발행
     */
    public void publishStarted(String taskId, String userId, int totalSteps) {
        ProgressEvent event = ProgressEvent.started(taskId, userId, totalSteps);
        publishEvent(event);
    }

    /**
     * 진행률 이벤트 발행
     */
    public void publishProgress(String taskId, String userId, int currentStep, int totalSteps, String stepName) {
        ProgressEvent event = ProgressEvent.progress(taskId, userId, currentStep, totalSteps, stepName);
        publishEvent(event);
    }

    /**
     * 완료 이벤트 발행
     */
    public void publishCompleted(String taskId, String userId, int totalSteps) {
        ProgressEvent event = ProgressEvent.completed(taskId, userId, totalSteps);
        publishEvent(event);
    }

    /**
     * 실패 이벤트 발행
     */
    public void publishFailed(String taskId, String userId, String reason) {
        ProgressEvent event = ProgressEvent.failed(taskId, userId, reason);
        publishEvent(event);
    }

    /**
     * 이벤트 발행 (저장 + 전파)
     */
    private void publishEvent(ProgressEvent event) {
        // 1. Event Store에 저장 (영속성)
        eventStore.append(event);

        // 2. 실시간 전파 (SSE 구독자에게)
        eventBroadcaster.publish(event);

        log.info("[ProgressEventService] 이벤트 발행: taskId={}, type={}, {}%",
                event.taskId(), event.eventType(), event.percentage());
    }

    // ==================== 이벤트 조회 ====================

    /**
     * 특정 작업의 현재 상태 조회
     */
    public Optional<ProgressSnapshot> getTaskStatus(String taskId) {
        return eventStore.getSnapshot(taskId);
    }

    /**
     * 특정 작업의 이벤트 히스토리 조회
     */
    public List<ProgressEvent> getTaskHistory(String taskId) {
        return eventStore.getEventsByTaskId(taskId);
    }

    /**
     * 특정 사용자의 모든 작업 이벤트 조회
     */
    public List<ProgressEvent> getUserEvents(String userId) {
        return eventStore.getEventsByUserId(userId);
    }

    /**
     * 특정 작업의 최신 이벤트 조회
     */
    public Optional<ProgressEvent> getLatestEvent(String taskId) {
        return eventStore.getLatestEvent(taskId);
    }

    // ==================== 구독 관리 ====================

    /**
     * 이벤트 구독 (SSE 연결 시 호출)
     */
    public String subscribe(String userId, Consumer<ProgressEvent> listener) {
        return eventBroadcaster.subscribe(userId, listener);
    }

    /**
     * 구독 취소 (SSE 연결 종료 시 호출)
     */
    public void unsubscribe(String subscriptionId) {
        eventBroadcaster.unsubscribe(subscriptionId);
    }

    // ==================== 정리 작업 ====================

    /**
     * 오래된 이벤트 정리 (1시간마다 실행)
     */
    @Scheduled(fixedRate = 3600000) // 1시간
    public void cleanupOldEvents() {
        log.info("[ProgressEventService] 오래된 이벤트 정리 시작");
        eventStore.cleanup(EVENT_TTL_MILLIS);
    }
}
