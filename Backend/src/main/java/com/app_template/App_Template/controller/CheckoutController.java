package com.app_template.App_Template.controller;

import com.app_template.App_Template.dto.*;
import com.app_template.App_Template.entity.Order;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.cart.CartService;
import com.app_template.App_Template.service.order.OrderService;
import com.app_template.App_Template.service.stripe.StripeService;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
            @RequestBody CheckoutRequest request,
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
            return ResponseEntity.ok(orderService.getUserOrders(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrder(@PathVariable Long orderId, Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            return ResponseEntity.ok(orderService.getOrderById(orderId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private Long getCurrentUserId(Authentication authentication) {
        String userEmail = authentication.getName();
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}