# Đợt 2, phần 4: mở tầng 2 và sân thượng

- Ngày: 2026-10-28
- Trạng thái: anh đã duyệt (2026-10-28)
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.5, 5.10 và mục 6 (Đợt 2). Phần 1 xem `2026-10-27-dot-2-khach-design.md`, phần 2 xem `2026-10-27-dot-2-nhan-vien-design.md`, phần 3 xem `2026-10-27-dot-2-dich-vu-design.md`.
- Bản phác bấm thử (anh đã xem, chịu cả tám điểm): https://claude.ai/artifact/2BEagdRjXqqwMRhDdW5bu4

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự điền, anh sửa được.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Làm ngay bằng 2D**, không chờ quyết định có lên 3D hay không. **(anh chọn)**
  - Luật chơi của tầng (lưới, cầu thang, ai đi đâu, save) dùng lại được nếu sau này lên 3D. Chỉ phần hình (nút tầng, cầu thang, sàn tầng mới) phải vẽ lại.
- **Xếp ba tầng chồng lên nhau thành một lưới dài** trong code (mục 6, Cách 1). **(anh chọn)**
- **Chia hai lô:** **(em đề xuất)**
  - **Lô A:** tầng 2 chơi được trọn vẹn, gồm lưới ba tầng, cầu thang, nút tầng, mở tầng, kê đồ theo tầng, nhân viên tối đa 5 thợ, save v14.
  - **Lô B:** sân thượng: hình, mở sân thượng, thợ tối đa 7.
- **Anh duyệt tài liệu này một lần cho cả hai lô.** **(em đề xuất, giữ cách của phần 1–3)**
  - Sau đó em làm liền một mạch.
  - Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh.
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Cả tiệm là một sàn 13 × 18 ô** (`SPA_LAYOUT_1A` trong `src/sim/layout.ts`):
  - Hàng 0–1 là tường sau, hàng 17 là tường trước có cửa ở (6, 17).
  - Bình phong ở hàng 6, hở ô (6, 6).
  - Quầy lễ tân ở (8–10, 14).
  - Màn hình vẽ thêm hai hàng vỉa hè và đường dưới tường trước.
- **Mọi luật đọc một lưới `Grid` duy nhất.** Lưới dựng lại từ vỏ tiệm và đồ đạc mỗi lần kê đồ (`buildGrid`, `rebuildRoom`).
  - Gồm: tìm đường (`findPath`, BFS 4 hướng), loang (`flood`), cửa với tới đâu (`doorReach`), luật đặt đồ (`placeProblem`), dời người khi kê đồ (`settleCharacters`).
  - Gồm cả chỗ đứng của lễ tân (`receptionSpot`), chỗ đứng chờ của thợ (`homeOf`, loang từ `OWNER_START` (9, 13)), chỗ nghỉ cạnh tủ khăn (`restSpot`) và chỗ VIP đứng khi hết ghế (`standSpot`).
- **Ai đi cũng qua một hàm `moveAlong`:** chủ tiệm (5 ô/giây), thợ, khách (3,5–5 ô/giây).
- **Giường:**
  - Mỗi giường là một "trạm" (`Station`) có ô khách nằm và ô người làm.
  - Chủ tiệm hay thợ đón khách ở ghế chờ rồi cùng đi tới giường trống đúng dịch vụ. Hiện lấy giường trống có id nhỏ nhất.
- **Ghế chờ** là ô ngồi của băng ghế.
  - Luôn phải còn ít nhất một băng ghế và một giường gội.
  - Mọi giường và ghế phải đi tới được từ cửa.
- **Nhân viên:** tối đa 1 lễ tân và 3 thợ (`STAFF_CAP`). Bảng Nhân viên hiện tối đa 4 dòng (`MAX_ROWS` trong `StaffScene`).
- **Màn hình** khung 1080 × 2160:
  - Thanh trên ở y 24–194.
  - Bản đồ từ y 210 tới 1770, gồm 18 hàng sàn và 2 hàng đường, mỗi ô 78 px.
  - Thông báo ngắn (toast) hiện ở y 1790.
  - Bốn nút chính trên tấm nền từ y 1940.
  - Chế độ Xây dựng phủ từ y 1640 xuống. Khi đang cầm một món đồ thì chỉ phủ từ y 1940.
