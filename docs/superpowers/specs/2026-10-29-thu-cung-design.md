# Thú cưng của tiệm

- Ngày: 2026-10-29
- Trạng thái: chồng yêu đã duyệt bản phác và 8 điểm ("Duyệt, triển khai đi em", 2026-10-29), kèm một thay đổi: giá nhân đôi.
- Bản phác: https://claude.ai/artifact/Jq5tUtskH1uYsFTMKN7sws
- Lý do: chồng yêu thấy game "hết cái để làm". Trong các hướng em đưa ra, chồng yêu chọn làm trước "món nhỏ, làm nhanh": nuôi mèo và chó trong tiệm.

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu.

## 1. Chồng yêu muốn gì

- **Tiệm nuôi mèo và chó, chỉ để ngắm và vuốt ve (cách A).** Thú cưng không đụng tới tiền, khách hay độ cân bằng của game. **(chồng yêu chọn)**
- **Tự đặt tên.** Có nhiều giống mèo, chó để chọn và mua. **(chồng yêu chọn)**
- **Giá nhân đôi** so với bản phác. **(chồng yêu chọn)**

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Tiệm có thêm sự sống: mèo nằm ngủ, chó chạy theo chủ, chạm vào thì kêu.
- Có thêm chỗ tiêu tiền, nhỏ thôi, cho người chơi đã thừa tiền.

### Chưa làm
- Thú cưng có ích cho tiệm (cách B: khách chờ gần thú cưng đỡ sốt ruột).
- Cho ăn, tắm, chăm sóc, đói, bệnh.
- Thú cưng ở chi nhánh.
- Lưu chỗ đứng của thú cưng.

### Điều cấm
- Bản lưu cũ mở lên bị mất hay đổi bất cứ thứ gì đang có.
- Thú cưng chặn đường người, làm khách đi vòng, chiếm ô.
- Chạm vào thú cưng mà chủ tiệm lại đi tới đó, hoặc mời nhầm khách.
- Thẻ thú cưng hiện đè lên mini-game, thẻ khác, hoặc lúc đang phục vụ khách.

## 3. Hiện giờ (cho người làm)

- Lưu game: `SAVE_VERSION = 31` (`src/sim/save.ts`). Mỗi tiệm (chính và chi nhánh) là một `SaveData`. `parseShop` sửa từng phần qua các hàm `repair*`. Bản lưu mẫu cũ nằm ở `tests/fixtures/save-vN.json`; chưa có `save-v31.json`.
- Thẻ một lần như "Áo mới" do `SpaScene.update` mở khi `shopFree()` (`showNewOutfits`, `NewOutfitScene`).
- Ô gõ tên: `nameInput` trong `src/view/dom.ts`, dùng ở `OwnerScene`. Tên tiệm làm sạch bằng `cleanShopName` (`src/sim/profile.ts`).
- Người đi lại: `moveAlong` trong `spa.ts`, tìm đường `findPath` (`src/sim/path.ts`) trên `sim.grid`, có cầu thang nối các tầng. `RoomView.tileToWorld` cho chân người ở đáy ô, `onFloor` cho biết ô đó có ở tầng đang xem không. Nhân vật vẽ ở độ sâu bằng `y`.
- Chạm vào tiệm: `SpaScene.onTap(pointer, over)` rồi `sim.tapTile`.
- Âm thanh: các tiếng một lần nằm ở `src/audio/sounds.ts` (`RECIPES`) và `cues.ts` (`Sfx`), làm bằng code.
- Hình: SVG viết bằng code, nạp thành texture ở `BootScene` qua `loadSvgTextures`.
- Xây dựng: `BuildScene` có 3 tab (`TABS`), mỗi tab rộng 260, thẻ đồ 211 × 258, 4 thẻ một trang.
- Chú Sáu là khách quen `sau` (`REGULARS.sau`, kiểu `elder`).

## 4. Thiết kế

### 4.1 Tám giống **(chồng yêu duyệt, giá ×2)**

| Mã | Tên | Loài | Giá | Tên gợi ý |
|---|---|---|---|---|
| `muop` | Mèo mướp | mèo | 300.000 đ | Mướp, Miu, Cam |
| `mun` | Mèo mun | mèo | 400.000 đ | Mun, Mực, Than |
| `tamthe` | Mèo tam thể | mèo | 600.000 đ | Bông, Ba Màu, Kem |
| `xiem` | Mèo Xiêm | mèo | 1.200.000 đ | Sữa, Xíu, Ngọc |
| `chota` | Chó ta | chó | 300.000 đ | Vàng, Lu, Ki |
| `phuquoc` | Chó Phú Quốc | chó | 1.000.000 đ | Mực, Đen, Gấu |
| `corgi` | Corgi | chó | 1.600.000 đ | Bơ, Lúa, Bánh Mì |
| `poodle` | Poodle | chó | 2.000.000 đ | Bông, Kẹo, Su Su |

