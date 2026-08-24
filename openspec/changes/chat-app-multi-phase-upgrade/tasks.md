## 1. Phase 1A — Xác thực nâng cao (auth-advanced)

- [x] 1.1 Cài đặt dependencies: `passport`, `passport-google-oauth20`, `passport-github2`, `passport-facebook`, `otplib`, `nodemailer`, `qrcode`
- [x] 1.2 Cập nhật User model: thêm `oauthProviders` (Map), `emailVerified` (Boolean), `twoFactorSecret` (String), `twoFactorEnabled` (Boolean), `emailVerifyToken`, `passwordResetToken`, `passwordResetExpires`
- [x] 1.3 Tạo Passport strategies cho Google, GitHub, Facebook OAuth 2.0 — file `backend/src/config/passport.js`
- [x] 1.4 Tạo OAuth routes: `GET /api/auth/google`, `GET /api/auth/google/callback`, tương tự cho GitHub và Facebook — file `backend/src/routes/authRoute.js`
- [x] 1.5 Implement OAuth callback controller: tạo/liên kết user, issue JWT tokens — file `backend/src/controllers/authController.js`
- [x] 1.6 Implement 2FA: endpoints `POST /api/users/2fa/setup` (generate secret + QR), `POST /api/users/2fa/verify` (kích hoạt), `POST /api/users/2fa/validate` (login step 2)
- [x] 1.7 Implement Email verification: gửi email khi đăng ký, endpoint `GET /api/auth/verify-email/:token`
- [x] 1.8 Implement Password reset: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/:token`
- [x] 1.9 Implement Rate limiting middleware: giới hạn 5 login thất bại / 15 phút per IP — file `backend/src/middlewares/rateLimitMiddleware.js`
- [x] 1.10 Frontend: Tạo OAuth login buttons (Google, GitHub, Facebook) trên SignInPage — file `frontend/src/components/auth/signin-form.tsx`
- [x] 1.11 Frontend: Tạo 2FA setup UI (QR code display, verify input) trong Settings — file `frontend/src/components/profile/TwoFactorSetup.tsx`
- [x] 1.12 Frontend: Tạo trang 2FA verify khi login — file `frontend/src/components/auth/TwoFactorVerify.tsx`
- [x] 1.13 Frontend: Tạo form Quên mật khẩu và Reset mật khẩu — files `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
- [x] 1.14 Frontend: Cập nhật `useAuthStore` hỗ trợ OAuth flow và 2FA step

## 2. Phase 1B — E2EE Key Exchange (e2ee-key-exchange)

- [x] 2.1 Cập nhật User model: thêm `publicKey` (String) để lưu ECDH public key
- [x] 2.2 Backend: Tạo endpoints `POST /api/users/keys` (upload public key), `GET /api/users/:id/key` (lấy public key của user khác)
- [x] 2.3 Frontend: Tạo `KeyStoreService` sử dụng IndexedDB để lưu private keys — file `frontend/src/services/keyStoreService.ts`
- [x] 2.4 Frontend: Refactor `CryptoService` — thay thế passphrase mặc định bằng ECDH shared secret (Web Crypto API `generateKey`, `deriveKey`, `deriveBits`)
- [x] 2.5 Frontend: Implement key exchange flow khi mở conversation 1-1 lần đầu — auto negotiate trong `useChatStore`
- [x] 2.6 Frontend: Implement key rotation logic (kiểm tra key age, re-negotiate nếu > 30 ngày)
- [x] 2.7 Frontend: Hiển thị lock icon 🔒 trên tin nhắn đã mã hóa E2EE thực sự

## 3. Phase 1C — Notification System (notification-system)

- [x] 3.1 Cài đặt dependencies: `web-push`, cấu hình VAPID keys trong `.env`
- [x] 3.2 Tạo `PushSubscription` model — lưu endpoint, keys, userId — file `backend/src/models/PushSubscription.js`
- [x] 3.3 Cập nhật User model: thêm `notificationPreferences` (object: push, email, sound per conversation)
- [x] 3.4 Backend: Tạo `notificationController.js` — endpoints subscribe/unsubscribe push, update preferences
- [x] 3.5 Backend: Tạo `pushService.js` — logic gửi web push notification khi có tin nhắn mới và user offline
- [x] 3.6 Backend: Tạo `emailService.js` — Nodemailer config + email digest template
- [x] 3.7 Backend: Tạo cron job gửi email digest mỗi 6 giờ cho users offline có tin nhắn chưa đọc
- [x] 3.8 Frontend: Tạo Service Worker cho Push Notifications — file `frontend/public/sw.js`
- [x] 3.9 Frontend: Tạo `NotificationPermission` component yêu cầu cấp quyền push
- [x] 3.10 Frontend: Implement sound notifications (Audio API) + toggle trong Settings
- [x] 3.11 Frontend: Implement browser tab badge count trên document.title — `(N) Kyeto Chat`
- [x] 3.12 Frontend: Tạo Notification Preferences UI cho từng conversation (mute/unmute)

