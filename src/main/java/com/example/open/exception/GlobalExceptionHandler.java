package com.example.open.exception;

import com.example.open.common.dto.ErrorResponse;
import com.example.open.common.service.ProfileCheckerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final ProfileCheckerService profileCheckerService;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        String message = "서버 오류 입니다.";

        if(profileCheckerService.isDebug()) {
            message = ex.getCause().getMessage();
        }

        return ResponseEntity.status((HttpStatus.INTERNAL_SERVER_ERROR)).body(new ErrorResponse(500, message));
    }

}
