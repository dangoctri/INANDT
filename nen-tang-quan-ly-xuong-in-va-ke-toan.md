# Nền tảng web quản lý xưởng in và kế toán hộ kinh doanh

## 1. Mục tiêu sản phẩm

Xây dựng nền tảng web quản lý toàn diện cho xưởng in, bao gồm:

- Quản lý khách hàng, báo giá, đơn hàng và thanh toán.
- Quản lý thiết kế, sản xuất, in ấn, hậu kỳ và giao hàng.
- Quản lý kho nguyên vật liệu, mực, giấy, thành phẩm và bán thành phẩm.
- Quản lý xưởng in ngoài và dịch vụ gia công.
- Quản lý nhân sự, chấm công, lương và năng suất.
- Quản lý kế toán cho hộ kinh doanh doanh thu dưới 1 tỷ đồng/năm.
- Quản lý hóa đơn điện tử, thu chi, công nợ, sổ sách và kê khai thuế.
- Báo cáo lợi nhuận theo đơn hàng, khách hàng, sản phẩm và xưởng gia công.

Hệ thống mô phỏng các chức năng cốt lõi của MISA eShop: bán hàng, thu chi, kho, hóa đơn, sổ kế toán và kê khai thuế. Với hộ kinh doanh doanh thu dưới 1 tỷ đồng/năm, trọng tâm là đơn giản, minh bạch dòng tiền và tạo bộ chứng từ/sổ sách theo Thông tư 152/2025/TT-BTC.

## 2. Tổng quan chức năng

| Nhóm | Chức năng chính |
|---|---|
| Bán hàng | Báo giá, đơn hàng, hợp đồng, thanh toán, hóa đơn, xuất kho |
| Sản xuất in | Đơn sản xuất, phân công, quy trình, chất lượng, tiến độ |
| Kho | Nguyên vật liệu, mực, giấy, bản in, thành phẩm, xuất nhập tồn |
| Mua hàng | Nhà cung cấp, yêu cầu mua, đơn mua, nhập kho, công nợ |
| Xưởng in ngoài | Hồ sơ xưởng, phiếu gửi gia công, tiến độ, QC, chi phí, công nợ |
| Kế toán | Thu chi, công nợ, chi phí, doanh thu, lợi nhuận, sổ sách |
| Hóa đơn và thuế | Hóa đơn điện tử, đối chiếu hóa đơn, kê khai thuế |
| Quản trị | Nhân sự, phân quyền, báo cáo, cảnh báo, tích hợp |

## 3. Quản lý báo giá và đơn hàng

### 3.1. Báo giá

- Tạo báo giá nhanh cho khách hàng.
- Chọn sản phẩm: catalogue, name card, sticker, hộp giấy, túi giấy, poster, banner, decal, lịch, sổ tay.
- Nhập thông số in: khổ thành phẩm, khổ giấy in, số lượng, số màu, số mặt in, loại giấy, định lượng giấy.
- Chọn dịch vụ gia công: cán màng, ép kim, UV, bế, xẻ rãnh, đóng gáy, ép nhựa, đóng hộp.
- Tính giá tự động theo công thức giá thành.
- Gửi báo giá qua PDF, Zalo, email hoặc link web.
- Lưu lịch sử chỉnh sửa báo giá.
- Chuyển báo giá thành đơn hàng khi khách đồng ý.

### 3.2. Đơn hàng

- Quản lý trạng thái đơn: chờ duyệt, đã duyệt, đang sản xuất, hoàn thành, giao hàng, hủy.
- Ghi nhận đặt cọc, thanh toán từng phần và công nợ khách hàng.
- Gắn file thiết kế, bản duyệt khách, mẫu in và yêu cầu đặc biệt.
- In phiếu giao hàng, phiếu thu, biên bản bàn giao và hóa đơn.
- Theo dõi tiến độ thanh toán và ngày hẹn giao.

### 3.3. Công thức tính giá

Ví dụ công thức giá bán:

```text
Giá bán =
Giá nguyên vật liệu
+ Chi phí in
+ Chi phí gia công nội bộ
+ Chi phí gia công ngoài
+ Chi phí thiết kế
+ Chi phí vận chuyển
+ Chi phí hao hụt
+ Lợi nhuận mong muốn
```

