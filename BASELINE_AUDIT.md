# BASELINE AUDIT - 03/02/2026

## Mục tiêu
- Chụp nhanh hiện trạng hệ thống để làm mốc so sánh cho các lần cải tiến tiếp theo.
- Nêu rõ luồng nghiệp vụ cốt lõi, chuẩn dữ liệu quan trọng, và rủi ro cần theo dõi.
- Đưa ra kế hoạch hoàn thiện theo các mốc ưu tiên.

## Kiến trúc và thành phần
- Frontend: React 19 + Vite, chạy dev mặc định tại `http://localhost:3001`, cấu hình API qua `VITE_API_URL`.
- Backend: Laravel 12 + Sanctum, chạy dev tại `http://127.0.0.1:8000`, DB mặc định SQLite.
- CSDL chính: users, roles, areas, checklist_templates, template_groups, template_items, template_columns, checklist_runs, checklist_entries, run_signoffs, incidents.

## Luồng nghiệp vụ checklist (tóm tắt)
1. Tạo run: Admin chọn khu vực + template, gọi `POST /api/runs`, hệ thống tạo `work_status=pending` và `status=open`.
2. Thực thi: Nhân viên bắt đầu bằng `POST /api/review/runs/{id}/start` để chuyển `in_progress`.
3. Hoàn thành: `POST /api/review/runs/{id}/complete` để chuyển `completed`.
4. Yêu cầu duyệt: `POST /api/review/runs/{id}/request-review` để chuyển `needs_review`.
5. Duyệt hoặc từ chối: `POST /api/review/runs/{id}/approve` hoặc `reject` để chuyển `approved` hoặc `rejected`.

## Chuẩn hóa trạng thái
- `work_status` là nguồn dữ liệu chính cho workflow.
- `status` chỉ giữ vai trò legacy `open/done` để tương thích.
- Quy ước mapping: `pending`, `in_progress`, `rejected` -> `open`; `completed`, `needs_review`, `approved` -> `done`.
- UI và thống kê cần dùng `work_status` để lọc và đếm.

## Ghi chú dữ liệu quan trọng
- `checklist_runs` dùng `run_date` làm ngày chuẩn; UI nên hiển thị theo `run_date`.
- `checklist_templates` đã có `description` và `version`.
- `template_items.content` là nội dung hiển thị (UI map sang `title`).
- `template_columns` lấy nhãn hiển thị từ `template_sessions.time_hhmm` và `template_roles.name`.

## API map rút gọn
- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/me`
- Areas: `/api/areas`
- Templates: `/api/templates`, `/api/templates/import`, `/api/areas/{areaId}/template`
- Runs: `/api/runs`, `/api/runs/{id}`, `/api/runs/{id}/export`
- Entries: `/api/entries`
- Signoffs: `/api/signoffs`
- Incidents: `/api/incidents`
- Review workflow: `/api/review/*`
- Admin stats: `/api/admin/*`

## Trạng thái kiểm thử hiện tại
- Backend: `php artisan test` chạy ổn.
- Frontend: `npm test` chạy ổn.
- Smoke test: `npm run test:smoke` (cần backend đang chạy và có dữ liệu mẫu).

## Rủi ro và điểm cần theo dõi
- Có 2 luồng templates (Domain controllers và Api controllers) cần thống nhất về lâu dài.
- Cấu trúc item/column có mapping riêng; cần giữ đồng bộ giữa DB và UI.
- Checklist workflow phụ thuộc `work_status`; tránh dùng `status` cho logic mới.

## Kế hoạch hoàn thiện theo 3 mốc
1. Nền tảng chất lượng: tài liệu baseline, CI, smoke test, seed dữ liệu tối thiểu.
2. Tăng độ tin cậy: E2E mở rộng, kiểm thử theo vai trò, đo coverage.
3. Vận hành sản xuất: runbook, monitoring, backup, cảnh báo, checklist xử lý sự cố.
