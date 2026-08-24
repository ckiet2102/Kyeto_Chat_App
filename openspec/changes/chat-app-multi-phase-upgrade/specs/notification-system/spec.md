## Purpose

Hệ thống thông báo đa kênh (push, email, in-app sound) giúp người dùng không bỏ lỡ tin nhắn quan trọng ngay cả khi không mở ứng dụng.

## ADDED Requirements

### Requirement: Web Push Notifications
Hệ thống MUST gửi push notification qua Web Push API khi user nhận tin nhắn mới và đang offline hoặc tab không active.

#### Scenario: Nhận push notification khi tab inactive
- **WHEN** user A gửi tin nhắn cho user B và user B có tab browser không active
- **THEN** hệ thống gửi web push notification hiển thị tên người gửi và preview nội dung (nếu không bật E2EE)

#### Scenario: Đăng ký push notification
- **WHEN** user đăng nhập lần đầu trên browser hỗ trợ Push API
- **THEN** hệ thống hiển thị popup yêu cầu cấp quyền notification, lưu subscription endpoint vào database nếu user cho phép

### Requirement: Email Notifications
Hệ thống MUST gửi email digest khi user offline quá 1 giờ và có tin nhắn chưa đọc.

#### Scenario: Gửi email digest
- **WHEN** user offline hơn 1 giờ và có ≥ 3 tin nhắn chưa đọc
- **THEN** hệ thống gửi email tổng hợp liệt kê số tin nhắn chưa đọc theo cuộc hội thoại, tối đa 1 email mỗi 6 giờ

### Requirement: Tùy chỉnh notification per-conversation
Hệ thống MUST cho phép user tắt/bật notification cho từng cuộc hội thoại riêng biệt.

#### Scenario: Tắt tiếng cuộc hội thoại
- **WHEN** user chọn "Tắt thông báo" cho một cuộc hội thoại cụ thể
- **THEN** hệ thống không gửi push/email/sound cho tin nhắn trong cuộc hội thoại đó, nhưng vẫn tăng unread count

### Requirement: Sound Notifications
Hệ thống MUST phát âm thanh khi nhận tin nhắn mới (nếu tab active) với tùy chọn bật/tắt trong Settings.

#### Scenario: Phát âm thanh tin nhắn đến
- **WHEN** user đang active trên app và nhận tin nhắn mới từ cuộc hội thoại không bị tắt tiếng
- **THEN** hệ thống phát notification sound, âm thanh khác nhau cho tin nhắn thường vs cuộc gọi đến

### Requirement: Browser Tab Badge
Hệ thống MUST hiển thị số tin nhắn chưa đọc trên title tab browser.

#### Scenario: Cập nhật badge count
- **WHEN** có tin nhắn mới chưa đọc
- **THEN** title tab hiển thị dạng `(5) Kyeto Chat` với số tương ứng, trở về `Kyeto Chat` khi đã đọc hết
