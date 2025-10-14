package com.app_template.App_Template.service.admin.category;

import com.app_template.App_Template.dto.CategoryDto;
import com.app_template.App_Template.entity.Category;
import com.app_template.App_Template.repository.CategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    @Override
    public Category createCategory(CategoryDto categoryDto) {
        Category category = new Category();
        category.setName(categoryDto.getName());
        category.setDescription(categoryDto.getDescription());
        return categoryRepository.save(category);
    }

    @Override
    public List<CategoryDto> getCategories() {
        return categoryRepository.findAll().stream().map(Category::getCategoryDto).collect(Collectors.toList());
    }

    @Override
    public void deleteCategory(Long categoryId) {
        Optional<Category> category = categoryRepository.findById(categoryId);
        if (category.isPresent()) {
            categoryRepository.delete(category.get());
        }
        else throw new EntityNotFoundException("Category not found");
    }

    @Override
    public CategoryDto getCategory(Long id) {
        Optional<Category> category = categoryRepository.findById(id);
        if (category.isPresent()) {
            return category.get().getCategoryDto();
        }
        else throw new EntityNotFoundException("Category not found");
    }

    @Override
    public CategoryDto updateCategory(CategoryDto categoryDto) {
        Optional<Category> category = categoryRepository.findById(categoryDto.getId());
        if (category.isPresent()) {
            Category categoryEntity = category.get();
            categoryEntity.setName(categoryDto.getName());
            categoryEntity.setDescription(categoryDto.getDescription());
           return categoryRepository.save(categoryEntity).getCategoryDto();
        }
        else throw new EntityNotFoundException("Category not found");
    }
}
