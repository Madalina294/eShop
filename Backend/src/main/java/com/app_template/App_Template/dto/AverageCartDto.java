package com.app_template.App_Template.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AverageCartDto {
    private Double averageCartValue;
    private Long totalOrders;
    private Double totalRevenue;
}

