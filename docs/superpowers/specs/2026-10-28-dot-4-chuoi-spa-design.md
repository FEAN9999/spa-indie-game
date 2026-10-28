# Đợt 4, phần 1: chuỗi spa (chi nhánh, điều nhân viên và hàng)

- Ngày: 2026-10-28
- Trạng thái: anh đã duyệt (2026-10-28, "Duyệt, làm đi")
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 6 (Đợt 4). Đi sau Đợt 3 (`2026-10-28-dot-3-hang-ao-vang-design.md`), đã lên mạng ở save v21.
- Bản phác bấm thử: https://claude.ai/artifact/PQf7QfKtqDq6o7EyPPXLyd

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết. Ở phần này anh giao hết: "Em tự quyết hết đi em" (2026-10-28).
- **(em đề xuất)** là em tự quyết, anh sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Đợt 4 chia ba phần, làm lần lượt:** **(em đề xuất)**
  - **Phần 1 (tài liệu này):** mở chi nhánh ở ba nơi, mỗi nơi một kiểu khách; điều nhân viên và hàng giữa các tiệm.
  - **Phần 2:** làm lại từ đầu (bán chuỗi để chơi lại, đổi lấy phần thưởng giữ mãi). Có bản phác và tài liệu riêng sau khi phần 1 lên mạng.
  - **Phần 3:** thêm tiếng Anh.
  - **Lên store:** chỉ làm khi anh muốn trả phí (Google Play 25 USD một lần, App Store 99 USD mỗi năm). **(anh chọn từ spec chung)**
- **Chi nhánh là tiệm thật, vào chơi được.** Các tiệm vắng chủ vẫn mở cửa và do nhân viên chạy. Em đề xuất cách này, anh giao em quyết. **(em đề xuất)**
- **Trước khi làm, em đã xem các game mã nguồn mở** (Mindustry, Unciv, Widelands, Kittens Game, Evolve, Antimatter Dimensions, Trimps). Mục 6 ghi em lấy gì.
- **Chia ba lô:** **(em đề xuất)**
  - **Lô A, save v23:** chuỗi, bản đồ, chi nhánh Bãi biển và khách du lịch, các tiệm chạy cùng nhau, tự nhập hàng, tổng kết cả chuỗi, thẻ VIP khi vắng.
  - **Lô B, save v24:** Phố cổ và Khu cao cấp, khách Tây ba lô và quý bà.
  - **Lô C, save v25:** chuyển nhân viên giữa các tiệm, tiền khi vắng cho cả chuỗi.
- **Anh duyệt tài liệu này một lần cho cả ba lô.** Sau đó em làm liền một mạch. Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh. **(giữ cách của Đợt 2 và 3)**
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Một ô lưu là một tiệm.** `SaveStore` có 3 ô (`src/save/store.ts`). Đổi ô lưu thì tải lại trang.
- **`SpaScene` có đúng một `SpaSim`:**
  - tạo trong `openShop(saved)`, với dòng ngẫu nhiên `createRng(Date.now())`;
  - mỗi khung hình gọi `sim.update(delta)` khi không có bảng phủ (`modal`) và không `holding`, rồi `drainEvents()` và `handle(e)`;
  - `SaveSession(store, () => sim.toSave(), reload)` ghi ô lưu, đóng dấu `savedAt`.
- **`SpaSim.step`** (`src/sim/spa.ts`) đứng yên khi `paused`, `dayOver` hay chủ tiệm đang làm mini-game (`servingCustomerId !== null`). Giờ mở cửa 8:00–20:00 (`DAY_START_MIN` 480, `DAY_END_MIN` 1200). Hết ngày khi đã đóng cửa, hết khách và không ai đang làm.
- **Chạy ngầm rất rẻ:** em đo một tiệm một thợ chạy 30 ngày liền trong test mất khoảng 1,1 giây trên máy tính, tức khoảng 40 ms một ngày chơi.
- **Khách:** 5 kiểu trong `src/sim/customers.ts` (`KINDS`: sinh viên, văn phòng, khó tính, người lớn tuổi, người nổi tiếng). `drawKind(day, rng, pickyFactor)` bốc theo trọng số. Đồ mang theo của từng kiểu nằm ở `WORN` trong `src/view/CharacterView.ts`, vẽ từ mảnh chibi `src/art/chibi.ts`.
- **Giá:** `payFor` lấy giá món (`SERVICE_PRICE`, 40.000–160.000 đ), nhân giá theo hạng (`rankPrice`), rồi giá lễ và giá VIP.
- **Nhân viên:** tối đa 1 lễ tân, 3 thợ cộng 2 thợ mỗi tầng thêm (`staffCap`). Ứng viên bốc mỗi sáng. Học đêm trả tiền.
- **Kho:** `stock` theo món. `restock(item)` mua 20 món (`RESTOCK_AMOUNT`) với `RESTOCK_PRICE`. Còn ≤ 5 (`LOW_STOCK`) thì có lời nhắc.
- **Hạng tiệm:** `rank.stars` 1–5, chấm cuối tháng từ ngày 9, mỗi tháng lên tối đa 1 sao, không tụt.
- **Thanh dưới** (`src/view/Hud.ts`): 4 nút Xây, Nhân viên, Dịch vụ, Nhiệm vụ, ở `navX(i) = 135 + 270·i`.
- **Hình phòng:** `src/art/room.ts`, `src/art/floors.ts` (tầng 1 gạch bông, tầng 2 sàn gỗ, sân thượng gạch tàu).
- **Tiền khi vắng:** `SpaSim.comeBack(ms)` trả theo `AwayBook` của tiệm (`src/sim/away.ts`).
- **Bẫy cũ còn nguyên:**
  - `SpaSim.fromSave` phát lại `dayEnded` nếu ô lưu được ghi sau khi hết ngày.
  - Mọi lần bốc mới phải dùng dòng ngẫu nhiên riêng.
  - `same-draws.test.ts` chơi lại 7 ngày đầu.
