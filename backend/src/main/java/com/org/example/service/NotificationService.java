package com.org.example.service;


import com.org.example.dto.NotificationResponse;
import com.org.example.dto.NotificationSummary;
import com.org.example.entities.Notification;
import com.org.example.entities.Topic;
import com.org.example.enums.NotificationType;
import com.org.example.repository.NotificationRepository;
import com.org.example.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TopicRepository topicRepository;

    /**
     * Create a notification
     */
    @Transactional
    public Notification createNotification(
            Long userId,
            NotificationType type,
            String title,
            String message,
            Long relatedTopicId) {

        // Avoid piling up duplicates: if an UNREAD notification of the same kind already
        // exists, refresh its text instead of creating another one.
        Optional<Notification> existing = (relatedTopicId != null)
                ? notificationRepository.findFirstByUserIdAndTypeAndRelatedTopicIdAndIsReadFalse(
                        userId, type, relatedTopicId)
                : notificationRepository.findFirstByUserIdAndTypeAndTitleAndRelatedTopicIdIsNullAndIsReadFalse(
                        userId, type, title);

        if (existing.isPresent()) {
            Notification current = existing.get();
            current.setMessage(message);
            return notificationRepository.save(current);
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedTopicId(relatedTopicId);
        notification.setIsRead(false);

        return notificationRepository.save(notification);
    }

    /**
     * Get all notifications for user
     */
    public List<NotificationResponse> getAllNotifications(Long userId) {
        List<Notification> notifications = notificationRepository
                .findByUserIdOrderByIsReadAscCreatedAtDesc(userId);

        return notifications.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications
     */
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        List<Notification> notifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        return notifications.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Mark all as read
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    /**
     * Delete notification
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notificationRepository.delete(notification);
    }

    /**
     * Get notification summary
     */
    public NotificationSummary getNotificationSummary(Long userId) {
        List<Notification> all = notificationRepository
                .findByUserIdOrderByIsReadAscCreatedAtDesc(userId);

        long unread = all.stream().filter(n -> !n.getIsRead()).count();
        long reviewDue = all.stream()
                .filter(n -> n.getType() == NotificationType.REVIEW_DUE && !n.getIsRead())
                .count();
        long atRisk = all.stream()
                .filter(n -> n.getType() == NotificationType.AT_RISK_TOPIC && !n.getIsRead())
                .count();

        return NotificationSummary.builder()
                .totalNotifications((long) all.size())
                .unreadCount(unread)
                .reviewDueCount(reviewDue)
                .atRiskCount(atRisk)
                .build();
    }

    /**
     * Cleanup old read notifications (older than 30 days)
     */
    @Transactional
    public void cleanupOldNotifications(Long userId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        notificationRepository.deleteByUserIdAndIsReadTrueAndCreatedAtBefore(userId, thirtyDaysAgo);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert entity to response DTO
     */
    private NotificationResponse toResponse(Notification notification) {
        String topicName = null;
        if (notification.getRelatedTopicId() != null) {
            topicName = topicRepository.findById(notification.getRelatedTopicId())
                    .map(Topic::getName)
                    .orElse(null);
        }

        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedTopicId(notification.getRelatedTopicId())
                .relatedTopicName(topicName)
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .timeAgo(calculateTimeAgo(notification.getCreatedAt()))
                .build();
    }

    /**
     * Calculate "time ago" string
     */
    private String calculateTimeAgo(LocalDateTime createdAt) {
        long minutes = ChronoUnit.MINUTES.between(createdAt, LocalDateTime.now());

        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " minutes ago";

        long hours = minutes / 60;
        if (hours < 24) return hours + " hour" + (hours > 1 ? "s" : "") + " ago";

        long days = hours / 24;
        if (days < 7) return days + " day" + (days > 1 ? "s" : "") + " ago";

        long weeks = days / 7;
        if (weeks < 4) return weeks + " week" + (weeks > 1 ? "s" : "") + " ago";

        long months = days / 30;
        return months + " month" + (months > 1 ? "s" : "") + " ago";
    }
}