## 4. Quản lý sản xuất xưởng in

### 4.1. Lệnh sản xuất

Khi đơn hàng được duyệt, hệ thống tạo một lệnh sản xuất gồm:

- Mã lệnh sản xuất.
- Mã đơn hàng và thông tin khách hàng.
- Tên sản phẩm, số lượng, quy cách kỹ thuật.
- File thiết kế, bản duyệt khách, mẫu in.
- Người phụ trách từng công đoạn.
- Ngày bắt đầu, ngày dự kiến hoàn thành, deadline giao hàng.
- Trạng thái tiến độ.
- Chi phí nguyên vật liệu, nhân công, máy móc và gia công ngoài.

### 4.2. Quy trình sản xuất

Một lệnh sản xuất có thể đi qua các bước:

1. Nhận file và kiểm tra kỹ thuật.
2. Thiết kế hoặc chỉnh sửa.
3. Duyệt khách.
4. Xuất film, CTP hoặc chuẩn bị file in.
5. In thử.
6. In hàng loạt.
7. Cán màng, ép kim, UV, bế, đóng gáy, đóng hộp.
8. Kiểm tra chất lượng.
9. Đóng gói và xuất kho.
10. Giao hàng và thu tiền.

### 4.3. Bảng kanban sản xuất

Hệ thống cần có bảng kanban với các cột:

- Chờ duyệt file.
- Đang thiết kế.
- Chờ duyệt khách.
- Chuẩn bị in.
- Đang in.
- Hậu kỳ.
- QC.
- Chờ giao.
- Hoàn thành.
- Hủy.

### 4.4. Kiểm soát chất lượng

- Ghi nhận lỗi: sai màu, lệch màu, lem mực, sai khổ, hỏng giấy, thiếu số lượng.
- Tính tỷ lệ hao hụt giấy và mực.
- Lưu ảnh sản phẩm lỗi, người thực hiện, nguyên nhân và biện pháp khắc phục.
- Báo cáo tỷ lệ lỗi theo máy, nhân viên, khách hàng hoặc loại sản phẩm.

## 5. Quản lý kho xưởng in

### 5.1. Nhóm hàng quản lý

| Nhóm hàng | Ví dụ |
|---|---|
| Giấy | Couche 250g, C300, Kraft, Art paper, giấy mỹ thuật |
| Mực | Mực CMYK, mực UV, mực Flexo, mực in lụa |
| Vật tư | Dao cắt, keo, decal, màng, băng keo |
| Thành phẩm | Catalogue, name card, sticker, hộp giấy, túi giấy |
| Bán thành phẩm | Tờ in chưa bế, hộp chưa dán, album chưa đóng |

### 5.2. Chức năng kho

- Nhập kho nguyên vật liệu theo lô, nhà cung cấp và đơn giá.
- Xuất kho theo lệnh sản xuất.
- Theo dõi tồn kho thực tế và tồn kho tối thiểu.
- Cảnh báo hết giấy, mực, vật tư.
- Kiểm kê định kỳ và điều chỉnh chênh lệch.
- Tính giá vốn theo FIFO hoặc giá bình quân gia quyền.
- Quản lý xuất kho gửi gia công ngoài và nhập kho khi nhận hàng về.

## 6. Quản lý mua hàng và nhà cung cấp

- Quản lý nhà cung cấp giấy, mực, màng, decal và dịch vụ gia công ngoài.
- Tạo yêu cầu mua hàng khi tồn kho dưới mức tối thiểu.
- Tạo đơn mua hàng và so sánh báo giá nhà cung cấp.
- Nhập kho khi nhận hàng.
- Ghi nhận công nợ phải trả nhà cung cấp.
- Theo dõi hạn thanh toán và lịch sử mua hàng.
- Quản lý chi phí gia công ngoài: ép kim, bế, đóng sách, đóng gói.

## 7. Quản lý xưởng in ngoài

Đây là mô-đun quan trọng để quản lý các sản phẩm gửi đi in hoặc gia công tại xưởng đối tác.

### 7.1. Hồ sơ xưởng đối tác

