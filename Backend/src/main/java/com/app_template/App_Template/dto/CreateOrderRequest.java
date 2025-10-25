package com.app_template.App_Template.dto;

import com.app_template.App_Template.enums.PaymentMethod;
import com.app_template.App_Template.enums.ShippingMethod;
import lombok.Data;

@Data
public class CreateOrderRequest {
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String shippingAddress;
    private String billingAddress;
    private PaymentMethod paymentMethod;
    private ShippingMethod shippingMethod;
    private String stripePaymentIntentId; // Pentru plăți cu card
}