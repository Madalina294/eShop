package com.app_template.App_Template.service.admin;

import java.util.List;

import com.app_template.App_Template.dto.*;
import org.springframework.data.domain.Page;

public interface AdminService {

    public List<UserDto> getAllUsers();
    public Page<UserDto> getUsersPaginated(int page, int size, String sortBy, String sortDir);
    public void deleteUser(Long id);
    public void sendEmail(String toEmail, String subject, String body);
    public UserDto getUserById(Long userId);
    public Page<ProductDto> getProductsPaginated(int page, int size, String sortBy, String sortDir);
    
    // Statistici
    public List<UserOrderCountDto> getOrdersCountByUser();
    public List<TopCustomerDto> getTopCustomers(int limit);
    public AverageCartDto getAverageCartValue();
    
    // Activity Logs
    public org.springframework.data.domain.Page<com.app_template.App_Template.dto.ActivityLogDto> getActivityLogs(
            int page, int size, String sortBy, String sortDir, Long userId, 
            String actionType, String status, java.time.LocalDateTime startDate, 
            java.time.LocalDateTime endDate);
}
