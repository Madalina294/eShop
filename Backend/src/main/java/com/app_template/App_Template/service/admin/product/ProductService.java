package com.app_template.App_Template.service.admin.product;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.entity.Product;

import jakarta.persistence.EntityNotFoundException;

public interface ProductService {
    Product addProduct(ProductDto productDto, MultipartFile image) throws IOException;
    void deleteProduct(Long productId) throws EntityNotFoundException;
    ProductDto getProduct(Long productId) throws EntityNotFoundException;
    ProductDto updateProduct(ProductDto productDto, MultipartFile image) throws EntityNotFoundException, IOException;
    List<ProductDto> getAllProducts();
    Page<ProductDto> getProductsPaginated(int page, int size, String sortBy, String sortDir, Long categoryId);

}
