package com.example.open.common.utile;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Getter
@RequiredArgsConstructor
public enum CustomErrorCode {
    INVALID_REQUEST(1000, "잘못된 요청입니다."),
//    RESOURCE_NOT_FOUND(1001, "리소스를 찾을 수 없습니다."),
    RESOURCE_NOT_FOUND2(1001, "잘못된 코드 사용 예시"); // 중복된 코드 사용 시 IDE 오류를 유발하지 않음

    private final int code;
    private final String message;

    private static final Set<Integer> codes = new HashSet<>();

    static {
        for (CustomErrorCode errorCode : CustomErrorCode.values()) {
            if (!codes.add(errorCode.code)) {
                codes.clear();
                throw new ExceptionInInitializerError("중복된 에러 코드 발견: " + errorCode.code);
            }
        }
        codes.clear();
    }
}