## 4. Phase 1D — Performance Optimization (performance-optimization)

- [x] 4.1 Backend: Refactor `getMessages` API — thêm cursor-based pagination (`cursor` param, default limit 30)
- [x] 4.2 Backend: Tạo thumbnail generation middleware — Cloudinary transformation `w_400,c_limit` khi upload ảnh
- [x] 4.3 Frontend: Implement infinite scroll trong `ChatWindowBody` — sử dụng `IntersectionObserver` detect khi cuộn lên top
- [x] 4.4 Frontend: Cập nhật `useChatStore` — thêm pagination state (`cursor`, `hasMore`, `isLoadingMore`)
- [x] 4.5 Frontend: Implement image lazy loading với `loading="lazy"` + `IntersectionObserver` + skeleton placeholder
- [x] 4.6 Frontend: Debounce typing indicator (emit `typing` event tối đa 1 lần / 2 giây)
- [x] 4.7 Frontend: Implement Socket.IO auto-reconnect UI — banner "Đang kết nối lại..." + fetch missed messages on reconnect
- [x] 4.8 Backend: Cấu hình `@socket.io/redis-adapter` cho horizontal scaling (optional, production only)

## 5. Phase 2A — Group Chat nâng cao (group-advanced)

- [x] 5.1 Cập nhật Conversation model: thêm `moderators` array, `banList` array, `polls` array
- [x] 5.2 Backend: Implement 4-tier RBAC middleware — Owner > Admin > Moderator > Member — file `backend/src/middlewares/rbacMiddleware.js`
- [x] 5.3 Backend: Implement Kick/Ban endpoints — `POST /api/conversations/:id/kick`, `POST /api/conversations/:id/ban`, `POST /api/conversations/:id/unban`
- [x] 5.4 Backend: Implement QR Code / Invite Link — `POST /api/conversations/:id/invite-link` (generate), `POST /api/conversations/join/:inviteCode`
- [x] 5.5 Backend: Implement Polls — `POST /api/conversations/:id/polls` (create), `POST /api/conversations/:id/polls/:pollId/vote`
- [x] 5.6 Frontend: Cập nhật `GroupSettingsDrawer` — UI cho phân quyền 4 cấp, kick/ban, invite link + QR code display
- [x] 5.7 Frontend: Tạo `PollCreator` component + `PollMessage` component hiển thị poll trong chat
- [ ] 5.8 Backend + Frontend: Setup Mediasoup SFU server cho group video/audio call
- [ ] 5.9 Frontend: Tạo `GroupCallModal` component — grid layout nhiều video feeds, join/leave group call

## 6. Phase 2B — Rich Media (rich-media)

- [x] 6.1 Frontend: Tạo `VoiceRecorder` component — sử dụng `MediaRecorder API`, hiển thị waveform + timer, upload audio file
- [x] 6.2 Frontend: Tạo `VideoRecorder` component — camera preview, max 60s recording, upload video
- [x] 6.3 Backend: Cập nhật Message model — thêm `type` enum: `text`, `voice`, `video`, `gif`, `poll`
- [x] 6.4 Frontend: Tạo `VoiceMessagePlayer` component — inline audio player với waveform visualization
- [x] 6.5 Frontend: Tạo `VideoMessagePlayer` component — inline video player với controls
- [x] 6.6 Frontend: Tích hợp GIPHY API — tạo `GifPicker` component, search + trending GIFs
- [x] 6.7 Backend: Tạo `linkPreviewService.js` — fetch OG metadata từ URL (title, description, image)
- [x] 6.8 Backend: Endpoint `POST /api/messages/link-preview` — nhận URL, trả về OG data
- [x] 6.9 Frontend: Tạo `LinkPreviewCard` component — hiển thị card preview dưới tin nhắn chứa URL
- [ ] 6.10 Frontend: Implement Markdown code blocks — sử dụng `react-markdown` + `react-syntax-highlighter` cho syntax highlighting
- [ ] 6.11 Frontend: Implement Drag & Drop file upload — drop zone overlay trong `ChatWindowBody`

