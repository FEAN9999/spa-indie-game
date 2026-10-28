# Đợt 3, phần 1: lịch tháng, nhiệm vụ và thành tựu

- Ngày: 2026-10-28
- Trạng thái: chờ anh duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.4, 5.5 và mục 6 (Đợt 3).
- Bản phác bấm thử (anh đã duyệt cả 11 điểm, 2026-10-28): https://claude.ai/artifact/4SPJUPVVr5DrGTbExsKUd5

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự điền, anh sửa được.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Đợt 3 chia 5 phần, làm lần lượt:** **(em đề xuất, anh không sửa)**
  1. Lịch tháng, nhiệm vụ và thành tựu (tài liệu này).
  2. Sự kiện: lễ theo tháng (Tết, Valentine, 8/3, Trung thu, 20/10, Noel) và sự kiện ngẫu nhiên (thanh tra vệ sinh, KOL ghé review, đối thủ mở sát bên, mất điện).
  3. Xếp hạng tiệm 1 đến 5 sao và giải "Spa của năm".
  4. Thêm trang phục cho chủ tiệm, mở bằng huy hiệu.
  5. Tắt game tiền vẫn vào khi nhân viên làm hết.
- **Lịch riêng trong game, chạy nhanh để lễ nào cũng gặp sau vài ngày chơi**, không theo ngày ngoài đời. **(anh chọn)**
- **Bản phác và 11 điểm em đề xuất trên đó.** **(anh duyệt)**
- **Làm theo cách A** (mục 6): luật chơi tự đếm ngay lúc việc xảy ra, cuối ngày chốt sổ. **(anh chọn)**
- **Chia hai lô:** **(em đề xuất)**
  - **Lô A:** lịch tháng, nút Nhiệm vụ, nhiệm vụ trong ngày và của tháng, save v15.
  - **Lô B:** 20 huy hiệu thành tựu, save v16.
- **Anh duyệt tài liệu này một lần cho cả hai lô.** **(em đề xuất, giữ cách của Đợt 2)**
  - Sau đó em làm liền một mạch.
  - Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh.
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Game chỉ đếm ngày:** `sim.day`, chữ "Ngày {day}" trên thanh trên cùng (`Hud.update`, dòng thứ hai, cùng giờ trong ngày). Chưa có tháng hay năm.
- **Nút "Nhiệm vụ"** là nút thứ tư ở thanh dưới (`NAV` trong `src/view/Hud.ts`). Nó không gắn với tính năng nào, nên bấm vào chỉ báo "Tính năng này có ở bản sau".
- **Mở tính năng theo ngày:** `UNLOCK_DAY` trong `src/config.ts` (build 2, staff 3, services 4, stock 5, floors 6). Khách quen tới từ ngày 7 (`REGULARS_FROM_DAY`).
  - Ngày mở, bàn tay chỉ vào nút (`pickHint` trong `src/sim/tutorial.ts`). Nút có nhãn "Mới" tới khi mở lần đầu (`hints`).
  - Tiệm đã qua ngày mở thì không có bàn tay, chỉ có nhãn "Mới".
- **Số liệu trong ngày** là `DayStats`: served, angry, walkedAway, income, tips, wages, restock, gifts.
  - Bảng tổng kết gộp "bỏ về" = angry + walkedAway.
  - Lãi = income + tips + gifts − wages − restock.
- **Khách đã phục vụ có đếm sẵn từ save v8:** `book.served` theo kiểu khách, và `vip.vips[id].visits` cho khách VIP.
- **Mọi luật nằm trong `SpaSim`** (`src/sim/spa.ts`, không dùng Phaser):
  - Khách trả tiền ở `payFor`. Chủ tiệm làm xong qua `completeService` với `technician = null`.
  - Khách mất kiên nhẫn ở `loseCustomer`, khách hết ghế bỏ về ở `seatCustomer`.
  - Hết ngày ở cuối `step`: `dayOver`, trả lương, hẹn khách VIP bằng dòng ngẫu nhiên riêng, rồi phát `dayEnded`.
  - Sang ngày ở `startDay`.
- **Bẫy:** `SpaSim.fromSave` phát lại `dayEnded` nếu ô lưu được ghi sau khi hết ngày. Đếm hay chốt sổ mà nằm ở phần hình thì sẽ đếm hai lần.
- **Dòng ngẫu nhiên riêng:** `planBooking` dùng `createRng(day * 7919 + nextId)` để các lần bốc của tiệm không đổi. Nhiệm vụ cũng phải làm vậy.
- **Toast:** cái mới thay cái cũ. Mấy cái cùng lúc thì `SpaScene` xếp cách nhau `LATE_TOAST_MS` (2,2 giây).
- **Bảng phủ lên tiệm:** `GuestBookScene` là mẫu gần nhất. Thẻ giấy 1000 × 1760, tiêu đề, các nút thẻ, nút "Xong". Tiệm đứng yên bên dưới.
- **Save v14** (`src/sim/save.ts`). Các trường mới được sửa trong `parseSave` bằng hàm `repairX`. Mỗi đời save có một bản lưu mẫu đông cứng trong `tests/fixtures`.