- **Save v21, 1007 test.**

## 3. Mục tiêu

- **Có việc mới cho tiệm lớn:** khi nhân viên đã làm hết, chủ tiệm mở thêm tiệm, gây dựng từ đầu ở nơi mới.
- **Mỗi nơi thấy khác ngay:** nền, tường, đồ trang trí riêng, và một kiểu khách chỉ nơi đó có.
- **Hạng tiệm có thêm ý nghĩa:** 3, 4, 5 sao lần lượt mở ba nơi.
- **Nhân viên giỏi càng đáng giá:** tiệm vắng chủ sống nhờ nhân viên; thợ giỏi có thể chuyển sang tiệm mới.
- **Không rối:** một túi tiền, một đồng hồ, sáng nào cũng bắt đầu ở tiệm gốc, tối nào cũng tổng kết ở tiệm gốc.

## 4. Chưa làm ở phần này

- Làm lại từ đầu (phần 2), tiếng Anh (phần 3), lên store.
- Chi nhánh mở tầng 2 hay sân thượng. Chi nhánh chỉ có 1 tầng.
- Chi nhánh có nhiệm vụ, huy hiệu, hạng, VIP, khách quen, sự kiện hay lễ riêng.
- Gửi hàng bằng tay giữa các tiệm. Thay bằng tiệm vắng chủ tự nhập hàng (mục 7.6).
- Bán hay đóng chi nhánh. Hai chi nhánh cùng một nơi.
- Đường đi mất thời gian. Đổi tiệm là tới ngay.
- Xem tiệm khác trong lúc đang ở một tiệm. Bản đồ chỉ hiện số.
- Thuê người cho tiệm khác từ xa. Muốn thuê thì đến tận tiệm.
- Thông báo đẩy lên điện thoại.

## 5. Điều cấm (dính là coi như hỏng)

- **Tiệm gốc chưa có chi nhánh thì chơi y như cũ.** Mọi test cũ còn đạt, `same-draws` giữ nguyên.
- **Phần mới không bốc gì trong dòng ngẫu nhiên của tiệm gốc.** Mỗi chi nhánh có dòng riêng.
- **Đồng hồ các tiệm không bao giờ lệch nhau.** Cùng ngày, cùng phút.
- **Không trả hai lần, không trừ hai lần:** tải lại ô lưu không mở lại chi nhánh, không trả lại tiền mở, không trả lại tiền khi vắng.
- **Nhiệm vụ, huy hiệu, hạng tiệm, Spa của năm chỉ đếm tiệm gốc.** Số của chi nhánh không bao giờ cộng vào. Tiệm gốc lúc chủ vắng vẫn đếm như thường, theo đúng những gì xảy ra ở đó. **(em đề xuất)**
- **Thẻ và phần thưởng của tiệm gốc không mất vì chủ tiệm vắng** (mục 7.8).
- **Tiệm vắng chủ không bao giờ để chủ tiệm phục vụ.** Không có mini-game ngầm.
- **Tiệm vắng chủ không có thợ thì không có khách.** Không có khách bỏ về oan.
- **Ô lưu cũ mở được, không mất gì.**
- **Chữ và số trên màn hình không được tràn, đè lên nhau** ở màn iPhone.

## 6. Các cách đã cân nhắc

**Chi nhánh chạy thế nào khi chủ tiệm không ở đó:**
- **A. Mọi tiệm là một `SpaSim` đầy đủ, chạy cùng một đồng hồ; tiệm vắng chủ chỉ có nhân viên.** **(em đề xuất)** Hết hàng, nhân viên mệt, khách bỏ về đều xảy ra thật, nên điều người và hàng có ý nghĩa. Chạy ngầm chỉ tốn khoảng 40 ms một ngày một tiệm.
- B. Chỉ tiệm đang chơi chạy thật, tiệm khác được cộng tiền theo trung bình như Mindustry. Bỏ: nhân viên và kho ở chi nhánh không còn quan trọng, điều người và hàng thành vô nghĩa.
- C. Chi nhánh không có phòng, chỉ chọn "hướng" (kiếm tiền, đông khách…) như thành phố bù nhìn của Unciv. Bỏ: không thấy được kiểu khách riêng của từng nơi.

