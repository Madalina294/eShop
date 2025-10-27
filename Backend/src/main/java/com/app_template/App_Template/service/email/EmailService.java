package com.app_template.App_Template.service.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.app_template.App_Template.dto.OrderDto;
import com.app_template.App_Template.dto.OrderItemDto;
import com.app_template.App_Template.repository.UserRepository;

import lombok.RequiredArgsConstructor;

// EmailService.java
@Service
@RequiredArgsConstructor
public class EmailService {

    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendResetPasswordEmail(String toEmail, String resetCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail); // Use the configured email from properties
            message.setTo(toEmail);
            message.setSubject("Password Reset Code - Your App");
            message.setText(
                "Hello,\n\n" +
                "Your password reset code is: " + resetCode + "\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "App Team"
            );

            mailSender.send(message);
            
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    public void sendDeleteAccountEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail); // Use the configured email from properties
            message.setTo(toEmail);
            message.setSubject("Delete Account - App");
            message.setText(
                    "Hello, "+ username +"\n\n" +
                    "This is to inform you that your account with App has been deleted by the administrator.\n" +
                    "If you believe this action was taken in error or you wish to appeal, please contact us at " + fromEmail+".\n\n" +
                    "Thank you,\n" +
                    "App Team"
            );

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    public void sendWelcomeEmail(String toEmail, String username) {
         try{
             SimpleMailMessage message = new SimpleMailMessage();
             message.setFrom(fromEmail);
             message.setTo(toEmail);
             message.setSubject("Welcome to App");
             message.setText(
                     "Hello, " + username + "\n\n" +
                     "Welcome to App — we’re excited to have you on board!" + "\n"
             );
             mailSender.send(message);
         } catch (Exception e){
             System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
         }
    }

    public void sendCustomEmail(String toEmail, String subject, String body) {
        try{
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
        } catch(Exception e){
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    public void sendConfirmationOrderEmail(OrderDto orderDto) {
        try{
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(orderDto.getCustomerEmail());
            message.setSubject("Order Confirmation - ESHOP / Confirmare Comandă - ESHOP");
            
            String body = buildOrderConfirmationEmailBody(orderDto);
            message.setText(body);
            
            mailSender.send(message);
            System.out.println("Order confirmation email sent successfully to " + orderDto.getCustomerEmail());
            
        } catch (Exception e) {
            System.err.println("Failed to send confirmation email to " + orderDto.getCustomerEmail() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private String buildOrderConfirmationEmailBody(OrderDto orderDto) {
        StringBuilder body = new StringBuilder();
        
        // English Section
        body.append("=".repeat(60)).append("\n");
        body.append("ORDER CONFIRMATION - ESHOP\n");
        body.append("=".repeat(60)).append("\n\n");
        
        body.append("Dear ").append(orderDto.getCustomerName()).append(",\n\n");
        body.append("Thank you for your order! We have received your order and it is being processed.\n\n");
        
        body.append("ORDER DETAILS:\n");
        body.append("-".repeat(30)).append("\n");
        body.append("Order Number: #").append(orderDto.getId()).append("\n");
        body.append("Order Date: ").append(orderDto.getOrderDate()).append("\n");
        body.append("Status: ").append(orderDto.getStatus()).append("\n");
        body.append("Payment Method: ").append(orderDto.getPaymentMethod()).append("\n");
        body.append("Shipping Method: ").append(orderDto.getShippingMethod()).append("\n\n");
        
        body.append("SHIPPING ADDRESS:\n");
        body.append("-".repeat(30)).append("\n");
        body.append(orderDto.getShippingAddress()).append("\n\n");
        
        if (orderDto.getBillingAddress() != null && !orderDto.getBillingAddress().isEmpty()) {
            body.append("BILLING ADDRESS:\n");
            body.append("-".repeat(30)).append("\n");
            body.append(orderDto.getBillingAddress()).append("\n\n");
        }
        
        body.append("ORDER ITEMS:\n");
        body.append("-".repeat(30)).append("\n");
        if (orderDto.getOrderItems() != null) {
            for (OrderItemDto item : orderDto.getOrderItems()) {
                body.append("• ").append(item.getProductName())
                    .append(" x").append(item.getQuantity())
                    .append(" - ").append(String.format("%.2f RON", item.getTotalPrice())).append("\n");
            }
        }
        
        body.append("\nTOTAL AMOUNT: ").append(String.format("%.2f RON", orderDto.getTotalAmount())).append("\n\n");
        
        body.append("We will send you another email when your order is shipped.\n");
        body.append("If you have any questions, please contact us at ").append(fromEmail).append("\n\n");
        body.append("Thank you for choosing ESHOP!\n\n");
        
        // Romanian Section
        body.append("=".repeat(60)).append("\n");
        body.append("CONFIRMAREA COMENZII - ESHOP\n");
        body.append("=".repeat(60)).append("\n\n");
        
        body.append("Dragă ").append(orderDto.getCustomerName()).append(",\n\n");
        body.append("Mulțumim pentru comandă! Am primit comanda ta și este în procesare.\n\n");
        
        body.append("DETALII COMANDA:\n");
        body.append("-".repeat(30)).append("\n");
        body.append("Numărul comenzii: #").append(orderDto.getId()).append("\n");
        body.append("Data comenzii: ").append(orderDto.getOrderDate()).append("\n");
        body.append("Status: ").append(orderDto.getStatus()).append("\n");
        body.append("Metoda de plată: ").append(orderDto.getPaymentMethod()).append("\n");
        body.append("Metoda de livrare: ").append(orderDto.getShippingMethod()).append("\n\n");
        
        body.append("ADRESA DE LIVRARE:\n");
        body.append("-".repeat(30)).append("\n");
        body.append(orderDto.getShippingAddress()).append("\n\n");
        
        if (orderDto.getBillingAddress() != null && !orderDto.getBillingAddress().isEmpty()) {
            body.append("ADRESA DE FACTURARE:\n");
            body.append("-".repeat(30)).append("\n");
            body.append(orderDto.getBillingAddress()).append("\n\n");
        }
        
        body.append("PRODUSE COMANDATE:\n");
        body.append("-".repeat(30)).append("\n");
        if (orderDto.getOrderItems() != null) {
            for (OrderItemDto item : orderDto.getOrderItems()) {
                body.append("• ").append(item.getProductName())
                    .append(" x").append(item.getQuantity())
                    .append(" - ").append(String.format("%.2f RON", item.getTotalPrice())).append("\n");
            }
        }
        
        body.append("\nSUMA TOTALĂ: ").append(String.format("%.2f RON", orderDto.getTotalAmount())).append("\n\n");
        
        body.append("Îți vom trimite un alt email când comanda va fi expediată.\n");
        body.append("Dacă ai întrebări, te rugăm să ne contactezi la ").append(fromEmail).append("\n\n");
        body.append("Mulțumim că ai ales ESHOP!\n\n");
        
        body.append("Best regards / Cu respect,\n");
        body.append("ESHOP Team");
        
        return body.toString();
    }
}
