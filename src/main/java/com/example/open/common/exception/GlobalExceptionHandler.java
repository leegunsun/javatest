package com.example.open.common.exception;

import com.example.open.common.dto.ApiResponse;
import com.example.open.common.redis.session.ShopSessionInterceptor;
import com.example.open.common.service.ProfileCheckerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final ProfileCheckerService profileCheckerService;

    @ExceptionHandler(ShopSessionInterceptor.ShopSessionNotFoundException.class)
    public ResponseEntity<?> handleShopSessionNotFound(ShopSessionInterceptor.ShopSessionNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "error", "SHOP_SESSION_REQUIRED",
                        "message", ex.getMessage(),
                        "hint", "POST /api/session-test/shop 을 호출하여 세션을 생성하세요"
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        String causeMessage = (ex.getCause() != null) ? ex.getCause().getMessage() : ex.getMessage();
        // 또는 로깅만 하고 메시지는 공통 메시지로 전달
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("예기치 못한 에러가 발생했습니다: " + causeMessage);
    }

}
