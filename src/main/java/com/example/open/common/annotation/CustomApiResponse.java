package com.example.open.common.annotation;

import io.swagger.v3.oas.annotations.extensions.Extension;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.links.Link;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @CustomApiResponse는 Swagger의 @ApiResponse를 대체하는 어노테이션입니다.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited  // 상속 가능하도록 추가
@Repeatable(CustomApiResponses.class)  // ✅ 새로운 컨테이너 어노테이션 사용
public @interface CustomApiResponse {

    String description() default "";

    String responseCode() default "default";

    Header[] headers() default {};

    Link[] links() default {};

    Content[] content() default {};

    Extension[] extensions() default {};

    String ref() default "";

    boolean useReturnTypeSchema() default false;
}