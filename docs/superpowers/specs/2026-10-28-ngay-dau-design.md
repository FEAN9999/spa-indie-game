# Ngày đầu vui hơn: chuỗi mục tiêu khởi nghiệp

- Ngày: 2026-10-28
- Trạng thái: chồng yêu đã duyệt (2026-10-28)
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.14 (dẫn dắt người mới). Làm chen trước Đợt 4 **(em đề xuất)**.
- Lý do: người chơi thử báo "1, 2 ngày đầu hơi chán, dễ bỏ game".
- Bản phác 5 màn: https://claude.ai/artifact/1F71FFLDVfR9KodNV7qUP1

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Vì sao ngày đầu chán

Em đọc từ code, chưa đo bằng chơi thật:

- **Chỉ có một việc:** ngày 1–2 chỉ có gội đầu. Đắp mặt nạ mở từ ngày 4 và tốn 550k (200k mở, 350k giường). Người chơi gội đầu khoảng 20 lần trở lên mới gặp mini-game thứ hai.
- **Bốn nút dưới cùng đều khóa, ghi "Mở vào ngày N"** (ngày 2, 3, 4, 8). Nút khóa theo lịch bảo người chơi "chờ", chơi giỏi cũng không mở sớm hơn.
- **Không có mục tiêu ngắn.** Nhiệm vụ mở ngày 8.
- **Không ai có tên.** Khách quen tới từ ngày 7, khách nổi tiếng ngày 6, lễ ngày 8, sự kiện ngày 10.
- **Bảng tổng kết không hé lộ gì về ngày mai.** Ngày 1 chỉ có dòng "Bấm Ngày mới để mở cửa tiếp".

Em có xem lại một điều đã nói trước đó. Ngày 1 không hề rảnh tay: khách tới thưa hơn 1,3 lần, khoảng 7–8 khách, mà chủ tiệm tự làm chỉ kịp chừng 6 khách. Nên **giữ nguyên** độ thưa ngày 1, không đổi như em đề xuất lúc đầu.

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Trong 5 phút đầu, người chơi luôn thấy **một mục tiêu kế tiếp** trên màn hình. Mỗi mục xong trong 1–2 phút chơi.
- **Mini-game thứ hai tới trong ngày 2**, thay vì ngày 4.
- **Mỗi ngày trong 3 ngày đầu có một điều mới:** ngày 1 có Chú Sáu và nút Xây dựng, ngày 2 có Đắp mặt nạ và sổ khách, ngày 3 có thuê thợ.
- **Bảng tổng kết cho một lý do để bấm "Ngày mới":** mục tiêu kế tiếp, điều gì sẽ tới ngày mai, và kỷ lục nếu có.
- **Có phần thưởng bất ngờ:** thỉnh thoảng có khách tip gấp 5 lần.

### Chưa làm ở đợt này
- Thêm mini-game, dịch vụ hay kiểu khách mới.
- Đổi cách chơi gội đầu.
- Đoạn mở đầu kể chuyện, hoặc màn "giấc mơ" cho xem tiệm 3 tầng.
- Hướng dẫn bằng giọng nói hay video.
- Đổi nhịp các ngày sau ngày 8: nhiệm vụ hằng ngày, lễ, sự kiện, xếp hạng giữ như cũ.

### Điều cấm (dính là coi như hỏng)
- **Khóa lại nút đã mở**, kể cả với tiệm cũ.
- **Mục tiêu không làm được,** hoặc làm người chơi kẹt. Mọi nút vẫn mở chậm nhất vào ngày cũ của nó (mục 4.3).
- **Trả thưởng hai lần,** ví dụ khi mở lại game giữa chừng.
- **Dồn nhiều bảng vàng cùng lúc,** nhất là khi tiệm cũ mở game lần đầu sau bản này.
- **Chiêu ép quay lại:** năng lượng, mất chuỗi ngày điểm danh, phần thưởng hết hạn. Spec gốc đã cấm.
- **Phần thưởng bất ngờ làm đổi các lần bốc của tiệm** (khách, thợ ứng tuyển, VIP, sự kiện). Cùng hạt giống thì tiệm phải chạy y như trước, giống luật của nhiệm vụ.
- **Che mất khách hay giường** bằng dải mục tiêu.

## 3. Hiện giờ (cho người làm)

