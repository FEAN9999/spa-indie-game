# Nâng cấp con phố

- Ngày: 2026-11-01
- Trạng thái: chồng yêu đã duyệt cả 8 điểm trên bản phác (2026-11-01, "Anh duyệt cả 8 điểm, viết spec đi em"). Tài liệu này chờ chồng yêu duyệt.
- Thuộc: spec chung `2026-10-25-spa-game-design.md`. Nối tiếp nhà hàng `2026-10-31-nha-hang-design.md` (dãy phố 74 cột) và ngày đêm `2026-10-31-ngay-dem-design.md`.
- Lý do: chồng yêu thấy "game càng về cuối càng hết thứ để làm, tiền dư không biết làm gì" (spec Phây). Trong 14 ý em đưa ra ngày 2026-11-01, chồng yêu chọn làm bản phác ý số 7, "Nâng cấp cả con phố".
- Bản phác bấm thử (chồng yêu duyệt cả 8 điểm): https://claude.ai/artifact/WDbjYXv15nWBdnWEzyZr49

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** hay **(chồng yêu duyệt)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu, chỉnh sau khi chơi thử.

## 1. Chồng yêu muốn gì

- **Tiền dư đổi thành một con phố đông vui trước tiệm**, nhìn thấy ngay trên màn hình chính. **(chồng yêu chọn)**
- **Tám điểm trên bản phác** **(chồng yêu duyệt cả 8)**:
  1. Món nằm trên vỉa hè và bên kia đường. Lòng đường rộng ra, bản đồ dài xuống.
  2. Mỗi món có chỗ cố định, chạm dấu + trên phố để mua. Chip "Phố sầm uất" mở cả danh sách.
  3. Tám món, giá như bản phác (số tạm, tổng 44.900.000 đ).
  4. Một thanh "Phố sầm uất" chung: đủ 30 điểm thì khách tới nhanh hơn 15% ở cả spa và nhà hàng.
  5. Phố mở sau khi mua nhà hàng.
  6. Ban đêm đèn đường và đèn lồng chợ đêm sáng từ 18:30. Chợ đêm dọn hàng từ 17:00, ban ngày phủ bạt.
  7. Người qua đường và xe buýt đông dần theo độ sầm uất, chỉ để nhìn.
  8. Chỉ tiệm chính ở đợt này.

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Cuối game có chỗ tiêu tiền dư mà thấy kết quả ngay trên màn hình chính.
- Có một đích dài: gom đủ 30 điểm sầm uất.
- Hai tiệm sống trên một con phố đông dần: người đi bộ, xe buýt, công viên, chợ đêm.
- Bạn bè ghé tiệm thì thấy phố của mình, để khoe.

### Chưa làm ở đợt này
- Con phố ở chi nhánh. **(chồng yêu duyệt, điểm 8)**
- Mỗi món một tác dụng riêng (cách C ở điểm 4, chồng yêu không chọn).
- Nâng một món lên nhiều cấp, ví dụ đèn đường cấp 2.
- Bán lại món đã mua.
- Lễ hội đường phố theo lễ trong game.
- Người qua đường vào tiệm; khách quen ngồi ghế đá hay ghé xe bánh mì.
- Bài Phây, nhiệm vụ hay huy hiệu về con phố. **(em đề xuất: để sau)**
- Món trên vỉa hè hiện ở tầng 2 và sân thượng (xem 4.3). **(em đề xuất)**

### Điều cấm (dính là coi như hỏng)
- **Save cũ mất hay đổi gì.** Mở save hiện tại bằng bản mới thì mọi thứ y như cũ, con phố chưa có món nào.
- **Game chạy khác đi khi chưa mua món nào.** Khách tới, tiền và `same-draws` không đổi. Trước khi mua nhà hàng thì cả hình cũng không đổi: bản đồ không dài thêm, không có dấu +, không có chip.
- **Rút thêm số ngẫu nhiên** từ `rng` của tiệm hay của nhà hàng.
- **Chạm nhầm:**
  - vuốt hay chụm hai ngón mà game hiểu thành chạm mua;
  - chạm vào phố mà mở bảng mua căn nhà phía trên;
  - dấu + nhận chạm khi đang có thẻ hay bảng che.
