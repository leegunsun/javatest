package com.example.open.common.redis;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * HTTP 세션 설정 (서브도메인 기반 멀티 세션)
 *
 * 세션 구조:
 * 1. Normal 세션 (Spring Session)
 *    - 쿠키: JSESSIONID
 *    - 도메인: .localhost (모든 서브도메인에서 공유)
 *    - Redis 키: spring:session:sessions:{id}
 *    - 사용: A 도메인, B 도메인 모두에서 접근 가능
 *
 * 2. Shop 세션 (Custom - ShopSessionService)
 *    - 쿠키: SHOP_SESSION_ID
 *    - 도메인: shop.localhost (특정 서브도메인에서만)
 *    - Redis 키: shop:session:{id}
 *    - 사용: B 도메인에서만 접근 가능
 *
 * 테스트 방법:
 * - hosts 파일에 추가:
 *   127.0.0.1 localhost
 *   127.0.0.1 shop.localhost
 * - A 도메인: http://localhost:8082
 * - B 도메인: http://shop.localhost:8082
 */
@Configuration
@EnableRedisHttpSession(
        maxInactiveIntervalInSeconds = 3600,
        redisNamespace = "spring:session"
)
public class HttpSessionConfig {

    /**
     * Normal 세션 쿠키 도메인 설정
     * 앞에 점(.)을 붙이면 모든 서브도메인에서 공유됨
     * 예: .localhost → localhost, shop.localhost 모두에서 접근 가능
     */
    @Value("${session.normal.cookie-domain:.localhost}")
    private String normalSessionCookieDomain;

    /**
     * Normal 세션용 쿠키 직렬화 설정
     * JSESSIONID 쿠키는 모든 서브도메인에서 공유됨
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setSameSite("Lax");
        // 도메인 설정: 모든 서브도메인에서 공유
        serializer.setDomainName(normalSessionCookieDomain);
        return serializer;
    }
}
