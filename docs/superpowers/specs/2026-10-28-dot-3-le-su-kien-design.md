# Đợt 3, phần 2: lễ theo tháng và sự kiện ngẫu nhiên

- Ngày: 2026-10-28
- Trạng thái: chờ anh duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 6 (Đợt 3). Đi sau phần 1 `2026-10-28-dot-3-nhiem-vu-design.md` (lịch tháng, nhiệm vụ, huy hiệu), đã lên mạng.
- Bản phác bấm thử: https://claude.ai/artifact/Mv6UqNrH4C1EQ4ynKeqdzN

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự điền, anh sửa được. Ở phần này anh giao em tự quyết hết ("em tự quyết hết", 2026-10-28), nên gần như mọi điểm là (em đề xuất).
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Nội dung phần 2** lấy từ spec phần 1: lễ theo tháng (Tết, Valentine, 8/3, Trung thu, 20/10, Noel) và sự kiện ngẫu nhiên (thanh tra vệ sinh, KOL ghé review, đối thủ mở sát bên, mất điện). **(anh chọn ở phần 1)**
- **Sự kiện xấu có trừ tiền không:** em hỏi, anh giao em quyết. Em chọn **không trừ tiền**: làm tốt có thưởng, làm chưa tốt thì thôi. **(em đề xuất)**
- **Trước khi làm, em xem 5 game mã nguồn mở** (OpenRCT2, CorsixTH, OpenTTD, Veloren, SuperTuxKart) để so ý tưởng. Mục 6 ghi em lấy gì.
- **Chia ba lô, làm lần lượt:** **(em đề xuất)**
  - **Lô A, save v17:** lịch lễ, khách và món lễ, dây cờ, nhiệm vụ lễ, 6 quà lưu niệm, dòng việc hôm nay.
  - **Lô B, save v18:** bộ lên lịch sự kiện và báo trước, KOL ghé review, thanh tra vệ sinh.
  - **Lô C, không đổi save:** đối thủ mở sát bên, cúp điện.
- **Anh duyệt tài liệu này một lần cho cả ba lô.** **(giữ cách của Đợt 2 và phần 1)**
  - Sau đó em làm liền một mạch.
  - Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh.
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Lịch:** `src/sim/calendar.ts` có `monthOf`, `dayOfMonth`, `monthStart`, `daysLeftInMonth`. 3 ngày một tháng, 12 tháng một năm (`DAYS_PER_MONTH`, `MONTHS_PER_YEAR`). Thanh trên cùng ghi "Ngày 37 · Tháng 1 · 08:06".
- **Nhiệm vụ mở từ ngày 8** (`UNLOCK_DAY.quests`). Mỗi tháng một nhiệm vụ tháng, bốc ở `startDay` bằng `rollMonth` (`src/sim/quests.ts`).
  - `Quest` có `kind`, `period`, `service`, `target`, `reward`, `base`, `state`. Kiểu `service` hiện chỉ dùng cho nhiệm vụ ngày.
  - Sang tháng mới, `SpaScene` báo toast "Tháng {month}: có nhiệm vụ tháng mới" (`monthStarted`).
- **Khách tới:** đầu `SpaSim.step`, ngay sau khi đồng hồ chạy, khoảng cách giữa hai khách = `arrivalIntervalMs(rating) × dayEase.arrival × beautyArrivalFactor × serviceArrivalFactor`, rồi `arrivalGapMs` rắc ngẫu nhiên.
- **Kiên nhẫn:** `spawnCustomer` đặt `PATIENCE_MS × dayEase.patience × lời chào × KINDS[kind].patience × thẻ thành viên`. Khách VIP có `VIP_PATIENCE` riêng. Lúc chờ, `updateCustomer` trừ dần `patienceMs`, hết thì `loseCustomer`.
- **Kiểu khách và món:** `drawKind` bốc kiểu theo `weight` (khó tính `picky` weight 2, có từ ngày 3). `drawService` bốc món: 70% (`PREFERRED_SERVICE_CHANCE`) là món kiểu khách thích, còn lại bất kỳ món tiệm có.
- **Khách VIP** (`src/sim/vips.ts`): `planBooking` hẹn trước một ngày, lúc hết ngày, bằng dòng ngẫu nhiên riêng `createRng(day * 7919 + nextId)`.
  - Bảng tổng kết ghi dòng hẹn (`summaryNotes` trong `src/view/vip.ts`).
  - Đồng hồ có sao vàng từ `VIP_WARN_MIN` phút trước giờ hẹn.
  - Khách VIP tới đúng phút hẹn (`dueVip`), cộng thêm vào khách thường.