- **Món chắn đường:** món trên phố chắn lối người đi bộ hay xe đạp của cô chủ, hoặc đè lên cửa hai tiệm hay mái hiên nhà hàng.
- **Sai tiền:** trừ tiền mà không có món, có món mà không trừ tiền, hay mua một món hai lần.
- **Chậm máy:** phố đông người và xe buýt làm giật trên iPhone (đo bằng `?perf`).
- **Màn hình lúc mở game hay đầu ngày khác bây giờ.** Vẫn phải là cỡ thường, giữa tiệm cũ, tầng 1, mép trên bản đồ ở chỗ cũ.

## 3. Hiện giờ (cho người làm)

Đọc ở origin/master f3425d1, save v41.

**Tên đã có người dùng**
- `Street` (`src/sim/street.ts`) là cô chủ đi giữa spa và nhà hàng; `chain.street` giữ nó. `src/view/street.ts` là toạ độ dãy phố. `src/view/strip.ts` là thanh vị trí.
- Phần mới phải đặt tên khác. Em đề xuất `bustle` ("sầm uất"): `src/sim/bustle.ts`, `src/view/bustle.ts`, `BustleLayer`.

**Dãy phố và bản đồ**
- Dãy phố có 74 cột. Khối spa là 37 cột: căn chính cột 12–24, cửa cột 18. Khối nhà hàng lệch sang phải 37 cột (`RESTAURANT_X0 = SHOP_COLS = 37`): căn chính cột 49–61, cửa cột 55.
- Toạ độ thế giới của cột phố `s` là `MAP_X + s × TILE`. Đây cũng là `restaurantX(s − 37)` trong `src/view/street.ts`.
- Mỗi texture (phòng, căn nhà, tầng, nhà hàng) tự vẽ phần phố dưới chân nó. Phần phố cao `STREET_TILES = 2` hàng: vỉa hè 1,2 hàng, rồi lòng đường 0,8 hàng, vạch đứt ở `rows + 1.6`. Xem `street()` trong `src/art/room.ts` (dòng 85). Tầng 2 vẽ ban công rồi lòng đường ở `rows + 1.88` (`src/art/floors.ts`).
- `MAP_VIEW` (`src/view/camera.ts`) là vùng bản đồ: từ y 210, cao `(FLOOR_ROWS + STREET_TILES) × TILE` = 1.560 px, tới hết lòng đường. Canvas là 1080 × 2160.
- `mapRect()` của `SpaScene` (dòng 740) lấy `streetBounds(...)` ở tiệm chính và `mapBounds(...)` ở chi nhánh. Khi bounds đổi thì gọi `cam.setBounds`.
- `minZoom` chỉ xét chiều ngang. Bản đồ cao hơn vùng xem thì vuốt dọc được (`clampView`).
- Đầu ngày, `cam.jump({ zoom: 1, cx: 540, cy: 990 })` (dòng 1268) đặt mép trên bản đồ ở y 210, đúng như cần.
- Lúc mở game, `cam.jump` ở dòng 339 không đặt `cy`, nên `cy` lấy giữa bounds khi dựng camera. Bounds cao thêm 5 hàng thì lúc mở game màn hình sẽ trượt xuống khoảng 2,5 hàng. Phải đặt `cy: 990` ở đó.

**Chạm**
- Thứ tự xử lý chạm trên bản đồ trong `SpaScene` (dòng 2340–2385):
  1. vật có `setInteractive` dưới ngón tay (thú cưng) nhận chạm trước, rồi dừng;
  2. đang ghé tiệm bạn thì dừng (`if (this.visit) return`, dòng 2350);
  3. mái căn rao bán của nhà hàng, rồi nhà hàng, rồi mái căn rao bán của spa;
  4. khách và ô sàn.
- `saleAt` và `restaurantSaleAt` chỉ xét `w.x`. Vì vậy hiện giờ chạm ở vỉa hè hay lòng đường ngay dưới một căn rao bán cũng mở bảng mua căn đó.
- Thẻ mua dùng `this.choose(card, cb)` như `offerRestaurantHouse` (dòng 1489). `ChoiceText` (`src/view/chain.ts`) có `kicker`, `title`, `lines`, `buttons` và `figure?`. `figure` chỉ có VIP, ngôi sao và chủ tiệm.

