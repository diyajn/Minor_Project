package com.org.example.dto;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSummary {
    private Long totalNotifications;
    private Long unreadCount;
    private Long reviewDueCount;
    private Long atRiskCount;
}
