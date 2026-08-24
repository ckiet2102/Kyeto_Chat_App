## Purpose

Hệ thống thương mại hóa: gói Premium với tính năng nâng cao, Admin dashboard analytics, và API rate limiting theo tier.

## ADDED Requirements

### Requirement: Premium Plan
Hệ thống MUST cung cấp gói Premium với các tính năng nâng cao so với gói Free.

#### Scenario: Nâng cấp Premium
- **WHEN** user chọn nâng cấp lên Premium
- **THEN** hệ thống kích hoạt: lưu trữ Cloud không giới hạn (free: 500MB), file upload tối đa 100MB (free: 10MB), custom theme creation, priority support badge, và không hiển thị quảng cáo

#### Scenario: Hết hạn Premium
- **WHEN** gói Premium hết hạn mà user không gia hạn
- **THEN** hệ thống chuyển về gói Free, giới hạn lưu trữ mới nhưng không xóa file đã upload, tính năng Premium bị vô hiệu hóa

### Requirement: Admin Dashboard
Hệ thống MUST cung cấp dashboard quản trị cho system admin với analytics và quản lý user.

#### Scenario: Xem thống kê hệ thống
- **WHEN** system admin truy cập Admin Dashboard
- **THEN** hiển thị: tổng users, daily/monthly active users, tổng tin nhắn, tổng cuộc gọi, storage usage, growth charts

#### Scenario: Quản lý user
- **WHEN** system admin tìm kiếm user trong dashboard
- **THEN** hiển thị profile chi tiết, lịch sử hoạt động, cho phép: suspend/ban account, reset password, upgrade/downgrade plan

### Requirement: API Rate Limiting Tiered
Hệ thống MUST áp dụng rate limiting khác nhau theo plan (Free vs Premium).

#### Scenario: Rate limit cho Free user
- **WHEN** Free user gửi quá 60 API requests/phút
- **THEN** hệ thống trả HTTP 429, header `Retry-After` cho biết thời gian chờ

#### Scenario: Rate limit cho Premium user
- **WHEN** Premium user gửi API requests
- **THEN** hệ thống áp dụng limit cao hơn (300 requests/phút), không giới hạn file upload requests

### Requirement: Custom Branding
Hệ thống MUST cho phép tổ chức/doanh nghiệp tùy chỉnh branding (logo, tên ứng dụng, màu chủ đạo) khi dùng gói Enterprise.

#### Scenario: Tùy chỉnh branding
- **WHEN** Enterprise admin upload logo và chọn màu chủ đạo trong Settings
- **THEN** tất cả user trong organization thấy logo custom trên navigation rail, tên app custom trên browser title, và màu chủ đạo thay cho Luxury Gold mặc định
