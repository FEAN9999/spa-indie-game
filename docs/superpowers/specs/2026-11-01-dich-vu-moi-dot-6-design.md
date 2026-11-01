# Đợt 6: thêm dịch vụ spa và món nhà hàng

- Ngày: 2026-11-01
- Trạng thái: Chồng yêu đã chọn cách làm và danh sách (2026-11-01); lô 1 và lô 2 đã làm, lô 3 và 4 chưa làm.

Cách đọc giống các spec trước:
- **(anh chọn)** là điều Chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, Chồng yêu sửa được.
- Mọi con số là số khởi đầu, chỉnh sau khi chơi thử.

## 1. Cách làm

- Mỗi dịch vụ / món mới có mini-game riêng (luật thuần trong `src/sim/`, cảnh trong `src/scenes/`, hình, kho, save), làm **từng lô một dịch vụ spa + một món**. **(anh chọn)**
- Bốn dịch vụ spa, theo thứ tự: Giác hơi, Nối mi, Bấm huyệt, Lấy nhân mụn. **(anh chọn)**
- Bốn món, theo thứ tự: Bún chả, Gỏi cuốn, Cơm tấm, Cà phê sữa đá. **(anh chọn)**
- Ghép lô theo thứ tự đó: **(em đề xuất)**

| Lô | Dịch vụ spa | Món |
|---|---|---|
| 1 (đã làm) | Giác hơi | Bún chả |
| 2 (đã làm) | Nối mi | Gỏi cuốn |
| 3 | Bấm huyệt | Cơm tấm |
| 4 | Lấy nhân mụn | Cà phê sữa đá |

## 2. Luật chung **(em đề xuất)**

- **Dịch vụ spa mới là dịch vụ học nghề** (`LessonService`), như Chà muối, Ngâm chân, Sơn móng: trả học phí một lần ở tiệm gốc, qua bài học thì có dịch vụ ở mọi tiệm và một giường trong hộp quà. Không làm khách đến nhanh hơn, không đổi huy hiệu "Đủ món" (vẫn 6) và phần dịch vụ của hạng (vẫn 6/6).
- **Món mới mua bằng tiền ở màn Thực đơn** (`EXTRA_DISHES`): nhà hàng nào cũng có sẵn Phở, Bánh xèo, Chè; món mới hiện mờ với nút "Thêm món". Mua rồi thì thực khách gọi được, đầu bếp có thể giỏi món đó, kho tự nhập khi chủ đi vắng. Lần nấu đầu có hướng dẫn như các món cũ.
- **Không đổi lượt rút cũ:** tiệm chưa học / nhà hàng chưa mua thì rút y như trước, có log đóng băng chứng minh (`draws-nine-services.json`, `draws-ten-services.json`, `draws-restaurant.json`, `draws-restaurant-bun-cha.json`).

## 3. Lô 1

### 3.1 Giác hơi

| Mục | Số |
|---|---|
| Mở học | 5★, đã mở Massage |
| Học phí | 1.800.000 đ |
| Khách trả | 110.000 đ |
| Giường giác hơi | 1.200.000 đ (1×3), tặng một cái khi học xong |
| Kho | Cồn & bông, 600.000 đ / 20, mỗi khách 1 cồn + 1 khăn |
| Khách thích | người lớn tuổi, khách du lịch |

Mini-game (25 giây):
- Lưng khách có 6 điểm sáng; khay có 3 ống giác. Chạm điểm để đặt ống, tối đa 3 ống cùng lúc.
- Da dưới mỗi ống đỏ dần với tốc độ riêng. Chạm ống để gỡ: chưa đủ đỏ là "nhạt", vừa đỏ là "đẹp", quá lâu là "thâm" (khách giật mình). Để quên thì ống tự rơi, tính thâm.
- Điểm = số ống đẹp trừ số ống thâm; 3★ khi ≥ 5, 2★ khi ≥ 3.
- Khách khó tính: da đỏ nhanh hơn.

### 3.2 Bún chả

| Mục | Số |
|---|---|
| Giá thêm vào thực đơn | 1.200.000 đ (một lần) |
| Khách trả | 35.000 đ |
| Kho | Thịt chả & bún, 240.000 đ / 20, cộng 1 rau thơm như mọi món |

