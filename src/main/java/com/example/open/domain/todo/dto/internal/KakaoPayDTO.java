package com.example.open.domain.todo.dto.internal;

import com.example.open.domain.todo.dto.contract.PaymentBase;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
@Schema(title = "KakaoPayDto", description = "카카오페이 결제 요청 DTO")
public class KakaoPayDTO implements PaymentBase {

    @Schema(description = "카카오 결제 고유 식별자", example = "KAKAO1234")
    public final String b;

    @Schema(description = "카카오 사용자 이름", example = "홍길동")
    public final String b1;

    @Schema(description = "카카오 사용자 전화번호", example = "010-1234-5678")
    public final String b2;

    @Override
    @Schema(description = "결제 수단 타입", example = "kakao", allowableValues = {"kakao", "card"})
    public String getType() {
        return "kakao";
    }
}