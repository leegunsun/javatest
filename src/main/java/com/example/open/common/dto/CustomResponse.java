package com.example.open.common.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class CustomResponse<T> extends ResponseEntity<BodyResponse<T>> {

    public CustomResponse(BodyResponse<T> body, HttpStatus status) {
        super(body, status);
    }

    // 정적 팩토리 메서드를 추가하여 가독성을 높일 수 있습니다.
    public static <T> CustomResponse<T> of(BodyResponse<T> body, HttpStatus status) {
        return new CustomResponse<>(body, status);
    }
}