## 3. Mục tiêu

- **Cả nhà có việc nhỏ để làm mỗi ngày chơi**, nhất là sau ngày 7 khi mọi nút đã mở và bắt đầu hết cái mới.
- **Có mốc dài hạn để sưu tập** (huy hiệu). Phần 4 dùng huy hiệu để mở trang phục.
- **Lịch tháng làm nền cho phần 2 và 3:** lễ theo tháng và giải "Spa của năm" gắn vào đúng chỗ chốt sổ cuối ngày và sang tháng của phần này.
- **Đẩy chủ tiệm tự tay làm:** luôn có việc kiểu "Tự tay làm 3 khách 3 sao", để giai đoạn cuối không chỉ ngồi nhìn tiền tăng.

## 4. Chưa làm ở phần này

- Lễ, sự kiện ngẫu nhiên (phần 2), xếp hạng và Spa của năm (phần 3), trang phục (phần 4), tiền vào khi tắt game (phần 5).
- Nhiệm vụ có cốt truyện hoặc nối chuỗi, nhiệm vụ do khách quen giao.
- Nhiệm vụ theo ngày ngoài đời.
- Nút "Nhận thưởng". Tiền tự vào. **(anh duyệt)**
- Đổi nhiệm vụ mất tiền, hoặc đổi nhiều lần một ngày.
- Huy hiệu có bậc đồng, bạc, vàng.

## 5. Điều cấm (dính là coi như hỏng)

- **Ra nhiệm vụ không làm được**, ví dụ việc massage khi tiệm chưa có giường massage, việc của thợ khi chưa có thợ, hoặc việc chắc chắn không kịp trong thời gian còn lại. Việc chỉ *có thể* không xong vì khách ít tới thì không tính là không làm được.
- **Phạt hoặc trách người chơi** vì không xong nhiệm vụ. Mất tiền, mất sao, hay câu chữ kiểu chê bai đều cấm.
- **Bắt chờ ngoài đời:** nhiệm vụ chỉ đi theo ngày trong game.
- **Trả thưởng hai lần**, ví dụ sau khi mở lại game lúc đang ở bảng tổng kết.
- **Bốc nhiệm vụ làm đổi các lần bốc của tiệm** (khách, thợ ứng tuyển, khách VIP). Với cùng hạt giống, tiệm phải chạy y như trước.
- **Một tràng bảng vàng** hiện liên tiếp khi tiệm cũ mở game lần đầu sau lô B.

## 6. Các cách đã cân nhắc

Em đã đọc mã của 9 game mã nguồn mở trước khi chọn: SuperTuxKart, Shattered Pixel Dungeon, Antimatter Dimensions, Stendhal, ODailyQuests, Unciv, OpenTTD, OpenRCT2 và CorsixTH.

| Cách | Làm thế nào | Được | Mất | |
|---|---|---|---|---|
| **A** | Luật chơi tự đếm lúc việc xảy ra. Sáng bốc nhiệm vụ, cuối ngày chốt sổ. | Thanh tiến độ chạy ngay trong ngày. Kiểm tra tự động được. Không đếm trùng. Phần 2–3 gắn tiếp vào chỗ chốt sổ. | Nâng save một đời mỗi lô | **anh chọn** |
| B | Phần hình nghe sự kiện rồi tự đếm | Không đụng luật chơi | Đếm trùng khi mở lại game (`dayEnded` phát lại). Khó kiểm tra. | Loại |
| C | Chỉ xét ở bảng tổng kết cuối ngày | Ít code nhất | Thanh tiến độ đứng yên trong ngày. Chỉ dùng được số đã có trong tổng kết. | Loại |

Học từ các game đó:
- **Chỉ lưu số đếm thô, mở game thì tính lại xem đã đạt mốc nào** (SuperTuxKart). Nhờ vậy huy hiệu thêm sau vẫn trao được cho tiệm cũ.
- **Bốc nhiệm vụ từ danh sách mẫu đã lọc theo cái người chơi có.** Ghi số đếm lúc giao làm mốc. Không trùng với hôm qua. Hết hạn thì bỏ, không phạt. Cho đổi (Stendhal, Unciv, ODailyQuests).
- **Ngày tháng tính từ một số đếm; giải thưởng xét ở ranh giới tháng, năm** (OpenRCT2, CorsixTH). Giải tính ngay trong luật chơi, đừng tính trong bảng hiện lên: CorsixTH từng lỗi vì tính giải trong bảng.

