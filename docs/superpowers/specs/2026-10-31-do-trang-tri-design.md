# Thêm đồ trang trí: 3 bộ mới, đồ treo tường, thảm

- Ngày: 2026-10-31
- Trạng thái: chờ chồng yêu duyệt.
- Lý do: người chơi góp ý đồ trang trí "hơi ít, thiếu thẩm mỹ".

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu.

## 1. Chồng yêu muốn gì

- **Nhiều đồ trang trí hơn và đẹp hơn**, để người chơi có cái mua và bày tiệm cho xinh. **(chồng yêu chọn)**
- **Có cả đồ treo tường và thảm trải sàn**, không chỉ đồ đặt trên sàn. **(chồng yêu chọn)**
- **Kéo thả tự do như đồ hiện có (cách 1).** Mua, kéo, xoay, bán nửa giá y như cũ, chỉ khác chỗ được đặt. **(chồng yêu chọn)**

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Thêm 25 món mua được, trong đó có 3 bộ mới mỗi bộ 6 món.
- Tường sau không còn trống trơn, sàn có thảm, nên tiệm trông ấm và có gu.
- Người chơi tìm được món mình muốn mà không phải lật 10 trang danh mục.

### Chưa làm
- Vẽ lại các món đang có.
- Đặt sẵn thảm hay tranh vào tiệm mới mở.
- Treo đồ lên tường hai bên hay tường trước.
- Treo đồ trên sân thượng (tầng 3). Ở đó tường sau chỉ là bức tường thấp, phía trên là trời.
- Đổi điểm đẹp tối đa (81) hay luật điểm hạng.

### Điều cấm
- Bản lưu cũ mở lên bị mất hay đổi bất cứ thứ gì đang có.
- Thảm chặn đường đi hay làm khách và nhân viên đi vòng.
- Chạm vào giường hay ghế đang nằm trên thảm mà game lại nhấc tấm thảm lên.
- Đồ treo tường vẽ đè lên người đang đứng sát tường.

## 3. Các cách đã cân nhắc

1. **Kéo thả tự do (chồng yêu chọn).** Đồ treo và thảm là `Item` như mọi món khác: cùng danh sách `ITEMS`, cùng cách mua, dời, xoay, bán và lưu. Chỉ thêm hai luật đặt mới. Ưu điểm: người chơi không phải học thêm gì, code dùng lại gần hết. Nhược điểm: thảm nằm dưới giường thì phải chạm vào phần lộ ra mới dời được.
2. **Chỗ treo và chỗ trải cố định.** Mỗi tầng có vài móc và vài chỗ thảm sẵn. Dễ bấm, nhưng gò bó, và tiệm nào cũng giống tiệm nào. Không chọn.
3. **Chế độ "Trang hoàng" riêng.** Phải thêm nhiều giao diện mới mà không đẹp hơn cách 1. Đã bỏ.

## 4. Hiện giờ (cho người làm)

- Đồ: `ITEMS` trong `src/sim/items.ts`. Có `group` là `'bed' | 'seat' | 'decor'` và `set?: SetId` (hiện có `'saigon' | 'bamboo'`). Một bộ đủ 6 loại thì điểm đẹp của các món trong bộ nhân 1,5 (`beautyOf`, `setProgress`).
- Luật đặt: `placeProblem` và `claimed` trong `src/sim/build.ts`. Hàm `offFloor` bắt mọi ô phải là `'floor'` trên `shell`. Lưới đi lại là `buildGrid` trong `src/sim/grid.ts`.
- Tường sau: hai hàng đầu của mỗi tầng (`y % FLOOR_ROWS` bằng 0 và 1) là `'#'`, cao 2 ô. Phần dải tối nằm ở 1,65 đến 2. `FLOOR_ROWS = 18`, `MAX_FLOORS = 3`.
  - Tầng 1 vẽ ở `src/art/room.ts`, có cửa sổ chớp và đồng hồ.
  - Tầng 2 vẽ ở `src/art/floors.ts`.
  - Tường sau của nhà mua thêm vẽ ở `src/art/houses.ts` và `branchHouses.ts`.
  - Chi nhánh có tường riêng: `beach.ts`, `oldTown.ts`, `uptown.ts`.
