# Khách ngôi sao: chín người nổi tiếng thật ghé tiệm

- Ngày: 2026-10-29
- Trạng thái: anh đã duyệt (2026-10-29, "Duyệt, làm đi")
- Thuộc: spec chung `2026-10-25-spa-game-design.md`. Dựng tiếp trên khách VIP của Đợt 2 (`2026-10-27-dot-2-khach-design.md`, mục 7). Đi sau Đợt 4 (save v25, master 86a6a92).
- Bản phác hình (mặt trước, anh đã duyệt): https://claude.ai/artifact/1XPvDk4DaUnpJ1xSDn7bTh. Nguồn vẽ: `docs/art/ngoi-sao-mat-truoc.mjs`.

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự quyết, anh sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Khách ngôi sao là một nhóm khách mới, đứng trên VIP.** Họ là người nổi tiếng thật, dùng tên thật. **(anh chọn)**
- **Ngôi sao có sổ hẹn riêng, chạy song song với sổ VIP**, không gộp vào danh sách VIP. **(anh chọn cách B, mục 6)**
- **Chia hai lô:** **(em đề xuất)**
  - **Lô A, lên một số save:** sổ hẹn ngôi sao, chín ngôi sao vẽ đủ 3 hướng, báo trước, tới tiệm và ngân nga, phục vụ và tính tiền, tiệm hot, chủ tiệm vắng, âm thanh, ảnh có chữ ký và Tường ngôi sao.
  - **Lô B, không đổi save:** trang "Ngôi sao" trong sổ khách.
- **Số save:** lấy số kế tiếp còn trống trên master lúc bắt đầu lô A. Đợt 5 (dịch vụ mới, `2026-10-29-dot-5-dich-vu-moi-design.md`) đang chờ duyệt, và cũng định dùng v26 trở đi. Ai lên trước thì lấy số trước. Lô sau kiểm tra master rồi lấy số kế tiếp. **(em đề xuất)**
- **Anh duyệt tài liệu này một lần cho cả hai lô.** Sau đó em làm liền một mạch. Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh. **(giữ cách của các đợt trước)**
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

### Khách VIP

- **Bốn VIP tên bịa** (`src/sim/vips.ts`, `src/strings/vips.ts`): Mây Chiều (id `singer`), Ngân Sa (`miss`), Bích Câu (`star`), Tám Lửa (`chef`).
  - **Trùng tên:** id `'star'` là Bích Câu. Chữ `star` còn dùng cho texture ngôi sao vàng và tiếng `'star'` (`src/audio/cues.ts`). Vì vậy code của phần này dùng chữ **`idol`**, không dùng `star`.
- **Lịch hẹn:**
  - Cuối ngày, `step()` gọi `planBooking` rồi `planEvent` (`src/sim/spa.ts:1468-1473`). Hai việc này chỉ chạy ở tiệm gốc, mỗi việc bốc từ một dòng ngẫu nhiên riêng.
  - Đủ điều kiện hẹn khi có ít nhất 2 kỹ thuật viên không nghỉ việc và có dịch vụ hợp.
  - Mỗi lần chỉ hẹn cho ngày mai. Giờ hẹn là nửa giờ ngẫu nhiên từ 10:00 tới 17:00. Lần sau cách 2 tới 4 ngày. Vòng đầu đi lần lượt từng người, sau đó chọn ngẫu nhiên.
  - `planEvent` không xếp sự kiện vào ngày có VIP (`src/sim/events.ts:60`).
- **Báo trước:**
  - Bảng tổng kết có dòng hẹn ngày mai (`vipBookingNote`, `src/view/vip.ts`).
  - Buổi sáng có lời nhắc `vipTodayToast` (`src/scenes/SpaScene.ts:896-902`).
  - Trước giờ hẹn 60 phút (`VIP_WARN_MIN`), đồng hồ hiện sao vàng (`clockStar`).
- **Tới tiệm:**
  - `dueVip` dẫn tới `spawnCustomer({ vip })`, kèm sự kiện `vipArrived` (`src/sim/spa.ts:1422-1424, 535-541`).
  - Hết ghế thì VIP đứng cạnh quầy, không bỏ về.
  - Nhân viên không mời VIP (`src/sim/crew.ts:364`). Lúc chủ có mặt thì giữ giường đúng loại cho VIP (`vipHeld`, `crew.ts:367-371`).
  - Kiên nhẫn là `VIP_PATIENCE` 0,7. Mini-game chơi bản khó.
