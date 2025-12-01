package com.example.open.domain.order.kafka.eventsourcing;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SSE 연결 관리자
 *
 * Event Sourcing 패턴과 SSE를 연결하는 어댑터
 *
 * 책임:
 * 1. SseEmitter 생성 및 관리
 * 2. ProgressEventService 구독 연결
 * 3. 이벤트를 SSE 형식으로 변환하여 전송
 * 4. 연결 끊김 시 리소스 정리
 */
@Component
public class ProgressSSEManager {

    private static final Logger log = LoggerFactory.getLogger(ProgressSSEManager.class);
    private static final long SSE_TIMEOUT = 60 * 60 * 1000L; // 1시간

    private final ProgressEventService progressEventService;
    private final ObjectMapper objectMapper;

    // emitterId -> SSE 연결 정보
    private final Map<String, SSEConnection> connections = new ConcurrentHashMap<>();

    public ProgressSSEManager(ProgressEventService progressEventService, ObjectMapper objectMapper) {
        this.progressEventService = progressEventService;
        this.objectMapper = objectMapper;
    }

    /**
     * SSE 연결 생성
     *
     * @param userId 사용자 ID
     * @param taskId 특정 작업만 구독 (null이면 사용자의 모든 작업)
     * @return SseEmitter
     */
    public SseEmitter createConnection(String userId, String taskId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        String emitterId = generateEmitterId(userId);

        // 1. EventBroadcaster 구독
        String subscriptionId = progressEventService.subscribe(userId, event -> {
            // taskId 필터링 (특정 작업만 구독하는 경우)
            if (taskId != null && !taskId.equals(event.taskId())) {
                return;
            }
            sendEvent(emitterId, event);
        });

        // 2. 연결 정보 저장
        SSEConnection connection = new SSEConnection(emitterId, userId, taskId, subscriptionId, emitter);
        connections.put(emitterId, connection);

        // 3. SseEmitter 콜백 설정
        emitter.onCompletion(() -> cleanup(emitterId));
        emitter.onTimeout(() -> cleanup(emitterId));
        emitter.onError(e -> cleanup(emitterId));

        log.info("[SSEManager] 연결 생성: userId={}, taskId={}, emitterId={}", userId, taskId, emitterId);

        // 4. 연결 직후 현재 상태 전송 (재접속 시 상태 복구)
        sendCurrentState(emitterId, userId, taskId);

        return emitter;
    }

    /**
     * 현재 상태 전송 (재접속 시 상태 복구용)
     */
    private void sendCurrentState(String emitterId, String userId, String taskId) {
        if (taskId != null) {
            // 특정 작업의 현재 상태
            Optional<ProgressSnapshot> snapshot = progressEventService.getTaskStatus(taskId);
            snapshot.ifPresent(s -> {
                ProgressEvent recoveryEvent = ProgressEvent.progress(
                        s.taskId(), s.userId(), s.currentStep(), s.totalSteps(), s.stepName()
                );
                sendEvent(emitterId, recoveryEvent, "recovery");
            });
        }
    }

    /**
     * 이벤트 전송
     */
    private void sendEvent(String emitterId, ProgressEvent event) {
        sendEvent(emitterId, event, "progress");
    }

    /**
     * 이벤트 전송 (이벤트 타입 지정)
     */
    private void sendEvent(String emitterId, ProgressEvent event, String eventName) {
        SSEConnection connection = connections.get(emitterId);
        if (connection == null) {
            return;
        }

        try {
            String jsonData = objectMapper.writeValueAsString(event);
            connection.emitter().send(SseEmitter.event()
                    .name(eventName)
                    .data(jsonData));

            log.debug("[SSEManager] 이벤트 전송: emitterId={}, type={}, {}%",
                    emitterId, event.eventType(), event.percentage());
        } catch (IOException e) {
            log.error("[SSEManager] 전송 실패: emitterId={}", emitterId, e);
            cleanup(emitterId);
        }
    }

    /**
     * 연결 정리
     */
    private void cleanup(String emitterId) {
        SSEConnection connection = connections.remove(emitterId);
        if (connection != null) {
            // EventBroadcaster 구독 취소
            progressEventService.unsubscribe(connection.subscriptionId());
            log.info("[SSEManager] 연결 정리: userId={}, emitterId={}", connection.userId(), emitterId);
        }
    }

    /**
     * Emitter ID 생성
     */
    private String generateEmitterId(String userId) {
        return userId + "_" + System.currentTimeMillis();
    }

    /**
     * 현재 연결 수 (모니터링용)
     */
    public int getConnectionCount() {
        return connections.size();
    }

    /**
     * SSE 연결 정보
     */
    private record SSEConnection(
            String emitterId,
            String userId,
            String taskId,
            String subscriptionId,
            SseEmitter emitter
    ) {}
}
