## Purpose

Xác thực nâng cao cho phép người dùng đăng nhập bằng nhiều phương thức an toàn (OAuth, 2FA) và quản lý tài khoản chuyên nghiệp (email verify, password reset).

## ADDED Requirements

### Requirement: Đăng nhập OAuth 2.0
Hệ thống MUST hỗ trợ đăng nhập qua Google, GitHub và Facebook thông qua giao thức OAuth 2.0. Khi user chưa có tài khoản, hệ thống tự tạo tài khoản mới từ thông tin OAuth profile.

#### Scenario: Đăng nhập Google lần đầu
- **WHEN** người dùng click "Đăng nhập với Google" và xác thực thành công trên Google
- **THEN** hệ thống tạo tài khoản mới với email và displayName từ Google profile, trả về JWT access token và refresh token

#### Scenario: Đăng nhập Google với tài khoản đã tồn tại
- **WHEN** người dùng đăng nhập Google với email đã đăng ký trước đó (qua form thường)
- **THEN** hệ thống liên kết tài khoản Google vào tài khoản hiện có và đăng nhập thành công

### Requirement: Xác thực hai yếu tố (2FA)
Hệ thống MUST cho phép người dùng bật/tắt xác thực hai yếu tố sử dụng TOTP (Time-based One-Time Password) tương thích Google Authenticator.

#### Scenario: Bật 2FA
- **WHEN** người dùng chọn bật 2FA trong Settings
- **THEN** hệ thống tạo TOTP secret, hiển thị QR code để quét bằng Google Authenticator, và yêu cầu nhập mã xác nhận trước khi kích hoạt

#### Scenario: Đăng nhập với 2FA đã bật
- **WHEN** người dùng nhập đúng username/password và tài khoản có 2FA
- **THEN** hệ thống yêu cầu nhập mã TOTP 6 số, chỉ cấp token khi mã hợp lệ

### Requirement: Xác minh Email
Hệ thống MUST gửi email xác minh khi đăng ký tài khoản mới. Tài khoản chưa xác minh bị giới hạn tính năng.

#### Scenario: Đăng ký tài khoản mới
- **WHEN** người dùng hoàn thành form đăng ký
- **THEN** hệ thống tạo tài khoản với trạng thái `emailVerified: false` và gửi email chứa link xác minh (hết hạn sau 24 giờ)

#### Scenario: Xác minh email thành công
- **WHEN** người dùng click link xác minh trong email và token còn hạn
- **THEN** hệ thống cập nhật `emailVerified: true` và mở khóa toàn bộ tính năng

### Requirement: Quên mật khẩu
Hệ thống MUST cho phép reset mật khẩu qua email khi người dùng quên.

#### Scenario: Yêu cầu reset mật khẩu
- **WHEN** người dùng nhập email đã đăng ký vào form "Quên mật khẩu"
- **THEN** hệ thống gửi email chứa link reset (hết hạn sau 1 giờ), không tiết lộ email có tồn tại hay không (bảo mật)

#### Scenario: Đặt mật khẩu mới
- **WHEN** người dùng click link reset hợp lệ và nhập mật khẩu mới
- **THEN** hệ thống cập nhật password hash, vô hiệu hóa tất cả session cũ và yêu cầu đăng nhập lại

### Requirement: Rate limiting đăng nhập
Hệ thống MUST giới hạn số lần đăng nhập thất bại để chống brute-force.

#### Scenario: Vượt quá giới hạn đăng nhập
- **WHEN** một IP hoặc tài khoản có quá 5 lần đăng nhập thất bại trong 15 phút
- **THEN** hệ thống khóa tạm thời 15 phút và trả về HTTP 429 với thông báo thời gian chờ
