# Xoay đồ và mở khoá bình phong, quầy lễ tân

- Ngày: 2026-10-29
- Trạng thái: chờ chồng yêu duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.10 (kê đồ theo ô lưới, "xoay được"). Làm nốt phần đã hoãn ở `2026-10-26-step-1b-batches-2-7-design.md` mục 3: xoay 90 độ, và dời bình phong, quầy lễ tân.
- Lý do: chồng yêu báo "nội thất trong game không xoay được, nội thất mặc định không cho di chuyển hoặc bán".

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu.

## 1. Chồng yêu muốn gì

- **Xoay được mọi món, kể cả giường.** Giường xoay đủ 4 hướng. **(chồng yêu chọn)**
- **Bình phong và quầy lễ tân thành đồ thường:** dời, xoay, bán được như các món khác. **(chồng yêu chọn)** Mấy món có sẵn khác (giường, ghế chờ, kệ, tủ, chậu sen…) vốn đã dời và bán được.
- **Cách làm: vẽ thêm hình hướng mới cho từng món, chia 2 lô.** Lô A làm đồ dài, bình phong và quầy. Lô B làm giường. **(chồng yêu chọn)**

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Người chơi kê lại tiệm tự do hơn: kệ, tủ, ghế, bình phong dựng dọc theo tường bên; giường nằm ngang.
- Bình phong và quầy lễ tân dời được, bình phong bán được, quầy bán được khi tiệm còn quầy khác.
- Mọi hình xoay vẽ cùng nét với đồ đang có. Không món nào trông như bị đổ nằm ra sàn.

### Chưa làm ở đợt này
- Dời tường, cửa, cầu thang.
- Hình nhìn từ phía sau (món quay lưng vào người chơi). Mỗi món chỉ có mặt trước và mặt bên, lật trái phải.
- Đổi mini-game. Các màn chơi gội, đắp mặt nạ, massage… vẫn như cũ, xoay giường chỉ đổi cảnh trong tiệm.
- Kéo màn hình, phóng to thu nhỏ.

### Điều cấm (dính là coi như hỏng)
- Tiệm đang chơi ở bản cũ mở lên bị mất đồ, đồ đổi chỗ, đổi điểm đẹp, hoặc chủ tiệm đứng chỗ khác lúc đầu ngày.
- Kê đồ xong mà khách, chủ tiệm hay nhân viên không đi tới được chỗ cần tới (giữ luật đang có ở `placeProblem`).
- Hình xoay dùng lại hình cũ quay 90 độ cho món có mặt trước, mặt bên (trông như đổ ra sàn).
- Một tiệm không còn quầy lễ tân nào.

## 3. Hiện giờ (cho người làm)

- `Item` có `x, y` (ô trên cùng bên trái), `flip` (lật trái phải) và `gift`. `footprint` lấy `w × h` từ `ITEMS`. Xem `src/sim/items.ts`.
- Thanh khi cầm một món (`BuildScene.showHoldRow`): mua mới có **Thôi · Lật · Đặt**, món của tiệm có **Thôi · Lật · Bán · Đặt**. Màn rộng 1080.
- Bình phong (`H`) và quầy (`R`) nằm trong `shell`, không phải `Item`. `RoomView` vẽ chúng riêng (`fixtures`), chỉ ở tầng 1. Bình phong là 2 tấm dài 5 ô ở hàng 6 (`x = 1..5` và `7..11`), quầy dài 3 ô ở `(8..10, 14)`.
- Hình phòng chia sàn gỗ và sàn gạch bông theo hàng bình phong, và trải thảm từ cửa tới chỗ hở bình phong (`roomBody` trong `src/art/room.ts`, cùng 3 phòng chi nhánh `beach.ts`, `oldTown.ts`, `uptown.ts`).
- `OWNER_START = (9, 13)` là hằng số: chỗ chủ tiệm đứng đầu ngày, ô không món nào được đè (`placeProblem`), gốc tìm chỗ lễ tân đứng (`receptionSpot`), chỗ khách VIP đứng chờ (`standSpot`), nhà của nhân viên (`homeOf`), tầng trệt (`groundFloor`). Dùng ở `spa.ts`, `crew.ts`, `stairs.ts`, `build.ts`.
- Giường: `workTile` ở bên hông hàng thứ hai (phải, hoặc trái nếu lật). `bedTile` là ô khách nằm. Giường gội phải có đầu sát tường sau, vì chậu gội treo tường (`bedWall`). Đèn lồng của giường gội treo trên tường sau tầng 1. `onBed` cho khách bước lên giường theo chiều ngang.
- Cảnh khách trên giường ở `SpaScene` (khoảng dòng 1460–1510): nằm (`lie`), ngồi ở ghế ngâm chân và bàn làm móng (`SEATED`), lệch nửa ô ở bồn bùn, ẩn trong lều xông, đá nóng trên lưng.
- Lưu game: `SAVE_VERSION = 29`. Một file lưu là cả chuỗi tiệm: tiệm chính và các chi nhánh, mỗi tiệm có `items` riêng.
- Có 9 loại giường: `bed, maskBed, massageBed, steamTent, stoneBed, mudTub, scrubBed, footChair, nailDesk`.
- Có 15 món dài (rộng khác dài): `bench, tea, planter, slippers, shelf, cabinet, lotus, teaChest, bambooBench, bambooTea, bambooShelf, silkScreen, regularsBoard, goldBoard, starWall`.

