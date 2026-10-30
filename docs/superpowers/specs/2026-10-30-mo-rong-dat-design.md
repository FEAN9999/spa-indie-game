# Mua nhà bên cạnh và thu phóng bản đồ

- Ngày: 2026-10-30
- Trạng thái: bản nháp, chờ chồng yêu duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.10 (tiệm lớn dần). Nối tiếp phần tầng `2026-10-28-dot-2-tang-design.md` (lưới ba tầng chồng nhau) và xoay đồ `2026-10-29-xoay-do-design.md`.
- Lý do: chồng yêu hỏi "Liệu có thể làm kiểu expand diện tích như Hot Springs Story của Kairosoft không? Diện tích hiện tại đang quá bé."
- Bản phác bấm thử (chồng yêu đã duyệt cả 9 điểm): https://claude.ai/artifact/JnDfD47xrMEJhb4w1Exgaf

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu, chỉnh sau khi chơi thử.

## 1. Chồng yêu muốn gì

- **Tiệm rộng ra kiểu Hot Springs Story:** bắt đầu như bây giờ, về sau bỏ tiền mua thêm đất. **(chồng yêu chọn)**
- **Tiệm to hơn màn hình cũng được, vuốt để xem.** **(chồng yêu chọn)**
- **Có cả phóng to, thu nhỏ**, không chỉ vuốt ngang. **(chồng yêu chọn)**
- **Chín điểm trên bản phác** (mục 4). **(chồng yêu chọn cả 9)**
- **Cách 1:** lưới đủ rộng ngay từ đầu, phần chưa mua khoá lại, tiệm hiện tại dời sang phải 12 ô một lần. **(chồng yêu chọn)**

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Tiệm có chỗ cho chín dịch vụ, nhiều giường mỗi loại, mà không chen nhau.
- Mua nhà là một mốc đáng để dành tiền, như mở tầng.
- Nhìn là biết chỗ nào là nhà mới mua (gạch bông, màu tường riêng).
- Không bao giờ mất dấu khách khi đang xem chỗ khác hay đang thu phóng.

### Chưa làm ở đợt này
- Nhiều cửa ra vào. Tiệm vẫn một cửa ở giữa. **(chồng yêu chọn trên bản phác)**
- Mua nhà phía sau, hay nhà khác cỡ. Chỉ 2 căn mỗi bên, mỗi căn 6 cột.
- Chi nhánh mua nhà. Chi nhánh giữ cỡ cũ. **(chồng yêu chọn trên bản phác)**
- Xoay màn hình, nghiêng góc nhìn.
- Vẽ lại hình cỡ lớn cho nét khi phóng to.
- Bán lại nhà đã mua.
- Khách tới đông hơn vì tiệm rộng. Khách vẫn tới theo sao, độ đẹp và số dịch vụ như bây giờ. **(em đề xuất)**

### Điều cấm (dính là coi như hỏng)
- **Tiệm cũ mất gì:** mở tiệm cũ bằng bản mới thì mọi món, mọi người, mọi con thú nằm đúng chỗ cũ trong tiệm (chỉ khác số cột trong code), độ đẹp không đổi, chủ tiệm đầu ngày đứng đúng chỗ cũ.
- **Thanh trên, nút tầng, bốn nút chính bị thu phóng hay trôi theo bản đồ.**
- **Chạm nhầm:** vuốt hay chụm hai ngón mà game hiểu thành chạm (chủ tiệm chạy đi, mời nhầm khách, đặt nhầm đồ).
- **Mất dấu khách:** có khách đang chờ ngoài màn hình mà thanh vị trí không có chấm đỏ.
- **Kẹt đường:** mua nhà làm ai đó không đi tới được giường, ghế, cửa hay cầu thang.
- **Chậm máy:** thu phóng giật trên iPhone.

## 3. Hiện giờ (cho người làm)

Đọc ở worktree mới nhất (origin/master 8a1d9de, save v32).

