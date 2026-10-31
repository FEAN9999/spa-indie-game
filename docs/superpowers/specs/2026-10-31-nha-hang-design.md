# Nhà hàng cạnh tiệm spa

- Ngày: 2026-10-31
- Trạng thái: chồng yêu đã duyệt ngày 2026-10-31 ("Duyệt, làm đi")
- Thuộc: spec chung `2026-10-25-spa-game-design.md`. Nối tiếp phần mua nhà `2026-10-30-mo-rong-dat-design.md` (lưới 37 cột, 4 căn, thu phóng, thanh vị trí) và phần tầng `2026-10-28-dot-2-tang-design.md`.
- Lý do: chồng yêu hỏi "Anh muốn mở thêm nhà hàng, em thấy sao?"
- Phác thảo bố cục (chồng yêu duyệt cả 9 điểm): https://claude.ai/artifact/VMJsanDs8AacyggDiwv1Mb
- Phác thảo màn nấu, có món Phở chơi thử (chồng yêu duyệt cả 8 điểm): https://claude.ai/artifact/VvbbLdEZY3eEHi7GjEkip5

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền. Chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu, chỉnh sau khi chơi thử.

## 1. Chồng yêu muốn gì

- **Tự tay nấu và phục vụ món.** Mỗi món có màn chơi riêng như các dịch vụ spa. **(chồng yêu chọn)**
- **Nhà hàng ở ngay cạnh tiệm spa gốc**, chung tiền và chung đồng hồ ngày. **(chồng yêu chọn)**
- **Khách ăn gồm khách spa làm xong sang ăn, và khách đi đường ghé vào.** **(chồng yêu chọn)**
- **Ban đầu 3 món, lên sao mở thêm.** **(chồng yêu chọn)** Món thêm để đợt sau, xem mục 2.
- **Màn nấu kiểu trộn A+B:** khách đưa phiếu gọi món, nấu bằng vài bước tay ngắn. **(chồng yêu chọn)** Không làm kiểu Overcooked, chạy giữa nhiều bếp.
- **Nhà hàng là căn riêng**, không lấy căn nhà mua thêm của spa. **(chồng yêu chọn)**
- **Nhà hàng mở rộng được như spa:** mua nhà hai bên, tầng 2, sân thượng. **(chồng yêu chọn)**
- **Cách 1: chung một bản đồ dài.** Spa và nhà hàng nằm nối nhau trên một dãy phố, vuốt ngang để đi từ tiệm này sang tiệm kia. **(chồng yêu chọn)** Chồng yêu chọn cách này thay vì cách em đề xuất là chạm một cái để sang.
- **9 điểm bố cục** (mục 4.1 đến 4.9) và **8 điểm màn nấu** (mục 4.10 đến 4.16). **(chồng yêu duyệt cả 17)**

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Có một việc mới để tự tay làm. Giữa ngày, chồng yêu được chọn đứng spa hay đứng bếp.
- Nhà hàng là một mốc đáng để dành tiền, rồi lớn dần như spa.
- Hai tiệm sống chung một con phố: khách spa đi bộ sang ăn, cô chủ đạp xe qua lại.
- Ba món chơi khác nhau, không thấy lặp lại.

### Chưa làm ở đợt này
- Món thứ 4 trở đi (Bún chả, Gỏi cuốn, Cơm tấm). Để đợt sau, mỗi món mở bằng tiền. **(chồng yêu duyệt)**
- Nhà hàng ở chi nhánh. **(chồng yêu duyệt)**
- Bồi bàn, lễ tân hay thu ngân riêng của nhà hàng. Ai nấu thì người đó bưng, khách trả tiền tại bàn. **(em đề xuất)**
- Khách đi theo nhóm, đặt bàn trước, giao hàng.
- Nhà hàng có sao xếp hạng riêng, hay góp vào sao của spa. Giá món cố định, không tăng theo sao spa. **(em đề xuất)**
- Nhiệm vụ, huy hiệu, lễ hội, sự kiện, khách VIP, khách ngôi sao, khách quen, thú cưng ở nhà hàng. Những thứ này vẫn chỉ ở spa. **(em đề xuất)**
- Khách ăn ngon thì quay lại spa vui hơn. **(em đề xuất: để sau)**
- Bán lại nhà hàng.

### Điều cấm (dính là coi như hỏng)
- **Save cũ mất gì:** mở save hiện tại bằng bản mới thì spa và chi nhánh y như cũ. Bên phải spa chỉ có thêm căn nhà cũ treo biển, chưa mua.
- **Spa chạy khác đi khi chưa mua nhà hàng:** khách tới, tiền, test chạy ngày đều không đổi, trừ phần vẽ căn nhà cũ.
- **Chạm nhầm:** vuốt hay chụm mà game hiểu thành chạm, ở cả hai tiệm.
- **Mất dấu khách:** có khách chờ ở tiệm bên kia mà thanh vị trí không có chấm đỏ.
- **Kẹt đường:** khách ăn không tới được ghế, đầu bếp không tới được bếp, hay cô chủ không ra được cửa.
- **Trả tiền hai lần** hay mất tiền một món đã nấu.
- **Chậm máy:** vuốt và thu phóng dãy phố dài gấp đôi bị giật trên iPhone.

