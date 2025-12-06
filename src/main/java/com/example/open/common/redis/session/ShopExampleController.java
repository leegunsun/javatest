package com.example.open.common.redis.session;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Shop 세션 자동 획득 사용 예시 컨트롤러
 *
 * @ShopSessionRequired 어노테이션 사용법을 보여줍니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
@Tag(name = "Shop Example", description = "@ShopSessionRequired 어노테이션 사용 예시")
public class ShopExampleController {

    private final ShopSessionService shopSessionService;

    /**
     * 방법 1: 메서드 레벨 어노테이션
     * 이 엔드포인트에 접근하면 Shop 세션이 자동으로 생성/갱신됩니다.
     */
    @ShopSessionRequired
    @Operation(summary = "상품 목록 조회", description = "세션 자동 생성 - 메서드 레벨 어노테이션 예시")
    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProducts(HttpServletRequest request) {

        // Request Attribute에서 세션 데이터 가져오기
        ShopSessionData sessionData = (ShopSessionData) request.getAttribute(
                ShopSessionInterceptor.SHOP_SESSION_ATTRIBUTE);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "상품 목록 조회 성공");
        response.put("sessionAutoCreated", true);
        response.put("visitorId", sessionData.getVisitorId());
        response.put("cartItemCount", sessionData.getCart().size());

        // 상품 목록 예시
        response.put("products", java.util.List.of(
                Map.of("id", 1, "name", "상품 A", "price", 10000),
                Map.of("id", 2, "name", "상품 B", "price", 20000),
                Map.of("id", 3, "name", "상품 C", "price", 30000)
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * 방법 2: autoCreate = false
     * 세션이 없으면 예외 발생 (세션 필수인 경우)
     */
    @ShopSessionRequired(autoCreate = false)
    @Operation(summary = "장바구니 조회", description = "세션 필수 - autoCreate=false 예시")
    @GetMapping("/cart")
    public ResponseEntity<Map<String, Object>> getCart(HttpServletRequest request) {

        ShopSessionData sessionData = (ShopSessionData) request.getAttribute(
                ShopSessionInterceptor.SHOP_SESSION_ATTRIBUTE);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "장바구니 조회 성공");
        response.put("visitorId", sessionData.getVisitorId());
        response.put("cart", sessionData.getCart());
        response.put("checkoutStep", sessionData.getCheckoutStep());

        return ResponseEntity.ok(response);
    }

    /**
     * 방법 3: refreshTTL = false
     * 세션 접근해도 TTL을 갱신하지 않음
     */
    @ShopSessionRequired(refreshTTL = false)
    @Operation(summary = "세션 상태 확인", description = "TTL 갱신 안함 - refreshTTL=false 예시")
    @GetMapping("/session-status")
    public ResponseEntity<Map<String, Object>> getSessionStatus(HttpServletRequest request) {

        ShopSessionData sessionData = (ShopSessionData) request.getAttribute(
                ShopSessionInterceptor.SHOP_SESSION_ATTRIBUTE);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "세션 상태 조회 (TTL 갱신 안됨)");
        response.put("visitorId", sessionData.getVisitorId());
        response.put("createdAt", sessionData.getCreatedAt());
        response.put("lastAccessedAt", sessionData.getLastAccessedAt());

        return ResponseEntity.ok(response);
    }

    /**
     * 어노테이션 없음 - 세션 자동 처리 안함
     */
    @Operation(summary = "공개 상품 정보", description = "세션 불필요 - 어노테이션 없음")
    @GetMapping("/public/info")
    public ResponseEntity<Map<String, Object>> getPublicInfo() {

        Map<String, Object> response = new HashMap<>();
        response.put("message", "공개 정보 - 세션 불필요");
        response.put("storeName", "Open Shop");
        response.put("openHours", "09:00 - 21:00");

        return ResponseEntity.ok(response);
    }
}