- **Save v13** lưu cả khách, chủ tiệm, nhân viên giữa ngày, kèm vị trí và đường đang đi.

## 3. Mục tiêu

- **Tiệm có chỗ lớn lên:** sáu dịch vụ với sáu loại giường không còn chen nhau trên một sàn.
- **Mở tầng là một mốc lớn, đáng để dành tiền.** **(anh chọn, tài liệu gốc mục 5.10)**
- **Cảm giác tiệm nhà phố Sài Gòn:** tầng 2 sàn gỗ có ban công, sân thượng lát gạch tàu có giàn hoa giấy, bồn nước và chuồng cu. **(anh chọn trên bản phác)**
- **Các tầng chạy cùng lúc.** Tầng không xem vẫn có khách và thợ làm việc. **(anh chọn, tài liệu gốc mục 5.5)**
- **Không bao giờ mất dấu khách:** đang xem tầng trên mà tầng 1 có khách chờ thì nút tầng báo ngay.

## 4. Chưa làm ở phần này

- **Thang máy, nhiều cầu thang, hay cầu thang đặt chỗ khác.** Mỗi tầng một cầu thang cố định. **(anh chọn trên bản phác)**
- **Tầng khác cỡ, tầng 4 trở lên, hay tầng hầm.** **(em đề xuất)**
- **Phòng riêng, tường và vách ngăn tự dựng.** Để bản 3D hoặc đợt sau. **(em đề xuất)**
- **Ghế chờ ở tầng trên, quầy lễ tân thứ hai.** Khách chỉ chờ ở tầng 1. **(anh chọn trên bản phác)**
- **Kéo màn hình, phóng to thu nhỏ.** Tầng nào cũng vừa khít màn hình. **(anh chọn trên bản phác)**
- **Tầng mới làm khách tới đông hơn.** Khách tới vẫn theo sao, độ đẹp và số dịch vụ như bây giờ. Độ đẹp tính đồ ở mọi tầng. **(em đề xuất)**
- **Tầng có luật riêng**, ví dụ sân thượng làm xông lá nhanh hơn. Tầng chỉ khác nhau ở hình. **(em đề xuất)**

## 5. Điều cấm (dính là coi như hỏng)

Giữ mọi điều cấm của bước 1b và phần 1–3, thêm:

- **Tiệm cũ mất gì:**
  - Mở tiệm cũ bằng bản mới thì mọi thứ còn nguyên.
  - Ngoại lệ duy nhất: món đồ nằm đúng chỗ cầu thang mới. Món đó được hoàn đủ tiền, còn quà thì về lại sổ khách (mục 8.7).
- **Người chơi mới thấy rối:** trước ngày 6 không có nút tầng nào, chỉ thấy cầu thang có dây chắn.
- **Kẹt đường:**
  - Không món đồ nào được che cầu thang hay ô chân cầu thang.
  - Đồ cũng không được cắt đường từ cửa tới ô chân cầu thang, kể cả khi tầng trên chưa mở.
  - Mọi giường ở mọi tầng đã mở đều đi tới được từ cửa.
- **Mất dấu khách:** tầng 1 có khách chờ mà anh đang xem tầng khác thì nút Tầng 1 luôn có chấm đỏ.
- **Màn hình tự nhảy tầng lung tung:**
  - Chỉ tự đổi tầng khi chủ tiệm dẫn khách đi phục vụ ở tầng khác, hoặc ngay sau khi mở tầng mới.
  - Đầu ngày và lúc mở save cũng tự chọn tầng (mục 7.6), vì lúc đó chưa có gì để giữ.
  - Mọi lúc khác, chỉ đổi khi anh bấm.
- **Nút khó bấm:** nút tầng cao ít nhất 96 px trên khung 1080, đủ cho ngón cái.
- **Chậm máy:** mọi tầng chạy luật cùng lúc nhưng chỉ vẽ tầng đang xem.