Mỗi xưởng in ngoài cần có hồ sơ riêng, bao gồm:

- Tên xưởng, mã đối tác, địa chỉ, người phụ trách, số điện thoại, Zalo, email.
- Loại dịch vụ: in offset, in digital, in lụa, in UV, cán màng, ép kim, bế, đóng gáy, đóng hộp, dán túi, gia công decal.
- Máy móc, công suất, khổ in tối đa, loại giấy và mực hỗ trợ.
- Giá dịch vụ theo quy cách: giá mỗi mặt A4, mỗi tờ, mỗi cuốn, mỗi màu, mỗi kg giấy, mỗi lần bế.
- Thời gian giao hàng tiêu chuẩn và phụ phí gấp.
- Điều khoản chất lượng, tỷ lệ lỗi chấp nhận và chính sách bồi thường.
- Hạn thanh toán, công nợ và lịch sử giao dịch.
- Tài liệu: hợp đồng, báo giá, bảng giá, chứng từ, mẫu in, hình ảnh sản phẩm.

Trạng thái xưởng:

- Đề xuất.
- Đang đánh giá.
- Đã duyệt.
- Tạm ngừng hợp tác.
- Ngừng hợp tác.

### 7.2. Liên kết sản phẩm với xưởng

Một sản phẩm hoặc một hạng mục trong đơn hàng cần được liên kết trực tiếp tới xưởng gia công.

Ví dụ: đơn “Catalogue 500 cuốn” có thể gồm:

| Hạng mục | Xưởng thực hiện | Loại dịch vụ |
|---|---|---|
| In nội dung | Xưởng A | In offset 4 màu |
| Cán màng | Xưởng B | Cán màng bóng |
| Ép kim logo | Xưởng C | Ép kim |
| Đóng gáy | Xưởng D | Đóng sách |
| Đóng gói | Nội bộ | Đóng gói |

Một đơn hàng có thể có nhiều phiếu gia công ngoài. Mỗi phiếu gắn với một xưởng, một công đoạn và một mức chi phí riêng.

### 7.3. Quy trình gia công ngoài

1. Tạo nhu cầu gia công từ lệnh sản xuất.
2. Chọn xưởng phù hợp theo giá, năng lực, chất lượng và deadline.
3. Tạo phiếu gửi gia công.
4. Chuẩn bị nguyên vật liệu, file in và mẫu đối chứng.
5. Giao hàng cho xưởng ngoài.
6. Xưởng ngoài xác nhận đã nhận hàng.
7. Xưởng ngoài cập nhật tiến độ gia công.
8. Xưởng ngoài gửi hàng về.
9. Kho hoặc QC kiểm tra số lượng và chất lượng.
10. Nếu đạt, nhập kho thành phẩm hoặc chuyển sang công đoạn tiếp theo.
11. Nếu lỗi, tạo yêu cầu làm lại hoặc trừ công nợ xưởng ngoài.
12. Kế toán ghi nhận chi phí, công nợ và thanh toán.

### 7.4. Phiếu gửi gia công

Phiếu gửi gia công cần chứa:

- Mã phiếu, mã đơn hàng, mã lệnh sản xuất.
- Khách hàng và sản phẩm.
- Xưởng nhận gia công.
- Công đoạn yêu cầu.
- Số lượng gửi đi, số lượng dự kiến hoàn thành, tỷ lệ hao hụt cho phép.
- Quy cách kỹ thuật: file in, màu, khổ giấy, cán màng, ép kim, bế, đóng gáy.
- Ngày gửi, deadline, người giao, phương tiện vận chuyển.
- Giá gia công, đặt cọc, điều khoản thanh toán.
- Hình ảnh, file đính kèm và ghi chú đặc biệt.

### 7.5. Trạng thái phiếu gia công

- Chờ duyệt.
- Đã duyệt.
- Đang chuẩn bị nguyên vật liệu.
- Đã giao xưởng ngoài.
- Xưởng đã nhận.
- Đang gia công.
- Chờ QC.
- QC đạt.
- QC lỗi, cần làm lại.
- Đã nhận hàng về.
- Đã nhập kho.
- Hoàn tất.
- Hủy.