## 3. Hiện giờ (cho người làm)

Đọc ở origin/master cf30324, save v35.

**Lưới, nhà, tầng**
- Lưới là của từng tiệm. Mỗi `SpaSim` giữ `grid`, `base`, `shell`, `houses`. `rebuildShell()` gọi `towerOf(withHouses(base, houses))` (`spa.ts` khoảng dòng 1529).
- `withHouses` (`layout.ts`) báo lỗi nếu vỏ không rộng đúng `SHOP_COLS = 37`. `widen()` đệm `SHOP_X0 = 12` cột tường hai bên vỏ 13 cột. `towerOf` (`floors.ts`) chồng 3 tầng 18 hàng, tầng 3 là sân thượng.
- Mỗi tiệm chỉ có một cửa `grid.door` (`grid.ts:90`). Cửa dùng cho khách vào ra, nhân viên vào ra, `doorReach`, thú cưng, đèn cửa, chỗ vẽ khách đi trên phố, vạch cửa trên thanh vị trí.
- Mở tầng dùng `floorProblem`/`openFloor`, mua nhà dùng `houseProblem`/`buyHouse` (`spa.ts:1364-1415`). Ngày mở lấy từ `UNLOCK_DAY` (tầng ngày 6, nhà ngày 10).

**Phố và khách**
- Trong sim không có vỉa hè. `spawnCustomer` đặt khách lên `grid.door`, trạng thái `'arriving'`, chỉ tính giờ (`ARRIVE_MS`, `EXIT_MS` = 1.500).
- `SpaScene.streetPlacement` (khoảng dòng 1849) chỉ vẽ khách đi trên phố, cách cửa `STREET_SIDE_TILES = 4,5` ô.
- Vỉa hè được vẽ dính vào hình mỗi phòng và mỗi căn nhà (`street()` ở `art/room.ts:85`).
- Khách đi qua các trạng thái `arriving → toSeat → waiting → toStation → inService → leaving → exiting` (`types.ts`). Ghế chỉ ở tầng 1. Hết kiên nhẫn (`PATIENCE_MS = 60.000`) thì khách bỏ về và chê.

**Cô chủ phục vụ và màn chơi**
- `tapTile` (`spa.ts:649`) xét máy hỏng, thiếu hàng, còn giường trống. Sau đó cô chủ nhận việc `fetch`, rồi `sendToBed`, rồi `serve`, rồi phát sự kiện `serviceReady`.
- `SpaScene.handle('serviceReady')` mở scene màn chơi qua `MINI_GAME_SCENE` với `MiniGameData` (`view/miniGame.ts:13`). `onDone(stars)` gọi `sim.completeService`, rồi tới `payFor`.
- **Mở màn chơi là cả chuỗi dừng lại:** `step()` trả false khi `servingCustomerId !== null`.
- Mỗi màn chơi gồm:
  - một lớp luật thuần trong `sim/` (ví dụ `NailsGame` ở `sim/nails.ts`);
  - số chỉnh trong `config.ts`;
  - một scene Phaser dùng `addMiniGameCard`/`revealStars`;
  - hình trong `art/`.
- `LessonScene` mở lại đúng scene đó với `teacher: true`.
- Khách khó: `MiniGameData.hard = vip || idol || KINDS[kind].hard`.
- `payFor` (`spa.ts:704`) tính giá, tiền boa theo sao, điểm đánh giá, khách quen, rồi cho khách về.

**Nhân viên**
- Thợ tự làm qua `updateTechnician` (`crew.ts:295`): `fetchWaiting`, `sendToBed`, chờ `serviceMs`, ra sao `staffStars(starSkill(...))`.
- Số thợ tối đa: `staffCap` = 3 + `(floors-1) * STAFF_PER_FLOOR (2)` + `houses * STAFF_PER_HOUSE (1)` (`crew.ts:96`).
- Mỗi người có tầng nghề `Tiers` riêng từng dịch vụ (0 đến `MAX_TIER = 3`). Lương tính bằng `wageFor`, trả cuối ngày bằng `payWages`.
- Nhân viên mới xuất hiện ở `grid.door`.

**Kho**
- `StockItem` gồm 8 món. `STOCK_USES[service]` là món riêng của dịch vụ cộng khăn.
- `RESTOCK_AMOUNT = 20`, `STOCK_START = 20`, `LOW_STOCK = 5`. Bắt đầu tính kho từ ngày 5.
- Kho trừ trong `sendToBed`. Tiệm vắng chủ tự nhập hàng.

