package com.example.open.common.utile;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CustomErrorCode2 implements TestErrorInter {
    INVALID_REQUEST(1009, "잘못된 요청입니다."),
    RESOURCE_NOT_FOUND(1001, "리소스를 찾을 수 없습니다.");

    private final int code;
    private final String message;
}
