package com.example.open.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "로그인 요청 DTO")
public class LoginRequest {
    
    @Schema(description = "사용자명", example = "admin", required = true)
    private String username;
    
    @Schema(description = "비밀번호", example = "admin123", required = true)
    private String password;
}