## 7. Người chơi thấy gì

### 7.1 Lịch tháng (lô A)

- **3 ngày chơi là một tháng, 12 tháng là một năm (36 ngày).** **(em đề xuất)** Ngày 1–3 là tháng 1 năm 1, ngày 37 là tháng 1 năm 2.
- **Thanh trên cùng, dòng thứ hai:** "Ngày 11 · Tháng 4 · 10:34".
  - Sao vàng hẹn khách VIP vẫn đứng ngay sau dòng chữ.
  - Nút sổ khách vẫn ở chỗ cũ (x 870).
- Tiệm cũ có tháng ngay, tính từ ngày đang chơi.
- Bảng tổng kết, ô lưu và câu chào buổi sáng giữ nguyên.

### 7.2 Nút Nhiệm vụ (lô A)

- **Mở từ ngày 8.** **(anh duyệt)**
  - Trước đó nút khoá như các nút khác, bấm vào báo "Mở từ ngày 8".
- **Sáng ngày 8, bàn tay chỉ vào nút**, kèm câu "Mỗi ngày có việc nhỏ, xong là có thưởng". Nút có nhãn "Mới" tới khi mở lần đầu.
- **Tiệm cũ đã qua ngày 8:** nút mở luôn, có nhãn "Mới", không có bàn tay.
- **Chấm đỏ góc phải nút:** hiện mỗi sáng có nhiệm vụ mới, tắt khi mở bảng. **(anh duyệt)**
  - Giống chấm đỏ báo sắp hết hàng ở nút Dịch vụ.
  - Không hiện cùng lúc với nhãn "Mới". **(em đề xuất)**

### 7.3 Bảng Nhiệm vụ

Giống bản phác:
- **Thẻ giấy phủ lên tiệm, tiệm đứng yên bên dưới.** Tiêu đề "Nhiệm vụ", nút "Xong" ở đáy.
- **Lô A chỉ có nội dung nhiệm vụ.** Lô B thêm hai nút thẻ "Nhiệm vụ" và "Thành tựu". **(em đề xuất)**
- **Lần mở đầu có một dòng giải thích ở đầu bảng:** "Mỗi sáng có 3 việc nhỏ. Xong là tiền tự vào két, không xong thì thôi."
- **Phần "Hôm nay · Ngày 11"**, góc phải ghi "Đổi được 1 việc" hoặc "Hết lượt đổi". Bên dưới là 3 hàng, mỗi hàng có:
  - một hình tròn có biểu tượng;
  - tên việc;
  - thanh tiến độ kèm số, ví dụ "4/10", hoặc "310k/700k" với việc về tiền;
  - tiền thưởng "+40.000 đ";
  - nút "Đổi" khi còn lượt.
  - **Xong:** nền xanh nhạt, dấu "Xong" thế chỗ nút Đổi.
  - **Lỡ:** cả hàng mờ đi, ghi "Có khách bỏ về rồi · mai làm lại".
- **Phần "Tháng 4 · còn 2 ngày"** (hoặc "còn hôm nay"), góc phải ghi "Năm 1". Một hàng nền vàng nhạt, hình tròn màu mù tạt, không có nút Đổi.
- **Dòng nhỏ cuối bảng:** "Việc không xong thì thôi, không bị phạt."

### 7.4 Nhiệm vụ trong ngày

- **Mỗi sáng 3 việc, bốc từ những việc tiệm làm được.** **(anh duyệt)**

  | Việc | Có khi | Đếm gì |
  |---|---|---|
  | Phục vụ {n} khách | luôn có | khách trả tiền, ai làm cũng được |
  | Tự tay làm {n} khách 3 sao | luôn có | chủ tiệm chơi mini-game được 3 sao |
  | Kiếm {tiền} trong ngày | luôn có | tiền dịch vụ cộng tip, không tính quà khách quen hay thưởng nhiệm vụ |
  | Nhận {tiền} tiền tip | luôn có | tip |
  | Làm {n} lượt {dịch vụ} | tiệm làm được ít nhất một dịch vụ ngoài gội đầu | khách trả tiền cho dịch vụ đó, ai làm cũng được |
  | Thợ làm {n} khách | có ít nhất một kỹ thuật viên không đang nghỉ việc | khách do thợ làm |
  | Không để khách nào bỏ về | luôn có | xét lúc đóng cửa |

  - "Làm được" nghĩa là dịch vụ đã mở và đang có giường, như `availableServices()`.
  - Việc dịch vụ bốc một dịch vụ trong số đó, trừ gội đầu.