- **Quà trang trí:** món `giftOnly` trong `ITEMS` (`src/sim/items.ts`), ví dụ ảnh ký tên khách VIP. Quà được đẩy vào `book.gifts`, chờ trong Xây dựng để anh đặt miễn phí. Ảnh là đồ 1×1 đứng trên sàn, hình cao 1,7–1,9 ô (`src/art/furniture.ts`).
- **Điểm đẹp:** `sim.beauty()`. Tiệm mặc định 21 điểm (`BEAUTY_BASE`).
- **Kho:** `sim.lowStock()` liệt kê món kho còn từ `LOW_STOCK` (5) trở xuống mà một dịch vụ đang mở cần dùng.
- **Tiền tip:** `tipFor(price, stars)`, theo `TIP_RATE`.
- **Thẻ vàng dưới thanh trên cùng:** phần 1 làm cho huy hiệu mới (`showBadge`, `badgeQueue`, `pumpBadges` trong `SpaScene`). Thẻ chờ khi bảng tổng kết, thẻ tạm dừng hay mini-game đang phủ tiệm, và chờ băng sáng (`hud.lastBannerAt + BANNER_MS`).
- **Toast** nằm giữa màn hình, ở y = 1690 (`Hud.toast`), ngay trên các nút tầng (y = 1855). Cái mới thay cái cũ. Nhiều toast buổi sáng thì `SpaScene` xếp cách nhau `LATE_TOAST_MS`.
- **Mục tiêu nhiệm vụ** tính từ 3 ngày gần nhất đã xong (`QUEST_RECENT_DAYS`), ghi ở `recordDay` lúc hết ngày.
- **Trả thưởng nhiệm vụ** ở `SpaSim.payQuests` (cộng tiền, phát `questDone`, `SpaScene` báo toast "Xong nhiệm vụ"). `settle` trong `quests.ts` chỉ đánh dấu xong.
- **Khách đang ở tiệm được lưu nguyên** trong ô lưu (`customers`), nên mọi cờ mới trên khách phải lưu và sửa theo.
- **Bẫy cũ còn nguyên:**
  - `SpaSim.fromSave` phát lại `dayEnded` nếu ô lưu được ghi sau khi hết ngày.
  - Mọi lần bốc mới phải dùng dòng ngẫu nhiên riêng, để các lần bốc của tiệm không lệch.
  - `tests/sim/same-draws.test.ts` chơi lại 10 ngày và so với `tests/fixtures/run-before-quests.json`.
- **Save v16.**

## 3. Mục tiêu

- **Mỗi tháng trong game có màu riêng:** cứ vài ngày chơi lại gặp một dịp lễ, tiệm trang trí khác, khách đông hơn, có quà để sưu tập.
- **Thỉnh thoảng có chuyện bất ngờ nhỏ** để ngày chơi không giống hệt nhau, nhưng luôn được báo trước và không bao giờ làm mất tiền.
- **Đẩy chủ tiệm tự tay làm:** KOL và đối thủ thưởng cho khách 3 sao.

## 4. Chưa làm ở phần này

- Nhạc riêng cho từng lễ. Dùng âm thanh sẵn có.
- Quần áo lễ cho chủ tiệm: để phần 4 (trang phục).
- Khách mặc đồ lễ, hình khách riêng cho từng lễ.
- Sự kiện chọn lựa (bấm "nhận" hay "từ chối"). Sự kiện nào cũng tự chạy, người chơi chỉ cần chơi như thường.
- Ngày lễ theo lịch ngoài đời.

## 5. Điều cấm (dính là coi như hỏng)

- **Không sự kiện nào trừ tiền, trừ sao tiệm, hay làm mất đồ.** Kể cả gián tiếp: ngày nào có thêm khách thì khách chờ được lâu hơn, ngày có đối thủ thì khách khó tính chấm sao như khách thường (mục 8.5).
- **Không sự kiện nào xảy ra mà không báo trước** ít nhất từ bảng tổng kết hôm trước. Cúp điện còn nhắc thêm 1 tiếng trước giờ cúp.
- **Mở lại game không được bốc lại:** lễ là hàm của ngày; sự kiện ngày mai đã lên lịch thì nằm trong ô lưu. Tải lại ô lưu giữa ngày không đổi sự kiện, giờ hẹn hay thử thách.
- **Không có hai sự kiện trong một ngày,** không có sự kiện trong tháng lễ, không có sự kiện vào ngày khách VIP hẹn.
- **Thưởng chỉ trả một lần:** tải lại ô lưu, hay `fromSave` phát lại `dayEnded`, không được trả lại thưởng nhiệm vụ lễ, thanh tra hay đối thủ, và không được tặng quà lưu niệm hai lần.
- **Chữ và số trên màn hình không được tràn, đè lên nhau** ở màn iPhone.

## 6. Các cách đã cân nhắc

Anh giao em chọn. Em cân nhắc ba cách:

- **A. Luật nằm trong `SpaSim`, lịch sự kiện lưu trong ô lưu.** **(em chọn)**
  - Lễ là hàm thuần của ngày. Sự kiện ngày mai được bốc lúc hết ngày, bằng dòng ngẫu nhiên riêng, như hẹn khách VIP.
  - Hiệu ứng là các hệ số nhân thêm vào công thức sẵn có (khách tới, kiên nhẫn, tip, bốc kiểu khách, bốc món).
  - Lợi: test được bằng Vitest không cần Phaser; tải lại không bốc lại; dùng lại đúng chỗ phần 1 đã gắn (`startDay`, hết ngày, bảng tổng kết).
  - Giá: save đổi hai lần (v17, v18).
