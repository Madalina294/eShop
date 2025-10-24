package com.app_template.App_Template.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CartItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private double productPrice;
    private Integer quantity;
    private LocalDateTime addedAt;
}
