package com.example.open.common.redis.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

/**
 * Shop 세션 관리 서비스
 * Redis를 사용하여 커스텀 Shop 세션을 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopSessionService {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Shop 세션 쿠키 이름
     */
    private static final String SHOP_SESSION_COOKIE_NAME = "SHOP_SESSION_ID";

    /**
     * Redis 키 prefix
     */
    private static final String SHOP_SESSION_KEY_PREFIX = "shop:session:";

    /**
     * 세션 만료 시간 (30분)
     */
    private static final Duration SESSION_TTL = Duration.ofMinutes(30);

    /**
     * 쿠키 만료 시간 (초 단위, 30분)
     */
    private static final int COOKIE_MAX_AGE = 30 * 60;

    private final ObjectMapper objectMapper = createObjectMapper();

    private ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    /**
     * 새 Shop 세션 생성 및 쿠키 설정
     *
     * @param response HttpServletResponse
     * @param data     초기 세션 데이터
     * @return 생성된 세션 ID
     */
    public String createShopSession(HttpServletResponse response, ShopSessionData data) {
        String sessionId = UUID.randomUUID().toString();
        String redisKey = SHOP_SESSION_KEY_PREFIX + sessionId;

        LocalDateTime now = LocalDateTime.now();
        data.setCreatedAt(now);
        data.setLastAccessedAt(now);

        if (data.getVisitorId() == null) {
            data.setVisitorId(UUID.randomUUID().toString());
        }

        try {
            String jsonData = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(redisKey, jsonData, SESSION_TTL);
            log.info("Shop 세션 생성: sessionId={}, visitorId={}", sessionId, data.getVisitorId());
        } catch (JsonProcessingException e) {
            log.error("Shop 세션 직렬화 실패", e);
            throw new RuntimeException("Shop 세션 생성 실패", e);
        }

        Cookie cookie = new Cookie(SHOP_SESSION_COOKIE_NAME, sessionId);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(COOKIE_MAX_AGE);
        response.addCookie(cookie);

        return sessionId;
    }

    /**
     * 현재 Shop 세션 조회
     *
     * @param request HttpServletRequest
     * @return Shop 세션 데이터 (Optional)
     */
    public Optional<ShopSessionData> getShopSession(HttpServletRequest request) {
        String sessionId = getSessionIdFromCookie(request);
        if (sessionId == null) {
            log.debug("Shop 세션 쿠키 없음");
            return Optional.empty();
        }

        String redisKey = SHOP_SESSION_KEY_PREFIX + sessionId;
        Object value = redisTemplate.opsForValue().get(redisKey);

        if (value == null) {
            log.debug("Shop 세션 만료 또는 없음: sessionId={}", sessionId);
            return Optional.empty();
        }

        try {
            ShopSessionData data = objectMapper.readValue(value.toString(), ShopSessionData.class);
            log.debug("Shop 세션 조회 성공: sessionId={}, visitorId={}", sessionId, data.getVisitorId());
            return Optional.of(data);
        } catch (JsonProcessingException e) {
            log.error("Shop 세션 역직렬화 실패: sessionId={}", sessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Shop 세션 업데이트
     *
     * @param request HttpServletRequest
     * @param data    업데이트할 세션 데이터
     * @return 업데이트 성공 여부
     */
    public boolean updateShopSession(HttpServletRequest request, ShopSessionData data) {
        String sessionId = getSessionIdFromCookie(request);
        if (sessionId == null) {
            log.warn("Shop 세션 업데이트 실패: 쿠키 없음");
            return false;
        }

        String redisKey = SHOP_SESSION_KEY_PREFIX + sessionId;

        if (Boolean.FALSE.equals(redisTemplate.hasKey(redisKey))) {
            log.warn("Shop 세션 업데이트 실패: 세션 없음, sessionId={}", sessionId);
            return false;
        }

        data.setLastAccessedAt(LocalDateTime.now());

        try {
            String jsonData = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(redisKey, jsonData, SESSION_TTL);
            log.info("Shop 세션 업데이트: sessionId={}", sessionId);
            return true;
        } catch (JsonProcessingException e) {
            log.error("Shop 세션 업데이트 직렬화 실패", e);
            return false;
        }
    }

    /**
     * Shop 세션 삭제
     *
     * @param request  HttpServletRequest
     * @param response HttpServletResponse
     * @return 삭제 성공 여부
     */
    public boolean deleteShopSession(HttpServletRequest request, HttpServletResponse response) {
        String sessionId = getSessionIdFromCookie(request);
        if (sessionId == null) {
            log.debug("Shop 세션 삭제: 쿠키 없음");
            return false;
        }

        String redisKey = SHOP_SESSION_KEY_PREFIX + sessionId;
        Boolean deleted = redisTemplate.delete(redisKey);

        // 쿠키 삭제
        Cookie cookie = new Cookie(SHOP_SESSION_COOKIE_NAME, null);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        log.info("Shop 세션 삭제: sessionId={}, deleted={}", sessionId, deleted);
        return Boolean.TRUE.equals(deleted);
    }

    /**
     * TTL 갱신
     *
     * @param request HttpServletRequest
     * @return 갱신 성공 여부
     */
    public boolean refreshTTL(HttpServletRequest request) {
        String sessionId = getSessionIdFromCookie(request);
        if (sessionId == null) {
            return false;
        }

        String redisKey = SHOP_SESSION_KEY_PREFIX + sessionId;

        if (Boolean.FALSE.equals(redisTemplate.hasKey(redisKey))) {
            return false;
        }

        Boolean result = redisTemplate.expire(redisKey, SESSION_TTL);
        log.debug("Shop 세션 TTL 갱신: sessionId={}, result={}", sessionId, result);
        return Boolean.TRUE.equals(result);
    }

    /**
     * 세션 존재 여부 확인
     *
     * @param request HttpServletRequest
     * @return 세션 존재 여부
     */
    public boolean hasShopSession(HttpServletRequest request) {
        String sessionId = getSessionIdFromCookie(request);
        if (sessionId == null) {
            return false;
        }

        String redisKey = SHOP_SESSION_KEY_PREFIX + sessionId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(redisKey));
    }

    /**
     * 세션 ID 조회 (쿠키에서)
     *
     * @param request HttpServletRequest
     * @return 세션 ID 또는 null
     */
    public String getSessionIdFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        return Arrays.stream(cookies)
                .filter(cookie -> SHOP_SESSION_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    /**
     * 세션이 없으면 생성, 있으면 조회
     *
     * @param request  HttpServletRequest
     * @param response HttpServletResponse
     * @return Shop 세션 데이터
     */
    public ShopSessionData getOrCreateShopSession(HttpServletRequest request, HttpServletResponse response) {
        Optional<ShopSessionData> existing = getShopSession(request);
        if (existing.isPresent()) {
            refreshTTL(request);
            return existing.get();
        }

        ShopSessionData newData = ShopSessionData.builder().build();
        createShopSession(response, newData);
        return newData;
    }
}