**Hàng ở tiệm vắng chủ:**
- **A. Tiệm vắng chủ tự nhập khi một món còn ≤ 5.** **(em đề xuất)** Giống chính sách "giữ N món" của Widelands, không cần chở hàng.
- B. Gửi hàng bằng tay từ tiệm này sang tiệm kia như bệ phóng của Mindustry. Bỏ: thêm một bảng khó dùng trên điện thoại, lại có thể mua thẳng ở tiệm.

**Chuyển nhân viên:**
- **A. Chọn tiệm mới trên thẻ nhân viên; sáng mai người đó đi làm ở tiệm mới.** **(em đề xuất)** Không có người đang đi đường trong ô lưu.
- B. Người đi bộ trên đường mất thời gian như Widelands. Bỏ: phải lưu người đang đi, mà người chơi cũng không nhìn thấy đường.

Ý tưởng lấy từ game mã nguồn mở (em chỉ lấy ý, không chép mã):
- **Mindustry:** chỉ vùng đang chơi chạy đầy đủ, vùng khác được cộng theo trung bình đã đo. → Em không chọn, vì máy chạy ngầm được cả bốn tiệm. Nhưng tiền khi vắng (lô C) vẫn theo đúng kiểu đo trung bình này.
- **Unciv:** thành phố không chơi trực tiếp có người tự quản. → Tiệm vắng chủ do nhân viên tự làm.
- **Widelands:** mỗi kho có mức "giữ N món", thiếu thì tự chở tới. → Tự nhập hàng khi còn ≤ 5.
- **Antimatter Dimensions, Trimps:** nút mới chỉ hiện khi tới mốc, lần đầu có thẻ giải thích. → Nút Chuỗi hiện ở 3 sao, có thẻ "Mở chuỗi spa".
- Kittens Game và Evolve dành cho phần 2 (làm lại từ đầu).

## 7. Người chơi thấy gì

### 7.1 Mở chuỗi (lô A)

- Tiệm gốc đạt **3★ hạng tiệm** thì thanh dưới có thêm nút thứ năm **Chuỗi** (hình ghim bản đồ). Năm nút chia đều bề ngang. **(em đề xuất)**
- Lần đầu: thẻ vàng **"Mở chuỗi spa"** "Tiệm đạt 3 sao. Giờ chủ tiệm mở được chi nhánh ở nơi khác." Bàn tay chỉ vào nút Chuỗi cho tới khi bấm.
  - Thẻ xếp sau thẻ chấm tháng của ngày lên 3 sao.
  - Tiệm cũ đã có 3 sao trở lên thì thẻ hiện một lần khi mở game.

### 7.2 Bản đồ (lô A)

- Bấm Chuỗi mở **bản đồ** phủ cả màn hình, tiệm dừng như mọi bảng khác.
- **Hình:** Sài Gòn vẽ phẳng kiểu tranh: sông cong, vài con đường, hàng cây, biển ở góc dưới phải. Bốn ghim:
  - **Tiệm gốc** ở giữa, biển tên tiệm;
  - **Phố cổ** gần sông;
  - **Khu cao cấp** cạnh mấy tòa nhà cao;
  - **Bãi biển** cạnh biển.
- **Ghim theo trạng thái:**
  - chưa đủ sao: xám, ổ khóa, "Cần 4★ · 8.000.000 đ";
  - đủ sao, chưa mở: màu, giá;
  - đã mở: biển tên nhỏ, lãi hôm nay;
  - chủ tiệm đang ở đâu thì ghim đó có đầu chủ tiệm.
  - Tiệm vắng chủ không có thợ: ghim có biển nhỏ "Tạm nghỉ".
- **Chạm ghim** mở bảng dưới:
  - tên nơi, hình nhỏ khách riêng và một dòng về họ;
  - "Giá dịch vụ ×1,2";
  - với tiệm đã mở: hôm nay đã làm N khách, M khách bỏ về, lãi; nhân viên "2/3 thợ · 1/1 lễ tân"; món kho sắp hết;
  - nút **"Mở chi nhánh · 5.000.000 đ"** (thiếu tiền thì mờ, ghi "Thiếu …"), hoặc **"Đến tiệm"**, hoặc dòng "Chủ tiệm đang ở đây".
