# Đợt 3, phần 3–5: hạng tiệm, áo chủ tiệm, tiền khi vắng

- Ngày: 2026-10-28
- Trạng thái: chờ anh duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 6 (Đợt 3). Đi sau:
  - phần 1 `2026-10-28-dot-3-nhiem-vu-design.md` (lịch tháng, nhiệm vụ, huy hiệu);
  - phần 2 `2026-10-28-dot-3-le-su-kien-design.md` (lễ, sự kiện).
  - Cả hai phần đã lên mạng.
- Bản phác bấm thử: https://claude.ai/artifact/9ggNDtY5Cv8muth1Et58xg

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết. Ở phần này anh chọn cách A cho cả ba ("Duyệt cả ba A"), rồi duyệt bản phác và 17 điểm em đề xuất trên đó ("Duyệt, viết tài liệu").
- **(em đề xuất)** là em tự điền thêm khi viết tài liệu, anh sửa được.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Phần 3–5 của Đợt 3** (spec chung mục 6): hạng tiệm 1–5 sao kèm giải "Spa của năm", áo chủ tiệm mở bằng huy hiệu, tiền khi vắng. **(anh chọn)**
- **Trước khi làm, em đã xem các game mã nguồn mở** (OpenTTD, CorsixTH, OpenRCT2, Kittens Game, Trimps, Antimatter Dimensions, Evolve, SuperTuxKart, Pixel Wheels, Shattered Pixel Dungeon) để so ý tưởng. Mục 6 ghi em lấy gì.
- **Chia ba lô, làm lần lượt:** **(em đề xuất)**
  - **Lô A, save v19:** hạng tiệm, thẻ chấm tháng, Spa của năm, biển hạng cạnh cửa, cúp vàng và bằng khen.
  - **Lô B, save v20:** 9 bộ áo, tủ áo, thẻ "Áo mới".
  - **Lô C, save v21:** tiền khi vắng.
- **Anh duyệt tài liệu này một lần cho cả ba lô.** **(giữ cách của Đợt 2 và phần 1–2)**
  - Sau đó em làm liền một mạch.
  - Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh.
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Lịch** (`src/sim/calendar.ts`): 3 ngày một tháng, 36 ngày một năm. Có `monthOf`, `yearOf`, `dayOfMonth`, `monthStart`, `daysLeftInMonth`. Một ngày chơi dài 2,5 phút thật.
- **Sao trên thanh trên cùng** là điểm đánh giá: `rating(reviews)` trong `src/sim/economy.ts`, trung bình 20 đánh giá gần nhất (`RATING_WINDOW`), hiện "4,2". Hạng tiệm không được giống chỗ này.
- **Điểm đẹp:** `sim.beauty()`, tiệm mặc định 21. **Dịch vụ đã mở:** `sim.services`, 1 tới 6 món, gội đầu luôn có.
- **Bộ đếm cả đời** `progress.total` (`Counts` trong `src/sim/quests.ts`) không bao giờ đặt lại:
  - có `served` (cả khách VIP), `staff` (khách thợ làm), `owner3`, `lost` (khách bỏ về), `earned`, `tips`…;
  - `startDay` chụp lại thành `progress.dayStart`.
- **Lãi một ngày:** `dayProfit(stats)` = tiền dịch vụ + tip + tiền quà + thưởng − lương − nhập hàng. `DayStats` là số của hôm nay, lưu trong ô lưu.
- **Hết ngày** xảy ra trong `SpaSim.step`, khi đã đóng cửa, hết khách và không ai đang làm. Thứ tự:
  1. `dayOver = true`;
  2. trả lương;
  3. `payQuests`;
  4. `recordDay`;
  5. hẹn khách VIP và lên lịch sự kiện ngày mai, mỗi việc một dòng ngẫu nhiên riêng;
  6. phát `dayEnded`.
- **`startDay`** chấm huy hiệu của ngày vừa đóng trước khi `day++`, rồi bốc nhiệm vụ.
- **Huy hiệu:** 20 cái (`src/sim/badges.ts`). `sim.badges` là `Partial<Record<BadgeId, number>>` (ngày có). Sự kiện `badge` chỉ phát khi Nhiệm vụ đã mở (ngày 8).
- **Giá:** `payFor` trong `src/sim/spa.ts`:
  - `plain` = giá món;
  - món lễ nhân `FESTIVAL_PRICE` (1,2) cho khách thường;
  - khách VIP trả `plain × VIP_PRICE_FACTOR` (3);
  - tip tính trên giá đã nhân lễ.
  - Giá món là bội của 10.000 đ (40.000 tới 160.000).
- **Quà trang trí:** món `giftOnly` trong `ITEMS` (`src/sim/items.ts`), đẩy vào `book.gifts`, chờ trong Xây dựng để anh đặt miễn phí. Đã có 6 quà lễ và Giấy khen (`certificate`).
- **Bảng Nhiệm vụ** (`QuestsScene`) có hai thẻ:
  - "Nhiệm vụ" và "Thành tựu";
  - `TAB_X = { quests: 300, badges: 780 }`.
- **Thẻ vàng:** `SpaScene.badgeQueue` xếp hàng huy hiệu và thẻ sự kiện. Thẻ không có nút, tự tắt sau `goldCardMs`.
- **Thẻ có nút phủ tiệm** (ví dụ thẻ thanh tra) dừng tiệm bằng cờ modal của `SpaScene`.
- **Chủ tiệm:**
  - `ownerLook` = `{ skin, hair, hairStyle, shirt }`, `shirt` có 4 màu áo bà ba.
  - `OwnerScene` có ba chế độ `new`, `upgrade`, `edit`. Chế độ `edit` mở từ nút "Hồ sơ chủ tiệm" của bảng tạm dừng.
  - Hình ghép từ các mảnh chibi trong `src/art/chibi.ts`, vẽ bằng `CharacterView`. Áo mặc định đã là áo bà ba (cổ tròn, đường nẹp giữa).