**Khách tới**
- Spa (`src/sim/spa.ts` dòng 1670): `arrivalGapMs(arrivalIntervalMs(rating) × dayEase × beautyArrivalFactor(beauty) × serviceArrivalFactor(...) × arrivalFactor(), rng())`.
- `arrivalFactor()` của tiệm chính là `eventArrivalFactor()`: lễ, ngày hot, đẩy bài Phây.
- `beautyArrivalFactor` (`src/sim/economy.ts`) đi từ 1 ở độ đẹp gốc xuống 0,8 (`BEAUTY_MAX_SPEEDUP = 0.2`).
- Nhà hàng (`src/sim/restaurant.ts` dòng 658): khách đi đường tới theo `arrivalGapMs(dinerGapMs(minutes), rng())`. Khách spa sang ăn (`walkOver`) không đi theo khoảng cách này.
- `RestaurantSim.host` là tiệm chính.

**Chuỗi, nhà hàng, tiền**
- `Chain.buyRestaurant()` kiểm `restaurantProblem()` (`'owned' | 'day' | 'money'`), trừ `main.money`, rồi `wire(...)`. `chain.restaurant !== null` nghĩa là đã mua nhà hàng.
- Túi tiền chung là `chain.main.money`.

**Ban đêm**
- `daylight(minutes)` (`src/view/daylight.ts`) cho màu phủ theo giờ, và `lamps` tăng từ 0 lên 1 trong 18:30–19:00.
- `RoomView.setHouses` đặt hai lớp `night` (ban đêm) và `dark` (cúp điện) rộng bằng `light`, cao `room.height`, tức tới hết lòng đường cũ.
- `RoomView.setDaylight` bật các quầng sáng `addGlow(...)` (độ sâu `LAMP_DEPTH`, hoà kiểu ADD). Đèn tắt khi cúp điện.
- `LAMPS` (`src/view/lamps.ts`) ghi chỗ đèn trên từng texture.

**Save**
- `SAVE_VERSION = BRANCH_FLOORS_SAVE_VERSION = 41`.
- Mỗi trường mới được sửa trong `parseShop` (`src/sim/save.ts`), theo kiểu `data.friends = isPlaceId(data.place) ? emptyFriends() : repairFriends(data.friends)` (dòng 601).
- Tăng số version thì sửa cả danh sách `raw.v !== …` trong `parseVersioned` (dòng 909), `withNewKeys` trong `tests/sim/save.test.ts` và test phiên bản.
- Ghé tiệm bạn gửi bản lưu của cả chuỗi (`openHouse(..., () => this.chain.toSave(), ...)`), nên trường mới đi theo bản lưu đó.

**Người đang đi trên phố**
- Khách spa đi bộ sang nhà hàng và xe đạp của cô chủ đi trên hàng vỉa hè ngay dưới cửa (`RestaurantLayer`, `walkerX`, `rideX`).
- `PetLayer` dùng `createRng(Date.now())` riêng của màn hình, không đụng rng của sim.

## 4. Thiết kế

### 4.1 Khi nào mở **(chồng yêu duyệt, điểm 5 và 8)**
- Phố mở khi tiệm chính đã mua nhà hàng (`chain.restaurant !== null`). Mua nhà hàng giữa ngày thì phố mở ngay.
- Chỉ ở tiệm chính. Cô chủ ở chi nhánh thì màn hình chi nhánh y như cũ.
- Lần đầu phố mở, hiện một thông báo: "Con phố trước tiệm đã mở · chạm dấu + để mua đồ cho phố". Lưu bằng `hints` như các gợi ý khác, nên chỉ hiện một lần. **(em đề xuất)**

### 4.2 Bản đồ dài xuống 5 hàng **(chồng yêu duyệt, điểm 1)**
- Khi phố mở, bản đồ tiệm chính dài thêm 5 hàng dưới lòng đường cũ, từ hàng 20 tới hàng 25:
  - hàng 20–21 là làn đường thứ hai. Lòng đường thành 1,8 hàng (19,2–21), vạch đứt dời xuống giữa lòng đường mới, khoảng hàng 20,1. **(em đề xuất)**
  - hàng 21–21,7 là vỉa hè bên kia đường, cùng màu và mạch với vỉa hè cũ;
  - hàng 21,7–25 là ba lô đất bên kia đường: nền đất trống và vài khóm cỏ.