**Lưới và vỏ tiệm**
- `SPA_LAYOUT_1A` (`src/sim/layout.ts:22-40`) là vỏ 13 × 18. Cửa (6, 17), cầu thang `U` ở x = 11 hàng 7–9 (chân (11, 10)), quầy (8–10, 14), bình phong hàng 6, chỗ giường có sẵn `E` ở (6, 2) và (8, 2). `DEFAULT_ITEMS`, `BED_SLOTS` (`items.ts:253, 256`) và cửa, cầu thang của lưới đều lấy từ đây.
- `BRANCH_LAYOUT` (`places.ts:12`) là `SPA_LAYOUT_1A` bỏ cầu thang. `PLACE_DECOR` đặt món quà chi nhánh ở (11, 10).
- `this.shell = towerOf(shellOf(layout))` dựng một lần lúc tạo `SpaSim` (`spa.ts:240`) và trong `fromSave` (`:930-940`).
- **`towerOf`** (`floors.ts:17`) dựng tầng trên bằng cách biến mọi ô trong (trừ `U`) thành sàn. Với vỏ 37 cột, cột nhà chưa mua ở tầng trên sẽ thành sàn: phải sửa.
- Lưới, tìm đường, loang, `nearestSpot`, `offFloor`, vẽ lưới kê đồ, đường đi của thú đều theo `grid.cols`, không giả định 13. Cột `#` là tường, không đi, không kê được.
- `parseLayout` chỉ nhận một cửa và một cầu thang mỗi tầng (`grid.ts:90, 102`).
- `bedWall` cần tường ngay trên đầu giường chưa xoay (`build.ts:68`): căn mới phải có tường sau ở hàng 0–1.
- `OWNER_START = (9, 13)` (`config.ts:276`) giờ chỉ dùng khi không có quầy; chủ tiệm đầu ngày đứng ở quầy cũ nhất.

**Hằng số toạ độ phải cộng 12** (toạ độ ô, không tính những gì lấy từ layout hay từ `item.x/y`)
- `RoomView.ts`: `SIGN.x 7.8` (:22), `WALL {0.3, 12.7}` (:24), `FLOOR {1, 2, 12, 17}` (:29), `PLAQUE.x 4.3` (:32), `CANDLES` (:42-47), `STAIRS_TILE (11, 7)` (:52), chuồng cu `10.75` (:114).
- `RIVAL_SIGN` (:37) đặt theo pixel màn hình `GAME_W − 16`: phải đổi sang theo ô.
- `art/room.ts`: `WINDOW_X 10.5` (:37); `clock(cols/2)` (:112).
- `art/floors.ts`: tầng 2 và sân thượng cố định `COLS = 13` (:6) với cửa sổ, đèn, cửa kính, chậu, mây, bồn nước, dây phơi, hoa giấy, chuồng cu đặt theo x cố định.
- Phòng chi nhánh `art/oldTown.ts`, `uptown.ts`, `beach.ts`: rộng theo `cols`, nhưng đồ trang trí đặt theo x cố định.
- `BuildScene.ts:46` `centre = {x: 6, …}`, chỗ món mới hiện ra.
- `places.ts:15-19` `PLACE_DECOR`.

**Save** (`save.ts`, `SAVE_VERSION = 32`)
- Trường có toạ độ ô: `items[].x/y`; `owner.pos`, `owner.path[]`; `customers[].pos`, `.path[]`, `.seat`; `staff[].pos`, `.path[]`. Tiệm chính và từng chi nhánh trong `chain.branches[]` đều có.
- Thú cưng chỉ lưu id, giống, tên. Vị trí thú nằm ở màn hình và tung lại lúc mở save: không phải dời.
- `withScreensAndDesk` (v3–v29, :239-247) và `withDefaultItems` (v1–v2) thêm đồ lấy từ `DEFAULT_ITEMS` hiện tại, chạy trước `parseVersioned`. Nếu layout dời 12 cột thì chúng sẽ thêm đồ ở toạ độ mới vào save toạ độ cũ: phải xử lý thứ tự (mục 8).
- Dời cầu thang v14 là mẫu: `parseShop` đọc phiên bản cũ trước khi ghi đè `v`, rồi `SpaSim.fromSave` làm việc dọn. Sau đó `fromSave` ném `SaveError` cho món nào `offFloor`.

