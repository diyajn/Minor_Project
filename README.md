# Minor Project

    backend/   Spring Boot 4 + MySQL API   -> deploy on Railway (uses backend/Dockerfile)
    frontend/  Next.js 16 (static export)  -> deploy on Netlify  (uses frontend/netlify.toml)

Environment variables
---------------------
Backend (Railway):  ENV=prod, DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET (64+ chars),
                    CORS_ALLOWED_ORIGINS, SWAGGER_SERVER_URL, optional JWT_EXPIRATION_SECONDS
Backend (local):    DB_PASSWORD  (your local MySQL root password)
Frontend (Netlify): NEXT_PUBLIC_API_URL = https://<your-railway-domain>   (no trailing slash)

Notifications
-------------
Backend:  /api/notifications  (list, unread, summary, read, read-all, delete, check-now)
          Scheduled jobs (Asia/Kolkata): 08:00 due reviews, 10:00 at-risk topics,
          Monday 09:00 weekly summary, 00:00 cleanup of read notifications older than 30 days.
Frontend: bell in the top navbar (unread badge, refreshes every minute) and /dashboard/notifications.
