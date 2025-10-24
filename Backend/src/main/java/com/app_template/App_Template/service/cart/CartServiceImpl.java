package com.app_template.App_Template.service.cart;

import com.app_template.App_Template.dto.CartItemDto;
import com.app_template.App_Template.entity.CartItem;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.repository.CartRepository;
import com.app_template.App_Template.repository.ProductRepository;
import com.app_template.App_Template.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public CartItemDto addToCart(Long userId, Long productId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        // Verifică dacă produsul există deja în cart
        Optional<CartItem> existingItem = cartRepository.findByUserIdAndProductId(userId, productId);

        if (existingItem.isPresent()) {
            // Dacă există, actualizează cantitatea
            CartItem item = existingItem.get();
            item.setQuantity(quantity);
            CartItem savedItem = cartRepository.save(item);
            return convertToDto(savedItem);
        } else {
            // Dacă nu există, creează un nou item
            CartItem cartItem = new CartItem();
            cartItem.setUser(user);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);

            CartItem savedItem = cartRepository.save(cartItem);
            return convertToDto(savedItem);
        }
    }

    @Override
    public void removeFromCart(Long userId, Long productId) {
        cartRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItemDto> getUserCart(Long userId) {
        List<CartItem> cartItems = cartRepository.findByUserId(userId);
        return cartItems.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public CartItemDto updateQuantity(Long userId, Long productId, Integer quantity) {
        CartItem cartItem = cartRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new EntityNotFoundException("Cart item not found"));

        if (quantity <= 0) {
            cartRepository.delete(cartItem);
            return null;
        }

        cartItem.setQuantity(quantity);
        CartItem savedItem = cartRepository.save(cartItem);
        return convertToDto(savedItem);
    }

    @Override
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }

    @Override
    public boolean isInCart(Long userId, Long productId) {
        return cartRepository.existsByUserIdAndProductId(userId, productId);
    }

    private CartItemDto convertToDto(CartItem item) {
        CartItemDto dto = new CartItemDto();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setProductImage(item.getProduct().getImage());
        dto.setProductPrice(item.getProduct().getPrice());
        dto.setQuantity(item.getQuantity());
        dto.setAddedAt(item.getCreatedAt());
        return dto;
    }
}
