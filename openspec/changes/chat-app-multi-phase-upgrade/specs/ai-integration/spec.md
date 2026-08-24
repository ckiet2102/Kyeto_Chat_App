## Purpose

Tích hợp AI vào ứng dụng chat: chatbot trợ lý, gợi ý trả lời thông minh, dịch tự động, kiểm duyệt nội dung, và tóm tắt đoạn chat.

## ADDED Requirements

### Requirement: AI Chatbot
Hệ thống MUST tích hợp AI chatbot (GPT/Gemini) làm trợ lý trong chat, user có thể gọi bot trong bất kỳ cuộc hội thoại nào.

#### Scenario: Gọi AI chatbot
- **WHEN** user gõ `@ai` hoặc `@bot` theo sau bằng câu hỏi trong bất kỳ cuộc hội thoại nào
- **THEN** hệ thống gửi prompt đến AI API, nhận response và hiển thị dưới dạng tin nhắn từ bot avatar (chỉ hiển thị cho user gọi, hoặc cho tất cả nếu trong group tùy setting)

### Requirement: Smart Reply
Hệ thống MUST gợi ý 2-3 câu trả lời nhanh dựa trên ngữ cảnh tin nhắn vừa nhận.

#### Scenario: Hiển thị gợi ý trả lời
- **WHEN** user nhận tin nhắn mới và chưa gõ gì
- **THEN** hệ thống hiển thị 2-3 chip gợi ý bên trên ô input (ví dụ: "OK 👍", "Để tôi xem lại", "Cảm ơn bạn"), user bấm chip để gửi ngay

### Requirement: Auto Translation
Hệ thống MUST cho phép dịch tin nhắn sang ngôn ngữ khác inline.

#### Scenario: Dịch tin nhắn
- **WHEN** user bấm nút "Dịch" trên tin nhắn bằng ngôn ngữ khác
- **THEN** hệ thống gọi AI translation API và hiển thị bản dịch ngay dưới tin nhắn gốc, không thay thế nội dung gốc

### Requirement: Content Moderation
Hệ thống MUST tự động phát hiện và cảnh báo nội dung vi phạm (spam, ngôn ngữ thù ghét, nội dung bạo lực).

#### Scenario: Phát hiện nội dung vi phạm
- **WHEN** user gửi tin nhắn chứa nội dung vi phạm
- **THEN** hệ thống đánh dấu tin nhắn với warning label, admin nhóm nhận thông báo, tin nhắn có thể bị ẩn tùy mức độ nghiêm trọng

### Requirement: Chat Summarization
Hệ thống MUST cho phép tóm tắt đoạn chat dài bằng AI.

#### Scenario: Tóm tắt cuộc hội thoại
- **WHEN** user bấm "Tóm tắt" trên một cuộc hội thoại có > 50 tin nhắn chưa đọc
- **THEN** hệ thống gửi batch tin nhắn đến AI API, nhận tóm tắt ngắn gọn và hiển thị dưới dạng card đặc biệt ở đầu chat
