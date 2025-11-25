package com.app_template.App_Template.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app_template.App_Template.entity.ActivityLog;
import com.app_template.App_Template.enums.ActionType;
import com.app_template.App_Template.enums.LogStatus;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    
    Page<ActivityLog> findByUserId(Long userId, Pageable pageable);
    
    Page<ActivityLog> findByActionType(ActionType actionType, Pageable pageable);
    
    Page<ActivityLog> findByStatus(LogStatus status, Pageable pageable);
    
    // This method will be called with dynamic query built in service
    @Query(value = "SELECT * FROM activity_logs WHERE " +
           "(:userId IS NULL OR user_id = :userId) AND " +
           "(:actionType IS NULL OR action_type = :actionType) AND " +
           "(:status IS NULL OR status = :status) AND " +
           "(created_at >= COALESCE(:startDate, '1970-01-01'::timestamp)) AND " +
           "(created_at <= COALESCE(:endDate, '9999-12-31'::timestamp))",
           nativeQuery = true,
           countQuery = "SELECT COUNT(*) FROM activity_logs WHERE " +
                   "(:userId IS NULL OR user_id = :userId) AND " +
                   "(:actionType IS NULL OR action_type = :actionType) AND " +
                   "(:status IS NULL OR status = :status) AND " +
                   "(created_at >= COALESCE(:startDate, '1970-01-01'::timestamp)) AND " +
                   "(created_at <= COALESCE(:endDate, '9999-12-31'::timestamp))")
    Page<ActivityLog> findWithFilters(
            @Param("userId") Long userId,
            @Param("actionType") String actionType,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    @Query("SELECT COUNT(al) FROM ActivityLog al WHERE al.createdAt >= :startDate AND al.createdAt <= :endDate")
    Long countByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT DISTINCT al.actionType FROM ActivityLog al")
    List<ActionType> findDistinctActionTypes();
}