## 7. Phase 2C — Message Management nâng cao (message-advanced)

- [x] 7.1 Cập nhật Message model: thêm `hiddenFor` (array of userIds), `scheduledAt` (Date), `expiresAt` (Date), `threadId` (ObjectId), `readBy` (array)
- [x] 7.2 Backend: Refactor `deleteMessage` — phân biệt "delete for me" (thêm vào `hiddenFor`) vs "recall for everyone" (set `deletedAt`)
- [x] 7.3 Backend: Implement Scheduled Messages — `POST /api/messages/schedule`, cron job check `scheduledAt` và gửi khi đến giờ
- [x] 7.4 Backend: Implement Message Threading — `POST /api/messages/thread/:parentId`, `GET /api/messages/thread/:parentId`
- [x] 7.5 Backend: Implement Read Receipts — `POST /api/messages/read` (mark as read), socket emit `message-read`
- [x] 7.6 Backend: Implement Message Expiry — cron job check `expiresAt`, delete expired messages, socket emit `message-expired`
- [x] 7.7 Frontend: Cập nhật delete dialog — 2 options: "Xóa phía tôi" vs "Thu hồi cho tất cả"
- [x] 7.8 Frontend: Tạo `ScheduleMessagePicker` component — date/time picker cho hẹn giờ gửi
- [x] 7.9 Frontend: Tạo `ThreadPanel` component — side panel hiển thị thread replies
- [x] 7.10 Frontend: Implement read receipt UI — tick xám/xanh trên `MessageItem`, popup "Đã xem bởi" trong nhóm
- [x] 7.11 Frontend: Implement message expiry UI — countdown timer trên tin nhắn, toggle chế độ tự hủy

## 8. Phase 2D — UX Enhancements (ux-enhancements)

- [x] 8.1 Cài đặt `react-i18next`, `i18next` — tạo `frontend/src/locales/vi.json`, `frontend/src/locales/en.json`
- [x] 8.2 Frontend: Tạo i18n config — file `frontend/src/lib/i18n.ts`, wrap App với `I18nextProvider`
- [x] 8.3 Frontend: Dịch toàn bộ hardcoded strings sang i18n keys (ước tính 200+ strings)
- [x] 8.4 Frontend: Tạo Language Selector trong Settings
- [x] 8.5 Cập nhật User model: thêm `locale` (String, default `vi`), `status` (object: emoji + text), `lastSeen` (Date)
- [x] 8.6 Frontend: Tạo Multi-Theme system — định nghĩa 6 theme presets (Luxury Gold, Ocean Blue, Forest Green, Sunset Orange, Midnight Purple, Minimal White) dưới dạng CSS variable sets
- [x] 8.7 Frontend: Tạo Theme Picker UI trong Settings — preview cards cho mỗi theme
- [x] 8.8 Frontend: Tạo `StatusEditor` component — emoji picker + text input cho profile status
- [x] 8.9 Frontend: Tạo `CustomStickerUploader` component — upload pack + manage stickers
- [x] 8.10 Backend + Frontend: Implement User Presence — update `lastSeen` khi disconnect, hiển thị "Hoạt động X phút trước"
- [x] 8.11 Frontend: Privacy settings — cho phép tắt "last seen", tắt read receipts

## 9. Phase 3A — AI Integration (ai-integration)

- [x] 9.1 Cài đặt dependencies: `openai` hoặc `@google/generative-ai`
- [x] 9.2 Backend: Tạo `aiController.js` — endpoints: `POST /api/ai/chat`, `POST /api/ai/translate`, `POST /api/ai/summarize`, `POST /api/ai/moderate`
- [x] 9.3 Backend: Tạo `aiService.js` — proxy pattern gọi AI APIs, rate limiting per user
- [x] 9.4 Frontend: Implement `@ai` mention trigger trong MessageInput — detect `@ai` prefix, route to AI endpoint
- [x] 9.5 Frontend: Tạo `SmartReplyChips` component — hiển thị 2-3 gợi ý trả lời phía trên input
- [x] 9.6 Frontend: Tạo nút "Dịch" trên `MessageItem` — inline translation display
- [x] 9.7 Frontend: Tạo nút "Tóm tắt" cho conversation — `ChatSummaryCard` component
- [x] 9.8 Backend: Implement content moderation — auto-flag tin nhắn vi phạm, notify group admin