Hình lấy từ bản phác (`pets.js`): mỗi giống có 6 dáng là đi 1, đi 2, ngồi, ngồi vẫy đuôi, vui (thè lưỡi), ngủ. Hình quay sang phải, lật để quay trái.

### 4.2 Con đầu tiên: Chú Sáu mang ổ tới **(chồng yêu duyệt)**

- Thẻ hiện khi tiệm chính chưa nhận ổ, từ ngày 2 trở đi, lúc tiệm rảnh (`shopFree`). Ván mới gặp thẻ vào ngày 2. Bản lưu cũ gặp thẻ ở lần mở đầu tiên sau khi cập nhật.
- Thẻ có Chú Sáu, một câu, và hai ô: Mèo mướp, Chó ta. Chạm một ô thì sang bước đặt tên, rồi nhận nuôi miễn phí.
- Có nút "Để sau" **(em đề xuất)**: thẻ quay lại vào ngày hôm sau, hoặc lần mở game sau. Nhận rồi thì không hiện nữa.
- Tiệm đã có thú cưng (mua ở tab) thì vẫn nhận ổ được, miễn chưa đủ 6 con **(em đề xuất)**. Đủ 6 con thì coi như ổ đã nhận.

### 4.3 Đặt tên **(chồng yêu duyệt)**

- Một thẻ đặt tên dùng chung cho ba việc: nhận ổ, mua, đổi tên.
- Ô gõ tên tối đa 12 chữ, làm sạch như tên tiệm. Để trống thì lấy tên gợi ý đầu. Ba nút tên gợi ý. Trùng tên với con khác vẫn được.
- Nút: "Hủy" và "Nhận nuôi" (kèm giá, hoặc "Miễn phí"). Khi đổi tên thì nút là "Lưu tên".

### 4.4 Tab Thú cưng trong Xây dựng **(chồng yêu duyệt, lô B)**

- Thêm tab thứ tư "Thú cưng". Bốn tab rộng 196, bước 204, chữ 38, để vừa nút Xong.
- Dòng thông tin: "Thú cưng trong tiệm: N/6", và thêm "· Đủ 6 con" khi đã đủ.
- Thẻ: con đang nuôi đứng trước (nền vàng nhạt, tên, giống, nút "Đổi tên", chữ "Cho đi"), sau đó là 8 thẻ mua (hình ngồi, tên giống, nút giá). Bốn thẻ một trang, có mũi tên lật trang.
- Không đủ tiền thì nút giá mờ, như mua đồ. Đủ 6 con thì mọi nút giá mờ, chạm vào hiện "Tiệm đã đủ 6 con…".
- "Cho đi" mở thẻ hỏi lại, có nút "Giữ lại" và "Cho đi". Cho đi thì không trả lại tiền.

### 4.5 Trong tiệm **(chồng yêu duyệt)**

- **Mèo:** đi 1,2 ô mỗi giây. Mỗi lần nghĩ: 40% ngủ (8–14 giây), 25% ngồi (3–5 giây), 35% đi dạo tới một ô sàn ngẫu nhiên.
- **Chó:** đi 1,8 ô mỗi giây. Mỗi lần nghĩ: 35% chạy tới cạnh chủ tiệm, 15% ra gần cửa, 20% ngồi, 15% ngủ (6–11 giây), 15% đi dạo. Tới cạnh chủ hay tới cửa thì ngồi vẫy đuôi. Đang ngồi cạnh chủ mà chủ đi xa thì chạy theo.
- **Đi khắp các tầng đã mở,** qua cầu thang giống người. Chỉ vẽ khi đang ở tầng đang xem. Chỉ ở tiệm chính.
- **Không chiếm ô:** đường của người không biết có thú cưng. Thú cưng đứng trên ô đi được. Kê đồ đè lên chỗ thú cưng đứng thì con đó nhảy sang ô đi được gần nhất **(em đề xuất)**.
- **Chạm:** con vật nhảy lên, có trái tim và tên bay lên, kêu "meo" hay "gâu gâu". Chủ tiệm không đi. Chạm khi đang có thẻ hay đang chơi mini-game thì không có gì xảy ra.
- **Từ 20:00 và lúc tổng kết ngày:** cả đám nằm ngủ tại chỗ. Sáng ra thì dậy.
- **Mở game:** mỗi con đứng ở một ô sàn ngẫu nhiên ở tầng 1 **(em đề xuất)**.
- **Lúc chủ tiệm ở chi nhánh:** thú cưng không hiện, vì chúng ở tiệm chính.

