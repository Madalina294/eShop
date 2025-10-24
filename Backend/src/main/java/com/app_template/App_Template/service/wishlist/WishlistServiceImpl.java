package com.app_template.App_Template.service.wishlist;

import com.app_template.App_Template.dto.WishlistItemDto;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.entity.WishlistItem;
import com.app_template.App_Template.repository.ProductRepository;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.repository.WishlistRepository;
import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public WishlistItemDto addToWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        Optional<WishlistItem> existingItem = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existingItem.isPresent()) {
            throw new IllegalArgumentException("Product already in wishlist");
        }

        WishlistItem wishlistItem = new WishlistItem();
        wishlistItem.setUser(user);
        wishlistItem.setProduct(product);

        WishlistItem savedItem = wishlistRepository.save(wishlistItem);

        return convertToDto(savedItem);
    }

    @Override
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistItemDto> getUserWishlist(Long userId) {
        List<WishlistItem> wishlistItems = wishlistRepository.findByUserId(userId);
        return wishlistItems.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    private WishlistItemDto convertToDto(WishlistItem item) {
        WishlistItemDto dto = new WishlistItemDto();
        dto.setId(item.getId());
        dto.setUserId(item.getUser().getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setProductPrice(item.getProduct().getPrice());
        dto.setProductImage(item.getProduct().getImage());
        dto.setProductQuantity(item.getProduct().getQuantity());
        dto.setAddedAt(item.getAddedAt());
        return dto;
    }
}
