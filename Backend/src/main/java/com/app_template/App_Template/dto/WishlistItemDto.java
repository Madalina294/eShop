package com.app_template.App_Template.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WishlistItemDto {
    private Long id;
    private Long userId;
    private Long productId;
    private String productName;
    private double productPrice;
    private String productImage;
    private LocalDateTime addedAt;
}