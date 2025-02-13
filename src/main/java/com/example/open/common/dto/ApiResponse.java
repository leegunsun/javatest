package com.example.open.common.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ApiResponse<T> extends ResponseEntity<BodyResponse<T>> {

    // 생성자를 private으로 설정하여 정적 팩토리 메서드를 통한 객체 생성을 유도합니다.
    private ApiResponse(BodyResponse<T> body, HttpStatus status) {
        super(body, status);
    }

    // 정적 팩토리 메서드: 객체 생성을 캡슐화합니다.
    public static <T> ApiResponse<T> of(BodyResponse<T> body, HttpStatus status) {
        return new ApiResponse<>(body, status);
    }

    // HTTP 상태 코드를 지정할 수 있는 성공 응답
    public static <T> ApiResponse<T> success(String message, T data, HttpStatus httpStatus) {
        BodyResponse<T> body = new BodyResponse<>(0, message, data);
        return of(body, httpStatus);
    }

    // 기본 성공 응답 (HttpStatus.OK, message = "Success")
    public static <T> ApiResponse<T> success(T data) {
        return success("Success", data, HttpStatus.OK);
    }

    // 메시지를 커스텀할 수 있는 성공 응답 (HttpStatus.OK)
    public static <T> ApiResponse<T> success(String message, T data) {
        return success(message, data, HttpStatus.OK);
    }

    // 기본 에러 응답 (HttpStatus.BAD_REQUEST)
    public static <T> ApiResponse<T> error(String message) {
        return error(-1, message, HttpStatus.BAD_REQUEST);
    }

    // 상태 코드와 메시지를 지정할 수 있는 에러 응답
    public static <T> ApiResponse<T> error(int status, String message, HttpStatus httpStatus) {
        BodyResponse<T> body = new BodyResponse<>(status, message, null);
        return of(body, httpStatus);
    }
}