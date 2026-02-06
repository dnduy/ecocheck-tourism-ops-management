# UI REGRESSION CHECKLIST - EcoCheck Tourism Ops

Muc tieu: danh gia nhanh cac luong UI quan trong sau khi sua code hoac deploy.

## Quick checklist (10-15 phut)
- [ ] Backend va frontend dang chay
- [ ] Dang nhap admin thanh cong
- [ ] Dashboard load ok (khong loi console)
- [ ] Tao 1 area moi
- [ ] Tao 1 template moi (co group + item + column)
- [ ] Tao 1 run theo area + template
- [ ] Vao run detail, nhap 1 entry va reload khong mat
- [ ] Start -> Complete -> Request review thanh cong
- [ ] Supervisor/Manager approve thanh cong
- [ ] Logout thanh cong

## 1. Dieu kien truoc khi test
- Backend dang chay: `http://127.0.0.1:8000`
- Frontend dang chay: `http://localhost:3001`
- Tai khoan admin: `admin@local.test` / `ChangeMe123!`
- Co it nhat 1 area, 1 template co items + columns

## 2. Dang nhap va dieu huong
- [ ] Dang nhap bang admin thanh cong
- [ ] Header/Sidebar hien thi dung menu
- [ ] Refresh trang van giu session (token)
- [ ] Dang xuat thanh cong va quay lai login

## 3. Dashboard
- [ ] Load dashboard khong loi
- [ ] So lieu thong ke hien thi (neu co API)
- [ ] Chart render dung va khong loi console

## 4. Areas (Admin)
- [ ] Mo trang Areas/Quan ly khu vuc
- [ ] Tao area moi thanh cong
- [ ] Update ten area thanh cong
- [ ] Xoa area thanh cong (neu co)

## 5. Templates (Admin)
- [ ] List template theo area thanh cong
- [ ] Tao template moi (co group + item) thanh cong
- [ ] Tao columns (sessions/roles) thanh cong
- [ ] Xem template chi tiet khong loi
- [ ] Import template (neu co file mau) thanh cong
- [ ] Xoa template khong co run thanh cong

## 6. Runs / Checklists
- [ ] Tao run moi theo area + template
- [ ] Run hien thi dung ngay (run_date)
- [ ] Tab trang thai hien thi dung theo work_status
- [ ] Run moi co status pending
- [ ] Start work -> status in_progress
- [ ] Complete -> status completed
- [ ] Request review -> status needs_review

## 7. Execution (Checklist detail)
- [ ] Load checklist detail khong loi
- [ ] Hien thi day du groups/items/columns
- [ ] Cap nhat entry 1 o va tu dong luu
- [ ] Reload trang van giu entry
- [ ] Nhap nhieu entries o nhieu columns

## 8. Review flow
- [ ] Supervisor/Manager co the xem danh sach can duyet
- [ ] Approve khi needs_review thanh cong
- [ ] Reject tao ghi chu va status rejected
- [ ] Resubmit tu staff -> status needs_review
- [ ] Manager approve khong can verified_by (neu dung rule)

## 9. Incidents
- [ ] List incidents thanh cong
- [ ] Tao incident moi thanh cong
- [ ] Update incident thanh cong
- [ ] Xoa incident thanh cong (neu co)

## 10. Export
- [ ] Export run ra file Excel thanh cong
- [ ] File co day du items/entries

## 11. UI/UX co ban
- [ ] Loading/empty states hien thi hop ly
- [ ] Form validation thong bao ro rang
- [ ] Khong co loi console nghi trong
- [ ] Responsive o man hinh nho khong bi vo

## 12. Kiem tra phan quyen
- [ ] Staff khong thay hanh dong admin
- [ ] Staff khong approve duoc
- [ ] Supervisor chi approve run duoc gan verify

## 13. Ket thuc
- [ ] Tong hop ket qua Pass/Fail
- [ ] Ghi chu loi neu co (man hinh, buoc, log)
