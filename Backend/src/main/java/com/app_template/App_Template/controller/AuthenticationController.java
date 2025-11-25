package com.app_template.App_Template.controller;

import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.auth.AuthenticationRequest;
import com.app_template.App_Template.auth.AuthenticationResponse;
import com.app_template.App_Template.auth.ForgotPasswordRequest;
import com.app_template.App_Template.auth.ForgotPasswordResponse;
import com.app_template.App_Template.auth.RegisterRequest;
import com.app_template.App_Template.auth.ResetPasswordRequest;
import com.app_template.App_Template.auth.VerificationRequest;
import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.auth.AuthenticationService;
import com.app_template.App_Template.service.email.EmailService;
import com.app_template.App_Template.tfa.TwoFactorAuthenticationService;
import com.app_template.App_Template.util.ActivityLogHelper;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")

public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final TwoFactorAuthenticationService tfaService;
    private final ActivityLogHelper activityLogHelper;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) throws IOException {
        try {
            var response = authenticationService.register(request);
            
            // Log registration
            activityLogHelper.logActivity(
                    response.getUserId(),
                    ActionType.REGISTER,
                    "User registered: " + request.getEmail(),
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log failed registration
            activityLogHelper.logActivity(
                    null,
                    ActionType.REGISTER,
                    "Failed registration attempt: " + request.getEmail() + " - " + e.getMessage(),
                    httpRequest,
                    LogStatus.ERROR
            );
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletRequest httpRequest) {
        try {
            var response = authenticationService.authenticate(request);
            
            // Log successful login
            activityLogHelper.logActivity(
                    response.getUserId(),
                    ActionType.LOGIN,
                    "User logged in: " + request.getEmail(),
                    httpRequest,
                    LogStatus.SUCCESS
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log failed login
            activityLogHelper.logActivity(
                    null,
                    ActionType.LOGIN,
                    "Failed login attempt: " + request.getEmail() + " - " + e.getMessage(),
                    httpRequest,
                    LogStatus.ERROR
            );
            throw e;
        }
    }

    @PostMapping("/refresh-token")
    public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws IOException {
        authenticationService.refreshToken(request, response);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyCode(@RequestBody VerificationRequest request){
        return ResponseEntity.ok(authenticationService.verifyCode(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            ForgotPasswordResponse response = authenticationService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest()
                    .body(new ForgotPasswordResponse("User not found", false));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            AuthenticationResponse response = authenticationService.resetPassword(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<String> testEmail(@RequestParam String email) {
        try {
            emailService.sendResetPasswordEmail(email, "123456");
            return ResponseEntity.ok("Email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Email failed: " + e.getMessage());
        }
    }

    

}
