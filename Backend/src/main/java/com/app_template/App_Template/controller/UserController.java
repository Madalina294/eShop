package com.app_template.App_Template.controller;

import java.util.List;
import java.util.Map;

import com.app_template.App_Template.dto.*;
import com.app_template.App_Template.service.cart.CartService;
import com.app_template.App_Template.service.wishlist.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.app_template.App_Template.auth.UpdateInfosRequest;
import com.app_template.App_Template.auth.UpdatePasswordRequest;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.admin.category.CategoryService;
import com.app_template.App_Template.service.admin.product.ProductService;
import com.app_template.App_Template.service.user.UserService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor

public class UserController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private CartService cartService;

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<?> delete(@PathVariable("userId") Long userId, 
                                   org.springframework.security.core.Authentication authentication) {
        try {
            // Verifică dacă utilizatorul încearcă să-și șteargă propriul cont
            String currentUserEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
            
            // Verifică dacă ID-ul din URL corespunde cu ID-ul utilizatorului autentificat
            if (!currentUser.getId().equals(userId)) {
                return new ResponseEntity<>("You can only delete your own account", HttpStatus.FORBIDDEN);
            }
            
            userService.deleteAccount(userId);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (EntityNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error deleting account: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/update-infos")
    public ResponseEntity<?> updateProfile(@ModelAttribute UpdateInfosRequest request) {
        try{
            UserDto user = userService.updateProfileInfos(request);
            return new ResponseEntity<>(user, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }catch (Exception e){
            return ResponseEntity.badRequest().body("Error updating profile: " + e.getMessage());
        }
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody UpdatePasswordRequest request) {
        try {
            UserDto user = userService.updatePassword(request);
            return new ResponseEntity<>(user, HttpStatus.OK);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating password: " + e.getMessage());
        }
    }

    @PutMapping("/update-theme/{userId}/{theme}")
    public ResponseEntity<?> updatePreferredTheme(@PathVariable("userId") Long userId, @PathVariable("theme") String theme) {
        try{
            UserDto user = userService.updatePreferredTheme(userId, theme);
            return new ResponseEntity<>(user, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update-language/{userId}/{language}")
    public ResponseEntity<?> updatePreferredLanguage(@PathVariable("userId") Long userId, @PathVariable("language") String language) {
        try{
            UserDto user = userService.updatePreferredLanguage(userId, language);
            return new ResponseEntity<>(user, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/get-all-products")
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        return ResponseEntity.ok(this.productService.getAllProducts());
    }

    @GetMapping("/get-products-paginated")
    public ResponseEntity<?> getProductsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) Long categoryId) {
        try {
            Page<ProductDto> products = productService.getProductsPaginated(page, size, sortBy, sortDir, categoryId);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving products: " + e.getMessage());
        }
    }

    @GetMapping("/get-categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(categoryService.getCategories());
    }

    @GetMapping("/get-product/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable(name = "id") Long id) {
        try {
            return new ResponseEntity<>(productService.getProduct(id), HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }

    }

    // wishlist endpoits

    @PostMapping("/wishlist/add/{productId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long productId,
                                           org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            WishlistItemDto result = wishlistService.addToWishlist(user.getId(), productId);
            return ResponseEntity.ok(result);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding to wishlist: " + e.getMessage());
        }
    }

    @DeleteMapping("/wishlist/remove/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long productId,
                                                org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            wishlistService.removeFromWishlist(user.getId(), productId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing from wishlist: " + e.getMessage());
        }
    }

    @GetMapping("/wishlist")
    public ResponseEntity<List<WishlistItemDto>> getUserWishlist(org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            List<WishlistItemDto> wishlist = wishlistService.getUserWishlist(user.getId());
            return ResponseEntity.ok(wishlist);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/wishlist/check/{productId}")
    public ResponseEntity<Boolean> isInWishlist(@PathVariable Long productId,
                                                org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            boolean isInWishlist = wishlistService.isInWishlist(user.getId(), productId);
            return ResponseEntity.ok(isInWishlist);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Cart endpoints
    @PostMapping("/cart/add/{productId}")
    public ResponseEntity<?> addToCart(@PathVariable Long productId,
                                       @RequestBody Map<String, Integer> request,
                                       org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            Integer quantity = request.getOrDefault("quantity", 1);
            CartItemDto result = cartService.addToCart(user.getId(), productId, quantity);
            return ResponseEntity.ok(result);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding to cart: " + e.getMessage());
        }
    }

    @DeleteMapping("/cart/remove/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId,
                                            org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            cartService.removeFromCart(user.getId(), productId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing from cart: " + e.getMessage());
        }
    }

    @GetMapping("/cart")
    public ResponseEntity<List<CartItemDto>> getUserCart(org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            List<CartItemDto> cart = cartService.getUserCart(user.getId());
            return ResponseEntity.ok(cart);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/cart/update/{productId}")
    public ResponseEntity<?> updateCartItemQuantity(@PathVariable Long productId,
                                                    @RequestBody Map<String, Integer> request,
                                                    org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            Integer quantity = request.get("quantity");
            if (quantity == null) {
                return ResponseEntity.badRequest().body("Quantity is required");
            }

            CartItemDto result = cartService.updateQuantity(user.getId(), productId, quantity);
            return ResponseEntity.ok(result);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating cart item: " + e.getMessage());
        }
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<?> clearCart(org.springframework.security.core.Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            cartService.clearCart(user.getId());
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error clearing cart: " + e.getMessage());
        }
    }

}
