package com.example.open.common.annotation;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited // ✅ 추가
public @interface CustomApiResponses {
    CustomApiResponse[] value();
}