- **Lưu:**
  - `SaveSession` (`src/save/session.ts`) là chỗ duy nhất ghi ô lưu.
  - `SpaScene` ghi mỗi 10 giây (`AUTOSAVE_MS`), khi ẩn trang và khi rời trang.
  - Quay lại trang thì `onReturn` có thể tải lại (ô lưu bị trang khác ghi, hoặc có bản mới).
  - Ô lưu chưa có giờ thật nào.
- **Bẫy cũ còn nguyên:**
  - `SpaSim.fromSave` phát lại `dayEnded` nếu ô lưu được ghi sau khi hết ngày.
  - Mọi lần bốc mới phải dùng dòng ngẫu nhiên riêng.
  - `same-draws.test.ts` chơi lại 7 ngày đầu.
- **Save v18, 906 test.**

## 3. Mục tiêu

- **Có một đích dài hạn:** tiệm lên dần từ 1 tới 5 sao, mỗi tháng biết mình thiếu gì, mỗi năm đua giải Spa của năm với 4 tiệm cùng phố.
- **Huy hiệu có ý nghĩa:** gom huy hiệu để mở áo đẹp cho chủ tiệm, nhất là áo dài.
- **Thuê nhân viên giỏi có lợi thêm:** tiệm để nhân viên làm hết thì tắt game tiền vẫn vào.
- **Không cái nào làm người chơi mất gì:** hạng không tụt, thua giải không mất gì, vắng lâu không bị trừ tiền.

## 4. Chưa làm ở phần này

- Áo cho nhân viên. Nhân viên mặc như cũ.
- Mua áo bằng tiền. Áo chỉ mở bằng huy hiệu và giải Spa của năm.
- Hạng tụt khi tiệm làm kém.
- 4 tiệm đối thủ có hình hay đi lại được trên phố. Ở phần này họ chỉ là tên và điểm trong bảng.
- Trong lúc vắng mà lịch, khách hay nhiệm vụ chạy tiếp. Lúc vắng chỉ có tiền vào.
- Thông báo đẩy lên điện thoại ("tiệm đang chờ anh").
- Bảng xếp hạng với người chơi khác qua mạng.

## 5. Điều cấm (dính là coi như hỏng)

- **Không cái nào trừ tiền hay lấy mất đồ.**
  - Hạng không bao giờ tụt.
  - Hạng 4 và 5 ở Spa của năm không mất gì.
  - Tiền khi vắng không bao giờ âm.
- **Không trả hai lần:**
  - Tải lại ô lưu, hay `fromSave` phát lại `dayEnded`, không được trả lại thưởng lên sao, thưởng Spa của năm, hay tặng lại cúp, bằng khen.
  - Tải lại, cập nhật bản mới hay nhập ô lưu không được trả lại tiền khi vắng. Đổi sang ô lưu khác thì tiệm kia được tiền của riêng nó (mục 7.6).
- **Vắng không làm game chạy tới.** Ngày, giờ trong ngày, khách, nhiệm vụ, kho, lương, sức nhân viên đều đứng yên. Chỉ có tiền vào.
- **Hạng tiệm không đặt lên thanh trên cùng,** để không lẫn với sao đánh giá.
- **Phần mới không bốc ngẫu nhiên gì.** Chuỗi bốc của tiệm giữ nguyên.
- **Chữ và số trên màn hình không được tràn, đè lên nhau** ở màn iPhone.

## 6. Các cách đã cân nhắc

Anh chọn cách A cho cả ba. **(anh chọn)**

**Hạng tiệm:**
- **A. Chấm cuối tháng theo 5 mục, chỉ lên không xuống.** **(anh chọn)** Biết trước ngày chấm, thấy được thiếu mục nào, không bao giờ mất.
- B. Hạng chạy theo từng ngày như điểm công viên của OpenRCT2. Bỏ: hạng lên xuống liên tục, một ngày xấu là tụt sao, trái điều cấm.
- C. Hạng theo mốc cố định (đủ N khách, đủ N tiền). Bỏ: chỉ đo chơi lâu, không đo tiệm tốt.

**Áo:**
- **A. Mở theo số huy hiệu, tính lại mỗi lần mở game, chỉ lưu bộ đang mặc.** **(anh chọn)**
- B. Lưu danh sách áo đã mở. Bỏ: dễ lệch với huy hiệu khi ô lưu cũ hay hỏng.
- C. Mua áo bằng tiền. Bỏ: huy hiệu vẫn không có thưởng gì.

**Tiền khi vắng:**
- **A. Ghi giờ thật vào ô lưu, quay lại thì trả một lần theo lãi gần đây, tối đa 8 giờ.** **(anh chọn)**
- B. Chơi lại thời gian đã mất, như Antimatter Dimensions. Bỏ: 1 giờ thật bằng 24 ngày chơi, lịch, lễ, nhiệm vụ sẽ trôi hết.
- C. Gom thời gian vắng để chơi nhanh hơn sau đó, như Evolve. Bỏ: thêm một nút điều khiển mới cho trẻ con.

