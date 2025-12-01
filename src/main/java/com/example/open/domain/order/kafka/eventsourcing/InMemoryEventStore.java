package com.example.open.domain.order.kafka.eventsourcing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 인메모리 Event Store 구현체
 *
 * 학습/테스트용 구현체
 * - 단일 서버에서만 동작
 * - 서버 재시작 시 데이터 소실
 *
 * 프로덕션에서는 RedisEventStore 또는 JpaEventStore 사용 권장
 */
@Component
public class InMemoryEventStore implements EventStore {

    private static final Logger log = LoggerFactory.getLogger(InMemoryEventStore.class);

    // taskId -> 이벤트 목록 (시간순 정렬)
    private final Map<String, List<ProgressEvent>> eventsByTask = new ConcurrentHashMap<>();

    // userId -> taskId 목록 (사용자별 작업 추적)
    private final Map<String, Set<String>> tasksByUser = new ConcurrentHashMap<>();

    @Override
    public void append(ProgressEvent event) {
        // taskId별 이벤트 저장
        eventsByTask.computeIfAbsent(event.taskId(), k -> Collections.synchronizedList(new ArrayList<>()))
                .add(event);

        // userId별 taskId 매핑
        tasksByUser.computeIfAbsent(event.userId(), k -> ConcurrentHashMap.newKeySet())
                .add(event.taskId());

        log.debug("[EventStore] 이벤트 저장: taskId={}, type={}, step={}/{}",
                event.taskId(), event.eventType(), event.currentStep(), event.totalSteps());
    }

    @Override
    public List<ProgressEvent> getEventsByTaskId(String taskId) {
        List<ProgressEvent> events = eventsByTask.get(taskId);
        if (events == null) {
            return Collections.emptyList();
        }
        // 불변 복사본 반환
        return new ArrayList<>(events);
    }

    @Override
    public List<ProgressEvent> getEventsByUserId(String userId) {
        Set<String> taskIds = tasksByUser.get(userId);
        if (taskIds == null) {
            return Collections.emptyList();
        }

        return taskIds.stream()
                .flatMap(taskId -> getEventsByTaskId(taskId).stream())
                .sorted(Comparator.comparing(ProgressEvent::timestamp))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<ProgressEvent> getLatestEvent(String taskId) {
        List<ProgressEvent> events = eventsByTask.get(taskId);
        if (events == null || events.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(events.get(events.size() - 1));
    }

    @Override
    public Optional<ProgressSnapshot> getSnapshot(String taskId) {
        List<ProgressEvent> events = getEventsByTaskId(taskId);
        if (events.isEmpty()) {
            return Optional.empty();
        }
        return Optional.ofNullable(ProgressSnapshot.fromEvents(events));
    }

    @Override
    public void cleanup(long ttlMillis) {
        Instant cutoff = Instant.now().minusMillis(ttlMillis);
        int removedCount = 0;

        Iterator<Map.Entry<String, List<ProgressEvent>>> iterator = eventsByTask.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, List<ProgressEvent>> entry = iterator.next();
            List<ProgressEvent> events = entry.getValue();

            if (!events.isEmpty()) {
                ProgressEvent lastEvent = events.get(events.size() - 1);
                // 마지막 이벤트가 TTL을 초과한 경우 삭제
                if (lastEvent.timestamp().isBefore(cutoff)) {
                    iterator.remove();
                    removedCount++;

                    // userId -> taskId 매핑도 정리
                    String userId = lastEvent.userId();
                    Set<String> userTasks = tasksByUser.get(userId);
                    if (userTasks != null) {
                        userTasks.remove(entry.getKey());
                        if (userTasks.isEmpty()) {
                            tasksByUser.remove(userId);
                        }
                    }
                }
            }
        }

        if (removedCount > 0) {
            log.info("[EventStore] 정리 완료: {}개 작업 삭제됨", removedCount);
        }
    }

    /**
     * 현재 저장된 작업 수 (모니터링용)
     */
    public int getTaskCount() {
        return eventsByTask.size();
    }

    /**
     * 현재 저장된 전체 이벤트 수 (모니터링용)
     */
    public int getTotalEventCount() {
        return eventsByTask.values().stream()
                .mapToInt(List::size)
                .sum();
    }
}