- **B. Lễ chỉ là trang trí ở phần hình, sự kiện bốc mỗi sáng.** Bỏ: không báo trước được từ hôm trước, tải lại giữa ngày có thể bốc ra sự kiện khác, và luật nằm ở phần hình thì dính bẫy `dayEnded` phát lại.
- **C. Sự kiện như một thẻ chọn ("nhận khách KOL?", "trả tiền sửa điện?").** Bỏ: thêm một bước bấm cho trẻ con, và dễ thành "chọn sai thì mất tiền", trái với điều cấm.

Ý tưởng lấy từ game mã nguồn mở (em chỉ lấy ý, không chép mã):
- **OpenRCT2:** giải thưởng và tai tiếng là hệ số nhân tạm thời vào lượng khách (±25%), có hạn ngày. → "Đang hot" và khách đông dịp lễ là hệ số 0,8 lên khoảng cách giữa hai khách.
- **CorsixTH:** chỉ một sự kiện một lúc, bật theo tiến độ của bệnh viện, báo trước bằng thư. → một sự kiện một ngày, từ ngày 10, báo trên bảng tổng kết.
- **OpenTTD:** sự kiện bốc bằng dòng ngẫu nhiên lưu trong ô lưu, có ngày kế tiếp và khoảng cách tối thiểu. → `nextDay`, `EVENT_GAP_DAYS`, không lặp sự kiện vừa xảy ra.
- **Veloren, SuperTuxKart:** lễ là một nhãn lọc nội dung (đồ trang trí, nhạc, quà) theo ngày. → `festivalOf(day)` chọn dây cờ, món lễ và quà.
- **Bài học chung:** thưởng tốt hơn phạt; trạng thái xấu kéo dài làm người chơi bỏ game. → không trừ tiền, cúp điện chỉ 2 tiếng.

## 7. Người chơi thấy gì

### 7.1 Lễ theo tháng (lô A)

- **Sáu lễ, mỗi lễ là cả tháng đó (3 ngày chơi):** **(em đề xuất)**

  | Tháng | Lễ | Bảng chữ | Món lễ | Quà lưu niệm |
  |---|---|---|---|---|
  | 1 | Tết | Chúc mừng năm mới | Gội đầu | Cành mai |
  | 2 | Valentine | Valentine ngọt ngào | Đắp mặt nạ | Khung tim |
  | 3 | 8/3 | Mừng ngày 8/3 | Massage | Bình hoa hồng |
  | 8 | Trung thu | Vui Tết Trung thu | Xông lá | Đèn ông sao |
  | 10 | 20/10 | Mừng ngày 20/10 | Tắm bùn | Lẵng hoa |
  | 12 | Noel | Giáng sinh an lành | Đá nóng | Cây thông |

- **Lễ có từ ngày 8,** cùng lúc với Nhiệm vụ. Năm đầu: 8/3 ngày 8–9, Trung thu 22–24, 20/10 28–30, Noel 34–36, Tết năm 2 ngày 37–39. Tết năm đầu (ngày 1–3) và Valentine năm đầu (4–6) rơi vào lúc đang học chơi nên bỏ qua.
- **Thanh trên cùng ghi thêm tên lễ:** "Ngày 37 · Tháng 1 · Tết · 08:06".
- **Sáng ngày đầu của lễ:** thẻ vàng (cùng kiểu thẻ huy hiệu mới) "Tết tới rồi!", dòng nhỏ "Tháng 1 · cả tháng là dịp Tết", một câu: khách đông hơn, nửa số khách gọi món lễ, giá lễ cao hơn 20%.
  - Tiệm chưa có món lễ thì câu ghi rõ: "Tiệm chưa có Đá nóng nên khách gọi Xông lá."
- **Trang trí tự động trong cả tháng lễ:**
  - Dây cờ đuôi nheo hai màu của lễ chạy ngang tường trên cùng, ở mọi tầng có tường.
  - Bảng chữ của lễ treo giữa dây cờ, ở tầng 1, trên chỗ giường thứ ba và thứ tư.
  - Hết tháng thì tự gỡ.
  - Đây là hình, không phải đồ trong Xây dựng: không chiếm ô, không cộng điểm đẹp.
- **Khách trong tháng lễ:**
  - Tới đông hơn khoảng 1/4.
  - Chờ được lâu hơn 20%, để đông hơn mà không bỏ về nhiều hơn.
  - Ngày lễ không tính vào "mấy ngày gần đây" dùng để đặt mục tiêu nhiệm vụ, để tháng sau mục tiêu không bị đẩy lên vì mấy ngày đông khách.
  - Nửa số khách mới gọi món lễ. Khách quen vẫn gọi món họ thích; khách VIP vẫn như cũ.
- **Giá lễ:** món lễ đắt hơn 20% trong tháng lễ, với mọi khách trừ khách VIP. Bảng Dịch vụ ghi nhãn nhỏ "Món lễ +20%" cạnh món đó.
- **Món lễ khi tiệm chưa có món của lễ:** lấy món gần nhất rẻ hơn mà tiệm có, theo thứ tự gội đầu, mặt nạ, massage, xông lá, đá nóng, tắm bùn. Gội đầu luôn có nên luôn tìm được.
- **Món lễ chốt một lần cho cả tháng:** là món ghi trên nhiệm vụ lễ (mục 7.2). Giữa tháng anh mở món của lễ thì tháng sau mới đổi, để nhiệm vụ và khách luôn khớp nhau.

### 7.2 Nhiệm vụ lễ và quà lưu niệm (lô A)

