package com.example.open;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum testEnum2 implements TestAbstract {

    SUCCESS(2, "성공"),
    ERROR(3, "오류");

    private final int code;
    private final String message;
}