- Bản phác ghi "dài xuống khoảng 4 ô", nhưng hình đã duyệt thực ra dài thêm 5 hàng (làn đường 1, vỉa hè 0,7, đất 3,3). Em lấy 5 hàng cho khớp hình. **(em đề xuất)**
- Bên kia đường vẽ ở mọi tầng, vì nó nằm ngoài tiệm. **(em đề xuất)**
- `MAP_VIEW` giữ nguyên. Ở cỡ thường, vuốt lên mới thấy bên kia đường, giống vuốt sang khi bản đồ rộng hơn màn hình. Thu nhỏ hết cỡ thì thấy cả dãy lẫn bên kia đường.
- Lúc mở game và đầu ngày: cỡ thường, giữa tiệm cũ, tầng 1, mép trên bản đồ ở y 210 như bây giờ (mục 3, sửa `cy` ở dòng 339).
- Lớp `night` và lớp `dark` phủ thêm 5 hàng mới, để cả dãy tối đều nhau.

### 4.3 Tám món và chỗ đặt **(chồng yêu duyệt, điểm 2 và 3)**

Mỗi món mua một lần và có chỗ cố định. Cột là cột phố `s` (mục 3). Chỗ đặt em đề xuất theo bản phác; người làm dời vài phần ô được nếu món đè lên biển, cửa, mái hiên hay lối đi.

| Món | Chỗ | Cột phố | Giá | Sầm uất |
|---|---|---|---|---|
| Hàng cây me (5 cây) | vỉa hè, sát mép đường | 14,5 · 23 · 34 · 44,5 · 59,5 | 1.200.000 đ | +2 |
| Đèn đường (4 cột) | vỉa hè | 12,8 · 28,6 · 40,5 · 52,5 | 1.800.000 đ | +2 |
| Ghế đá (2 ghế) | vỉa hè | 20,8 · 37 | 900.000 đ | +1 |
| Xe bánh mì Cô Hạnh | vỉa hè | 24,6–27,4 | 2.500.000 đ | +3 |
| Xe nước mía | vỉa hè | 29,6–32,8 | 2.500.000 đ | +3 |
| Trạm xe buýt | bên kia đường, trước spa | 13–23 | 6.000.000 đ | +5 |
| Công viên hồ sen | bên kia đường | 24–42 | 12.000.000 đ | +6 |
| Chợ đêm | bên kia đường, trước nhà hàng | 43–61 | 18.000.000 đ | +8 |
| **Cộng** | | | **44.900.000 đ** | **30** |

- Mọi món nằm trong cột 12–62. Phần phố này luôn thấy được khi đã có nhà hàng.
- Món vỉa hè đứng ở nửa dưới vỉa hè, sát mép đường. Nửa trên chừa cho người đi bộ và xe đạp của cô chủ.
- Chừa trống trước hai cửa: cột 17,5–19,5 và 54,5–56,5.
- Món vỉa hè chỉ hiện khi xem tầng 1, vì tầng 2 và sân thượng vẽ ban công đè lên vỉa hè. **(em đề xuất)**
- Xe bánh mì có Cô Hạnh đội nón lá đứng cạnh, vẽ liền trong hình xe, không phải nhân vật đi lại. Dòng mô tả không gọi cô là khách quen, vì người chơi có thể chưa gặp cô. **(em đề xuất)**
- Trạm xe buýt có mái che, ghế chờ, cột biển BUS, và ô vàng "XE BUÝT" kẻ trên làn đường mới.
- Công viên có lối đi, hồ sen có lá và hoa, bồn hoa, ghế đá, bốn cây, hai cột đèn nhỏ.
- Chợ đêm có bốn sạp. Mỗi sạp một mái sọc riêng màu (đất nung, xanh ngọc, vàng nghệ, hồng sen). Có dây đèn lồng giăng ngang và ghế nhựa đỏ, xanh.
- Vẽ theo bản phác và bảng màu game, viền nâu `#4A2E22`.

### 4.4 Dấu + và thẻ mua **(chồng yêu duyệt, điểm 2)**
- Món chưa mua có dấu + trên phố, giống chỗ giường trống trong tiệm: vòng tròn kem viền đứt, dấu + xanh ngọc.
  - Món có nhiều cái (cây, đèn, ghế đá): dấu + ở cái đầu tiên trong bảng (cột 14,5, 12,8 và 20,8). Các chỗ còn lại là vòng mờ, không có dấu +. Chạm chỗ nào cũng mở thẻ của món đó.
  - Ba lô đất: khung viền đứt quanh cả lô, dấu + giữa lô và nhãn "Tên · giá", ví dụ "Chợ đêm · 18 tr".
