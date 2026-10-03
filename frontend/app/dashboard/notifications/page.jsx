"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NotificationIcon from "@/components/NotificationIcon";
import {
  NOTIFICATIONS_CHANGED,
  getNotifications,
  getSummary,
  markRead,
  markAllRead,
  removeNotification,
  checkNow,
  notificationHref,
  notificationActionLabel,
  notificationTypeLabel,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([getNotifications(), getSummary()]);
      if (Array.isArray(list)) setNotifications(list);
      if (sum && typeof sum === "object") setSummary(sum);
    } catch (error) {
      toast.error(error.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onChanged = () => load();
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
  }, [load]);

  const unreadCount = summary?.unreadCount ?? 0;
  const visible =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkRead = async (id) => {
    setBusyId(id);
    try {
      await markRead(id);
    } catch (error) {
      toast.error(error.message || "Could not mark as read");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await removeNotification(id);
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(error.message || "Could not delete notification");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    try {
      await markAllRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.message || "Could not mark all as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleCheckNow = async () => {
    setIsChecking(true);
    const before = summary?.unreadCount ?? 0;
    try {
      const after = await checkNow();
      const added = (after?.unreadCount ?? 0) - before;
      toast.success(
        added > 0
          ? `${added} new reminder${added > 1 ? "s" : ""} found`
          : "You're all caught up - nothing new right now",
      );
    } catch (error) {
      toast.error(error.message || "Could not check for reminders");
    } finally {
      setIsChecking(false);
    }
  };

  const handleGo = async (n) => {
    const href = notificationHref(n.type);
    if (!href) return;
    if (!n.isRead) {
      try {
        await markRead(n.id);
      } catch {
        // navigating matters more than the read flag
      }
    }
    router.push(href);
  };

  return (
    <div className="w-full p-8">
      {/* Header */}
      <h1
        className="text-[32px] font-semibold text-slate-900 tracking-tight mb-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Notifications
      </h1>
      <p className="text-[14px] text-slate-500 font-light mb-8">
        Reminders for topics that are due for review or slipping out of memory
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Unread
          </p>
          <h3 className="text-[24px] font-semibold text-slate-900 mt-1">
            {unreadCount}
          </h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Reviews Due
          </p>
          <h3 className="text-[24px] font-semibold text-blue-600 mt-1">
            {summary?.reviewDueCount ?? 0}
          </h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            Topics At Risk
          </p>
          <h3 className="text-[24px] font-semibold text-amber-600 mt-1">
            {summary?.atRiskCount ?? 0}
          </h3>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 self-start">
          {[
            { key: "all", label: `All (${notifications.length})` },
            { key: "unread", label: `Unread (${unreadCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                filter === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 md:ml-auto">
          <button
            onClick={handleCheckNow}
            disabled={isChecking}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isChecking ? "Checking..." : "Check for reminders"}
          </button>
          <button
            onClick={handleMarkAll}
            disabled={isMarkingAll || unreadCount === 0}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isMarkingAll ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading notifications...</p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <NotificationIcon type="DEFAULT" />
          </div>
          <h3 className="text-[16px] font-semibold text-slate-900 mb-1">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
            {filter === "unread"
              ? "You're all caught up."
              : "Reminders appear here when topics are due for review. Press “Check for reminders” to look right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => {
            const href = notificationHref(n.type);
            const actionLabel = notificationActionLabel(n.type);
            const busy = busyId === n.id;
            return (
              <div
                key={n.id}
                className={`bg-white border rounded-2xl p-5 flex gap-4 transition-all ${
                  n.isRead
                    ? "border-slate-200"
                    : "border-blue-200 bg-blue-50/30"
                } ${busy ? "opacity-60" : ""}`}
              >
                <NotificationIcon type={n.type} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3
                      className={`text-[15px] text-slate-900 ${
                        n.isRead ? "font-medium" : "font-semibold"
                      }`}
                    >
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {notificationTypeLabel(n.type)}
                    </span>
                  </div>

                  <p className="text-[14px] text-slate-600 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                    <span className="text-[12px] text-slate-400">
                      {n.timeAgo}
                    </span>
                    {n.relatedTopicName && (
                      <span className="text-[12px] text-slate-500">
                        Topic: <strong>{n.relatedTopicName}</strong>
                      </span>
                    )}
                    {href && (
                      <button
                        onClick={() => handleGo(n)}
                        className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {actionLabel} →
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-1 flex-shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={busy}
                      title="Mark as read"
                      aria-label="Mark as read"
                      className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:cursor-not-allowed"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10.5l4 4 8-9"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={busy}
                    title="Delete"
                    aria-label="Delete notification"
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