### 7.6. Kiểm tra khi nhận về

Khi nhận hàng từ xưởng ngoài, nhân viên kho hoặc QC cần:

- Đối chiếu số lượng gửi đi, số lượng nhận về và số lượng hỏng.
- Kiểm tra màu sắc, khổ, độ sắc nét, lỗi in, lỗi cắt, lỗi cán màng.
- Chụp ảnh sản phẩm và lưu bằng chứng lỗi.
- Ghi nhận nguyên nhân: lỗi xưởng ngoài, lỗi file, lỗi nguyên vật liệu, lỗi vận chuyển.
- Quyết định: chấp nhận, yêu cầu làm lại, trừ tiền hoặc hủy phiếu.
- Cập nhật tồn kho thành phẩm hoặc bán thành phẩm.

### 7.7. Tính chi phí gia công

Mỗi phiếu gia công nên có:

- Giá theo số lượng.
- Giá theo số màu, số mặt in hoặc số công đoạn.
- Phí làm bản in, phí khuôn, phí setup.
- Phí gấp.
- Phí vận chuyển đi và về.
- Phí hủy, phí làm lại.
- Chi phí nguyên vật liệu gửi cho xưởng.
- Chi phí hao hụt.

### 7.8. Công thức lợi nhuận

```text
Lợi nhuận =
Doanh thu
- Giá vốn
- Chi phí gia công ngoài
- Chi phí nội bộ
- Chi phí vận chuyển
- Chiết khấu
```

Hệ thống cần hiển thị:

- Giá bán cho khách.
- Tổng chi phí gia công ngoài.
- Chi phí nguyên vật liệu.
- Chi phí nhân công nội bộ.
- Lợi nhuận gộp.
- Lợi nhuận ròng.
- Xưởng nào đang chiếm tỷ trọng chi phí cao nhất.

### 7.9. Xử lý làm lại

Khi xưởng ngoài làm lỗi:

- Ghi nhận số lượng lỗi và mức độ lỗi.
- Tạo yêu cầu làm lại gắn với phiếu gia công gốc.
- Xác định bên chịu chi phí: xưởng ngoài, khách hàng hoặc xưởng in chính.
- Tính chi phí làm lại riêng, không trộn vào giá vốn ban đầu nếu muốn phân tích minh bạch.
- Ghi nhận số tiền trừ vào công nợ xưởng ngoài.
- Lưu lịch sử để đánh giá xưởng theo thời gian.

### 7.10. Đánh giá xưởng ngoài

| Tiêu chí | Cách tính |
|---|---|
| Đúng hạn | Số phiếu giao đúng hạn / tổng số phiếu |
| Tỷ lệ lỗi | Số sản phẩm lỗi / tổng sản phẩm nhận về |
| Tỷ lệ làm lại | Số phiếu làm lại / tổng phiếu gia công |
| Giá cạnh tranh | So sánh giá với các xưởng cùng dịch vụ |
| Tốc độ phản hồi | Thời gian xác nhận báo giá và nhận hàng |
| Mức độ hài lòng | Đánh giá từ QC, sale, quản đốc |

### 7.11. Kế toán và công nợ xưởng ngoài

Khi phiếu gia công hoàn thành, hệ thống tạo:

- Công nợ phải trả xưởng ngoài.
- Chi phí gia công gắn với đơn hàng và lệnh sản xuất.
- Phiếu chi khi thanh toán cho xưởng.
- Phiếu điều chỉnh khi có làm lại, giảm giá hoặc bồi thường.
- Bút toán chi phí vào giá vốn đơn hàng.

Trạng thái thanh toán:

- Chưa thanh toán.
- Đã đặt cọc.
- Thanh toán một phần.
- Đã thanh toán đủ.
- Chờ đối chiếu.
- Có tranh chấp.
- Đã ghi giảm công nợ.

### 7.12. Báo cáo gia công ngoài

- Tổng tiền phải trả từng xưởng.
- Tiền đã trả và tiền còn nợ.
- Phiếu gia công chưa có hóa đơn hoặc chứng từ.
- Chi phí phát sinh ngoài báo giá.
- Chi phí làm lại và bồi thường.
- Đối chiếu số lượng gửi đi, nhận về và thanh toán.
- Xếp hạng xưởng theo chất lượng, giá và tiến độ.

