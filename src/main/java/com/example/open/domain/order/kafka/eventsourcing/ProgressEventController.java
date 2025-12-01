package com.example.open.domain.order.kafka.eventsourcing;

import com.example.open.domain.order.kafka.dto.OrderRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 진행률 이벤트 컨트롤러 (Event Sourcing 버전)
 *
 * 기능:
 * 1. SSE 구독 (실시간 진행률)
 * 2. 작업 상태 조회 (REST)
 * 3. 이벤트 히스토리 조회
 * 4. 주문 생성 (V2)
 */
@Tag(name = "Progress Event Sourcing", description = "Event Sourcing 기반 진행률 API")
@RestController
@RequestMapping("/api/v2/progress")
public class ProgressEventController {

    private static final String TOPIC_V2 = "order-events-v2";

    private final ProgressSSEManager sseManager;
    private final ProgressEventService progressEventService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ProgressEventController(
            ProgressSSEManager sseManager,
            ProgressEventService progressEventService,
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper
    ) {
        this.sseManager = sseManager;
        this.progressEventService = progressEventService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    // ==================== SSE 구독 ====================

    @Operation(summary = "SSE 구독 (전체)", description = "사용자의 모든 작업 진행률을 실시간으로 수신")
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam String userId) {
        return sseManager.createConnection(userId, null);
    }

    @Operation(summary = "SSE 구독 (특정 작업)", description = "특정 작업의 진행률만 실시간으로 수신")
    @GetMapping(value = "/subscribe/{taskId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeTask(@RequestParam String userId, @PathVariable String taskId) {
        return sseManager.createConnection(userId, taskId);
    }

    // ==================== 상태 조회 (REST) ====================

    @Operation(summary = "작업 상태 조회", description = "특정 작업의 현재 상태 조회 (스냅샷)")
    @GetMapping("/status/{taskId}")
    public ResponseEntity<?> getTaskStatus(@PathVariable String taskId) {
        return progressEventService.getTaskStatus(taskId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "이벤트 히스토리 조회", description = "특정 작업의 전체 이벤트 히스토리")
    @GetMapping("/history/{taskId}")
    public ResponseEntity<List<ProgressEvent>> getTaskHistory(@PathVariable String taskId) {
        List<ProgressEvent> events = progressEventService.getTaskHistory(taskId);
        if (events.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(events);
    }

    @Operation(summary = "사용자 이벤트 조회", description = "특정 사용자의 모든 이벤트 조회")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProgressEvent>> getUserEvents(@PathVariable String userId) {
        List<ProgressEvent> events = progressEventService.getUserEvents(userId);
        return ResponseEntity.ok(events);
    }

    // ==================== 주문 생성 (V2) ====================

    @Operation(summary = "주문 생성 (V2)", description = "Event Sourcing 버전 주문 생성")
    @PostMapping("/orders")
    public ResponseEntity<Map<String, String>> createOrderV2(
            @RequestParam String userId,
            @RequestParam String productName,
            @RequestParam int quantity
    ) {
        String taskId = UUID.randomUUID().toString();
        String orderId = "ORDER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        OrderRequest request = new OrderRequest(taskId, userId, orderId, productName, quantity);

        try {
            String message = objectMapper.writeValueAsString(request);
            kafkaTemplate.send(TOPIC_V2, userId, message);

            return ResponseEntity.ok(Map.of(
                    "taskId", taskId,
                    "orderId", orderId,
                    "message", "주문이 접수되었습니다. SSE를 통해 진행률을 확인하세요.",
                    "subscribeUrl", "/api/v2/progress/subscribe?userId=" + userId,
                    "statusUrl", "/api/v2/progress/status/" + taskId,
                    "historyUrl", "/api/v2/progress/history/" + taskId
            ));
        } catch (JsonProcessingException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "주문 생성 실패",
                    "message", e.getMessage()
            ));
        }
    }

    // ==================== 모니터링 ====================

    @Operation(summary = "시스템 상태", description = "SSE 연결 상태 모니터링")
    @GetMapping("/monitor")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        return ResponseEntity.ok(Map.of(
                "sseConnections", sseManager.getConnectionCount(),
                "status", "running"
        ));
    }
}
