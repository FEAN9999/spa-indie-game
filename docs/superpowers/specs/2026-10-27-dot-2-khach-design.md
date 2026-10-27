# Đợt 2, phần 1: khách quen, sổ khách và khách VIP

- Ngày: 2026-10-27
- Trạng thái: anh đã duyệt (2026-10-27)
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 6 (Đợt 2). Bước 1b xem `2026-10-26-step-1b-batches-2-7-design.md`.

Cách đọc giống các spec trước: **(anh chọn)** là điều anh đã quyết, **(em đề xuất)** là em tự điền, anh sửa được. Ngày 2026-10-27 anh giao cho em tự quyết các chi tiết, nên phần lớn tài liệu là **(em đề xuất)**. Mọi con số là số khởi đầu, em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Đợt 2 chia 4 phần, làm theo thứ tự:** **(anh chọn)**
  1. Khách quen, sổ khách và khách VIP (tài liệu này).
  2. Nhân viên có tính cách, chuyên môn, đào tạo.
  3. Dịch vụ mới (đá nóng, tắm bùn, xông hơi) và pha công thức, sau khi anh chọn bố cục tiệm 3D.
  4. Tầng 2 và tầng 3, sau khi anh quyết có làm 3D hay không.
- **Phần này chia hai lô:** lô A là khách quen, thẻ thành viên và sổ khách. Lô B là khách VIP. **(anh chọn)**
- **Anh duyệt tài liệu này một lần cho cả hai lô.** Sau đó em làm liền một mạch. Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh. **(em đề xuất, giữ cách anh đã chọn ở bước 1b)**
- **Bắt đầu sau khi lô âm thanh (bước 1b, đợt 7) đã lên mạng**, để lô A dựng trên code mới nhất. **(em đề xuất)**
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Mục tiêu

- **Tiệm có những gương mặt quen.** Ngoài khách lạ ghép ngẫu nhiên, có 8 người có tên, có nghề, có chuyện đời. Họ quay lại nhiều lần và chuyện của họ mở dần.
- **Người chơi có lý do chơi tiếp:** muốn biết chuyện của cô Hạnh ra sao, muốn gom đủ tim, đủ trang sổ.
- **Chủ tiệm vẫn có việc tự tay làm khi tiệm lớn** (spec chung mục 5.2):
  - Khách quen thân nhanh gấp đôi khi chủ tiệm tự phục vụ.
  - Khách VIP chỉ chủ tiệm mới phục vụ được.
- **Phần luật chơi dùng lại được khi chuyển sang 3D.** Phần hình (bong bóng lời, sổ khách) giữ đơn giản, kiểu thẻ kem viền nâu như tab Kho.

## 3. Chưa làm ở phần này

- Tầng, dịch vụ mới, tính cách nhân viên, nhiệm vụ, sự kiện. Nút "Nhiệm vụ" vẫn báo "Tính năng này có ở bản sau".
- **Màn hình hội thoại và chọn câu trả lời.** Khách quen chỉ nói qua bong bóng lời ngắn. **(em đề xuất)**
- **Tặng quà cho khách** hay chọn món khách thích. Độ thân chỉ tăng nhờ phục vụ tốt. **(em đề xuất)**
- **Chân dung VIP vẽ bằng Gemini.** VIP vẽ bằng code như mọi nhân vật khác (xem mục 5). **(em đề xuất)**
- Đổi kiểu khách người nổi tiếng đang có. Người nổi tiếng giữ nguyên, VIP là kiểu khách riêng. **(anh đồng ý)**

## 4. Điều cấm (dính là coi như hỏng)

Giữ mọi điều cấm của bước 1b (spec bước 1b mục 4), thêm:

- **Thành game đọc chữ:**
  - Mỗi câu khách nói dài tối đa 2 dòng.
  - Không có màn hình hội thoại chặn tay người chơi.
  - Câu nào lỡ không kịp đọc thì đọc lại được trong sổ khách.
