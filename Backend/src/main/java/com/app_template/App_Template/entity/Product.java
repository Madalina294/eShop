package com.app_template.App_Template.entity;

import com.app_template.App_Template.dto.ProductDto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Data
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private double price;

    private String image;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private Category category;

    private String color;
    @Lob
    private String description;

    private String dimensions;

    private String material;

    private String weight;

    private int quantity;

    public ProductDto getProductDto() {
        ProductDto productDto = new ProductDto();
        productDto.setId(id);
        productDto.setName(name);
        productDto.setPrice(price);
        productDto.setImage(image);
        productDto.setColor(color);
        productDto.setDescription(description);
        productDto.setCategoryId(category.getId());
        productDto.setDimensions(dimensions);
        productDto.setMaterial(material);
        productDto.setWeight(weight);
        productDto.setQuantity(quantity);
        return productDto;
    }

}