## 4. Thiết kế

### 4.1 Hướng của một món (em đề xuất)

- `Item` có thêm `turned?: boolean`. Giống `gift`, chỉ lưu khi là `true`.
- Một món có tối đa 4 hướng, ghép từ `turned` và `flip`:

| `turned` | `flip` | Đồ dài, bình phong, quầy | Giường (lô B) |
|---|---|---|---|
| không | không | nằm ngang, mặt trước nhìn xuống (như bây giờ) | dọc, đầu ở trên, ô làm việc bên phải (như bây giờ) |
| có | không | dựng dọc, mặt bên, mặt trước quay sang phải | ngang, đầu bên trái, ô làm việc phía sau |
| không | có | như dòng 1, lật gương | dọc, ô làm việc bên trái (như bây giờ) |
| có | có | như dòng 2, lật gương, mặt trước quay sang trái | ngang, đầu bên phải, ô làm việc phía sau |

- Khi `turned`, chỗ chiếm đổi thành `h × w` (đổi chiều dài, chiều rộng).
- Món vuông 1 ô chỉ có 2 hướng: thường và lật.

### 4.2 Nút Xoay (em đề xuất)

- Nút **Lật** đổi thành **Xoay**. Thanh vẫn 4 nút nên không phải thu nhỏ nút Bán.
- Mỗi lần bấm **Xoay**, món đi tới hướng kế: dòng 1 → 2 → 3 → 4 → 1 ở bảng trên. Món vuông 1 ô thì Xoay chỉ lật qua lại.
- Món xoay quanh ô giữa của nó và vẫn nằm trong tầng đang xem. Chỗ mới không đặt được thì ô hiện đỏ như bây giờ.
- Trong lô A, giường bấm Xoay chỉ lật qua lại như bây giờ. Lô B mới mở đủ 4 hướng cho giường.
- Hình bóng mờ đang cầm và hình món đặt xuống dùng hình theo hướng. Hình trên thẻ danh mục giữ mặt trước.
- Mang món sang tầng khác thì giữ nguyên hướng.

### 4.3 Bình phong (em đề xuất)

- Món mới `screen` tên **Bình phong**, 5 × 1 ô, giá 200.000 đ, điểm đẹp 0, ở tab Trang trí. Có trong danh mục ngay từ ngày đầu, để mua lại. Mua bình phong hay quầy cũng tính là mua đồ trang trí trong chuỗi mục tiêu ngày đầu, như món khác.
- Có hình dựng dọc (1 × 5, mặt bên).
- Sàn gỗ, sàn gạch bông và tấm thảm ở cửa **luôn nằm yên** theo hàng bình phong gốc (hàng 6), dù bình phong đã dời hay bán. Phòng chi nhánh cũng vậy.
- Bình phong đặt được ở mọi tầng, như đồ trang trí khác.