- **Phạt nặng tay:** tim đã có thì không bao giờ mất. Chuyện đã mở thì không bao giờ khóa lại.
- **Dồn khách quen vào một lúc:**
  - Tiệm cũ đã qua ngày 7 cập nhật bản mới thì vẫn gặp khách quen lần lượt, mỗi người cách nhau 2 ngày, không đổ ra hết một lần.
  - Mỗi ngày có tối đa 3 khách quen ghé.
- **Bắt chủ tiệm bỏ khách thường để chạy theo VIP khi chưa có ai làm thay.** VIP chỉ bắt đầu hẹn khi tiệm đã có kỹ thuật viên.
- **Tên VIP trùng tên người nổi tiếng thật.**
- **Bản mới làm mất hay hỏng tiệm cũ.**

## 5. Các cách đã cân nhắc

| Việc | Cách | Được | Mất | Kết quả |
|---|---|---|---|---|
| Chia việc | **Hai lô: khách quen trước, VIP sau** | Chơi được khách quen sớm. VIP dựng tiếp trên phần đã có (khách có tên riêng, sổ khách). Lô nhỏ, dễ kiểm | Hai lượt kiểm tra và đưa lên, bản lưu đổi phiên bản hai lần | **Anh chọn** |
| | Một lô làm hết | Một lượt kiểm tra, bản lưu đổi một lần | Lâu mới chơi được. Lỗi phần này lan sang phần kia | Loại |
| | VIP trước, khách quen sau | Đánh thẳng vào nỗi lo "tiệm lớn thì nhạt" | Cả nhà đang ở đầu game nên chưa gặp VIP. Phần khách có tên phải làm cho VIP rồi sửa lại cho khách quen | Loại |
| Khách quen | **8 người làm tay, có tên và chuyện riêng** | Chuyện có hồn, nhớ được từng người | Hữu hạn, em phải viết khoảng 50 câu | **Em đề xuất, anh đồng ý** |
| | Sinh ngẫu nhiên từ mẫu | Vô tận, ít phải viết | Chuyện na ná nhau, không ai nhớ được ai | Loại |
| Cách khách kể chuyện | **Bong bóng lời 1–2 dòng trên đầu khách, đọc lại trong sổ** | Tiệm vẫn chạy, đúng tinh thần "không phải game toàn chữ" | Lỡ mắt là phải mở sổ đọc lại | **Em đề xuất, anh đồng ý** |
| | Màn hình hội thoại riêng | Đọc thoải mái | Chặn tay người chơi, thành game đọc chữ | Loại |
| Khách VIP | **Kiểu khách riêng, có tên, hẹn trước** | Có việc để mong chờ, người chơi tự sắp xếp | Thêm luật hẹn lịch | **Em đề xuất, anh đồng ý** |
| | Nâng người nổi tiếng hiện có thành VIP | Ít việc | Người nổi tiếng tới ngẫu nhiên, nhân viên đang phục vụ được, đổi luật làm rối tiệm cũ | Loại |
| Hình khách quen và VIP | **Vẽ bằng code, mỗi người một món đồ riêng** | Đồng nét với nhân vật đang có (spec chung mục 4.4) | Tốn công vẽ 12 món đồ, mỗi món 3 hướng | **Em đề xuất** |
| | Chân dung bằng Gemini | Đẹp, nhanh | Lệch nét. Phải hỏi anh từng lần | Loại |

## 6. Lô A: khách quen, thẻ thành viên, sổ khách

### 6.1 Tám khách quen

Mỗi người có:

- **Ngoại hình cố định:** màu da, kiểu tóc, màu tóc, màu áo cố định, cộng một món đồ riêng để nhận ra ngay.
- **Một kiểu khách làm nền.** Độ kiên nhẫn, tip, cách chấm điểm, tốc độ đi và bản mini-game dễ hay khó đều lấy theo kiểu khách đó (spec bước 1b mục 9.3).
- **Một dịch vụ ưa thích.** Tiệm chưa có dịch vụ đó thì khách chọn dịch vụ khác đang có, như khách thường.

**(em đề xuất cả bảng)**