Ý tưởng lấy từ game mã nguồn mở (em chỉ lấy ý, không chép mã):
- **OpenTTD:** điểm công ty gồm nhiều mục, mỗi mục có "mức cần đạt"; trụ sở lên bậc theo điểm, chỉ lên. → 5 mục × 20 điểm, mỗi mục có mức đủ điểm; hạng chỉ lên.
- **CorsixTH:** cuối năm xét giải theo ngưỡng, có tiền thưởng. → Spa của năm tối ngày cuối năm.
- **OpenRCT2:** giải thưởng đổi lượng khách. → mỗi sao khách trả thêm 5%.
- **Kittens Game, Trimps:** lấy giờ thật lúc tắt và lúc mở, bỏ khi lùi giờ, có trần, trả một lần theo tốc độ kiếm tiền. → tiền khi vắng.
- **SuperTuxKart, Pixel Wheels:** đồ mở khóa tính từ số liệu đã lưu, không lưu riêng. → áo tính từ số huy hiệu.
- **Shattered Pixel Dungeon:** đồ chưa mở hiện mờ, ghi cách mở. → tủ áo hiện bộ chưa mở mờ, có khóa và "Cần N huy hiệu".

## 7. Người chơi thấy gì

### 7.1 Hạng tiệm (lô A)

- **Tiệm nào cũng bắt đầu 1 sao.** **(anh chọn)**
  - Lần chấm đầu: tối ngày 9 (cuối tháng 3, ngay sau khi có Nhiệm vụ).
  - Sau đó: tối ngày cuối của mỗi tháng (ngày 12, 15, 18…).
- **Thang 100 điểm, 5 mục, mỗi mục tối đa 20 điểm:** **(anh chọn)**

  | Mục | 0 điểm | đủ 20 điểm |
  |---|---|---|
  | Điểm đánh giá | 3,0 trở xuống | 4,8 trở lên |
  | Điểm đẹp | 0 | 60 trở lên (mốc huy hiệu Tiệm xinh) |
  | Số dịch vụ đã mở | — | đủ 6 món (mỗi món 20/6 điểm) |
  | Khách trung bình mỗi ngày trong tháng | 0 | 25 trở lên (mốc huy hiệu Ngày đông) |
  | Khách bỏ về trong tháng | 20% trở lên | không ai bỏ về |

  - Giữa hai mốc thì tính theo tỉ lệ. **(anh chọn)**
  - Mỗi mục làm tròn ra số nguyên rồi mới cộng. Ví dụ: đánh giá 4,2, đẹp 40, 4 món, 14 khách/ngày, 9% bỏ về được 13 + 13 + 13 + 11 + 11 = 61 điểm. **(em đề xuất, theo bản phác)**
  - Tiệm chưa có đánh giá nào thì mục đánh giá được 0. **(em đề xuất)**
- **Đổi điểm ra sao:** dưới 30 là 1 sao, từ 30 là 2 sao, từ 50 là 3 sao, từ 70 là 4 sao, từ 85 là 5 sao. **(anh chọn)**
  - Mỗi lần chấm, tiệm lên nhiều nhất 1 sao.
  - Hạng không bao giờ tụt.
- **Mỗi lần lên sao, thưởng một lần:** 200.000 đ khi lên 2 sao, 400.000 đ khi lên 3 sao, 700.000 đ khi lên 4 sao, 1.000.000 đ khi lên 5 sao. **(anh chọn)**
- **Từ 2 sao, mỗi sao khách trả thêm 5%:** tiệm 2 sao +5%, 3 sao +10%, 4 sao +15%, 5 sao +20%. Bắt đầu từ sáng hôm sau ngày lên sao. **(anh chọn)**
  - Áp cho mọi khách, kể cả khách VIP và món lễ. **(em đề xuất)**
  - Thứ tự tính: giá món nhân hạng, làm tròn tới 1.000 đ, rồi mới nhân giá lễ hoặc giá VIP như cũ. Tip tính trên giá đã nhân, như giá lễ. **(em đề xuất)**
- **Biển hạng cạnh cửa:** tầng 1, bên trái cửa, có số sao vàng của tiệm. Lên sao thì biển đổi theo. Biển là hình, không phải đồ trong Xây dựng. **(anh chọn, vị trí theo bản phác)**

### 7.2 Thẻ "Hạng tiệm" (lô A)

- **Bảng Nhiệm vụ có thêm thẻ thứ ba "Hạng tiệm"** cạnh "Nhiệm vụ" và "Thành tựu". **(anh chọn)**
- **Trên cùng:** hàng 5 sao (sao đã có tô vàng), dòng "Tiệm 3 sao · khách trả thêm 10%". Tiệm 1 sao thì chỉ "Tiệm 1 sao".
- **Khối tháng này:**
  - Tiêu đề "Tháng 5, tới hôm nay", bên phải "chấm tối ngày 15".
  - 5 hàng mục. Mỗi hàng có vòng biểu tượng, tên mục, giá trị ("4,2", "40", "4/6 món", "14 khách", "9%"), thanh điểm trên 20 và số điểm.
  - Dòng tổng:
    - còn thiếu: "Tổng 46 điểm · cần 50 để lên 3 sao";
    - đã đủ: "Tổng 61 điểm · đủ lên 3 sao tối ngày 15";
    - đã 5 sao: chỉ "Tổng 88 điểm".
  - Trước lần chấm đầu (ngày 8, 9) vẫn hiện như vậy, ngày chấm là ngày 9.
- **Khối Spa của năm:**
  - Tiêu đề "Spa của năm · năm 1", bên phải "tối ngày 36".
  - Bảng 5 hàng xếp theo điểm, hàng của tiệm tô nền xanh.
  - Điểm của tiệm ở đây là trung bình các tháng đã chấm trong năm cộng điểm tháng này tới hôm nay. **(em đề xuất, theo bản phác)**
  - Dòng nhỏ cuối: "Điểm của tiệm là trung bình các tháng đã chấm trong năm."

### 7.3 Thẻ chấm tháng (lô A)

- **Tối ngày chấm, sau bảng tổng kết:** bấm nút của bảng tổng kết thì mở thẻ chấm tháng thay vì sang ngày mới. **(em đề xuất)**
- **Thẻ có:**
  - dòng nhỏ "Tối ngày 15 · chấm hạng tháng 5";
  - hàng sao;
  - 5 hàng mục, thanh điểm chạy dần lên;
  - dòng "Tổng", số chạy từ 0 lên.
