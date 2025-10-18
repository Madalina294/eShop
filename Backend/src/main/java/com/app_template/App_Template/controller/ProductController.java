package com.app_template.App_Template.controller;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.service.admin.product.ProductService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping("/add-product")
    public ResponseEntity<Product> addProduct(
            @RequestParam("name") String name,
            @RequestParam("price") double price,
            @RequestParam("description") String description,
            @RequestParam("color") String color,
            @RequestParam("dimensions") String dimensions,
            @RequestParam("material") String material,
            @RequestParam("weight") String weight,
            @RequestParam("quantity") int quantity,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try{
            ProductDto productDto = new ProductDto();
            productDto.setName(name);
            productDto.setPrice(price);
            productDto.setDescription(description);
            productDto.setColor(color);
            productDto.setDimensions(dimensions);
            productDto.setMaterial(material);
            productDto.setWeight(weight);
            productDto.setQuantity(quantity);
            productDto.setCategoryId(categoryId);
            
            Product product = productService.addProduct(productDto, image);
            return new ResponseEntity<>(product, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }catch (IOException | IllegalArgumentException e){
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/delete-product/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable(name = "id") Long id) {
        try{
            this.productService.deleteProduct(id);
            return new ResponseEntity<>(HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }
}
