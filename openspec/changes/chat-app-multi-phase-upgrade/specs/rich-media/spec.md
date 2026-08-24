## Purpose

Hỗ trợ đa phương tiện nâng cao: ghi âm voice message, quay video ngắn, GIF/sticker, link preview, và code blocks trong tin nhắn.

## ADDED Requirements

### Requirement: Voice Message
Hệ thống MUST cho phép user ghi âm và gửi voice message trực tiếp trong chat.

#### Scenario: Ghi và gửi voice message
- **WHEN** user nhấn giữ nút microphone trong chat input
- **THEN** hệ thống bắt đầu ghi âm, hiển thị waveform animation + thời lượng, khi thả nút thì upload audio file và gửi dưới dạng tin nhắn với audio player inline

#### Scenario: Hủy ghi âm
- **WHEN** user kéo ngón tay/chuột ra ngoài vùng nút mic khi đang ghi
- **THEN** hệ thống hủy ghi âm và không gửi tin nhắn

### Requirement: Video Message
Hệ thống MUST cho phép user quay video ngắn (tối đa 60 giây) và gửi trong chat.

#### Scenario: Quay và gửi video message
- **WHEN** user bấm nút quay video trong chat input
- **THEN** hệ thống mở camera preview, cho phép quay tối đa 60 giây, upload video và gửi dưới dạng tin nhắn với video player inline

### Requirement: Sticker & GIF (GIPHY)
Hệ thống MUST tích hợp GIPHY API cho phép tìm kiếm và gửi GIF/sticker.

#### Scenario: Tìm và gửi GIF
- **WHEN** user mở GIF picker và tìm kiếm từ khóa
- **THEN** hệ thống hiển thị kết quả GIF từ GIPHY API, user chọn GIF và gửi dưới dạng tin nhắn hình ảnh động

#### Scenario: GIF trending
- **WHEN** user mở GIF picker mà chưa nhập từ khóa
- **THEN** hệ thống hiển thị danh sách GIF trending từ GIPHY

### Requirement: Link Preview (OG Metadata)
Hệ thống MUST tự động tạo preview cho URL được gửi trong tin nhắn, hiển thị title, description, và thumbnail.

#### Scenario: Preview link website
- **WHEN** user gửi tin nhắn chứa URL (ví dụ: https://example.com/article)
- **THEN** hệ thống fetch OG metadata (title, description, image) từ URL và hiển thị card preview bên dưới tin nhắn

### Requirement: Markdown Code Blocks
Hệ thống MUST hỗ trợ syntax highlighting cho code blocks trong tin nhắn khi user dùng markdown triple backtick.

#### Scenario: Gửi code block
- **WHEN** user gửi tin nhắn chứa ` ```javascript\nconsole.log("hello")\n``` `
- **THEN** hệ thống render code block với syntax highlighting, nút copy code, và label ngôn ngữ

### Requirement: Drag & Drop File Upload
Hệ thống MUST hỗ trợ kéo-thả file từ desktop vào khung chat để upload.

#### Scenario: Kéo thả file
- **WHEN** user kéo file từ desktop vào vùng chat window
- **THEN** hệ thống hiển thị drop zone overlay, preview file trước khi gửi, và upload khi user xác nhận