## 8. Kế toán hộ kinh doanh

### 8.1. Chứng từ kế toán

Hệ thống cần tự sinh các chứng từ:

- Phiếu thu tiền từ khách hàng.
- Phiếu chi trả nhà cung cấp, nhân viên, chi phí xưởng.
- Phiếu nhập kho nguyên vật liệu.
- Phiếu xuất kho cho lệnh sản xuất.
- Hóa đơn bán hàng hoặc hóa đơn điện tử.
- Phiếu thu chi nội bộ.
- Phiếu điều chỉnh kho.
- Chứng từ chi phí sản xuất.
- Phiếu gửi gia công ngoài.
- Phiếu nhận lại hàng từ xưởng ngoài.

### 8.2. Sổ kế toán

Cần có ít nhất 7 sổ:

- Sổ chi tiết doanh thu.
- Sổ vật liệu.
- Sổ chi phí.
- Sổ quỹ tiền mặt.
- Sổ tiền gửi ngân hàng.
- Sổ công nợ phải thu.
- Sổ công nợ phải trả.

### 8.3. Báo cáo tài chính

- Doanh thu theo ngày, tuần, tháng, quý, năm.
- Chi phí nguyên vật liệu, nhân công, máy móc, thuê xưởng, điện nước, vận chuyển.
- Lợi nhuận gộp theo đơn hàng.
- Lợi nhuận ròng theo tháng.
- Dòng tiền thu chi.
- Công nợ khách hàng và nhà cung cấp.
- Báo cáo tồn kho và giá vốn.
- Báo cáo chi phí theo lệnh sản xuất.
- Báo cáo chi phí gia công ngoài.

## 9. Hóa đơn điện tử và thuế

- Phát hành hóa đơn khi bán hàng.
- Gắn hóa đơn với đơn hàng và phiếu thu.
- Lưu trữ hóa đơn đầu vào từ nhà cung cấp.
- Đối chiếu doanh thu với hóa đơn đã xuất.
- Tạo dữ liệu phục vụ kê khai thuế.
- Cảnh báo hóa đơn chưa đối chiếu, thu chưa ghi nhận hoặc chi chưa có chứng từ.
- Theo dõi ngưỡng doanh thu dưới 1 tỷ đồng/năm.
- Hỗ trợ kê khai doanh thu chậm nhất ngày 31/01 hàng năm.

## 10. Quản lý nhân sự xưởng

- Hồ sơ nhân viên: thiết kế, vận hành máy in, hậu kỳ, giao hàng, kế toán.
- Chấm công theo ca hoặc theo lệnh sản xuất.
- Tính lương theo giờ, theo sản lượng hoặc lương cứng.
- Phân công việc và deadline.
- Ghi nhận làm thêm giờ.
- Tính chi phí nhân công vào từng đơn in.
- Theo dõi năng suất: số đơn, số sản phẩm, tỷ lệ lỗi.

## 11. Báo cáo quản trị

| Báo cáo | Mục đích |
|---|---|
| Lợi nhuận theo đơn hàng | Biết đơn nào lãi, đơn nào lỗ |
| Lợi nhuận theo khách hàng | Xác định khách hàng giá trị cao |
| Chi phí theo lệnh sản xuất | Kiểm soát giấy, mực, nhân công, gia công |
| Chi phí theo xưởng ngoài | Kiểm soát chi phí và chất lượng đối tác |
| Tồn kho và hao hụt | Giảm thất thoát nguyên vật liệu |
| Tiến độ sản xuất | Tránh trễ deadline |
| Công nợ phải thu | Kiểm soát tiền khách chưa thanh toán |
| Công nợ phải trả | Kiểm soát tiền nợ xưởng ngoài và nhà cung cấp |
| Dòng tiền | Biết xưởng có đủ tiền vận hành hay không |
| Doanh thu theo kênh | So sánh khách trực tiếp, Shopee, Facebook, Zalo |

## 12. Kiến trúc hệ thống

### 12.1. Công nghệ đề xuất