| Thứ tự gặp | Tên | Nghề | Nhận ra bằng | Thích | Tính như | Mạch chuyện | Quà khi đủ 5 tim |
|---|---|---|---|---|---|---|---|
| 1 | Cô Hạnh | bán bánh mì đầu hẻm | tạp dề đỏ | massage | dân văn phòng (vội) | đứng bán cả ngày nên đau lưng, con gái Thảo sắp cưới, lo đám cưới | dẫn Thảo tới, mở khách quen Thảo |
| 2 | Vy | sinh viên mỹ thuật | ống đựng tranh đeo vai | gội đầu | sinh viên | dành dụm tiền đi gội, xin ngồi vẽ ký họa tiệm, được chọn đi triển lãm | tặng bức tranh vẽ tiệm: món trang trí mới "Tranh của Vy" |
| 3 | Chú Sáu | chạy xe ôm | nón bảo hiểm cối | gội đầu | cô chú lớn tuổi | bụi đường nên ghé gội cho mát, cháu nội ôn thi đại học, cháu thi đậu | chú chở thêm khách tới: từ đó mỗi ngày tiệm có thêm 1 khách |
| 4 | Anh Khoa | lập trình viên | tai nghe đeo cổ | đắp mặt nạ | dân văn phòng | thức khuya chạy dự án, bị sếp la, được thăng chức | làm thẻ cho cả phòng: tiệm nhận 300.000 đ |
| 5 | Bà Tư | chủ sạp vải chợ Bến Thành | kính gọng vàng, khăn lụa | massage | khách khó tính (chơi bản khó) | chê đủ thứ, lần đầu khen một câu, kể chuyện sạp vải mấy chục năm | tặng tấm bình phong lụa: món trang trí mới |
| 6 | Ông Ba | thầy giáo về hưu | kính lão, quạt giấy | massage | cô chú lớn tuổi | đau vai vì cầm phấn mấy chục năm, kể chuyện học trò cũ, học trò cũ về thăm | lì xì tiệm 200.000 đ |
| 7 | Thảo | kế toán, cô dâu sắp cưới | kẹp tóc hoa trắng | đắp mặt nạ | dân văn phòng | lo da xấu trước ngày cưới, chụp ảnh cưới, đám cưới xong ghé khoe | giới thiệu Lan, mở khách quen Lan |
| 8 | Lan | bán hoa chợ hoa Hồ Thị Kỷ | bó hoa cúc ôm trước ngực | đắp mặt nạ | sinh viên (ít tiền) | dậy 3 giờ sáng lấy hoa, mơ mở tiệm hoa riêng, mở được tiệm | tặng một "Bình hoa đào" (món đang có trong bộ Sài Gòn, tính vào thưởng gom bộ như bình mua) |

- Tên và nghề đều tự đặt, không lấy theo người thật.
- Câu chữ cụ thể em viết lúc làm, theo mạch chuyện trên. Anh đọc khi chơi, thấy câu nào không hợp thì em sửa.

### 6.2 Khi nào gặp khách quen, khi nào họ ghé

**(em đề xuất)**

- **Gặp lần đầu:**
  - Người 1 tới 6 lần lượt xuất hiện, mỗi người cách nhau 2 ngày. Người đầu tiên tới vào ngày 7, tức một ngày sau ngày người nổi tiếng bắt đầu ghé.
  - Với tiệm mới, 6 người gặp vào các ngày 7, 9, 11, 13, 15, 17.
  - Tiệm cũ đã qua ngày 7 thì gặp người 1 vào ngày đầu tiên chơi bản mới, rồi cứ 2 ngày thêm một người (mục 4).
  - Thảo và Lan chỉ xuất hiện khi được giới thiệu.
  - Ngày gặp lần đầu thì người đó chắc chắn ghé.
- **Những lần sau:** mỗi sáng, mỗi khách quen đã gặp có khả năng ghé hôm đó:
  - Chưa có thẻ: khoảng 1 phần 3, tức chừng 3 ngày một lần.
  - Có thẻ: khoảng 1 phần 2, tức chừng 2 ngày một lần.
  - Tối đa 3 khách quen một ngày.
