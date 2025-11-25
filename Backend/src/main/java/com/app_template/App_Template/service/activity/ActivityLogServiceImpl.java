package com.app_template.App_Template.service.activity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app_template.App_Template.dto.ActivityLogDto;
import com.app_template.App_Template.entity.ActivityLog;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;
import com.app_template.App_Template.repository.ActivityLogRepository;
import com.app_template.App_Template.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void logActivity(Long userId, ActionType actionType, String description, 
                           String ipAddress, String userAgent, LogStatus status, String metadata) {
        ActivityLog log = new ActivityLog();
        log.setActionType(actionType);
        log.setActionDescription(description);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        log.setStatus(status);
        log.setMetadata(metadata);
        
        if (userId != null) {
            Optional<User> user = userRepository.findById(userId);
            user.ifPresent(log::setUser);
        }
        
        activityLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityLogDto> getActivityLogs(int page, int size, String sortBy, String sortDir,
                                                Long userId, ActionType actionType, LogStatus status,
                                                LocalDateTime startDate, LocalDateTime endDate) {
        // Convert enums to strings for native query
        String actionTypeStr = actionType != null ? actionType.name() : null;
        String statusStr = status != null ? status.name() : null;
        
        // Convert sortBy from camelCase to snake_case for database column names
        String sortByColumn = convertToSnakeCase(sortBy);
        // Default to created_at if sortBy is not recognized
        if (!isValidSortColumn(sortByColumn)) {
            sortByColumn = "created_at";
        }
        
        // Validate sortDir
        String sortDirection = "desc".equalsIgnoreCase(sortDir) ? "DESC" : "ASC";
        
        // Build WHERE clause dynamically based on which parameters are not null
        List<String> conditions = new ArrayList<>();
        Map<String, Object> parameters = new HashMap<>();
        
        if (userId != null) {
            conditions.add("user_id = :userId");
            parameters.put("userId", userId);
        }
        
        if (actionTypeStr != null) {
            conditions.add("action_type = :actionType");
            parameters.put("actionType", actionTypeStr);
        }
        
        if (statusStr != null) {
            conditions.add("status = :status");
            parameters.put("status", statusStr);
        }
        
        if (startDate != null) {
            conditions.add("created_at >= :startDate");
            parameters.put("startDate", startDate);
        }
        
        if (endDate != null) {
            conditions.add("created_at <= :endDate");
            parameters.put("endDate", endDate);
        }
        
        String whereClauseStr = conditions.isEmpty() ? "" : "WHERE " + String.join(" AND ", conditions);
        
        // Build the full query with ORDER BY
        String queryStr = "SELECT * FROM activity_logs " + whereClauseStr +
                         " ORDER BY " + sortByColumn + " " + sortDirection;
        
        String countQueryStr = "SELECT COUNT(*) FROM activity_logs " + whereClauseStr;
        
        // Execute count query
        Query countQuery = entityManager.createNativeQuery(countQueryStr);
        setQueryParameters(countQuery, parameters);
        Long totalCount = ((Number) countQuery.getSingleResult()).longValue();
        
        // Execute data query with pagination
        Query dataQuery = entityManager.createNativeQuery(queryStr, ActivityLog.class);
        setQueryParameters(dataQuery, parameters);
        dataQuery.setFirstResult(page * size);
        dataQuery.setMaxResults(size);
        
        @SuppressWarnings("unchecked")
        List<ActivityLog> logs = dataQuery.getResultList();
        
        // Convert to DTOs
        List<ActivityLogDto> dtos = logs.stream().map(this::convertToDto).toList();
        
        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(dtos, pageable, totalCount);
    }
    
    private void setQueryParameters(Query query, Map<String, Object> parameters) {
        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long getActivityCount(LocalDateTime startDate, LocalDateTime endDate) {
        return activityLogRepository.countByDateRange(startDate, endDate);
    }

    private ActivityLogDto convertToDto(ActivityLog log) {
        ActivityLogDto dto = new ActivityLogDto();
        dto.setId(log.getId());
        dto.setActionType(log.getActionType());
        dto.setActionDescription(log.getActionDescription());
        dto.setIpAddress(log.getIpAddress());
        dto.setUserAgent(log.getUserAgent());
        dto.setStatus(log.getStatus());
        dto.setMetadata(log.getMetadata());
        dto.setCreatedAt(log.getCreatedAt());
        
        if (log.getUser() != null) {
            dto.setUserId(log.getUser().getId());
            dto.setUserName(log.getUser().getFirstname() + " " + log.getUser().getLastname());
            dto.setUserEmail(log.getUser().getEmail());
        }
        
        return dto;
    }
    
    private String convertToSnakeCase(String camelCase) {
        if (camelCase == null || camelCase.isEmpty()) {
            return "created_at";
        }
        
        // Map common camelCase to snake_case
        switch (camelCase) {
            case "createdAt":
                return "created_at";
            case "actionType":
                return "action_type";
            case "userId":
                return "user_id";
            case "ipAddress":
                return "ip_address";
            case "userAgent":
                return "user_agent";
            case "actionDescription":
                return "action_description";
            default:
                // Simple conversion: add underscore before uppercase letters
                return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
        }
    }
    
    private boolean isValidSortColumn(String column) {
        // Whitelist of valid column names for sorting
        String[] validColumns = {
            "id", "created_at", "action_type", "status", 
            "user_id", "ip_address", "user_agent", "action_description"
        };
        for (String col : validColumns) {
            if (col.equals(column)) {
                return true;
            }
        }
        return false;
    }
}

