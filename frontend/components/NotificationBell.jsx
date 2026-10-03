"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NotificationIcon from "@/components/NotificationIcon";
import {
  NOTIFICATIONS_CHANGED,
  getSummary,
  getNotifications,
  markRead,
  markAllRead,
  notificationHref,
} from "@/lib/notifications";

const POLL_MS = 60_000; // check for new notifications every minute
const PREVIEW_COUNT = 8; // how many to show in the dropdown

export default function NotificationBell() {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const summary = await getSummary();
      if (summary && typeof summary === "object") {
        setUnread(summary.unreadCount ?? 0);
      }
    } catch {
      // The bell must never break the navbar, so fail quietly
    }
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) setItems(data.slice(0, PREVIEW_COUNT));
    } catch {
      // ignore - the dropdown just stays as it was
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Badge count: on load, every minute, and when the tab regains focus
  useEffect(() => {
    refreshCount();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_MS);
    const onFocus = () => refreshCount();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCount]);

  // Refresh when something elsewhere (e.g. the notifications page) changes data
  useEffect(() => {
    const onChanged = () => {
      refreshCount();
      if (open) loadItems();
    };
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
  }, [open, refreshCount, loadItems]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  };

  const handleItemClick = (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
      markRead(n.id).catch(() => refreshCount());
    }
    router.push(notificationHref(n.type) || "/dashboard/notifications");
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch (e) {
      toast.error(e.message || "Could not mark notifications as read");
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className={`relative p-2.5 rounded-xl transition-all ${
          open
            ? "bg-blue-50 text-blue-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5a4.5 4.5 0 00-4.5 4.5c0 4.5-2 5.5-2 5.5h13s-2-1-2-5.5A4.5 4.5 0 0010 2.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8.3 15.5a1.8 1.8 0 003.4 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">
              Notifications
            </h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[14px] font-medium text-slate-700">
                  You&apos;re all caught up
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  Review reminders will show up here.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-5 py-3.5 flex gap-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors ${
                    n.isRead ? "" : "bg-blue-50/40"
                  }`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[13px] text-slate-900 ${
                          n.isRead ? "font-medium" : "font-semibold"
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {n.timeAgo}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block text-center px-5 py-3 border-t border-slate-100 text-[13px] font-medium text-blue-600 hover:bg-slate-50 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