## 6. Các cách đã cân nhắc

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **1. Ba tầng xếp chồng thành một lưới dài.** Tầng 1 là hàng 0–17, tầng 2 là hàng 18–35, sân thượng là hàng 36–53. Cầu thang là lối nối ô chân cầu thang tầng này với tầng kia. | Mọi luật đang có (tìm đường, giường, ghế, kê đồ, chặn lối, nhân viên) chạy y nguyên trên một lưới. Đồ tiệm cũ nằm sẵn ở tầng 1, save đổi rất ít. Test cũ vẫn đúng. | Tầng nào cũng phải 13 × 18. Số hàng ngầm mang số tầng, nên cần hàm `floorOf`. | **Anh chọn** |
| 2. Mỗi tầng một lưới riêng, mọi người và mọi món đồ ghi thêm "ở tầng mấy". | Đọc code rõ hơn. Tầng có thể khác cỡ. | Sửa hơn 50 chỗ dùng lưới. Save phải ghi tầng cho từng món. Dễ làm hỏng thứ đang chạy. | Không chọn |
| 3. Mỗi tầng là một tiệm con chạy riêng. | Tách bạch. | Chủ tiệm và nhân viên dùng chung cho mọi tầng, nên phải chuyển người qua lại giữa các tiệm con. | Bỏ |

Tham khảo game mã nguồn mở:
- **Ingnomia** (bản làm lại Gnomoria): mọi tầng chung một mảng ô, cầu thang là chỗ nối giữa hai tầng. Giống Cách 1.
- **Brogue CE:** đặt cầu thang tầng trên đúng chỗ cầu thang tầng dưới.
- **OpenSkyscraper:** cho người ở yên trong cầu thang một lúc rồi mới sang tầng kia. Cả ba tựa game đều mô phỏng mọi tầng cùng lúc, trừ Brogue.

## 7. Người chơi thấy gì

### 7.1 Ba tầng

| Tầng | Hình | Mở |
|---|---|---|
| Tầng 1 | Như bây giờ, thêm cầu thang ở góc phải sát bình phong | có sẵn |
| Tầng 2 | Sàn gỗ. Tường sau có hai cửa sổ cửa chớp xanh và một đèn lồng. Tường trước có hai cửa kính ra ban công gạch bông, ban công có lan can sắt và bốn chậu hoa. | 2.000.000 đ, từ ngày 6 |
| Sân thượng | Gạch tàu. Phía sau là trời, mái nhà xa, bồn nước inox, dây phơi khăn và tường lửng. Phía trước có tường lửng, giàn hoa giấy rủ xuống, và mái tôn nhà bên ở dưới. Đầu cầu thang có chuồng cu. | 4.000.000 đ, sau khi đã mở tầng 2 |

- Tầng nào cũng 13 × 18 ô, sàn trong từ cột 1 tới 11 và từ hàng 2 tới 16, giống tầng 1. **(anh chọn trên bản phác)**
- Tầng 2 và sân thượng chỉ có tường và cầu thang. Không có cửa, bình phong hay quầy. **(em đề xuất)**
- Hình lấy theo bản phác, cùng nét viền nâu và bảng màu của game. **(anh chọn trên bản phác)**

### 7.2 Cầu thang

- **Cùng một chỗ trên mọi tầng:** ba ô (11, 7), (11, 8), (11, 9), bậc lên phía sau. Ô chân cầu thang là (11, 10). **(anh chọn trên bản phác)**
- **Ba ô cầu thang không đi được và không kê đồ được.** Ô chân cầu thang đi được nhưng không kê đồ được, kể cả ô người làm của giường. **(em đề xuất)**
- **Đi cầu thang:**
  - Ai bước vào ô chân cầu thang để sang tầng khác thì ở trong cầu thang `STAIRS_MS` (1 giây) cho mỗi tầng.
  - Ở tầng đang rời, hình người bước lên bậc và mờ dần.
  - Ở tầng tới, người hiện ra ở ô chân cầu thang rồi đi tiếp. **(anh chọn trên bản phác)**
- **Khi tầng trên chưa mở,** cầu thang tầng 1 có dây chắn và tấm biển nhỏ, không ai đi lên. **(em đề xuất)**
- **Sân thượng:** chuồng cu che ba ô cầu thang. Người vào cầu thang khuất sau chuồng cu. **(anh chọn trên bản phác)**

### 7.3 Nút tầng

- **Vị trí:** dưới đáy, giữa đường phố của bản đồ (y 1770) và tấm nền bốn nút chính (y 1940). Ba nút tròn dài cạnh nhau, mỗi nút khoảng 320 × 96 px. **(anh chọn trên bản phác)**
  - Lô A có hai nút: Tầng 1 và Tầng 2.
  - Lô B thêm nút Sân thượng.
