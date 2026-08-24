## Purpose

Hạ tầng DevOps chuyên nghiệp: containerization, CI/CD tự động, testing, monitoring, logging, và database backup.

## ADDED Requirements

### Requirement: Docker Compose
Hệ thống MUST cung cấp Docker Compose configuration để containerize toàn bộ stack (backend, frontend, MongoDB, Redis).

#### Scenario: Khởi chạy bằng Docker
- **WHEN** developer chạy `docker-compose up`
- **THEN** hệ thống khởi động tất cả services (backend, frontend, mongodb, redis) trong containers riêng biệt, kết nối qua Docker network, sẵn sàng phục vụ traffic

### Requirement: CI/CD Pipeline
Hệ thống MUST có GitHub Actions pipeline tự động test và deploy khi push code.

#### Scenario: Push code trigger pipeline
- **WHEN** developer push code lên branch `main`
- **THEN** GitHub Actions tự động chạy lint, unit tests, build production bundle, và deploy lên server (staging hoặc production)

#### Scenario: Pull request checks
- **WHEN** developer tạo pull request
- **THEN** pipeline chạy tests + lint, block merge nếu có lỗi, hiển thị status check trên PR

### Requirement: Unit & Integration Tests
Hệ thống MUST có test coverage cho backend API endpoints và frontend components.

#### Scenario: Backend API tests
- **WHEN** developer chạy `npm test` trong backend
- **THEN** Jest chạy unit tests cho controllers, middleware, và integration tests cho API endpoints sử dụng MongoDB memory server

#### Scenario: Frontend component tests
- **WHEN** developer chạy `npm test` trong frontend
- **THEN** React Testing Library + Vitest chạy tests cho các components chính (MessageItem, ChatInput, AuthForm)

### Requirement: Monitoring & Logging
Hệ thống MUST tích hợp monitoring (Grafana + Prometheus) và structured logging (Winston).

#### Scenario: Dashboard monitoring
- **WHEN** admin truy cập Grafana dashboard
- **THEN** hiển thị metrics: CPU/Memory usage, active Socket.IO connections, API response times, error rates, message throughput

#### Scenario: Structured logging
- **WHEN** hệ thống xử lý request hoặc gặp lỗi
- **THEN** Winston logger ghi log JSON format với request ID, timestamp, level, context — có thể stream vào ELK Stack

### Requirement: Database Backup
Hệ thống MUST tự động backup MongoDB database định kỳ.

#### Scenario: Scheduled backup
- **WHEN** cron job chạy mỗi ngày lúc 2:00 AM
- **THEN** hệ thống chạy `mongodump`, compress backup, upload lên cloud storage (S3/GCS), giữ lại 30 bản backup gần nhất