- **Giờ ghé:** mỗi khách quen ghé hôm đó được gán một giờ ngẫu nhiên trong khoảng 9 giờ sáng tới 5 giờ chiều. Tới giờ đó, lượt khách kế tiếp là khách quen thay cho một khách lạ. Nhờ vậy tổng số khách mỗi ngày gần như không đổi và tiền bạc không lệch.
- **Hết ghế:** khách quen ghé mà hết ghế thì đi về như khách thường, không mất tim, và có thể ghé lại ngày khác.

### 6.3 Tim thân thiết

**(em đề xuất)**

- **Điểm mỗi lần phục vụ:**

| Kết quả | Chủ tiệm làm | Nhân viên làm |
|---|---|---|
| 3 sao | +4 | +2 |
| 2 sao | +2 | +1 |
| 1 sao | 0 | 0 |
| Hết kiên nhẫn, bỏ về | −2 | −2 |

- **Tim:** đủ 4, 8, 12, 16, 20 điểm thì được tim thứ 1 tới 5.
- **Trừ điểm:** điểm bị trừ không bao giờ xuống dưới mức của tim đang có (mục 4).
- **Nhịp:** chủ tiệm làm 3 sao đều tay thì mỗi lần ghé được một tim. Đủ 5 tim mất khoảng 2 tuần trong game, tức khoảng nửa giờ chơi. Nhân viên làm thì chậm gấp đôi.
- **Đủ 5 tim:** điểm không tăng nữa. Khách vẫn ghé đều như người có thẻ.
- **Nhân viên nhường khách quen cho chủ tiệm:**
  - Bây giờ nhân viên rảnh là mời khách ngay khi có giường trống. Nếu giữ vậy thì chủ tiệm gần như không bao giờ kịp tự phục vụ khách quen, và mục tiêu ở mục 2 không thành.
  - Vì vậy khi khách quen đang chờ và có giường hợp đang trống, nhân viên đợi 10 giây cho chủ tiệm mời trước. Quá 10 giây mà chủ tiệm chưa mời thì nhân viên mời như thường.
  - 10 giây chỉ tính lúc có giường hợp đang trống, để lúc giường bận thì chủ tiệm không bị mất lượt.
  - Khách quen không vì vậy mà phải chờ lâu hơn khách khác: 10 giây chỉ là một phần nhỏ của độ kiên nhẫn.

### 6.4 Bong bóng lời và câu chuyện

**(em đề xuất)**

- **Bong bóng lời:** khung kem viền nâu có đuôi chỉ vào đầu khách, tối đa 2 dòng. Hiện khoảng 4 giây, câu chuyện thì khoảng 6 giây, rồi mờ dần. Bong bóng không chặn chạm.
- **Lúc nào khách nói:**
  - **Gặp lần đầu:** khách vừa vào cửa thì nói câu giới thiệu. Ví dụ: "Cô bán bánh mì đầu hẻm nè. Nghe nói tiệm mới mở, cô ghé thử."
  - **Những lần ghé sau:** khách vừa vào cửa thì nói câu chào ngắn, kèm tên. Câu chào lấy từ một bộ câu chung.
  - **Vừa được thêm tim:** lúc trả tiền khách kể đoạn chuyện của tim đó. Mỗi người có 5 đoạn, mỗi tim một đoạn.
  - **Nhận thẻ thành viên hay tặng quà:** khách nói câu cảm ơn, quà hiện ra cùng lúc.
- **Nhận ra khách quen trong tiệm:** lúc khách quen ngồi chờ, cạnh biểu tượng dịch vụ trên đầu có thêm một trái tim nhỏ. Chạm vào khách quen thì mời vào như khách thường.
- **Tim tăng:** lúc trả tiền hiện "+1 tim" bay lên, kèm một tiếng động vui. Tiếng động dùng bộ âm thanh của lô 7.

### 6.5 Thẻ thành viên

**(em đề xuất)**

- Đủ 3 tim thì khách nhận thẻ thành viên.
- Khách có thẻ:
  - Ghé đều hơn (mục 6.2).
  - Chịu chờ lâu hơn: kiên nhẫn gấp 1,5 lần.
- Thẻ hiện cạnh tên khách trong sổ khách.

### 6.6 Quà

**(em đề xuất)**