Mini-game (25 giây), 3 bước:
1. **Nướng chả:** vỉ chả vàng dần, kim chạy lên; bấm "Lật vỉ" khi kim vào vạch vàng, rồi "Gắp ra" cho mặt thứ hai. Phiếu "Chả vàng vừa" hoặc "Chả cháy cạnh" đổi vạch. Để cháy hẳn thì vỉ tự lật, tính cháy.
2. **Đồ ăn kèm:** chạm Rau, Đu đủ, Ớt theo phiếu rồi Xong (rau ≥ 1, khách khó tính ≥ 2; đu đủ ≥ 1; ớt chỉ khi phiếu có).
3. **Chan nước chấm:** giữ nút để rót, thả khi nước tới dải vàng; giữ tới miệng bát là tràn.
- Sao: 1 + (cả hai mặt vừa) + (nước chấm vừa) − (có mặt cháy/sống xa) − (sai đồ kèm), trong khoảng 1–3.

### 3.3 Tham khảo mã nguồn mở (theo luật CLAUDE.md)

- Adriel's BBQ Shack (JbellMD, Phaser 3): thịt trên vỉ có vòng chín, bấm khi kim vào vùng xanh, sớm thì "Good", muộn thì "Overdone", đen là bỏ. Em lấy ý "bấm khi kim vào vạch" nhưng làm hai mặt và theo phiếu.
- Thera-Cup (g3evorz, Godot): game quản lý phòng giác hơi, không có mini-game đặt ống; luật đặt/gỡ ống là của mình.

## 4. Lô 2

### 4.1 Nối mi

| Mục | Số |
|---|---|
| Mở học | 5★, đã mở Massage (học sau Giác hơi trong danh sách gợi ý) |
| Học phí | 2.100.000 đ |
| Khách trả | 120.000 đ |
| Giường nối mi | 1.350.000 đ (1×3), tặng một cái khi học xong |
| Kho | Mi & keo, 640.000 đ / 20, mỗi khách 1 bộ + 1 khăn |
| Khách thích | học sinh, quý bà |

Mini-game (25 giây):
- Thẻ mẫu ghi kiểu mi: Tự nhiên (vừa, hai đầu ngắn), Mắt mèo (ngắn → vừa → dài ra đuôi mắt), Búp bê (dài ở giữa).
- Khay có 3 loại mi: Ngắn, Vừa, Dài. Kéo một sợi lên chấm trên mí; sợi mi nổi phía trên ngón tay để ngón cái không che chỗ thả.
- Thả trúng chấm trống: đúng độ dài là "Đẹp!", sai độ dài thì sợi mi hiện đỏ. Thả lên chấm đã có mi là "Dính chùm", mất sợi đó.
- 7 chấm (khách khó tính 9 chấm, tầm thả ngắn hơn, không bao giờ ra kiểu Tự nhiên).
- 3★: mọi chấm đúng và dính chùm ≤ 1; 2★: sai tối đa 2 chấm và dính chùm ≤ 3.

### 4.2 Gỏi cuốn

| Mục | Số |
|---|---|
| Giá thêm vào thực đơn | 1.000.000 đ (một lần) |
| Khách trả | 25.000 đ |
| Kho | Bánh tráng & tôm, 160.000 đ / 20, cộng 1 rau thơm như mọi món |

Mini-game (25 giây), 3 bước:
1. **Nhúng bánh:** vuốt bánh tráng ngang qua chậu nước một lần; nhanh hơn 0,35 giây là "còn cứng", chậm hơn 1,1 giây là "nhũn" (khách khó tính: 0,45–0,95 giây).
2. **Xếp nhân:** tôm, thịt (chỉ khi phiếu là "tôm thịt"), bún, rau (khách khó tính 2 lần) rồi Xong.
3. **Cuốn:** vuốt từ dưới lên 3 lần; vuốt dài là "chặt tay", ngắn là "lỏng".
- Sao: 1 + (nhúng vừa) + (cả 3 lần chặt) − (2 lần lỏng trở lên) − (sai nhân), trong khoảng 1–3.

### 4.3 Tham khảo mã nguồn mở

- Tìm trên GitHub ("eyelash game", "lash salon", "spring roll game", "rice paper roll", "sushi roll game"): không có dự án nào có mini-game nối mi hay cuốn bánh để so; luật lô 2 là của mình, theo kiểu kéo-thả của game làm đẹp và vuốt-cuốn của game nấu ăn.

## 5. Save

- Bản 43 (`NEW_SERVICES_SAVE_VERSION`, chưa lên master nên lô 1 và lô 2 dùng chung): thêm `alcohol`, `lashKit` trong kho, `cupping`, `lashes` trong bậc thợ và số đếm, `bought`, `chaKit`, `cuonKit` của nhà hàng, bậc `bunCha`, `goiCuon` của đầu bếp. Save cũ đọc được, thiếu thì lấy mặc định.
- Màn Thực đơn hiện còn chỗ cho 5 món + rau thơm; lô 3 (Cơm tấm) cần chia trang hoặc thu nhỏ hàng.