- **Tiền và đánh giá:**
  - Giá gấp 3, không cộng giá lễ. Tip như người nổi tiếng.
  - Mỗi lần ghé tính 3 đánh giá (`VIP_REVIEWS`). Bỏ về thì 3 đánh giá giận.
  - VIP không tính vào `ownerServed`, tip hào phóng hay `noteServed`.
- **Quà:**
  - Lần đầu VIP cho 3 sao, `scoreVip` đẩy ảnh có chữ ký vào `book.gifts`. Đủ 4 ảnh thì đẩy thêm `goldBoard` và đặt `boardGiven`.
  - Quà là món trang trí chỉ nhận được, không mua được (`giftOnly`, `src/sim/items.ts:57-61`). Hình nằm ở `src/art/furniture.ts:497-553`.
- **Chủ tiệm vắng (chuỗi):**
  - Tiệm gốc không giữ giường. VIP tới thì chủ nhận thẻ "Về ngay" (`vipCalls`, `src/sim/chain.ts:144-152, 307, 315`; `vipCallCard`, `src/view/chain.ts`).
  - Thẻ vẽ VIP trên quầng vàng dưới 5 sao (`ChoiceScene`).
- **Sổ khách:**
  - Có các tab `regulars`, `kinds`, `vip` (`src/view/guestBook.ts:58-64`).
  - `TAB_LAYOUT` chỉ có sẵn cách xếp 2 tab và 3 tab (`src/scenes/GuestBookScene.ts:33-37`).
- **Tiệm hot:**
  - Chỉ Mi Mi làm tiệm hot: `eventBook.hotUntil = day + HOT_DAYS` sau khi cô được 3 sao (`spa.ts:640`).
  - `hotStarted` dẫn tới `hotCard`. Chữ của thẻ nói cứng là của Mi Mi (`hotHead`) và "Hôm nay và ngày mai" (`hotLine`).
- **Bong bóng lời nói** (`src/view/SpeechBubble.ts`):
  - Mỗi khách có một bong bóng và một hàng chờ một câu (`say`, `sayNext`).
  - Bong bóng chỉ hiện khi có sự kiện. Chưa có gì hiện lặp lại theo giờ.
- **Lưu game:**
  - Save v25. Danh sách số phiên bản viết cứng ở `src/sim/save.ts:568`.
  - Sổ VIP được sửa từng trường qua `repairVipBook`.
  - Mỗi lần lên số thì đóng băng `tests/fixtures/save-v{cũ}.json`.
- **Test VIP:**
  - Hai bộ chính là `tests/sim/vips.test.ts` và `tests/sim/spa-vips.test.ts`.
  - Ngoài ra có phần VIP trong các bộ test sau:
    - `tests/view/vip.test.ts`, `tests/view/guestBook.test.ts`;
    - `tests/sim/save.test.ts`, `tests/sim/chain.test.ts`, `tests/view/chain.test.ts`;
    - `tests/sim/tutorial.test.ts`, `tests/sim/absent.test.ts`, `tests/sim/spa-staff.test.ts`.

## 3. Mục tiêu

- **Cuối game có thứ để mong:** khi tiệm đã có Bảng vàng, người chơi có thêm chín lịch hẹn đặc biệt để chờ.
- **Fan nhận ra thần tượng ngay:** nhận ra nhờ màu tóc, một món đặc trưng và tên bài hát quen.
- **Phục vụ ngôi sao là chuyện lớn:** trả rất hậu, làm tốt thì tiệm đông khách mấy ngày sau, làm hỏng thì sao tụt rõ.
- **Có bộ sưu tập để gom:** chín ảnh có chữ ký treo trong tiệm, gom đủ thì có Tường ngôi sao.

## 4. Chưa làm ở phần này

- **Lời bài hát.** Anh muốn có. Em không chép lời bài hát thật vì có bản quyền. Thay vào đó, ngôi sao ngân nga tên bài (mục 7.4). **(anh hỏi, em từ chối, em đề xuất thay thế)**
- Nhạc thật hay giọng hát thật của ngôi sao.
- Ngôi sao ghé chi nhánh.
- Fan đứng ngoài cửa (nhân vật mới). Đông khách chỉ thể hiện qua tiệm hot.
- Huy hiệu, nhiệm vụ riêng cho ngôi sao.
- Thêm ngôi sao thứ 10 trở đi. Cách làm để thêm sau dễ dàng: mỗi người là một dòng dữ liệu, một bộ đồ 3 hướng, một ảnh và một bộ câu chữ.
- Đổi gì ở bốn VIP tên bịa.

