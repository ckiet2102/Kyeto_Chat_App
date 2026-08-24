## Purpose

Nâng cấp trải nghiệm người dùng toàn diện: đa ngôn ngữ, hệ thống theme phong phú, emoji/sticker tùy chỉnh, và hệ thống presence chi tiết.

## ADDED Requirements

### Requirement: Đa ngôn ngữ (i18n)
Hệ thống MUST hỗ trợ chuyển đổi ngôn ngữ giao diện giữa Tiếng Việt và English, lưu preference của user.

#### Scenario: Chuyển ngôn ngữ
- **WHEN** user chọn "English" trong Settings > Language
- **THEN** toàn bộ giao diện chuyển sang tiếng Anh ngay lập tức mà không cần reload, preference được lưu vào profile

#### Scenario: Ngôn ngữ mặc định
- **WHEN** user mới đăng ký tài khoản
- **THEN** hệ thống detect ngôn ngữ browser, nếu là vi-VN thì dùng Tiếng Việt, còn lại dùng English

### Requirement: Multi-Theme System
Hệ thống MUST cho phép user chọn nhiều theme giao diện ngoài Light/Dark hiện tại (ví dụ: Ocean Blue, Forest Green, Sunset Orange, Midnight Purple).

#### Scenario: Đổi theme
- **WHEN** user chọn theme "Ocean Blue" trong Settings
- **THEN** hệ thống áp dụng bộ CSS variables mới (primary color, gradients, shadows), lưu preference, tất cả components cập nhật màu sắc mượt mà với transition

### Requirement: Custom Emoji/Sticker Upload
Hệ thống MUST cho phép user upload sticker/emoji cá nhân để sử dụng trong chat.

#### Scenario: Upload sticker pack
- **WHEN** user upload bộ sticker (tối đa 30 ảnh, mỗi ảnh < 512KB, format PNG/WebP)
- **THEN** hệ thống lưu sticker pack vào profile user, hiển thị trong sticker picker dưới tab "Sticker của tôi"

### Requirement: Profile Status
Hệ thống MUST cho phép user đặt trạng thái tùy chỉnh với emoji và text ngắn.

#### Scenario: Đặt status
- **WHEN** user đặt status "🏖️ Đang đi du lịch - trả lời chậm"
- **THEN** status hiển thị bên cạnh tên user trong danh sách chat, profile popup, và chat header

### Requirement: User Presence chi tiết
Hệ thống MUST hiển thị thời gian hoạt động cuối cùng cho user offline thay vì chỉ hiển thị online/offline.

#### Scenario: Hiển thị last seen
- **WHEN** user B offline
- **THEN** hệ thống hiển thị "Hoạt động 5 phút trước" hoặc "Hoạt động lúc 14:30" bên cạnh tên, cho phép user tắt tính năng này trong privacy settings
