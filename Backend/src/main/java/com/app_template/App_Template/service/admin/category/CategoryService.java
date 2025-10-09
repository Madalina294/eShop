package com.app_template.App_Template.service.admin.category;

import com.app_template.App_Template.dto.CategoryDto;
import com.app_template.App_Template.entity.Category;

public interface CategoryService {
    Category createCategory(CategoryDto categoryDto);
}