## 5. Điều cấm (dính là coi như hỏng)

- **Chép lời bài hát, dù một câu.** Chỉ được dùng tên bài.
- **Ngôi sao xuất hiện trước khi tiệm có Bảng vàng.**
- **Tiệm chưa có Bảng vàng chơi khác đi chút nào.** Mọi test cũ còn đạt, `same-draws` giữ nguyên, VIP và sự kiện bốc y như cũ.
- **Phần mới bốc trong dòng ngẫu nhiên của tiệm hay của VIP.** Ngôi sao có dòng riêng.
- **Hai khách chỉ chủ tiệm phục vụ được ở trong tiệm cùng lúc** (một VIP và một ngôi sao). Mục 7.2 nói cách giữ điều này.
- **Trả hai lần hay tặng hai lần:** tải lại ô lưu không tặng lại ảnh, không tặng lại Tường ngôi sao, không kéo dài lại ngày hot.
- **Ngôi sao bỏ về vì hết ghế.**
- **Nhân viên mời ngôi sao.**

## 6. Các cách đã cân nhắc

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| A. Gắn ngôi sao vào hệ thống VIP (thêm cấp "ngôi sao" cho VipId) | Ít code mới, có sẵn mọi thứ VIP đang có | Chung một lịch hẹn với VIP. Code gọi cả hai là "VIP" | Em đề xuất, anh không chọn |
| **B. Sổ hẹn riêng, chạy song song** | Lịch riêng, luật riêng, sau này thêm luật cho ngôi sao dễ. Một ngày có thể có cả VIP lẫn ngôi sao | Phải làm song song ở khoảng 25 file đang chạm tới VIP. Rủi ro lỗi cao hơn | **Anh chọn** |
| C. Biến ngôi sao thành một sự kiện như Mi Mi | Có sẵn tiệm hot | Sự kiện bốc ngẫu nhiên giữa 4 loại, không có sổ, không có ảnh để gom | Loại |
| Tên nhái thay tên thật | Tránh rủi ro quyền hình ảnh: game công khai trên GitHub Pages; Điều 32 Bộ luật Dân sự VN, luật Mỹ và Hàn đều đòi xin phép | Fan kém thích hơn | Em đề xuất, **anh chọn tên thật** |

- **Tên thật đảo một điều cấm cũ.** Spec Đợt 2 (mục 4) cấm "Tên VIP trùng tên người nổi tiếng thật". Điều cấm đó vẫn giữ cho bốn VIP, nhưng không áp dụng cho ngôi sao. Đừng đổi tên ngôi sao thành tên nhái. **(anh chọn)**

## 7. Thiết kế

### 7.1 Chín ngôi sao

Dữ liệu nằm ở `src/sim/idols.ts` (kiểu `IdolId`, `IDOL_IDS`, `IDOLS`) và `src/strings/idols.ts` (`IDOL_TEXT`), làm giống `vips.ts`. **(em đề xuất)**

| Thứ tự | id | Tên | Vai trong sổ | Dịch vụ | Bài ngân nga |
|---|---|---|---|---|---|
| 1 | `sontung` | Sơn Tùng M-TP | Ca sĩ Việt Nam | massage | Lạc Trôi |
| 2 | `taylor` | Taylor Swift | Ca sĩ Mỹ | massage | Shake It Off |
| 3 | `gd` | G-Dragon | Ca sĩ Hàn, BIGBANG | gội đầu | Crooked |
| 4 | `jennie` | Jennie | Ca sĩ Hàn, BLACKPINK | đắp mặt nạ | SOLO |
| 5 | `hieuthuhai` | HIEUTHUHAI | Rapper Việt Nam | gội đầu | Ngủ Một Mình |
| 6 | `weeknd` | The Weeknd | Ca sĩ Canada | gội đầu | Blinding Lights |
| 7 | `taeyang` | Taeyang | Ca sĩ Hàn, BIGBANG | massage | Eyes, Nose, Lips |
| 8 | `bieber` | Justin Bieber | Ca sĩ Canada | đắp mặt nạ | Baby |
| 9 | `daesung` | Daesung | Ca sĩ Hàn, BIGBANG | đắp mặt nạ | Haru Haru |