- **Khung kết quả:**
  - **Lên sao** (nền vàng nhạt, sao mới nảy ra):
    - "Lên 3 sao!";
    - "Thưởng 400.000 đ. Từ mai khách trả thêm 10%, biển cạnh cửa đổi theo.";
    - nếu điểm đủ cho hơn 1 sao thì thêm "Điểm đủ cao hơn nữa: tháng sau lên tiếp."
  - **Giữ sao:** "Giữ 2 sao", "Còn 4 điểm nữa là lên 3 sao. Hạng không bao giờ tụt."
  - **Đã 5 sao:** "Giữ 5 sao", "Tiệm đã ở hạng cao nhất."
- **Nút "Mở cửa ngày 16":** sang ngày mới. Ngày cuối năm thì nút này mở thẻ Spa của năm trước.
- **Tiền thưởng cộng ngay lúc chấm,** không ghi vào bảng tổng kết ngày. Khi đóng thẻ, số tiền bay lên thanh trên cùng; lên sao thì có thêm toast "Tiệm lên 3 sao · biển hạng cạnh cửa đã đổi". **(em đề xuất)**
- **Tắt game lúc đang ở bảng tổng kết hay thẻ chấm:** mở lại vẫn thấy thẻ chấm, nhưng không trả tiền lần nữa. **(em đề xuất)**

### 7.4 Spa của năm (lô A)

- **Tối ngày cuối năm (ngày 36, 72…), tiệm đọ điểm với 4 tiệm cùng phố.** **(anh chọn)**
  - Điểm của tiệm là trung bình các tháng đã chấm trong năm, làm tròn.
  - Năm đầu, 4 tiệm kia có: Tiệm gội Cô Ba 48, Ngọc Lan Spa 58, Spa Hoa Sen 66, SPA MỚI 74.
  - Mỗi năm sau, họ lên thêm 4 điểm, cao nhất 86.
  - Bằng điểm thì tiệm mình đứng trên. **(em đề xuất)**
- **Thưởng theo thứ hạng:** **(anh chọn)**
  - **Nhất:** 3.000.000 đ. Lần thắng đầu được thêm cúp vàng (vào Xây dựng như quà lưu niệm) và bộ áo dài Spa của năm (lô B).
  - **Nhì:** 1.000.000 đ và bằng khen.
  - **Ba:** 500.000 đ.
  - **Thứ 4 và thứ 5:** không mất gì, chỉ có dòng "Năm sau cố lên".
- **Cúp vàng chỉ tặng lần thắng đầu, bằng khen chỉ tặng lần về nhì đầu;** các lần sau chỉ có tiền. **(em đề xuất)**
- **Thẻ Spa của năm** mở sau thẻ chấm tháng của ngày cuối năm:
  - "Tối ngày 36 · hết năm 1", tiêu đề "Spa của năm";
  - nhất: hình cúp; nhì: hình bằng khen; còn lại: vòng tròn "Hạng 3"…;
  - bảng 5 hàng, mỗi hàng có số thứ tự trong vòng vàng, bạc, đồng, tên tiệm và điểm;
  - các câu theo thứ hạng, ví dụ "Tiệm đoạt Spa của năm! Thưởng 3.000.000 đ." và lần đầu thêm "Lần đầu nên có thêm cúp vàng (vào Xây dựng) và áo dài Spa của năm.";
  - dòng cuối "Năm 2 các tiệm kia lên thêm 4 điểm. Điểm của tiệm năm nay: 68, trung bình các tháng.";
  - nút "Nhận thưởng" (có tiền) hoặc "Đóng" (không có tiền), rồi sang ngày mới.
  - Cao của thẻ theo số dòng chữ.
- **Lô A chưa có áo,** nên câu lần đầu ở lô A chỉ ghi cúp vàng. Lô B thêm áo dài vào câu. **(em đề xuất)**
- **Hai quà mới, chỉ có từ giải:** **(em đề xuất)**
  - **Cúp vàng:** 1×1, 8 điểm đẹp.
  - **Bằng khen:** 1×1, 5 điểm đẹp, khung bạc.
  - Cả hai đứng trên sàn như ảnh ký tên, hình theo bản phác.

### 7.5 Tủ áo và 9 bộ áo (lô B)

- **9 bộ áo:** **(anh chọn, hình theo bản phác)**

  | Bộ | Mở khi | Hình |
  |---|---|---|
  | Áo bà ba | có sẵn | như bây giờ, vẫn chọn 4 màu |
  | Đồng phục spa | 2 huy hiệu | áo kem viền xanh ngọc, quần xanh đậm |
  | Bà ba khăn rằn | 4 huy hiệu | bà ba nâu đậm, khăn rằn ca rô quàng cổ |
  | Áo dài xanh ngọc | 6 huy hiệu | áo dài xanh ngọc |
  | Áo dài hồng sen | 9 huy hiệu | áo dài hồng có hoa sen, nón lá |
  | Áo dài gạch bông | 12 huy hiệu | áo dài xanh cô-ban hoa văn gạch bông, viền kem |
  | Áo dài hoa mai | 16 huy hiệu | áo dài vàng hoa mai, viền đỏ, khăn vấn |
  | Áo dài gấm | 20 huy hiệu | áo dài gấm đỏ thẫm, viền và cổ tay vàng, khăn vấn |
  | Áo dài Spa của năm | thắng Spa của năm | áo dài trắng ngà, viền vàng, dải đỏ chéo, huy chương, vòng hoa |

