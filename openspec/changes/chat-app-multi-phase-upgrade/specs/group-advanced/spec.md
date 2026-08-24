## Purpose

Chat nhóm nâng cao với gọi video/audio nhóm qua SFU, phân quyền chi tiết nhiều cấp, và các công cụ quản trị nhóm chuyên nghiệp.

## ADDED Requirements

### Requirement: Group Video/Audio Call (SFU)
Hệ thống MUST hỗ trợ gọi video/audio nhóm thông qua SFU server (Mediasoup) cho phép nhiều participants cùng lúc, thay vì chỉ P2P 1-1.

#### Scenario: Khởi tạo group call
- **WHEN** user bấm nút gọi video/audio trong group chat
- **THEN** hệ thống tạo SFU room, thông báo tất cả thành viên qua Socket.IO, mỗi thành viên tham gia bằng cách kết nối media stream tới SFU server

#### Scenario: Tham gia group call đang diễn ra
- **WHEN** group call đã có 3 người tham gia và user thứ 4 muốn join
- **THEN** hệ thống thêm user vào SFU room, user nhận media streams từ tất cả participants hiện tại, và participants hiện tại nhận stream của user mới

### Requirement: Phân quyền chi tiết (Owner > Admin > Moderator > Member)
Hệ thống MUST triển khai 4 cấp quyền hạn trong nhóm thay vì chỉ 2 cấp (Admin/Member) như hiện tại.

#### Scenario: Moderator quản lý tin nhắn
- **WHEN** user có role Moderator trong nhóm
- **THEN** user có quyền xóa tin nhắn của bất kỳ ai, ghim tin nhắn, và tắt tiếng thành viên, nhưng không có quyền thay đổi cài đặt nhóm hoặc kick/ban

#### Scenario: Owner chuyển quyền sở hữu
- **WHEN** Owner nhóm chọn "Chuyển quyền sở hữu" cho một Admin
- **THEN** hệ thống chuyển Owner role, Owner cũ trở thành Admin, thông báo real-time tới tất cả thành viên

### Requirement: Kick & Ban thành viên
Hệ thống MUST cho phép Admin/Owner kick hoặc ban thành viên khỏi nhóm.

#### Scenario: Ban thành viên
- **WHEN** Admin ban một Member khỏi nhóm
- **THEN** hệ thống xóa user khỏi participants, thêm vào ban list, user bị ban không thể rejoin qua bất kỳ phương thức nào (invite link, QR code) cho đến khi được unban

### Requirement: Tham gia nhóm qua QR Code / Invite Link
Hệ thống MUST tạo QR code và invite link duy nhất cho mỗi nhóm cho phép người mới tham gia.

#### Scenario: Tạo và chia sẻ invite link
- **WHEN** Admin tạo invite link cho nhóm
- **THEN** hệ thống generate unique link + QR code, link có thể đặt hạn sử dụng (1 ngày / 7 ngày / vĩnh viễn) và giới hạn số lần dùng

### Requirement: Polls / Bình chọn
Hệ thống MUST cho phép tạo polls (bình chọn) trong group chat.

#### Scenario: Tạo poll trong nhóm
- **WHEN** user tạo poll với câu hỏi và tối thiểu 2 lựa chọn
- **THEN** hệ thống hiển thị poll như một tin nhắn đặc biệt, thành viên có thể vote, kết quả cập nhật real-time