- **Đổi tiệm tới ngay,** có một màn chuyển ngắn (cửa kéo, tên nơi). Chủ tiệm đứng sau quầy tiệm mới.
- **Đổi tiệm khi đang đi phục vụ một khách** thì khách đó quay về chờ như cũ.
- Đến tiệm khác mà tiệm đang ở **không có thợ và còn khách**: bảng ghi thêm "N khách đang chờ sẽ về, không đánh giá". Vẫn đi được. Lúc chủ tiệm đi, những khách đó ra về nhẹ nhàng (mục 7.5). **(em đề xuất)**
- **Sau giờ đóng cửa (20:00) không đổi tiệm được.** Nút ghi "Đã đóng cửa".

### 7.3 Chi nhánh mới (lô A)

- Mở xong, chủ tiệm vẫn ở chỗ cũ. Nút đổi thành "Đến tiệm".
- **Phòng:** 1 tầng, cùng cỡ 13×18 như tiệm gốc. Nền và tường theo nơi (mục 7.4).
  - Bày sẵn như tiệm gốc ngày đầu: quầy lễ tân, ghế chờ, giường gội, tủ khăn.
  - Thêm một món trang trí riêng của nơi, có điểm đẹp như món trang trí thường.
- **Tên trên thanh trên:** "{tên tiệm} · Bãi biển". Sao đánh giá và điểm đẹp là của tiệm đó. Tiền là túi tiền chung.
- **Chưa có nhân viên.** Ứng viên có ngay từ lúc mở. Kho có sẵn 20 món mỗi loại như tiệm mới.
- **Dịch vụ:** tiệm gốc đã mở món nào thì chi nhánh có món đó, chỉ cần kê giường. Không trả tiền mở món lần nữa.
- **Thanh dưới ở chi nhánh:** Xây, Nhân viên, Dịch vụ (cả Kho), Chuỗi. Không có Nhiệm vụ. Bàn pha công thức chỉ có ở tiệm gốc.
- Chủ tiệm làm được mọi việc như ở tiệm gốc: chạm khách để phục vụ bằng mini-game, kê đồ, thuê người, cho đi học, nhập hàng.

### 7.4 Ba nơi và khách riêng (Bãi biển: lô A; hai nơi kia: lô B)

| Nơi | Mở khi tiệm gốc | Giá mở | Khách riêng | Lượng khách | Giá dịch vụ | Món trang trí riêng |
|---|---|---|---|---|---|---|
| Bãi biển | 3★ | 5.000.000 đ | Khách du lịch | ×1,2 | ×1,0 | ván lướt sóng |
| Phố cổ | 4★ | 8.000.000 đ | Khách Tây ba lô | ×1,0 | ×1,2 | dây đèn lồng Hội An |
| Khu cao cấp | 5★ | 12.000.000 đ | Quý bà | ×0,8 | ×1,6 | chậu lan hồ điệp |

**(em đề xuất cả bảng)**

- **Nền và tường:**
  - Bãi biển: sàn ván gỗ màu cát, tường trắng có sọc xanh biển, cửa sổ nhìn ra biển, vài vỏ sò.
  - Phố cổ: sàn gạch tàu, tường vàng Hội An, xà gỗ nâu đậm, đèn lồng lụa nhiều màu.
  - Khu cao cấp: sàn đá cẩm thạch trắng vân xám có viền vàng, tường kem có nẹp vàng, cửa kính nhìn ra nhà cao tầng.
- **Khách riêng:**
  - **Khách du lịch:** nón rơm rộng vành, kính râm, áo hoa. Ít kiên nhẫn hơn một chút, tip rộng tay mọi mức sao, thích tắm bùn, đá nóng, massage, chấm dễ.
  - **Khách Tây ba lô:** tóc vàng, ba lô to, mũ lưỡi trai. Rất kiên nhẫn, tip theo sao (ít khi 1 sao, nhiều khi 3 sao), thích massage, xông lá, gội đầu, chấm vừa.
  - **Quý bà:** tóc búi, chuỗi ngọc trai, túi xách. Ít kiên nhẫn, chỉ tip khi được 2–3 sao và tip rất đậm ở 3 sao, thích mặt nạ, tắm bùn, đá nóng, chấm khó, mỗi đánh giá tính hai lần, mini-game bản khó, đi chậm.
- **Khách mỗi nơi** là khách riêng của nơi đó cộng vài kiểu cũ (số ở mục 10). Không có người nổi tiếng, khách quen hay VIP ở chi nhánh.
- Kiểu khách riêng không bao giờ đến tiệm gốc.

### 7.5 Các tiệm chạy cùng nhau (lô A)