**Màn hình**
- Chưa scene nào dùng camera: không có `cameras`, `scrollFactor`, `worldX`. Mọi toạ độ chạm là `p.x/p.y`.
- `MAP_X = 33` chỉ để căn giữa 13 cột ((1080 − 13·78) / 2).
- Vẽ cố định trên màn hình: `Hud` (thanh trên, dải chi nhánh y 198, nút sổ khách, dòng "hôm nay" y 1690, bốn nút y 2020, băng rôn y 300, thông báo ngắn), `FloorBar` (y 1855, dựng cả trong `SpaScene` và `BuildScene`), `HandPointer`, và các bảng vẽ ngay trong `SpaScene`: bảng huy hiệu, bảng mở tầng (:1004-1044), bảng mua giường (:1076-1082), bảng bản cũ (:491), cửa cuốn chuỗi (:415), huy chương, bảng sự kiện, lễ, VIP.
- Thuộc bản đồ: `RoomView`, người, `StaffLayer`, `PetLayer`, bong bóng chữ (đang kẹp trong `GAME_W`), thanh kiên nhẫn, tiền bay lên, thanh tra, người đi đường.
- `floatMoneyAt` và `HandPointer` dùng cho cả hai loại: toạ độ trên bản đồ (khách) và trên màn hình (bộ đếm tiền, nút).
- Các bảng khác (Xây dựng, Nhân viên, Dịch vụ, mini-game…) là scene riêng, không bị thu phóng.

**Chạm**
- `SpaScene.onTap` (:1762-1777): bỏ qua nếu đã kéo quá `TAP_SLOP_PX = 20` (:87). Có đối tượng tương tác dưới ngón thì chỉ vuốt ve thú rồi thôi. Rồi tìm khách đang chờ theo hình, rồi `room.worldToTile` → `sim.tapTile`.
- `BuildScene`: vùng bắt chạm cả màn hình; kéo món đồ theo `(p.x − drag.x) / TILE` (sai khi thu phóng); hình món, tô màu, lưới vẽ ở `MAP_X` trong camera riêng của `BuildScene`.
- Thứ tự scene ở `main.ts:58`. `BuildScene` phủ từ y 1640, che bốn nút chính.

**Tầng và đi theo**
- Đổi tầng là đổi hình phòng và dời hàng (`rowY`), không cuộn. `SpaScene.showFloor` (:964-968) là chỗ duy nhất đổi tầng; `followFloor` (:1117-1120) đi theo chủ tiệm khi dẫn khách sang tầng khác.

**Nhân viên và mở tầng (mẫu cho mua nhà)**
- `staffCap(role, floors)` (`crew.ts:95-97`), dùng ở `hireProblem`, chuyển nhân viên giữa chuỗi, bảng chuỗi, bảng Nhân viên.
- `floorProblem` / `openFloor` (`spa.ts:1352-1370`), `FLOOR_PRICE`, `UNLOCK_DAY.floors`, bảng `offerFloor` (`SpaScene.ts:1004-1060`), chữ `floorName/Line/Open/Short/…`.

## 4. Thiết kế

### 4.1 Lưới rộng 37 cột (chồng yêu chọn cách 1)

- Mỗi tầng rộng **37 cột** (cột 0–36), cao 18 hàng như cũ. Ba tầng vẫn chồng nhau thành một lưới dài 37 × 54.
- **Tiệm hiện tại nằm ở cột 12–24** (cũ là 0–12). Mọi toạ độ ô cũ cộng 12 vào x. Hàng không đổi.
- **Bốn căn nhà**, mỗi căn 6 cột:

| Căn | Cột mới mở | Tường ngoài sau khi mua | Cột tường cũ thành sàn |
|---|---|---|---|
| Trái 1 (sát tiệm) | 7–11 | 6 | 12 |
| Trái 2 | 1–5 | 0 | 6 |
| Phải 1 (sát tiệm) | 25–29 | 30 | 24 |
| Phải 2 | 31–35 | 36 | 30 |

- **Cột chưa mua là tường** trong lưới: không đi được, không kê đồ được, không ai tới được. Không cần loại ô mới. **(em đề xuất)**
- **Vỏ tiệm dựng từ số căn đã mua mỗi bên** (0–2 trái, 0–2 phải), giống cách `towerOf` dựng tầng trên từ vỏ tầng 1. Mua xong thì dựng lại lưới như sau một lần kê đồ.
- **Cột tường cũ thành sàn** ở hàng 2–16. Hàng 0–1 (tường sau) và hàng 17 (tường trước) của căn mới vẫn là tường. Cửa vẫn chỉ một, ở giữa tiệm cũ.
- **Cầu thang** ở cột 23 (cũ là 11), hàng 7–9, chân ở (23, 10), mọi tầng như cũ.
- **Chi nhánh cũng dùng lưới 37 cột**, tiệm ở cột 12–24 và bốn căn luôn khoá. Như vậy mọi hằng số toạ độ chỉ có một bộ cho mọi tiệm. Save chi nhánh cũng dời +12. **(em đề xuất)**
- **Tầng trên giữ cột khoá:** `towerOf` chỉ biến thành sàn những ô trong của tầng 1 không phải tường; cột nhà chưa mua giữ `#` ở mọi tầng.
- **Hình phòng vẽ theo phần đã mở:** hình sàn, tường, mặt tiền, vỉa hè của tầng 1, tầng 2, sân thượng và phòng chi nhánh trải từ tường ngoài bên trái tới tường ngoài bên phải của phần đã mua, không trải cả 37 cột. Vẽ lại khi mua nhà. Đồ trang trí cố định trong hình (cửa sổ, đồng hồ, đèn, chậu, bồn nước, chuồng cu…) giữ đúng chỗ cũ trên tiệm cũ, tức là cộng 12.
- **`MAP_X` thành gốc toạ độ của bản đồ**, không còn để căn giữa. Ở cỡ thường, đầu ngày, camera đặt sao cho cột 12–24 nằm đúng chỗ tiệm đang nằm trên màn hình bây giờ.