### 4.4 Quầy lễ tân (em đề xuất)

- Món mới `desk` tên **Quầy lễ tân**, 3 × 1 ô, giá 400.000 đ, điểm đẹp 0, ở tab Trang trí. Có hình dựng dọc.
- **Chỉ đặt ở tầng 1**, như ghế chờ. Báo: "Quầy lễ tân chỉ đặt ở tầng 1."
- **Tiệm luôn giữ ít nhất 1 quầy**, như luật giữ 1 giường gội và 1 ghế chờ. Báo: "Tiệm cần giữ một quầy lễ tân." Muốn bán quầy cũ thì mua quầy mới trước.
- **Ô chủ tiệm đứng đi theo quầy:** ô ngay phía sau ô giữa của quầy. Quầy nằm ngang thì là ô phía trên ô giữa. Quầy dựng dọc thì là ô cạnh ô giữa, phía ngược với mặt trước.
  - **Mỗi quầy** giữ ô này cho riêng nó, như giường giữ ô làm việc. Không món nào được đè, và ô phải đi tới được từ cửa. Nhờ vậy bán quầy cũ nhất thì quầy kế tiếp đã có sẵn ô trống, đi tới được.
  - Tiệm có nhiều quầy thì dùng quầy cũ nhất (số `id` nhỏ nhất).
  - Chủ tiệm và lễ tân đứng ở quầy dựng dọc thì quay mặt sang ngang, về phía quầy.
  - Ô này thay `OWNER_START` ở mọi chỗ đang dùng: chỗ đứng đầu ngày, chỗ lễ tân, chỗ khách VIP đứng chờ, nhà của nhân viên, ô đứng lúc tạo tiệm.
  - Quầy ở chỗ gốc thì ô này đúng bằng `(9, 13)` như cũ.
- Khách VIP hết ghế đứng chờ cạnh **bất kỳ** quầy nào, như bây giờ (`grid.desks`).
- Lúc cúp điện, cây nến trên quầy đi theo quầy cũ nhất, ở mọi tầng như bây giờ. Các cây nến khác giữ chỗ cũ.

### 4.5 Đồ dài xoay dọc (lô A, em đề xuất)

- 15 món dài, cùng bình phong và quầy, mỗi món có thêm một hình dựng dọc vẽ bằng code như các món khác. Hình thấy mặt trên và mặt bên, mặt trước quay sang phải. Lật thì quay sang trái.
- Ghế chờ dựng dọc: khách ngồi quay mặt về phía mặt trước của ghế (trái hoặc phải), không nhìn xuống.
- Tấm chiếu dưới ghế mây (`benchMat`) chỉ có khi ghế nằm ngang.
- Bảng, tranh đứng (`silkScreen, regularsBoard, goldBoard, starWall`) dựng dọc thì thấy cạnh bảng và một phần mặt bảng nghiêng.
- **Thứ tự vẽ trên dưới:** hiện giờ một món vẽ theo hàng đáy của nó. Món dựng dọc dài 3 ô mà vẽ theo hàng đáy thì che mất người đứng hay ngồi ở 2 hàng trên (ví dụ khách ngồi 2 chỗ trên của ghế dọc). Món dựng dọc phải vẽ sao cho người ở từng hàng của nó hiện đúng trước hay sau. Cách làm để người làm chọn. **(em đề xuất)**

### 4.6 Giường xoay ngang (lô B, em đề xuất)

