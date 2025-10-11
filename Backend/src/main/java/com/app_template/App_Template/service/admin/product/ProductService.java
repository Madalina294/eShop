package com.app_template.App_Template.service.admin.product;

import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.entity.Product;

public interface ProductService {
    Product addProduct(ProductDto productDto);
}
