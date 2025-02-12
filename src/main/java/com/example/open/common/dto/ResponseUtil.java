package com.example.open.common.dto;

import org.springframework.http.HttpStatus;

public class ResponseUtil {

    // HTTP 상태 코드를 지정할 수 있는 성공 응답
    public static <T> CustomResponse<T> success(String message, T data, HttpStatus httpStatus) {
        BodyResponse<T> body = new BodyResponse<>(0, message, data);
        return CustomResponse.of(body, httpStatus);
    }

    // 기본 성공 응답 (HttpStatus.OK, message = "Success")
    public static <T> CustomResponse<T> success(T data) {
        return success("Success", data, HttpStatus.OK);
    }

    // 메시지를 커스텀할 수 있는 성공 응답
    public static <T> CustomResponse<T> success(String message, T data) {
        return success(message, data, HttpStatus.OK);
    }

    // 기본 에러 응답 (HttpStatus.BAD_REQUEST)
    public static <T> CustomResponse<T> error(String message) {
        return error(-1, message, HttpStatus.BAD_REQUEST);
    }

    // 상태 코드와 메시지를 지정할 수 있는 에러 응답
    public static <T> CustomResponse<T> error(int status, String message, HttpStatus httpStatus) {
        BodyResponse<T> body = new BodyResponse<>(status, message, null);
        return CustomResponse.of(body, httpStatus);
    }
}