**Chuỗi**
- Mỗi chi nhánh là một `SpaSim` đủ phần, dùng chung `purse` với tiệm chính.
- `Chain.advance(ms)` chạy tiệm đang đứng, rồi chạy mọi tiệm khác đúng chừng ấy ms.
- Chủ chỉ có mặt ở một tiệm (`ownerHere`). Đi khỏi một tiệm không có thợ thì khách đang chờ lặng lẽ về.
- `SpaScene.switchShop` vẽ lại cả scene. **Chỉ tiệm đang đứng được vẽ.**

**Màn hình**
- `view/camera.ts` có `mapBounds(houses)` từ `SHOP_X0 - left*6` tới `SHOP_X0 + 12 + right*6`, và `minZoom = min(1, rộng màn hình / rộng bản đồ)`.
- `MapCamera`, `MapGestures`, `ZoomButtons` lo vuốt, chụm, trượt.
- Không có chuyện màn hình đi theo liên tục. Màn hình chỉ trượt một lần khi cô chủ dẫn khách ra ngoài màn hình (`SpaScene` khoảng dòng 1262).
- Thanh vị trí ở `view/strip.ts` và `PositionStrip.ts`, có một vạch cửa.
- **Không có cắt bớt phần ngoài màn hình:** mọi thứ trên tầng đang xem đều được vẽ.
- `RoomView` vẽ một hình phòng 13 cột cộng 4 căn nhà (`view/houses.ts`, `firstCol` viết cứng theo `SHOP_X0`).
- Ánh sáng ngày đêm (`view/daylight.ts`, `RoomView.setDaylight`) phủ theo `mapBounds`. Đèn treo ở chỗ viết cứng.

**Save**
- `SAVE_VERSION = 35`. Save gồm tiệm chính (`SaveData`) và `chain.branches: SaveData[]`.
- Trường mới được sửa mặc định trong `parseShop` theo `raw.v < X_SAVE_VERSION`.
- Save mới hơn bản game thì báo `SaveTooNewError` và giữ nguyên ô lưu.
- Lệ trong dự án: thêm dữ liệu mà bản cũ sẽ lặng lẽ bỏ thì phải lên số version.

**Test**
- Dùng Vitest (`npm test`), file ở `tests/**`.
- Chạy ngày không cần màn hình: `new SpaSim({ rng: createRng(n) })`, `advance` tới `dayOver`. Hàm trợ giúp ở `tests/sim/helpers.ts`.
- `tests/sim/same-draws.test.ts` so với các bản ghi cố định: rng mới phải là luồng riêng, không lấy chung luồng cũ.
- Save mẫu ở `tests/fixtures/save-v*.json`.

## 4. Thiết kế

### 4.1 Dãy phố 74 cột (Cách 1, chồng yêu chọn)
- Người chơi thấy một dãy phố: khối spa 37 cột bên trái, khối nhà hàng 37 cột bên phải, chung một vỉa hè. Khối nhà hàng chia như khối spa: căn chính 13 cột ở giữa, mỗi bên 2 căn 6 cột. **(chồng yêu duyệt)**
- **Bên trong code vẫn là hai lưới riêng, mỗi lưới 37 cột, mỗi lưới một cửa.** Màn hình vẽ lưới nhà hàng lệch sang phải 37 ô. **(em đề xuất)** Lý do:
  - mọi chỗ đang giả định "một tiệm, một cửa, một chồng tầng" (mục 3) được giữ nguyên;
  - nhà, tầng, sân thượng của nhà hàng dùng lại đúng `withHouses` và `towerOf`;
  - save của spa không phải dời toạ độ.
- Hai tiệm vẫn xem chung một tầng: nút tầng đổi tầng cho cả dãy.
- Cả dãy vuốt và thu phóng như bây giờ. `mapBounds` kéo tới mép phải những gì đang hiện của khối nhà hàng.

### 4.2 Lô đất nhà hàng
- Từ ngày 1, căn chính của khối nhà hàng là một căn nhà cũ đóng cửa, treo biển "SANG NHƯỢNG". Bốn căn hai bên nó chưa hiện, chỉ là mặt phố. **(chồng yêu duyệt)**
- Từ ngày 10, chạm mái căn nhà cũ thì ra bảng mua, giá 5.000.000 đ. Bảng mua giống bảng mua nhà. **(chồng yêu duyệt)**
- Trước ngày 10, chạm mái thì báo "Mở bán từ ngày 10". **(em đề xuất)**
- Mua xong, căn đó thành nhà hàng có sẵn: 2 bếp, 2 bàn, 8 ghế và quầy chia món. Đó là hai bàn trên cùng của sơ đồ trong phác thảo, mỗi bàn 4 ghế. Chỗ hai bàn dưới để trống, mua thêm sau. Mở bán ngay hôm đó với Phở. **(em đề xuất)** Lý do: sơ đồ đủ chỗ cho 16 ghế, nhưng ở lô A chỉ có cô chủ nấu, 16 khách cùng lúc sẽ chờ quá lâu.