- **Hiện từ ngày 6** (`UNLOCK_DAY.floors`). Trước đó không có nút nào. **(em đề xuất)**
- **Trạng thái nút:**
  - Tầng đang xem: nền xanh, chữ kem.
  - Tầng đã mở: nền kem.
  - Tầng chưa mở: viền đứt, ổ khoá và giá.
- **Mặt chủ tiệm:** hình mặt nhỏ trên nút của tầng chủ tiệm đang đứng. Chủ tiệm đang trong cầu thang thì mặt sang nút tầng tới đúng lúc chủ tiệm hiện ra ở tầng đó. **(anh chọn trên bản phác)**
- **Chấm đỏ:** trên nút Tầng 1 khi đang xem tầng khác mà tầng 1 có khách chờ, kể cả VIP đứng chờ cạnh quầy. Tầng trên không có chấm. **(anh chọn trên bản phác)**
- **Thông báo ngắn** dời từ y 1790 lên khoảng y 1690, trên dải đường phố, để không che nút tầng. **(em đề xuất)**

### 7.4 Mở tầng

- **Chạm nút tầng chưa mở** thì hiện bảng nhỏ:
  - Tên tầng và hai dòng tả tầng đó.
  - Nút "Mở · 2.000.000 đ" và nút "Để sau".
- **Thiếu tiền:** nút mở mờ đi, ghi "Còn thiếu …".
- **Sân thượng khi chưa mở tầng 2:** bảng ghi "Mở tầng 2 trước", không có nút mở. **(em đề xuất)**
- **Đường tới cầu thang bị đồ chắn** (chỉ xảy ra ở tiệm cũ, mục 8.7): bảng ghi "Dọn lối tới cầu thang trước", không có nút mở. Không tự dời hay bỏ đồ của anh. **(em đề xuất)**
- **Mở xong:**
  - Trừ tiền.
  - Cầu thang tầng dưới bỏ dây chắn.
  - Màn hình chuyển sang tầng mới.
  - Hiện gợi ý một lần (`openFloor`): "Bấm Xây dựng để kê giường lên tầng mới". **(em đề xuất)**
- **Mở tầng được bất cứ lúc nào** từ ngày 6, kể cả giữa giờ mở cửa, giống mua đồ. **(em đề xuất)**

### 7.5 Khách

- Khách vào cửa tầng 1, qua quầy, ngồi ghế chờ ở tầng 1. Không đổi gì. **(anh chọn trên bản phác)**
- **Tới lượt, khách đi tới giường trống đúng dịch vụ, ở tầng nào cũng được:**
  - Chọn giường ở tầng thấp nhất trước, cho ít phải leo.
  - Cùng tầng thì lấy id nhỏ nhất như bây giờ. **(em đề xuất)**
- **Làm xong,** khách đi xuống cầu thang rồi ra cửa tầng 1.
- **Kiên nhẫn của khách vẫn chỉ hao lúc ngồi chờ,** không hao lúc đi lên giường. **(em đề xuất, giữ như bây giờ)**

### 7.6 Chủ tiệm và màn hình

- **Chạm sàn tầng đang xem** thì chủ tiệm đi tới đó, qua cầu thang nếu đang ở tầng khác. **(anh chọn trên bản phác)**
- **Chạm khách đang chờ** (ở tầng 1) thì chủ tiệm đi đón rồi dẫn lên giường như bây giờ, kể cả giường ở tầng trên.
- **Màn hình đi theo chủ tiệm** khi chủ tiệm đang dẫn khách tới giường và đi qua cầu thang. Đến nơi thì mini-game mở như cũ. **(anh chọn trên bản phác)**
- **Làm xong mini-game,** màn hình ở yên tầng đó. Muốn về tầng 1 thì anh bấm nút. **(em đề xuất)**
- **Đầu mỗi ngày** màn hình về tầng 1, vì chủ tiệm, nhân viên và khách mới đều bắt đầu ở đó. **(em đề xuất)**
- **Lúc mở save** màn hình hiện tầng chủ tiệm đang đứng. Tầng đang xem không ghi vào save. **(em đề xuất)**
- **Bong bóng chữ và tiền bay lên ở tầng không xem** thì không hiện. Lời khách quen vẫn lưu trong sổ khách, gợi ý công thức vẫn lưu ở bàn pha như bây giờ. **(em đề xuất)**

### 7.7 Nhân viên