- Vẽ đồ: SVG viết bằng code trong `src/art/furniture.ts` (`FURNITURE`, `itemTexture`). Mỗi món neo ở giữa cạnh dưới của các ô nó đứng. `RoomView.sync` đặt độ sâu bằng cạnh dưới (`ITEM_DEPTH_BIAS`).
  - `PART_DEPTH = 1` cho đèn lồng, chiếu và chỗ giường trống.
  - `FESTIVAL_DEPTH = 1.5` cho cờ và bảng ngày lễ.
  - `HOUSE_DEPTH = 0.5`.
- Xây dựng: `BuildScene` có 4 tab (Giường, Ghế, Trang trí, Thú cưng) và nút Xong, đã kín bề ngang 1080. Dòng thông tin dưới tab ghi điểm đẹp và tiến độ 2 bộ (`showScore`). Danh mục hiện 4 thẻ một trang (`catalogPage` trong `src/view/catalog.ts`). Chọn đồ khi chạm: `itemUnder`, ưu tiên món có ô dưới ngón tay.
- Lưu game: `SAVE_VERSION = 34` (`src/sim/save.ts`). Thêm loại đồ mới thì phải lên bản lưu mới, để bản game cũ từ chối thay vì làm mất đồ, như các lần trước.
- Tab Trang trí đang bán 17 thẻ: 15 món trang trí (giá 40.000 đến 250.000 đ, điểm đẹp từ 1 đến 5), cộng bình phong và quầy lễ tân (điểm đẹp 0).
- Ghế tre (`bambooBench`) thuộc bộ Tre làng nhưng nằm ở tab Ghế (`group: 'seat'`).
- `SpaSim.fromSave` từ chối bản lưu có món đè chân cầu thang (`spa.ts`, quanh dòng 951). Hàm `offFloor` từ chối mọi ô tường.

## 5. Thiết kế

### 5.1 Hai loại đồ mới **(chồng yêu chọn cách, chi tiết em đề xuất)**

Thêm `group` mới: `'wall'` (đồ treo) và `'rug'` (thảm). Cả hai đều nằm trong tab **Trang trí**.

**Đồ treo tường**
- Chiếm `w` ô trên **hàng tường thứ hai** của một tầng (`y % FLOOR_ROWS === 1`), cao 1 ô. Ô ngay dưới mỗi ô của nó (hàng 2) phải là sàn trên `shell`. Nhờ vậy món treo chỉ nằm trên tường sau, kể cả phần tường của nhà đã mua, và không lọt vào góc tường bên.
- Chỉ treo ở tầng 1 và 2. Tầng phải đã mở.
- Hai món treo không được đè ô nhau. Món treo không đụng tới giường, ghế, thảm, đường đi hay `buildGrid`.
- Được vẽ đè lên những gì tường tự có như cửa sổ, đồng hồ, phao cứu sinh. Người chơi thấy ngay và tự chọn chỗ. **(em đề xuất)**
- Không xoay được, chỉ lật trái phải (`canTurn` trả về false).
- Độ sâu: trên tường và nhà mua thêm, dưới đèn lồng giường, cờ ngày lễ, giường, người. Em đề xuất 1,2: trên `PART_DEPTH`, dưới `FESTIVAL_DEPTH`. Nhưng đèn lồng giường đang ở `PART_DEPTH`, nên người làm cần nâng đèn lồng lên trên đồ treo, hoặc chọn số khác miễn đúng thứ tự trên.
- Hình vẽ treo trong khoảng y 0,25 đến 1,6 của tường, chừa dải tối ở chân tường.

