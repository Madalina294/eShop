package com.app_template.App_Template.service.admin.product;

import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.entity.Category;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.repository.CategoryRepository;
import com.app_template.App_Template.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public Product addProduct(ProductDto productDto) {
        Product product = new Product();
        product.setName(productDto.getName());
        product.setPrice(productDto.getPrice());
        product.setDescription(productDto.getDescription());
        product.setImage(productDto.getImage());
        product.setColor(productDto.getColor());
        product.setDimensions(productDto.getDimensions());
        product.setMaterial(productDto.getMaterial());
        product.setWeight(productDto.getWeight());
        product.setQuantity(productDto.getQuantity());

        Optional<Category> category = categoryRepository.findById(productDto.getCategoryId());
        if(category.isEmpty()){
            throw new EntityNotFoundException("Category not found");
        }
        product.setCategory(category.get());
        return productRepository.save(product);
    }
}
