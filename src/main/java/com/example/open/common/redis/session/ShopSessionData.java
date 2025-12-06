package com.example.open.common.redis.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Shop 세션 데이터 클래스
 * Redis에 저장되는 커스텀 Shop 세션 정보를 담는 클래스
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopSessionData implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 방문자 식별자
     */
    private String visitorId;

    /**
     * 장바구니 아이템 목록
     */
    @Builder.Default
    private List<CartItem> cart = new ArrayList<>();

    /**
     * 결제 단계 (1~5)
     * 1: 장바구니 확인
     * 2: 배송지 입력
     * 3: 결제 수단 선택
     * 4: 결제 진행
     * 5: 결제 완료
     */
    private Integer checkoutStep;

    /**
     * 선택된 딜러 ID
     */
    private Long selectedDealerId;

    /**
     * 세션 생성 시간
     */
    private LocalDateTime createdAt;

    /**
     * 마지막 접근 시간
     */
    private LocalDateTime lastAccessedAt;

    /**
     * 장바구니 아이템 클래스
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItem implements Serializable {

        private static final long serialVersionUID = 1L;

        private Long productId;
        private String productName;
        private Integer quantity;
        private Long price;
    }
}
