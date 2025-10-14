package com.app_template.App_Template.controller;

import com.app_template.App_Template.dto.CategoryDto;
import com.app_template.App_Template.entity.Category;
import com.app_template.App_Template.service.admin.category.CategoryService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/category")
@RequiredArgsConstructor

public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping("/create-category")
    public ResponseEntity<Category> addCategory(@RequestBody CategoryDto categoryDto) {
        Category category = categoryService.createCategory(categoryDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @GetMapping("/get-categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(categoryService.getCategories());
    }

    @DeleteMapping("/delete-category/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try{
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(null);
        }catch(EntityNotFoundException e){
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/get-category/{id}")
    public ResponseEntity<CategoryDto> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategory(id));
    }

    @PutMapping("/edit-category")
    public ResponseEntity<CategoryDto> editCategory(@RequestBody CategoryDto categoryDto) {
        try {
            return ResponseEntity.ok(categoryService.updateCategory(categoryDto));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
