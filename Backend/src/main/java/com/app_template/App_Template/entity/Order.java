package com.app_template.App_Template.entity;

import com.app_template.App_Template.enums.OrderStatus;
import com.app_template.App_Template.enums.PaymentMethod;
import com.app_template.App_Template.enums.ShippingMethod;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private ShippingMethod shippingMethod;

    private String shippingAddress;
    private String billingAddress;
    private Double totalAmount;
    private String stripePaymentIntentId; // Pentru plăți cu card
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Convenience methods pentru a obține datele utilizatorului
    public String getCustomerName() {
        return user != null ? user.getFirstname() + " " + user.getLastname() : null;
    }

    public String getCustomerEmail() {
        return user != null ? user.getEmail() : null;
    }

    public String getCustomerPhone() {
        return user != null ? user.getPhoneNumber() : null;
    }
}
