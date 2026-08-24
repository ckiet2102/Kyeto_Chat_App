## Purpose

Mở rộng Kyeto Chat ra nhiều nền tảng: PWA cho mobile, ứng dụng desktop qua Electron, và Chrome extension để nhận tin nhanh.

## ADDED Requirements

### Requirement: Progressive Web App (PWA)
Hệ thống MUST cung cấp PWA cho phép cài đặt ứng dụng trên mobile và desktop từ browser.

#### Scenario: Cài đặt PWA trên mobile
- **WHEN** user truy cập web app trên mobile browser
- **THEN** hệ thống hiển thị banner "Thêm vào màn hình chính", sau khi cài đặt app chạy fullscreen với splash screen, hoạt động offline cho tin nhắn đã cache

#### Scenario: PWA offline mode
- **WHEN** user mở PWA mà không có internet
- **THEN** hệ thống hiển thị tin nhắn đã cache, cho phép soạn tin nhắn (queue), tự động gửi khi có mạng trở lại

### Requirement: React Native Mobile App
Hệ thống MUST cung cấp ứng dụng mobile native (iOS/Android) qua React Native / Expo, kết nối cùng backend API.

#### Scenario: Mobile app core features
- **WHEN** user cài đặt mobile app
- **THEN** app hỗ trợ đầy đủ: đăng nhập, chat 1-1, chat nhóm, gọi thoại/video, push notifications native, và Kyeto Cloud

### Requirement: Electron Desktop App
Hệ thống MUST cung cấp ứng dụng desktop (Windows, macOS, Linux) qua Electron, wrap frontend web app.

#### Scenario: Desktop app với system tray
- **WHEN** user đóng cửa sổ desktop app
- **THEN** app thu nhỏ vào system tray, tiếp tục nhận push notifications, double-click tray icon mở lại app

### Requirement: Chrome Extension
Hệ thống MUST cung cấp Chrome extension cho phép xem tin nhắn nhanh từ browser toolbar.

#### Scenario: Popup tin nhắn nhanh
- **WHEN** user click icon Kyeto Chat trên Chrome toolbar
- **THEN** popup hiển thị danh sách cuộc hội thoại gần nhất với unread count, cho phép đọc và trả lời nhanh mà không cần mở tab mới