### 4.2 Bốn căn nhà

- **Mỗi bên 2 căn.** Căn sát tiệm phải mua trước, căn xa mới rao bán. Mua bên nào trước tuỳ người chơi. **(chồng yêu chọn trên bản phác)**
- **Mỗi căn có gạch bông và màu tường riêng** ở tầng 1, lấy theo bản phác: **(chồng yêu chọn trên bản phác)**

| Căn | Tường | Gạch bông (nền, góc, hoa) | Mái khi chưa mua |
|---|---|---|---|
| Phải 1 | hồng `#F2C4C0` | kem, xanh ngọc, hồng sen | tôn |
| Trái 1 | xanh nhạt `#BFD9E6` | trắng ngà, xanh coban, đỏ gạch | ngói |
| Phải 2 | tím nhạt `#D9CBE8` | trắng ngà, hồng sen, xanh ngọc | ngói |
| Trái 2 | xanh lá nhạt `#CBE6C9` | trắng ngà, nâu gỗ, xanh coban | tôn |

- Ranh giới gạch giữa hai căn nằm đúng đường tường cũ.
- **Tầng 2 và sân thượng của căn mới** dùng sàn của tầng đó (gỗ ở tầng 2, gạch tàu ở sân thượng) và tường sau màu riêng của căn. Mua một căn là có cả ba tầng của căn đó; tầng trên chưa mở thì phần đó cũng chưa vào được, mở tầng thì có luôn. **(em đề xuất)**
- **Mặt tiền:** kính của tiệm nối dài sang căn mới, không có cửa. **(chồng yêu chọn trên bản phác)**

### 4.3 Nhà rao bán và mua nhà

- **Rao bán từ ngày 10** (`UNLOCK_DAY.houses`). Trước ngày 10 không thấy nhà rao bán, bản đồ ở cỡ thường vừa khít màn hình như bây giờ. **(chồng yêu chọn trên bản phác)**
- **Căn đang rao bán** hiện mái nhà (ngói hay tôn), mặt tiền cửa cuốn, vỉa hè và lòng đường nối dài, và tấm biển trắng viền đỏ "BÁN NHÀ / CHÍNH CHỦ" kèm giá. **(chồng yêu chọn trên bản phác)**
- **Căn chưa rao bán** (căn xa khi căn gần chưa mua, hoặc cả bốn căn trước ngày 10) không vẽ, nằm ngoài vùng xem.
- **Chạm vào mái hay biển** thì màn hình trượt tới căn đó và hiện bảng mua:
  - Tên ("Mua nhà bên phải", "Mua thêm căn bên trái"…).
  - Ba dòng: "Thêm 6 ô bề ngang cho cả ba tầng." / "Đục tường thông sang, giữ gạch bông và màu tường của nhà cũ." / "Thêm 1 chỗ kỹ thuật viên."
  - Nút "Mua · 3.000.000 đ" và nút "Để sau".
- **Thiếu tiền:** nút mua mờ, ghi "Còn thiếu …", giống bảng mở tầng.
- **Giá:** căn sát tiệm 3.000.000 đ, căn xa 6.000.000 đ. **(chồng yêu chọn trên bản phác, số tạm)**
- **Mua được bất cứ lúc nào** từ ngày 10, kể cả giữa giờ mở cửa, như mở tầng. **(em đề xuất)**
- **Mua xong:**
  - Trừ tiền, dựng lại lưới, phát sự kiện `houseBought`.
  - Mái mờ dần và bay lên, bụi tung dọc đường tường cũ, rồi sàn mới hiện ra. Khoảng 0,7 giây. **(em đề xuất)**
  - Màn hình trượt tới giữa căn mới.
  - Căn xa bên đó (nếu còn) bắt đầu rao bán.
  - Lần mua đầu hiện gợi ý một lần (`buyHouse`): "Bấm Xây dựng để kê giường sang nhà mới". **(em đề xuất)**
  - Không kê sẵn đồ. Đồ trong bản phác chỉ để dễ hình dung. **(em đề xuất)**