- **Quà tiền:** cộng thẳng vào tiền tiệm, hiện đồng xu bay lên như lúc khách trả tiền. Ngày đó tiền quà ghi vào phần thu của bảng tổng kết.
- **Quà là khách quen mới:** người được giới thiệu ghé ngay ngày hôm sau.
- **Quà là món trang trí:** món đó hiện trong bảng mua đồ với giá 0 đ và nhãn "Quà". Đặt được một lần. Đặt xong thì dời được như mọi món khác, nhưng **không bán được**, để không lỡ tay mất quà đã nhận (mục 4). Chạm nút bán thì game báo "Quà không bán được".
- **Quà "thêm 1 khách mỗi ngày"** của chú Sáu: tiệm có thêm một lượt khách lạ trong ngày, mãi về sau.
- **Ba món trang trí mới phải vẽ**, cùng phong cách A:
  - "Tranh của Vy": giá vẽ có bức tranh vẽ tiệm, 1 ô.
  - "Bình phong lụa": 2 ô.
  - "Bảng ảnh khách quen": quà gom đủ trang khách quen, 2 ô (mục 6.7).
- Điểm đẹp của các món quà cao hơn món cùng cỡ trong cửa hàng một chút.

### 6.7 Sổ khách

**(em đề xuất)**

- **Mở sổ:** một nút tròn hình cuốn sổ trên thanh trên cùng, bên trái nút tạm dừng, cùng kiểu nút tạm dừng. Từ ngày gặp khách quen đầu tiên nút mới hiện ra, kèm chữ đỏ "Mới" như các nút khác.
- **Mở sổ thì tiệm dừng,** giống các bảng khác.
- **Trang "Khách quen"** có 8 ô:
  - Người đã gặp: hình đầu, tên, số tim, thẻ nếu có.
  - Người chưa gặp: bóng mờ kèm gợi ý, ví dụ "Sắp ghé" hoặc "Cô Hạnh sẽ giới thiệu".
  - Chạm vào người đã gặp thì xem nghề, dịch vụ ưa thích và mọi câu chuyện đã mở, đọc lại được.
  - **Gom đủ trang** (cả 8 người đủ 5 tim) thì được món "Bảng ảnh khách quen".
- **Trang "Kiểu khách"** có 5 ô cho 5 kiểu khách của bước 1b:
  - Mỗi ô có hình, tên kiểu và số lần đã phục vụ.
  - Kiểu chưa gặp hiện bóng mờ kèm "Từ ngày X".
  - Trang này không có quà, chỉ để xem cho vui và nhớ mặt khách.
- **Tiệm cũ:** kiểu khách nào đã tới ngày bắt đầu gặp thì coi như đã gặp, với số lần phục vụ tính từ 0. Riêng người nổi tiếng thì phải phục vụ một lần mới tính là đã gặp.

### 6.8 Dẫn dắt

**(em đề xuất)**

- Lần đầu khách quen ghé, hiện một lời nhắc ngắn: "Khách quen! Phục vụ tốt để thêm tim. Chủ tiệm tự làm thì tim tăng gấp đôi."
- Nút sổ khách có chữ "Mới" cho tới lần đầu mở. Lần đầu mở sổ thì có một câu giải thích ngắn.
- Mỗi lời nhắc chỉ hiện một lần, lưu lại như các lời nhắc của bước 1b.

### 6.9 Lưu game

Bản lưu thêm:

- Từng khách quen: đã gặp chưa, điểm, có thẻ chưa, đã tặng quà chưa, hôm nay có ghé không và giờ ghé.
- Lịch gặp lần đầu: ngày bắt đầu, người kế tiếp.
- Khách đang trong tiệm là khách quen nào.
- Quà trang trí đã nhận nhưng chưa đặt.
- Số lần phục vụ mỗi kiểu khách.

Tiệm cũ mở ra có sổ khách trống và chưa gặp ai.

## 7. Lô B: khách VIP

### 7.1 Bốn khách VIP

**(em đề xuất)**