- Frontend: Next.js hoặc React + Tailwind CSS.
- Backend: Node.js NestJS, Laravel hoặc Django.
- Cơ sở dữ liệu: PostgreSQL.
- Cache và hàng đợi: Redis + BullMQ.
- Lưu trữ file: S3-compatible, ví dụ Cloudflare R2 hoặc MinIO.
- Báo cáo: Metabase hoặc trang báo cáo tự xây bằng chart library.
- Mobile: PWA trước, sau đó có thể phát triển app Flutter.

### 12.2. Kiến trúc dữ liệu

Các bảng cốt lõi:

- `users`
- `roles`
- `permissions`
- `customers`
- `suppliers`
- `external_printers`
- `quotations`
- `orders`
- `order_items`
- `production_orders`
- `production_steps`
- `production_logs`
- `outsourcing_orders`
- `outsourcing_items`
- `outsourcing_quality_checks`
- `outsourcing_payments`
- `materials`
- `warehouses`
- `stock_movements`
- `purchase_orders`
- `purchase_order_items`
- `invoices`
- `payments`
- `expenses`
- `journal_entries`
- `accounts`
- `employees`
- `attendance`
- `payroll`
- `files`
- `design_versions`
- `audit_logs`

### 12.3. Phân quyền

| Vai trò | Quyền |
|---|---|
| Chủ hộ kinh doanh | Toàn quyền |
| Kế toán | Thu chi, hóa đơn, sổ sách, báo cáo |
| Sale | Báo giá, đơn hàng, khách hàng |
| Thiết kế | File, bản duyệt, chỉnh sửa |
| Quản đốc | Lệnh sản xuất, phân công, tiến độ |
| Kho | Nhập xuất tồn |
| Nhân viên sản xuất | Cập nhật công việc được giao |
| Xưởng ngoài | Xem phiếu gia công, cập nhật tiến độ, upload ảnh |

## 13. Cấu trúc dữ liệu bổ sung

### 13.1. Bảng `external_printers`

