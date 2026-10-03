import { apiCall } from "@/lib/auth";

// Any component can listen for this to refresh when notifications change
export const NOTIFICATIONS_CHANGED = "notifications:changed";

export const notifyChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  }
};

export const getSummary = () => apiCall("/api/notifications/summary");

export const getNotifications = () => apiCall("/api/notifications");

export const markRead = async (id) => {
  await apiCall(`/api/notifications/${id}/read`, { method: "PUT" });
  notifyChanged();
};

export const markAllRead = async () => {
  await apiCall("/api/notifications/read-all", { method: "PUT" });
  notifyChanged();
};

export const removeNotification = async (id) => {
  await apiCall(`/api/notifications/${id}`, { method: "DELETE" });
  notifyChanged();
};

// Asks the server to look for due / at-risk topics right now
export const checkNow = async () => {
  const summary = await apiCall("/api/notifications/check-now", {
    method: "POST",
  });
  notifyChanged();
  return summary;
};

// Where a notification should take the user (null = nowhere in particular)
export const notificationHref = (type) => {
  if (type === "REVIEW_DUE") return "/dashboard/reviews";
  if (type === "AT_RISK_TOPIC") return "/dashboard/topics";
  return null;
};

export const notificationActionLabel = (type) => {
  if (type === "REVIEW_DUE") return "Go to reviews";
  if (type === "AT_RISK_TOPIC") return "Open topics";
  return null;
};

export const notificationTypeLabel = (type) =>
  ({
    REVIEW_DUE: "Review due",
    AT_RISK_TOPIC: "At risk",
    STREAK_REMINDER: "Streak",
    WEEKLY_SUMMARY: "Weekly summary",
    ACHIEVEMENT: "Achievement",
  })[type] || "Notification";
