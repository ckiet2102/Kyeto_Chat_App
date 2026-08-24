## MODIFIED Requirements

### Requirement: Tương tác tin nhắn nâng cao
Hệ thống MUST hỗ trợ các thao tác trả lời (Reply/Quote), chỉnh sửa (Edit), xóa mềm (Soft Delete) với phân biệt "Xóa phía tôi" vs "Thu hồi cho tất cả", thả cảm xúc (Reactions), hiển thị hiệu ứng đang gõ (Typing Indicator) theo thời gian thực, message pagination (infinite scroll), read receipts, và message expiry.

#### Scenario: Chỉnh sửa tin nhắn đã gửi
- **WHEN** người dùng gửi yêu cầu chỉnh sửa tin nhắn do chính mình sở hữu
- **THEN** hệ thống cập nhật nội dung tin nhắn, đánh dấu `isEdited: true`, lưu lịch sử chỉnh sửa và phát sự kiện socket `message-edited` tới toàn bộ người dùng trong phòng chat

#### Scenario: Message pagination với infinite scroll
- **WHEN** user mở cuộc hội thoại có hơn 30 tin nhắn
- **THEN** hệ thống chỉ load 30 tin nhắn mới nhất ban đầu, load thêm 30 tin cũ hơn khi user cuộn lên đầu (cursor-based pagination)

#### Scenario: Read receipts 1-1
- **WHEN** user B mở và đọc tin nhắn của user A trong chat 1-1
- **THEN** hệ thống cập nhật `readBy`, user A thấy tick chuyển từ xám sang xanh real-time

#### Scenario: Tin nhắn tự hủy
- **WHEN** user bật chế độ tin nhắn tự hủy với thời hạn cụ thể
- **THEN** tin nhắn hiển thị countdown, tự động bị xóa vĩnh viễn khi hết hạn

### Requirement: Quản trị nhóm và phân quyền RBAC
Hệ thống MUST thiết lập cơ chế phân quyền RBAC 4 cấp (Owner, Admin, Moderator, Member) và cung cấp các cấu hình tùy chỉnh cho nhóm trò chuyện.

#### Scenario: Thăng cấp vai trò trong nhóm
- **WHEN** Owner hoặc Admin chọn một thành viên và thay đổi vai trò
- **THEN** hệ thống cập nhật role, cấp/thu hồi quyền tương ứng và đồng bộ thời gian thực giao diện của tất cả thành viên

#### Scenario: Chế độ chỉ Admin nhắn tin
- **WHEN** tính năng `onlyAdminSend` được bật bởi Admin/Owner
- **THEN** hệ thống chặn các request nhắn tin từ Member/Moderator và vô hiệu hóa ô nhập liệu

### Requirement: Hạ tầng chịu tải lớn và bảo mật mã hóa E2EE
Hệ thống MUST hỗ trợ mở rộng quy mô đa máy chủ với Redis Adapter, cache dữ liệu với Redis, gửi thông báo đẩy Push Notifications và cung cấp mã hóa đầu-cuối E2EE thực sự với key exchange.

#### Scenario: Đồng bộ sự kiện Socket qua Redis Adapter
- **WHEN** hệ thống backend được triển khai trên nhiều instance server đằng sau Load Balancer
- **THEN** Redis Adapter đồng bộ toàn bộ sự kiện Socket.IO giữa các server, đảm bảo tin nhắn tới đúng client bất kể client kết nối tới instance nào
