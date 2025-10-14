package com.app_template.App_Template.service.admin.category;

import com.app_template.App_Template.dto.CategoryDto;
import com.app_template.App_Template.entity.Category;

import java.util.List;

public interface CategoryService {
    Category createCategory(CategoryDto categoryDto);
    List<CategoryDto> getCategories();
    void deleteCategory(Long categoryId);
    CategoryDto getCategory(Long id);
    CategoryDto updateCategory(CategoryDto categoryDto);
}