- **Không bốc lại việc hôm qua.** Nếu không đủ việc khác thì mới lấy lại việc hôm qua. Không bao giờ ra 2 việc giống nhau trong một ngày.
- **Mục tiêu tính theo 3 ngày đã xong gần nhất của chính tiệm đó** (mục 8.4), nên tiệm nhỏ hay tiệm 3 tầng đều vừa sức. **(anh duyệt)**
- **"Không để khách nào bỏ về":**
  - Xong lúc đóng cửa nếu từ lúc giao tới giờ không ai bỏ về, dù hết kiên nhẫn hay hết ghế.
  - Có người bỏ về thì hàng bị gạch ngay, không hiện toast. **(em đề xuất: tiếng thở dài của khách đã đủ rồi, không nhắc thêm)**
- **Đổi:** mỗi ngày đổi được 1 việc chưa xong, kể cả việc đã bị gạch, miễn phí. **(anh duyệt)**
  - Việc mới không trùng 3 việc đang có, và nếu được thì không trùng việc hôm qua.
  - Việc mới đếm từ lúc đổi.
- **Hết ngày:** việc chưa xong mất đi. Sáng ra có 3 việc mới. **(anh duyệt)**

### 7.5 Nhiệm vụ của tháng

- **Mỗi tháng một việc lớn, có từ sáng ngày đầu tháng, kéo dài 3 ngày.** Thưởng bằng 5 lần thưởng thường của một việc trong ngày. **(anh duyệt, số em đề xuất)**

  | Việc | Có khi |
  |---|---|
  | Kiếm {tiền} trong tháng | luôn có |
  | Phục vụ {n} khách trong tháng | luôn có |
  | Tự tay làm {n} khách 3 sao trong tháng | luôn có |
  | Cho 1 khách quen lên thêm 1 tim | đã gặp ít nhất một khách quen chưa đủ 5 tim, và tháng còn từ 2 ngày hoặc hôm nay có một người như vậy hẹn tới **(em quyết)** |
  | Cho 1 người đi học 1 khoá | có ít nhất một người đang làm mà còn khoá để học; tính lúc đóng tiền học, không chờ sáng hôm sau học xong **(em quyết: khoá đặt ngày cuối tháng xong vào sáng tháng sau, sẽ không bao giờ kịp)** |

- **Không bốc lại việc của tháng trước** nếu còn việc khác.
- **Sang tháng mới mà chưa xong thì thôi,** không báo gì. Sáng ngày đầu tháng có toast "Tháng {m}: có nhiệm vụ tháng mới", xếp sau câu chào buổi sáng.
- **Nút Nhiệm vụ mở giữa tháng:**
  - Tiệm cũ, hoặc ngày 8, đều rơi vào giữa tháng 3.
  - Việc tháng có ngay. Mục tiêu và tiền thưởng đều tính theo số ngày còn lại của tháng (kể cả hôm nay), không phải cả 3 ngày. **(em quyết)**
  - Số đếm bắt đầu từ lúc giao.

### 7.6 Xong nhiệm vụ

- **Tiền tự vào két ngay lúc xong**, không phải bấm nhận. **(anh duyệt)**
- **Báo xong:**
  - Có tiếng đồng xu.
  - Tiền bay lên ở chỗ tiền trên thanh trên cùng.
  - Toast "Xong nhiệm vụ: {tên việc} · +{tiền}". Nếu cùng lúc có toast khác thì xếp sau.
- **Bảng tổng kết có thêm dòng "Thưởng nhiệm vụ"** khi trong ngày có thưởng, và lãi tính cả dòng này. **(em đề xuất: để tiền vào két khớp với tổng kết)**

### 7.7 Thành tựu (lô B)

- **20 huy hiệu, không thưởng tiền.** **(anh duyệt)** Tới phần 4, huy hiệu dùng để mở trang phục.
- **Thẻ "Thành tựu"** giống bản phác:
  - Dòng "Đã có {n}/20 huy hiệu", rồi lưới 4 cột × 5 hàng.
  - Huy hiệu đã có: tròn màu mù tạt, viền nâu, biểu tượng màu mực.
  - Huy hiệu chưa có: nền cát, viền đứt, biểu tượng mờ. Có vòng xanh cho biết đã đi được bao xa, nếu huy hiệu đó đếm được.
  - Chạm một huy hiệu thì ô dưới lưới hiện tên, điều kiện và một trong ba dòng: "Đã được 63/100", "Có từ ngày 9", hoặc "Có từ trước" (huy hiệu trao lúc tiệm cũ mở game lần đầu).