- **Một đồng hồ, một túi tiền.** Mọi tiệm cùng ngày, cùng giờ. Mở bảng hay chơi mini-game thì mọi tiệm cùng dừng.
- **Tiệm vắng chủ do nhân viên làm:** khách vào, chờ thợ rảnh, được làm, trả tiền vào túi chung. Chờ quá lâu thì bỏ về như ở tiệm gốc.
- **Tiệm vắng chủ mà không có thợ thì "Tạm nghỉ":** không có khách mới. **(em đề xuất)**
  - Khách còn trong tiệm lúc đó **ra về nhẹ nhàng:** không đánh giá, không tính là bỏ về, không giận, không trả tiền.
  - Xảy ra khi chủ tiệm rời một tiệm không có thợ (đổi tiệm, hay thẻ đóng cửa 20:00), và khi thợ cuối cùng của tiệm vắng chủ nghỉ việc.
  - Nhờ vậy tiệm mới chưa thuê ai không bị đánh giá xấu oan.
- **Lời nhắc của tiệm vắng chủ không hiện** (kho sắp hết, nhân viên lên cấp…). Xem số trên bản đồ và trong tổng kết.

### 7.6 Tự nhập hàng (lô A)

- **Tiệm vắng chủ tự nhập hàng:** món nào một dịch vụ đang mở cần mà còn ≤ 5 thì tiệm tự mua 20 món với giá thường, ngay lúc đó.
- Chỉ mua khi túi tiền đủ giá món. Không đủ thì thôi, tiệm có thể hết món đó.
- Tiệm có chủ tiệm thì nhập tay như cũ.
- Tiền nhập tính vào "nhập hàng" của tiệm đó trong tổng kết.

### 7.7 Sáng và tối (lô A)

- **Mỗi sáng chủ tiệm mở cửa ở tiệm gốc.** Mọi lời chào sáng, lễ, nhiệm vụ, sự kiện hôm nay hiện ở tiệm gốc như cũ. **(em đề xuất)**
- **Đến 20:00 mà chủ tiệm đang ở chi nhánh:** xong khách đang làm (nếu có), hiện thẻ "Đóng cửa rồi. Chủ tiệm về tiệm gốc kiểm sổ." với nút [Về tiệm gốc]. Bấm là về tiệm gốc. Khách còn lại ở chi nhánh do thợ làm nốt; chi nhánh không có thợ thì khách ra về nhẹ nhàng (mục 7.5). **(em đề xuất)**
- **Tổng kết luôn ở tiệm gốc,** khi mọi tiệm đã hết khách. Tiệm nào còn khách thì máy chạy nhanh cho xong trước khi hiện tổng kết.
- Bảng tổng kết giữ nguyên phần của tiệm gốc, thêm khối **"Cả chuỗi hôm nay"** (chỉ khi có chi nhánh):
  - mỗi tiệm một dòng: tên nơi và lãi;
  - dòng "Tổng" cộng lãi cả chuỗi.

### 7.8 Ở tiệm gốc mới có (lô A)

- Chỉ tiệm gốc có: nhiệm vụ, huy hiệu, hạng tiệm và Spa của năm, khách quen và sổ khách, VIP, sự kiện (thanh tra, Mi Mi, đối thủ, cúp điện), lễ, bàn pha công thức, các gợi ý hướng dẫn.
- Nhiệm vụ, huy hiệu và hạng tiệm chỉ đếm khách và tiền của tiệm gốc. Huy hiệu đọc túi tiền (như "Triệu đầu") thì đọc túi chung.
- **Khách VIP đến tiệm gốc lúc chủ tiệm ở chi nhánh:** thẻ vàng có nút: "{tên VIP} đã đến tiệm gốc, chỉ chủ tiệm mới làm được." [Về ngay] [Ở lại]. Ở lại thì VIP chờ theo luật cũ, chờ lâu thì về. **(em đề xuất)**
  - Lúc chủ tiệm vắng, tiệm gốc **không giữ giường cho VIP**, để thợ vẫn làm khách khác. Chủ tiệm về thì giữ lại như cũ.
  - Lúc chủ tiệm vắng, **khách quen không chờ chủ tiệm** (bỏ khoảng chờ `REGULAR_OWNER_MS`), thợ làm luôn.
- **Thẻ của tiệm gốc chờ chủ tiệm về mới hiện**, theo đúng thứ tự: huy hiệu, nhiệm vụ xong, nhiệm vụ lễ và quà lưu niệm, thanh tra, Mi Mi đăng video, thắng đối thủ, tim và quà của khách quen, gợi ý công thức. Thưởng vẫn trả ngay lúc xảy ra. **(em đề xuất)**
  - 20:00 chủ tiệm luôn về tiệm gốc, nên thẻ không mất trong ngày.
  - Tắt game lúc thẻ còn chờ thì mất thẻ, thưởng vẫn giữ (giống luật cũ).
- Lời nhắc ngắn của tiệm gốc lúc vắng (đối thủ, cúp điện, kho…) không hiện. Dòng "hôm nay" vẫn đúng khi về.

### 7.9 Chuyển nhân viên (lô C)