| Vai | Nhận ra bằng | Dịch vụ hẹn |
|---|---|---|
| Ca sĩ phòng trà | khăn choàng lông, micro cài áo | massage |
| Hoa hậu | vương miện nhỏ, dải băng chéo | đắp mặt nạ |
| Minh tinh điện ảnh xưa | kính mát to, khăn lụa trùm tóc | đắp mặt nạ |
| Đầu bếp nổi tiếng | mũ đầu bếp cao | gội đầu |

- Mỗi VIP có tên tự đặt. Em kiểm để không trùng tên người nổi tiếng thật (mục 4).
- Mỗi VIP có một câu khi tới và một câu cảm ơn khi được 3 sao. Câu chữ em viết lúc làm.

### 7.2 Khi nào VIP bắt đầu và cách hẹn

**(em đề xuất)**

- **Bắt đầu hẹn** khi tiệm có ít nhất 2 kỹ thuật viên (không tính người đang nghỉ việc). Lúc đó nhân viên lo được khách thường, chủ tiệm rảnh tay cho VIP.
- **Báo trước:**
  - Bảng tổng kết cuối ngày ghi lịch hẹn ngày mai, ví dụ "Ngày mai 3 giờ chiều, ca sĩ X hẹn massage".
  - Sáng hôm sau hiện lại một lời nhắc ngắn.
  - Lúc gần tới giờ hẹn, đồng hồ trên thanh trên cùng có dấu sao vàng nhỏ.
- **Giờ hẹn:** ngẫu nhiên trong khoảng 10 giờ sáng tới 5 giờ chiều.
- **Nhịp hẹn:** sau mỗi lần VIP ghé, lần hẹn sau cách 2 tới 4 ngày. Lần lượt từng VIP, hết vòng thì chọn ngẫu nhiên.
- **Chỉ hẹn VIP có dịch vụ tiệm đang làm được.** Tiệm chưa mở dịch vụ nào hợp thì chưa hẹn.

### 7.3 VIP tới tiệm

**(em đề xuất)**

- **Tới đúng giờ hẹn.** VIP vào thì có tiếng nhạc riêng ngắn, dựng từ bộ âm thanh của lô 7.
- **Không bao giờ phải bỏ về vì hết ghế:** hết ghế thì VIP đứng chờ cạnh quầy lễ tân.
- **Trên đầu VIP có ngôi sao vàng.**
- **Nhân viên không mời VIP.** Chủ tiệm phải tự chạm vào VIP để mời vào.
- **Giữ giường cho VIP:** khi VIP đang chờ, nhân viên không đưa khách khác vào giường loại VIP cần. Nhờ vậy giường trống ra là dành cho VIP.
- **Kiên nhẫn ngắn hơn khách thường** (VIP không quen chờ), không tính kiên nhẫn được cộng thêm ở mấy ngày đầu.
- **Mini-game:** chơi bản khó của dịch vụ đó (spec chung mục 5.6).

### 7.4 Thưởng và phạt

**(em đề xuất)**

- **Giá:** VIP trả gấp 3 giá dịch vụ. Tip theo số sao, cao như người nổi tiếng.
- **Đánh giá tính gấp 3:**
  - Làm tốt thì sao của tiệm lên rõ.
  - Làm hỏng (1 sao) hay để VIP bỏ về thì sao tụt rõ.
- **Lần đầu được 3 sao với một VIP:** VIP tặng ảnh có chữ ký, là món trang trí 1 ô nhận theo cách quà ở mục 6.6.
  - Bốn ảnh dùng chung một kiểu khung, trong khung là hình VIP đó.
- **Gom đủ trang VIP** (cả 4 VIP đều đã được 3 sao) thì được món "Bảng vàng", trang trí 2 ô.

### 7.5 Sổ khách: trang VIP

- Thêm trang "VIP" có 4 ô:
  - VIP đã gặp: hình, vai, số sao cao nhất, số lần ghé, đã có ảnh chữ ký chưa.
  - VIP chưa gặp: bóng mờ.
- Trang này mở khi có lịch hẹn VIP đầu tiên.

### 7.6 Dẫn dắt và lưu game