- **Tên, vai, hình:** **(anh chọn chín người, anh duyệt hình)**
- **Thứ tự vòng đầu:** Sơn Tùng tới trước để người chơi Việt thấy quen ngay. Sau đó xen kẽ Mỹ, Hàn, Việt. **(em đề xuất)**
- **Dịch vụ:** chỉ dùng ba dịch vụ đầu, mỗi dịch vụ ba người, để tiệm nào có Bảng vàng cũng đón được cả chín. **(em đề xuất)**
- **Bài ngân nga:** mỗi người một tên bài, chỉ tên bài. **(em đề xuất)**
- **Bên dưới, mỗi ngôi sao là khách kiểu `celeb`,** giống VIP: tip cao, chấm khắt khe.

### 7.2 Khi nào bắt đầu và cách hẹn

**(em đề xuất)**

- **Bắt đầu** khi tiệm gốc có Bảng vàng (`vip.boardGiven`). Tiệm cũng phải đủ điều kiện như VIP: ít nhất 2 kỹ thuật viên không nghỉ việc, và có ít nhất một dịch vụ của một ngôi sao.
- **Lần hẹn đầu** có thể rơi vào ngay tối hôm tiệm nhận Bảng vàng, tức là hẹn cho ngày hôm sau.
- **Cuối ngày, làm theo thứ tự:**
  1. Hẹn VIP ngày mai, như cũ.
  2. Hẹn ngôi sao ngày mai.
  3. Xếp sự kiện ngày mai. Sự kiện tránh cả ngày có VIP lẫn ngày có ngôi sao.
- **Lần hẹn ngôi sao bốc theo thứ tự này, từ dòng ngẫu nhiên riêng của ngôi sao:**
  1. **Ai tới:** người đầu tiên chưa từng ghé theo thứ tự ở mục 7.1, mà dịch vụ tiệm đang làm được. Khi cả chín đã ghé thì chọn ngẫu nhiên trong những người có dịch vụ hợp.
  2. **Giờ:** một nửa giờ từ 10:00 tới 17:00, như VIP. Nếu ngày mai có VIP thì chỉ bốc trong những nửa giờ cách giờ VIP ít nhất 3 tiếng. Khung 10:00–17:00 luôn còn ít nhất 2 nửa giờ như vậy.
  3. **Khoảng cách tới lần sau:** 3 tới 5 ngày (`IDOL_GAP_DAYS`).
- **Người tới sau chờ người tới trước đi đã.** **(em đề xuất)**
  - Lý do: VIP chờ lâu có thể ở lại hơn 3 tiếng giờ game. Kiên nhẫn 0,7 là khoảng 3,4 tiếng giờ game, có lễ tân thì tới khoảng 4,5 tiếng. Nên chỉ cách giờ hẹn 3 tiếng thì chưa đủ.
  - Cách làm: tới giờ hẹn mà khách chỉ-chủ-phục-vụ kia (VIP hay ngôi sao) vẫn còn trong tiệm, thì người tới sau chưa vào. Người đó vào ngay khi khách kia rời tiệm, dù được phục vụ xong hay bỏ về.
  - Lúc đang đợi như vậy, người tới sau chưa có mặt trong tiệm. Không tính kiên nhẫn, không có bong bóng, không có thẻ "Về ngay".
  - Tính ra thì người tới sau luôn vào được trước 20:00: giờ hẹn muộn nhất là 17:00, và người tới trước đến sớm hơn ít nhất 3 tiếng rồi ở lại tối đa khoảng 4,5 tiếng. Nếu sau này số kiên nhẫn đổi làm chuyện đó sai, thì tới giờ đóng cửa mà chưa vào được thì hôm đó người đó không tới và lịch hẹn bị bỏ.
- **Không hẹn ngôi sao vào ngày đã có sự kiện.** Sự kiện chỉ xếp cho ngày mai, và xếp sau ngôi sao, nên điều này tự đúng. Ghi lại ở đây để không ai đảo thứ tự.
- Lịch hẹn của ngày đã qua thì bỏ, như `clearStale` của VIP.

### 7.3 Báo trước

Làm giống VIP, câu chữ riêng. **(em đề xuất)**
- **Bảng tổng kết** có dòng hẹn ngày mai, màu như dòng VIP. Ví dụ: "Ngày mai 15:00, ngôi sao Taylor Swift hẹn massage".
  - Ngày mai có cả VIP và ngôi sao thì hiện cả hai dòng, dòng nào giờ sớm hơn thì đứng trên.