### 4.3 Mở rộng nhà hàng
- Bốn căn hai bên: căn sát giá 3.000.000 đ, căn xa giá 6.000.000 đ. Phải mua căn sát trước căn xa, bên nào trước cũng được. **(chồng yêu duyệt)**
- Tầng 2 giá 2.000.000 đ. Sân thượng giá 4.000.000 đ, làm quán ăn ngoài trời có dù và đèn lồng. **(chồng yêu duyệt)**
- Các căn nhà và tầng chỉ rao bán sau khi đã mua nhà hàng. Hình các căn thì vẽ riêng cho nhà hàng (tường, mái khác spa). **(em đề xuất)**
- Ở tầng trên, khách ăn đi cầu thang như khách spa đi lên giường. Bàn ghế đặt ở tầng nào cũng dùng được, khác với spa chỉ có ghế chờ ở tầng 1. **(em đề xuất)**

### 4.4 Khách ăn
- **Khách spa sang ăn:** khách spa trả tiền xong, có 1 phần 3 cơ hội rẽ sang nhà hàng. Chỉ rẽ khi nhà hàng còn ghế trống và còn món bán được. **(chồng yêu duyệt, số tạm)**
- **Khách đi đường:** tới đều trong ngày, đông nhất lúc trưa (11 tới 13 giờ trong game) và tối (17 tới 20 giờ). **(chồng yêu duyệt, số tạm)** Nhịp tới khách nằm ở mục 10.
- Mỗi khách ăn một món. Món được bốc ngẫu nhiên trong các món đang bán và còn nguyên liệu. **(em đề xuất)**
- Không còn ghế thì khách đi đường đi tiếp, không chê. Khách spa thì cứ về thẳng. **(em đề xuất)**

### 4.5 Một lượt khách (chồng yêu duyệt)
1. Khách vào cửa nhà hàng, tự ngồi vào ghế trống và giơ phiếu gọi món lên.
2. Chạm vào khách. Cô chủ đi tới bàn nhận phiếu, rồi vào một bếp trống.
3. Màn nấu mở ra như các màn dịch vụ spa. Nấu xong được 1 đến 3 sao.
4. Cô chủ bưng món ra bàn. Khách ăn một lúc (`EAT_MS`) rồi trả tiền tại bàn, cho tiền boa theo sao, rồi về.
5. Có đầu bếp rảnh thì đầu bếp tự nhận khách, tự nấu, tự bưng.

- Khách đang giơ phiếu thì kiên nhẫn giảm như khách spa đang chờ. Hết kiên nhẫn thì khách bỏ về. **(em đề xuất)**
- Không còn bếp trống thì báo như hết giường bên spa. **(em đề xuất)**

### 4.6 Cô chủ đi lại giữa hai tiệm
- Đang ở spa mà chạm vào khách nhà hàng, cô chủ tự đi ra cửa spa, đạp xe trên vỉa hè sang cửa nhà hàng, rồi làm như mục 4.5. Chiều ngược lại cũng thế. **(chồng yêu duyệt)**
- Trên vỉa hè cô chủ đạp xe. Từ cửa này sang cửa kia mất khoảng 3 giây, nếu đi bộ thì mất khoảng 7 giây. **(chồng yêu duyệt, số tạm)**
- Hai tiệm đều coi như "có chủ" để khách tới, kể cả khi cô chủ đang ở tiệm kia hay trên xe. Không có chuyện khách lặng lẽ về như khi cô chủ đi chi nhánh. **(em đề xuất)** Lý do: hai tiệm sát nhau, cô chủ quay lại được ngay.
- Màn hình đi theo cô chủ khi cô sang tiệm kia, giống lúc dẫn khách ra ngoài màn hình. **(chồng yêu duyệt)**
- Cô chủ đi chi nhánh thì nhà hàng như spa gốc lúc vắng chủ: chỉ còn đầu bếp làm, không có đầu bếp thì không có khách mới. **(em đề xuất)**
- Đầu ngày cô chủ đứng ở spa như bây giờ. **(em đề xuất)**

### 4.7 Thanh vị trí
- Thanh dài ra thành hai khối. Khối nhà hàng màu khác. **(chồng yêu duyệt)**
- Chấm đỏ báo khách đang chờ ở cả hai tiệm. Ở nhà hàng, "đang chờ" là khách đang giơ phiếu. Có hai vạch cửa. **(chồng yêu duyệt)**

### 4.8 Trong nhà hàng
- Bếp ở trong cùng, rồi quầy chia món, bàn ăn ở giữa, quầy thu ngân gần cửa. Cầu thang ở cùng chỗ với bên spa (x = 11, hàng 7 tới 9 trong vỏ 13 cột). Theo sơ đồ trong phác thảo. **(chồng yêu duyệt)**
- Đồ mới trong chế độ Xây dựng, chỉ kê được ở nhà hàng **(em đề xuất)**:
  - **bếp:** 2 ô, có ô đứng nấu phía trước, giống giường có ô đứng làm;
  - **bàn ăn:** 2 ô;
  - **ghế ăn:** 1 ô, phải sát bàn mới có khách ngồi;
  - **quầy chia món**, **kệ nguyên liệu**, **chậu rửa**, **quầy thu ngân:** chỉ để trang trí và chắn đường.
