package com.example.open.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Data
@AllArgsConstructor
@Getter
public class BodyResponse<T> {
    private final int status;
    private final String message;
    private T data;

    public ResponseEntity<BodyResponse<T>> toResponseEntity(HttpStatus status) {
        return ResponseEntity.status(status).body(this);
    }
}