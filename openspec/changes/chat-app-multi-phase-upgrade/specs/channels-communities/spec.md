## Purpose

Hệ thống Channel broadcast (1-to-many) và Community spaces cho phép tạo kênh thông tin, cộng đồng lớn với nhiều channels con.

## ADDED Requirements

### Requirement: Channel System
Hệ thống MUST hỗ trợ tạo Channel — kênh broadcast nơi chỉ admin/owner đăng bài, subscribers chỉ xem và react.

#### Scenario: Tạo channel
- **WHEN** user tạo Channel mới với tên, mô tả, và avatar
- **THEN** hệ thống tạo Channel entity (khác với group conversation), user trở thành Owner, channel hiển thị trong khung "Kênh" trên sidebar

#### Scenario: Subscribe channel
- **WHEN** user tìm thấy channel public và bấm "Theo dõi"
- **THEN** user được thêm vào subscriber list, nhận thông báo khi channel có bài đăng mới

### Requirement: Community Spaces
Hệ thống MUST cho phép tạo Community — nhóm lớn chứa nhiều channels con (text channels, announcement channels).

#### Scenario: Tạo community
- **WHEN** user tạo Community với tên và mô tả
- **THEN** hệ thống tạo Community entity với default "General" channel, Owner có thể thêm sub-channels theo chủ đề

#### Scenario: Duyệt community
- **WHEN** user mở tab "Khám phá" trong sidebar
- **THEN** hệ thống hiển thị danh sách community công khai, sắp xếp theo số thành viên và hoạt động

### Requirement: Channel Posts
Hệ thống MUST cho phép admin đăng bài dạng post (không chỉ tin nhắn) trong channel, subscribers có thể react và comment.

#### Scenario: Đăng bài trong channel
- **WHEN** channel admin soạn bài đăng (hỗ trợ rich text, ảnh, file)
- **THEN** bài đăng hiển thị dạng card với nút React (👍❤️😮) và nút "Bình luận" mở comment thread

#### Scenario: Comment trên bài đăng
- **WHEN** subscriber bấm "Bình luận" trên bài đăng channel
- **THEN** hệ thống mở thread bình luận riêng biệt, subscriber có thể chat trong thread mà không ảnh hưởng kênh chính