- Lần hẹn VIP đầu tiên có lời nhắc ngắn: "Khách VIP chỉ chủ tiệm phục vụ được. Nhớ có mặt đúng giờ!"
- Bản lưu thêm:
  - Lịch hẹn (ai, ngày, giờ, dịch vụ).
  - Từng VIP: đã gặp chưa, sao cao nhất, số lần, đã tặng ảnh chưa.
  - Khách đang trong tiệm là VIP nào.
- Tiệm cũ mở ra chưa có lịch hẹn nào. Lịch đầu tiên đặt vào cuối ngày đầu tiên tiệm đủ điều kiện.

## 8. Kiểm tra và tiêu chí xong

**Em tự kiểm tra ở mỗi lô, đạt hết mới đẩy lên** (giống spec bước 1b mục 12):

- **Test tự động cho luật chơi.** Ví dụ:
  - Khách quen gặp lần lượt, cách nhau 2 ngày. Tiệm cũ đã qua ngày 7 không bị đổ hết một lần.
  - Không quá 3 khách quen một ngày. Khách quen thay khách lạ nên tổng số khách không tăng (trừ quà của chú Sáu).
  - Điểm tim theo đúng bảng 6.3. Tim không bao giờ mất.
  - Đủ 3 tim thì có thẻ, đủ 5 tim thì có quà, mỗi quà chỉ một lần.
  - Quà trang trí đặt được một lần với giá 0 đ, dời được, không bán được.
  - Nhân viên nhường khách quen cho chủ tiệm 10 giây khi có giường hợp đang trống, quá 10 giây thì mời như thường.
  - Nhân viên không mời VIP và không chiếm giường VIP cần lúc VIP đang chờ.
  - VIP không bỏ về vì hết ghế.
  - VIP chỉ hẹn khi có ít nhất 2 kỹ thuật viên và tiệm có dịch vụ hợp.
- **Test đọc tiệm cũ:** bản lưu của mọi bản trước mở đúng tiệm ở bản mới, sổ khách trống.
- **Tự chơi thử trên trình duyệt ở cỡ iPhone:**
  - Gặp khách quen, đọc bong bóng, thêm tim, mở sổ, đọc lại chuyện.
  - Ở lô B: nhận lịch hẹn, phục vụ VIP.
  - Tắt giữa chừng rồi mở lại.
  - Chụp ảnh xem bong bóng chữ có bị cắt không, chữ tiếng Việt có dấu hiện đúng không.
  - Xem lỗi trong console.
- **Sau khi đẩy lên:** mở link GitHub Pages thật, xem bản mới đã lên.

**Anh xem giúp trên iPhone khi rảnh:**

- Câu chuyện của khách quen đọc có thấy vui, có muốn biết tiếp không.
- Bong bóng lời có kịp đọc không.
- VIP có làm ngày chơi hồi hộp hơn không, hay chỉ thêm việc.

**Xong khi:**

- Người chơi tự gặp khách quen, nhận ra họ trong tiệm, thấy tim tăng và đọc được chuyện của họ mà không cần ai chỉ.
- Khi tiệm đã có nhân viên làm thay, chủ tiệm có lịch hẹn VIP để mong và tự tay phục vụ.
- Tiệm cũ của cả nhà vẫn còn nguyên.

## 9. Để người làm tự quyết

- Cách viết code, cách lưu, cách nâng cấp bản lưu cũ.
- Câu chữ cụ thể của khách quen và VIP, miễn đúng mạch chuyện ở mục 6.1, mỗi câu tối đa 2 dòng, giọng Sài Gòn thân thiện.
- Tên cụ thể của 4 VIP, miễn không trùng người thật.
- Hình vẽ món đồ riêng của từng người, ba món trang trí mới, khung ảnh chữ ký, Bảng vàng, nút sổ khách, trái tim và ngôi sao trên đầu khách, miễn đúng phong cách A.
- Cách xếp chi tiết sổ khách và bong bóng lời, miễn đúng kiểu thẻ kem viền nâu và nút đủ to cho ngón cái.
- Mọi con số: điểm tim, khả năng ghé, giờ ghé, giá và kiên nhẫn của VIP, điểm đẹp của quà, tiền quà.
- Tiếng động khi thêm tim và tiếng nhạc khi VIP tới.