**Thảm**
- Chiếm `w × h` ô sàn, có thể nằm dưới giường, ghế, bàn, đồ trang trí, ô làm việc, chỗ đứng sau quầy, ô ngay trong cửa và chân cầu thang.
- Hai tấm thảm không được đè ô nhau. Thảm không đè tường, cửa hay cầu thang, và phải nằm trên tầng đã mở.
- `offFloor` và lần kiểm tra chân cầu thang trong `SpaSim.fromSave` phải chừa ra cho món treo (ô tường) và cho thảm (chân cầu thang). Nếu không, bản lưu có hai loại này sẽ không mở được.
- Thảm không vào `buildGrid`, nên không đổi ô nào và người đi qua bình thường. Thảm không bao giờ gây lỗi `blocksPath`.
- Mọi món khác bỏ qua thảm khi kiểm tra chồng ô (`claimed` của thảm chỉ so với thảm khác).
- Thảm không vuông thì xoay được, và khi xoay vẫn **nằm phẳng**, không dựng đứng (`isUpright` trả về false cho thảm). Mỗi tấm thảm không vuông có hình riêng cho lúc xoay.
- Độ sâu: dưới mọi thứ đứng trên sàn, dưới chiếu ghế, chỗ giường trống và đèn lồng, trên sàn và nhà mua thêm. Em đề xuất 0,8.

**Chạm để nhấc đồ** (`itemUnder`)
- Ưu tiên món thường có ô dưới ngón tay, rồi đến món treo. Kế đó là hình đang vẽ dưới ngón tay (`room.itemAt`, như hiện nay), miễn hình đó không phải thảm. Cuối cùng mới tới thảm. **(em đề xuất)**
- Chạm vào giường trên thảm thì nhấc giường. Muốn nhấc thảm phải chạm vào phần thảm lộ ra.

**Cả hai loại** mua, dời, bán nửa giá, đổi tầng giống đồ trang trí cũ. Điểm đẹp cộng vào `beautyOf` như mọi món.

### 5.2 Ba bộ mới **(em đề xuất)**

Mỗi bộ 6 món: 3 món đặt sàn, 2 món treo, 1 tấm thảm. Gom đủ bộ thì nhân 1,5 như hai bộ cũ. `SetId` thêm `'zen' | 'retro' | 'garden'`.

| Bộ | Món | Loại | Ô | Giá | Đẹp |
|---|---|---|---|---|---|
| **Thiền xanh** | Thác nước tiểu cảnh | sàn | 2×1 | 220.000 | 5 |
| | Cây bonsai | sàn | 1×1 | 130.000 | 3 |
| | Đèn đá | sàn | 1×1 | 90.000 | 2 |
| | Tranh thủy mặc tre | treo | 2 | 160.000 | 4 |
| | Kệ treo nến thơm | treo | 1 | 80.000 | 2 |
| | Thảm cói | thảm | 2×2 | 150.000 | 3 |
| **Hoài cổ** | Máy hát đĩa than | sàn | 1×1 | 180.000 | 4 |
| | Quạt đứng | sàn | 1×1 | 80.000 | 2 |
| | Máy may | sàn | 2×1 | 160.000 | 3 |
| | Đồng hồ quả lắc | treo | 1 | 150.000 | 4 |
| | Lồng chim treo | treo | 1 | 100.000 | 3 |
| | Thảm hoa văn đỏ | thảm | 3×2 | 220.000 | 4 |
| **Vườn hoa** | Bể cá | sàn | 2×1 | 250.000 | 5 |
| | Chậu hoa giấy | sàn | 1×1 | 90.000 | 2 |
| | Bình hướng dương | sàn | 1×1 | 80.000 | 2 |
| | Giỏ dương xỉ treo | treo | 1 | 70.000 | 2 |
| | Kệ treo sen đá | treo | 2 | 120.000 | 3 |
| | Thảm cỏ hoa | thảm | 2×2 | 140.000 | 3 |

### 5.3 Bảy món lẻ **(em đề xuất)**

| Món | Loại | Ô | Giá | Đẹp |
|---|---|---|---|---|
| Tranh sơn mài phong cảnh | treo | 2 | 200.000 | 5 |
| Gương tròn khung mây | treo | 1 | 90.000 | 2 |
| Đèn tường lồng đèn | treo | 1 | 60.000 | 1 |
| Nón lá trang trí | treo | 1 | 50.000 | 1 |
| Thảm chạy dài | thảm | 1×3 | 90.000 | 2 |
| Thảm tròn kem | thảm | 2×2 | 110.000 | 2 |
| Thảm thổ cẩm | thảm | 2×3 | 180.000 | 4 |

### 5.4 Vẽ **(em đề xuất)**

