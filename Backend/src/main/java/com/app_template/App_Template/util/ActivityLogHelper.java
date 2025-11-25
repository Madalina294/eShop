package com.app_template.App_Template.util;

import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;
import com.app_template.App_Template.service.activity.ActivityLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ActivityLogHelper {

    private final ActivityLogService activityLogService;

    public void logActivity(Long userId, ActionType actionType, String description, 
                           HttpServletRequest request, LogStatus status) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        activityLogService.logActivity(userId, actionType, description, ipAddress, userAgent, status, null);
    }

    public void logActivity(Long userId, ActionType actionType, String description, 
                           HttpServletRequest request, LogStatus status, String metadata) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        activityLogService.logActivity(userId, actionType, description, ipAddress, userAgent, status, metadata);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Dacă IP-ul conține mai multe adrese, ia prima
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}