- Khi có ít nhất một chi nhánh, thẻ nhân viên có nút **"Chuyển tiệm"**.
- Bấm mở danh sách các tiệm khác. Tiệm hết chỗ cho vai đó thì mờ, ghi "Hết chỗ" (đếm cả người sắp chuyển tới).
- Chọn xong, thẻ nhân viên có dải "Mai sang Bãi biển" và nút "Ở lại" để hủy.
- **Người đó làm hết hôm nay ở tiệm cũ, sáng mai đi vào cửa tiệm mới** như mọi người. Giữ tên, hình, lương, chỉ số, chuyên môn, tính cách, cấp, kết quả học đêm.
- Người đã bị cho nghỉ thì không chuyển được. Cho nghỉ người sắp chuyển thì hủy chuyển.

### 7.10 Tiền khi vắng cho cả chuỗi (lô C)

- Mỗi tiệm tính tiền khi vắng theo luật cũ của Đợt 3, với số liệu của chính tiệm đó, rồi cộng lại.
- Thẻ "Chủ tiệm về rồi" ghi tổng, thêm dòng "Cả N tiệm" khi có chi nhánh được trả. Hình trên thẻ vẫn lấy nhân viên tiệm gốc.
- Trước lô C, tiền khi vắng chỉ tính tiệm gốc.

### 7.11 Âm thanh

- Mở chi nhánh: tiếng chúc mừng của thẻ vàng.
- Đổi tiệm: tiếng chuông cửa có sẵn.
- Không thêm âm mới. **(em đề xuất)**

## 8. Luật trong code

### 8.1 Chuỗi (lô A)

- `PlaceId = 'beach' | 'oldTown' | 'uptown'`, số trong `PLACES` ở `src/config.ts`.
- `SpaSim` có thêm `place: PlaceId | null` (null là tiệm gốc) và `ownerHere: boolean` (không lưu, suy từ chuỗi).
- Lớp mới `Chain` (`src/sim/chain.ts`) giữ `main: SpaSim`, `branches: SpaSim[]`, `at: PlaceId | null` (chủ tiệm ở đâu). Có:
  - `active()`: tiệm chủ tiệm đang ở;
  - `advance(ms)`: chạy tiệm đang ở, rồi chạy các tiệm khác đúng bằng chừng ấy thời gian trong game (mục 8.2);
  - `openProblem(place)`, `open(place)`;
  - `goProblem(place)`, `goTo(place)`;
  - `startDay()`;
  - `toSave()`.
- `SpaScene` vẽ và điều khiển `chain.active()` như `sim` hiện giờ. `SaveSession` ghi `chain.toSave()`.
- Đổi tiệm: lưu, rồi dựng lại cảnh cho tiệm mới (builder chọn khởi động lại cảnh hay tải lại trang, mục 11).

### 8.2 Đồng hồ chung (lô A)

- Tiệm chạy ngầm chỉ tiến khi tiệm đang ở thật sự tiến: đo bằng **thời gian chạy (ms)** mà `step` của tiệm đang ở đã chạy, không đo bằng phút (đồng hồ dừng ở 20:00 nhưng khách vẫn đi ra sau đó). Chạy mỗi tiệm khác đúng chừng ấy ms, cùng bước `STEP_MS`.
- Tiệm đang ở đứng yên (bảng, mini-game, hết ngày) thì tiệm khác cũng đứng yên.
- Khi tiệm gốc đã hết ngày mà chi nhánh còn khách: chạy nhanh chi nhánh cho tới khi hết ngày (có trần an toàn), rồi mới hiện tổng kết.
- `chain.startDay()`: tiệm gốc `startDay()` trước, rồi từng chi nhánh, rồi `at = null`.

### 8.3 Túi tiền chung (lô A)

- Chỉ có một số tiền cho cả chuỗi. Mọi khoản thu chi ở chi nhánh (tiền khách, tip, lương, nhập hàng, mua đồ, thuê người, học) đi vào và ra túi đó.
- Gợi ý: một đối tượng ví chung, `SpaSim.money` thành get/set qua ví đó, để `this.money += …` cũ chạy y nguyên.
- `DayStats` vẫn riêng từng tiệm, để tổng kết tách được lãi từng tiệm.

### 8.4 Tiệm vắng chủ (lô A)

- `ownerHere === false`:
  - chủ tiệm không vẽ, không đi, không nhận việc, `tapTile` không làm gì;
  - khi chủ tiệm rời đi, việc đang đi làm bị hủy, khách quay về chờ;
  - **không có khách mới khi không có thợ nào** (thợ đang nghỉ việc không tính);
  - ra về nhẹ nhàng (mục 7.5): khách rời tiệm như khách đã xong, không gọi `loseCustomer`, không review, không đếm `walkedAway`, `angry` hay `lost`;
  - không giữ giường cho VIP (`vipHeld` chỉ khi `ownerHere`), khách quen không có khoảng chờ chủ tiệm;
  - tự nhập hàng: ngay sau khi một món bị lấy ra (`sendToBed`), nếu món đó ≤ `LOW_STOCK`, có dịch vụ đang mở dùng nó, và túi tiền ≥ giá, thì gọi `restock(item)`;
  - sự kiện của chi nhánh vắng chủ bỏ đi hết;
  - sự kiện của tiệm gốc lúc chủ vắng: VIP đến thì hiện thẻ ngay ở chi nhánh; các sự kiện có thẻ hay phần thưởng (mục 7.8) giữ lại theo thứ tự, đưa cho `SpaScene.handle` khi tiệm gốc là tiệm đang ở; lời nhắc ngắn bỏ đi.
  - Hàng chờ này không được mất khi đổi tiệm (giữ `Chain` trong bộ nhớ qua lần dựng lại cảnh, hoặc lưu hàng chờ vào ô lưu).