- Đồ của spa (giường, ghế chờ...) không kê được ở nhà hàng, đồ nhà hàng không kê được ở spa. Đồ trang trí chung (cây, đèn, tranh, thảm) kê được cả hai bên. **(em đề xuất)**
- Mua thêm bếp, bàn, ghế bằng tiền như mua giường. Giá ở mục 10.

### 4.8b Tiệm đang xem
- Thẻ Dịch vụ (kho), Nhân viên, chế độ Xây dựng và nút tầng (mua, mở tầng) làm việc với **tiệm mà giữa màn hình đang nằm trên**. Vuốt sang nhà hàng thì các thẻ đó là của nhà hàng. **(em đề xuất)**
- Tên thẻ hiện rõ đang là "Spa" hay "Nhà hàng" để khỏi nhầm. **(em đề xuất)**
- Tổng kết cuối ngày luôn có cả hai tiệm (4.15).

### 4.9 Đầu bếp
- Thuê giống kỹ thuật viên, trong thẻ Nhân viên, có thêm dòng "Đầu bếp". **(chồng yêu duyệt)**
- Số đầu bếp tối đa: 2 + 2 mỗi tầng mở thêm + 1 mỗi căn mua thêm của nhà hàng, tối đa 10. **(chồng yêu duyệt, số tạm)**
- Đầu bếp nấu tự động. Số sao tuỳ tay nghề, cách tính như thợ (`starSkill`, `staffStars`), có tầng nghề riêng cho từng món. Lương tính như thợ. **(chồng yêu duyệt)**
- Thợ spa không nấu, đầu bếp không làm spa. **(em đề xuất)**

### 4.10 Ba món đầu (chồng yêu duyệt)

| Món | Giá | Bước 1 | Bước 2 | Bước 3 | Phiếu ghi |
|---|---|---|---|---|---|
| Phở bò | 60.000 đ | Vuốt dọc để thái 4 lát theo vạch chấm | Giữ để trụng, thả khi kim vào vạch vàng | Chạm hành, ớt, rau đúng như phiếu | tái hay chín, ít hay nhiều hành, có hay không ớt |
| Bánh xèo | 55.000 đ | Vuốt một vòng để tráng bột kín chảo | Chạm tôm, thịt, giá đúng như phiếu | Bánh vàng dần, chạm để gập đúng độ giòn | nhân tôm hay thịt, giòn vừa hay giòn kỹ |
| Chè ba màu | 35.000 đ | Giữ để múc từng lớp, thả khi tới vạch | Chạm thật nhanh để đập đá | Vuốt qua lại để rưới nước cốt dừa | nhiều đậu hay nhiều thạch, ít hay nhiều đá |

- Cả ba món có ngay khi mua nhà hàng. **(chồng yêu duyệt)**
- Phiếu ghi gì thì ảnh hưởng tới bước tương ứng. Ví dụ phở tái thì vạch vàng thấp, chín thì vạch cao. Bánh xèo giòn kỹ thì phải chờ lâu hơn mới gập. Chè nhiều đậu thì vạch lớp đậu cao hơn. **(em đề xuất)**

### 4.11 Chấm sao (chồng yêu duyệt)
- Mỗi món khoảng 25 giây, được 1 đến 3 sao như các dịch vụ spa.
- Sao tính từ việc làm các bước có tốt không. Làm sai phiếu (ví dụ bỏ ớt khi khách dặn không ớt) thì mất 1 sao, nhưng không xuống dưới 1 sao.
- Cách tính cụ thể cho Phở theo bản chơi thử **(em đề xuất)**:
  - bắt đầu 1 sao;
  - thái đẹp ít nhất 3 trên 4 lát thì thêm 1 sao;
  - trụng vào vạch vàng thì thêm 1 sao;
  - trụng xa vạch quá thì trừ 1 sao;
  - sai phiếu thì trừ 1 sao.
- Bánh xèo và Chè chia điểm theo cùng kiểu đó. Người làm chỉnh số sau khi tự chơi.
- Tiền boa theo sao: 0, 5.000, 10.000, 20.000 đ. **(số tạm)**

### 4.12 Khách khó tính
- Khách khó tính có phiếu dài hơn và vạch vàng hẹp hơn. **(chồng yêu duyệt)**
- Phiếu dài hơn nghĩa là thêm một dòng dặn, ví dụ "thêm rau" hay "ít đá". **(em đề xuất)**
- Khách khó tính bên nhà hàng dùng cùng các kiểu khách đang có (`KINDS[kind].hard`). Khách đi đường được bốc kiểu theo cùng tỉ lệ như khách spa ở tiệm gốc. **(em đề xuất)**

