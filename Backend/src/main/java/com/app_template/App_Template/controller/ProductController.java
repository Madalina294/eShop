package com.app_template.App_Template.controller;

import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.service.admin.product.ProductService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping("/add-product")
    public ResponseEntity<Product> addProduct(@ModelAttribute ProductDto productDto) {
        try{
            Product product = productService.addProduct(productDto);
            return new ResponseEntity<>(product, HttpStatus.OK);
        }catch (EntityNotFoundException e){
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
