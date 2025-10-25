package com.app_template.App_Template.service.order;

import com.app_template.App_Template.dto.CreateOrderRequest;
import com.app_template.App_Template.dto.OrderDto;
import com.app_template.App_Template.entity.Order;

import java.util.List;

public interface OrderService {
    Order createOrder(Long userId, CreateOrderRequest request);
    OrderDto getOrderById(Long orderId);
    List<OrderDto> getUserOrders(Long userId);
    Order updateOrderStatus(Long orderId, String status);
    void cancelOrder(Long orderId);
    Double calculateTotalAmount(Long userId);
}