package com.app_template.App_Template.dto;

import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private ActionType actionType;
    private String actionDescription;
    private String ipAddress;
    private String userAgent;
    private LogStatus status;
    private String metadata;
    private LocalDateTime createdAt;
}