- **Chỗ chiếm:** `h × w`. Ô khách nằm là ô ở hàng trên, cột thứ hai tính từ đầu giường, giống giường dọc có ô khách nằm ở hàng thứ hai tính từ đầu.
- **Ô làm việc:** ngay phía sau (phía trên) ô khách nằm. Chủ tiệm và thợ đứng sau giường, quay mặt xuống, nên không che khách. Vì vậy giường ngang không đặt sát tường sau được.
- **Giường gội ngang:** có chậu gội đứng có chân ở đầu giường, nên không cần sát tường. Giường gội dọc vẫn phải sát tường sau như bây giờ.
- **Đèn lồng:** chỉ giường gội dọc ở tầng 1 có, như bây giờ. Giường ngang không có.
- **Khách nằm ngang:** dùng lại hình khách nằm hiện có, quay 90 độ cho đầu về phía đầu giường. Nhìn từ trên xuống, người nằm quay ngang vẫn đúng. Mặt nạ, khăn quấn, chăn quay theo.
- **Các chi tiết riêng đặt lại theo hướng:** khách lệch nửa ô ở bồn bùn, hơi nóng của lều xông, đá nóng trên lưng, khách ngồi ghế ngâm chân (quay mặt về phía chậu), khách ngồi ghế đẩu ở bàn làm móng.
- **Khách lên xuống giường:** bước từ ô làm việc xuống ô khách nằm theo chiều dọc. `onBed` và cách vẽ trên dưới phải theo hướng giường.
- **Hình mới:** 8 loại giường cần hình ngang. Lều xông tròn nên dùng lại hình cũ, chỉ đổi ô làm việc.

### 4.7 Tiệm cũ (em đề xuất)

- Lưu game lên bản 30.
- Mở một tiệm lưu ở bản cũ, với tiệm chính và từng chi nhánh: thêm 2 tấm bình phong và 1 quầy vào `items`, đúng chỗ cũ, không xoay, không lật.
- Món mới lấy `id` nối tiếp sau các món đang có, nên `id` của giường, ghế… không đổi. Tiệm mới cũng xếp bình phong và quầy sau cùng, để tiệm mới và tiệm cũ có cùng thứ tự `id`.
- Điểm đẹp không đổi vì 2 món mới có điểm đẹp 0. Ô chủ tiệm đứng vẫn là `(9, 13)`.
- **Thứ tự nâng cấp:** thêm bình phong và quầy **trước** bước dọn chỗ cầu thang của tiệm rất cũ (trước bản 14). Bước đó dời giường hay ghế cuối cùng sang chỗ trống, mà lúc này chỗ của quầy không còn bị phòng chặn sẵn, nên phải có quầy nằm đó trước.
- Tiệm cũ hơn bản 3 dựng lại đồ từ tiệm mặc định (`DEFAULT_ITEMS`). Tiệm mặc định giờ đã có bình phong và quầy, nên bước nâng cấp không được thêm lần nữa.
- **Lô B lên bản lưu 31.** Bản lô A không hiểu giường xoay ngang, nên một tiệm có giường ngang phải bị bản cũ từ chối, như bản 29 đã làm với Sơn móng.
- Cần thêm file lưu mẫu bản 29 có chi nhánh (`tests/fixtures/save-v29.json`) để test đọc tiệm cũ.

## 5. Các cách đã cân nhắc

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **Vẽ thêm hình hướng mới cho từng món, chia 2 lô** | Đúng nét vẽ đang có. Có đồ dài xoay sớm, không chờ phần giường | Tốn công vẽ nhất, khoảng 25 hình mới | **Chồng yêu chọn** |
| Quay luôn hình có sẵn 90 độ | Nhanh, một lô | Game nhìn chéo nên đồ quay ngang trông như đổ ra sàn | Loại |
| Để dành xoay cho bản 3D (kiểu nhìn A đã chọn ngày 26/10) | 3D xoay gần như miễn phí | Bản 3D chưa bắt đầu, chờ lâu. Nếu sau này chuyển 3D thì 25 hình ở cách 1 bỏ đi | Loại |
| Giữ nút Lật, thêm nút Xoay riêng | Ít đổi thói quen | Thanh thành 5 nút, phải thu nhỏ nút Bán đang ghi tiền | Loại, gộp vào một nút Xoay (mục 4.2) |
| Quầy bán được cả khi là quầy cuối, chủ tiệm đứng chỗ cũ | Đúng chữ "bán được" | Tiệm không quầy thì lễ tân, khách VIP, đầu ngày đều mất chỗ | Loại, giữ ít nhất 1 quầy (mục 4.4) |
| Giường gội ngang phải có đầu sát tường bên, chậu treo tường bên | Giữ ý "chậu treo tường" | Chỉ đặt được ở cột sát tường, ít tự do | Loại, dùng chậu đứng có chân (mục 4.6) |