- Cùng nét với đồ cũ: viền mực `C.ink`, nét `LINE`/`FINE`, dùng bảng màu `C` có sẵn. Màu nào thiếu (xanh lá đậm của bonsai, cam của cá...) thì thêm vào `C`.
- Món đặt sàn nhìn chéo từ trước như đồ cũ. Thảm nhìn từ trên xuống. Món treo nhìn thẳng.
- Món đặt sàn không vuông (thác nước, máy may, bể cá) có hình khi xoay, như đồ cũ.

### 5.5 Danh mục: lọc theo bộ **(em đề xuất)**

25 món mới cộng 17 thẻ đang có là 42 thẻ, tức 11 trang. Vì vậy riêng tab Trang trí sẽ đổi dòng thông tin thành bộ lọc:

- Dòng thông tin giữ "Đẹp N" ở bên trái. Bên phải là ô lọc `◀ Tên lọc ▶`, có thêm tiến độ `3/6` khi đang lọc một bộ.
- Bấm mũi tên thì đổi lọc theo vòng: **Tất cả → Sài Gòn xưa → Tre làng → Thiền xanh → Hoài cổ → Vườn hoa → Treo tường → Thảm**, rồi quay lại Tất cả.
- "Tất cả" giữ thứ tự như bây giờ, món mới nối vào sau. Bình phong và quầy lễ tân chỉ nằm ở "Tất cả".
- Lọc theo một bộ thì hiện đủ 6 món của bộ, kể cả món thuộc tab khác. Ví dụ ghế tre hiện ở cả tab Ghế lẫn mục lọc Tre làng, để người chơi mua đủ bộ ngay tại đó. **(em đề xuất)** Quà đang chờ luôn đứng đầu ở mục "Tất cả" và ở mục có món quà đó.
- Đổi lọc thì về trang đầu. Đóng rồi mở lại Xây dựng thì vẫn nhớ lọc trong phiên chơi đó, không cần lưu. Riêng khi Xây dựng mở ra vì có quà đang chờ, lọc quay về "Tất cả" để thấy thẻ quà. **(em đề xuất)**
- Các tab Giường, Ghế giữ dòng thông tin như cũ, nhưng chỉ ghi điểm đẹp. Tiến độ bộ chuyển hẳn sang ô lọc.

### 5.6 Lưu game

- Lên `SAVE_VERSION = 35`. Bản game cũ gặp bản lưu có món mới sẽ từ chối thay vì làm rơi món.
- Bản lưu cũ (v34 trở về trước) mở lên y nguyên, không thêm bớt gì.
- Thêm `tests/fixtures/save-v35.json` có ít nhất một món treo và một tấm thảm nằm dưới giường.

## 6. Kiểm tra

- Test sim:
  - Món treo chỉ đặt được ở hàng tường thứ hai của tầng 1 và 2, trên sàn đã mở, kể cả phần tường nhà đã mua.
  - Món treo không đặt được ở góc tường bên, hàng tường đầu, ô sàn, hay tầng 3. Hai món treo không đè nhau.
  - Thảm đặt được dưới giường, ghế, bàn, ô cửa, chân cầu thang, và không đổi `grid` hay đường đi.
  - Thảm không đè thảm, tường, cửa, cầu thang.
  - Thảm xoay vẫn nằm phẳng. Món treo không xoay.
  - Đủ bộ mới thì nhân 1,5.
  - `catalogPage` lọc đúng theo bộ, theo treo tường và theo thảm.
  - Bản lưu v35 mở lại đúng.
- Chạy game:
  - Đặt tranh trên tường tầng 1, tầng 2, nhà mua thêm và chi nhánh. Trải thảm dưới giường và ghế chờ.
  - Người đi qua thảm, chạm giường trên thảm thì nhấc giường. Xem ngày lễ thì cờ nằm trên tranh.
  - Xem trên khung điện thoại.

## 7. Để người làm tự quyết

- Mã của từng món, tên khóa chuỗi, hình vẽ chi tiết.
- Cách chia code giữa `build.ts`, `items.ts`, `grid.ts`.
- Con số độ sâu cụ thể, miễn đúng thứ tự ở 5.1.
- Chia làm mấy lô và thứ tự các lô.
