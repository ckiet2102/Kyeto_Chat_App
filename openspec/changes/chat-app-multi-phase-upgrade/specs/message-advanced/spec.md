## Purpose

Quản lý tin nhắn nâng cao: phân biệt xóa cho mình/cho tất cả, hẹn giờ gửi, message threading, read receipts, và tin nhắn tự hủy.

## ADDED Requirements

### Requirement: Delete for me vs Delete for everyone
Hệ thống MUST phân biệt rõ hai loại xóa tin nhắn: "Xóa phía tôi" (chỉ ẩn với user hiện tại) và "Thu hồi cho tất cả" (soft delete cho mọi người).

#### Scenario: Xóa phía tôi
- **WHEN** user chọn "Xóa phía tôi" cho một tin nhắn
- **THEN** hệ thống thêm userId vào danh sách `hiddenFor` của tin nhắn, tin nhắn chỉ bị ẩn với user đó, người khác vẫn thấy bình thường

#### Scenario: Thu hồi cho tất cả
- **WHEN** user chọn "Thu hồi cho tất cả" cho tin nhắn do chính mình gửi (trong vòng 24 giờ)
- **THEN** hệ thống đặt `deletedAt` và thay nội dung thành "Tin nhắn đã bị thu hồi" cho tất cả thành viên

### Requirement: Scheduled Messages
Hệ thống MUST cho phép hẹn giờ gửi tin nhắn vào thời điểm trong tương lai.

#### Scenario: Tạo tin nhắn hẹn giờ
- **WHEN** user soạn tin nhắn và chọn "Hẹn giờ gửi" với thời gian cụ thể
- **THEN** hệ thống lưu tin nhắn với trạng thái `scheduled` và `scheduledAt`, hiển thị trong danh sách "Tin nhắn đã lên lịch" cho user

#### Scenario: Gửi tin nhắn đã hẹn
- **WHEN** thời gian hiện tại đạt `scheduledAt` của tin nhắn
- **THEN** hệ thống tự động gửi tin nhắn như bình thường, phát socket event, cập nhật lastMessage trong conversation

### Requirement: Message Threading
Hệ thống MUST cho phép tạo thread (luồng thảo luận phụ) từ bất kỳ tin nhắn nào.

#### Scenario: Tạo thread từ tin nhắn
- **WHEN** user chọn "Tạo thread" trên một tin nhắn
- **THEN** hệ thống mở panel thread riêng bên phải, tin nhắn gốc hiển thị badge đếm số reply, các tin nhắn trong thread không xuất hiện trong luồng chat chính

### Requirement: Read Receipts
Hệ thống MUST hiển thị trạng thái đã đọc (tick xanh) cho tin nhắn trong chat 1-1.

#### Scenario: Hiển thị tick đã đọc
- **WHEN** user B mở cuộc hội thoại và đọc tin nhắn của user A
- **THEN** hệ thống cập nhật `readBy` cho tin nhắn, user A thấy tick chuyển từ xám (đã gửi) sang xanh (đã đọc) real-time

#### Scenario: Read receipts trong nhóm
- **WHEN** user muốn xem ai đã đọc tin nhắn trong group chat
- **THEN** hệ thống hiển thị popup "Đã xem bởi" liệt kê avatar + tên của những người đã đọc

### Requirement: Message Expiry
Hệ thống MUST cho phép gửi tin nhắn tự hủy sau thời gian nhất định.

#### Scenario: Gửi tin nhắn tự hủy
- **WHEN** user bật chế độ "Tin nhắn tự hủy" và chọn thời hạn (30 giây / 5 phút / 1 giờ / 24 giờ)
- **THEN** tin nhắn hiển thị countdown timer, sau khi hết hạn tin nhắn bị xóa vĩnh viễn khỏi database và giao diện tất cả thành viên