- Khi chủ tiệm tới: đặt ở `OWNER_START` như đầu ngày.

### 8.5 Chi nhánh khác tiệm gốc ở đâu (lô A)

- Chi nhánh (`place !== null`) không bao giờ:
  - hẹn VIP, lên lịch sự kiện, mời khách quen, Mi Mi;
  - mở nhiệm vụ (`questsOpen()` false), chấm huy hiệu, chấm hạng, Spa của năm;
  - có lễ (`festivalServiceToday()` null, không có khách lễ);
  - hiện gợi ý hướng dẫn: mọi `HintId` coi như đã xong;
  - mở tầng (`maxFloors()` là 1);
  - pha công thức.
- `services` của chi nhánh luôn bằng `services` của tiệm gốc: chép lúc mở, mỗi sáng, và khi tiệm gốc mở món mới.
- `ownerLook`, `ownerOutfit`, `shopName`, `profileDone` lấy theo tiệm gốc.
- Chi nhánh mới: `SPA_LAYOUT_1A` với vỏ của nơi đó, cộng món trang trí riêng đặt sẵn ở một ô trống cố định; `stock` theo `STOCK_START`; bốc ứng viên ngay; `untilArrivalMs = FIRST_ARRIVAL_MS`; `day` và phút bằng tiệm gốc.

### 8.6 Kiểu khách và giá (Bãi biển: lô A; hai nơi kia: lô B)

- `CustomerKind` thêm `tourist` (lô A), `backpacker` và `lady` (lô B), số trong `KINDS` (mục 10), `fromDay` 1, `weight` 0 để không bao giờ đến tiệm gốc.
- `drawKind` nhận thêm bảng trọng số của nơi: ở chi nhánh bốc theo `PLACE_KINDS[place]`, không có lượt người nổi tiếng. Ở tiệm gốc giữ nguyên từng phép bốc.
- "Lượng khách ×1,2" nghĩa là khoảng cách giữa hai khách đến chia cho `PLACES[place].arrival`. Không có hệ số sự kiện.
- Giá ở chi nhánh: giá món × `PLACES[place].priceFactor`, làm tròn tới 1.000 đ. Không nhân hạng, không giá lễ. Tip tính trên giá đó.
- Đồ mang theo: thêm vào `WORN` các mảnh mới trong `src/art/chibi.ts`:
  - `tourist`: nón rơm rộng vành (trên tóc), kính râm (trên mặt), áo hoa (trên người);
  - `backpacker`: mũ lưỡi trai (trên tóc), ba lô to (trên người); tóc vàng là màu tóc cố định của kiểu này;
  - `lady`: tóc búi (trên tóc), chuỗi ngọc trai và túi xách (trên người).

### 8.7 Chuyển nhân viên (lô C)

- `Staff` thêm `moveTo: PlaceId | 'main' | null`.
- `chain.startDay()`: trước khi nhân viên đi vào, người có `moveTo` rời tiệm cũ và vào tiệm mới với mã mới của tiệm mới, giữ mọi thứ khác. `moveTo` về null.
- Kiểm chỗ: số người cùng vai ở tiệm đích, cộng người sắp tới, nhỏ hơn `staffCap`.

### 8.8 Tiền khi vắng (lô C)

- Mỗi chi nhánh có `AwayBook` riêng, đóng ngày như tiệm gốc.
- `chain.comeBack(ms)` gọi `comeBack` của từng tiệm, cộng tiền, trả một `AwayResult` có thêm số tiệm được trả. Lời nhắc một lần ("tip") vẫn chỉ theo tiệm gốc.

### 8.9 Save và tiệm cũ

- **v23 (lô A):**
  - `SaveData.place: PlaceId | null`;
  - `SaveData.chain: { at: PlaceId | null; told: boolean; branches: SaveData[] } | null`, chỉ tiệm gốc có;
  - `told` là đã hiện thẻ "Mở chuỗi spa".
  - Ô lưu v22 trở về trước: `place = null`, `chain = { at: null, told: false, branches: [] }`.
