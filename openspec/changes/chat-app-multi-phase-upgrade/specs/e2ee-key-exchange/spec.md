## Purpose

Mã hóa End-to-End thực sự sử dụng key exchange protocol, đảm bảo chỉ người gửi và người nhận có thể đọc nội dung tin nhắn — server không thể giải mã.

## ADDED Requirements

### Requirement: Diffie-Hellman Key Exchange
Hệ thống MUST triển khai giao thức trao đổi khóa (ECDH hoặc Signal Protocol) để tạo shared secret key duy nhất cho mỗi cặp user, thay thế passphrase mặc định hiện tại.

#### Scenario: Thiết lập khóa khi bắt đầu hội thoại
- **WHEN** hai người dùng bắt đầu cuộc hội thoại 1-1 lần đầu
- **THEN** hệ thống tự động thực hiện key exchange: mỗi bên tạo cặp public/private key, gửi public key qua server, và derive shared secret key từ ECDH

#### Scenario: Mã hóa tin nhắn với shared key
- **WHEN** người dùng gửi tin nhắn trong cuộc hội thoại đã thiết lập key
- **THEN** client mã hóa tin nhắn bằng AES-256-GCM với shared key trước khi gửi lên server, server chỉ lưu ciphertext

### Requirement: Key Storage
Hệ thống MUST lưu trữ public key trên server và private key chỉ trên client (localStorage hoặc IndexedDB), private key không bao giờ rời khỏi thiết bị.

#### Scenario: Lưu trữ khóa an toàn
- **WHEN** user đăng nhập trên thiết bị mới
- **THEN** hệ thống tạo cặp key mới cho thiết bị đó, public key được đăng ký lên server, và re-negotiate shared keys với tất cả contacts

### Requirement: Key Rotation
Hệ thống MUST hỗ trợ key rotation định kỳ (mỗi 30 ngày hoặc khi user yêu cầu) mà không làm mất khả năng đọc tin nhắn cũ.

#### Scenario: Rotation tự động
- **WHEN** shared key đã được sử dụng quá 30 ngày
- **THEN** hệ thống tự động thực hiện key exchange mới, tin nhắn mới dùng key mới, tin nhắn cũ vẫn giải mã được bằng key cũ được cache local