## 6. Tham khảo game mã nguồn mở

- **Stardew Valley** ([wiki modding](https://wiki.stardewvalley.net/Modding:Furniture)): mỗi món tự khai báo xoay được 1, 2 hay 4 hướng. Mỗi hướng có hình riêng trên tấm hình. Em lấy ý "mỗi món một số hướng, mỗi hướng một hình".
- **Arcturus**, server Habbo mã nguồn mở ([bàn luận về ô bị chiếm](https://bitbucket.org/Wesley12312/arcturus/issues/30/floorplan-checked-tiles)): ô một món chiếm tính từ dài, rộng và hướng. Hướng ngang thì đổi dài với rộng. Em lấy ý đổi `w × h` khi `turned`.
- Chỉ lấy ý, không chép code.

## 7. Chia lô (chồng yêu chọn chia 2 lô, nội dung từng lô em đề xuất)

- **Lô A:** `turned` và lưu bản 30. Nút Xoay. Bình phong và quầy thành món đồ, có trong danh mục. Ô chủ tiệm đi theo quầy. Sàn và thảm cố định. 17 hình dựng dọc (15 món dài, bình phong, quầy). Ghế dựng dọc. Giường chỉ lật.
- **Lô B:** 9 loại giường xoay ngang: chỗ chiếm, ô khách nằm, ô làm việc, 8 hình mới, chậu gội đứng, khách nằm và ngồi theo hướng, thợ quay mặt, đèn lồng, `onBed`, lưu bản 31.
- Xong lô nào thì đưa lên master lô đó, như các đợt trước.

## 8. Tiêu chí xong

### Lô A
- Mở tiệm lưu ở bản 29 (tiệm chính và chi nhánh): bình phong, quầy ở đúng chỗ cũ, điểm đẹp không đổi, chủ tiệm đầu ngày đứng ở `(9, 13)`.
- Cầm bình phong: dời, Xoay đủ 4 hướng, bán được nửa giá (100.000 đ), mua lại từ danh mục.
- Cầm quầy: dời và Xoay trong tầng 1. Không đặt được ở tầng 2. Không bán được khi là quầy duy nhất, bán được khi đã mua quầy thứ hai.
- Dời quầy: hôm sau chủ tiệm đứng sau quầy mới. Lễ tân đứng cạnh quầy mới. Khách VIP hết ghế đứng chờ cạnh quầy.
- Mỗi món dài Xoay được 4 hướng, chỗ chiếm đổi đúng, ô đỏ khi chặn đường hay đè món khác.
- Khách ngồi ghế dựng dọc quay mặt đúng phía.
- Không món nào che mất ô chủ tiệm đứng, ô cửa vào, chân cầu thang.
- Test tự động cho: chỗ chiếm khi xoay, luật quầy, ô chủ tiệm theo quầy, đọc tiệm bản 29.

### Lô B
- Mỗi loại giường Xoay đủ 4 hướng. Ở từng hướng, khách tới, lên giường, được làm, trả tiền, đi về bình thường. Chủ tiệm và thợ đều làm được.
- Giường gội ngang đặt được giữa phòng. Giường gội dọc vẫn phải sát tường sau.
- Khách nằm ngang đúng đầu, mặt nạ, khăn, đá nóng, hơi lều xông đúng chỗ.
- Mini-game của từng dịch vụ không đổi.
- Test tự động cho: ô khách nằm, ô làm việc theo hướng, khách đi tới được giường ngang.

## 9. Để người làm tự quyết

- Nét vẽ cụ thể của từng hình dựng dọc và giường ngang, miễn cùng phong cách và cùng cách neo đáy giữa như `FURNITURE`.
- Tên texture cho hướng xoay (ví dụ thêm hậu tố `-turned`).
- Cách tính chính xác "xoay quanh ô giữa" với món dài số ô chẵn, và cách đẩy món vào trong tầng.
- Đổi `OWNER_START` thành hàm hay giá trị tính lại mỗi khi kê đồ.
- Cách `onBed` và thứ tự vẽ trên dưới làm việc với giường ngang.
- Cách thử trên trình duyệt.
