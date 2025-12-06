package com.example.open.common.redis.session;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Shop 세션 자동 획득 인터셉터 (서브도메인 기반)
 *
 * 동작 방식:
 * - Shop 도메인(B)에서만 Shop 세션을 생성/조회
 * - 일반 도메인(A)에서는 Shop 세션에 접근하지 않음
 * - B → A 이동: Shop 세션 쿠키가 전송되지 않음 (도메인 불일치)
 * - A → B 이동: Shop 세션 쿠키가 다시 전송됨 (Redis에 데이터 유지)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShopSessionInterceptor implements HandlerInterceptor {

    private final ShopSessionService shopSessionService;

    /**
     * Request Attribute 키 - Shop 세션 데이터 저장용
     */
    public static final String SHOP_SESSION_ATTRIBUTE = "shopSessionData";

    /**
     * Request Attribute 키 - Shop 도메인 여부
     */
    public static final String IS_SHOP_DOMAIN_ATTRIBUTE = "isShopDomain";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        // Shop 도메인 여부를 항상 Request Attribute에 저장 (컨트롤러에서 확인 가능)
        boolean isShopDomain = shopSessionService.isShopDomain(request);
        request.setAttribute(IS_SHOP_DOMAIN_ATTRIBUTE, isShopDomain);

        // 핸들러 메서드가 아니면 통과
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        // 어노테이션 확인 (메서드 → 클래스 순서로 확인)
        ShopSessionRequired annotation = getAnnotation(handlerMethod);

        if (annotation == null) {
            // 어노테이션이 없으면 세션 처리 없이 통과
            return true;
        }

        log.debug("ShopSessionRequired 감지: {}.{}, isShopDomain={}",
                handlerMethod.getBeanType().getSimpleName(),
                handlerMethod.getMethod().getName(),
                isShopDomain);

        // Shop 도메인이 아니면 세션 처리 건너뜀
        if (!isShopDomain) {
            log.debug("Shop 도메인이 아님 - 세션 처리 건너뜀: host={}", request.getServerName());
            // autoCreate=false이고 Shop 도메인이 아니면 에러
            if (!annotation.autoCreate()) {
                throw new NotShopDomainException(
                        "이 기능은 Shop 도메인에서만 사용 가능합니다. host=" + request.getServerName());
            }
            return true;
        }

        // Shop 도메인에서의 처리
        boolean hasSession = shopSessionService.hasShopSession(request);

        if (hasSession) {
            // 세션이 있으면 TTL 갱신 (옵션에 따라)
            if (annotation.refreshTTL()) {
                shopSessionService.refreshTTL(request);
                log.debug("Shop 세션 TTL 갱신됨");
            }

            // 세션 데이터를 Request Attribute에 저장
            shopSessionService.getShopSession(request)
                    .ifPresent(data -> request.setAttribute(SHOP_SESSION_ATTRIBUTE, data));

        } else if (annotation.autoCreate()) {
            // 세션이 없고 autoCreate가 true면 자동 생성
            ShopSessionData newData = ShopSessionData.builder().build();
            String sessionId = shopSessionService.createShopSession(request, response, newData);
            request.setAttribute(SHOP_SESSION_ATTRIBUTE, newData);
            log.info("Shop 세션 자동 생성: sessionId={}, host={}", sessionId, request.getServerName());

        } else {
            // 세션이 없고 autoCreate가 false면 예외
            log.warn("Shop 세션 필요하지만 없음: {}", request.getRequestURI());
            throw new ShopSessionNotFoundException("Shop 세션이 필요합니다. 먼저 세션을 생성해주세요.");
        }

        return true;
    }

    /**
     * 어노테이션 조회 (메서드 → 클래스 순서)
     */
    private ShopSessionRequired getAnnotation(HandlerMethod handlerMethod) {
        // 1. 메서드 레벨 어노테이션 확인
        ShopSessionRequired methodAnnotation = handlerMethod.getMethodAnnotation(ShopSessionRequired.class);
        if (methodAnnotation != null) {
            return methodAnnotation;
        }

        // 2. 클래스 레벨 어노테이션 확인
        return handlerMethod.getBeanType().getAnnotation(ShopSessionRequired.class);
    }

    /**
     * Shop 세션 없음 예외
     */
    public static class ShopSessionNotFoundException extends RuntimeException {
        public ShopSessionNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Shop 도메인이 아닐 때 예외
     */
    public static class NotShopDomainException extends RuntimeException {
        public NotShopDomainException(String message) {
            super(message);
        }
    }
}