- **Mở theo ngày:** `UNLOCK_DAY` trong `src/config.ts` (build 2, staff 3, services 4, stock 5, floors 6, quests 8). Có hai kiểu kiểm, phải tìm cả `UNLOCK_DAY` lẫn `isUnlocked`:
  - Qua `isUnlocked(feature, day)` ở `src/sim/unlocks.ts`: `Hud` (ổ khóa, nhãn "Mới", toast `unlocksOn`), `SpaScene` (nút Xây dựng, tab kho), `SpaSim.questsOpen`.
  - So thẳng với `UNLOCK_DAY`: `SpaSim` (lời nhắc tiền vắng chủ, `floorProblem`, `stockTracked`), `crew.ts` (bảng ứng viên), `tutorial.ts` (bàn tay chỉ vào nút, chỉ hiện đúng ngày mở), `view/floors.ts` (thanh tầng).
- **`questsOpen()` mở nhiều thứ hơn nhiệm vụ hằng ngày:** nhiệm vụ của tháng, huy hiệu và bảng vàng huy hiệu, áo mới và nút tủ áo, chấm đỏ của nút Nhiệm vụ, các tab Huy hiệu và Xếp hạng trong bảng Nhiệm vụ.
- **Ngày đầu nới tay:** `DAY_EASE` (kiên nhẫn, thêm giờ mini-game, khách thưa ngày 1).
- **Bộ đếm sẵn có:** `progress.total` (`Counts`) chỉ tăng, không reset: served, earned, owner3, services theo dịch vụ... `SpaSim.count()` cộng vào rồi chốt nhiệm vụ.
  - Mục 1, 2, 3, 5, 7, 8, 11 đọc được từ đây.
  - Mục 4, 6, 9, 10 cần thêm trạng thái lưu: chưa có bộ đếm cho đồ đã mua, giường đã đặt, người đã thuê, dịch vụ đã mở. `staff` trong `Counts` là số khách do thợ làm, không phải số người đã thuê.
  - Tiệm mới đã có sẵn đồ trang trí (chậu cây, bàn trà...), nên mục 4 phải đếm lần mua, không đếm đồ đang có.
- **Kỷ lục sẵn có:** `progress.life.bestServed`, `bestProfit`, cập nhật cuối ngày ở `recordDay`.
- **Dải "Hôm nay":** `view/today.ts`, một dòng có hình tròn và chữ, ở y 1690 ngay trên thanh dưới. Hiện sự kiện, lễ, ngày hot. Trước ngày 8 dải này luôn trống. Toast cũng hiện ở đúng chỗ này.
- **Ghi chú bảng tổng kết:** `summaryNotes` ở `view/vip.ts` trả về danh sách dòng. Dòng "ngày mai" màu xanh ngọc (`booking: true`).
- **Khách quen:** `REGULARS` ở `sim/regulars.ts`. `sau` là Chú Sáu chạy xe ôm, thích gội đầu, quà 5 tim là thêm một khách mỗi ngày.
  - `planDay` không làm gì trước ngày 7 (`REGULARS_FROM_DAY`).
  - **Bẫy:** `planDay` chỉ xếp lịch gặp cho 6 khách quen khi *mọi* `meetDay` còn trống. Cho Chú Sáu gặp từ ngày 1 thì ngày 7 sẽ không xếp ai nữa.
- **Quà đồ đạc:** `book.gifts` cộng `placeGift`. Quà nằm chờ trong Xây dựng tới khi người chơi đặt.
- **Khách chọn dịch vụ:** `spawnCustomer({ service })` ép được dịch vụ.
- **Dòng ngẫu nhiên riêng:** nhiệm vụ dùng `questRng` để không đổi các lần bốc của tiệm.
- **Save v21.** Nhánh `dot-4-chuoi` của Đợt 4 đang làm ở worktree khác và định dùng v22–v24. Bên nào merge sau thì lấy số kế tiếp.

## 4. Thiết kế

### 4.1 Chuỗi mục tiêu khởi nghiệp (em đề xuất)

Một danh sách cố định, làm lần lượt từng mục. Mỗi mục có tên ngắn, điều kiện, tiền thưởng, và có thể mở một nút. Mục đếm từ lúc tiệm mới mở, nên chỉ số "đã phục vụ" là tổng từ đầu.

