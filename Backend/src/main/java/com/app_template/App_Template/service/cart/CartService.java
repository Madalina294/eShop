package com.app_template.App_Template.service.cart;

import com.app_template.App_Template.dto.CartItemDto;

import java.util.List;


public interface CartService {
    CartItemDto addToCart(Long userId, Long productId, Integer quantity);
    void removeFromCart(Long userId, Long productId);
    List<CartItemDto> getUserCart(Long userId);
    CartItemDto updateQuantity(Long userId, Long productId, Integer quantity);
    void clearCart(Long userId);
    boolean isInCart(Long userId, Long productId);
}