## 10. Phase 3B — Channels & Communities (channels-communities)

- [x] 10.1 Backend: Tạo `Channel` model — name, description, avatar, owner, admins, type (broadcast/discussion)
- [x] 10.2 Backend: Tạo `Community` model — name, description, owner, channels (array of Channel refs)
- [x] 10.3 Backend: Tạo `ChannelPost` model — channelId, authorId, content, media, reactions, commentCount
- [x] 10.4 Backend: Tạo `Subscription` model — userId, channelId/communityId, subscribedAt
- [x] 10.5 Backend: Tạo `channelController.js` — CRUD channels, create posts, subscribe/unsubscribe
- [x] 10.6 Backend: Tạo `communityController.js` — CRUD communities, manage sub-channels
- [x] 10.7 Frontend: Tạo "Channels" tab trong NavigationRail + `ChannelListSidebar` component
- [x] 10.8 Frontend: Tạo `ChannelView` component — hiển thị posts dạng feed, reactions, comment threads
- [x] 10.9 Frontend: Tạo `CreateChannelModal` và `CreateCommunityModal`
- [x] 10.10 Frontend: Tạo `DiscoverPage` — browse public channels/communities

## 11. Phase 3C — Platform Expansion (platform-expansion)

- [x] 11.1 Frontend: Tạo PWA manifest (`manifest.json`) + Service Worker registration
- [x] 11.2 Frontend: Implement offline caching strategy — cache app shell + recent messages
- [x] 11.3 Frontend: Tạo install prompt component cho PWA
- [x] 11.4 Tạo React Native project (Expo) — setup navigation, auth flow, chat screens
- [x] 11.5 React Native: Implement core chat features — message list, send message, realtime Socket.IO
- [x] 11.6 React Native: Implement push notifications native (expo-notifications)
- [x] 11.7 Tạo Electron wrapper — setup `electron-builder`, system tray, auto-update
- [x] 11.8 Tạo Chrome Extension — popup UI, background script kết nối Socket.IO, badge count

## 12. Phase 3D — Infrastructure & DevOps (infrastructure-devops)

- [x] 12.1 Tạo `Dockerfile` cho backend (multi-stage: build → production)
- [x] 12.2 Tạo `Dockerfile` cho frontend (multi-stage: build → Nginx serve)
- [x] 12.3 Tạo `docker-compose.yml` — 4 services: backend, frontend, mongodb, redis
- [x] 12.4 Tạo `nginx.conf` — reverse proxy, SSL, gzip, WebSocket upgrade
- [x] 12.5 Tạo `.github/workflows/ci.yml` — lint, test, build on PR
- [x] 12.6 Tạo `.github/workflows/deploy.yml` — auto deploy on merge to main
- [x] 12.7 Backend: Setup Jest + mongodb-memory-server — unit tests cho auth, message, conversation controllers
- [x] 12.8 Frontend: Setup Vitest + React Testing Library — component tests cho MessageItem, AuthForm, ChatInput
- [x] 12.9 Backend: Tích hợp Winston logger — structured JSON logging, request ID tracking
- [x] 12.10 Backend: Tích hợp `prom-client` — expose `/metrics` endpoint cho Prometheus
- [x] 12.11 Tạo `docker-compose.monitoring.yml` — Grafana + Prometheus + dashboards
- [x] 12.12 Tạo backup script — mongodump + compress + upload S3, cron schedule hàng ngày

## 13. Phase 3E — Monetization (monetization)

- [x] 13.1 Cập nhật User model: thêm `plan` (enum: free/premium/enterprise), `planExpiresAt` (Date)
- [x] 13.2 Backend: Tạo `planMiddleware.js` — feature flag middleware kiểm tra plan trước khi cho phép tính năng premium
- [x] 13.3 Backend: Tạo `adminController.js` — endpoints: system stats, user management, plan management
- [x] 13.4 Backend: Implement tiered rate limiting — 60 req/min (free), 300 req/min (premium)
- [x] 13.5 Frontend: Tạo `PricingPage` component — hiển thị so sánh Free vs Premium vs Enterprise
- [x] 13.6 Frontend: Tạo `AdminDashboard` page — charts (recharts), user table, system metrics
- [x] 13.7 Frontend: Implement premium upgrade flow UI — (placeholder cho payment integration)
- [x] 13.8 Backend: Implement custom branding — Enterprise org settings, logo upload, primary color override
