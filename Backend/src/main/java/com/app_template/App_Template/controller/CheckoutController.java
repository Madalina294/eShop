package com.app_template.App_Template.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.dto.CreateOrderRequest;
import com.app_template.App_Template.dto.OrderDto;
import com.app_template.App_Template.dto.OrderResponse;
import com.app_template.App_Template.dto.PaymentIntentResponse;
import com.app_template.App_Template.entity.Order;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.cart.CartService;
import com.app_template.App_Template.service.order.OrderService;
import com.app_template.App_Template.service.stripe.StripeService;
import com.stripe.model.PaymentIntent;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final OrderService orderService;
    private final StripeService stripeService;
    private final CartService cartService;
    private final UserRepository userRepository;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            Double totalAmount = orderService.calculateTotalAmount(userId);

            PaymentIntent paymentIntent = stripeService.createPaymentIntent(
                    (long)(totalAmount * 100), // Stripe folosește cenți
                    "ron"
            );

            return ResponseEntity.ok(new PaymentIntentResponse(
                    paymentIntent.getClientSecret()
            ));
        } catch (Exception e) {
            System.err.println("Error creating payment intent: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/create-order")
    public ResponseEntity<OrderResponse> createOrder(
            @RequestBody CreateOrderRequest request,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            Order order = orderService.createOrder(userId, request);

            return ResponseEntity.ok(new OrderResponse(
                    order.getId(),
                    order.getStatus(),
                    "Comanda a fost creată cu succes!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getUserOrders(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            System.out.println("Getting orders for user " + userId);
            List<OrderDto> orders = orderService.getUserOrders(userId);
            System.out.println("Found " + orders.size() + " orders for user " + userId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error getting user orders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error retrieving orders: " + e.getMessage());
        }
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrder(@PathVariable Long orderId, Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            System.out.println("Getting order " + orderId + " for user " + userId);
            
            OrderDto order = orderService.getOrderById(orderId);
            System.out.println("Order found: " + order.getId() + " for user " + order.getUserId());
            
            // Verifică dacă comanda aparține utilizatorului curent
            if (order.getUserId().equals(userId)) {
                return ResponseEntity.ok(order);
            } else {
                System.out.println("Access denied: Order " + orderId + " belongs to user " + order.getUserId() + " but current user is " + userId);
                return ResponseEntity.status(403).body("Access denied: Order does not belong to current user");
            }
        } catch (Exception e) {
            System.err.println("Error getting order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error retrieving order: " + e.getMessage());
        }
    }

    private Long getCurrentUserId(Authentication authentication) {
        String userEmail = authentication.getName();
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}