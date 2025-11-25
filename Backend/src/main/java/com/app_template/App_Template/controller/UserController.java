package com.app_template.App_Template.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.auth.UpdateInfosRequest;
import com.app_template.App_Template.auth.UpdatePasswordRequest;
import com.app_template.App_Template.dto.CartItemDto;
import com.app_template.App_Template.dto.CategoryDto;
import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.dto.UserDto;
import com.app_template.App_Template.dto.WishlistItemDto;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.admin.category.CategoryService;
import com.app_template.App_Template.service.admin.product.ProductService;
import com.app_template.App_Template.service.cart.CartService;
import com.app_template.App_Template.service.user.UserService;
import com.app_template.App_Template.service.wishlist.WishlistService;
import com.app_template.App_Template.util.ActivityLogHelper;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
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
    
    @Autowired
    private ActivityLogHelper activityLogHelper;

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<?> delete(
            @PathVariable("userId") Long userId,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            // Verifică dacă utilizatorul încearcă să-și șteargă propriul cont
            String currentUserEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
            
            // Verifică dacă ID-ul din URL corespunde cu ID-ul utilizatorului autentificat
            if (!currentUser.getId().equals(userId)) {
                return new ResponseEntity<>("You can only delete your own account", HttpStatus.FORBIDDEN);
            }
            
            String userEmail = currentUser.getEmail();
            String userName = currentUser.getFirstname() + " " + currentUser.getLastname();
            
            // Log account deletion before deleting
            activityLogHelper.logActivity(
                    userId,
                    ActionType.DELETE_ACCOUNT,
                    "Account deleted: " + userEmail + " (" + userName + ")",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            userService.deleteAccount(userId);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (EntityNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error deleting account: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/update-infos")
    public ResponseEntity<?> updateProfile(
            @ModelAttribute UpdateInfosRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try{
            UserDto user = userService.updateProfileInfos(request);
            
            // Log profile update
            if (authentication != null) {
                User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
                if (currentUser != null) {
                    String description = "Profile updated";
                    if (request.getImage() != null && !request.getImage().isEmpty()) {
                        description += " (including image)";
                    }
                    activityLogHelper.logActivity(
                            currentUser.getId(),
                            ActionType.UPDATE_PROFILE,
                            description,
                            httpRequest,
                            LogStatus.SUCCESS
                    );
                }
            }
            
            return new ResponseEntity<>(user, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }catch (Exception e){
            // Log error
            if (authentication != null) {
                User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
                if (currentUser != null) {
                    activityLogHelper.logActivity(
                            currentUser.getId(),
                            ActionType.UPDATE_PROFILE,
                            "Failed to update profile: " + e.getMessage(),
                            httpRequest,
                            LogStatus.ERROR
                    );
                }
            }
            return ResponseEntity.badRequest().body("Error updating profile: " + e.getMessage());
        }
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(
            @RequestBody UpdatePasswordRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            UserDto user = userService.updatePassword(request);
            
            // Log password change
            if (authentication != null) {
                User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
                if (currentUser != null) {
                    activityLogHelper.logActivity(
                            currentUser.getId(),
                            ActionType.CHANGE_PASSWORD,
                            "Password changed successfully",
                            httpRequest,
                            LogStatus.SUCCESS
                    );
                }
            }
            
            return new ResponseEntity<>(user, HttpStatus.OK);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Log error
            if (authentication != null) {
                User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
                if (currentUser != null) {
                    activityLogHelper.logActivity(
                            currentUser.getId(),
                            ActionType.CHANGE_PASSWORD,
                            "Failed to change password: " + e.getMessage(),
                            httpRequest,
                            LogStatus.ERROR
                    );
                }
            }
            return ResponseEntity.badRequest().body("Error updating password: " + e.getMessage());
        }
    }

    @PutMapping("/update-theme/{userId}/{theme}")
    public ResponseEntity<?> updatePreferredTheme(
            @PathVariable("userId") Long userId,
            @PathVariable("theme") String theme,
            HttpServletRequest httpRequest) {
        try{
            UserDto user = userService.updatePreferredTheme(userId, theme);
            
            // Log theme change
            activityLogHelper.logActivity(
                    userId,
                    ActionType.CHANGE_THEME,
                    "Theme changed to: " + theme,
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            return new ResponseEntity<>(user, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update-language/{userId}/{language}")
    public ResponseEntity<?> updatePreferredLanguage(
            @PathVariable("userId") Long userId,
            @PathVariable("language") String language,
            HttpServletRequest httpRequest) {
        try{
            UserDto user = userService.updatePreferredLanguage(userId, language);
            
            // Log language change
            activityLogHelper.logActivity(
                    userId,
                    ActionType.CHANGE_LANGUAGE,
                    "Language changed to: " + language,
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
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
    public ResponseEntity<ProductDto> getProduct(
            @PathVariable(name = "id") Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            ProductDto product = productService.getProduct(id);
            
            // Log product view
            if (authentication != null) {
                User user = userRepository.findByEmail(authentication.getName()).orElse(null);
                if (user != null) {
                    activityLogHelper.logActivity(
                            user.getId(),
                            ActionType.VIEW_PRODUCT,
                            "Viewed product: " + product.getName() + " (ID: " + id + ")",
                            httpRequest,
                            LogStatus.SUCCESS
                    );
                }
            }
            
            return new ResponseEntity<>(product, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    // wishlist endpoits

    @PostMapping("/wishlist/add/{productId}")
    public ResponseEntity<?> addToWishlist(
            @PathVariable Long productId,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            WishlistItemDto result = wishlistService.addToWishlist(user.getId(), productId);
            
            // Log add to wishlist
            ProductDto product = productService.getProduct(productId);
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.ADD_TO_WISHLIST,
                    "Added product to wishlist: " + product.getName() + " (ID: " + productId + ")",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
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
    public ResponseEntity<?> removeFromWishlist(
            @PathVariable Long productId,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            // Get product name before removing
            ProductDto product = productService.getProduct(productId);
            wishlistService.removeFromWishlist(user.getId(), productId);
            
            // Log remove from wishlist
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.REMOVE_FROM_WISHLIST,
                    "Removed product from wishlist: " + product.getName() + " (ID: " + productId + ")",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing from wishlist: " + e.getMessage());
        }
    }

    @GetMapping("/wishlist")
    public ResponseEntity<List<WishlistItemDto>> getUserWishlist(
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            List<WishlistItemDto> wishlist = wishlistService.getUserWishlist(user.getId());
            
            // Log view wishlist
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.VIEW_WISHLIST,
                    "Viewed wishlist (" + wishlist.size() + " items)",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
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
    public ResponseEntity<?> addToCart(
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            Integer quantity = request.getOrDefault("quantity", 1);
            CartItemDto result = cartService.addToCart(user.getId(), productId, quantity);
            
            // Log add to cart
            ProductDto product = productService.getProduct(productId);
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.ADD_TO_CART,
                    "Added to cart: " + product.getName() + " x" + quantity + " (ID: " + productId + ")",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
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
    public ResponseEntity<?> removeFromCart(
            @PathVariable Long productId,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            // Get product name before removing
            ProductDto product = productService.getProduct(productId);
            cartService.removeFromCart(user.getId(), productId);
            
            // Log remove from cart
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.REMOVE_FROM_CART,
                    "Removed from cart: " + product.getName() + " (ID: " + productId + ")",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing from cart: " + e.getMessage());
        }
    }

    @GetMapping("/cart")
    public ResponseEntity<List<CartItemDto>> getUserCart(
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            List<CartItemDto> cart = cartService.getUserCart(user.getId());
            
            // Log view cart
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.VIEW_CART,
                    "Viewed cart (" + cart.size() + " items)",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            return ResponseEntity.ok(cart);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/cart/update/{productId}")
    public ResponseEntity<?> updateCartItemQuantity(
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            String userEmail = authentication.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            Integer quantity = request.get("quantity");
            if (quantity == null) {
                return ResponseEntity.badRequest().body("Quantity is required");
            }

            CartItemDto result = cartService.updateQuantity(user.getId(), productId, quantity);
            
            // Log update cart quantity
            ProductDto product = productService.getProduct(productId);
            activityLogHelper.logActivity(
                    user.getId(),
                    ActionType.UPDATE_CART_QUANTITY,
                    "Updated cart quantity: " + product.getName() + " x" + quantity + " (ID: " + productId + ")",
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
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