- **Lần hẹn ngôi sao đầu tiên** có thêm một dòng: "Tiệm có Bảng vàng nên ngôi sao bắt đầu tìm tới. Ngôi sao chỉ chủ tiệm phục vụ được, trả gấp 5." Dòng này hiện một lần, lưu bằng hint id mới `idol`. Nhớ thêm vào `HINT_IDS`.
- **Buổi sáng** hiện lời nhắc như `vipTodayToast`. Ngày có cả hai thì nhắc cả hai, cách nhau như các lời nhắc khác.
- **Sao vàng trên đồng hồ** hiện từ 60 phút trước giờ hẹn ngôi sao, giống VIP.

### 7.4 Tới tiệm, chờ, ngân nga

- **Tới đúng giờ hẹn**, theo đúng những luật của VIP: **(em đề xuất)**
  - hết ghế thì đứng cạnh quầy, không bỏ về;
  - nhân viên không mời;
  - lúc chủ tiệm có mặt thì nhân viên giữ giường đúng loại;
  - kiên nhẫn 0,7, không tính kiên nhẫn cộng thêm;
  - mini-game chơi bản khó.
- **Lúc tới**, ngôi sao nói câu chào (mục 7.12) bằng bong bóng lời nói, như VIP.
- **Ngân nga:** **(em đề xuất)**
  - Trong lúc chờ (ngồi hay đứng), cứ 10 giây ngôi sao lại hiện một bong bóng "♪ Tên bài ♪" trong 3 giây.
  - Bong bóng ngân nga nằm trong hàng chờ của chính người đó (`sayNext`). Vì vậy nó không bao giờ cắt ngang câu chào.
  - Hết chờ (được mời vào giường hoặc bỏ về) thì thôi ngân nga.
  - Trong mini-game không ngân nga.
- **Ngôi sao luôn là khách mới vào tiệm,** không phải khách quen, và không có thẻ thành viên.

### 7.5 Phục vụ, tiền và đánh giá

**(em đề xuất)**
- **Giá:** gấp 5 giá dịch vụ (`IDOL_PRICE_FACTOR`), tính trên giá đã nhân theo hạng tiệm. Không cộng giá lễ.
- **Tip:** như VIP.
- **Đánh giá:** mỗi lần ghé tính 3 đánh giá, như VIP. Bỏ về thì 3 đánh giá giận.
- **Những chỗ ngôi sao được tính giống VIP:**
  - Không tính vào `ownerServed` (tiền khi vắng).
  - Không có tip hào phóng.
  - Không tính vào kiểu khách đã phục vụ.
  - Vẫn tính vào số khách và số tiền chung của nhiệm vụ.
- **Mỗi lần ngôi sao cho 3 sao**, tiệm hot (mục 7.6). Lần đầu cho 3 sao thì tặng ảnh (mục 7.7).
- **Ghi lại cho từng ngôi sao:** số lần ghé, số sao cao nhất, đã tặng ảnh chưa, đã nói câu cảm ơn chưa. Sổ khách cần biết câu cảm ơn đã nói hay chưa.

### 7.6 Tiệm hot

**(em đề xuất)**
- **Mỗi lần ngôi sao cho 3 sao** thì ngôi sao "đăng ảnh tiệm". Tiệm hot `HOT_DAYS` (2) ngày tính từ sáng mai, khách tới dày hơn như sau video của Mi Mi.
- **Nếu tiệm đang hot thì kéo dài:** `hotUntil = max(hotUntil, hôm nay + HOT_DAYS)`.
- **Sáng hôm sau hiện thẻ hot** với tên ngôi sao: "Taylor Swift đăng ảnh tiệm mình". Thẻ hiện kể cả khi chỉ là kéo dài thêm. Vì vậy sổ sự kiện cần nhớ ai làm tiệm hot và ngày thẻ phải hiện.
  - Chữ `hotHead` hiện nói cứng là Mi Mi. Đổi thành chữ có chỗ điền tên.
  - `hotLine` nói "Hôm nay và ngày mai". Câu này vẫn đúng khi thẻ hiện vào ngày hot đầu tiên.
- **Ngày hot vẫn không tính vào số trung bình của nhiệm vụ,** như hiện giờ (`recordDay(..., busy)`).

### 7.7 Ảnh có chữ ký và Tường ngôi sao