- **Tháng lễ thì nhiệm vụ tháng là nhiệm vụ lễ:** "Nhiệm vụ lễ: làm 12 lượt Gội đầu". **(em đề xuất)**
  - Mục tiêu bằng nửa mục tiêu "Phục vụ N khách trong tháng" của tiệm cho cùng số ngày, vì nửa số khách gọi món lễ.
  - Tiền thưởng bằng nhiệm vụ tháng thường.
  - Đếm mọi lượt món lễ trong tháng, ai làm cũng được.
- **Hàng nhiệm vụ lễ trong bảng Nhiệm vụ:**
  - Tiêu đề tháng ghi "Tháng 1 · dịp Tết".
  - Vòng tròn màu của lễ với biểu tượng của lễ.
  - Thêm một dòng dưới thanh tiến độ: biểu tượng hộp quà và "Quà lưu niệm: Cành mai". Đã có quà đó từ năm trước thì ghi "Đã có Cành mai · lần này chỉ tiền".
- **Xong nhiệm vụ lễ:**
  - Cộng tiền như nhiệm vụ tháng.
  - Lần đầu: tặng món quà lưu niệm của lễ. Quà vào Xây dựng, chờ anh đặt, như ảnh ký tên của khách VIP.
  - Thẻ vàng: "Xong nhiệm vụ lễ · +300.000 đ", "Quà lưu niệm: Cành mai", "Đã cất vào Xây dựng, đặt đâu tùy anh."
  - Đã có quà đó: chỉ cộng tiền, thẻ vàng ghi "Đã có Cành mai từ trước".
- **Không xong thì thôi.** Sáng ngày đầu tháng sau, toast tháng mới đổi thành "Hết dịp Tết · Cành mai chờ dịp Tết năm sau".
- **Sáu quà lưu niệm là đồ trang trí 1×1, chỉ có từ dịp lễ, mỗi món 5 điểm đẹp,** hình đứng trên sàn như ảnh ký tên. Hình theo bản phác: cành mai trong chậu đỏ, khung tim trên giá, bình hoa hồng, đèn ông sao, lẵng hoa, cây thông có sao.

### 7.3 Dòng việc hôm nay (lô A dựng, lô B và C dùng thêm)

- **Một dòng nhỏ ở chỗ toast** (giữa màn, y = 1690, trên các nút tầng): vòng tròn biểu tượng và một câu ngắn.
- **Toast hiện thì dòng tạm ẩn,** toast tắt thì dòng hiện lại. Bảng nào phủ tiệm thì dòng ẩn theo.
- **Câu theo việc trong ngày, ưu tiên từ trên xuống:**
  - Cúp điện: "Cúp điện 14:00 – 16:00", lúc đang cúp "Đang cúp điện · có lại lúc 16:00".
  - Thanh tra: "Thanh tra ghé lúc 15:00", xong thì tắt.
  - KOL: "KOL Mi Mi hẹn 14:30", tới thì "Mi Mi đang ở tiệm", về thì tắt.
  - Đối thủ: "Giữ khách · 2/5 khách 3 sao", đủ thì "Đã giữ được khách".
  - Lễ: "Dịp Tết · Gội đầu 3/12", xong thì "Dịp Tết · đã xong nhiệm vụ lễ".
  - Đang hot: "Đang hot · còn 2 ngày", ngày cuối "Đang hot · còn hôm nay".
- Không có gì thì không có dòng.

### 7.4 Lịch sự kiện và báo trước (lô B)

- **Sự kiện từ ngày 10, chỉ trong tháng không có lễ** (tháng 4, 5, 6, 7, 9, 11).
- **Mỗi lần cách nhau 2–4 ngày,** không lặp sự kiện vừa xảy ra, không rơi vào ngày khách VIP hẹn. Năm đầu gặp khoảng 5 lần.
- **Báo trước:**
  - Bảng tổng kết hôm trước có dòng "Ngày mai: ..." (cùng chỗ và kiểu với dòng hẹn khách VIP).
  - Sáng ra có thẻ vàng nhắc lại, với biểu tượng của sự kiện.
  - Cả ngày có dòng việc hôm nay (mục 7.3).
- **Cúp điện chỉ xảy ra ở tiệm đã mở xông lá, đá nóng hoặc tắm bùn.**

### 7.5 KOL ghé review (lô B)

- **Báo:** "Ngày mai: KOL Mi Mi ghé review lúc 14:30 · được 3 sao thì 2 ngày sau khách đông hơn."
- **Giờ hẹn:** một nửa giờ từ 10:00 tới 17:00, như khách VIP. Đồng hồ có sao vàng từ 1 tiếng trước.
- **Mi Mi** là một khách có hình riêng (áo hồng, điện thoại trên tay, sao vàng trên đầu lúc mới vào), gọi một món tiệm có, trả giá thường. Ai làm cũng được, chủ tiệm tự làm thì dễ 3 sao hơn.
- **Được 3 sao:** toast "Mi Mi khen hết lời". Sáng hôm sau thẻ vàng "Video của Mi Mi lên sóng · Tiệm đang hot!": hôm đó và hôm sau nữa khách tới đông hơn khoảng 1/4 và chờ được lâu hơn 20%, như tháng lễ. Hai ngày này cũng không tính vào mấy ngày gần đây dùng để đặt mục tiêu nhiệm vụ.
- **Dưới 3 sao hoặc bỏ về:** toast "Mi Mi về rồi, không đăng bài". Không mất gì.
- **Đánh giá của Mi Mi không tính vào sao tiệm,** dù tốt hay xấu.
- **Đang hot không cộng dồn với tháng lễ:** trùng thì chỉ tính một lần.