- **Danh sách:**

  | # | Tên | Điều kiện | Lấy số từ |
  |---|---|---|---|
  | 1 | Trăm khách | Phục vụ 100 khách | khách đã phục vụ, có sẵn từ save v8 (`book.served` cộng lượt khách VIP) |
  | 2 | Nghìn khách | Phục vụ 1.000 khách | như trên |
  | 3 | Tay vàng | Tự tay làm 50 khách 3 sao | số đếm mới, lô A bắt đầu đếm |
  | 4 | Ngày đông | Phục vụ 25 khách trong một ngày | ngày đông nhất, lô A bắt đầu ghi |
  | 5 | Vẹn cả ngày | Một ngày có từ 15 khách, không ai bỏ về | xét lúc hết ngày, lô A bắt đầu ghi |
  | 6 | Thẻ đầu tiên | Một khách quen làm thẻ thành viên | sổ khách |
  | 7 | Sổ đầy trang | Mọi khách quen đủ 5 tim | sổ khách |
  | 8 | Ảnh ký tặng | Có ảnh ký tên đầu tiên của khách VIP | sổ VIP |
  | 9 | Bảng vàng | Treo bảng vàng của khách VIP | sổ VIP |
  | 10 | Đủ món | Mở đủ 6 dịch vụ | dịch vụ đã mở |
  | 11 | Pha đúng | Pha đúng công thức đầu tiên | sổ công thức |
  | 12 | Lên lầu | Mở tầng 2 | số tầng |
  | 13 | Sân thượng | Mở sân thượng | số tầng |
  | 14 | Tiệm xinh | Điểm đẹp của tiệm đạt 60 | `beauty()` |
  | 15 | Đủ thợ | Có 7 kỹ thuật viên | thợ không đang nghỉ việc |
  | 16 | Thợ cả | Một thợ lên bậc 3 ở một dịch vụ | bậc của thợ |
  | 17 | Triệu đầu | Có 1.000.000 đ trong két | tiền lúc này |
  | 18 | Ngày lãi lớn | Lãi 1.000.000 đ trong một ngày | lãi cao nhất một ngày, lô A bắt đầu ghi |
  | 19 | Chăm chỉ | Xong 20 nhiệm vụ trong ngày | số đếm mới, lô A bắt đầu đếm |
  | 20 | Tròn năm | Tiệm mở tròn một năm, 36 ngày | ngày |

- **Có huy hiệu mới:**
  - Một bảng vàng hiện dưới thanh trên cùng trong 3 giây: hình huy hiệu, "Huy hiệu mới", tên và điều kiện.
  - Có tiếng mừng.
  - Nhiều huy hiệu cùng lúc thì hiện lần lượt.
- **Trước ngày 8 (nút còn khoá):** huy hiệu vẫn được trao nhưng không hiện bảng vàng. Ngày 8 mở bảng là thấy. **(em đề xuất)**
- **Tiệm cũ mở game lần đầu sau lô B:** huy hiệu nào đủ điều kiện thì trao luôn, ghi "Có từ trước", không hiện bảng vàng. Thay vào đó có một toast: "Tiệm đã có sẵn {n} huy hiệu. Xem ở nút Nhiệm vụ."

### 7.8 Âm thanh

- Dùng lại tiếng có sẵn, không làm tiếng mới. **(em đề xuất)**
  - Xong nhiệm vụ: `coin`.
  - Huy hiệu mới: `levelUp`.

## 8. Luật trong code

### 8.1 Lịch

- **Hàm thuần, không lưu gì:**
  - `monthOf(day) = ⌊(day − 1) / DAYS_PER_MONTH⌋ mod MONTHS_PER_YEAR + 1`
  - `yearOf(day) = ⌊(day − 1) / (DAYS_PER_MONTH × MONTHS_PER_YEAR)⌋ + 1`
  - `dayOfMonth(day) = (day − 1) mod DAYS_PER_MONTH + 1`
- Phần 2 và 3 sẽ dùng lại các hàm này. Hai số `DAYS_PER_MONTH = 3` và `MONTHS_PER_YEAR = 12` đặt trong `config.ts`.

### 8.2 Đếm

- **Mọi số đếm nằm trong luật chơi**, cập nhật ngay ở chỗ việc xảy ra:
  - `payFor`: khách trả tiền, chủ tiệm hay thợ, dịch vụ gì, được mấy sao.
  - `loseCustomer` và `seatCustomer`: khách bỏ về.
  - Lên tim, học xong khoá.
