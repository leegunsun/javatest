package com.example.open.domain.todo.dto.internal;

import com.example.open.domain.todo.dto.contract.PaymentBase;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
@Schema(title = "CardPaymentDto", description = "카드 결제 DTO")
public class CardPaymentDTO implements PaymentBase {

    public final String a;
    public final String a2;
    public final String a3;
    public final String a4;

    @Override
    public String getType() {
        return "card";
    }
}
