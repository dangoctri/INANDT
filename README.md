# INANDT — Nền tảng Web Quản lý Xưởng in & Kế toán Hộ kinh doanh

Hệ thống quản lý toàn diện cho xưởng in và hộ kinh doanh doanh thu dưới 1 tỷ đồng/năm (theo **Thông tư 152/2025/TT-BTC**), được xây dựng theo đặc tả tại [nen-tang-quan-ly-xuong-in-va-ke-toan.md](./nen-tang-quan-ly-xuong-in-va-ke-toan.md).

## Các phân hệ đã triển khai

1. **Tổng quan & Báo cáo quản trị (Mục 11 & 14.3)**:
   - Theo dõi doanh thu, lợi nhuận gộp, lợi nhuận ròng, công nợ phải thu & công nợ phải trả xưởng ngoài.
   - Thanh giám sát ngưỡng doanh thu hộ kinh doanh `< 1 tỷ đồng/năm` (hạn kê khai `31/01` hàng năm).
   - Bảng phân tích lợi nhuận theo từng đơn hàng (`Doanh thu - Giá vốn NVL - Gia công ngoài - Chi phí nội bộ - Vận chuyển - Chiết khấu`).
2. **Báo giá tự động & Đơn hàng (Mục 3)**:
   - Bộ máy tính giá bán tự động theo khổ in, định lượng giấy, số trang, số màu, công đoạn gia công nội bộ/ngoài, hao hụt và biên lợi nhuận.
   - Chuyển đổi trực tiếp từ Báo giá sang Đơn hàng & tự động khởi tạo Lệnh sản xuất.
3. **Quản lý Sản xuất & Bảng Kanban 10 công đoạn (Mục 4)**:
   - Điều phối tiến độ lệnh sản xuất qua 10 bước: `Chờ duyệt file` → `Đang thiết kế` → `Chờ duyệt khách` → `Chuẩn bị in` → `Đang in` → `Hậu kỳ` → `QC` → `Chờ giao` → `Hoàn thành` / `Hủy`.
4. **Quản lý Xưởng in ngoài, Phiếu gửi gia công & QC (Mục 7, 13, 14, 15)**:
   - Hồ sơ năng lực, bảng giá quy cách và đánh giá hiệu suất xưởng đối tác (`Xưởng A`, `Xưởng B`, `Xưởng C`, `Xưởng D`).
   - Tạo phiếu gửi gia công từ lệnh sản xuất, theo dõi 13 trạng thái tiến độ.
   - Nghiệm thu QC khi nhận hàng về, ghi nhận số lượng lỗi, yêu cầu làm lại và tự động hạch toán khấu trừ công nợ xưởng ngoài.
5. **Quản lý Kho Giấy, Mực, Vật tư & Bán thành phẩm (Mục 5 & 6)**:
   - Theo dõi tồn kho thực tế, cảnh báo dưới định mức tối thiểu, lập phiếu Nhập/Xuất kho.
6. **Kế toán Hộ kinh doanh (7 Sổ kế toán TT152) & Hóa đơn điện tử (Mục 8 & 9)**:
   - Quản lý Phiếu thu, Phiếu chi, Bút toán giảm công nợ và lọc trực tiếp theo 7 sổ kế toán bắt buộc.
   - Phát hành và đối chiếu Hóa đơn điện tử với doanh thu.
7. **Nhân sự, Lương & Phân quyền 8 Vai trò (Mục 10 & 12.3)**:
   - Bảng chấm công, lương, năng suất đơn hàng và ma trận phân quyền 8 vai trò trong xưởng in.

## Công nghệ sử dụng

- **Frontend & Backend**: Next.js 15 (App Router, Fullstack TypeScript) + React 19 + Tailwind CSS
- **Cơ sở dữ liệu**: SQLite tích hợp gốc của Node.js (`node:sqlite` -> `data/inandt.sqlite`)

## Hướng dẫn chạy dự án

```bash
# Chạy môi trường phát triển (Development)
npm.cmd run dev

# Kiểm tra kiểu dữ liệu TypeScript (Typecheck)
npm.cmd run lint

# Build bản Production
npm.cmd run build

# Chạy kiểm thử tự động (Unit & Database Integration Tests)
npm.cmd test
```
