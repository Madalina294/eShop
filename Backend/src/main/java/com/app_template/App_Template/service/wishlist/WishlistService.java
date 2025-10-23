package com.app_template.App_Template.service.wishlist;

import com.app_template.App_Template.dto.WishlistItemDto;
import java.util.List;

public interface WishlistService {
    WishlistItemDto addToWishlist(Long userId, Long productId);
    void removeFromWishlist(Long userId, Long productId);
    List<WishlistItemDto> getUserWishlist(Long userId);
    boolean isInWishlist(Long userId, Long productId);
}