- Dấu + chỉ hiện khi xem tầng 1, phố đã mở và cô chủ đang ở tiệm chính. Ghé tiệm bạn thì không có dấu +.
- Chạm dấu + hay món đã mua thì màn hình trượt tới món đó và mở thẻ bằng `choose`:
  - kicker "Con phố", tiêu đề là tên món;
  - dòng 1 là mô tả món;
  - dòng 2 ghi điểm và tác dụng, ví dụ "Phố sầm uất +3 · khách tới nhanh hơn 1,5%";
  - hai nút "Mua · 2.500.000 đ" và "Để sau";
  - thiếu tiền thì thêm một dòng thiếu bao nhiêu, bấm Mua thì báo thiếu, như bảng mua nhà;
  - món đã mua thì có dòng "Tiệm đã có món này" và một nút "Đóng".
- Mua xong:
  - trừ tiền;
  - món hiện ra có hiệu ứng nảy, kèm tiếng `thud`;
  - lưu ngay (`saveNow`);
  - thông báo, ví dụ "Đã mua Xe nước mía · Phố sầm uất 12/30".
- Thẻ không bắt buộc có hình món, vì `ChoiceFigure` chưa có loại này. Người làm thêm được nếu dễ. **(em đề xuất)**

### 4.5 Chip "Phố sầm uất" và bảng Con phố **(chồng yêu duyệt, điểm 2)**
- Chip nằm ở góc trên bên trái vùng bản đồ, đối xứng với nhãn tên tiệm bên phải (`SHOP_LABEL`: y 234, cao 56). Chip ghi "Phố sầm uất 12/30" và có một thanh nhỏ.
- Chip hiện khi phố đã mở và cô chủ ở tiệm chính. Chip ẩn khi có thẻ hay bảng che, khi cô chủ ở chi nhánh và khi ghé tiệm bạn.
- Chạm chip mở bảng Con phố, gồm:
  - dòng "Phố sầm uất 12/30 · khách tới nhanh hơn 6%" và thanh tiến độ;
  - 8 hàng, mỗi hàng có tên, chỗ, điểm, và giá hay chữ "Đã có";
  - nút Đóng.
- Chạm một hàng thì đóng bảng, trượt tới món đó và mở thẻ của nó.
- Bảng mở và đóng như các bảng khác: che bằng `attention`, đóng thì `saveNow()`.

### 4.6 Phố sầm uất và khách tới **(chồng yêu duyệt, điểm 4)**
- Điểm sầm uất là tổng điểm các món đã mua, từ 0 tới 30.
- Hệ số nhân vào khoảng cách giữa hai khách:
  - `bustleArrivalFactor(score) = 1 − BUSTLE_MAX_SPEEDUP × score / BUSTLE_SCORE_MAX`;
  - `BUSTLE_MAX_SPEEDUP = 0,15`, `BUSTLE_SCORE_MAX = 30`;
  - 0 điểm cho đúng 1, 30 điểm cho 0,85.
- Hệ số này nhân vào hai chỗ:
  - khoảng cách giữa hai khách của tiệm chính, cùng biểu thức với `beautyArrivalFactor`;
  - khoảng cách giữa hai khách đi đường của nhà hàng: `dinerGapMs(...)` nhân hệ số.
- Không nhân vào chi nhánh, khách VIP, ngôi sao, khách quen tới theo giờ hay khách spa sang ăn.
- Không thêm lượt rút số ngẫu nhiên nào. Chưa mua món nào thì hệ số đúng bằng 1, nên `same-draws` giữ nguyên.
- Trong game ghi "khách tới nhanh hơn x%", với x = 0,5 × điểm. Ví dụ 12 điểm là 6%.

### 4.7 Ban đêm **(chồng yêu duyệt, điểm 6)**
- Đèn của phố sáng theo `daylight(minutes).lamps`, như đèn trong tiệm (sáng dần 18:30–19:00). Gồm đèn đường, đèn lồng chợ đêm, đèn trạm xe buýt, đèn công viên và đèn hai xe hàng.
- Cúp điện thì đèn phố cũng tắt, như đèn trong tiệm. **(em đề xuất)**
- Chợ đêm:
  - trước 17:00 sạp phủ bạt, có bảng "Chợ mở 17:00";
  - từ 17:00 tới hết ngày dọn hàng: mái sọc, hàng hoá, ghế nhựa.
