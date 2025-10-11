package com.app_template.App_Template.repository;

import com.app_template.App_Template.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
