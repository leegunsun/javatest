package com.example.open.common.redis.session;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 세션 테스트 컨트롤러
 * Normal 세션(Spring Session)과 Shop 세션(Custom) 동작 확인용
 */
@Slf4j
@RestController
@RequestMapping("/api/session-test")
@RequiredArgsConstructor
@Tag(name = "Session Test", description = "멀티 세션 테스트 API")
public class SessionTestController {

    private final ShopSessionService shopSessionService;

    // ==================== Normal Session (Spring Session) ====================

    @Operation(summary = "Normal 세션 생성/조회", description = "Spring Session을 통한 일반 세션 생성 및 조회")
    @PostMapping("/normal")
    public ResponseEntity<Map<String, Object>> createNormalSession(
            HttpSession session,
            @RequestParam(required = false) String username) {

        session.setAttribute("username", username != null ? username : "guest");
        session.setAttribute("loginTime", LocalDateTime.now().toString());
        session.setAttribute("role", "USER");

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("username", session.getAttribute("username"));
        response.put("loginTime", session.getAttribute("loginTime"));
        response.put("role", session.getAttribute("role"));
        response.put("maxInactiveInterval", session.getMaxInactiveInterval());
        response.put("type", "Normal Session (Spring Session)");
        response.put("redisKey", "spring:session:sessions:" + session.getId());

        log.info("Normal 세션 생성: sessionId={}, username={}", session.getId(), username);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Normal 세션 조회", description = "현재 Normal 세션 정보 조회")
    @GetMapping("/normal")
    public ResponseEntity<Map<String, Object>> getNormalSession(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("username", session.getAttribute("username"));
        response.put("loginTime", session.getAttribute("loginTime"));
        response.put("role", session.getAttribute("role"));
        response.put("isNew", session.isNew());
        response.put("type", "Normal Session (Spring Session)");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Normal 세션 삭제", description = "현재 Normal 세션 무효화")
    @DeleteMapping("/normal")
    public ResponseEntity<Map<String, Object>> deleteNormalSession(HttpSession session) {
        String sessionId = session.getId();
        session.invalidate();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Normal 세션 삭제됨");
        response.put("deletedSessionId", sessionId);

        log.info("Normal 세션 삭제: sessionId={}", sessionId);
        return ResponseEntity.ok(response);
    }

    // ==================== Shop Session (Custom) ====================

    @Operation(summary = "Shop 세션 생성", description = "커스텀 Shop 세션 생성")
    @PostMapping("/shop")
    public ResponseEntity<Map<String, Object>> createShopSession(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam(required = false) String visitorId,
            @RequestParam(required = false) Long dealerId) {

        // 기존 세션이 있으면 삭제
        if (shopSessionService.hasShopSession(request)) {
            shopSessionService.deleteShopSession(request, response);
        }

        ShopSessionData data = ShopSessionData.builder()
                .visitorId(visitorId)
                .selectedDealerId(dealerId)
                .checkoutStep(1)
                .build();

        String sessionId = shopSessionService.createShopSession(response, data);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("visitorId", data.getVisitorId());
        result.put("selectedDealerId", data.getSelectedDealerId());
        result.put("checkoutStep", data.getCheckoutStep());
        result.put("createdAt", data.getCreatedAt());
        result.put("type", "Shop Session (Custom)");
        result.put("redisKey", "shop:session:" + sessionId);
        result.put("cookieName", "SHOP_SESSION_ID");

        log.info("Shop 세션 생성: sessionId={}, visitorId={}", sessionId, data.getVisitorId());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Shop 세션 조회", description = "현재 Shop 세션 정보 조회")
    @GetMapping("/shop")
    public ResponseEntity<Map<String, Object>> getShopSession(HttpServletRequest request) {
        Optional<ShopSessionData> sessionData = shopSessionService.getShopSession(request);

        Map<String, Object> response = new HashMap<>();
        if (sessionData.isPresent()) {
            ShopSessionData data = sessionData.get();
            response.put("exists", true);
            response.put("visitorId", data.getVisitorId());
            response.put("cart", data.getCart());
            response.put("cartItemCount", data.getCart() != null ? data.getCart().size() : 0);
            response.put("checkoutStep", data.getCheckoutStep());
            response.put("selectedDealerId", data.getSelectedDealerId());
            response.put("createdAt", data.getCreatedAt());
            response.put("lastAccessedAt", data.getLastAccessedAt());
            response.put("type", "Shop Session (Custom)");
        } else {
            response.put("exists", false);
            response.put("message", "Shop 세션이 없습니다");
        }

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Shop 세션 삭제", description = "현재 Shop 세션 삭제")
    @DeleteMapping("/shop")
    public ResponseEntity<Map<String, Object>> deleteShopSession(
            HttpServletRequest request,
            HttpServletResponse response) {

        String sessionId = shopSessionService.getSessionIdFromCookie(request);
        boolean deleted = shopSessionService.deleteShopSession(request, response);

        Map<String, Object> result = new HashMap<>();
        result.put("deleted", deleted);
        result.put("sessionId", sessionId);
        result.put("message", deleted ? "Shop 세션 삭제됨" : "삭제할 세션이 없습니다");

        log.info("Shop 세션 삭제 요청: sessionId={}, deleted={}", sessionId, deleted);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "장바구니에 아이템 추가", description = "Shop 세션의 장바구니에 아이템 추가")
    @PostMapping("/shop/cart")
    public ResponseEntity<Map<String, Object>> addToCart(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam Long productId,
            @RequestParam String productName,
            @RequestParam Integer quantity,
            @RequestParam Long price) {

        ShopSessionData data = shopSessionService.getOrCreateShopSession(request, response);

        ShopSessionData.CartItem item = ShopSessionData.CartItem.builder()
                .productId(productId)
                .productName(productName)
                .quantity(quantity)
                .price(price)
                .build();

        data.getCart().add(item);
        shopSessionService.updateShopSession(request, data);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "장바구니에 추가됨");
        result.put("addedItem", item);
        result.put("cartSize", data.getCart().size());
        result.put("cart", data.getCart());

        log.info("장바구니 아이템 추가: productId={}, quantity={}", productId, quantity);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "결제 단계 업데이트", description = "Shop 세션의 결제 단계 업데이트")
    @PutMapping("/shop/checkout-step")
    public ResponseEntity<Map<String, Object>> updateCheckoutStep(
            HttpServletRequest request,
            @RequestParam Integer step) {

        Optional<ShopSessionData> sessionData = shopSessionService.getShopSession(request);

        Map<String, Object> result = new HashMap<>();
        if (sessionData.isEmpty()) {
            result.put("success", false);
            result.put("message", "Shop 세션이 없습니다");
            return ResponseEntity.badRequest().body(result);
        }

        if (step < 1 || step > 5) {
            result.put("success", false);
            result.put("message", "결제 단계는 1~5 사이여야 합니다");
            return ResponseEntity.badRequest().body(result);
        }

        ShopSessionData data = sessionData.get();
        data.setCheckoutStep(step);
        shopSessionService.updateShopSession(request, data);

        result.put("success", true);
        result.put("previousStep", sessionData.get().getCheckoutStep());
        result.put("currentStep", step);
        result.put("stepDescription", getCheckoutStepDescription(step));

        log.info("결제 단계 업데이트: step={}", step);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Shop 세션 TTL 갱신", description = "Shop 세션의 TTL(만료 시간)을 갱신합니다")
    @PostMapping("/shop/refresh")
    public ResponseEntity<Map<String, Object>> refreshShopSession(HttpServletRequest request) {
        boolean refreshed = shopSessionService.refreshTTL(request);

        Map<String, Object> result = new HashMap<>();
        result.put("refreshed", refreshed);
        result.put("message", refreshed ? "TTL 갱신됨 (30분)" : "세션이 없습니다");

        return ResponseEntity.ok(result);
    }

    // ==================== 두 세션 동시 확인 ====================

    @Operation(summary = "두 세션 동시 확인", description = "Normal 세션과 Shop 세션 상태를 동시에 확인")
    @GetMapping("/both")
    public ResponseEntity<Map<String, Object>> getBothSessions(
            HttpSession httpSession,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        // Normal Session
        Map<String, Object> normalSession = new HashMap<>();
        normalSession.put("sessionId", httpSession.getId());
        normalSession.put("username", httpSession.getAttribute("username"));
        normalSession.put("isNew", httpSession.isNew());
        normalSession.put("redisKey", "spring:session:sessions:" + httpSession.getId());
        normalSession.put("cookieName", "JSESSIONID");
        response.put("normalSession", normalSession);

        // Shop Session
        Map<String, Object> shopSession = new HashMap<>();
        Optional<ShopSessionData> shopData = shopSessionService.getShopSession(request);
        if (shopData.isPresent()) {
            ShopSessionData data = shopData.get();
            shopSession.put("exists", true);
            shopSession.put("sessionId", shopSessionService.getSessionIdFromCookie(request));
            shopSession.put("visitorId", data.getVisitorId());
            shopSession.put("cartItemCount", data.getCart() != null ? data.getCart().size() : 0);
            shopSession.put("checkoutStep", data.getCheckoutStep());
            shopSession.put("redisKey", "shop:session:" + shopSessionService.getSessionIdFromCookie(request));
            shopSession.put("cookieName", "SHOP_SESSION_ID");
        } else {
            shopSession.put("exists", false);
        }
        response.put("shopSession", shopSession);

        response.put("description", Map.of(
                "normalSession", "Spring Session 관리 (로그인, 권한 등)",
                "shopSession", "Custom 관리 (장바구니, 결제 등)"
        ));

        return ResponseEntity.ok(response);
    }

    private String getCheckoutStepDescription(Integer step) {
        return switch (step) {
            case 1 -> "장바구니 확인";
            case 2 -> "배송지 입력";
            case 3 -> "결제 수단 선택";
            case 4 -> "결제 진행";
            case 5 -> "결제 완료";
            default -> "알 수 없음";
        };
    }
}