- **Thợ tối đa:** 3, cộng 2 cho mỗi tầng đã mở (3 → 5 → 7). Lễ tân vẫn 1. **(anh chọn trên bản phác)**
- **Thợ đi lên xuống cầu thang như mọi người** để đón khách ở tầng 1 rồi dẫn lên giường. **(anh chọn trên bản phác)**
- **Thợ rảnh đứng chờ ở tầng 1, quanh quầy, như bây giờ.** Khách nào cũng chờ ở tầng 1 nên đứng đây đỡ phải leo. **(em đề xuất)**
- **Chỗ nghỉ** vẫn là ô gần nhất cạnh tủ khăn, tủ ở tầng nào cũng được.
- **Bảng Nhân viên** thẻ "Đang làm" chia trang 4 người, có mũi tên trái phải giống hàng thẻ đồ ở chế độ Xây dựng. **(em đề xuất)**

### 7.8 Kê đồ

- **Chế độ Xây dựng kê đồ trên tầng đang xem.** Lưới mờ chỉ phủ sàn tầng đó. **(em đề xuất)**
- **Mang đồ sang tầng khác:** đang cầm một món (bảng thu nhỏ, chỉ phủ từ y 1940) thì nút tầng hiện phía trên. Bấm nút tầng khác thì màn hình chuyển tầng, món đồ đi theo để đặt ở tầng đó. Không tốn tiền, giống dời đồ. **(em đề xuất)**
- **Ghế chờ chỉ đặt ở tầng 1.** Đặt băng ghế ở tầng trên bị từ chối, báo "Ghế chờ chỉ đặt ở tầng 1". **(anh chọn trên bản phác)**
- **Chỗ đặt giường có sẵn** (khung đứt nét) chỉ có ở tầng 1 như bây giờ.
- **Luật cũ giữ nguyên:**
  - Luôn còn một giường gội và một băng ghế. Băng ghế đó ở tầng 1, vì chỉ tầng 1 có ghế.
  - Mọi giường và ghế đi tới được từ cửa (qua cầu thang).
  - Không che ô trong cửa và chỗ chủ tiệm đứng lúc đầu.

### 7.9 Âm thanh

- Mở tầng dùng tiếng mua đồ có sẵn. Không thêm tiếng bước cầu thang. **(em đề xuất)**

## 8. Luật trong code

### 8.1 Lưới dài

- `FLOOR_ROWS = 18`, `MAX_FLOORS = 3`. Lưới luôn có đủ 3 tầng, 13 × 54 ô, kể cả tầng chưa mở.
- `floorOf(y) = Math.floor(y / FLOOR_ROWS) + 1`. Hàng trong tầng là `y % FLOOR_ROWS`. Màn hình và bản 3D sau này đọc tầng qua hàm này, không tự tính.
- **Vỏ tầng 1** là `SPA_LAYOUT_1A` thêm ô cầu thang (ký tự mới, ô `'stairs'`) ở (11, 7–9). Đồ mặc định không đổi.
- **Vỏ tầng 2 và sân thượng** là 18 hàng mới:
  - Tường bao.
  - Hàng 0–1 là tường sau, hàng 17 là tường trước.
  - Cầu thang ở (11, 7–9), sàn ở giữa.
- **Ô `'stairs'`** không đi được, không kê đồ được. `offFloor` coi nó như tường.

### 8.2 Lối nối cầu thang

- `Grid` có thêm danh sách lối nối. Ô chân cầu thang tầng k, tức (11, 10 + 18(k−1)), nối với ô chân cầu thang tầng k+1, khi cả hai tầng đã mở.
- **`findPath` và `flood` đi theo lối nối như một bước thường,** cạnh bốn hướng. Mọi chỗ đang gọi chúng tự đi được qua tầng, gồm:
  - `doorReach`, `placeProblem`, `settleCharacters`;
  - `homeOf`, `receptionSpot`, `restSpot`, `standSpot`.
- **Tầng chưa mở không có lối nối,** nên không ai tới được, không kê đồ được.

### 8.3 Đi qua lối nối

- Trong đường đi, bước nhảy hàng (từ ô chân cầu thang tầng này sang tầng kia) là một bước đặc biệt.
- **`moveAlong` gặp bước đó:**
  - Người đứng yên ở ô chân cầu thang, mặt hướng lên, và đếm `STAIRS_MS`.
  - Đếm xong thì vị trí nhảy sang ô chân cầu thang tầng tới.
  - Phần thời gian còn dư đi tiếp như thường.