| # | Mục tiêu | Thưởng | Mở thêm | Thường xong lúc |
|---|---|---|---|---|
| 1 | Gội đầu cho vị khách đầu tiên | 20k | | ngày 1, phút đầu |
| 2 | Được 3 sao một lần | 30k | | ngày 1 |
| 3 | Phục vụ 4 khách | 30k | Nút **Xây dựng** | cuối ngày 1 |
| 4 | Mua một món trang trí | 40k | | ngày 1 hoặc đầu ngày 2 |
| 5 | Phục vụ 10 khách | Tặng **Đắp mặt nạ** và một giường mặt nạ | Nút **Dịch vụ** | giữa ngày 2 |
| 6 | Đặt giường mặt nạ vào tiệm | 30k | | ngay sau mục 5 |
| 7 | Đắp mặt nạ cho 2 khách | 50k | | cuối ngày 2 |
| 8 | Phục vụ 16 khách | 50k | Nút **Nhân viên** | đầu ngày 3 |
| 9 | Thuê một thợ | 50k | | ngày 3 |
| 10 | Mở dịch vụ Massage | 100k | | ngày 3–4 |
| 11 | Massage cho 2 khách | 100k | Nhiệm vụ hằng ngày từ sáng hôm sau | ngày 4 |

- **Mục 1:** khách đầu tiên của tiệm mới luôn là Chú Sáu (mục 4.4). Tên mục không gọi tên chú, vì gội cho bất kỳ khách nào cũng xong mục, và chú có thể bỏ về nếu chờ lâu (sửa khi kiểm tra trên trình duyệt).
- **Mục 4:** đếm lần mua trong Xây dựng một món thuộc nhóm `decor` hoặc `seat`, không đếm đồ có sẵn. Món rẻ nhất là chậu cây 40k, nên thưởng 40k là mua xong không mất tiền.
- **Mục 5:** tặng nghĩa là mở dịch vụ không mất 200k, và giường mặt nạ vào hàng quà chờ đặt (`book.gifts`). Đây là món quà lớn (550k) để người chơi thấy "tiệm lớn lên rồi".
  - Nếu người chơi đã tự trả tiền mở mặt nạ trước đó (nút Dịch vụ tới hạn ngày 4 trước khi xong mục 5), thì mục 5 tặng giường cộng 200k tiền mặt.
- **Mục 6:** bàn tay chỉ vào nút Xây dựng, rồi chỉ vào món quà. Có sẵn chỗ giường trống viền đứt trong phòng gội.
- **Mục 7:** khách mới đầu tiên tới sau khi mặt nạ có giường luôn chọn Đắp mặt nạ, để người chơi được chơi ngay. Khách sau chọn bình thường.
- **Mục 8:** mở Nhân viên khi tiệm đã đông. Bảng ứng viên có ngay khi nút mở, không chờ sáng hôm sau.
- **Mục 10:** người chơi tự trả tiền mở Massage (400k cộng giường 450k). Đây là mục duy nhất có thể chậm, vì phải dành tiền.
- **Mục 11:** xong thì báo "Từ mai có nhiệm vụ mỗi ngày", và nhiệm vụ hằng ngày bắt đầu từ sáng hôm sau.
- **Mục đã đạt sẵn khi tới lượt thì tự xong ngay,** ví dụ người chơi đặt giường mặt nạ trước khi tới mục 6. Các bảng vàng xếp hàng, mỗi bảng cách nhau như toast hiện nay, không hiện chồng lên nhau.
- Khi mục tiêu xong mà người chơi đang ở trong mini-game, thông báo chờ tới khi mini-game xong.

### 4.2 Hiện mục tiêu ở đâu (em đề xuất)

