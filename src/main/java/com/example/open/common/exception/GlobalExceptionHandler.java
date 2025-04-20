package com.example.open.common.exception;

import com.example.open.common.dto.ApiResponse;
import com.example.open.common.service.ProfileCheckerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final ProfileCheckerService profileCheckerService;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        String causeMessage = (ex.getCause() != null) ? ex.getCause().getMessage() : ex.getMessage();
        // 또는 로깅만 하고 메시지는 공통 메시지로 전달
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("예기치 못한 에러가 발생했습니다: " + causeMessage);
    }

}
