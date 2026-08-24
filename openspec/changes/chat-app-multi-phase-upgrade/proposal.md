## Why

Kyeto Chat đã hoàn thành nền tảng core (chat 1-1, chat nhóm, WebRTC call, E2EE cơ bản, Kyeto Cloud, RBAC nhóm). Tuy nhiên, để trở thành sản phẩm production-ready và cạnh tranh với Zalo/Telegram, hệ thống cần một lộ trình nâng cấp toàn diện gồm 3 phase: (1) bảo mật & xác thực chuyên nghiệp, (2) trải nghiệm người dùng rich-media nâng cao, và (3) mở rộng nền tảng với AI, communities và hạ tầng DevOps.

## What Changes

- **Phase 1 — Bảo mật & Nền tảng**: E2EE thực sự (Signal Protocol / Diffie-Hellman Key Exchange thay thế passphrase mặc định), OAuth 2.0 (Google/GitHub/Facebook), 2FA (TOTP), Email verification, Quên mật khẩu, Push Notifications (Web Push API + FCM), Message pagination & infinite scroll, Image lazy loading, Auto-reconnect Socket.IO.
- **Phase 2 — Rich Experience**: Group video/audio call (SFU — Mediasoup), phân quyền chi tiết (Owner > Admin > Moderator > Member), Kick/Ban, QR code/Invite link, Polls. Voice & Video message recording, Sticker/GIF (GIPHY), Link preview (OG metadata), Markdown code blocks. Read receipts (tick xanh), Scheduled messages, Message threading, Message expiry (tự hủy). Đa ngôn ngữ (i18n — vi/en), Multi-theme, Custom emoji/sticker upload, User presence ("last seen"), Profile status.
- **Phase 3 — Mở rộng & Enterprise**: AI chatbot (GPT/Gemini integration), Smart reply, Auto translation, Content moderation, Chat summarization. Channel system (1-to-many broadcast), Community spaces, Channel subscriptions. PWA, React Native mobile app, Electron desktop app. Docker Compose, CI/CD (GitHub Actions), Unit/Integration tests (Jest), Load balancing (Nginx), Monitoring (Grafana + Prometheus). Premium plan, Admin dashboard, API rate limiting tiered.

## Capabilities

### New Capabilities
- `auth-advanced`: Xác thực nâng cao — OAuth 2.0, 2FA (TOTP), Email verification, Password reset, Rate limiting login.
- `e2ee-key-exchange`: Mã hóa End-to-End thực sự — Signal Protocol / Diffie-Hellman key exchange, per-pair unique shared key, key rotation, multi-device sync.
- `notification-system`: Hệ thống thông báo — Web Push API, FCM push, email notifications khi offline, per-conversation notification settings, sound toggles, browser tab badge.
- `performance-optimization`: Tối ưu hiệu năng — Message pagination/infinite scroll, image lazy loading + thumbnails, debounced typing, Socket.IO auto-reconnect, Redis pub/sub horizontal scaling.
- `group-advanced`: Chat nhóm nâng cao — Group video/audio call (SFU), phân quyền Owner/Admin/Moderator/Member, Kick/Ban, audit log, QR code join, Polls/Voting.
- `rich-media`: Đa phương tiện nâng cao — Voice message recording, Video message recording, Sticker/GIF (GIPHY), Link preview (OG metadata), Markdown code blocks, Drag & Drop upload.
- `message-advanced`: Quản lý tin nhắn nâng cao — "Delete for me" vs "Delete for everyone", Scheduled messages, Message threading, Read receipts (tick xanh), Message expiry (tự hủy).
- `ux-enhancements`: Nâng cấp trải nghiệm — Đa ngôn ngữ i18n (vi/en), Multi-theme system, Custom emoji/sticker upload, Profile status (Rảnh/Bận/Đi vắng), User presence ("last seen X ago").
- `ai-integration`: Tích hợp AI — AI chatbot (GPT/Gemini), Smart reply suggestions, Auto translation, Content moderation, Chat summarization.
- `channels-communities`: Kênh & Cộng đồng — Channel broadcast (1-to-many), Community spaces, Channel subscriptions, Announcement mode, Reactions/Comments on posts.
- `platform-expansion`: Mở rộng nền tảng — PWA (Service Worker), React Native mobile app, Electron desktop app, Chrome extension.
- `infrastructure-devops`: Hạ tầng & DevOps — Docker Compose, CI/CD (GitHub Actions), Unit/Integration tests (Jest + RTL), Load balancing (Nginx), Monitoring (Grafana + Prometheus), Logging (Winston + ELK), Database backup.
- `monetization`: Thương mại hóa — Premium plan (unlimited Cloud), Admin dashboard (analytics), API rate limiting tiered, Custom branding.

### Modified Capabilities
- `realtime-chat`: Mở rộng spec hiện có — thêm message pagination, read receipts, message expiry, scheduled messages vào behavior contract.

## Impact

- **Backend**: Thêm OAuth routes + passport strategies, TOTP middleware, email service (Nodemailer), web-push service, SFU media server integration, AI service proxy, Channel/Community/Subscription models, Admin analytics endpoints. Cập nhật Message schema (readBy, expiresAt, scheduledAt, threadId), User schema (publicKey, oauthProviders, twoFactorSecret, status, lastSeen, locale), Conversation schema (moderators, polls, channelType). Redis pub/sub adapter, Nginx config, Docker/docker-compose setup.
- **Frontend**: Thêm OAuth login buttons, 2FA setup flow, Push notification permission UI, Voice/Video recorder components, GIF picker, Link preview renderer, Markdown renderer, Thread view, Scheduled message picker, i18n provider (react-i18next), Theme switcher, Channel/Community browsing UI, Admin dashboard pages, PWA manifest + service worker. Cập nhật Zustand stores cho notifications, AI, channels, presence.
- **Dependencies**: Backend — `passport`, `passport-google-oauth20`, `passport-github2`, `speakeasy`/`otplib`, `nodemailer`, `web-push`, `mediasoup`, `openai`/`@google/generative-ai`, `winston`, `prom-client`. Frontend — `react-i18next`, `@mediasoup/client`, giphy SDK, `react-markdown`, `workbox` (PWA).
- **Infrastructure**: Docker, Nginx, GitHub Actions CI/CD, Grafana, Prometheus, ELK stack.
