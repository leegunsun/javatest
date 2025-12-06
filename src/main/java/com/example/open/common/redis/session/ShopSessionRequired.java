package com.example.open.common.redis.session;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Shop 세션 자동 획득 어노테이션
 *
 * 이 어노테이션이 붙은 컨트롤러 또는 메서드에 접근 시
 * Shop 세션이 없으면 자동으로 생성합니다.
 *
 * 사용 예시:
 * <pre>
 * {@code
 * @ShopSessionRequired
 * @GetMapping("/products")
 * public ResponseEntity<?> getProducts() { ... }
 *
 * // 또는 클래스 레벨
 * @ShopSessionRequired
 * @RestController
 * @RequestMapping("/shop")
 * public class ShopController { ... }
 * }
 * </pre>
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ShopSessionRequired {

    /**
     * 세션이 없을 때 자동 생성 여부
     * false로 설정하면 세션 존재 여부만 확인하고 없으면 예외 발생
     */
    boolean autoCreate() default true;

    /**
     * TTL 자동 갱신 여부
     * true로 설정하면 요청마다 TTL을 갱신
     */
    boolean refreshTTL() default true;
}