- Dùng tiếng mua đồ có sẵn.

### 4.4 Vuốt và thu phóng

- **Một ngón vuốt để xem**, theo cả hai chiều khi bản đồ lớn hơn vùng xem. Thả tay thì trượt thêm một chút rồi dừng. **(chồng yêu chọn trên bản phác)**
- **Hai ngón chụm lại thu nhỏ, mở ra phóng to.** Điểm giữa hai ngón đứng yên trên bản đồ. **(chồng yêu chọn)**
- **Nút + và −** ở mép phải, trên thanh vị trí. Mỗi lần bấm phóng to hay thu nhỏ 1,35 lần quanh giữa vùng xem, trượt êm khoảng 0,2 giây. **(chồng yêu chọn trên bản phác)**
- **Trên máy tính:** chụm trên bàn di chuột (wheel có ctrl) cũng thu phóng. Lăn chuột thường không làm gì. **(em đề xuất)**
- **Giới hạn:**
  - Thu nhỏ nhất: cả phần đang xem được (tiệm và các căn đang rao bán) vừa bề ngang màn hình. Nếu như vậy vẫn lớn hơn cỡ thường thì thu nhỏ nhất là cỡ thường.
  - Phóng to nhất: 1,6 lần cỡ thường.
  - Phóng to thì hình hơi mờ cũng được. Hình vẫn vẽ ở cỡ thường như bây giờ, máy chỉ kéo giãn; không vẽ lại hình cỡ lớn. **(chồng yêu chọn)**
  - Bản đồ nhỏ hơn vùng xem theo chiều nào thì nằm giữa theo chiều đó, không vuốt được chiều đó.
- **Vùng xem** là từ dưới thanh trên tới trên nút tầng. Bản đồ không vẽ tràn ra ngoài vùng này. **(em đề xuất)**
- **Đầu mỗi ngày:** cỡ thường, giữa tiệm cũ, tầng 1. **(chồng yêu chọn trên bản phác)**
- **Lúc mở save:** cỡ thường, chủ tiệm ở giữa (trong giới hạn vuốt), tầng chủ tiệm đang đứng. Cỡ và vị trí xem không lưu. **(em đề xuất)**
- **Đổi tầng** giữ nguyên cỡ và vị trí ngang. **(em đề xuất)**
- **Chữ trên đầu người, bong bóng, tiền bay lên** thu phóng theo bản đồ. Bong bóng kẹp trong vùng đang thấy thay vì trong `GAME_W`. **(em đề xuất)**

### 4.4b Cái gì đứng yên, cái gì thu phóng

- **Đứng yên** (scene giao diện mới, nằm trên bản đồ, dưới các scene bảng như Xây dựng, Nhân viên…): thanh trên, dải chi nhánh, nút sổ khách, dòng "hôm nay", băng rôn sáng, thông báo ngắn, nút tầng, bốn nút chính, thanh vị trí, nút + −, và mọi bảng đang vẽ ngay trong `SpaScene` (mở tầng, mua giường, mua nhà, huy hiệu, bản cũ, cửa cuốn chuỗi, huy chương, sự kiện, lễ, VIP).
- **Thu phóng** (ở lại `SpaScene`): phòng, đồ, người, thú, bong bóng, thanh kiên nhẫn, tiền bay lên, thanh tra, người đi đường.
- **Tiền bay về bộ đếm tiền** (thưởng thanh tra) bay trên lớp đứng yên.
- **Bàn tay gợi ý** nằm ở lớp đứng yên. Chỉ vào nút thì như cũ. Chỉ vào khách thì đổi toạ độ khách sang màn hình mỗi khung hình; khách ở ngoài vùng đang thấy thì màn hình trượt tới khách trước khi hiện tay. **(em đề xuất)**
- **Chạm vào một nút ở lớp đứng yên** không được lọt xuống bản đồ thành một lần chạm ô.

### 4.5 Phân biệt chạm, vuốt, chụm

