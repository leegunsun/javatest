package com.example.open.common.logging;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Loki 로깅 스택 테스트용 컨트롤러
 *
 * 다양한 로그 레벨(DEBUG, INFO, WARN, ERROR)을 생성하여
 * Loki + Promtail + Grafana 스택이 정상 동작하는지 확인합니다.
 *
 * 테스트 방법:
 * 1. Loki 스택 실행: cd docker/loki && docker-compose up -d
 * 2. Spring Boot 실행: ./gradlew bootRun
 * 3. API 호출: curl http://localhost:8082/api/log-test/info
 * 4. Grafana 확인: http://localhost:3001 > Explore > {job="open-green"}
 */
@Slf4j
@RestController
@RequestMapping("/api/log-test")
@Tag(name = "Log Test", description = "Loki 로깅 스택 테스트 API")
public class LogTestController {

    private final AtomicLong requestCounter = new AtomicLong(0);

    @Operation(summary = "INFO 로그 생성", description = "INFO 레벨 로그를 생성합니다")
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> logInfo(
            @Parameter(description = "로그 메시지") @RequestParam(defaultValue = "테스트 INFO 로그") String message) {

        long requestId = requestCounter.incrementAndGet();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.info("[Request #{}] [TraceId: {}] INFO 로그 테스트: {}", requestId, traceId, message);
        log.info("[Request #{}] 사용자 요청 처리 완료", requestId);

        return ResponseEntity.ok(buildResponse("INFO", message, requestId, traceId));
    }

    @Operation(summary = "DEBUG 로그 생성", description = "DEBUG 레벨 로그를 생성합니다")
    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> logDebug(
            @Parameter(description = "로그 메시지") @RequestParam(defaultValue = "테스트 DEBUG 로그") String message) {

        long requestId = requestCounter.incrementAndGet();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.debug("[Request #{}] [TraceId: {}] DEBUG 로그 테스트: {}", requestId, traceId, message);
        log.debug("[Request #{}] 상세 디버깅 정보: timestamp={}, thread={}",
                requestId, LocalDateTime.now(), Thread.currentThread().getName());

        return ResponseEntity.ok(buildResponse("DEBUG", message, requestId, traceId));
    }

    @Operation(summary = "WARN 로그 생성", description = "WARN 레벨 로그를 생성합니다")
    @GetMapping("/warn")
    public ResponseEntity<Map<String, Object>> logWarn(
            @Parameter(description = "로그 메시지") @RequestParam(defaultValue = "테스트 WARN 로그") String message) {

        long requestId = requestCounter.incrementAndGet();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.warn("[Request #{}] [TraceId: {}] WARN 로그 테스트: {}", requestId, traceId, message);
        log.warn("[Request #{}] 주의가 필요한 상황이 감지되었습니다", requestId);

        return ResponseEntity.ok(buildResponse("WARN", message, requestId, traceId));
    }

    @Operation(summary = "ERROR 로그 생성", description = "ERROR 레벨 로그를 생성합니다 (예외 포함)")
    @GetMapping("/error")
    public ResponseEntity<Map<String, Object>> logError(
            @Parameter(description = "로그 메시지") @RequestParam(defaultValue = "테스트 ERROR 로그") String message) {

        long requestId = requestCounter.incrementAndGet();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        try {
            // 의도적으로 예외 발생
            throw new RuntimeException("테스트용 예외: " + message);
        } catch (Exception e) {
            log.error("[Request #{}] [TraceId: {}] ERROR 로그 테스트: {}", requestId, traceId, message, e);
        }

        return ResponseEntity.ok(buildResponse("ERROR", message, requestId, traceId));
    }

