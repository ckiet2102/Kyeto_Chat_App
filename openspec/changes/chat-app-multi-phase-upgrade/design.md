## Context

Kyeto Chat đã hoàn thành nền tảng core (xem proposal.md — Why). Hệ thống hiện chạy Node.js/Express v5, MongoDB (Mongoose 8), Socket.IO 4.x, React 19 + TypeScript + Vite 7 + TailwindCSS 4 + Zustand 5, WebRTC P2P, Cloudinary CDN, Redis cache (graceful fallback). Tài liệu này mô tả kiến trúc kỹ thuật cho 13 capability mới trải qua 3 phase.

## Goals / Non-Goals

**Goals:**
- Triển khai xác thực đa phương thức (OAuth, 2FA, Email verify) mà không phá vỡ JWT/Session hiện có
- Nâng cấp E2EE từ passphrase cố định sang key exchange thực sự
- Xây dựng notification pipeline đa kênh (push, email, sound, tab badge)
- Tối ưu performance cho quy mô 10K+ concurrent users
- Mở rộng messaging với voice/video recording, GIF, threading, scheduling
- Tích hợp AI services (GPT/Gemini) cho smart features
- Thiết kế Channel/Community system tách biệt khỏi conversation model hiện tại
- Containerize và CI/CD hóa toàn bộ stack
- Xây dựng mô hình monetization với Premium tier

**Non-Goals:**
- Viết lại toàn bộ frontend hoặc chuyển framework
- Thay thế MongoDB bằng database khác
- Xây dựng SFU server riêng từ đầu (sử dụng Mediasoup)
- Hỗ trợ end-to-end encryption cho group chat (chỉ 1-1 trong Phase 1)

## Decisions

### Decision 1: OAuth Strategy — Passport.js với Multiple Strategies
- **Quyết định**: Sử dụng `passport` với strategies (`passport-google-oauth20`, `passport-github2`, `passport-facebook`) tích hợp vào auth flow hiện tại. OAuth callback tạo/liên kết user rồi issue JWT tokens giống flow đăng nhập thường.
- **Lý do**: Passport.js mature, hỗ trợ 500+ providers, dễ thêm provider mới. Alternative: tự implement OAuth flow → phức tạp hơn, dễ lỗi bảo mật.
- **Impact**: Thêm `oauthProviders` field vào User model, thêm routes `/api/auth/google`, `/api/auth/github`, `/api/auth/facebook`.

### Decision 2: 2FA — TOTP với `otplib`
- **Quyết định**: Sử dụng `otplib` (TOTP compliant RFC 6238) thay vì SMS OTP.
- **Lý do**: TOTP không phụ thuộc SMS gateway (chi phí cao, delay), tương thích Google Authenticator/Authy. Alternative: SMS OTP → chi phí SMS, latency.
- **Impact**: Thêm `twoFactorSecret`, `twoFactorEnabled` vào User model. Login flow thêm bước verify TOTP.

### Decision 3: E2EE — ECDH Key Exchange + AES-256-GCM (Web Crypto API)
- **Quyết định**: Sử dụng ECDH (Elliptic Curve Diffie-Hellman) qua Web Crypto API native thay vì Signal Protocol library.
- **Lý do**: Web Crypto API native trong browser (không cần thêm dependency), đủ bảo mật cho 1-1 chat. Signal Protocol phức tạp hơn (Double Ratchet) nhưng cần cho perfect forward secrecy — có thể upgrade sau. Alternative: Signal Protocol via `libsignal-protocol-javascript` → phức tạp hơn đáng kể.
- **Impact**: Thêm `publicKey` vào User model, tạo `KeyStore` service (IndexedDB) ở frontend, update `CryptoService` dùng ECDH shared secret.

### Decision 4: Notification Pipeline — Web Push API + Nodemailer + Socket.IO
- **Quyết định**: 3 tầng notification: (1) In-app via Socket.IO events (existing), (2) Web Push via `web-push` npm package, (3) Email digest via `nodemailer`. Cron job cho email digest.
- **Lý do**: Web Push API miễn phí (không cần FCM cho web), Nodemailer flexible (SMTP/SES). Alternative: Firebase Cloud Messaging → thêm vendor lock-in.
- **Impact**: Thêm `PushSubscription` model, `NotificationPreference` trong User, email template system, cron job service.

### Decision 5: Message Pagination — Cursor-based với `_id` làm cursor
- **Quyết định**: Sử dụng cursor-based pagination (dùng `_id` ObjectId) thay vì offset-based. Query: `{ conversationId, _id: { $lt: cursor } }` với limit 30.
- **Lý do**: Cursor-based ổn định khi có tin nhắn mới (offset bị shift). MongoDB `_id` tự nhiên là time-sorted. Alternative: offset/skip → performance kém khi offset lớn.
- **Impact**: Update `getMessages` API endpoint thêm `cursor` param, frontend `useChatStore` thêm pagination state.

### Decision 6: Group Call — Mediasoup SFU
- **Quyết định**: Sử dụng `mediasoup` (Node.js SFU) để xử lý group video/audio call, tách riêng media server process.
- **Lý do**: Mediasoup high-performance C++ core, Node.js API, hỗ trợ simulcast/SVC. Alternative: Janus Gateway → C-based, khó maintain; LiveKit → SaaS, chi phí.
- **Impact**: Thêm `media-server` service riêng, frontend `@mediasoup/client`, signaling qua Socket.IO existing.