- Ngón tay đi quá `TAP_SLOP_PX` (20 px khung 1080, đang có) từ chỗ đặt xuống là vuốt, không còn là chạm.
- Có ngón thứ hai đặt xuống là chụm; cả lần chạm đó không bao giờ tính là chạm, kể cả khi nhấc một ngón ra trước.
- Chạm (không vuốt, không chụm) làm đúng như bây giờ: mời khách, đi tới ô, mở thẻ nhân viên…
- Chạm được tính theo toạ độ trên bản đồ sau khi đã đổi theo cỡ và vị trí xem.

### 4.6 Thanh vị trí

- **Một thanh dài nằm trên dải đường phố**, dưới bản đồ, trên nút tầng. **(chồng yêu chọn trên bản phác)**
- Thanh vẽ thu nhỏ cả phần xem được theo bề ngang: tiệm cũ màu kem, căn đã mua màu tường của căn, căn đang rao bán viền đứt có biển đỏ nhỏ, vạch cam ở chỗ cửa.
- **Khung xanh** là phần đang thấy trên màn hình.
- **Mặt chủ tiệm** ở chỗ chủ tiệm đang đứng (cùng tầng hay khác tầng).
- **Chấm đỏ** ở chỗ có khách đang chờ (ghế chờ, VIP đứng chờ) mà nằm ngoài màn hình hoặc ở tầng khác. Chấm đỏ trên nút Tầng 1 vẫn giữ như cũ.
- **Chạm vào thanh** thì màn hình trượt tới chỗ đó (giữ cỡ đang xem).
- **Chỉ hiện khi có gì để vuốt tới**: bản đồ lớn hơn vùng xem theo bề ngang (đang phóng to, hoặc có nhà đã mua hay đang rao bán). **(em đề xuất)**
- Thanh không được che dòng "hôm nay" và thông báo ngắn (cùng ở y 1690); chỗ chạm cao ít nhất 72 px. Vị trí y chính xác để người làm chọn.

### 4.7 Màn hình đi theo chủ tiệm

- Khi chủ tiệm dẫn khách tới giường mà đi ra ngoài vùng xem, màn hình trượt theo cho chủ tiệm về giữa. Giống luật đi theo khi lên tầng, và đổi tầng như cũ. **(chồng yêu chọn trên bản phác)**
- Ngoài lúc đó, màn hình chỉ đổi khi chồng yêu vuốt, chụm, bấm nút, chạm thanh, chạm nhà rao bán, hay ngay sau khi mua nhà.
- Đang vuốt hay chụm thì không tự trượt.

### 4.8 Kê đồ

- Chế độ Xây dựng dùng cùng cỡ và vị trí xem với bản đồ. Lưới mờ, hình món đang cầm và chỗ chạm đều tính theo đó. Kéo món đồ tính theo ô trên bản đồ (độ dời ngón tay chia cho cỡ xem), không theo pixel màn hình.
- Món mới mua hiện ở ô trống gần giữa vùng đang thấy trên tầng đang xem (cũ là quanh cột 6). **(em đề xuất)**
- **Vuốt và chụm vẫn dùng được** khi không cầm món nào.
- **Vùng xem trong chế độ Xây dựng** kết thúc ở mép trên bảng Xây dựng (y 1640, hay mép thấp hơn khi đang cầm món), không phải ở nút tầng. Giới hạn thu nhỏ và luật nằm giữa ở 4.4 tính theo vùng này. **(em đề xuất)**
- **Thanh vị trí ẩn** trong chế độ Xây dựng, vì bảng che chỗ đó. **Nút + và −** hiện ở mép phải, ngay trên bảng Xây dựng, để trên máy tính vẫn thu phóng được. **(em đề xuất)**
- **Đang kéo một món tới sát mép trái hay phải vùng xem** (trong 80 px) thì màn hình tự trượt theo hướng đó. **(chồng yêu chọn trên bản phác)**
- Luật kê đồ giữ nguyên: mọi giường và ghế đi tới được từ cửa; ghế chờ chỉ ở tầng 1; không che cầu thang, chân cầu thang, ô trong cửa, chỗ chủ tiệm đứng đầu ngày.
- Đồ đặt được ở mọi cột đã mua.

### 4.9 Nhân viên

- **Thợ tối đa:** 3 + 2 × (số tầng đã mở − 1) + số căn đã mua. Tối đa 11. **(chồng yêu chọn trên bản phác, số tạm)**
- Thợ rảnh vẫn đứng chờ quanh quầy ở tiệm cũ.