### 7.6 Thanh tra vệ sinh (lô B)

- **Báo:** "Ngày mai: Thanh tra vệ sinh ghé khoảng 15:00 · xem kho, khách bỏ về và độ gọn đẹp."
- **15:00:** thanh tra đứng ở cửa, tiệm tạm dừng, hiện thẻ "Thanh tra vệ sinh" với ba việc, dấu tích hiện lần lượt:
  1. **Kho đủ hàng:** không món kho nào sắp hết (`lowStock()` rỗng).
  2. **Không ai bỏ về:** từ sáng tới giờ chưa khách nào bỏ về.
  3. **Tiệm gọn đẹp:** điểm đẹp từ 30.
- **Đạt cả ba:** "Đạt! +{tiền}", tiền bằng hai lần thưởng một nhiệm vụ ngày của tiệm. Lần đạt đầu tiên tặng thêm món trang trí "Giấy khen" (1×1, 4 điểm đẹp, vào Xây dựng như quà).
- **Chưa đạt:** "Chưa đạt · không bị phạt" và một câu nhắc đúng việc hỏng, ví dụ "Lần sau nhớ nhập thêm hàng trước giờ hẹn nhé".
- **Bấm "Xong"** thì tiệm chạy tiếp, thanh tra đi.

### 7.7 Đối thủ mở sát bên (lô C)

- **Báo:** "Ngày mai: Spa Mới khai trương sát bên · khách khó tính ghé nhiều gấp đôi. Làm 5 khách 3 sao là giữ được khách."
- **Cả ngày:** khách khó tính tới nhiều gấp đôi. Tổng số khách không ít đi. Hôm nay khách khó tính chấm sao như khách thường, để tiệm không tụt sao vì đối thủ.
- **Ngoài vỉa hè tầng 1** có bảng "SPA MỚI · Khai trương hôm nay" và hai quả bóng bay.
- **Thử thách:** đủ số khách 3 sao trong ngày (ai làm cũng được, khách kiểu nào cũng được). Số này tính theo tiệm, ít nhất 4.
- **Đủ:** thẻ vàng "Khách vẫn chọn tiệm mình!", thưởng bằng hai lần thưởng một nhiệm vụ ngày.
- **Không đủ:** không sao. Hết ngày thì bảng Spa Mới biến mất.

### 7.8 Cúp điện (lô C)

- **Báo:** "Ngày mai: Cúp điện 14:00 – 16:00 · máy nghỉ 2 tiếng."
- **13:00:** toast "1 tiếng nữa cúp điện · máy xông lá sẽ nghỉ" (ghi các món máy tiệm có).
- **14:00 tới 16:00:**
  - Phòng tối lại, có mấy ánh nến; máy (lều xông, giường đá nóng, bồn bùn) có dấu tắt điện.
  - Máy không nhận khách mới. Ai đang làm trên máy thì làm cho xong.
  - Khách mới tới chỉ gọi món làm tay (gội đầu, mặt nạ, massage).
  - Khách đang chờ không mất kiên nhẫn, ai cũng vậy.
  - Chủ tiệm bấm vào khách chờ món máy thì toast "Đang cúp điện, chờ có điện nhé".
  - Khách làm xong trong lúc cúp điện tip gấp rưỡi ("khách thông cảm").
- **16:00:** đèn sáng lại, toast "Có điện lại rồi".

### 7.9 Âm thanh

- Thẻ vàng đầu lễ, xong nhiệm vụ lễ, thanh tra đạt, giữ được khách: tiếng `levelUp` như huy hiệu mới.
- Thẻ vàng báo sự kiện buổi sáng và các toast: không thêm tiếng mới.

## 8. Luật trong code

### 8.1 Lễ (lô A)

- `festivalOf(day): FestivalId | null` trong module mới `src/sim/festivals.ts`. Trả lễ của `monthOf(day)` nếu `day >= FESTIVAL_FROM_DAY` và tháng đó có lễ.
- Bảng `FESTIVALS`: tháng, màu, biểu tượng, món lễ, món quà (`ItemKind`), khóa chữ. Đây là nơi duy nhất ghi bảng ở mục 7.1.
- `festivalService(id, open)`: món của lễ nếu tiệm mở, không thì lùi dần theo thứ tự `SERVICE_IDS` tới món tiệm có.
- **Sự kiện phát ra:** `startDay` phát `festivalStarted` khi `festivalOf(day)` khác null và khác `festivalOf(day - 1)`.

### 8.2 Hệ số khách (lô A, lô B thêm "đang hot")

- Một hệ số mới `eventArrivalFactor` nhân vào khoảng cách giữa hai khách, cạnh `beautyArrivalFactor`.
  - Bằng `FESTIVAL_ARRIVAL` (0,8) trong tháng lễ, `HOT_ARRIVAL` (0,8) trong ngày đang hot, 1 nếu không.
  - Trùng thì lấy số nhỏ hơn, không nhân hai lần.
