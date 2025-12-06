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
 * 세션 테스트 컨트롤러 (서브도메인 기반)
 *
 * 테스트 방법:
 * 1. hosts 파일에 추가 (Windows: C:\Windows\System32\drivers\etc\hosts)
 *    127.0.0.1 localhost
 *    127.0.0.1 shop.localhost
 *
 * 2. A 도메인 (localhost:8082)
 *    - Normal 세션만 보임
 *    - Shop 세션 생성 불가
 *
 * 3. B 도메인 (shop.localhost:8082)
 *    - Normal 세션 + Shop 세션 둘 다 보임
 *    - Shop 세션 생성 가능
 *
 * 4. 테스트 시나리오:
 *    - B에서 Shop 세션 생성 → A로 이동 → Shop 세션 안 보임
 *    - A에서 B로 이동 → Shop 세션 다시 보임
 */
@Slf4j
@RestController
@RequestMapping("/api/session-test")
@RequiredArgsConstructor
@Tag(name = "Session Test", description = "서브도메인 기반 멀티 세션 테스트 API")
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

    // ==================== Shop Session (Custom - 서브도메인 전용) ====================

    @Operation(summary = "Shop 세션 생성", description = "Shop 도메인(B)에서만 생성 가능. 일반 도메인(A)에서는 거부됨")
    @PostMapping("/shop")
    public ResponseEntity<Map<String, Object>> createShopSession(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam(required = false) String visitorId,
            @RequestParam(required = false) Long dealerId) {

        Map<String, Object> result = new HashMap<>();
        String host = request.getServerName();

        // Shop 도메인 체크
        if (!shopSessionService.isShopDomain(request)) {
            result.put("success", false);
            result.put("error", "NOT_SHOP_DOMAIN");
            result.put("message", "Shop 세션은 Shop 도메인에서만 생성할 수 있습니다");
            result.put("currentHost", host);
            result.put("hint", "shop.localhost:8082 에서 접근하세요");
            return ResponseEntity.badRequest().body(result);
        }

        // 기존 세션이 있으면 삭제
        if (shopSessionService.hasShopSession(request)) {
            shopSessionService.deleteShopSession(request, response);
        }

        ShopSessionData data = ShopSessionData.builder()
                .visitorId(visitorId)
                .selectedDealerId(dealerId)
                .checkoutStep(1)
                .build();

        String sessionId = shopSessionService.createShopSession(request, response, data);

        result.put("success", true);
        result.put("sessionId", sessionId);
        result.put("visitorId", data.getVisitorId());
        result.put("selectedDealerId", data.getSelectedDealerId());
        result.put("checkoutStep", data.getCheckoutStep());
        result.put("createdAt", data.getCreatedAt());
        result.put("type", "Shop Session (서브도메인 전용)");
        result.put("redisKey", "shop:session:" + sessionId);
        result.put("cookieName", "SHOP_SESSION_ID");
        result.put("cookieDomain", host + " (이 도메인에서만 쿠키 전송)");

        log.info("Shop 세션 생성: sessionId={}, visitorId={}, host={}", sessionId, data.getVisitorId(), host);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Shop 세션 조회", description = "Shop 도메인(B)에서만 세션 조회 가능. 일반 도메인(A)에서는 항상 없음으로 표시")
    @GetMapping("/shop")
    public ResponseEntity<Map<String, Object>> getShopSession(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        String host = request.getServerName();
        boolean isShopDomain = shopSessionService.isShopDomain(request);

        response.put("currentHost", host);
        response.put("isShopDomain", isShopDomain);

        if (!isShopDomain) {
            response.put("exists", false);
            response.put("message", "Shop 도메인이 아니므로 Shop 세션에 접근할 수 없습니다");
            response.put("hint", "shop.localhost:8082 에서 접근하세요");
            response.put("note", "Redis에 세션 데이터가 있어도 이 도메인에서는 쿠키가 전송되지 않습니다");
            return ResponseEntity.ok(response);
        }

        Optional<ShopSessionData> sessionData = shopSessionService.getShopSession(request);

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
            response.put("type", "Shop Session (서브도메인 전용)");
        } else {
            response.put("exists", false);
            response.put("message", "Shop 세션이 없습니다. 먼저 생성하세요.");
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

    @Operation(summary = "장바구니에 아이템 추가", description = "Shop 도메인(B)에서만 가능. 세션이 없으면 자동 생성")
    @PostMapping("/shop/cart")
    public ResponseEntity<Map<String, Object>> addToCart(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam Long productId,
            @RequestParam String productName,
            @RequestParam Integer quantity,
            @RequestParam Long price) {

        Map<String, Object> result = new HashMap<>();

        // Shop 도메인 체크
        if (!shopSessionService.isShopDomain(request)) {
            result.put("success", false);
            result.put("error", "NOT_SHOP_DOMAIN");
            result.put("message", "장바구니 기능은 Shop 도메인에서만 사용 가능합니다");
            result.put("hint", "shop.localhost:8082 에서 접근하세요");
            return ResponseEntity.badRequest().body(result);
        }

        ShopSessionData data = shopSessionService.getOrCreateShopSession(request, response);

        ShopSessionData.CartItem item = ShopSessionData.CartItem.builder()
                .productId(productId)
                .productName(productName)
                .quantity(quantity)
                .price(price)
                .build();

        data.getCart().add(item);
        shopSessionService.updateShopSession(request, data);

        result.put("success", true);
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

    // ==================== 두 세션 동시 확인 (핵심 테스트 API) ====================

    @Operation(summary = "두 세션 동시 확인", description = "Normal 세션과 Shop 세션 상태를 동시에 확인. 서브도메인에 따라 결과가 다름")
    @GetMapping("/both")
    public ResponseEntity<Map<String, Object>> getBothSessions(
            HttpSession httpSession,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();
        String host = request.getServerName();
        boolean isShopDomain = shopSessionService.isShopDomain(request);

        // 현재 도메인 정보
        response.put("currentHost", host);
        response.put("isShopDomain", isShopDomain);
        response.put("domainType", isShopDomain ? "B (Shop 도메인)" : "A (일반 도메인)");

        // Normal Session (모든 도메인에서 동일)
        Map<String, Object> normalSession = new HashMap<>();
        normalSession.put("sessionId", httpSession.getId());
        normalSession.put("username", httpSession.getAttribute("username"));
        normalSession.put("isNew", httpSession.isNew());
        normalSession.put("redisKey", "spring:session:sessions:" + httpSession.getId());
        normalSession.put("cookieName", "JSESSIONID");
        normalSession.put("cookieDomain", ".localhost (모든 서브도메인에서 공유)");
        normalSession.put("accessible", true);
        response.put("normalSession", normalSession);

        // Shop Session (Shop 도메인에서만 접근 가능)
        Map<String, Object> shopSession = new HashMap<>();
        shopSession.put("isShopDomain", isShopDomain);

        if (isShopDomain) {
            Optional<ShopSessionData> shopData = shopSessionService.getShopSession(request);
            if (shopData.isPresent()) {
                ShopSessionData data = shopData.get();
                shopSession.put("exists", true);
                shopSession.put("accessible", true);
                shopSession.put("sessionId", shopSessionService.getSessionIdFromCookie(request));
                shopSession.put("visitorId", data.getVisitorId());
                shopSession.put("cartItemCount", data.getCart() != null ? data.getCart().size() : 0);
                shopSession.put("checkoutStep", data.getCheckoutStep());
                shopSession.put("redisKey", "shop:session:" + shopSessionService.getSessionIdFromCookie(request));
                shopSession.put("cookieName", "SHOP_SESSION_ID");
                shopSession.put("cookieDomain", host + " (이 도메인에서만 유효)");
            } else {
                shopSession.put("exists", false);
                shopSession.put("accessible", true);
                shopSession.put("message", "Shop 세션이 없습니다. POST /api/session-test/shop 으로 생성하세요");
            }
        } else {
            shopSession.put("exists", false);
            shopSession.put("accessible", false);
            shopSession.put("message", "일반 도메인(A)에서는 Shop 세션에 접근할 수 없습니다");
            shopSession.put("note", "shop.localhost:8082 로 이동하면 Shop 세션이 보입니다");
        }
        response.put("shopSession", shopSession);

        // 설명
        response.put("description", Map.of(
                "normalSession", "Spring Session - 모든 서브도메인에서 공유 (로그인, 권한 등)",
                "shopSession", "Custom Session - Shop 도메인(B)에서만 접근 가능 (장바구니, 결제 등)"
        ));

        // 테스트 가이드
        response.put("testGuide", Map.of(
                "step1", "shop.localhost:8082/api/session-test/shop (POST) - Shop 세션 생성",
                "step2", "shop.localhost:8082/api/session-test/both (GET) - 두 세션 모두 보임",
                "step3", "localhost:8082/api/session-test/both (GET) - Normal만 보임, Shop 안 보임",
                "step4", "shop.localhost:8082/api/session-test/both (GET) - 다시 Shop 세션 보임"
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
