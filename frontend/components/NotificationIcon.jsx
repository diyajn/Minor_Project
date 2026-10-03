"use client";

const STYLES = {
  REVIEW_DUE: "bg-blue-50 text-blue-600",
  AT_RISK_TOPIC: "bg-amber-50 text-amber-600",
  STREAK_REMINDER: "bg-orange-50 text-orange-600",
  WEEKLY_SUMMARY: "bg-indigo-50 text-indigo-600",
  ACHIEVEMENT: "bg-emerald-50 text-emerald-600",
};

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
};

function Glyph({ type }) {
  switch (type) {
    case "REVIEW_DUE": // clock
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" {...stroke} />
          <path d="M10 6v4l2.5 2" {...stroke} />
        </svg>
      );
    case "AT_RISK_TOPIC": // warning triangle
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 3L18 16H2L10 3z" {...stroke} />
          <path d="M10 8v3.5M10 13.8v.2" {...stroke} />
        </svg>
      );
    case "STREAK_REMINDER": // flame
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2c1 3 4 4.5 4 8.5a4 4 0 11-8 0c0-1.7.8-2.7 1.5-3.5.2 1 .8 1.6 1.5 1.8C9 7 9 4.5 10 2z"
            {...stroke}
          />
        </svg>
      );
    case "WEEKLY_SUMMARY": // bars
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M4 16V9M10 16V4M16 16v-5" {...stroke} />
        </svg>
      );
    case "ACHIEVEMENT": // check circle
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" {...stroke} />
          <path d="M6.5 10.2l2.4 2.4 4.6-5" {...stroke} />
        </svg>
      );
    default: // bell
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5a4.5 4.5 0 00-4.5 4.5c0 4.5-2 5.5-2 5.5h13s-2-1-2-5.5A4.5 4.5 0 0010 2.5z"
            {...stroke}
          />
          <path d="M8.3 15.5a1.8 1.8 0 003.4 0" {...stroke} />
        </svg>
      );
  }
}

export default function NotificationIcon({ type }) {
  return (
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        STYLES[type] || "bg-slate-100 text-slate-500"
      }`}
    >
      <Glyph type={type} />
    </div>
  );
}