- Kiên nhẫn của khách thường mới vào nhân thêm `FESTIVAL_PATIENCE` (1,2) trong tháng lễ và trong ngày đang hot (một lần, không nhân hai). Khách VIP và Mi Mi không đổi.
- **Sổ ngày gần đây:** `recordDay` không thêm ngày lễ hay ngày đang hot vào `progress.recent`. Các số đời (`life`: ngày đông nhất, lãi lớn nhất, ngày vẹn) vẫn ghi như cũ, để huy hiệu vẫn tính.
- **Bốc món:** trong tháng lễ, khách thường (không phải khách quen, VIP hay Mi Mi) có `FESTIVAL_SERVICE_CHANCE` (0,5) gọi món lễ; còn lại bốc như cũ (`drawService`).
  - Lần bốc món lễ dùng chính dòng ngẫu nhiên của tiệm. Ngày 1–7 chuỗi bốc không đổi; từ tháng lễ đầu tiên thì đổi, vì có thêm khách (mục 8.6).
- **Giá lễ:** `payFor` nhân giá món lễ với `FESTIVAL_PRICE` (1,2) trong tháng lễ, trừ khách VIP. Tip tính trên giá đã nhân.

### 8.3 Nhiệm vụ lễ và quà (lô A)

- `rollMonth` trong tháng lễ ra nhiệm vụ lễ:
  - `kind: 'service'`, `period: 'month'`, `service` = `festivalService` lúc bốc.
  - `target = max(1, round(FESTIVAL_QUEST_SHARE × target của nhiệm vụ 'serve' tháng cho cùng daysLeft))`.
  - `reward` bằng nhiệm vụ tháng thường.
  - Trường mới `festival: FestivalId | null` trên `Quest` (null cho mọi nhiệm vụ khác).
- **Món lễ của tháng** đọc từ `progress.monthly.service` khi nhiệm vụ tháng là nhiệm vụ lễ; ngoài ra mới tính bằng `festivalService`.
- **Xong:** `settle` đánh dấu như mọi nhiệm vụ, `SpaSim.payQuests` trả tiền như cũ. Thêm trong `payQuests`, cho nhiệm vụ có `festival`:
  - nếu `festival.keepsakes` chưa có quà của lễ: đẩy món quà vào `book.gifts` và ghi vào `festival.keepsakes`;
  - phát `festivalQuestDone` (có lễ và có quà mới hay không) thay cho `questDone`, để `SpaScene` cho thẻ vàng vào cùng hàng đợi thẻ huy hiệu mà không báo thêm toast "Xong nhiệm vụ".
- **Toast sang tháng:** nếu nhiệm vụ tháng vừa hết là nhiệm vụ lễ chưa xong, `monthStarted` mang thêm lễ đó, và `SpaScene` dùng câu "Hết dịp {lễ} · {quà} chờ dịp {lễ} năm sau".
- **Đồ mới trong `ITEMS`:** 6 quà lưu niệm (`giftOnly`, 1×1, 5 điểm đẹp) và `certificate` cho lô B (`giftOnly`, 1×1, 4 điểm đẹp), hình trong `src/art/furniture.ts`.

### 8.4 Lên lịch sự kiện (lô B)

- Module mới `src/sim/events.ts`. Trạng thái `EventBook`, lưu trong ô lưu:
  - `nextDay`: ngày sớm nhất có thể có sự kiện;
  - `last`: sự kiện gần nhất, hoặc null;
  - `plan`: `{ kind, day, minute }` của sự kiện đã báo, hoặc null;
  - `hotUntil`: ngày cuối của "đang hot", 0 nếu không;
  - `count`: bộ đếm của thử thách hôm nay (số khách 3 sao khi có đối thủ);
  - `inspected`: thanh tra hôm nay đã xem chưa;
  - `certGiven`: đã tặng Giấy khen chưa.
- **Lúc hết ngày,** ngay sau `planBooking`: `planEvent(book, day, shop, createRng(day * 6151 + nextId))`, cho ngày mai `d = day + 1`. Chỉ lên lịch khi đủ cả:
  - `d >= EVENT_FROM_DAY`;
  - `festivalOf(d) === null`;
  - `d >= nextDay`;
  - khách VIP không hẹn ngày `d`;
  - có ít nhất một sự kiện hợp lệ khác `last`.
- **Sự kiện hợp lệ:** KOL, thanh tra, đối thủ luôn hợp lệ; cúp điện cần tiệm đã mở xông lá, đá nóng hoặc tắm bùn. Ở lô B chỉ có KOL và thanh tra; lô C thêm hai cái sau.
- **Bốc:** đều nhau trong các sự kiện hợp lệ. Giờ KOL bốc như giờ khách VIP; thanh tra `INSPECT_MIN`; cúp điện `POWER_FROM_MIN`; đối thủ không có giờ.
- **Sau khi bốc:** `nextDay = d + gap`, `gap` bốc trong `EVENT_GAP_DAYS` (2–4); `last = kind`.
- **`startDay`:** bỏ `plan` của ngày đã qua; đặt lại `count` và `inspected`. Nếu hôm nay có `plan`, phát `eventToday` để `SpaScene` cho thẻ vàng buổi sáng.
- **Bảng tổng kết:** `summaryNotes` thêm dòng "Ngày mai: ..." khi `plan.day === sim.day + 1`.