- **Số đếm trong ngày** gồm cả những số `DayStats` chưa có: khách chủ tiệm làm 3 sao, khách do thợ làm, khách theo từng dịch vụ.
- **Số đếm trong tháng:** tiền kiếm, khách phục vụ, khách chủ tiệm làm 3 sao, tim khách quen lên, khoá học đã đóng tiền.
- **Số đếm cả đời tiệm, cho lô B** (lô A đã bắt đầu ghi):
  - tổng khách chủ tiệm làm 3 sao;
  - tổng nhiệm vụ trong ngày đã xong;
  - số khách ngày đông nhất;
  - lãi cao nhất một ngày;
  - đã có ngày "vẹn" chưa.
- **Ghi lại 3 ngày đã xong gần nhất** (khách, tiền kiếm, tip, khách chủ tiệm làm 3 sao, khách do thợ làm) để tính mục tiêu. Ghi từ ngày 1, kể cả trước khi nút mở.
- **Việc xử lý `dayEnded` ở phần hình không được đếm hay chốt gì**, vì nó bị phát lại khi mở game.

### 8.3 Bốc nhiệm vụ

- **Khi nào bốc:**
  - Ở `startDay`, khi nút Nhiệm vụ đã mở.
  - Ở `fromSave`, nếu nút đã mở mà nhiệm vụ đang có không phải của hôm nay. Trường hợp này là tiệm cũ, hoặc ô lưu từ trước lô A. Game tự lưu mỗi 10 giây, nên tiệm cũ gần như luôn mở lại giữa ngày. **(em quyết, sau khi người đọc thử hỏi)**
    - Ô lưu đang ở bảng tổng kết (`dayOver`): không bốc gì cho hôm nay. Sáng mai bốc như thường. Việc tháng cũng chờ tới sáng mai.
    - Còn dưới 2 giờ trong game (`QUEST_MIN_LEFT_MIN`): không bốc việc trong ngày. Việc tháng vẫn bốc.
    - Còn lại: bốc 3 việc như thường, nhưng mục tiêu và tiền thưởng nhân với phần ngày còn lại (số phút còn lại / 720). Mục tiêu ít nhất là 1; mức sàn của mục tiêu và tiền thưởng cũng nhân theo.
  - Việc tháng cũng xét như vậy theo tháng.
- **Dòng ngẫu nhiên riêng:** tạo từ ngày và `nextId`, như `planBooking`. Đổi nhiệm vụ cũng rút từ dòng riêng, không đụng `this.rng`.
- **Mốc đếm:** mỗi nhiệm vụ lưu số đếm lúc giao. Tiến độ = số đếm bây giờ − mốc. Nhờ vậy việc đổi giữa ngày, hoặc giao giữa tháng, đều đếm từ lúc giao.

### 8.4 Mục tiêu và tiền thưởng

Gọi `tb` là trung bình của 3 ngày đã xong gần nhất. Chưa có ngày nào thì lấy số mặc định ở mục 10. Mọi số tiền làm tròn tới 10.000 đ.

| Việc | Mục tiêu |
|---|---|
| Phục vụ khách | `max(5, round(0,8 × tb.khách))` |
| Tự tay 3 sao | `clamp(round(0,8 × tb.chủ3sao), 2, 6)` |
| Kiếm tiền | `max(150.000, 0,8 × tb.tiềnKiếm)` |
| Tip | `max(20.000, 0,8 × tb.tip)` |
| Lượt dịch vụ | `max(2, round(0,8 × tb.khách / số dịch vụ làm được))` |
| Thợ làm khách | `max(3, round(0,8 × tb.thợ))` |
| Tháng: tiền, khách, tự tay 3 sao | như việc trong ngày tương ứng × số ngày còn lại của tháng; tự tay 3 sao tối thiểu 4 |

- **Thưởng thường của một việc trong ngày:** `max(30.000, 5% × tb.tiềnKiếm)`.
- "Tự tay làm 3 sao" và "Không để khách nào bỏ về" được ×1,5.
- Việc tháng được 5 × thưởng thường, nhân theo số ngày còn lại / 3 khi giao giữa tháng.
- **Nhắm mức thưởng:** cả 3 việc trong ngày cộng lại tối đa khoảng 1/5 tiền kiếm trung bình (2 việc ×1,5 + 1 việc thường = 4 × 5% = 20%). Đây là hướng để chỉnh số, không phải giới hạn code phải ép. Tiệm nhỏ có mức sàn 30.000 đ nên được nhiều hơn tỉ lệ đó. **(em quyết, sau khi người đọc thử hỏi)**