- **Thời gian đếm dở là một phần của người đang đi,** nên save giữa ngày lưu và mở lại đúng chỗ.
- **Màn hình** đọc thời gian đếm dở để vẽ người bước lên bậc và mờ dần.
- Người đang trong cầu thang bị một lần kê đồ làm đổi đường thì tính lại đường từ ô chân cầu thang tầng đang rời. Cách làm cụ thể để builder chọn.

### 8.4 Chọn giường

- Khi đón khách, chủ tiệm hay thợ chọn giường trống đúng dịch vụ:
  - Tầng thấp nhất trước.
  - Cùng tầng thì id nhỏ nhất.
- Việc kiểm "còn giường trống không" trước khi đón vẫn như cũ, tính mọi tầng.

### 8.5 Ghế, quầy, chỗ đứng

- `seats` chỉ lấy ô ngồi của băng ghế ở tầng 1.
- `placeProblem` thêm lỗi `seatFloor` cho băng ghế đặt ngoài tầng 1, và che chắn ô chân cầu thang mọi tầng.
- `placeProblem` coi ô chân cầu thang tầng 1 như một giường: phải đi tới được từ cửa, kể cả khi tầng 2 chưa mở. Cắt đường tới đó là lỗi `blocksPath` như cũ.
- `lastSeat` đếm băng ghế (mọi băng ghế đều ở tầng 1).
- Quầy, cửa, `OWNER_START` đều ở tầng 1 như cũ.

### 8.6 Mở tầng

- `SpaSim.floors: 1 | 2 | 3`, bắt đầu từ 1.
- **`openFloor()` trả lý do nếu không mở được:**
  - `day`: chưa tới ngày 6.
  - `order`: sân thượng trước tầng 2.
  - `money`: thiếu tiền.
  - `max`: đã mở hết;
  - `blocked`: cửa không đi tới được ô chân cầu thang của tầng ngay dưới (chỉ gặp ở tiệm cũ).
- **Mở được thì:**
  - Trừ `FLOOR_PRICE`.
  - Dựng lại lưới để có lối nối.
  - Phát sự kiện `floorOpened`.
- `STAFF_CAP.technician` thành hàm của `floors`: `3 + 2 × (floors − 1)`.

### 8.7 Save v14 và tiệm cũ

- **v14 thêm:**
  - `floors` (1–3);
  - thời gian đếm dở trong cầu thang của chủ tiệm, thợ và khách.
- **Đồ ở tầng chưa mở hay chạm ô cầu thang** thì save hỏng, như đồ nằm trên tường bây giờ.
- **Mở save v13 trở xuống:**
  - `floors = 1`.
  - Món đồ nào chạm ba ô cầu thang hay ô chân cầu thang (tính cả ô người làm của giường) thì bỏ đi:
    - đồ mua được hoàn đủ giá vào tiền;
    - quà về lại danh sách quà chờ đặt trong sổ khách.
  - **Ngoại lệ:** nếu món bị bỏ là giường gội cuối cùng hay băng ghế cuối cùng, thì không hoàn tiền mà dời nó tới chỗ hợp lệ gần cửa nhất ở tầng 1, giữ luật "luôn còn một giường gội, một băng ghế". Không còn chỗ hợp lệ nào thì mới hoàn tiền, và thông báo ngắn nhắc mua lại. **(em đề xuất)**
  - Khách đang nằm trên, hay đang đi tới, một giường bị bỏ thì ra về: không trả tiền, không bị chấm sao xấu, không tính là bỏ về. Mini-game của chủ tiệm đang chờ mở trên giường đó thì huỷ. **(em đề xuất)**
  - Không tự dời hay bỏ đồ chỉ vì nó cắt đường tới cầu thang. Tiệm cũ bị như vậy thì lúc mở tầng mới báo (mục 7.4). **(em đề xuất)**
  - Ai đang đứng trên ô cầu thang thì bước ra ô gần nhất cửa với tới, như `settleCharacters`.
  - Có món bị bỏ thì lần đầu mở tiệm hiện thông báo ngắn, ví dụ "Chỗ cầu thang mới có 1 món đồ, đã hoàn 150.000 đ".