- **Dải mục tiêu:** dùng chỗ của dải "Hôm nay" (y 1690, trên thanh dưới). Một hình tròn có lá cờ nhỏ, chữ dạng "Phục vụ 10 khách · 6/10". Trước ngày 8 chỗ này luôn trống, nên ít khi đụng nhau. Nếu cùng lúc có sự kiện hay lễ thì dải mục tiêu nhường chỗ.
- **Dải ẩn** khi có bảng phủ lên tiệm, khi hết ngày, khi chuỗi đã xong, và trong lúc có toast. Toast tắt thì dải hiện lại.
- **Xong một mục:** hiện bảng vàng giống bảng huy hiệu (`BADGE_BANNER_MS`): "Xong: Phục vụ 4 khách · +30k". Mục có mở nút thì thêm một dòng "Mở nút Xây dựng" và một câu ngắn kể chuyện, ví dụ "Tiệm đông rồi, thuê người phụ thôi!". Sau đó bàn tay chỉ vào nút vừa mở, dùng lại bàn tay `openBuild`, `openStaff`, `openServices` sẵn có.
- **Nút Nhiệm vụ mở từ ngày 1.** Trước khi có nhiệm vụ hằng ngày, bảng Nhiệm vụ hiện cả chuỗi khởi nghiệp như một danh sách:
  - mục đã xong có dấu tích;
  - mục đang làm có thanh tiến độ;
  - các mục sau hiện mờ, kèm tên nút sẽ mở.

  Người chơi thấy trước đường đi, giống bảng Community Center của Stardew Valley. Khi chuỗi xong, bảng trở lại như hiện nay.
- **Trong lúc chạy chuỗi, bảng Nhiệm vụ chỉ có danh sách chuỗi.** Mọi thứ khác sau `questsOpen()` vẫn tắt: không tab Huy hiệu, không tab Xếp hạng, không bảng vàng huy hiệu, không áo mới, không nhiệm vụ của tháng. Nhờ vậy bảng vàng của chuỗi không bị chồng với bảng vàng huy hiệu.
- **Bấm nút còn khóa:** toast "Mở khi xong: Phục vụ 10 khách" thay cho "Mở vào ngày 4".

### 4.3 Nút mở theo mục tiêu, ngày cũ làm hạn chót (em đề xuất)

- Nút **Xây dựng, Dịch vụ, Nhân viên** mở khi xong mục tiêu tương ứng, **hoặc** khi tới ngày cũ trong `UNLOCK_DAY`, cái nào tới trước. Nhờ vậy không ai bị kẹt.
- **Kho (ngày 5) và thanh tầng (ngày 6) giữ theo ngày.** Hai thứ này đã nằm ngoài khoảng ngày 1–2, và kho chỉ bắt đầu trừ hàng từ ngày 5.
- **Nhiệm vụ hằng ngày** bắt đầu từ sáng hôm sau ngày xong mục 11, hoặc từ ngày 8 như cũ, cái nào tới trước. Cùng lúc đó mở luôn mọi thứ khác sau `questsOpen()`: nhiệm vụ của tháng, huy hiệu, áo mới, tab Xếp hạng.
- Lễ (ngày 8), chấm xếp hạng (ngày 9) và sự kiện (ngày 10) giữ nguyên ngày.
- **Nút đã mở không bao giờ khóa lại.**

### 4.4 Chú Sáu mở hàng (em đề xuất)

- Khách đầu tiên của một tiệm mới là Chú Sáu, khách quen sẵn có (chạy xe ôm, thích gội đầu). Câu chào của chú: "Chú chạy xe ôm ngoài ngã tư. Bụi quá, gội giùm chú cái đầu!"
- Phục vụ chú như mọi khách quen: tim tăng, sổ khách hiện ra.
- **Ngày 2 chú chắc chắn quay lại**, vào một giờ ngẫu nhiên từ 9:00 tới 17:00. Đây là lần hẹn cài sẵn, vì luật khách quen hiện nay không chạy trước ngày 7. Giờ hẹn bốc bằng dòng ngẫu nhiên riêng.
- Bảng tổng kết ngày 1 có dòng "Ngày mai Chú Sáu ghé lại".
- **Từ ngày 7** năm khách quen còn lại được xếp lịch như cũ, theo thứ tự cũ bỏ Chú Sáu ra, cách nhau 2 ngày: Hạnh ngày 7, Vy ngày 9, Khoa ngày 11, Tư ngày 13, Bà ngày 15. Phải tránh cái bẫy ở mục 3.
- Từ ngày 3 tới ngày 6, chú không ghé, vì khách quen chỉ chạy từ ngày 7 như cũ. Từ ngày 7 chú ghé ngẫu nhiên như mọi khách quen đã gặp.

### 4.5 Khách hào phóng (em đề xuất)

