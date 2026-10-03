package com.org.example.service;



import com.org.example.entities.ReviewSession;
import com.org.example.entities.Topic;
import com.org.example.entities.User;
import com.org.example.enums.NotificationType;
import com.org.example.repository.ReviewSessionRepository;
import com.org.example.repository.TopicRepository;
import com.org.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledTaskService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ReviewSessionRepository reviewRepository;
    private final NotificationService notificationService;

    /**
     * Daily job to check for topics due for review
     * Runs every 2 minutes for TESTING
     * Change to "0 0 8 * * ?" for PRODUCTION (8 AM daily)
     */
    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Kolkata")
    public void checkDueReviews() {
        log.info("Running scheduled task: Check due reviews");

        List<User> users = userRepository.findAll();

        for (User user : users) {
            processDueReviewsForUser(user.getId());
        }

        log.info("Completed scheduled task: Check due reviews");
    }

    /**
     * Check for at-risk topics (not reviewed in 90+ days)
     * Runs every 3 minutes for TESTING
     * Change to "0 0 10 * * ?" for PRODUCTION (10 AM daily)
     */
    @Scheduled(cron = "0 0 10 * * ?", zone = "Asia/Kolkata")
    public void checkAtRiskTopics() {
        log.info("Running scheduled task: Check at-risk topics");

        List<User> users = userRepository.findAll();

        for (User user : users) {
            checkAtRiskTopicsForUser(user.getId());
        }

        log.info("Completed scheduled task: Check at-risk topics");
    }

    /**
     * Weekly summary - DISABLED for testing
     * Uncomment @Scheduled to enable
     * Use "0 0 9 * * MON" for every Monday at 9 AM
     */
    @Scheduled(cron = "0 0 9 * * MON", zone = "Asia/Kolkata")
    public void sendWeeklySummary() {
        log.info("Running scheduled task: Weekly summary");

        List<User> users = userRepository.findAll();

        for (User user : users) {
            generateWeeklySummary(user.getId());
        }

        log.info("Completed scheduled task: Weekly summary");
    }

    /**
     * Cleanup old read notifications - DISABLED for testing
     * Uncomment @Scheduled to enable
     * Use "0 0 0 * * ?" for every day at midnight
     */
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    public void cleanupOldNotifications() {
        log.info("Running scheduled task: Cleanup old notifications");

        List<User> users = userRepository.findAll();

        for (User user : users) {
            notificationService.cleanupOldNotifications(user.getId());
        }

        log.info("Completed scheduled task: Cleanup old notifications");
    }

    /**
     * Run the due-review and at-risk checks for ONE user, on demand
     * (used by the "Check for reminders" button in the app).
     */
    public void runChecksForUser(Long userId) {
        processDueReviewsForUser(userId);
        checkAtRiskTopicsForUser(userId);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Process due reviews for a specific user
     */
    private void processDueReviewsForUser(Long userId) {
        try {
            List<ReviewSession> dueReviews = reviewRepository.findDueReviews(userId, LocalDate.now());

            if (dueReviews.isEmpty()) {
                log.info("No due reviews for user {}", userId);
                return;
            }

            Set<Long> dueTopicIds = new HashSet<>();
            for (ReviewSession review : dueReviews) {
                dueTopicIds.add(review.getTopicId());
            }

            log.info("Found {} topics due for review for user {}", dueTopicIds.size(), userId);

            for (Long topicId : dueTopicIds) {
                Topic topic = topicRepository.findById(topicId).orElse(null);

                if (topic != null && topic.getUserId().equals(userId)) {
                    String title = "Time to Review!";
                    String message = String.format(
                            "The topic '%s' is due for review today. Keep up your learning streak!",
                            topic.getName()
                    );

                    notificationService.createNotification(
                            userId,
                            NotificationType.REVIEW_DUE,
                            title,
                            message,
                            topicId
                    );

                    log.info("Created review notification for topic: {}", topic.getName());
                }
            }

            if (dueTopicIds.size() > 1) {
                String summaryTitle = "Daily Review Summary";
                String summaryMessage = String.format(
                        "You have %d topics due for review today. Let's keep your knowledge fresh!",
                        dueTopicIds.size()
                );

                notificationService.createNotification(
                        userId,
                        NotificationType.REVIEW_DUE,
                        summaryTitle,
                        summaryMessage,
                        null
                );
            }

        } catch (Exception e) {
            log.error("Error processing due reviews for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Check for at-risk topics for a specific user
     */
    private void checkAtRiskTopicsForUser(Long userId) {
        try {
            LocalDate thresholdDate = LocalDate.now().minusDays(90);
            List<Topic> topics = topicRepository.findByUserId(userId);

            int atRiskCount = 0;

            for (Topic topic : topics) {
                if (topic.getLastReviewed() != null &&
                        topic.getLastReviewed().isBefore(thresholdDate)) {

                    long daysSince = ChronoUnit.DAYS.between(topic.getLastReviewed(), LocalDate.now());

                    String title = "Topic At Risk!";
                    String message = String.format(
                            "You haven't reviewed '%s' in %d days. Consider refreshing your knowledge!",
                            topic.getName(),
                            daysSince
                    );

                    notificationService.createNotification(
                            userId,
                            NotificationType.AT_RISK_TOPIC,
                            title,
                            message,
                            topic.getId()
                    );

                    atRiskCount++;
                    log.info("Created at-risk notification for topic: {} (not reviewed in {} days)",
                            topic.getName(), daysSince);
                }
            }

            if (atRiskCount > 0) {
                log.info("Found {} at-risk topics for user {}", atRiskCount, userId);
            }

        } catch (Exception e) {
            log.error("Error checking at-risk topics for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Generate weekly summary for a user
     */
    private void generateWeeklySummary(Long userId) {
        try {
            Long reviewsThisWeek = reviewRepository.countRecentReviews(
                    userId,
                    java.time.LocalDateTime.now().minusDays(7)
            );

            List<Topic> allTopics = topicRepository.findByUserId(userId);
            long topicsThisWeek = allTopics.stream()
                    .filter(t -> t.getLearnedDate() != null &&
                            t.getLearnedDate().isAfter(LocalDate.now().minusDays(7)))
                    .count();

            String title = "Your Weekly Progress";
            String message = String.format(
                    "This week you completed %d reviews and learned %d new topics. Great work!",
                    reviewsThisWeek,
                    topicsThisWeek
            );

            notificationService.createNotification(
                    userId,
                    NotificationType.WEEKLY_SUMMARY,
                    title,
                    message,
                    null
            );

            log.info("Created weekly summary for user {}", userId);

        } catch (Exception e) {
            log.error("Error generating weekly summary for user {}: {}", userId, e.getMessage());
        }
    }
}