### 8.5 Xét xong, hết ngày, sang tháng

- **Mỗi lần số đếm đổi, xét nhiệm vụ đang mở:** đủ thì đánh dấu xong, cộng tiền vào két và vào dòng "thưởng nhiệm vụ" của ngày, rồi phát sự kiện `questDone`.
- **Ở nhánh hết ngày của `step`, trước khi phát `dayEnded`:**
  - xét "Không để khách nào bỏ về";
  - ghi ngày vào 3 ngày gần nhất;
  - cập nhật số cả đời (ngày đông, lãi cao nhất, ngày vẹn).

  Nhánh này chỉ chạy một lần, vì `dayOver` được lưu. Mở lại game thì `fromSave` chỉ phát lại `dayEnded` cho phần hình.
- **Ở `startDay`:**
  - Bỏ việc trong ngày cũ, bốc 3 việc mới, trả lượt đổi.
  - Nếu là ngày đầu tháng: bỏ việc tháng cũ, xoá số đếm tháng, bốc việc tháng mới, phát sự kiện cho toast tháng mới.

### 8.6 Đổi

- `swapQuest(i)` báo lỗi nếu không còn lượt, nếu việc đó đã xong, hoặc nếu đang hết ngày.

### 8.7 Huy hiệu (lô B)

- **Danh sách 20 huy hiệu là một bảng dữ liệu:** mỗi huy hiệu có id cố định, điều kiện tính từ trạng thái tiệm và số đếm, và tiến độ (nếu đếm được).
- **Lưu:** id huy hiệu → ngày được trao, hoặc 0 với "Có từ trước". Thêm huy hiệu sau này không phải nâng save.
- **Lúc xét:** sau mỗi chỗ trạng thái có thể đổi (trả tiền, kê đồ, mở tầng, mở dịch vụ, thuê người, học xong, lên tim, khách VIP, pha công thức) và lúc hết ngày.
  - Có huy hiệu mới thì phát sự kiện `badge`, nếu nút Nhiệm vụ đã mở.
  - Nếu chưa mở thì trao lặng lẽ.
- **Lần mở đầu sau lô B** (ô lưu chưa có danh sách huy hiệu):
  - xét tất cả, trao với ngày 0;
  - không phát sự kiện `badge`, chỉ phát một sự kiện cho toast "Tiệm đã có sẵn {n} huy hiệu".

### 8.8 Save và tiệm cũ

- **Lô A, save v15:** thêm khối tiến độ gồm 3 ngày gần nhất, số đếm trong ngày và trong tháng, số đếm cả đời, việc trong ngày (mốc, mục tiêu, thưởng, xong hay lỡ), việc tháng, lượt đổi, và ngày đã xem bảng.
  - Ô lưu cũ không có khối này thì nhận khối trống. Hư chỗ nào thì sửa chỗ đó, không bao giờ vì vậy mà mất tiệm.
  - Đông cứng `tests/fixtures/save-v14.json`.
- **Lô B, save v16:** thêm danh sách huy hiệu. Ô lưu cũ không có thì nhận "chưa xét", để lần mở đầu trao "Có từ trước".
  - Đông cứng `tests/fixtures/save-v15.json`.

## 9. Hai lô

### Lô A: lịch tháng và nhiệm vụ (save v15)

- Tháng trên thanh trên cùng.
- Nút Nhiệm vụ mở từ ngày 8: khoá, "Mới", bàn tay, chấm đỏ.
- Bảng Nhiệm vụ: việc trong ngày, việc tháng, đổi, dòng giải thích lần đầu.
- Đếm, bốc, xét xong, trả thưởng, toast, dòng "Thưởng nhiệm vụ" ở bảng tổng kết.
- Ghi các số cả đời cho lô B.
- Save v15 cùng bản lưu mẫu v14.
- **Test tự động phải có:**
  - các hàm tháng, năm;
  - chỉ bốc việc tiệm làm được;
  - không trùng việc hôm qua khi còn việc khác;
  - mục tiêu và thưởng theo 3 ngày gần nhất và số mặc định;
  - trả thưởng đúng một lần, kể cả sau khi lưu rồi mở lại ở bảng tổng kết;
  - "Không để khách nào bỏ về" xong lúc đóng cửa, lỡ khi có người bỏ về;
  - đổi việc đếm từ lúc đổi, mỗi ngày một lần;
  - sang tháng bỏ việc cũ và bốc việc mới;
  - giao giữa tháng thì mục tiêu và thưởng theo số ngày còn lại;
  - mở ô lưu cũ giữa ngày thì mục tiêu và thưởng theo phần ngày còn lại; mở lúc còn dưới 2 giờ, hoặc ở bảng tổng kết, thì hôm đó không có việc trong ngày;
  - việc khách quen lên tim không ra khi chắc chắn không kịp;
  - với cùng hạt giống, khách tới và thợ ứng tuyển giống hệt bản trước lô A;
  - nâng save v14 lên v15.