### 4.13 Nguyên liệu (chồng yêu duyệt)
- Mỗi món dùng một phần nguyên liệu riêng: nguyên liệu phở, bột bánh xèo, đồ chè. Món nào cũng dùng thêm rau thơm, giống khăn bên spa.
- Hết nguyên liệu món nào thì món đó tạm ngưng bán: khách không gọi món đó nữa.
- Kho nhà hàng tách riêng kho spa, hiện trong thẻ Dịch vụ khi đang xem nhà hàng. **(em đề xuất)**
- Nhập 20 phần một lần. Có sẵn 20 phần mỗi thứ lúc mua nhà hàng. Vắng chủ thì tự nhập như chi nhánh. **(em đề xuất)**
- Giá nhập ở mục 10.

### 4.14 Bài học (chồng yêu duyệt)
- Lần đầu cô chủ nấu mỗi món, màn nấu có bàn tay chỉ từng bước như bài học dịch vụ spa. Không mất tiền, không cần sao.
- Bài học là màn nấu thật với `teacher: true`. Khách vẫn được món và trả tiền. **(em đề xuất)**

### 4.15 Tiền và tổng kết ngày
- Tiền nhà hàng vào chung túi. **(chồng yêu chọn)**
- Bảng tổng kết cuối ngày có thêm một dòng "Nhà hàng": số khách, tiền món, tiền boa. **(em đề xuất)**
- Mua nhà hàng, bếp, bàn, ghế, nhà, tầng của nhà hàng, cùng lương đầu bếp, đều trừ vào túi chung.
- **Số liệu tách riêng (em đề xuất):** nhà hàng có bảng số riêng (khách, tiền món, tiền boa). Không cộng vào số của spa. Vì vậy:
  - nhiệm vụ kiếm tiền, nhận boa, kỷ lục ngày, sao xếp hạng chỉ tính spa, đúng như mục 2;
  - một ngày cô chủ chỉ đứng bếp vẫn là ngày cô chủ không làm spa, nên tiền lúc vắng nhà của spa vẫn tính như bây giờ.
- **Tiền lúc vắng nhà của nhà hàng (lô B, em đề xuất):** có đầu bếp thì nhà hàng kiếm tiền lúc vắng nhà như một chi nhánh, theo những ngày chỉ có đầu bếp nấu. Chưa có đầu bếp thì không kiếm.

### 4.16 Ngày đêm, mất điện
- Ánh sáng ngày đêm phủ cả dãy 74 cột. Nhà hàng có đèn bếp và đèn lồng sân thượng, cũng sáng từ 18:30. **(em đề xuất)**
- Mất điện ở spa thì nhà hàng cũng mất điện, vì chung con phố. Trong lúc mất điện, bếp không nấu được, giống máy hỏng. **(em đề xuất)**

### 4.17 Chi nhánh
- Chi nhánh không có nhà hàng. **(chồng yêu duyệt)**

## 5. Các cách đã cân nhắc

### Nhà hàng đặt ở đâu
- **Lấy một trong 4 căn nhà của spa.** Làm nhanh nhất, nhưng spa mất chỗ kê giường và mất suất thợ. Chồng yêu không chọn.
- **Căn riêng sát vách (chồng yêu chọn).**
- **Tầng hay sân thượng của spa.** Bỏ, vì chỗ đó đang kê giường và khách phải leo thang.
- **Một điểm trên bản đồ Chuỗi.** Bỏ, vì không còn "ngay cạnh".

### Cách đi giữa hai tiệm
- **Cách 1, chung một bản đồ dài (chồng yêu chọn).** Thấy cả hai tiệm, khách đi bộ thẳng sang. Đổi lại: bản đồ dài gấp đôi, cô chủ đi lại mất thời gian, nhiều việc hơn.
- **Cách 2, tiệm riêng, chạm một cái để sang (em đề xuất, chồng yêu không chọn).** Dùng lại phần chuỗi, nhẹ máy hơn, nhưng không thấy hai tiệm cùng lúc.

### Bên trong Cách 1 (em đề xuất, để người làm biết vì sao)
- **Hai lưới 37 cột đặt cạnh nhau (em đề xuất).** Giữ nguyên mọi chỗ đang giả định một cửa, một chồng tầng. Đường giữa hai cửa là một "chặng trên phố" có giờ, giống `ARRIVE_MS`.
- **Một lưới 74 cột.** Phải sửa mọi chỗ dùng `grid.door`, `ownerStart`, `withHouses`, `mapBounds`, dời save. Rủi ro cao, không được thêm gì cho người chơi.

### Kiểu màn nấu
- **A, kiểu Cooking Mama:** mỗi món chia vài bước tay ngắn.
- **B, kiểu phiếu gọi món:** làm đúng theo phiếu.
- **C, kiểu Overcooked:** chạy giữa nhiều bếp. Bỏ, vì rối trên điện thoại và không hợp cả nhà chơi thư thả.
- **Chồng yêu chọn trộn A+B.**