- Giờ chợ tính thẳng từ phút trong ngày, không lưu.
- Quầng sáng dùng `addGlow` như đèn trong tiệm.

### 4.8 Người qua đường và xe buýt **(chồng yêu duyệt, điểm 7)**
- Người qua đường và xe buýt chỉ để nhìn: không vào tiệm, không nhận chạm, không lưu, không đụng sim. Dùng số ngẫu nhiên riêng của màn hình, `createRng(Date.now())` như `PetLayer`.
- Số người (em đề xuất, số tạm):
  - vỉa hè bên này: 2 + điểm/5 (làm tròn xuống), tối đa 8 người, đi ở nửa trên vỉa hè;
  - vỉa hè bên kia: 1 + điểm/10, khi đã có ít nhất một lô;
  - công viên: 2 người đi dạo trên lối đi;
  - chợ đêm: 6 người đi chợ từ 17:00.
- Phố đã mở mà chưa mua món nào thì vẫn có 2 người đi qua, như bản phác. Trước khi mua nhà hàng thì không có ai, để hình y như cũ. **(em đề xuất)**
- Xe buýt chạy trên làn mới từ trái sang phải. Xe dừng ở trạm 1,8 giây rồi đi, khoảng 15 giây ghé một lần. **(em đề xuất)**
- Người qua đường dùng hình chibi ghép bộ phận như khách, thu nhỏ 0,8. Không ai mặc áo xanh ngọc của chủ tiệm.
- Đo `?perf` trên iPhone ở 30 điểm, ban đêm, có chợ đêm. Chậm thì giảm số người trước, rồi mới bỏ hiệu ứng.

### 4.9 Ghé tiệm bạn
- Bản lưu gửi cho bạn có danh sách món, nên bạn ghé thấy được phố của mình: các món, đèn đêm, người qua đường. **(em đề xuất)**
- Khi đang ghé tiệm bạn thì không có dấu +, không có chip, chạm vào phố không làm gì.

### 4.10 Chạm trên phố
- Kiểm chạm phố sau dòng `if (this.visit) return` và trước mái căn rao bán, vì `saleAt` chỉ xét `w.x`.
- Vùng nhận chạm:
  - món vỉa hè: khung quanh chỗ đặt, rộng bằng món, cao từ hàng 18 tới 19,2;
  - lô đất: cả lô.
- Chạm ở bên kia đường mà không trúng món nào thì không làm gì, không mở bảng mua nhà.
- Chạm ở vỉa hè mà không trúng món thì giữ như bây giờ.
- Hàm tìm món dưới ngón tay là hàm thuần trong `src/view/bustle.ts`, có test như `saleAt`.
- Không dùng `setInteractive` cho món hay người qua đường, vì vật nhận chạm chặn mọi chạm khác (mục 3).

## 5. Các cách đã cân nhắc

| Điểm | Cách khác | Vì sao không chọn |
|---|---|---|
| 1 | Chỉ vỉa hè: bản đồ giữ cỡ, 5 món, 8.900.000 đ | Chồng yêu chọn có thêm bên kia đường |
| 2 | Kéo thả tự do như Xây dựng | Phải chừa lối cho người đi bộ và xe đạp, khó cho người ít chơi game |
| 4 | Chỉ để đẹp, không đổi luật (giống Phây cách A) | Chồng yêu chọn có tác dụng |
| 4 | Mỗi món một tác dụng riêng | Khó nhớ với người ít chơi game |
| 5 | Mở từ ngày 10, hoặc khi tiệm chính đạt hạng 4 sao | Chồng yêu chọn mở sau khi mua nhà hàng |
| 8 | Có phố ở cả ba chi nhánh | Tốn công vẽ gấp ba, để đợt sau |
| Save | Lưu điểm sầm uất thành một con số | Em tính lại từ danh sách món, để sau này đổi điểm từng món không phải sửa save **(em đề xuất)** |

## 6. Tham khảo game mã nguồn mở