- Khi **chủ tiệm tự tay** làm **3 sao**, có 1/8 cơ hội khách tip gấp 5 lần. Tiền rơi nhiều hơn thường, khách nói một câu như "Tay nghề quá trời, chị giữ hết đi!".
- Áp dụng từ ngày 1 và mãi về sau. Không áp dụng cho VIP và Mi Mi.
- Đây là phần thưởng không đoán trước. Nó cũng đẩy chủ tiệm tự tay làm ở giai đoạn sau, đúng mục tiêu "giai đoạn cuối không nhạt".
- Dùng dòng ngẫu nhiên riêng, như `questRng`.

### 4.6 Bảng tổng kết hé lộ ngày mai (em đề xuất)

Thêm tối đa hai dòng vào `summaryNotes`, đặt trước các dòng VIP và sự kiện:

- **Mục tiêu kế tiếp** nếu chuỗi chưa xong: "Mục tiêu: Phục vụ 10 khách (6/10)".
- **Điều gì tới ngày mai,** chọn cái đầu tiên đúng:
  1. Khách quen hẹn ghé ("Ngày mai Chú Sáu ghé lại").
  2. Nút mở theo hạn chót ngày ("Ngày mai mở Nhân viên").
  3. Nhiệm vụ hằng ngày bắt đầu.
- **Kỷ lục** từ ngày 2: "Kỷ lục mới: 9 khách!" hoặc "Kỷ lục lãi: 350k!", khi vượt `bestServed` hay `bestProfit` cũ.
- Dòng "Bấm Ngày mới để mở cửa tiếp. Game tự lưu." của ngày 1 vẫn giữ.

### 4.7 Tiệm cũ (em đề xuất)

- **Save cũ coi như đã xong chuỗi:** không có dải mục tiêu, không có bảng vàng, không có tiền thưởng.
- **Mọi thứ của save cũ vẫn mở theo ngày y như trước,** kể cả nút Nhiệm vụ (ngày 8). Việc "đã xong chuỗi" không làm nhiệm vụ hằng ngày bắt đầu sớm.
- Nhà mình ai đang ở ngày 1–2 trên save cũ thì mở tiệm mới ở ô lưu khác để chơi thử chuỗi.
- Khách hào phóng và dòng kỷ lục có luôn cho tiệm cũ.

## 5. Các cách đã cân nhắc

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **A. Chuỗi mục tiêu riêng, mở nút theo mục tiêu, ngày cũ làm hạn chót** | Người chơi nhanh mở nhanh. Thấy trước đường đi. Đọc từ bộ đếm sẵn có, không đụng nhiệm vụ hằng ngày. | Thêm một thứ cần lưu và một bảng mới trong Nhiệm vụ. | **Em chọn** |
| B. Cho nhiệm vụ hằng ngày chạy từ ngày 1, cài sẵn vài nhiệm vụ đầu | Dùng lại hệ thống có sẵn. | Nhiệm vụ hằng ngày reset mỗi sáng, đổi được và tính theo các ngày trước. Muốn nó mở nút và đi thành chuỗi thì phải bẻ cong nhiều chỗ. | Loại |
| C. Giữ mở theo ngày, chỉ thêm việc nhỏ cho vui | Ít rủi ro nhất. | Vẫn còn ổ khóa "Mở vào ngày N". Chơi giỏi không nhanh hơn. Mặt nạ vẫn tới ngày 4. | Loại |

Em chọn A vì nó sửa đúng hai gốc của sự chán: chỉ một việc để làm, và cảm giác phải chờ.

## 6. Tham khảo game mã nguồn mở

Em đọc thẳng mã nguồn của bốn game. Cái nào em lấy thì có ghi rõ.

- **Mindustry** (`MapObjectives.java`):
  - Mỗi mục tiêu có `parents` và `completed` lưu trong save. Điều kiện đọc thống kê tích lũy, nên mục nào đã đạt sẵn thì tự xong ở lần kiểm sau. HUD luôn hiện một dòng có số tiến độ.
  - **Em lấy:** đọc bộ đếm tích lũy (`progress.total`), mục đã đạt sẵn thì tự xong, dải mục tiêu một dòng có số.
  - Chính code Mindustry ghi "nobody reads details anyway", nên chữ mục tiêu phải gói trong một dòng.