- **Áo dài có tay dài và quần trắng.** Nón lá, khăn vấn, vòng hoa đội trên tóc. **(anh chọn)**
- **Nhân viên vẫn mặc như cũ.** **(anh chọn)**
- **Tủ áo mở được ở hai chỗ:** nút "Tủ áo" trong thẻ Thành tựu, và nút "Tủ áo" trên thẻ Hồ sơ chủ tiệm (mở từ bảng tạm dừng). **(anh chọn chỗ; nút trên thẻ Hồ sơ là em đề xuất)**
- **Trong tủ áo:**
  - tiêu đề "Tủ áo", dòng "Có 9/20 huy hiệu · mở 5/9 bộ";
  - hình chủ tiệm lớn mặc bộ đang chọn (bộ chưa mở thì mờ), tên bộ, và một dòng:
    - "Đang mặc";
    - hoặc "Bấm Mặc bộ này để thay";
    - hoặc "Cần 12 huy hiệu · còn 3 nữa";
    - hoặc "Chỉ có khi đoạt Spa của năm";
  - lưới 3×3 ô:
    - mỗi ô có hình chủ tiệm nhỏ mặc bộ đó và tên bộ;
    - bộ chưa mở: ô viền đứt, hình mờ, khóa ở góc, "Cần N" hoặc "Spa của năm";
    - bộ đang mặc: dấu tích xanh ở góc;
  - hai nút "Xong" và "Mặc bộ này" (bộ chưa mở hoặc đang mặc thì nút mờ).
- **Mặc bộ khác:** hình chủ tiệm trong tiệm đổi ngay, toast "Chủ tiệm mặc Áo dài hồng sen".
- **Màu áo bà ba** vẫn chọn ở thẻ Hồ sơ như bây giờ, chỉ có tác dụng khi đang mặc áo bà ba. **(em đề xuất)**
- **Khi đủ huy hiệu cho bộ mới:** **(anh chọn)**
  - thẻ vàng "Áo mới · đủ 9 huy hiệu" (hoặc "Áo mới · quà Spa của năm");
  - hình chủ tiệm lớn mặc bộ mới, tên bộ;
  - dòng "Mặc thử ngay, hay đổi sau ở Tủ áo trong thẻ Thành tựu.";
  - hai nút "Để sau" và "Mặc thử".
  - Thẻ này có nút, nên tiệm dừng trong lúc thẻ mở, như thẻ thanh tra. Thẻ chờ sau thẻ huy hiệu vừa có. **(em đề xuất)**
- **Mở nhiều bộ một lúc** (tiệm cũ, hay một lần có 2 huy hiệu): chỉ một thẻ, hiện bộ cao nhất, thêm dòng "và 2 bộ khác trong Tủ áo". **(em đề xuất)**
- **Tiệm cũ đã đủ huy hiệu thì có áo ngay,** game báo một lần bằng thẻ trên. **(anh chọn)**
- **Áo chỉ báo từ ngày 8,** khi Nhiệm vụ mở, cùng lúc huy hiệu bắt đầu được báo. **(em đề xuất)**

### 7.6 Tiền khi vắng (lô C)

- **Điều kiện:** ngày gần nhất đã xong, nhân viên làm hết khách. **(anh chọn)**
  - Chủ tiệm chỉ tự làm khách VIP hoặc Mi Mi, hoặc không làm khách nào. **(Mi Mi là em đề xuất)**
  - Nhân viên làm ít nhất 1 khách. Khách bỏ về không làm mất điều kiện, chỉ làm lãi ít đi. **(em đề xuất)**
- **Vắng từ 10 phút trở lên thì có tiền,** dù tắt game hay khóa máy. **(anh chọn)**
  - Mỗi giờ vắng được 1/4 lãi trung bình của 3 ngày gần nhất.
  - Tính tối đa 8 giờ, tức khoảng 2 ngày lãi.
  - Lãi âm thì được 0 đ, không bị trừ.
  - Số tiền làm tròn tới 1.000 đ. **(em đề xuất)**
- **"3 ngày gần nhất"** là 3 ngày chơi đã xong gần nhất, kể cả ngày lễ và ngày đang hot. Lãi của mỗi ngày là dòng "Lãi" trên bảng tổng kết. **(em đề xuất)**
  - Mới có 1–2 ngày thì lấy trung bình số ngày đó.
  - Chưa có ngày nào thì chưa có tiền.
- **Trong lúc vắng, mọi thứ khác đứng yên:** lịch, giờ trong ngày, nhiệm vụ, kho và sức nhân viên. **(anh chọn)**
  - Tiền vắng không tính vào nhiệm vụ, cũng không tính vào bảng tổng kết ngày. **(anh chọn)**
  - Tiền vắng không vào các bộ đếm (tiền kiếm được, lãi lớn nhất). Riêng huy hiệu Triệu đầu đọc số tiền đang có, nên tiền vắng, tiền thưởng hạng và thưởng Spa của năm vẫn giúp tới mốc đó, như tiền thưởng nhiệm vụ bây giờ. **(em đề xuất)**
- **Đổi ô lưu cũng tính là vắng:** mở ô lưu khác thì tiệm đó được tiền cho khoảng thời gian chưa ai mở nó, tối đa 8 giờ, vì nhân viên tiệm đó vẫn làm. Mỗi tiệm vẫn phải tự đủ điều kiện. **(em đề xuất)**
- **Chỉnh đồng hồ máy cũng không ăn gian được nhiều:** chỉnh lùi thì không được tiền; chỉnh tới thì mỗi lần vẫn chỉ tính tối đa 8 giờ. **(anh chọn)**
- **Thẻ "Chủ tiệm về rồi"** khi mở lại game hoặc mở khóa máy:
  - dòng nhỏ "Chủ tiệm về rồi", tiêu đề "Vắng 5 giờ 20 phút";
  - hình lễ tân và một thợ của tiệm, vòng đồng xu ở giữa;
  - "Nhân viên kiếm được", số tiền lớn "+1.333.000 đ";
  - các câu nhỏ: "Mỗi giờ vắng bằng 1/4 lãi một ngày (lãi trung bình 3 ngày gần nhất: 1.000.000 đ).", vắng hơn 8 giờ thêm "Vắng hơn 8 giờ thì vẫn tính 8 giờ.", rồi "Lịch, giờ trong ngày, nhiệm vụ và kho vẫn như lúc tắt game.";
  - nút "Nhận tiền", bấm thì tiền bay lên thanh trên cùng.
  - Cao của thẻ theo số dòng chữ.
  - Tiệm chưa có lễ tân hay thợ thì hình dùng người tiệm có. **(em đề xuất)**