Em tìm trên GitHub ngày 2026-11-01, bằng tìm repo và tìm code, chỉ đọc đoạn trích:
- **OpenRCT2** (GPL-3.0, làm lại RollerCoaster Tycoon 2): khách mới sinh theo một xác suất. Xác suất bắt đầu từ 50 cộng điểm công viên (có giới hạn), mỗi giải thưởng cộng hay trừ chút ít (`calculateGuestGenerationProbability` trong `src/openrct2/world/Park.cpp`). Cả công viên dùng chung một con số có trần, giống cách chồng yêu chọn ở điểm 4.
- **micropolisJS** (bản JavaScript của Micropolis, tức SimCity đời đầu): giá trị đất của từng ô quyết định nhà và cửa hàng ở đó lớn tới mức nào (`src/residential.js`, `src/commercial.js`). Đây là kiểu tác dụng theo chỗ, giống cách C ở điểm 4, chồng yêu không chọn.
- Các bản làm lại game Kairosoft trên GitHub đều nhỏ, không có mô tả hay mã đáng dùng.
- Em không chép mã nào, chỉ so ý. OpenRCT2 là GPL-3.0; micropolisJS không ghi rõ giấy phép trên GitHub.

## 7. Chia lô (em đề xuất)

### Lô A: phố mở, tám món, mua được
- Sim: danh sách món, điểm, hệ số khách tới cho spa và nhà hàng, mua qua `Chain` (4.1, 4.6). Save bản mới (mục 8).
- Màn hình:
  - bản đồ dài 5 hàng, camera, lớp tối (4.2);
  - hình 8 món và đất trống (4.3), kể cả hai dạng của chợ đêm theo giờ (4.7);
  - dấu +, chạm, thẻ mua (4.4, 4.10);
  - chip và bảng Con phố (4.5);
  - phố khi ghé tiệm bạn (4.9);
  - thông báo lần đầu (4.1).

### Lô B: phố sống
- Đèn sáng ban đêm (4.7).
- Người qua đường, xe buýt, đo `?perf` (4.8).

### Đưa lên bản thật
- Xong mỗi lô, khi test tự động và phần em tự kiểm trên trình duyệt đều đạt, em báo chồng yêu. Chồng yêu đồng ý thì em mới đưa lên master, vì đẩy lên master là lên bản thật. **(em đề xuất)**

## 8. Save

- Tiệm chính có thêm trường `bustle`: danh sách mã món đã mua, theo thứ tự mua, không trùng. Chi nhánh lưu danh sách rỗng.
- Đọc save:
  - mã lạ hay mã trùng thì bỏ;
  - không phải danh sách thì lấy danh sách rỗng;
  - save cũ không có trường này thì lấy danh sách rỗng.
- Số version: `BUSTLE_SAVE_VERSION` = `SAVE_VERSION` của origin/master + 1 **lúc merge**, không phải lúc tạo nhánh. Hôm nay sẽ là 42.
- Việc kèm theo khi tăng số:
  - sửa danh sách `raw.v` trong `parseVersioned`;
  - thêm `shop.bustle ??= []` vào `withNewKeys`;
  - thêm `tests/fixtures/save-v<N>.json` có vài món, và test trong `tests/sim/save.test.ts`;
  - fixture sinh bằng một file vitest dùng một lần ghi ra `sim.toSave()`, chạy xong thì xoá file đó.
- Người qua đường, xe buýt, chợ đóng hay mở đều không lưu.
- Bản cũ gặp save mới hơn thì báo save mới hơn như bây giờ (`SaveTooNewError`).

## 9. Tiêu chí xong

### Lô A
- Mọi test cũ qua, kể cả `same-draws`. Không ghi đè fixture cũ.
- Test sim (`tests/sim/bustle.test.ts`):
  - chưa có nhà hàng thì không mua được; thiếu tiền hay đã mua rồi cũng không mua được;
  - mua thì trừ đúng giá, đúng một lần;
  - điểm bằng tổng điểm các món; hệ số đúng bằng 1 ở 0 điểm và 0,85 ở 30 điểm;
  - có điểm thì khách tiệm chính và khách đi đường của nhà hàng tới dày hơn; chi nhánh không đổi;
  - 0 điểm thì một ngày chạy y hệt như trước (`same-draws`).
- Test save: lưu rồi mở lại vẫn giữ món; save cũ có danh sách rỗng; chi nhánh rỗng; mã lạ bị bỏ.
- Test màn hình (`tests/view/bustle.test.ts`):
  - hàm tìm món dưới ngón tay trả đúng món, chạm chỗ trống trả null;
  - mọi chỗ đặt nằm trong cột 12–62;
  - không chỗ nào đè lên cửa hai tiệm;
  - các món vỉa hè không đè lên nhau.