- **Test cũ của save v1–v13 vẫn qua.** Thêm bản save mẫu v13 có đồ đúng chỗ cầu thang.

## 9. Hai lô

### Lô A: tầng 2 chơi trọn (save v14)

- Lưới ba tầng, vỏ tầng 2 và sân thượng (8.1), lối nối (8.2), đi cầu thang (8.3), chọn giường (8.4), ghế chỉ ở tầng 1 (8.5).
- Mở tầng 2 (8.6). Sân thượng có trong luật nhưng chưa có nút.
- Cầu thang vẽ ở tầng 1 và tầng 2, kèm dây chắn khi tầng trên chưa mở.
- Hình tầng 2: sàn gỗ, cửa chớp, đèn lồng, ban công.
- Nút tầng, mặt chủ tiệm, chấm đỏ, dời thông báo ngắn (7.3).
- Bảng mở tầng (7.4), màn hình đi theo chủ tiệm (7.6).
- Kê đồ theo tầng và mang đồ sang tầng (7.8).
- Thợ tối đa 5 và bảng Nhân viên chia trang (7.7).
- Save v14 và tiệm cũ (8.7).
- **Em tự kiểm trên trình duyệt, khung iPhone:**
  - mở tầng 2;
  - chủ tiệm dẫn khách massage lên tầng 2, màn hình đi theo;
  - thợ xuống đón khách;
  - chấm đỏ khi xem tầng 2 mà có khách mới;
  - kê giường ở tầng 2 và mang một chậu cây từ tầng 1 lên;
  - mở một save v13 có đồ ở chỗ cầu thang;
  - bảng Nhân viên có 6 người.

### Lô B: sân thượng

- Hình sân thượng và chuồng cu (7.1, 7.2).
- Nút Sân thượng và bảng mở (7.3, 7.4).
- Thợ tối đa 7.
- Không đổi save.
- **Em tự kiểm trên trình duyệt:**
  - mở sân thượng;
  - kê tắm bùn trên đó;
  - dẫn khách từ tầng 1 lên sân thượng (qua tầng 2);
  - 7 thợ cùng làm.

## 10. Số khởi đầu (`src/config.ts`)

| Tên | Giá trị | Ghi chú |
|---|---|---|
| `FLOOR_ROWS` | 18 | hàng mỗi tầng |
| `MAX_FLOORS` | 3 | |
| `FLOOR_PRICE` | 2.000.000 đ, 4.000.000 đ | tầng 2, sân thượng |
| `UNLOCK_DAY.floors` | 6 | nút tầng hiện từ ngày này |
| `STAIRS_MS` | 1000 | thời gian trong cầu thang, mỗi tầng |
| `STAIRS` | (11, 7–9), chân (11, 10) | trong từng tầng |
| Thợ tối đa | 3 + 2 × (tầng − 1) | lễ tân vẫn 1 |

## 11. Để builder quyết

- Cách màn hình chỉ vẽ một tầng: dời khung chứa hay dùng camera, ẩn người và đồ ở tầng khác.
- Cách lưu thời gian đếm dở trong cầu thang trên `Mover` và cách tính lại đường khi đang trong cầu thang.
- Tên ký tự mới trong layout, tên sự kiện, tên gợi ý.
- Nét vẽ cụ thể của cầu thang, dây chắn, tầng 2, sân thượng, chuồng cu, miễn theo bản phác và bảng màu.
- Chữ trên bảng mở tầng, miễn ngắn, rõ, có giá.
- Cách chia trang bảng Nhân viên.
- Chia file test.
- Layout riêng trong test (`SpaSimOptions.layout`): layout đó là tầng 1. Tầng 2 và sân thượng là vỏ chuẩn, cùng cỡ. Layout không có ô cầu thang thì tiệm chỉ có một tầng và không mở thêm được.
- Chỗ đứng chờ của thợ (`homeOf`) giữ ở tầng 1 và không lấy ô chân cầu thang.

## 12. Anh thử trên iPhone sau khi lên

- Giá 2.000.000 đ và 4.000.000 đ đắt hay rẻ.
- Một giây trong cầu thang có chậm quá không.
- Màn hình tự đi theo chủ tiệm có dễ chịu hay rối.
- Chấm đỏ có đủ để biết tầng 1 có khách.
- Nút tầng ở đáy có tiện ngón cái không.
- Bảy thợ đứng quanh quầy có chật không.