**(em đề xuất)**
- **Lần đầu một ngôi sao cho 3 sao,** người đó tặng ảnh có chữ ký. Đó là món trang trí 1 ô, chỉ nhận được qua quà, đẹp 5 (ảnh VIP đẹp 4).
  - Có 9 món, ví dụ `photoIdolSontung`. Tên món trong Kho: "Ảnh ký tên Sơn Tùng M-TP".
  - Hình ảnh: khung vàng có ngôi sao nhỏ ở đỉnh, khác khung ảnh VIP để nhìn là biết. Trong khung là đầu và tóc của ngôi sao, kèm món đặc trưng nếu vừa chỗ.
- **Đủ chín ảnh** thì tặng **Tường ngôi sao**: món trang trí 2 ô, chỉ nhận qua quà, đẹp 9 (Bảng vàng đẹp 7). Hình là tấm bảng có chín ngôi sao vàng nhỏ xếp ba hàng.
- **Lời báo:** nhận ảnh thì có lời nhắc như `vipPhotoToast`. Nhận Tường ngôi sao thì xếp hàng một lời nhắc lớn như `vipBoardToast`.
- **Huy hiệu ảnh VIP và Bảng vàng không đổi.** Ảnh ngôi sao không tính vào hai huy hiệu đó.

### 7.8 Sổ khách: trang "Ngôi sao" (lô B)

**(em đề xuất)**
- **Thêm tab thứ tư "Ngôi sao"**, hiện từ lần hẹn ngôi sao đầu tiên. Cần thêm cách xếp 4 tab vào `TAB_LAYOUT`. Bốn chữ "Khách quen", "Kiểu khách", "VIP", "Ngôi sao" phải vừa ô.
- **Lưới 3 cột × 3 hàng,** chín ô vừa một trang.
  - Ô đã gặp: hình, tên, số sao cao nhất, số lần ghé, đã có ảnh chưa.
  - Ô chưa gặp: bóng mờ, không tên.
- **Chạm vào ô đã gặp** thì mở trang riêng, gồm:
  - hình to, tên, vai, dịch vụ hay làm;
  - "Hay ngân nga: ♪ Tên bài ♪";
  - số sao cao nhất, số lần ghé;
  - những câu đã nói: câu chào sau lần ghé đầu, câu cảm ơn sau lần đầu được 3 sao.
- **Nút sổ khách** vẫn theo luật cũ. Ngôi sao chỉ tới khi đã có VIP, nên nút sổ chắc chắn đã hiện. Không thêm chấm nhắc mới.

### 7.9 Chủ tiệm vắng (chuỗi)

Làm y như VIP. **(em đề xuất)**
- Chỉ tiệm gốc hẹn ngôi sao. Sổ ngôi sao của chi nhánh luôn trống và không bao giờ hẹn.
- **Lúc chủ ở chi nhánh:**
  - Ngôi sao tới tiệm gốc thì chủ nhận thẻ "Về ngay", vẽ ngôi sao trên quầng vàng dưới 5 sao.
  - Chữ thẻ như thẻ VIP, thay chữ "VIP" bằng "Ngôi sao" và tên người đó.
- Chủ rời tiệm gốc lúc có ngôi sao đang chờ thì cũng nhận thẻ đó, như `callForWaitingVips`.
- Tiệm gốc vắng chủ thì không giữ giường cho ngôi sao, giống VIP.

### 7.10 Hình vẽ

- **Mỗi ngôi sao mặc đồ riêng,** giống `VIP_WORN`. Màu da, màu tóc, kiểu tóc và màu áo lấy đúng như bản phác. Hình mặt trước đã có trong `docs/art/ngoi-sao-mat-truoc.mjs`. **(anh duyệt)**
- **Màu riêng không có trong bảng màu khách:** ngôi sao lưu màu thật (số hex) chứ không lưu số thứ tự như `Look`. Ví dụ tóc hồng của G-Dragon, tóc vàng mật ong của Taylor.
- **Vẽ thêm hướng nghiêng và sau lưng** cho mọi món đeo. Món nào nhìn từ phía đó không thấy thì bỏ, như cách VIP đang làm.
  - Mái tóc (Taylor, Jennie): không có từ sau lưng.
  - Nơ của Jennie: thấy từ sau lưng.
  - Mohawk của Taeyang: từ bên cạnh là dải gai dài từ trán ra sau gáy.
  - Mũ đội ngược của HIEUTHUHAI: từ bên cạnh thấy lưỡi trai chĩa ra sau.
  - Mặt cười của Daesung: chỉ có mặt trước. Từ bên cạnh dùng mắt cong một bên.
