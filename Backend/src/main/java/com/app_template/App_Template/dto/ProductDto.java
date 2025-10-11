package com.app_template.App_Template.dto;

import lombok.Data;

@Data
public class ProductDto {

    private Long id;

    private String name;

    private double price;

    private String image;

    private String description;

    private Long categoryId;

    private String color;

    private String dimensions;

    private String material;

    private String weight;

    private int quantity;
}
