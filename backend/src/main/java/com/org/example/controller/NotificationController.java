package com.org.example.controller;

import com.org.example.dto.NotificationResponse;
import com.org.example.dto.NotificationSummary;
import com.org.example.entities.User;
import com.org.example.service.NotificationService;
import com.org.example.service.ScheduledTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "APIs for managing user notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final ScheduledTaskService scheduledTaskService;

    // Get all notifications
    @GetMapping
    @Operation(summary = "Get all notifications", description = "Retrieves all notifications for the user")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(Authentication authentication) {
        Long userId = extractUserId(authentication);
        List<NotificationResponse> notifications = notificationService.getAllNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    // Get unread notifications
    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Retrieves only unread notifications")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(Authentication authentication) {
        Long userId = extractUserId(authentication);
        List<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    // Get notification summary
    @GetMapping("/summary")
    @Operation(summary = "Get notification summary", description = "Returns count of notifications by type")
    public ResponseEntity<NotificationSummary> getNotificationSummary(Authentication authentication) {
        Long userId = extractUserId(authentication);
        NotificationSummary summary = notificationService.getNotificationSummary(userId);
        return ResponseEntity.ok(summary);
    }

    // Run the reminder checks right now for the logged-in user
    @PostMapping("/check-now")
    @Operation(summary = "Check reminders now",
            description = "Runs the due-review and at-risk checks for the current user and returns the fresh summary")
    public ResponseEntity<NotificationSummary> checkNow(Authentication authentication) {
        Long userId = extractUserId(authentication);
        scheduledTaskService.runChecksForUser(userId);
        return ResponseEntity.ok(notificationService.getNotificationSummary(userId));
    }

    // Mark notification as read
    @PutMapping("/{id}/read")
    @Operation(summary = "Mark as read", description = "Marks a notification as read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    // Mark all as read
    @PutMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Marks all notifications as read")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        Long userId = extractUserId(authentication);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // Delete notification
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete notification", description = "Deletes a notification")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }

    // Helper method
    private Long extractUserId(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        System.out.println(user.getId());
        return user.getId();
    }
}
