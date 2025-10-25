
package com.app_template.App_Template.dto;

import com.app_template.App_Template.enums.OrderStatus;
import com.app_template.App_Template.enums.PaymentMethod;
import com.app_template.App_Template.enums.ShippingMethod;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDto {
    private Long id;
    private Long userId;
    private String customerName;    // Calculat din user.firstname + lastname
    private String customerEmail;   // Din user.email
    private String customerPhone;  // Din user.phoneNumber
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private ShippingMethod shippingMethod;
    private String shippingAddress;
    private String billingAddress;
    private Double totalAmount;
    private String stripePaymentIntentId;
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;
    private List<OrderItemDto> orderItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}