### 8.5 Từng sự kiện

- **KOL (lô B):**
  - Tới đúng phút hẹn, như `dueVip`, cộng thêm vào khách thường.
  - Khách có cờ `kol`, kiểu `office`, hình riêng, bốc món bằng `drawService`.
  - Lúc tính sao: không thêm đánh giá; 3 sao thì `hotUntil = day + HOT_DAYS` và phát `kolPosted`; còn lại phát `kolLeft`.
  - Bỏ về cũng không thêm đánh giá xấu.
- **Thanh tra (lô B):**
  - Trong `step`, lần đầu `clock.minutes >= INSPECT_MIN` và chưa `inspected`: chấm ba việc, phát `inspected` với kết quả từng việc và tiền thưởng.
  - Đạt thì cộng tiền ngay trong sim. Lần đạt đầu, đẩy `certificate` vào `book.gifts` và đặt `certGiven`.
  - `SpaScene` mở thẻ thanh tra (một scene phủ tiệm như `PauseScene`). Tiệm dừng bằng cờ `paused` sẵn có cho tới khi bấm "Xong".
- **Đối thủ (lô C):**
  - `drawKind` nhân `weight` của `picky` với `RIVAL_PICKY_FACTOR` trong ngày có đối thủ.
  - Đánh giá của khách khó tính hôm đó dùng cách chấm `normal` thay cho `harsh`. Tip giữ như cũ.
  - Mỗi lượt 3 sao cộng `count`. Lần đầu tới mục tiêu thì cộng thưởng và phát `rivalBeaten`.
  - Mục tiêu = `max(RIVAL_TARGET_MIN, round(RIVAL_TARGET_SHARE × avg.served))`, tính lúc `startDay`, giữ cả ngày.
- **Cúp điện (lô C):**
  - `powerOut()` đúng khi hôm nay có cúp điện và `POWER_FROM_MIN <= clock.minutes < POWER_TO_MIN`.
  - Khi `powerOut()`: không bắt đầu dịch vụ máy mới (`steam`, `stone`, `mud`) cho chủ tiệm lẫn thợ; khách mới bốc món trong các món làm tay tiệm có; không trừ `patienceMs` của khách đang chờ; tip của dịch vụ xong lúc này nhân `POWER_TIP_FACTOR`.
  - Phát `powerWarn` lúc `POWER_FROM_MIN - POWER_WARN_MIN`, `powerOff`, `powerOn`, mỗi cái một lần trong ngày.
- **Tiền thưởng sự kiện** = `EVENT_REWARD_FACTOR × baseReward(averageDay(progress.recent))`, cộng vào `stats.quests` để hiện ở dòng thưởng của bảng tổng kết.

### 8.6 Save và tiệm cũ

- **v17 (lô A):** thêm `festival: { keepsakes: FestivalId[] }` và trường `festival` trên `Quest`.
  - `repairFestival` sửa danh sách: chỉ giữ id hợp lệ, bỏ trùng.
  - `repairQuests` đặt `festival: null` cho nhiệm vụ cũ.
  - Ô lưu cũ đang giữa tháng lễ thì nhiệm vụ tháng cũ giữ nguyên tới hết tháng; tháng lễ sau mới có nhiệm vụ lễ. Dây cờ, khách đông và giá lễ vẫn có ngay.
- **v18 (lô B):** thêm `events: EventBook`, và cờ `kol: boolean` trên mỗi khách đang ở tiệm.
  - Ô lưu cũ: `nextDay = max(day + 1, EVENT_FROM_DAY)`, mọi thứ khác rỗng; khách cũ `kol: false`.
  - `repairEvents` sửa từng trường; `plan` có `kind` lạ thì bỏ.
  - Tải lại lúc Mi Mi đang ở tiệm thì cô vẫn là Mi Mi: đánh giá không tính, 3 sao vẫn ra đang hot.
- **Lô C** dùng `count` có sẵn từ v18 nên không đổi save. `parseVersioned` nhận v16 và v17.
- Mỗi đời save có bản lưu mẫu đông cứng trong `tests/fixtures`.
- **Test chơi lại 10 ngày** (`same-draws.test.ts`): tháng lễ thêm khách và thêm lần bốc trên dòng ngẫu nhiên của tiệm, nên từ ngày 8 chuỗi bốc khác đi là đúng. Lô A rút test còn 7 ngày (trước lễ đầu tiên), ghi rõ lý do trong test, giữ nguyên bản ghi cũ. **(em quyết)**

## 9. Ba lô

### Lô A: lễ theo tháng (save v17)

- `festivals.ts`, `festivalOf`, `festivalService`, `FESTIVALS`.
- Hệ số khách, kiên nhẫn, bốc món lễ, giá lễ.
- Nhiệm vụ lễ, 6 quà lưu niệm (hình), thẻ vàng đầu lễ và khi xong nhiệm vụ lễ, toast hết lễ.
- Dây cờ và bảng chữ trong phòng; tên lễ trên thanh trên cùng; nhãn "Món lễ +20%" trong Dịch vụ.
- Dòng việc hôm nay (chỉ có câu của lễ).
- Save v17.

