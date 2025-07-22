package com.example.open.domain.auth.controller;

import com.example.open.domain.auth.dto.LoginRequest;
import com.example.open.domain.auth.dto.LoginResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(
        name = "auth",
        description = "인증 관리 API"
)
public class AuthController {

    @Operation(
            summary = "로그인",
            description = "사용자 로그인을 수행합니다. 성공 시 세션 쿠키(JSESSIONID)가 설정되며, 이후 모든 API 호출에서 자동으로 인증됩니다.\n\n" +
                        "⚠️ **Swagger UI 제한**: 브라우저 보안 정책으로 인해 Swagger UI에서 'Try it out'이 완전히 작동하지 않을 수 있습니다.\n" +
                        "📝 **대안**: Postman, curl 등의 도구를 사용하거나 브라우저 콘솔에서 직접 테스트하세요."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "로그인 성공",
                    headers = @io.swagger.v3.oas.annotations.headers.Header(
                            name = "Set-Cookie",
                            description = "JSESSIONID 세션 쿠키가 설정됩니다",
                            schema = @io.swagger.v3.oas.annotations.media.Schema(type = "string", example = "JSESSIONID=ABC123; Path=/; HttpOnly")
                    )),
            @ApiResponse(responseCode = "401", description = "로그인 실패 - 잘못된 인증정보"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터")
    })
//    @SecurityRequirement(name = {}) // 로그인 API는 인증 불필요
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpSession session) {
        // TODO: 실제 사용자 인증 로직 구현 필요
        // 현재는 데모용으로 간단한 검증만 수행

        if (loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new LoginResponse(false, "사용자명과 비밀번호를 입력해주세요.", null));
        }

        // 데모용 간단한 인증 (실제로는 데이터베이스 조회 필요)
        if ("admin".equals(loginRequest.getUsername()) && "admin123".equals(loginRequest.getPassword())) {
            // 세션에 사용자 정보 저장
            session.setAttribute("userId", 1L);
            session.setAttribute("username", "admin");
            session.setAttribute("isAuthenticated", true);

            return ResponseEntity.ok(new LoginResponse(true, "로그인 성공", "admin"));
        } else {
            return ResponseEntity.status(401)
                    .body(new LoginResponse(false, "잘못된 사용자명 또는 비밀번호입니다.", null));
        }
    }

    @Operation(
            summary = "로그아웃",
            description = "현재 세션을 무효화하여 로그아웃을 수행합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "로그아웃 성공")
    })
    @PostMapping("/logout")
    public ResponseEntity<LoginResponse> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(new LoginResponse(true, "로그아웃 되었습니다.", null));
    }

    @Operation(
            summary = "인증 상태 확인",
            description = "현재 세션의 인증 상태를 확인합니다."
    )
    @GetMapping("/status")
    public ResponseEntity<LoginResponse> getAuthStatus(HttpSession session) {
        Boolean isAuthenticated = (Boolean) session.getAttribute("isAuthenticated");
        String username = (String) session.getAttribute("username");

        if (Boolean.TRUE.equals(isAuthenticated)) {
            return ResponseEntity.ok(new LoginResponse(true, "인증된 사용자입니다.", username));
        } else {
            return ResponseEntity.status(401)
                    .body(new LoginResponse(false, "인증이 필요합니다.", null));
        }
    }
}