## 5. Các cách đã cân nhắc

### Lưới

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **1. Lưới 37 cột ngay từ đầu, cột chưa mua là tường.** | Mọi luật đang chạy trên một lưới y nguyên. Mua nhà chỉ là dựng lại vỏ. Sau lần dời đầu, không bao giờ dời gì nữa. | Dời mọi toạ độ cũ sang phải 12 một lần: hằng số trong code và save cũ. | **Chồng yêu chọn** |
| 2. Lưới lớn dần theo mỗi căn mua. | Lưới nhỏ khi chưa mua. | Mỗi lần mua bên trái phải dời mọi thứ 6 ô, kể cả người đang đi và đường đang tính. Dễ lỗi. | Không chọn |
| 3. Chỉ mở sang phải. | Không dời gì. | Trái điểm 1 đã duyệt, cửa lệch hẳn sang trái. | Không chọn |

### Bản đồ thu phóng mà thanh trên, nút tầng đứng yên

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **A. Tách thanh trên, nút tầng, bốn nút chính, thông báo ngắn, thanh vị trí, nút + − sang một scene riêng nằm trên bản đồ.** Camera chính của bản đồ tự do thu phóng. | Đối tượng mới vẽ trên bản đồ không cần đánh dấu gì. Giống mẫu `UIScene` chạy song song `WorldScene` của Phaser. | Phải dời code giao diện sang scene mới và nối sự kiện giữa hai scene. | **Em đề xuất** |
| B. Thêm camera thứ hai cho giao diện trong cùng scene, mỗi camera bỏ qua đối tượng của bên kia. | Ít dời code. | Mỗi đối tượng mới (người, bong bóng, tiền bay) phải nhớ đánh dấu cho camera kia bỏ qua, quên là bị vẽ hai lần. | Không chọn |
| C. Bỏ mọi thứ của bản đồ vào một container rồi phóng to container. | Đơn giản. | Container của Phaser xếp lớp theo thứ tự thêm vào, không theo `depth`, mà game đang xếp người và đồ theo `depth`. | Bỏ |

## 6. Tham khảo game mã nguồn mở

- **OpenRCT2** (bản làm lại RollerCoaster Tycoon 2): bản đồ cố định, mỗi ô đất ghi "đang bán" hay "đã mua", mua đất chỉ đổi cờ. Giống Cách 1.
- **Phaser, ví dụ `UIScene` chạy song song `WorldScene`:** giao diện ở scene riêng, đọc camera của scene bản đồ để đổi toạ độ. Giống Cách A.
- **Phaser, ví dụ camera riêng cho giao diện** dùng `camera.ignore`. Đây là Cách B, em không chọn vì lý do trên.

## 7. Chia lô (em đề xuất)

### Lô A: lưới 37 cột, thu phóng (save v33)
- Lưới 37 cột, dời mọi toạ độ +12 (4.1), cả chi nhánh.
- Save v33: dời toạ độ và thêm số căn đã mua (mục 8).
- Scene giao diện riêng (Cách A).
- Vuốt, chụm, nút + −, phân biệt chạm (4.4, 4.5).
- Thanh vị trí (4.6), đi theo chủ tiệm (4.7), kê đồ theo camera (4.8).
- Chưa có nhà rao bán, nên ở cỡ thường bản đồ vẫn vừa màn hình; vuốt có tác dụng khi phóng to.

### Lô B: mua nhà (không đổi save)
- Nhà rao bán, biển, bảng mua, mua nhà (4.2, 4.3).
- Hình căn đã mua ở cả ba tầng, gạch bông và tường riêng.
- Thợ tối đa theo số căn (4.9).
- Thanh vị trí có căn đã mua và căn rao bán.

- **Chồng yêu duyệt tài liệu này một lần cho cả hai lô.** Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo. **(em đề xuất, giữ cách các đợt trước)**

## 8. Save v33 và tiệm cũ