    @Operation(summary = "모든 레벨 로그 생성", description = "DEBUG, INFO, WARN, ERROR 모든 레벨의 로그를 한 번에 생성합니다")
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> logAll(
            @Parameter(description = "로그 메시지") @RequestParam(defaultValue = "전체 레벨 테스트") String message) {

        long requestId = requestCounter.incrementAndGet();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.debug("[Request #{}] [TraceId: {}] DEBUG: {}", requestId, traceId, message);
        log.info("[Request #{}] [TraceId: {}] INFO: {}", requestId, traceId, message);
        log.warn("[Request #{}] [TraceId: {}] WARN: {}", requestId, traceId, message);

        try {
            throw new IllegalStateException("테스트용 예외 - " + message);
        } catch (Exception e) {
            log.error("[Request #{}] [TraceId: {}] ERROR: {}", requestId, traceId, message, e);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("levels", new String[]{"DEBUG", "INFO", "WARN", "ERROR"});
        response.put("message", message);
        response.put("requestId", requestId);
        response.put("traceId", traceId);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("logsGenerated", 4);
        response.put("grafanaQuery", "{job=\"open-green\"} |= \"" + traceId + "\"");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "대량 로그 생성", description = "지정된 횟수만큼 로그를 생성합니다 (최대 100회)")
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> logBulk(
            @Parameter(description = "생성할 로그 수 (최대 100)") @RequestParam(defaultValue = "10") int count,
            @Parameter(description = "로그 레벨") @RequestParam(defaultValue = "INFO") String level) {

        int actualCount = Math.min(count, 100);
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        for (int i = 1; i <= actualCount; i++) {
            String msg = String.format("[Bulk #%d/%d] [TraceId: %s] 대량 로그 테스트", i, actualCount, traceId);

            switch (level.toUpperCase()) {
                case "DEBUG" -> log.debug(msg);
                case "WARN" -> log.warn(msg);
                case "ERROR" -> log.error(msg);
                default -> log.info(msg);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("level", level.toUpperCase());
        response.put("requestedCount", count);
        response.put("actualCount", actualCount);
        response.put("traceId", traceId);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("grafanaQuery", "{job=\"open-green\"} |= \"" + traceId + "\"");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "비즈니스 시나리오 로그", description = "주문 처리 시뮬레이션 로그를 생성합니다")
    @PostMapping("/scenario/order")
    public ResponseEntity<Map<String, Object>> logOrderScenario(
            @Parameter(description = "주문 ID") @RequestParam(defaultValue = "ORD-001") String orderId,
            @Parameter(description = "고객 ID") @RequestParam(defaultValue = "CUST-123") String customerId) {

        String traceId = UUID.randomUUID().toString().substring(0, 8);

        // 주문 처리 시뮬레이션
        log.info("[TraceId: {}] 주문 접수 시작 - orderId: {}, customerId: {}", traceId, orderId, customerId);
        log.debug("[TraceId: {}] 재고 확인 중...", traceId);
        log.info("[TraceId: {}] 재고 확인 완료 - 가용 재고: 50개", traceId);
        log.debug("[TraceId: {}] 결제 처리 시작", traceId);
        log.info("[TraceId: {}] 결제 승인 완료 - 금액: 50,000원", traceId);
        log.warn("[TraceId: {}] 배송 지연 예상 - 예상 배송일: 3일 후", traceId);
        log.info("[TraceId: {}] 주문 처리 완료 - orderId: {}", traceId, orderId);

        Map<String, Object> response = new HashMap<>();
        response.put("scenario", "주문 처리");
        response.put("orderId", orderId);
        response.put("customerId", customerId);
        response.put("traceId", traceId);
        response.put("status", "COMPLETED");
        response.put("logsGenerated", 7);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("grafanaQuery", "{job=\"open-green\"} |= \"" + traceId + "\"");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "에러 시나리오 로그", description = "결제 실패 시뮬레이션 로그를 생성합니다 (ERROR 로그 포함)")
    @PostMapping("/scenario/payment-failure")
    public ResponseEntity<Map<String, Object>> logPaymentFailure(
            @Parameter(description = "주문 ID") @RequestParam(defaultValue = "ORD-999") String orderId) {

        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.info("[TraceId: {}] 결제 처리 시작 - orderId: {}", traceId, orderId);
        log.debug("[TraceId: {}] PG사 연동 시작", traceId);
        log.warn("[TraceId: {}] PG사 응답 지연 - 재시도 1회차", traceId);
        log.warn("[TraceId: {}] PG사 응답 지연 - 재시도 2회차", traceId);

        try {
            throw new RuntimeException("PG사 연동 실패: 타임아웃 (30초 초과)");
        } catch (Exception e) {
            log.error("[TraceId: {}] 결제 처리 실패 - orderId: {}", traceId, orderId, e);
        }

        log.info("[TraceId: {}] 결제 실패 알림 발송 - 고객 이메일 전송", traceId);

        Map<String, Object> response = new HashMap<>();
        response.put("scenario", "결제 실패");
        response.put("orderId", orderId);
        response.put("traceId", traceId);
        response.put("status", "PAYMENT_FAILED");
        response.put("errorType", "PG_TIMEOUT");
        response.put("logsGenerated", 6);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("grafanaQuery", "{job=\"open-green\", log_type=\"error\"} |= \"" + traceId + "\"");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "로그 테스트 상태", description = "현재까지 생성된 로그 통계를 확인합니다")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalRequests", requestCounter.get());
        response.put("serverTime", LocalDateTime.now().toString());
        response.put("logDirectory", "./logs");
        response.put("appLogFile", "./logs/appLogs/app.json");
        response.put("errorLogFile", "./logs/errorLogs/error.json");
        response.put("grafanaUrl", "http://localhost:3001");
        response.put("lokiUrl", "http://localhost:3100");
        response.put("promtailUrl", "http://localhost:9080");

        Map<String, String> queries = new HashMap<>();
        queries.put("allLogs", "{job=\"open-green\"}");
        queries.put("errorOnly", "{job=\"open-green\", log_type=\"error\"}");
        queries.put("appOnly", "{job=\"open-green\", log_type=\"app\"}");
        queries.put("byLevel", "{job=\"open-green\"} | json | level=\"ERROR\"");
        response.put("grafanaQueries", queries);

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> buildResponse(String level, String message, long requestId, String traceId) {
        Map<String, Object> response = new HashMap<>();
        response.put("level", level);
        response.put("message", message);
        response.put("requestId", requestId);
        response.put("traceId", traceId);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("logFile", "INFO".equals(level) || "DEBUG".equals(level) || "WARN".equals(level)
                ? "./logs/appLogs/app.json"
                : "./logs/errorLogs/error.json");
        response.put("grafanaQuery", "{job=\"open-green\"} |= \"" + traceId + "\"");
        return response;
    }
}
