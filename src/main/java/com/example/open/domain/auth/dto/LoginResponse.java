package com.example.open.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Schema(description = "로그인 응답 DTO")
public class LoginResponse {

    @Schema(description = "성공 여부", example = "true")
    private boolean success;

    @Schema(description = "응답 메시지", example = "로그인 성공")
    private String message;

    @Schema(description = "사용자명", example = "admin")
    private String username;
}
