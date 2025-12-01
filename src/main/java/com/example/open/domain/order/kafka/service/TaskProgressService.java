package com.example.open.domain.order.kafka.service;

import com.example.open.domain.order.kafka.dto.TaskProgress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TaskProgressService {

    private static final Logger log = LoggerFactory.getLogger(TaskProgressService.class);
    private static final long SSE_TIMEOUT = 60 * 60 * 1000L; // 1시간

    // userId -> SseEmitter 매핑
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * SSE 연결 생성
     */
    public SseEmitter createEmitter(String userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            log.info("[SSE] 연결 종료: userId={}", userId);
            emitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            log.info("[SSE] 타임아웃: userId={}", userId);
            emitters.remove(userId);
        });

        emitter.onError(e -> {
            log.error("[SSE] 에러 발생: userId={}", userId, e);
            emitters.remove(userId);
        });

        emitters.put(userId, emitter);
        log.info("[SSE] 연결 생성: userId={}", userId);

        return emitter;
    }

    /**
     * 진행률 업데이트 및 SSE 전송
     */
    public void updateProgress(String taskId, String userId, int currentStep, int totalSteps, String stepName) {
        TaskProgress progress = TaskProgress.of(taskId, userId, currentStep, totalSteps, stepName);
        sendToUser(userId, progress);
    }

    /**
     * 작업 완료 알림
     */
    public void complete(String taskId, String userId) {
        TaskProgress progress = TaskProgress.completed(taskId, userId);
        sendToUser(userId, progress);
    }

    /**
     * 작업 실패 알림
     */
    public void fail(String taskId, String userId, String stepName) {
        TaskProgress progress = TaskProgress.failed(taskId, userId, stepName);
        sendToUser(userId, progress);
    }

    private void sendToUser(String userId, TaskProgress progress) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            log.warn("[SSE] 연결 없음: userId={}", userId);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("progress")
                    .data(progress));
            log.info("[SSE] 전송 완료: userId={}, taskId={}, {}% ({})",
                    userId, progress.taskId(), progress.percentage(), progress.stepName());
        } catch (IOException e) {
            log.error("[SSE] 전송 실패: userId={}", userId, e);
            emitters.remove(userId);
        }
    }
}