- **Mặt của Daesung thay hẳn mặt thường.** Môi đỏ của Taylor và ria của The Weeknd đặt chồng lên mặt thường.
- **Nằm trên giường thì đồ đeo cởi ra như mọi khách.** Riêng mái tóc và mohawk là tóc, nên vẫn giữ. Builder chọn cách vẽ cho hợp.
- Chín ảnh có chữ ký và Tường ngôi sao vẽ cùng chỗ với quà VIP (`src/art/furniture.ts`).

### 7.11 Âm thanh

- Ngôi sao tới thì dùng lại tiếng nhạc chào của VIP. Không làm tiếng mới. **(em đề xuất)**

### 7.12 Câu chữ

Giọng Sài Gòn thân thiện. Mỗi câu tối đa 60 ký tự (`BUBBLE_MAX_CHARS`, tức 2 dòng trong bong bóng), kiểm bằng test câu chữ đang có. Không câu nào có lời bài hát. **(em đề xuất)**

| Ngôi sao | Câu chào | Câu cảm ơn (3 sao) |
|---|---|---|
| Sơn Tùng M-TP | Chào em! Anh vừa ra bài mới, chạy show mỏi vai quá trời. | Nhẹ cả người! Lần sau anh dẫn cả ê-kíp tới luôn nha. |
| Taylor Swift | Hi! Tối nay chị diễn ba tiếng rưỡi, bóp vai giùm chị nha! | Amazing! Vai nhẹ tênh, tối nay chị diễn thêm cũng được! |
| G-Dragon | Annyeong! Gội nhẹ tay giùm anh, tóc hồng này mới nhuộm đó. | Màu vẫn hồng mà tóc mềm hơn! Tiệm này chất ghê. |
| Jennie | Annyeong! Mai chị chụp bìa tạp chí, làm da chị sáng lên nha. | Da căng bóng luôn! Mai lên hình khỏi cần chỉnh. |
| HIEUTHUHAI | Mai quay MV rồi, gội cho anh thơm tho bảnh bao nha! | Thơm phức! Vô MV tóc vào nếp khỏi cần vuốt. |
| The Weeknd | Hát tới khuya, ngủ chưa đủ giấc… Gội cho anh tỉnh ngủ nha. | Tỉnh cả người! Đêm nay anh hát tới sáng cũng được. |
| Taeyang | Tập nhảy cả ngày, lưng cứng đơ rồi. Massage giùm anh nha! | Lưng dẻo lại rồi! Giờ nhảy thêm bài nữa cũng được. |
| Justin Bieber | Yo! Bay mệt quá. Sorry nếu anh ngủ quên lúc đắp mặt nạ nha! | Ngủ ngon thiệt! Da mát rượi, bay về khỏi lo mệt. |
| Daesung | Hehe! Cười nhiều quá mỏi cả mặt, đắp mặt nạ cho anh nha! | Mặt mát rượi, cười tiếp được rồi! Hehe! |

- Trong câu hẹn và lời nhắc, gọi chung là "ngôi sao" + tên. Ví dụ: "ngôi sao Jennie hẹn đắp mặt nạ lúc 14:30".

### 7.13 Lưu game

- **Sổ mới** `idol` lưu cạnh `vip` trong ô lưu của mỗi tiệm, gồm:
  - với từng ngôi sao: số lần ghé, số sao cao nhất, đã tặng ảnh chưa, đã nói câu cảm ơn chưa;
  - lần hẹn đang chờ (ai, ngày, phút);
  - ngày sớm nhất được hẹn tiếp;
  - đã từng hẹn chưa;
  - đã tặng Tường ngôi sao chưa.
- **Khách đang trong tiệm** có thêm trường `idol: IdolId | null`, như `vip`.
- **Sổ sự kiện** nhớ thêm ai làm tiệm hot (`'kol'` hay một `IdolId`) và ngày cần hiện thẻ hot (mục 7.6).
- **Lên một số save** (mục 1). Làm theo cách đã dùng cho mọi sổ mới:
  - thêm số cũ vào danh sách phiên bản;
  - đóng băng fixture của số cũ;
  - viết `repairIdolBook`, đưa ô lưu thiếu hay hỏng về sổ trống, bỏ id lạ, bỏ lịch hẹn quá một ngày;
  - bỏ `idol` lạ trên khách.