```sql
CREATE TABLE external_printers (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_code VARCHAR(50),
  address TEXT,
  contact_name VARCHAR(255),
  phone VARCHAR(30),
  email VARCHAR(255),
  service_types JSONB,
  payment_term VARCHAR(100),
  quality_standard TEXT,
  status VARCHAR(30) DEFAULT 'active',
  rating NUMERIC(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.2. Bảng `outsourcing_orders`

```sql
CREATE TABLE outsourcing_orders (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  production_order_id UUID REFERENCES production_orders(id),
  external_printer_id UUID REFERENCES external_printers(id),
  service_type VARCHAR(100),
  quantity_sent INT NOT NULL,
  quantity_received INT DEFAULT 0,
  quantity_rejected INT DEFAULT 0,
  unit_price NUMERIC(18,2),
  total_cost NUMERIC(18,2),
  deposit_amount NUMERIC(18,2),
  paid_amount NUMERIC(18,2),
  due_date DATE,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.3. Bảng `outsourcing_items`

```sql
CREATE TABLE outsourcing_items (
  id UUID PRIMARY KEY,
  outsourcing_order_id UUID REFERENCES outsourcing_orders(id),
  product_id UUID,
  material_id UUID,
  service_name VARCHAR(255),
  specification JSONB,
  quantity NUMERIC(18,2),
  unit VARCHAR(30),
  unit_price NUMERIC(18,2),
  amount NUMERIC(18,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.4. Bảng `outsourcing_quality_checks`

```sql
CREATE TABLE outsourcing_quality_checks (
  id UUID PRIMARY KEY,
  outsourcing_order_id UUID REFERENCES outsourcing_orders(id),
  inspector_id UUID REFERENCES users(id),
  checked_quantity INT,
  passed_quantity INT,
  failed_quantity INT,
  defect_type VARCHAR(100),
  responsibility VARCHAR(50),
  rework_required BOOLEAN DEFAULT FALSE,
  images JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.5. Bảng `outsourcing_payments`

```sql
CREATE TABLE outsourcing_payments (
  id UUID PRIMARY KEY,
  outsourcing_order_id UUID REFERENCES outsourcing_orders(id),
  payment_date DATE,
  amount NUMERIC(18,2),
  payment_method VARCHAR(50),
  reference VARCHAR(255),
  status VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 14. Giao diện đề xuất

### 14.1. Màn hình “Xưởng ngoài”

- Danh sách xưởng, tìm kiếm theo dịch vụ và khu vực.
- Hồ sơ xưởng: giá, năng lực, lịch sử, đánh giá.
- Bảng so sánh báo giá giữa các xưởng.
- Điểm hiệu suất và cảnh báo rủi ro.

### 14.2. Màn hình “Phiếu gửi gia công”

- Danh sách phiếu theo trạng thái.
- Bộ lọc theo xưởng, khách hàng, đơn hàng, deadline.
- Nút “Tạo phiếu gửi gia công” từ lệnh sản xuất.
- Xem tiến độ, ảnh QC, chi phí và thanh toán.

### 14.3. Màn hình “Bảng điều khiển gia công”

- Số phiếu đang gửi ngoài.
- Số phiếu sắp đến hạn.
- Số phiếu trễ hạn.
- Số tiền phải trả xưởng ngoài.
- Tỷ lệ lỗi theo xưởng.
- Top xưởng có chi phí cao nhất.
- Top xưởng có tỷ lệ làm lại cao nhất.

## 15. Luồng nghiệp vụ hoàn chỉnh

1. Sale tạo đơn hàng catalogue 500 cuốn.
2. Hệ thống tạo lệnh sản xuất.
3. Quản đốc chọn công đoạn in nội bộ hoặc gửi ngoài.
4. Hệ thống tạo phiếu gửi gia công cho Xưởng A.
5. Kho xuất giấy và file in cho Xưởng A.
6. Xưởng A cập nhật “đã nhận hàng” và “đang in”.
7. Xưởng A hoàn thành, gửi hàng về.
8. Kho/QC kiểm tra 500 cuốn, phát hiện 20 cuốn lỗi màu.
9. Hệ thống tạo yêu cầu làm lại cho 20 cuốn.
10. Xưởng A làm lại hoặc bị trừ công nợ.
11. Kế toán ghi nhận chi phí gia công, công nợ và thanh toán.
12. Báo cáo lợi nhuận đơn hàng được cập nhật.

## 16. Lộ trình phát triển

| Giai đoạn | Phạm vi |
|---|---|
| MVP 1 | Khách hàng, báo giá, đơn hàng, thu chi, kho đơn giản, báo cáo doanh thu |
| MVP 2 | Lệnh sản xuất, tiến độ, file thiết kế, phân công, QC |
| MVP 3 | Kho nguyên vật liệu, giá vốn, công nợ, hóa đơn |
| MVP 4 | Xưởng in ngoài, phiếu gia công, QC, công nợ gia công |
| MVP 5 | Sổ kế toán, báo cáo tài chính, kê khai thuế |
| MVP 6 | Mobile PWA, thông báo, tích hợp hóa đơn điện tử, kết nối sàn TMĐT |

## 17. Lưu ý triển khai

Nếu muốn hệ thống thay thế hoàn toàn MISA eShop, cần xây dựng riêng phần hóa đơn điện tử, kết nối cơ quan thuế và cập nhật chính sách thuế.

Nếu muốn giảm rủi ro pháp lý và thời gian phát triển, phương án tối ưu là:

- Xây phần quản lý xưởng in riêng.
- Đồng bộ dữ liệu bán hàng, thu chi, hóa đơn sang MISA eShop hoặc AMIS Kế toán Hộ kinh doanh.
- Dùng MISA xử lý hóa đơn điện tử, thuế và sổ sách.
- Giữ hệ thống riêng làm nguồn dữ liệu nghiệp vụ cho xưởng in.

Phần gia công ngoài nên được thiết kế như một lệnh sản xuất đặc biệt: có đầu vào là nguyên vật liệu hoặc file, đầu ra là bán thành phẩm hoặc thành phẩm, có chi phí, có QC và có công nợ. Điều này giúp hệ thống phản ánh đúng thực tế xưởng in, nơi một sản phẩm thường đi qua nhiều xưởng và nhiều công đoạn trước khi giao khách.
