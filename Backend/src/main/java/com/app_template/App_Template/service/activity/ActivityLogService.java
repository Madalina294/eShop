package com.app_template.App_Template.service.activity;

import com.app_template.App_Template.dto.ActivityLogDto;
import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface ActivityLogService {
    void logActivity(Long userId, ActionType actionType, String description, String ipAddress, String userAgent, LogStatus status, String metadata);
    Page<ActivityLogDto> getActivityLogs(int page, int size, String sortBy, String sortDir, Long userId, ActionType actionType, LogStatus status, LocalDateTime startDate, LocalDateTime endDate);
    Long getActivityCount(LocalDateTime startDate, LocalDateTime endDate);
}