### 4.6 Tiếng kêu **(em đề xuất)**

- Thêm hai tiếng làm bằng code: `meow` (một tiếng "meo" lên rồi xuống, khoảng 0,5 giây) và `woof` (hai tiếng sủa ngắn).
- Tắt được bằng nút Tiếng động, như mọi tiếng khác.

## 5. Lưu game

- `SAVE_VERSION = 32`. Mỗi tiệm có thêm `pets: PetBook`:
  - `owned: { id, breed, name }[]`, theo thứ tự nhận nuôi, tối đa 6 con.
  - `nextId`
  - `litter: boolean`: đã nhận ổ của Chú Sáu.
- Sửa khi đọc: giống lạ thì bỏ con đó; tên được làm sạch, tên rỗng lấy tên gợi ý đầu; id trùng thì bỏ con sau; quá 6 con thì giữ 6 con đầu; `nextId` lớn hơn mọi id.
- Bản lưu trước v32 có `pets` rỗng, `litter: false`, nên sẽ gặp Chú Sáu.
- Chi nhánh luôn có `pets` rỗng và `litter: true`.
- Đóng băng `tests/fixtures/save-v31.json`, ghi bằng code master 4b34ca2 trước khi đổi.

## 6. Cách làm đã cân nhắc

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **A. Thú cưng chỉ để ngắm, não ở phần vẽ** | Không đụng tới sim, khách, lương, cân bằng. Không có số ngẫu nhiên nào của sim bị đổi, nên các test sẵn có giữ nguyên. | Thú cưng không có ích. | **Chồng yêu chọn** |
| B. Có ích nhẹ (khách đỡ sốt ruột) | Có lý do để nuôi. | Phải đưa vào sim, chỉnh lại cân bằng, nhiều test đổi. | Để sau |

Cách làm A cụ thể **(em đề xuất)**:
- Sim chỉ giữ danh sách nuôi (`PetBook`) và các việc mua, đổi tên, cho đi, nhận ổ.
- "Não" thú cưng nằm ở `src/view/petBrain.ts`, viết thuần TypeScript không dính Phaser, để test được. Nó dùng `findPath` và `grid` của sim, và có nguồn ngẫu nhiên riêng, không lấy từ `sim.rng`.

## 7. Hai lô **(chồng yêu duyệt)**

- **Lô A:**
  - `PetBook`, bản lưu v32 và fixture v31.
  - Não thú cưng, `PetLayer` vẽ và chạm.
  - Tiếng `meow`/`woof`.
  - Thẻ Chú Sáu, thẻ đặt tên.
  - Hình đủ 8 giống, nhưng chỉ nhận được mèo mướp và chó ta.
- **Lô B:** tab Thú cưng, mua 8 giống, Đổi tên, Cho đi. Không đổi bản lưu.

## 8. Kiểm tra

- **Test sim:**
  - nhận ổ (chỉ hai giống miễn phí, chỉ một lần, đủ 6 con thì không được);
  - mua (thiếu tiền, đủ 6 con, trừ đúng tiền);
  - đổi tên và làm sạch tên;
  - cho đi;
  - chi nhánh không có thú cưng.
- **Test bản lưu:**
  - v31 mở lên với `pets` rỗng và `litter: false`;
  - lưu rồi mở lại giữ nguyên danh sách;
  - sửa dữ liệu hỏng;
  - mọi fixture cũ vẫn qua.
- **Test não thú cưng:**
  - chỉ đi trên ô đi được;
  - mèo ngủ nhiều, chó theo chủ;
  - ban đêm ngủ;
  - qua cầu thang;
  - ô bị đè thì nhảy sang ô gần nhất.
- **Xem trên trình duyệt ở 390 px:**
  - thẻ Chú Sáu tới đúng ngày 2;
  - đặt tên và nhận nuôi;
  - chạm thì kêu và có tim;
  - thú cưng không chặn ai;
  - tầng khác không thấy;
  - 20:00 ngủ.
  - Lô B: tab, mua, đổi tên, cho đi, đủ 6 con.

## 9. Để người làm tự quyết

- Cỡ hình trong game: khoảng 1,55 lần đơn vị bản phác, để mèo cao chừng nửa người.
- Thời gian nhảy, tim bay, chữ "z" khi ngủ.
- Thứ tự thẻ khi cùng lúc có thẻ Chú Sáu và thẻ khác: thẻ Chú Sáu đi sau thẻ áo mới.
