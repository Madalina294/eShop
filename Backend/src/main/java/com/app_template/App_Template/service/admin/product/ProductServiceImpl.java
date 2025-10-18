package com.app_template.App_Template.service.admin.product;

import java.io.IOException;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.entity.Category;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.repository.CategoryRepository;
import com.app_template.App_Template.repository.ProductRepository;
import com.app_template.App_Template.service.image.ImageService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ImageService imageService;

    @Override
    public Product addProduct(ProductDto productDto, MultipartFile image) throws IOException {
        Product product = new Product();
        product.setName(productDto.getName());
        product.setPrice(productDto.getPrice());
        product.setDescription(productDto.getDescription());
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
        
        // Salvează produsul pentru a obține ID-ul
        Product savedProduct = productRepository.save(product);
        
        // Procesează și salvează imaginea dacă există
        if (image != null && !image.isEmpty()) {
            String imageUrl = imageService.saveProductImage(savedProduct.getId(), image);
            savedProduct.setImage(imageUrl);
            savedProduct = productRepository.save(savedProduct);
        }
        
        return savedProduct;
    }

    @Override
    public void deleteProduct(Long productId) throws EntityNotFoundException {
        Optional<Product> product = productRepository.findById(productId);
        if(product.isPresent()){
            try {
                imageService.deleteProductImage(productId);
            } catch (IOException e) {
                // Log eroarea dar continuă cu ștergerea contului
                System.err.println("Failed to delete product image: " + e.getMessage());
            }
            productRepository.delete(product.get());
        }
        else throw new EntityNotFoundException("Product not found");
    }

    @Override
    public ProductDto getProduct(Long productId) throws EntityNotFoundException {
        Optional<Product> product = productRepository.findById(productId);
        if(product.isPresent()){
            return product.get().getProductDto();
        }
        else throw new EntityNotFoundException("Product not found");
    }

    @Override
    public ProductDto updateProduct(ProductDto productDto, MultipartFile image) throws EntityNotFoundException, IOException {
        Optional<Product> product = productRepository.findById(productDto.getId());
        if(product.isPresent()){
            Product foundProduct = product.get();
            foundProduct.setName(productDto.getName());
            foundProduct.setPrice(productDto.getPrice());
            foundProduct.setDescription(productDto.getDescription());
            foundProduct.setColor(productDto.getColor());
            foundProduct.setDimensions(productDto.getDimensions());
            foundProduct.setMaterial(productDto.getMaterial());
            foundProduct.setWeight(productDto.getWeight());
            foundProduct.setQuantity(productDto.getQuantity());

            if (image != null && !image.isEmpty()) {
                // Șterge imaginea veche mai întâi
                try {
                    imageService.deleteProductImage(productDto.getId());
                } catch (IOException e) {
                    // Log eroarea dar continuă
                    System.err.println("Failed to delete old product image: " + e.getMessage());
                }
                // Salvează imaginea nouă
                String imageUrl = imageService.saveProductImage(productDto.getId(), image);
                foundProduct.setImage(imageUrl);
            }
            Optional<Category> category = categoryRepository.findById(productDto.getCategoryId());
            if(category.isPresent()){
                foundProduct.setCategory(category.get());
            }
            else {
                throw new EntityNotFoundException("Category not found");
            }
            return productRepository.save(foundProduct).getProductDto();
        }
        else throw new EntityNotFoundException("Product not found");
    }
}
