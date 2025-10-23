package com.app_template.App_Template.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.auth.UpdateInfosRequest;
import com.app_template.App_Template.auth.UpdatePasswordRequest;
import com.app_template.App_Template.dto.CategoryDto;
import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.dto.UserDto;
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

}
