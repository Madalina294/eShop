package com.app_template.App_Template.dto;

import com.app_template.App_Template.enums.PaymentMethod;
import com.app_template.App_Template.enums.ShippingMethod;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String shippingAddress;
    private String billingAddress;
    private PaymentMethod paymentMethod;
    private ShippingMethod shippingMethod;
    private List<CartItemDto> cartItems;
}