- **Unciv** (`Events.json`, `TutorialTaskTable.kt`):
  - Chỉ hiện một thẻ, một việc, đi theo thứ tự danh sách.
  - **Em lấy** cách một dải, một việc.
  - **Em tránh** chỗ Unciv lưu việc đã xong theo máy chứ không theo save. Mình lưu trong save, để mỗi ô lưu có chuỗi riêng.
- **A Dark Room** (`room.js`):
  - Mỗi lần mở món mới có một câu kể chuyện.
  - **Em lấy:** bảng vàng của mục có mở nút kèm một câu ngắn, ví dụ "Tiệm đông rồi, thuê người phụ thôi!".
  - **Em tránh:** ở đó trạng thái "đã thấy" không lưu, nên mở lại game thì câu thoại lặp lại. Mình lưu.
- **Kittens Game** (`buildings.js`, `science.js`):
  - Nút hiện ra khi người chơi có 30% giá, để chính cái nút thành mục tiêu. Khi tải save, nó tính lại các nút đã mở từ những gì đã xong (`afterLoad`).
  - **Em lấy:** nút nào mở được tính lại từ chuỗi đã xong và ngày, không lưu riêng.
  - **Em tránh:** luật mở nút nằm rải ba chỗ, chính code ghi TODO vì rối. Mình gom về một hàm.
- **Bài học chung về save cũ:** tiệm cũ dễ xong một loạt mục cùng lúc, kéo theo một tràng thưởng và bảng vàng. Vì vậy mục 4.7 coi save cũ là đã xong chuỗi.

## 7. Chia lô (em đề xuất)

- **Lô A:** chuỗi mục tiêu, dải mục tiêu, bảng chuỗi trong Nhiệm vụ, mở nút theo mục tiêu, quà mặt nạ, toast nút khóa, Chú Sáu mở hàng, bảng tổng kết (mục tiêu kế tiếp, ngày mai, kỷ lục), xử lý save cũ. Lên một đời save.
  - Chú Sáu phải nằm trong lô A, vì mục 1 và dòng "Ngày mai Chú Sáu ghé lại" cần chú. Tách ra thì giữa hai lô, tiệm mới có một mục tiêu không làm được.
- **Lô B:** khách hào phóng. Lên một đời save nếu cần.
- Duyệt tài liệu này một lần cho cả hai lô. Sau đó em làm liền một mạch như các đợt trước. Mỗi lô xong thì test tự động và tự chơi thử trên trình duyệt đều đạt, rồi em tự merge vào master, đẩy lên mạng và báo chồng yêu.
- Làm trong worktree riêng. Trước khi merge, kiểm `origin/master` và nhánh `dot-4-chuoi`. Bên nào merge sau thì tích hợp và lấy số save kế tiếp.

## 8. Tiêu chí xong

- Tiệm mới, chơi bình thường:
  - mục 3 xong trong ngày 1;
  - người chơi gặp Đắp mặt nạ trong ngày 2;
  - dải mục tiêu luôn có mục đang làm cho tới khi chuỗi xong.
- Có test tự động cho:
  - từng mục tiêu xong đúng lúc;
  - thưởng không trả hai lần khi lưu và mở lại;
  - nút mở chậm nhất vào ngày cũ;
  - save cũ không có bảng vàng nào;
  - cùng hạt giống thì các lần bốc của tiệm không đổi khi bật khách hào phóng;
  - ngày 7 vẫn xếp lịch năm khách quen còn lại;
  - Chú Sáu luôn tới ngày 2;
  - không có bảng vàng huy hiệu nào trong lúc chạy chuỗi.
- Em tự chơi ngày 1–3 trên trình duyệt cỡ iPhone. Chồng yêu chơi thử trên iPhone và cho người chơi thử lần trước chơi lại.

## 9. Để người làm tự quyết

- Hình lá cờ trên dải mục tiêu, cách vẽ danh sách chuỗi trong bảng Nhiệm vụ, theo nét vẽ sẵn có.
- Câu chữ của từng mục, của khách hào phóng, miễn ngắn và vừa bong bóng (60 ký tự).
- Cách lưu chuỗi trong save, và cách chuỗi đọc bộ đếm.
- Kiểm mục tiêu mỗi bước của luật chơi, hay ngay tại chỗ việc xảy ra (phục vụ, mua, thuê, mở dịch vụ, đặt quà).
