## Purpose

Tối ưu hiệu năng ứng dụng đảm bảo trải nghiệm mượt mà khi xử lý lượng lớn tin nhắn, media, và kết nối đồng thời nhiều instance server.

## ADDED Requirements

### Requirement: Message Pagination
Hệ thống MUST triển khai phân trang tin nhắn thay vì load toàn bộ, hỗ trợ infinite scroll load thêm tin nhắn cũ.

#### Scenario: Load tin nhắn ban đầu
- **WHEN** user mở một cuộc hội thoại
- **THEN** hệ thống chỉ load 30 tin nhắn mới nhất, hiển thị nút/trigger load thêm khi cuộn lên đầu

#### Scenario: Infinite scroll load thêm
- **WHEN** user cuộn lên đầu danh sách tin nhắn hiện tại
- **THEN** hệ thống load thêm 30 tin nhắn cũ hơn (cursor-based pagination), giữ nguyên scroll position

### Requirement: Image Lazy Loading & Thumbnails
Hệ thống MUST lazy-load ảnh trong chat và tạo thumbnail cho ảnh lớn.

#### Scenario: Lazy load ảnh khi cuộn
- **WHEN** tin nhắn chứa ảnh chưa hiển thị trên viewport
- **THEN** hệ thống hiển thị placeholder với kích thước chính xác, chỉ tải ảnh thật khi tin nhắn xuất hiện trong viewport

#### Scenario: Thumbnail cho ảnh lớn
- **WHEN** user gửi ảnh có kích thước > 1MB
- **THEN** hệ thống tạo thumbnail (max 400px width) lưu trên Cloudinary, hiển thị thumbnail trong chat, click vào mở ảnh gốc full-size

### Requirement: Socket.IO Auto-Reconnect
Hệ thống MUST tự động kết nối lại Socket.IO khi mất mạng và đồng bộ dữ liệu bị lỡ.

#### Scenario: Mất kết nối tạm thời
- **WHEN** user mất kết nối internet trong < 5 phút
- **THEN** hệ thống hiển thị banner "Đang kết nối lại...", tự động reconnect khi có mạng, và fetch tin nhắn bị lỡ trong thời gian offline

### Requirement: Redis Pub/Sub Horizontal Scaling
Hệ thống MUST hỗ trợ chạy nhiều backend instances đằng sau load balancer thông qua Redis Pub/Sub adapter.

#### Scenario: Multi-instance deployment
- **WHEN** hệ thống deploy 3 backend instances đằng sau Nginx load balancer
- **THEN** Socket.IO events (tin nhắn, typing, reactions) đồng bộ giữa tất cả instances qua Redis Pub/Sub, user kết nối bất kỳ instance nào đều nhận đầy đủ events