- **Em tự chơi thử trên trình duyệt cỡ iPhone:**
  - dòng tháng vừa thanh trên cùng kể cả có sao VIP;
  - ngày 8 có bàn tay;
  - bảng mở ra đúng như bản phác;
  - xong việc thì có tiền bay lên và toast;
  - đổi việc được;
  - sang tháng ra việc mới.

### Lô B: thành tựu (save v16)

- Hai nút thẻ trong bảng, lưới 20 huy hiệu với biểu tượng vẽ bằng code theo nét A.
- Ô chi tiết, bảng vàng, tiếng mừng.
- Trao lặng lẽ trước ngày 8. Trao "Có từ trước" cho tiệm cũ, kèm một toast.
- Save v16 cùng bản lưu mẫu v15.
- **Test tự động phải có:**
  - từng điều kiện của 20 huy hiệu;
  - tiến độ của huy hiệu đếm được;
  - tiệm cũ được trao "Có từ trước" mà không có sự kiện bảng vàng;
  - trao một lần;
  - nâng save v15 lên v16.
- **Em tự chơi thử:**
  - lưới vừa thẻ;
  - tên dài nhất không tràn;
  - bảng vàng hiện lần lượt;
  - mở một ô lưu cũ thì có toast "Tiệm đã có sẵn {n} huy hiệu" và không có bảng vàng nào.

## 10. Số khởi đầu (`src/config.ts`)

| Tên | Số | |
|---|---|---|
| `DAYS_PER_MONTH` | 3 | |
| `MONTHS_PER_YEAR` | 12 | |
| `UNLOCK_DAY.quests` | 8 | **anh duyệt** |
| `QUESTS_PER_DAY` | 3 | **anh duyệt** |
| `QUEST_SWAPS_PER_DAY` | 1 | **anh duyệt** |
| `QUEST_RECENT_DAYS` | 3 | |
| `QUEST_TARGET_SHARE` | 0,8 | |
| `QUEST_REWARD_SHARE` | 0,05 của tiền kiếm trung bình, ít nhất 30.000 đ | |
| `QUEST_MIN_LEFT_MIN` | 120 (2 giờ trong game): mở lại game sau giờ này thì hôm đó không có việc trong ngày | |
| `QUEST_HARD_FACTOR` | 1,5 (tự tay 3 sao, không ai bỏ về) | |
| `MONTH_QUEST_REWARD_FACTOR` | 5 | |
| Số mặc định khi chưa có ngày nào | 10 khách, 500.000 đ tiền kiếm, 50.000 đ tip, 3 khách tự tay 3 sao, 4 khách do thợ làm | |
| Huy hiệu | 100 và 1.000 khách, 50 khách 3 sao, 25 khách một ngày, ngày vẹn từ 15 khách, đẹp 60, 7 thợ, 1.000.000 đ, lãi 1.000.000 đ, 20 nhiệm vụ, 36 ngày | |

Tất cả là số tạm.

## 11. Để builder quyết

- **Cách tổ chức code:**
  - một file luật mới cho lịch và nhiệm vụ, một cho huy hiệu;
  - khối tiến độ nằm trong `SpaSim` hay tách riêng;
  - số đếm trong ngày mới đặt trong `DayStats` hay trong khối tiến độ.
- Tên sự kiện, tên chuỗi chữ, hệ số của dòng ngẫu nhiên riêng.
- Biểu tượng của từng việc và từng huy hiệu, miễn theo nét A (viền nâu, nét tròn đầu) và nhận ra được ở cỡ 100 px.
- Toạ độ trong bảng, miễn bố cục như bản phác và chữ không tràn ở trường hợp dài nhất: "Tự tay làm 15 khách 3 sao trong tháng", "Kiếm 12.000.000 đ trong tháng".
- Cách xếp toast và bảng vàng khi trùng lúc với toast khác.

## 12. Anh thử trên iPhone sau khi lên

- Việc trong ngày có vừa sức không: quá dễ hay quá khó.
- Thưởng có đáng không: 30.000–100.000 đ một việc với tiệm cỡ vừa.
- Có thấy chấm đỏ và toast "Xong nhiệm vụ" không.
- Nút "Đổi" có dùng tới không.
- Huy hiệu (lô B): bảng vàng có vui hay phiền, tên huy hiệu có dễ hiểu không.
