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
 *    - 도메인: 설정에 따라 다름 (localhost 환경에서는 도메인 생략)
 *    - Redis 키: spring:session:sessions:{id}
 *    - 사용: 설정된 도메인에서 접근 가능
 *
 * 2. Shop 세션 (Custom - ShopSessionService)
 *    - 쿠키: SHOP_SESSION_ID
 *    - 도메인: 특정 서브도메인에서만
 *    - Redis 키: shop:session:{id}
 *    - 사용: B 도메인에서만 접근 가능
 *
 * 주의: localhost는 TLD가 없어서 .localhost 형태의 쿠키 도메인이 허용되지 않습니다.
 * - 로컬 테스트: cookie-domain을 비워두거나 localhost로 설정
 * - 운영 환경: .example.com 형태로 설정 (서브도메인 공유)
 */
@Configuration
@EnableRedisHttpSession(
        maxInactiveIntervalInSeconds = 3600,
        redisNamespace = "spring:session"
)
public class HttpSessionConfig {

    /**
     * Normal 세션 쿠키 도메인 설정
     * - 빈 문자열 또는 미설정: 현재 호스트에서만 유효 (localhost 환경용)
     * - .example.com: 모든 서브도메인에서 공유 (운영 환경용)
     */
    @Value("${session.normal.cookie-domain:}")
    private String normalSessionCookieDomain;

    /**
     * Normal 세션용 쿠키 직렬화 설정
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setSameSite("Lax");

        // 도메인 설정: 빈 문자열이 아닌 경우에만 설정
        // localhost 환경에서는 도메인을 설정하지 않음 (TLD 없음 문제 회피)
        if (normalSessionCookieDomain != null && !normalSessionCookieDomain.isBlank()) {
            serializer.setDomainName(normalSessionCookieDomain);
        }

        return serializer;
    }
}