### Lô B: KOL và thanh tra (save v18)

- `events.ts`, `planEvent`, `EventBook`, dòng "Ngày mai" trên bảng tổng kết, thẻ vàng buổi sáng.
- KOL: khách Mi Mi, sao vàng ở đồng hồ, "đang hot".
- Thanh tra: chấm ba việc, thẻ thanh tra, Giấy khen (hình).
- Dòng việc hôm nay thêm câu của KOL, đang hot, thanh tra.
- Save v18.

### Lô C: đối thủ và cúp điện (không đổi save)

- Đối thủ: bốc kiểu khách, thử thách, bảng Spa Mới ngoài vỉa hè.
- Cúp điện: phòng tối, máy nghỉ, kiên nhẫn đứng yên, tip gấp rưỡi, ba toast.
- Dòng việc hôm nay thêm câu của hai sự kiện này.

## 10. Số khởi đầu (`src/config.ts`)

| Tên | Số | Nghĩa |
|---|---|---|
| `FESTIVAL_FROM_DAY` | 8 | Lễ có từ ngày này (cùng ngày mở Nhiệm vụ) |
| `FESTIVAL_ARRIVAL` | 0,8 | Nhân khoảng cách giữa hai khách trong tháng lễ |
| `FESTIVAL_PATIENCE` | 1,2 | Nhân kiên nhẫn khách thường trong tháng lễ |
| `FESTIVAL_SERVICE_CHANCE` | 0,5 | Phần khách thường gọi món lễ |
| `FESTIVAL_PRICE` | 1,2 | Nhân giá món lễ |
| `FESTIVAL_QUEST_SHARE` | 0,5 | Mục tiêu nhiệm vụ lễ so với "Phục vụ N khách trong tháng" |
| `KEEPSAKE_BEAUTY` | 5 | Điểm đẹp mỗi quà lưu niệm |
| `EVENT_FROM_DAY` | 10 | Sự kiện có từ ngày này |
| `EVENT_GAP_DAYS` | [2, 4] | Từ một sự kiện tới sự kiện sau, ít nhất và nhiều nhất |
| `EVENT_REWARD_FACTOR` | 2 | Thưởng sự kiện so với thưởng một nhiệm vụ ngày |
| `HOT_DAYS` | 2 | Số ngày "đang hot" sau khi Mi Mi được 3 sao |
| `HOT_ARRIVAL` | 0,8 | Nhân khoảng cách giữa hai khách khi đang hot |
| `INSPECT_MIN` | 900 | Thanh tra ghé lúc 15:00 |
| `INSPECT_BEAUTY` | 30 | Điểm đẹp thanh tra cần |
| `CERTIFICATE_BEAUTY` | 4 | Điểm đẹp của Giấy khen |
| `RIVAL_PICKY_FACTOR` | 2 | Nhân `weight` của khách khó tính ngày có đối thủ |
| `RIVAL_TARGET_SHARE` | 0,3 | Mục tiêu 3 sao so với số khách trung bình một ngày |
| `RIVAL_TARGET_MIN` | 4 | Mục tiêu 3 sao ít nhất |
| `POWER_FROM_MIN` / `POWER_TO_MIN` | 840 / 960 | Cúp điện 14:00 tới 16:00 |
| `POWER_WARN_MIN` | 60 | Nhắc trước bao nhiêu phút |
| `POWER_TIP_FACTOR` | 1,5 | Nhân tip lúc cúp điện |

## 11. Để builder quyết

- Hình vẽ chi tiết của dây cờ, bảng chữ, 6 quà, Giấy khen, Mi Mi, thanh tra, bảng Spa Mới, phòng tối và ánh nến. Theo bản phác và cùng nét với đồ sẵn có.
- Thanh tra có đi vào cửa hay chỉ đứng ở cửa; Mi Mi đi như khách thường.
- Vị trí từng chữ trong thẻ vàng, thẻ thanh tra và hàng nhiệm vụ lễ (hàng nhiệm vụ tháng cao thêm một dòng, chữ cuối bảng lùi xuống theo).
- Cách vẽ phòng tối trên các tầng (một lớp màu phủ hay đổi màu từng thứ).
- Thứ tự toast và thẻ vàng buổi sáng khi trùng nhau (tháng mới, lễ, sự kiện, khách VIP, huy hiệu), miễn không cái nào đè mất cái nào.

## 12. Anh thử trên iPhone sau khi lên

- **Lô A:** chơi tới tháng lễ (hoặc dùng tiệm cũ đã qua ngày 8). Xem dây cờ, bảng chữ, tên lễ trên thanh trên cùng, khách đông hơn, nửa số khách gọi món lễ, giá lễ trong Dịch vụ. Làm xong nhiệm vụ lễ, xem quà trong Xây dựng.
- **Lô B:** chờ bảng tổng kết có dòng "Ngày mai". Làm KOL 3 sao, xem hai ngày đang hot. Gặp thanh tra, thử để kho sắp hết xem chưa đạt.
- **Lô C:** gặp đối thủ, làm đủ 3 sao. Gặp cúp điện (cần tiệm có xông lá), xem phòng tối và tip gấp rưỡi.
