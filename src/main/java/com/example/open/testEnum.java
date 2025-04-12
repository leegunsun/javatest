package com.example.open;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum testEnum implements TestAbstract {

    SUCCESS(0, "성공"),
    ERROR(1, "오류");

    private final int code;
    private final String message;
}