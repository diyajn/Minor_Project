package com.org.example.repository;


import com.org.example.entities.Notification;
import com.org.example.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Get all notifications for a user (unread first)
    List<Notification> findByUserIdOrderByIsReadAscCreatedAtDesc(Long userId);

    // Get unread notifications
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // Get notifications by type
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);

    // Used to avoid duplicates: is there already an UNREAD notification of this kind?
    Optional<Notification> findFirstByUserIdAndTypeAndRelatedTopicIdAndIsReadFalse(
            Long userId, NotificationType type, Long relatedTopicId);

    Optional<Notification> findFirstByUserIdAndTypeAndTitleAndRelatedTopicIdIsNullAndIsReadFalse(
            Long userId, NotificationType type, String title);

    // Count unread notifications
    Long countByUserIdAndIsReadFalse(Long userId);

    // Delete old read notifications (cleanup)
    void deleteByUserIdAndIsReadTrueAndCreatedAtBefore(Long userId, LocalDateTime beforeDate);
}
