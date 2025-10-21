package com.app_template.App_Template.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.app_template.App_Template.dto.ProductListDto;
import com.app_template.App_Template.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT new com.app_template.App_Template.dto.ProductListDto(" +
           "p.id, p.name, p.price, p.image, p.category.id, p.color, " +
           "p.dimensions, p.material, p.weight, p.quantity) " +
           "FROM Product p WHERE p.category.id = :categoryId")
    Page<ProductListDto> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);
}