## 6. Tham khảo game mã nguồn mở

Ghi chú tìm hiểu ở scratchpad phiên này (`nha-hang-oss.md`).
- **ice-morimori** (MIT, Three.js, chơi bằng chạm): có phiếu gọi món ghi vị, số viên và topping. Giữ để viên kem to ra, thả khi vào vạch vàng, chạm để thả kem cho thẳng. Giao xong khách chấm sao và cho boa. Lấy ý cho bước "giữ rồi thả vào vạch" và phiếu gọi món.
- **pancake_shop:** độ chín tăng theo thời gian, màu đổi từ trắng sang vàng, nâu, cháy, chạm để lật. Điểm tính theo khoảng cách tới độ chín đẹp. Lấy ý cho bước gập bánh xèo.
- **Restaurant-Game-Canvas-JS** (MIT): khách gọi món ở quầy, nấu ở từng bếp, sao theo tốc độ giao. Em không lấy cách chấm sao theo tốc độ, vì màn nấu đã có giờ riêng.
- **Các bản làm lại Overcooked** (Delixia và các bản khác): kiểu C, đã bỏ.
- Không có bản mã nguồn mở nào làm lại Cooking Mama hay Papa's Pizzeria. Chỉ có mô tả cách chơi của Cooking Mama: mỗi món là chuỗi bước ngắn như thái, khuấy, canh lửa.

## 7. Chia lô (em đề xuất)

### Lô A: dãy phố dài, mua nhà hàng, món Phở
- Khối nhà hàng trên dãy phố: căn nhà cũ, bảng mua, mua nhà hàng, phòng có sẵn bếp, bàn, ghế (4.1, 4.2).
- Sim nhà hàng riêng, chung túi tiền và đồng hồ với spa, chạy song song với spa.
- Khách đi đường và khách spa sang ăn, kèm chặng đi trên phố (4.4).
- Một lượt khách do cô chủ phục vụ (4.5).
- Cô chủ đạp xe qua lại, màn hình đi theo (4.6). Thanh vị trí hai khối (4.7).
- Màn nấu Phở với phiếu và sao (4.10, 4.11, 4.12).
- Đồ nhà hàng trong chế độ Xây dựng (4.8), tổng kết ngày (4.15), ngày đêm và mất điện (4.16).
- Save bản mới.

### Lô B: Bánh xèo, Chè, đầu bếp, nguyên liệu, bài học
- Màn Bánh xèo và màn Chè (4.10).
- Đầu bếp (4.9), nguyên liệu (4.13), bài học cho cả ba món (4.14).
- Save bản mới nếu cần thêm dữ liệu.

### Lô C: nhà hàng lớn dần
- Bốn căn hai bên, tầng 2, sân thượng có dù và đèn lồng (4.3).
- Hình các căn và tầng của nhà hàng.

- **Chồng yêu duyệt tài liệu này một lần cho cả ba lô.** Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo. **(em đề xuất, giữ cách các đợt trước)**

## 8. Save

- Tiệm chính có thêm trường `restaurant` (null khi chưa mua). Trường này giữ:
  - đồ đã kê, căn đã mua, tầng đã mở;
  - đầu bếp (lô B), kho (lô B);
  - món đã học (lô B);
  - khách và cô chủ đang ở đâu, nếu save giữa ngày.
- Chi nhánh không có trường này.
- **Số version:** lấy số kế tiếp trên origin/master lúc làm lô A, vì các phiên khác cũng đang lên số. Bản cũ gặp save có nhà hàng phải báo save mới hơn, không được lặng lẽ bỏ nhà hàng.
- Mở save cũ thì `restaurant = null`. Spa không đổi gì.
- Cô chủ đang ở nhà hàng hay trên phố lúc lưu: em đề xuất mở lại thì cô chủ đứng ở cửa tiệm cô đang ở. Đang đi trên phố thì về cửa spa.
- Khách đang đi trên phố lúc lưu thì bỏ, như khách đang `arriving` bây giờ. Không tính là khách bỏ về.

## 9. Tiêu chí xong

### Lô A
- Mọi test cũ qua, kể cả `same-draws`. Sim nhà hàng dùng luồng rng riêng.
- Test sim:
  - không mua được trước ngày 10 hay thiếu tiền;
  - mua xong có bếp, bàn, ghế;
  - khách đi đường tới đông hơn vào giờ cao điểm;
  - khoảng 1/3 khách spa sang ăn khi còn ghế, không sang khi hết ghế hay hết món;
  - một lượt cô chủ nấu Phở trả đúng tiền và boa theo sao;
  - sai phiếu trừ 1 sao, không dưới 1;
  - cô chủ sang tiệm kia mất đúng thời gian xe;
  - khách spa đang chờ không về khi cô chủ đang ở nhà hàng;
  - save có nhà hàng: lưu, mở lại; bản cũ gặp save mới hơn thì từ chối.
