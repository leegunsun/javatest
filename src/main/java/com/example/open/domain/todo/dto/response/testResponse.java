package com.example.open.domain.todo.dto.response;

import com.example.open.domain.todo.dto.contract.PaymentBase;
import lombok.Data;

import java.util.List;

@Data
public class testResponse {

    public List<PaymentBase> paymentList;

}