- **Ô lưu cũ đã có Bảng vàng** mở lên thì tối đó bắt đầu hẹn ngôi sao. Không tặng bù gì.

## 8. Kiểm tra

Test tự động, viết trước khi làm (TDD), theo mẫu `tests/sim/spa-vips.test.ts`:
- **Hẹn:**
  - không hẹn khi chưa có Bảng vàng, hay khi chưa đủ 2 kỹ thuật viên;
  - tối nhận Bảng vàng thì hẹn cho ngày mai;
  - vòng đầu đi đúng thứ tự, bỏ qua người không có dịch vụ hợp;
  - khoảng cách 3–5 ngày;
  - cùng ngày với VIP thì cách ít nhất 3 tiếng;
  - khách kia còn trong tiệm thì người tới sau đợi, và vào ngay khi khách kia đi (thử cả hai chiều: VIP trước, ngôi sao trước);
  - không có sự kiện vào ngày có ngôi sao.
- **Không đổi gì cũ:**
  - tiệm chưa có Bảng vàng bốc y như trước (VIP, sự kiện, khách);
  - `same-draws` giữ nguyên.
- **Tới tiệm và phục vụ:**
  - không bỏ về vì hết ghế;
  - nhân viên không mời;
  - giữ giường khi chủ có mặt;
  - kiên nhẫn 0,7;
  - giá gấp 5 không cộng giá lễ;
  - 3 đánh giá;
  - bỏ về thì 3 đánh giá giận.
- **Quà và tiệm hot:**
  - lần đầu 3 sao thì có ảnh, tặng đúng một lần;
  - đủ chín ảnh thì có Tường ngôi sao, một lần;
  - mỗi lần 3 sao thì tiệm hot hoặc được kéo dài;
  - thẻ hot mang tên ngôi sao.
- **Ngân nga:** chỉ khi đang chờ, không cắt câu chào.
- **Chuỗi:**
  - chủ ở chi nhánh thì có thẻ "Về ngay";
  - chi nhánh không hẹn ngôi sao.
- **Lưu:**
  - mở save số cũ thì có sổ ngôi sao trống;
  - sổ hỏng được sửa;
  - lưu rồi mở lại giữa lúc ngôi sao đang chờ thì vẫn đúng người, đúng trạng thái.
- **Sổ khách (lô B):** có 4 tab, lưới 9 ô, trang riêng.
- **Câu chữ:** mỗi ngôi sao đủ tên, vai, câu chào, câu cảm ơn, tên bài, không câu nào quá 2 dòng.

Kiểm tra trên trình duyệt ở 390 px:
- dựng một tiệm có Bảng vàng, chơi tới lúc ngôi sao tới;
- xem đủ 3 hướng của cả chín người;
- xem ngân nga, thẻ hot, ảnh trong Kho và khi đặt ra tiệm;
- xem trang sổ khách.

## 9. Để người làm tự quyết

- Cách chia code giữa `idols.ts` và `vips.ts`. Phần dùng chung (giờ hẹn, giữ giường, đứng chờ) có thể rút ra làm hàm chung, miễn VIP chạy y như cũ.
- Hạt giống của dòng ngẫu nhiên ngôi sao, miễn khác mọi dòng đang có.
- Bố cục ô trong lưới sổ khách, cỡ chữ, chỗ đặt tên bài trên trang riêng.
- Hình khung ảnh và Tường ngôi sao, miễn đúng như mục 7.7 tả và hợp nét game.
- Có cho ngôi sao ngân nga lúc đi ra cửa hay không.
- Cách lưu đợt hot cho đúng khi bị kéo dài, ví dụ lưu thêm ngày bắt đầu. Điều phải giữ là mọi ngày trong đợt đều hot.
- Ngôi sao tới mà dịch vụ của họ vừa bị đóng: không được bốc bù từ dòng ngẫu nhiên của tiệm.
- Ngôi sao có tính vào huy hiệu số khách đã phục vụ hay không (VIP đang được tính).

## 10. Câu hỏi cho lần chơi thử

- Cả nhà có nhận ra từng ngôi sao ở cỡ nhỏ trong tiệm không?
- Lịch 3–5 ngày có quá thưa hay quá dày không?
- Gấp 5 và tiệm hot có làm ngày ngôi sao tới hồi hộp không, hay chỉ thêm việc?
- Bong bóng ngân nga 10 giây một lần có làm rối mắt không?
- Muốn thêm ngôi sao nào nữa?