- **v33 thêm** `houses: { left: 0–2, right: 0–2 }` cho tiệm chính. Chi nhánh không có.
- **Mở save v32 trở xuống:** mọi toạ độ ô của mọi tiệm (tiệm chính và từng chi nhánh) cộng 12 vào x: `items[].x`, `owner.pos`, `owner.path[]`, `customers[].pos/.path[]/.seat`, `staff[].pos/.path[]`. `houses = { left: 0, right: 0 }`.
- **Thứ tự:** các bước sửa save rất cũ (`withDefaultItems`, `withScreensAndDesk`) chạy trên toạ độ cũ với một bản layout 13 cột giữ nguyên (đặt tên kiểu `LEGACY_LAYOUT`), rồi mới dời +12 một lần ở cuối. Không bao giờ dời hai lần. **(em đề xuất)**
- Vị trí thú không lưu nên không dời.
- **Món đồ hay người nằm ở cột chưa mua** thì save hỏng, như đồ nằm trên tường bây giờ.
- **Test cũ của save v1–v32 vẫn qua**, so vị trí sau khi đã cộng 12.

## 9. Tiêu chí xong

### Lô A
- Mọi test cũ qua (sau khi cập nhật toạ độ +12).
- Mở một save v32 giữa ngày có khách đang đi, thợ đang làm, thú đang đi: mọi thứ tiếp tục đúng chỗ, độ đẹp không đổi.
- Em tự kiểm trên trình duyệt, khung iPhone:
  - phóng to, vuốt bốn hướng, thu nhỏ về cỡ thường;
  - nút + − ;
  - vuốt rồi nhấc tay không làm chủ tiệm chạy đi; chụm không mời nhầm khách;
  - thanh trên, nút tầng, bốn nút chính đứng yên khi thu phóng;
  - đang phóng to, chủ tiệm dẫn khách ra ngoài màn hình thì màn hình đi theo;
  - kê đồ khi đang phóng to, kéo món đồ sát mép thì màn hình trượt;
  - một chi nhánh vẫn chơi như cũ.

### Lô B
- Test: mua đủ bốn căn theo đúng thứ tự, không mua được căn xa trước căn gần, thiếu tiền, trước ngày 10; thợ tối đa; đường đi qua cột tường cũ; ghế, giường ở căn mới đi tới được.
- Em tự kiểm trên trình duyệt:
  - căn rao bán hiện từ ngày 10, chạm mái ra bảng mua;
  - mua căn phải, kê giường massage sang đó, chủ tiệm dẫn khách sang, màn hình đi theo;
  - mua đủ bốn căn, thu nhỏ hết cỡ thấy cả dãy;
  - mở tầng 2 sau khi đã mua nhà: tầng 2 rộng theo;
  - thanh vị trí có chấm đỏ khi khách chờ ngoài màn hình.

## 10. Số khởi đầu (`src/config.ts`)

| Tên | Giá trị | Ghi chú |
|---|---|---|
| `SHOP_X0` | 12 | cột trái của tiệm cũ trong lưới mới |
| `HOUSE_COLS` | 6 | cột mỗi căn |
| `HOUSES_PER_SIDE` | 2 | |
| `HOUSE_PRICE` | 3.000.000 đ, 6.000.000 đ | căn sát tiệm, căn xa |
| `UNLOCK_DAY.houses` | 10 | |
| Thợ tối đa | 3 + 2 × (tầng − 1) + số căn | tối đa 11 |
| `ZOOM_MAX` | 1,6 | |
| `ZOOM_STEP` | 1,35 | mỗi lần bấm + hay − |
| `TAP_SLOP_PX` | 20 px | đang có; quá mức này là vuốt |
| `EDGE_SCROLL` | 80 px | kéo đồ sát mép thì trượt |

## 11. Để người làm tự quyết

- Tên scene giao diện và cách nối sự kiện với `SpaScene`.
- Cách lưu cỡ và vị trí camera trong `SpaScene` và đưa sang `BuildScene`.
- Nét vẽ cụ thể của mái, biển, tường, gạch bông, miễn theo bản phác và bảng màu.
- Chữ trên bảng mua, miễn ngắn, rõ, có giá.
- Vị trí y của thanh vị trí và nút + −, miễn theo điều kiện ở 4.4 và 4.6.
- Chia file test.

## 12. Chồng yêu thử trên iPhone sau khi lên

- Giá 3.000.000 đ và 6.000.000 đ, ngày 10 có sớm hay muộn.
- Chụm hai ngón có mượt, nút + − có cần không.
- Thu nhỏ hết cỡ, người và giường có nhỏ quá không.
- Phóng to hết cỡ, hình mờ có khó chịu không. Khó chịu thì hạ `ZOOM_MAX` xuống khoảng 1,3.
- Thanh vị trí có dễ hiểu, chấm đỏ có đủ để biết khách đang chờ.
- Đi bộ từ cửa sang căn xa có lâu quá không.
