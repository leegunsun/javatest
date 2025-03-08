package com.example.open.common.utile;

import java.util.List;

public class CustomInitializerException extends ExceptionInInitializerError {
    public CustomInitializerException(String message) {
        super(message);
    }

    @Override
    public String toString() {
        String msg = getMessage();
        if (msg != null) {
            // 운영체제에 맞는 줄바꿈 문자로 대체
            return getClass().getName() + ": " + msg.replace("\n", System.lineSeparator());
        } else {
            return getClass().getName();
        }
    }
}
