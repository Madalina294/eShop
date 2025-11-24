package com.app_template.App_Template.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserOrderCountDto {
    private Long userId;
    private String userName;
    private String userEmail;
    private Long orderCount;
}