### Decision 7: Voice/Video Recording — MediaRecorder API
- **Quyết định**: Sử dụng browser-native `MediaRecorder API` cho ghi âm và quay video, output WebM format, upload Cloudinary.
- **Lý do**: Native API, không cần library. Alternative: ffmpeg.wasm → heavy (25MB), chỉ cần khi cần transcode.
- **Impact**: Thêm `VoiceRecorder` và `VideoRecorder` components, message type "voice"/"video".

### Decision 8: AI Integration — API Proxy Pattern
- **Quyết định**: Backend đóng vai proxy gọi AI APIs (OpenAI/Gemini), không expose AI API keys tới frontend.
- **Lý do**: Bảo mật API keys, rate limiting centralized, dễ switch provider. Alternative: Frontend gọi trực tiếp → lộ API key.
- **Impact**: Thêm `aiController.js`, routes `/api/ai/chat`, `/api/ai/translate`, `/api/ai/summarize`. Env vars cho API keys.

### Decision 9: Channel/Community — Separate Data Model
- **Quyết định**: Tạo `Channel` và `Community` models riêng biệt, không mở rộng `Conversation` model hiện tại.
- **Lý do**: Channel/Community có behavior rất khác conversation (1-to-many broadcast, posts, subscriptions). Mở rộng Conversation sẽ quá phức tạp. Alternative: Thêm `type: "channel"` vào Conversation → quá nhiều conditional logic.
- **Impact**: Thêm `Channel`, `Community`, `ChannelPost`, `Subscription` models. Sidebar thêm tab "Channels".

### Decision 10: i18n — react-i18next với JSON locale files
- **Quyết định**: Sử dụng `react-i18next` với JSON translation files cho vi/en.
- **Lý do**: react-i18next là standard cho React, hỗ trợ lazy loading, pluralization, interpolation. Alternative: Format.js → heavier.
- **Impact**: Tạo `locales/vi.json`, `locales/en.json`, wrap App với `I18nextProvider`, thêm `locale` vào User model.

### Decision 11: Docker — Multi-stage Builds + Docker Compose
- **Quyết định**: Dockerfile multi-stage cho cả backend và frontend. Docker Compose orchestrate 4 services: backend, frontend (Nginx serve static), mongodb, redis.
- **Lý do**: Multi-stage giảm image size. Compose đơn giản cho development/staging. Alternative: Kubernetes → overkill cho giai đoạn này.
- **Impact**: Thêm `Dockerfile` cho backend/frontend, `docker-compose.yml`, `nginx.conf`, `.dockerignore`.

### Decision 12: Monetization — Feature Flags + User Tier
- **Quyết định**: Thêm `plan` field vào User model (`free`/`premium`/`enterprise`), sử dụng feature flag middleware kiểm tra quyền trước khi cho phép tính năng premium.
- **Lý do**: Simple, dễ mở rộng. Payment integration (Stripe) sẽ thêm sau. Alternative: External feature flag service (LaunchDarkly) → quá sớm.
- **Impact**: Thêm `plan`, `planExpiresAt` vào User model, `planMiddleware.js`, Admin dashboard routes.

## Risks / Trade-offs

- **[Risk]** Mediasoup SFU yêu cầu server mạnh (CPU-intensive encode/decode) → **Mitigation**: Deploy media server riêng, bắt đầu với giới hạn 8 participants/room, horizontal scale khi cần.
- **[Risk]** AI API costs tăng theo usage → **Mitigation**: Rate limit AI features, cache common responses, cho phép user chọn AI provider.
- **[Risk]** E2EE key exchange phức tạp khi multi-device → **Mitigation**: Phase 1 chỉ hỗ trợ single device key pair, multi-device sync ở phase sau.
- **[Risk]** PWA offline mode cần IndexedDB sync phức tạp → **Mitigation**: Bắt đầu với read-only offline (cache tin nhắn đã load), message queue cho offline writes ở phase sau.
- **[Risk]** Quá nhiều features có thể gây performance regression → **Mitigation**: Feature flags cho phép disable từng module, lazy load heavy modules (AI, Mediasoup client).
- **[Risk]** MongoDB document size limit 16MB cho conversation với nhiều participants → **Mitigation**: Participants reference by ID, không embed full user data. Channel subscribers lưu trong collection riêng.

## Migration Plan

1. **Phase 1** (Bảo mật & Nền tảng): Deploy song song OAuth routes, không breaking existing login. E2EE key exchange opt-in, fallback về passphrase cũ. Pagination API backward-compatible (không có cursor = load all, giữ behavior cũ).
2. **Phase 2** (Rich Experience): Thêm features mới dưới dạng optional UI elements. Group call yêu cầu deploy media server riêng. Voice/Video message là message type mới, không ảnh hưởng text messages.
3. **Phase 3** (Enterprise): Channel/Community là modules hoàn toàn mới. Docker/CI/CD không ảnh hưởng code. Premium features gated bằng middleware, free users không bị ảnh hưởng.
4. **Rollback**: Mỗi phase có thể rollback độc lập. Feature flags cho phép disable từng capability. Database migrations additive only (thêm fields, không xóa).
