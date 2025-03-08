package com.example.open.common.utile;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CustomErrorCode3 {
    INVALID_REQUEST(1002, "잘못된 요청입니다."),
    RESOURCE_NOT_FOUND2(1001, "잘못된 코드 사용 예시"); // 중복된 코드 사용 시 오류를 발생시켜야함

    private final int code;
    private final String message;
}