- **Lần đầu quay lại mà chưa đủ điều kiện:** game nhắc một lần "Ngày nào nhân viên làm hết khách (khách VIP thì chủ tiệm làm), tắt game tiền vẫn vào." **(anh chọn)**
  - Chỉ nhắc khi tiệm đã tới ngày thuê được nhân viên (ngày 3), để tiệm mới khỏi bị nhắc điều chưa làm được. **(em đề xuất)**
  - Đủ điều kiện mà lãi âm hay bằng 0 thì không có thẻ, không nhắc. **(em đề xuất)**
- **Thẻ chỉ hiện khi tiệm đã có chủ** (đã qua thẻ tạo tiệm), và hiện trước bảng tạm dừng của lần mở lại. **(em đề xuất)**

### 7.7 Âm thanh

- Lên sao, Spa của năm hạng 1–3, thẻ "Áo mới", nhận tiền khi vắng: tiếng `levelUp` như huy hiệu mới.
- Giữ sao, Spa của năm hạng 4–5: không thêm tiếng.

## 8. Luật trong code

### 8.1 Hạng tiệm (lô A)

- **Module mới `src/sim/rank.ts`:**
  - `rankParts(input)`: nhận `{ rating, beauty, services, servedPerDay, lostShare }`, trả 5 số điểm đã làm tròn, mỗi số 0–20.
  - `starsFor(total)`: số sao theo `RANK_STAR_AT`.
  - `rankPriceFactor(stars)` = `1 + RANK_PRICE_STEP × (stars − 1)`.
  - `rivalsFor(year)`: 4 tiệm với điểm `min(RIVAL_SCORE_MAX, base + RIVAL_YEAR_STEP × (year − 1))`.
  - `standings(mine, year)`: xếp 5 tiệm, bằng điểm thì tiệm mình đứng trên.
  - Đây là nơi duy nhất ghi các bảng ở mục 7.1 và 7.4.
- **Trạng thái `RankBook`, lưu trong ô lưu (`rank`):**
  - `stars`: 1 tới 5;
  - `month`: `{ from, served, lost }`, ngày đầu tính và hai bộ đếm `progress.total` lúc đó;
  - `scores`: điểm các tháng đã chấm trong năm nay;
  - `last`: kết quả chấm gần nhất, hoặc null. Gồm `day`, giá trị và điểm 5 mục, `total`, `before`, `after`, `reward`;
  - `lastYear`: kết quả Spa của năm gần nhất, hoặc null. Gồm `day`, `year`, `score`, bảng 5 hàng, `place`, `reward`, quà đã tặng;
  - `wins`: số lần đoạt Spa của năm;
  - `meritGiven`: đã tặng bằng khen chưa.
- **Số của tháng:**
  - `startDay` khi `dayOfMonth(day) === 1`: đặt `month = { from: day, served: total.served, lost: total.lost }`.
  - Khách mỗi ngày = `(total.served − month.served) / (day − month.from + 1)`.
  - Phần bỏ về = `lost / (served + lost)` của tháng; tháng không có khách nào thì 0.
  - Thẻ Hạng tiệm dùng đúng các công thức này với số tới lúc mở thẻ.
- **Chấm tháng** ở khối hết ngày trong `step`, sau `recordDay`, trước khi phát `dayEnded`, khi `day >= RANK_FROM_DAY` và `dayOfMonth(day) === DAYS_PER_MONTH`. **(em đề xuất)**
  1. Tính 5 mục từ `rating(reviews)`, `beauty()`, `services.length` và số của tháng.
  2. `after = stars < starsFor(total) ? stars + 1 : stars`.
  3. Lên sao thì cộng `RANK_REWARD[after]` vào `money`. Không ghi vào `stats`, nên không vào bảng tổng kết hay lãi ngày.
  4. Đẩy `total` vào `scores`, ghi `last`, đặt `stars = after`.
  - Chấm ở đây chứ không ở `startDay` (như huy hiệu), vì thẻ chấm phải hiện ngay tối đó. Kết quả nằm trong ô lưu nên tải lại chỉ hiện lại thẻ.
- **Chấm năm** ngay sau chấm tháng, khi `day % (DAYS_PER_MONTH × MONTHS_PER_YEAR) === 0` và `scores` không rỗng:
  1. `score = round(trung bình scores)`, xếp hạng bằng `standings(score, yearOf(day))`.
  2. Cộng `YEAR_REWARD[place − 1]` vào `money`.
  3. Nhất lần đầu (`wins === 0`): đẩy `trophy` vào `book.gifts`. Nhất thì `wins++`.
  4. Nhì và chưa `meritGiven`: đẩy `merit` vào `book.gifts`, đặt `meritGiven`.
  5. Ghi `lastYear`, đặt `scores = []`.
- **`SpaScene`:**
  - Nút của bảng tổng kết: nếu `rank.last?.day === sim.day` thì mở thẻ chấm tháng.
  - Thẻ chấm tháng: nếu `rank.lastYear?.day === sim.day` thì mở thẻ Spa của năm.
  - Cuối cùng mới `startDay`.
  - Thẻ chỉ đọc kết quả đã lưu, không tự tính, không trả tiền.