- **v24 (lô B):** chỉ để ô lưu có kiểu khách mới không bị bản cũ đọc nhầm (bản cũ báo "quá mới").
- **v25 (lô C):** `Staff.moveTo`, `AwayBook` của chi nhánh (chi nhánh từ v23–v24 nhận sổ trống).
- **Sửa ô lưu hỏng:**
  - chi nhánh trùng nơi: giữ cái đầu;
  - chi nhánh lệch ngày hay phút: đặt theo tiệm gốc;
  - `at` trỏ tới nơi chưa mở: về tiệm gốc;
  - chi nhánh có `chain` hay `place` null: sửa lại;
  - tiền của chi nhánh trong ô lưu bỏ qua, túi tiền là tiền của tiệm gốc.
- Một ô lưu đủ ba chi nhánh khoảng 40 KB, mã lưu vẫn nén như cũ.

## 9. Ba lô

### Lô A: chuỗi và Bãi biển (save v23)
- `Chain`, đồng hồ chung, túi tiền chung, tiệm vắng chủ, tự nhập hàng.
- Nút Chuỗi, thẻ "Mở chuỗi spa", bản đồ, mở chi nhánh, đổi tiệm.
- Bãi biển: vỏ phòng, ván lướt sóng, khách du lịch.
- Sáng ở tiệm gốc, thẻ đóng cửa, tổng kết cả chuỗi.
- Thẻ VIP khi vắng, thẻ sự kiện tiệm gốc chờ chủ về.

### Lô B: Phố cổ và Khu cao cấp (save v24)
- Hai vỏ phòng, dây đèn lồng, chậu lan, khách Tây ba lô, quý bà.
- Ghim mở theo 4★ và 5★.

### Lô C: người và tiền khi vắng (save v25)
- Chuyển tiệm trên thẻ nhân viên.
- Tiền khi vắng cả chuỗi.

## 10. Số khởi đầu (`src/config.ts`)

```ts
export const CHAIN_FROM_STARS = 3
export const PLACES = {
  beach:   { stars: 3, price: 5_000_000,  arrival: 1.2, priceFactor: 1.0 },
  oldTown: { stars: 4, price: 8_000_000,  arrival: 1.0, priceFactor: 1.2 },
  uptown:  { stars: 5, price: 12_000_000, arrival: 0.8, priceFactor: 1.6 },
}
export const PLACE_KINDS = {
  beach:   { tourist: 5, student: 2, office: 1, picky: 1 },
  oldTown: { backpacker: 4, elder: 3, student: 1, picky: 1 },
  uptown:  { lady: 4, office: 3, picky: 2 },
}
// KINDS (src/sim/customers.ts):
// tourist:    patience 0.9, tip [1.5, 1.5, 1.5], prefers mud, stone, massage,  grading easy,   reviews 1, speed 4,   hard false
// backpacker: patience 1.3, tip [0.5, 1, 2],     prefers massage, steam, shampoo, grading normal, reviews 1, speed 5, hard false
// lady:       patience 0.7, tip [0, 1, 4],       prefers mask, mud, stone,      grading harsh,  reviews 2, speed 3.5, hard true
```

- Tự nhập hàng dùng `LOW_STOCK` (5), `RESTOCK_AMOUNT` (20), `RESTOCK_PRICE` có sẵn.
- Chi nhánh: 1 tầng, tối đa 3 thợ và 1 lễ tân.

## 11. Để builder quyết

- Đổi tiệm bằng khởi động lại `SpaScene` từ ô lưu vừa ghi hay tải lại trang. Cần: không trả tiền khi vắng, không phát lại thẻ, chuyển cảnh dưới 1 giây trên máy tính.
- Ô trống đặt món trang trí riêng của mỗi nơi, miễn là không chặn lối đi và không đè chỗ đứng.
- Vẽ chi tiết vỏ phòng, ghim và bản đồ, theo bản phác.
- Cách giữ thẻ sự kiện của tiệm gốc chờ chủ về (một hàng chờ như `heldAway` là đủ).
- Trần an toàn khi chạy nhanh chi nhánh cuối ngày.

## 12. Anh thử trên iPhone sau khi lên

- **Lô A:**
  - Tiệm 3 sao: thấy thẻ "Mở chuỗi spa", bấm Chuỗi, mở Bãi biển, đến tiệm, thuê thợ, kê thêm giường.
  - Về tiệm gốc, chơi tiếp một lúc, xem bản đồ còn đúng số của Bãi biển không.
  - Ở chi nhánh tới 20:00, xem thẻ đóng cửa và tổng kết cả chuỗi.
  - Máy có chạy mượt khi có chi nhánh không.
  - Giá 5.000.000 đ đắt hay rẻ.
- **Lô B:** mở Phố cổ (4★) và Khu cao cấp (5★), xem khách Tây và quý bà.
- **Lô C:** chuyển một thợ giỏi sang chi nhánh; tắt game hơn 10 phút rồi mở lại, xem tiền khi vắng cả chuỗi.
