package com.example.open.common.redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * HTTP 세션 설정
 *
 * Redis를 사용한 두 가지 세션 타입 지원:
 * 1. Normal 세션 (Spring Session): JSESSIONID 쿠키, spring:session:sessions:{id} 키
 * 2. Shop 세션 (Custom): SHOP_SESSION_ID 쿠키, shop:session:{id} 키
 */
@Configuration
@EnableRedisHttpSession(
        maxInactiveIntervalInSeconds = 3600,
        redisNamespace = "spring:session"
)
public class HttpSessionConfig {

    /**
     * Normal 세션용 쿠키 직렬화 설정
     * JSESSIONID 쿠키로 Spring Session 관리
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setSameSite("Lax");
        return serializer;
    }
}