- Em tự kiểm trên trình duyệt, khung iPhone:
  - save chưa có nhà hàng: hình y như cũ;
  - mua nhà hàng: bản đồ dài xuống, có dấu +, chip 0/30, thông báo lần đầu;
  - lúc mở game và đầu ngày, màn hình y như cũ; vuốt lên thấy bên kia đường; thu nhỏ hết cỡ thấy cả dãy;
  - mua đủ 8 món: chip 30/30, tiền trừ đúng; chạm món đã mua ra thẻ "Đã có";
  - chạm bên kia đường, dưới một căn rao bán, không mở bảng mua nhà;
  - tầng 2 và sân thượng không có món vỉa hè, bên kia đường vẫn có;
  - chi nhánh y như cũ; ghé tiệm bạn thấy phố của bạn, chạm không mua được;
  - chợ đêm phủ bạt trước 17:00, dọn hàng từ 17:00.

### Lô B
- Em tự kiểm: từ 18:30 đèn sáng dần, cúp điện thì tắt; người đi bộ đông dần theo điểm; xe buýt dừng ở trạm; không người hay xe nào nhận chạm.
- `?perf` trên iPhone ở 30 điểm, ban đêm: chồng yêu đo giúp em, vì số đo trên máy tính không dùng để kết luận (CLAUDE.md).

## 10. Số khởi đầu (`src/config.ts`)

| Tên | Giá trị | Ghi chú |
|---|---|---|
| Giá và điểm tám món | bảng ở 4.3 | tổng 44.900.000 đ, 30 điểm |
| `BUSTLE_MAX_SPEEDUP` | 0,15 | thấp hơn mức 0,2 của độ đẹp |
| `BUSTLE_SCORE_MAX` | 30 | cộng từ bảng món, không gõ tay |
| Số hàng thêm dưới phố | 5 | |
| Chợ đêm dọn hàng | 17:00 | |
| Người qua đường | 2 + điểm/5 (tối đa 8); 1 + điểm/10; 2; 6 | lô B |
| Xe buýt | khoảng 15 giây một lượt, dừng 1,8 giây | lô B |

**Về giá** [cần kiểm tra]:
- Em chạy `scripts/phay-boost.ts` ngày 2026-11-01 với 1 seed, 2 luồng (bản gốc chạy 3 seed, 8 luồng). Tiệm lớn ngày 90 (12 giường, 9 ghế, 12 người) thu 1.383.000 đ một ngày, lãi trung bình 3 ngày 413.000 đ. Tiệm nhỏ ngày 40 lãi 279.000 đ. Script chỉ tính spa, không có nhà hàng, chi nhánh hay mini-game của chủ tiệm.
- Cùng lần chạy đó, đẩy bài mức lớn trên Phây (khách tới nhiều gấp 1,5 lần) thêm khoảng 443.000 đ doanh thu hôm sau ở tiệm lớn.
- Vì vậy 44.900.000 đ cho cả phố là chỗ tiêu tiền dư, không phải món để hoàn vốn.
- Khi làm lô A, em chạy một script tương tự ở 0, 15 và 30 điểm, rồi ghi doanh thu thêm mỗi ngày vào báo cáo.
- Chồng yêu cho em biết người nhà đang dư bao nhiêu tiền ở cuối game thì em chỉnh lại giá.

## 11. Để người làm tự quyết

- Tên file, tên lớp, cách chia module, miễn không trùng `Street` đang có.
- Vạch giữa đường: sửa các texture đang vẽ lòng đường, hay để lớp mới phủ vạch cũ. Miễn mọi căn, mọi tầng khớp nhau, và trước khi phố mở thì hình y như cũ.
- Nét vẽ từng món, miễn theo bản phác và bảng màu.
- Dời chỗ đặt từng món vài phần ô nếu cần.
- Bảng Con phố là cảnh riêng hay khung trên `Hud`.
- Chữ trên thẻ, chip và thông báo, miễn ngắn, rõ, và nằm trong `src/strings/vi.ts`.

## 12. Chồng yêu thử trên iPhone sau khi lên

- Giá từng món có hợp với số tiền đang dư không.
- Dấu + trên phố có dễ thấy không, có rối mắt không.
- Vuốt lên để xem bên kia đường có tự nhiên không.
- Khách tới nhanh hơn có thấy rõ không.
- Phố ban đêm có đẹp không; máy có nóng hay giật không (`?perf`).
