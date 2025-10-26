package com.app_template.App_Template.service.order;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app_template.App_Template.dto.CreateOrderRequest;
import com.app_template.App_Template.dto.OrderDto;
import com.app_template.App_Template.dto.OrderItemDto;
import com.app_template.App_Template.entity.CartItem;
import com.app_template.App_Template.entity.Order;
import com.app_template.App_Template.entity.OrderItem;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.OrderStatus;
import com.app_template.App_Template.repository.CartRepository;
import com.app_template.App_Template.repository.OrderItemRepository;
import com.app_template.App_Template.repository.OrderRepository;
import com.app_template.App_Template.repository.ProductRepository;
import com.app_template.App_Template.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService{
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;

    @Override
    @Transactional
    public Order createOrder(Long userId, CreateOrderRequest request) {
        // Găsește utilizatorul
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Calculează totalul din coș
        Double totalAmount = calculateTotalAmount(userId);

        // Creează comanda
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setShippingMethod(request.getShippingMethod());
        order.setShippingAddress(request.getShippingAddress());
        order.setBillingAddress(request.getBillingAddress());
        order.setTotalAmount(totalAmount);
        order.setStripePaymentIntentId(request.getStripePaymentIntentId());
        order.setOrderDate(LocalDateTime.now());

        // Salvează comanda
        Order savedOrder = orderRepository.save(order);

        // Creează OrderItem-urile din coș
        List<CartItem> cartItems = cartRepository.findByUserId(userId);
        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(cartItem.getProduct().getPrice());
            orderItem.setTotalPrice(cartItem.getProduct().getPrice() * cartItem.getQuantity());

            orderItemRepository.save(orderItem);

            // Actualizează stocul produsului
            Product product = cartItem.getProduct();
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }

        // Golește coșul
        cartRepository.deleteByUserId(userId);

        return savedOrder;
    }

    @Override
    public OrderDto getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Încarcă OrderItems explicit
        if (order.getOrderItems() != null) {
            order.getOrderItems().size(); // Forțează încărcarea
        }
        
        return convertToDto(order);
    }

    @Override
    public List<OrderDto> getUserOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        return orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        return orderRepository.save(order);
    }

    @Override
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    @Override
    public Double calculateTotalAmount(Long userId) {
        List<CartItem> cartItems = cartRepository.findByUserId(userId);
        return cartItems.stream()
                .mapToDouble(item -> item.getProduct().getPrice() * item.getQuantity())
                .sum();
    }

    private OrderDto convertToDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setUserId(order.getUser().getId());
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerEmail(order.getCustomerEmail());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setStatus(order.getStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setShippingMethod(order.getShippingMethod());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setBillingAddress(order.getBillingAddress());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStripePaymentIntentId(order.getStripePaymentIntentId());
        dto.setOrderDate(order.getOrderDate());
        dto.setDeliveryDate(order.getDeliveryDate());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        // Convert OrderItems
        if (order.getOrderItems() != null) {
            dto.setOrderItems(order.getOrderItems().stream()
                    .map(this::convertOrderItemToDto)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private OrderItemDto convertOrderItemToDto(OrderItem orderItem) {
        OrderItemDto dto = new OrderItemDto();
        dto.setId(orderItem.getId());
        dto.setOrderId(orderItem.getOrder().getId());
        dto.setProductId(orderItem.getProduct().getId());
        dto.setProductName(orderItem.getProduct().getName());
        dto.setProductImage(orderItem.getProduct().getImage());
        dto.setQuantity(orderItem.getQuantity());
        dto.setUnitPrice(orderItem.getUnitPrice());
        dto.setTotalPrice(orderItem.getTotalPrice());
        dto.setCreatedAt(orderItem.getOrder().getCreatedAt());
        dto.setUpdatedAt(orderItem.getOrder().getUpdatedAt());
        return dto;
    }
}