- Test luật màn Phở: thái, trụng, rắc rau, chấm sao theo mục 4.11.
- Em tự kiểm trên trình duyệt, khung iPhone:
  - căn nhà cũ có biển, chạm mái ra bảng mua từ ngày 10;
  - mua xong vuốt sang thấy nhà hàng, thu nhỏ hết cỡ thấy cả dãy;
  - khách vào ngồi, giơ phiếu; chạm khách thì cô chủ đạp xe sang, nấu Phở, bưng ra, khách trả tiền;
  - thanh vị trí có hai khối, chấm đỏ đúng tiệm;
  - kê thêm bàn ghế bếp ở nhà hàng; không kê được giường spa ở đó;
  - chiều tối đèn nhà hàng sáng; mất điện thì bếp ngừng;
  - một chi nhánh vẫn chơi như cũ;
  - vuốt dãy phố không giật.

### Lô B
- Test luật màn Bánh xèo và màn Chè. Test đầu bếp tự nấu, số đầu bếp tối đa, lương. Test nguyên liệu trừ và hết thì ngưng món. Test bài học chạy một lần mỗi món.
- Em tự chơi đủ ba món trên khung iPhone, thuê một đầu bếp xem tự nấu, xem bài học.

### Lô C
- Test mua căn theo thứ tự, mở tầng, đường đi lên tầng có bàn, số đầu bếp tối đa theo căn và tầng.
- Em tự kiểm: mua đủ, sân thượng có dù và đèn lồng, khách ăn trên sân thượng.

## 10. Số khởi đầu (`src/config.ts`)

Cập nhật khi giao lô A (31/10): master đã tăng mọi giá mua một lần lên 1,5 lần và giảm nửa giá dịch vụ spa. Nhà hàng làm theo: giá mua một lần × 1,5, tiền món và tiền boa giảm nửa. Bảng dưới là số mới, thay cho số cũ ở các mục trên.

| Tên | Giá trị | Ghi chú |
|---|---|---|
| Giá nhà hàng | 7.500.000 đ | từ ngày 10 (cũ 5.000.000) |
| Giá căn nhà hàng | 4.500.000 đ, 9.000.000 đ | căn sát, căn xa (cũ 3tr, 6tr) |
| Giá tầng nhà hàng | 3.000.000 đ, 6.000.000 đ | tầng 2, sân thượng (cũ 2tr, 4tr) |
| Giá món | Phở 30.000, Bánh xèo 28.000, Chè 18.000 đ | cũ 60k, 55k, 35k; Bánh xèo và Chè chốt ở lô B |
| Boa theo sao | 0, 2.500, 5.000, 10.000 đ | 0 khi khách bỏ về |
| Khách spa sang ăn | 1/3 | |
| Khách đi đường | trung bình 1 khách mỗi 45 phút trong game, gấp 2,5 lần vào 11–13 giờ và 17–20 giờ | em đề xuất |
| `EAT_MS` | 8.000 | khách ăn |
| Xe đạp cửa tới cửa | khoảng 3.000 ms | đi bộ khoảng 7.400 ms |
| Chặng khách đi trên phố | 37 ô theo tốc độ đi của khách | |
| Màn nấu | khoảng 25 giây | |
| Đầu bếp tối đa | 2 + 2 × (tầng − 1) + số căn | tối đa 10 |
| Bếp, bàn, ghế mua thêm | 600.000, 225.000, 90.000 đ | cũ 400k, 150k, 60k |
| Nguyên liệu nhập 20 phần | phở 400.000, bánh xèo 360.000, chè 240.000, rau thơm 80.000 đ | em đề xuất |

## 11. Để người làm tự quyết

- Tên lớp sim nhà hàng, và nó dùng lại `SpaSim` hay lớp mới. Miễn là spa không có thêm nhánh `if` rải khắp nơi.
- Chỗ đặt "chặng trên phố" trong code, và cách lớp chạy cả ngày gọi spa với nhà hàng.
- Cách cắt bớt phần ngoài màn hình nếu vuốt bị giật.
- Nét vẽ nhà hàng, đồ, món ăn, xe đạp, miễn theo phác thảo và bảng màu game.
- Chữ trên phiếu, bảng mua, thông báo, miễn ngắn và rõ.
- Cách chấm sao chi tiết của Bánh xèo và Chè, miễn theo mục 4.11.
- Chia file test.

## 12. Chồng yêu thử trên iPhone sau khi lên

- Giá nhà hàng 5 triệu, ngày 10 có sớm hay muộn.
- Đạp xe 3 giây có nhanh đủ không. Đi qua lại có mệt không.
- Khách sang ăn có đông quá hay vắng quá.
- Màn nấu từng món có dễ hiểu, có vui, 25 giây có dài không.
- Giá món và tiền nhà hàng kiếm được so với spa.
- Vuốt dãy phố dài có mượt không.