- **Giá:** `payFor` đổi `plain` thành `roundTo1000(SERVICES[c.service].price × rankPriceFactor(rank.stars))`. Phần còn lại giữ nguyên.
- **Biển hạng:** `RoomView` vẽ biển ở tầng 1 cạnh cửa theo `rank.stars`, vẽ lại khi số sao đổi.
- **Đồ mới trong `ITEMS`:** `trophy` và `merit` (`giftOnly`, 1×1), hình trong `src/art/furniture.ts`.

### 8.2 Áo (lô B)

- **Module mới `src/sim/outfits.ts`:**
  - `OUTFITS`: id, mở khi (số huy hiệu hoặc `'year'`), khóa chữ tên.
  - `unlockedOutfits(badgeCount, wins)`: bộ có `need <= badgeCount`, cộng bộ `'year'` khi `wins > 0`.
  - Số huy hiệu là số khóa trong `sim.badges`.
- **Ô lưu:**
  - `ownerOutfit`: bộ đang mặc, mặc định `'baba'`;
  - `outfitsSeen`: các bộ đã báo.
  - Danh sách bộ đã mở không lưu, luôn tính lại.
- **Báo áo mới** trong sim, sau mỗi lần có huy hiệu mới và sau chấm năm, khi Nhiệm vụ đã mở:
  - bộ đã mở mà chưa có trong `outfitsSeen` thì thêm vào và phát `outfitUnlocked { ids }`;
  - `fromSave` cũng làm việc này một lần, để tiệm cũ được báo.
- **`wearOutfit(id)`:** chỉ nhận bộ đã mở.
- **Hình:**
  - Phần hình có bảng áo riêng (`src/art/outfits.ts`): thân áo, tay áo, màu quần, mũ, theo hình bản phác (`outfits.js` trong thư mục phác thảo).
  - `CharacterView` của chủ tiệm nhận thêm bộ áo:
    - áo bà ba vẽ như cũ với màu `shirt`;
    - bộ khác thay mảnh `body` bằng thân áo, phủ tay áo lên `arm`, tô `leg` màu quần, đội mũ sau tóc.
  - Đủ ba hướng nhìn (xuống, ngang, lên) và lúc đi.
- **Màn mới `WardrobeScene`:** phủ tiệm như `QuestsScene`.

### 8.3 Tiền khi vắng (lô C)

- **Giờ thật:** `SaveSession` ghi `savedAt` (mili giây, `Date.now()`) vào mỗi lần ghi ô lưu. Sim không đọc giờ thật. **(em đề xuất)**
  - `replaceWith` (nhập ô lưu) đặt `savedAt` là lúc nhập, nên ô lưu nhập vào không có tiền vắng.
- **Đếm việc của chủ tiệm:** `DayStats` thêm `ownerServed`, số khách không phải VIP hay Mi Mi mà chủ tiệm làm hôm nay.
- **Trạng thái `AwayBook`, lưu trong ô lưu (`away`):**
  - `profits`: lãi của tối đa `AWAY_PROFIT_DAYS` ngày đã xong gần nhất;
  - `ok`: ngày đã xong gần nhất có đủ điều kiện không;
  - `tipSeen`: đã nhắc chưa.
- **Lúc hết ngày,** cạnh `recordDay`:
  - đẩy `dayProfit(stats)` vào `profits`, giữ 3 số cuối;
  - `ok = ownerServed === 0 && khách thợ làm hôm nay >= 1`.
- **`awayPay(ms)`** trong sim:
  - `hours = min(AWAY_MAX_HOURS, ms / giờ)`;
  - trả `roundTo1000(hours × AWAY_DAY_SHARE × max(0, trung bình profits))` nếu `ok`, 0 nếu không;
  - cộng vào `money`, không vào `stats` hay bộ đếm `progress`.
- **`SpaScene` tính thời gian vắng ở hai chỗ:**
  - **mở game:** `Date.now() − saved.savedAt`;
  - **quay lại trang mà trang không tải lại:** `Date.now() −` lúc trang bị ẩn.
  - Từ `AWAY_MIN_MS` trở lên thì gọi `awayPay`.
  - Có tiền thì mở thẻ "Chủ tiệm về rồi" và ghi ô lưu ngay. Như vậy `savedAt` mới là lúc này, nên tải lại hay cập nhật bản mới ngay sau đó không trả lần nữa.
  - Không có tiền vì chưa đủ điều kiện, chưa `tipSeen` và `day >= UNLOCK_DAY.staff`: nhắc một lần, đặt `tipSeen`.
  - Thời gian âm (đồng hồ lùi) thì bỏ qua.

### 8.4 Save và tiệm cũ

- **v19 (lô A):** thêm `rank`.
  - Ô lưu cũ: `stars = 1`, `month = { from: day, served: dayStart.served, lost: dayStart.lost }`, mọi thứ khác rỗng.
  - Lần chấm đầu của tiệm cũ là tối ngày cuối tháng đang chơi. Tiệm giỏi cũng lên từng sao một mỗi tháng. **(em đề xuất)**
  - `repairRank` sửa từng trường: `stars` ngoài 1–5 thì 1, danh sách hỏng thì rỗng.
- **v20 (lô B):** thêm `ownerOutfit` và `outfitsSeen`.
  - Ô lưu cũ: `ownerOutfit = 'baba'`, `outfitsSeen = ['baba']`.
  - Bộ lạ hay chưa mở thì về `'baba'`.
- **v21 (lô C):** thêm `away`, `savedAt` và `stats.ownerServed`.
  - Ô lưu cũ: `profits = []`, `ok = false`, `tipSeen = false`, `savedAt = null`, `ownerServed = 0`.
  - Lần mở đầu tiên sau khi lên bản mới không có tiền vắng.
