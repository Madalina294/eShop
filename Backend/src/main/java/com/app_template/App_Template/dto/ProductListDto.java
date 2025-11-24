package com.app_template.App_Template.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductListDto {
    private Long id;
    private String name;
    private double price;
    private String image;
    private Long categoryId;
    private String color;
    private String description;
    private String dimensions;
    private String material;
    private String weight;
    private int quantity;
}