- `parseVersioned` nhận đủ các đời cũ. Mỗi đời save có bản lưu mẫu đông cứng trong `tests/fixtures`.
- **Test chơi lại 7 ngày** (`same-draws.test.ts`) không đổi: phần mới không bốc ngẫu nhiên, và lần chấm đầu là ngày 9.

## 9. Ba lô

### Lô A: hạng tiệm và Spa của năm (save v19)

- `rank.ts`, `RankBook`, chấm tháng và chấm năm ở hết ngày, giá theo hạng.
- Thẻ "Hạng tiệm" trong bảng Nhiệm vụ, thẻ chấm tháng, thẻ Spa của năm.
- Biển hạng cạnh cửa, cúp vàng và bằng khen (hình).
- Save v19.

### Lô B: áo chủ tiệm (save v20)

- `outfits.ts`, hình 8 bộ mới cho ba hướng nhìn, `CharacterView` mặc áo.
- Tủ áo, nút ở thẻ Thành tựu và thẻ Hồ sơ, thẻ "Áo mới".
- Câu áo dài trong thẻ Spa của năm.
- Save v20.

### Lô C: tiền khi vắng (save v21)

- `savedAt` trong `SaveSession`, `ownerServed`, `AwayBook`, `awayPay`.
- Thẻ "Chủ tiệm về rồi", lời nhắc một lần.
- Save v21.

## 10. Số khởi đầu (`src/config.ts`)

| Tên | Số | Nghĩa |
|---|---|---|
| `RANK_FROM_DAY` | 9 | Lần chấm hạng đầu |
| `RANK_RATING` | [3,0, 4,8] | Điểm đánh giá được 0 và được đủ 20 |
| `RANK_BEAUTY_FULL` | 60 | Điểm đẹp được đủ 20 |
| `RANK_SERVED_FULL` | 25 | Khách mỗi ngày được đủ 20 |
| `RANK_LOST_ZERO` | 0,2 | Phần khách bỏ về thì mục này còn 0 |
| `RANK_STAR_AT` | [30, 50, 70, 85] | Điểm cần cho 2, 3, 4, 5 sao |
| `RANK_REWARD` | 200.000 / 400.000 / 700.000 / 1.000.000 | Thưởng khi lên 2, 3, 4, 5 sao |
| `RANK_PRICE_STEP` | 0,05 | Khách trả thêm mỗi sao từ 2 sao |
| `RIVALS` | Cô Ba 48, Ngọc Lan 58, Hoa Sen 66, SPA MỚI 74 | Điểm năm đầu của 4 tiệm cùng phố |
| `RIVAL_YEAR_STEP` | 4 | Mỗi năm họ lên thêm |
| `RIVAL_SCORE_MAX` | 86 | Điểm cao nhất của họ |
| `YEAR_REWARD` | 3.000.000 / 1.000.000 / 500.000 / 0 / 0 | Thưởng Spa của năm theo thứ hạng |
| `TROPHY_BEAUTY` | 8 | Điểm đẹp của cúp vàng |
| `MERIT_BEAUTY` | 5 | Điểm đẹp của bằng khen |
| `OUTFIT_NEED` | 2, 4, 6, 9, 12, 16, 20 | Số huy hiệu mở 7 bộ áo |
| `AWAY_MIN_MS` | 10 phút | Vắng ít nhất bao lâu thì có tiền |
| `AWAY_MAX_HOURS` | 8 | Tính tối đa bao nhiêu giờ |
| `AWAY_DAY_SHARE` | 0,25 | Mỗi giờ vắng bằng phần này của lãi một ngày |
| `AWAY_PROFIT_DAYS` | 3 | Lấy trung bình lãi bao nhiêu ngày |

## 11. Để builder quyết

- Hình vẽ chi tiết: biển hạng, cúp vàng, bằng khen, 8 bộ áo ở hướng ngang và hướng lên, lúc đi. Theo bản phác và cùng nét với đồ sẵn có.
- Nón lá, khăn vấn, vòng hoa ngồi thế nào trên từng kiểu tóc.
- Vị trí từng chữ trong thẻ Hạng tiệm, thẻ chấm tháng, thẻ Spa của năm, tủ áo, thẻ "Áo mới", thẻ "Chủ tiệm về rồi". Ba nút thẻ trong bảng Nhiệm vụ chia lại cho vừa.
- Thẻ chấm tháng là một màn riêng hay nằm trong màn tổng kết, miễn thứ tự như mục 7.3.
- Thứ tự thẻ khi trùng nhau (thẻ "Áo mới", thẻ huy hiệu, thẻ sự kiện buổi sáng, thẻ "Chủ tiệm về rồi"), miễn không cái nào đè mất cái nào.

## 12. Anh thử trên iPhone sau khi lên

- **Lô A:** chơi tới tối ngày 9 (hoặc tối cuối tháng với tiệm cũ). Xem thẻ chấm tháng sau bảng tổng kết, biển cạnh cửa, thẻ Hạng tiệm trong bảng Nhiệm vụ. Lên sao rồi xem giá khách trả hôm sau. Chơi tới ngày 36 xem thẻ Spa của năm.
- **Lô B:** mở Tủ áo ở thẻ Thành tựu và ở thẻ Hồ sơ. Tiệm cũ nhiều huy hiệu thì xem thẻ "Áo mới" lúc mở game. Mặc áo dài có nón lá, đi lại trong tiệm, lên xuống cầu thang.
- **Lô C:** để nhân viên làm hết khách một ngày, sang ngày mới, tắt game hơn 10 phút rồi mở lại. Thử khóa máy rồi mở. Thử một ngày tự làm khách thường để xem lời nhắc.
