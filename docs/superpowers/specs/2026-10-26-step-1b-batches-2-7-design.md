# Bước 1b, đợt 2 đến đợt 7: hoàn thiện bản chơi được

- Ngày: 2026-10-26
- Trạng thái: anh đã duyệt (2026-10-26), kể cả các chỗ em đề xuất khác spec chung
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 6 (bước 1b). Đợt 1 (lưu game, lên mạng, cài như app) đã xong, xem `2026-10-25-step-1b-batch-1-design.md`.

Cách đọc giống spec chung: **(anh chọn)** là điều anh đã quyết, **(em đề xuất)** là em tự điền, anh sửa được. Mọi con số (giá, lương, thời gian) là số khởi đầu. Em sẽ chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm 6 đợt

- **Anh duyệt tài liệu này một lần cho cả 6 đợt.** Sau đó em làm liền một mạch, không hỏi giữa chừng. **(anh chọn)**
- **Thứ tự:** **(anh chọn)**
  1. Đợt 2: tạo chủ tiệm, đặt tên tiệm, hướng dẫn ngày đầu, mở tính năng từ từ.
  2. Đợt 3: kê đồ theo ô lưới, mua giường, 2 bộ nội thất.
  3. Đợt 4: thuê nhân viên.
  4. Đợt 5: thêm mini-game đắp mặt nạ và massage, 5 kiểu khách.
  5. Đợt 6: kho và nhập hàng.
  6. Đợt 7: âm thanh.
- **Xong đợt nào là lên mạng đợt đó:** test tự động và phần em tự chơi thử trên trình duyệt đều đạt thì em tự merge vào master và đẩy lên, rồi báo anh. **(anh chọn)** Cả nhà nhận bản mới theo cách đã làm ở đợt 1.
- Mỗi đợt có kế hoạch kỹ thuật riêng. Em viết kế hoạch ngay trước khi làm đợt đó, để kế hoạch dựa trên code của đợt trước.

## 2. Mục tiêu chung

Làm xong 6 đợt này là có đủ phần "1b. Hoàn thiện đợt 1" trong spec chung mục 6. Người chơi tự tạo chủ tiệm, được dẫn từng bước ngày đầu, rồi mỗi ngày mở thêm một thứ mới: mua đồ và kê lại tiệm, thuê người, mở dịch vụ mới, nhập hàng. Tiệm có tiếng nhạc và tiếng động.

## 3. Chưa làm ở 6 đợt này

- Những thứ của đợt 2 lớn trở đi: tầng 2 và 3, dịch vụ đá nóng, tắm bùn, xông hơi, khách VIP, khách quen, tính cách nhân viên, nhiệm vụ, sự kiện. Nút "Nhiệm vụ" vẫn báo "Tính năng này có ở bản sau".
- **Kéo màn hình và phóng to thu nhỏ:** tiệm một tầng vừa khít màn hình nên chưa cần. Làm khi có tầng lớn hơn. **(em đề xuất)**
- **Xoay đồ một góc 90 độ:** nhìn chéo từ trên xuống thì xoay một món là phải vẽ thêm cả một hướng mới cho món đó, và vẽ thêm tư thế nằm ngang cho khách. Đợt này đồ chỉ lật trái phải được. Xoay thật để sau. **(em đề xuất, khác spec chung mục 5.10)**
- Dời tường, bình phong và quầy lễ tân. Mấy thứ này giữ nguyên chỗ, vì chúng chia phòng và là chỗ chủ tiệm đứng đầu ngày. **(em đề xuất)**
- Bảng hiệu ghi tên tiệm vẽ trong tiệm (xem mục 4.2).
- 7 việc nhỏ còn để lại từ lần review đợt 1. Anh muốn thì em gom làm riêng một lượt.

## 4. Điều cấm (dính là coi như hỏng)

- Bản mới làm mất hoặc hỏng tiệm cũ. Tiệm đang chơi dở ở bản nào cũng phải mở được ở mọi bản sau. Món mới thêm vào tiệm cũ lấy giá trị mặc định.
- Dồn hết tính năng mới vào ngày đầu (spec chung mục 5.14).
- Bắt người chơi chờ: nhập hàng giao ngay, thuê người làm ngay, không có "chờ tới mai".
- Có hướng dẫn chặn tay, bắt bấm đúng chỗ mới cho chơi tiếp. Hướng dẫn chỉ chỉ chỗ, người chơi vẫn làm việc khác được.
- Kê đồ xong mà khách hoặc chủ tiệm không đi tới được chỗ cần tới.
- Tải file từ ngoài vào mà chưa hỏi anh.

## 5. Các cách đã cân nhắc

| Việc | Cách | Được | Mất | Kết quả |
|---|---|---|---|---|
| Hình đồ mới, nhân vật mới | **Vẽ bằng code như các đợt trước** | Đồng nét với đồ đang có, sắc ở mọi cỡ màn hình | Tốn công vẽ | **Em chọn** (giữ quyết định ở spec chung mục 4.4) |
| | Dùng ảnh AI hoặc ảnh mua | Nhanh | Lệch nét, phạm điều cấm ở spec chung | Loại |
| Kê đồ trong giờ mở cửa | **Đang kê đồ thì giờ dừng, khách đứng yên** | Không có khách bị kẹt giữa đường, dễ hiểu với người ít chơi game | Không có cái khó "kê đồ làm phiền khách" | **Em đề xuất** |
| | Giờ vẫn chạy, khách đi vòng | Đúng chữ spec chung mục 5.3 | Khách mất kiên nhẫn vì người chơi đang loay hoay chọn chỗ đặt | Loại |
| Âm thanh | **Tạo tiếng bằng code (nhạc ngũ cung tiếng đàn tranh giả, tiếng động)** | Không phải tải file, không lo giấy phép, nhẹ, chơi không cần mạng ngay, nghe ra chất Việt | Có thể nghe hơi "máy" | **Em đề xuất** |
| | Lấy file nhạc và tiếng động CC0 trên mạng | Tiếng nhạc cụ thật | Phải tìm và tải file (hỏi anh từng file), file nặng hơn, hiếm nhạc hợp chất Việt | Dự phòng nếu anh nghe bản code không ưng |

## 6. Đợt 2: tạo chủ tiệm, đặt tên tiệm, hướng dẫn ngày đầu

### 6.1 Màn tạo chủ tiệm

- **Khi nào hiện:** mở một ô lưu trống thì vào màn này trước, xong mới vào tiệm. Tiệm cũ (có từ trước đợt này) thì hiện màn này **một lần** lúc mở, đã điền sẵn chủ tiệm và tên "Tiệm Spa" như cũ, có nút "Giữ như cũ". **(em đề xuất)**
- **Sửa lại sau:** màn tạm dừng có thêm nút "Chủ tiệm và tên tiệm". **(em đề xuất)**
- **Cách xếp:** thẻ nền kem viền nâu như màn tạm dừng.
  - Trên cùng là chủ tiệm cỡ to, cứ 2 giây quay một hướng để xem cả trước, sau và bên hông.
  - Bên dưới là 4 hàng chọn, chạm là đổi ngay trên hình:
    - Kiểu tóc: ô hình nhỏ.
    - Màu tóc, màu da, màu áo: chấm tròn màu.
  - Cuối thẻ là ô tên tiệm, rồi nút to "Mở tiệm".
- **Lựa chọn (em đề xuất):**
  - **Kiểu tóc: 4 kiểu.** Tóc ngắn (thêm mới, cho chủ tiệm là nam), tóc bob, tóc dài, tóc búi (thêm mới). Khách cũng được dùng 2 kiểu mới để đa dạng hơn.
  - **Màu tóc: 5 màu** như hiện có.
  - **Màu da: 4 màu,** thêm một tông da ngăm.
  - **Màu áo bà ba: 4 màu riêng cho chủ tiệm.** Đó là xanh ngọc (mặc định), xanh lá, đỏ đèn lồng và nâu gỗ. Khách không bao giờ mặc 4 màu này, nên liếc qua vẫn nhận ra chủ tiệm (spec chung mục 7.2).

### 6.2 Tên tiệm

- Ô nhập chữ của điện thoại (gõ tiếng Việt có dấu được), dài tối đa 24 ký tự. Có sẵn một tên gợi ý và nút xúc xắc để đổi tên gợi ý khác, ví dụ "Spa Hoa Sen", "Spa Gạch Bông", "Tiệm Gội Cô Ba", "Spa Mây Tre". Để trống thì lấy tên gợi ý. **(em đề xuất)**
- **Tên hiện ở đâu (em đề xuất):**
  - Băng rôn ngắn mỗi sáng, ví dụ "Spa Hoa Sen · Ngày 5 · Mở cửa!", hiện khoảng 2 giây rồi tự ẩn.
  - Đầu thẻ tạm dừng.
  - Từng ô lưu: "Spa Hoa Sen · Ngày 5 · 340.000 đ". Nhà có 3 người chơi chung máy thì nhìn tên tiệm là biết ô của ai.
  - Tiêu đề bảng tổng kết.
- Chưa vẽ bảng hiệu trong tiệm. Đã thử chỗ đặt: tường sau thì vướng đèn lồng của giường, mà đợt 3 cho dời giường dọc tường. Vỉa hè thì chữ quá nhỏ.

### 6.3 Hướng dẫn ngày đầu

Chỉ dạy bằng cách cho làm thật (spec chung mục 5.14). Mỗi bước là một bàn tay vẽ theo phong cách A chỉ vào đúng chỗ, kèm một câu ngắn trong ô gợi ý kem viền nâu. Bước nào xong thì tự tắt và không hiện lại, kể cả khi tắt game mở lại giữa chừng. Chỉ tiệm mới có hướng dẫn này. **(em đề xuất)**

1. Khách đầu tiên ngồi xuống thì tay chỉ vào khách: "Chạm vào khách để mời gội đầu".
2. Trong mini-game gội đầu lần đầu, mỗi bước có một ngón tay mờ làm mẫu động tác: vuốt qua lại, giữ yên, vuốt lau. Người chơi chạm vào là ngón tay mẫu biến mất.
3. Khách trả tiền lần đầu thì tay chỉ lên số tiền: "Tiền công và tiền tip cộng vào đây". 3 giây sau tay chỉ ngôi sao: "Khách vui thì sao tăng, tiệm đông khách hơn". Mỗi câu tự ẩn sau 3 giây.
4. Lần đầu thanh kiên nhẫn của một khách tụt dưới một nửa thì tay chỉ vào thanh: "Khách chờ lâu sẽ bực rồi bỏ về".
5. Bảng tổng kết đầu tiên có thêm một dòng nhỏ: "Bấm Ngày mới để mở cửa tiếp. Game tự lưu."

**Dễ trước khó sau (em đề xuất):**

| | Ngày 1 | Ngày 2 | Ngày 3 | Từ ngày 4 |
|---|---|---|---|---|
| Khách kiên nhẫn lâu hơn | ×1,6 | ×1,4 | ×1,2 | như thường |
| Thời gian mini-game và mốc chấm sao | +10 giây | +10 giây | +5 giây | như thường |
| Khách tới thưa hơn | ×1,3 | như thường | như thường | như thường |

### 6.4 Mở tính năng từ từ

- **Lịch mở (em đề xuất):**

| Nút ở thanh dưới | Mở từ | Có từ đợt |
|---|---|---|
| Xây dựng | đầu ngày 2 | 3 |
| Nhân viên | đầu ngày 3 | 4 |
| Dịch vụ (mở dịch vụ mới) | đầu ngày 4 | 5 |
| Kho (nằm trong nút Dịch vụ) | đầu ngày 5 | 6 |
| Nhiệm vụ | chưa có | |

- **Nút chưa mở:** mờ đi, có ổ khoá nhỏ. Chạm vào thì báo "Mở vào ngày 3".
- **Nút vừa mở:**
  - Có nhãn "Mới". Sáng ngày đó, bàn tay chỉ vào nút kèm một câu, ví dụ "Có tiền rồi thì mua thêm giường ở đây".
  - Lần đầu mở bảng của nút đó, đầu bảng có một dòng giải thích ngắn.
- **Tiệm đã qua ngày mở:** tính năng mở luôn. Nút vẫn có nhãn "Mới" và dòng giải thích lần đầu, nhưng không có bàn tay chỉ. Như vậy tiệm cũ không bị dồn 4 bàn tay cùng lúc.
- Ở đợt 2, các nút này mới chỉ khoá và mở theo lịch. Bấm vào nút đã mở thì vẫn báo "Tính năng này có ở bản sau", cho tới khi đợt có tính năng đó làm xong.

## 7. Đợt 3: kê đồ theo ô lưới, mua giường, 2 bộ nội thất

### 7.1 Chế độ kê đồ

- Bấm "Xây dựng" là vào chế độ kê đồ:
  - Giờ dừng, khách và chủ tiệm đứng yên. **(em đề xuất, mục 5)**
  - Sàn hiện lưới ô mờ. Gạch bông vốn đã đúng bằng một ô.
  - Thanh dưới đổi thành bảng mua đồ, có 3 nhóm: Giường, Ghế chờ, Trang trí. Mỗi món ghi giá và điểm đẹp.
  - Có nút "Xong" để ra.
- **Mua một món:**
  - Chạm vào món trong bảng thì món đó hiện nổi lên ở chỗ trống gần giữa tiệm.
  - Kéo ngón tay ở bất cứ đâu trên màn hình là món đó trượt theo từng ô. Món nằm trên ngón tay một chút để ngón tay không che mất.
  - Bảng mua đồ tự thu nhỏ trong lúc kéo.
  - Ô món chiếm có viền xanh nếu đặt được, viền đỏ nếu không. Có ba nút: Đặt, Lật, Thôi.
  - Bấm "Đặt" ở chỗ viền đỏ thì game báo lý do: "Chắn lối đi", "Đè lên đồ khác" hoặc "Giường gội phải sát tường sau".
  - Đặt xong mới trừ tiền. Thiếu tiền thì nút mua mờ đi, kèm giá còn thiếu.
- **Đồ đã có:** chạm vào là chọn. Kéo để dời, miễn phí. Có nút Lật và Bán (lấy lại một nửa giá). Đồ đang có khách nằm hoặc ngồi, hoặc khách đang đi tới, thì chưa dời hay bán được: "Đang có khách". **(em đề xuất)**
- **Luật đặt (em đề xuất):**
  - Không đặt lên tường, cửa, bình phong, quầy lễ tân, hay ô ngay trong cửa.
  - Mọi giường, chỗ ngồi chờ, chỗ đứng làm của chủ tiệm và quầy phải luôn đi tới được từ cửa. Món nào làm chắn đường thì không đặt được.
  - Giường gội phải đặt đầu sát tường sau, vì chậu gội gắn tường (spec chung mục 7.3). Giường loại khác (đợt 5) đặt ở đâu cũng được.
  - Mỗi giường có một ô cạnh giường để chủ tiệm hoặc nhân viên đứng làm, ô này phải để trống. Lật giường thì ô đó đổi sang bên kia.
  - Tiệm phải còn ít nhất một giường gội và một ghế chờ, nên không bán được món cuối cùng.
- **Mua nhanh:** hai chỗ giường trống viền đứt có dấu + vẫn còn. Chạm vào là hỏi "Mua giường gội 300.000 đ?", đồng ý là giường đặt ngay chỗ đó. Chỗ đó đã có món khác thì dấu + tự ẩn.
- **Ra khỏi chế độ kê đồ:** khách và chủ tiệm tự tìm đường mới theo cách kê mới.
- **Những thứ đang vẽ dính vào nền phải tách ra để dời được (em đề xuất):**
  - Đèn lồng trên tường đi theo giường gội.
  - Thảm cói dưới ghế chờ đi theo ghế.
  - Cửa chớp và đồng hồ giữ nguyên chỗ trên tường.

### 7.2 Đồ để mua và 2 bộ nội thất

**Giá và điểm đẹp (em đề xuất):**

| Món | Giá | Điểm đẹp | Bộ |
|---|---|---|---|
| Giường gội | 300.000 đ | 0 | |
| Ghế chờ 3 chỗ (mây, nệm đất nung) | 150.000 đ | 1 | |
| Chậu cây | 40.000 đ | 1 | |
| Bàn trà | 60.000 đ | 2 | |
| Bồn cây thấp | 60.000 đ | 2 | |
| Kệ dép | 50.000 đ | 1 | |
| Kệ sản phẩm | 120.000 đ | 3 | Sài Gòn xưa |
| Tủ khăn | 150.000 đ | 3 | Sài Gòn xưa |
| Bể sen sứ xanh | 150.000 đ | 4 | Sài Gòn xưa |
| Bình hoa đào | 80.000 đ | 2 | Sài Gòn xưa |
| Tủ chè (mới) | 250.000 đ | 5 | Sài Gòn xưa |
| Chum sứ xanh trắng (mới) | 120.000 đ | 3 | Sài Gòn xưa |
| Ghế chờ tre 3 chỗ (mới) | 180.000 đ | 3 | Tre làng |
| Bàn trà tre (mới) | 70.000 đ | 2 | Tre làng |
| Kệ tre (mới) | 100.000 đ | 3 | Tre làng |
| Đèn tre đứng (mới) | 60.000 đ | 2 | Tre làng |
| Chum nước gốm (mới) | 90.000 đ | 3 | Tre làng |
| Cây cau cảnh (mới) | 80.000 đ | 3 | Tre làng |

- **Bộ Sài Gòn xưa:** đồ đang có trong tiệm, thêm tủ chè và chum sứ. Tiệm mới có sẵn 4/6 món, mua đủ 2 món kia là thành bộ.
- **Bộ Tre làng:** bộ thứ hai, vẽ mới, cùng nét phong cách A: tre vàng, mây, gốm nâu, lá xanh.
- **Gom đủ bộ:** khi trong tiệm có đủ 6 món của một bộ, điểm đẹp của các món trong bộ được nhân 1,5. Bảng mua đồ ghi tiến độ, ví dụ "Sài Gòn xưa 4/6", đủ bộ thì hiện "Đủ bộ!".
- **Tiệm đẹp thì đông khách** (spec chung mục 5.7): tổng điểm đẹp càng cao thì khách tới càng dày, nhanh nhất là dày hơn khoảng một phần tư so với tiệm trơn. **(em đề xuất)**

### 7.3 Lưu game

Bản lưu thêm danh sách đồ: loại, ô, đã lật hay chưa. Tiệm cũ được xếp đúng như sơ đồ ở spec chung mục 7.3. Khách đang nằm hay đang ngồi trong tiệm cũ vẫn ở đúng giường, đúng ghế.

## 8. Đợt 4: thuê nhân viên

### 8.1 Tuyển người

- Nút "Nhân viên" mở bảng có hai phần: "Đang làm" và "Tuyển người".
- **Tuyển người:**
  - Mỗi sáng có 3 ứng viên mới.
  - Mỗi người có tên tiếng Việt, vai trò (lễ tân hoặc kỹ thuật viên), 4 chỉ số chấm từ 1 đến 5 chấm, và lương mỗi ngày.
  - Khoảng 1 trong 10 ứng viên là người giỏi hiếm gặp, chỉ số 4 hoặc 5 chấm, có nhãn "Hiếm".
  - Bấm "Thuê" là người đó vào làm ngay, không tốn tiền thuê.
- **Số người tối đa:** 1 lễ tân và 3 kỹ thuật viên. **(em đề xuất)**
- **4 chỉ số (spec chung mục 5.8):**
  - **Tay nghề:** làm càng khéo thì khách càng được nhiều sao. Người mới thuê làm kém hơn chủ tiệm chơi mini-game tốt.
  - **Tốc độ:** làm nhanh hơn, đi nhanh hơn.
  - **Thân thiện:** khách bớt sốt ruột, tip nhiều hơn.
  - **Sức bền:** làm được bao nhiêu khách thì phải nghỉ một lúc.
- **Lương:** khoảng 20.000 đến 60.000 đ một ngày tuỳ chỉ số (anh chọn giảm nửa khi ngày còn 2 phút 30 giây). Lương trừ lúc hết ngày, bảng tổng kết có dòng "Lương nhân viên". **(em đề xuất)**
- **Hết tiền trả lương:** tiền được âm, hiện màu đỏ. Lúc đang âm thì chưa mua đồ, mở dịch vụ hay thuê thêm người được. Riêng nhập hàng (đợt 6) thì lúc nào cũng được, kể cả khi tiền âm, vì không có hàng thì không làm ra tiền để gỡ. Ngày hôm sau làm có tiền là gỡ lại. Không bao giờ có lúc tiệm kẹt hẳn, phải bỏ tiệm chơi lại (spec chung mục 5.11). **(em đề xuất)**
- **Cho nghỉ việc:** bấm "Cho nghỉ" ở phần "Đang làm". Người đó làm xong khách đang làm rồi ra về.

### 8.2 Nhân viên làm việc

- **Nhận ra nhân viên:** áo bà ba xanh ngọc nhạt, khoác tạp dề kem viền nâu. Khác chủ tiệm (không tạp dề) và khác khách. **(em đề xuất)**
- **Kỹ thuật viên:**
  - Rảnh thì tự mời khách chờ lâu nhất có giường trống hợp dịch vụ, dẫn vào giường rồi làm. Không có mini-game.
  - Thời gian làm khoảng 12 đến 24 giây tuỳ tốc độ. Số sao tính theo tay nghề.
  - Khách chủ tiệm đã chạm để mời thì nhân viên không giành.
  - Người chơi vẫn tự phục vụ bất cứ khách nào đang chờ (spec chung mục 5.2).
- **Lễ tân:**
  - Đứng sau quầy, chào khách mới vào.
  - Khách được chào thì kiên nhẫn lâu hơn khoảng một phần tư và tip nhỉnh hơn, tuỳ độ thân thiện.
- **Mệt và nghỉ:**
  - Làm được 3 đến 7 khách (tuỳ sức bền) thì nhân viên ra đứng cạnh tủ khăn, trên đầu có ly trà, nghỉ khoảng một giờ trong game (12,5 giây).
  - Nghỉ xong tự làm tiếp.
- **Lên cấp:** mỗi khách làm xong được cộng kinh nghiệm. Có 5 cấp. Mỗi lần lên cấp thì một chỉ số tăng một chấm và lương tăng một chút. Lên cấp thì có pháo hoa nhỏ trên đầu.
- Khi người chơi đang chơi mini-game thì cả tiệm vẫn đứng yên như bây giờ, nhân viên cũng vậy.

### 8.3 Lưu game

Bản lưu thêm danh sách nhân viên (chỉ số, cấp, kinh nghiệm, đang làm gì, đang ở đâu) và 3 ứng viên của ngày.

## 9. Đợt 5: đắp mặt nạ, massage và 5 kiểu khách

### 9.1 Dịch vụ mới

- Nút "Dịch vụ" mở bảng dịch vụ. Mỗi dịch vụ ghi giá, giường cần dùng, và nút "Mở" nếu chưa mở.

| Dịch vụ | Giá khách trả | Tiền mở dịch vụ | Giường cần | Giá giường |
|---|---|---|---|---|
| Gội đầu | 40.000 đ | có sẵn | giường gội | 300.000 đ |
| Đắp mặt nạ | 60.000 đ | 200.000 đ | ghế nằm đắp mặt nạ | 350.000 đ |
| Massage | 90.000 đ | 400.000 đ | giường massage (có lỗ úp mặt) | 450.000 đ |

- Mở theo thứ tự: gội đầu, rồi đắp mặt nạ, rồi massage (spec chung mục 5.9). Mở dịch vụ xong thì giường của dịch vụ đó mới xuất hiện trong bảng mua đồ. **(em đề xuất)**
- **Khách chọn dịch vụ:** chỉ chọn trong những dịch vụ đã mở và tiệm đã có giường. Lúc ngồi chờ, trên đầu khách có biểu tượng dịch vụ muốn làm.
- Chạm vào khách mà giường loại đó đang bận thì game báo "Giường massage đang bận".
- **Tư thế:** khách đắp mặt nạ nằm ngửa, trên mặt có lớp mặt nạ và hai lát dưa leo khi đang làm. Khách massage nằm sấp, nhìn thấy gáy và tóc.

### 9.2 Hai mini-game mới

Mỗi mini-game khoảng 15 đến 25 giây, chấm 1 đến 3 sao, xếp thẻ giống mini-game gội đầu (spec chung mục 5.6). **(em đề xuất cách chơi chi tiết)**

- **Đắp mặt nạ:**
  1. Cận cảnh khuôn mặt khách nằm ngửa. Người chơi dùng ngón tay tô mặt nạ màu xanh bạc hà lên mặt. Thanh tiến độ đầy khi phủ kín khoảng 90% khuôn mặt.
  2. Tô lấn vào vùng mắt thì khách nhíu mày. Mỗi lần như vậy bị tính một lỗi.
  3. Kéo hai lát dưa leo đặt lên hai mắt. Thả gần đúng chỗ thì lát dưa tự hít vào.
  4. Chấm sao theo thời gian và số lỗi. Từ 3 lỗi trở lên thì bị trừ một sao.
- **Massage:**
  1. Cận cảnh lưng khách. Lần lượt 8 điểm sáng hiện lên theo nhịp, mỗi điểm có một vòng tròn thu nhỏ dần. Chạm khi vòng khít điểm là "Tuyệt", lệch một chút là "Tốt", lệch nhiều là trượt.
  2. Xen giữa có 2 điểm huyệt màu vàng nghệ. Giữ ngón tay trên điểm đó khoảng 1,5 giây cho tới khi vòng đầy.
  3. Chấm sao theo số lần chạm đúng.
- **Lần đầu chơi mỗi mini-game** có ngón tay mờ làm mẫu như mục 6.3.
- **Bản khó cho khách khó tính** (spec chung mục 5.6):
  - Gội đầu: cần nhiều lần vuốt hơn.
  - Mặt nạ: vùng mắt to hơn, phải phủ 95%.
  - Massage: nhịp nhanh hơn, vòng khít hẹp hơn.

### 9.3 Năm kiểu khách

Khách vẫn ghép ngẫu nhiên từ bộ phận. Mỗi kiểu thêm một món đồ để nhận ra. **(em đề xuất)**

| Kiểu | Nhận ra bằng | Kiên nhẫn | Tip | Hay chọn | Chấm điểm | Bắt đầu gặp |
|---|---|---|---|---|---|---|
| Sinh viên | ba lô | thường | ít | gội đầu | dễ | ngày 1 |
| Dân văn phòng | cà vạt hoặc túi xách | ngắn | khá | gội, mặt nạ | thường | ngày 1 |
| Khách khó tính | kính gọng, chau mày | thường | nhiều nếu 3 sao, không tip nếu dưới 3 sao | bất kỳ | gắt, chơi bản khó | ngày 3 |
| Cô chú lớn tuổi | tóc bạc, đi chậm | dài | vừa | massage | dễ | ngày 4 |
| Người nổi tiếng | kính râm, mũ rộng vành | ngắn | rất nhiều | massage, mặt nạ | gắt, đánh giá tính gấp đôi | ngày 6, khoảng 1 trong 20 khách |

- Kiểu khách hay chọn một dịch vụ mà tiệm chưa có thì chọn dịch vụ khác đang có.
- **Dịch vụ đang có cũng hút khách** (spec chung mục 5.7): mỗi dịch vụ mở thêm làm khách tới dày hơn một chút.

### 9.4 Lưu game

Bản lưu thêm: dịch vụ đã mở, loại giường, kiểu khách và dịch vụ khách chọn.

## 10. Đợt 6: kho và nhập hàng

- **4 món hàng (spec chung mục 5.9):** dầu gội, mặt nạ, tinh dầu, khăn.
  - Gội đầu dùng 1 dầu gội và 1 khăn.
  - Đắp mặt nạ dùng 1 mặt nạ và 1 khăn.
  - Massage dùng 1 tinh dầu và 1 khăn.
- **Bảng Kho:** nằm trong nút "Dịch vụ", là phần thứ hai cạnh danh sách dịch vụ. Mỗi món ghi số còn lại và có nút "Nhập 20". Hàng tới ngay, không phải chờ. Thiếu tiền vẫn nhập được, tiền thành số âm (mục 8.1), để tiệm không bao giờ kẹt vì hết khăn mà hết tiền. **(em đề xuất)**

| Món | Giá 20 cái | Tính ra mỗi lần dùng |
|---|---|---|
| Dầu gội | 80.000 đ | 4.000 đ |
| Khăn | 60.000 đ | 3.000 đ |
| Mặt nạ | 240.000 đ | 12.000 đ |
| Tinh dầu | 360.000 đ | 18.000 đ |

- **Khi nào bắt đầu tính hàng:** kho mở đầu ngày 5. Từ lúc đó mới trừ hàng, và tiệm được tặng sẵn 20 cái mỗi món. Trước ngày 5 hàng không bao giờ hết, để người mới khỏi phải lo nhiều thứ một lúc. **(em đề xuất)**
- **Sắp hết và hết:**
  - Còn 5 cái trở xuống thì nút "Dịch vụ" có chấm đỏ, và game báo một lần "Dầu gội sắp hết".
  - Hết hẳn thì chạm vào khách cần món đó sẽ báo "Hết dầu gội. Nhập thêm ở Dịch vụ › Kho". Nhân viên cũng bỏ qua khách đó. Khách chờ lâu quá thì bỏ về như thường.
- **Bảng tổng kết** chia ra Thu (tiền dịch vụ, tiền tip), Chi (lương, nhập hàng), Lãi trong ngày. Tiền mua đồ và mở dịch vụ không tính vào Chi trong ngày, vì đó là tiền đầu tư. **(em đề xuất)**
- **Lưu game:** bản lưu thêm số hàng còn lại và tiền chi trong ngày.

## 11. Đợt 7: âm thanh

- **Nhạc nền (em đề xuất, mục 5):** tạo bằng code, giai điệu ngũ cung chậm, tiếng giống đàn tranh gảy nhẹ trên nền âm êm, chơi lặp không có chỗ nối gắt. Bảng tổng kết có đoạn nhạc ngắn riêng.
- **Tiếng động (spec chung mục 5.13):**
  - Chuông gió khi khách vào cửa.
  - Tiếng xu rơi khi trả tiền.
  - Nước chảy khi xả tóc.
  - Lép bép bọt khi tạo bọt.
  - "Ting" khi hiện từng ngôi sao.
  - Tiếng bấm nút.
  - Tiếng "hừ" khi khách bực bỏ về.
  - Tiếng đặt đồ "cộp" khi kê đồ.
  - Tiếng vui khi nhân viên lên cấp.
- **Nút bật tắt:** màn tạm dừng có hai nút riêng "Nhạc" và "Tiếng động". Game nhớ lựa chọn trên từng máy, không theo ô lưu.
- **Trên iPhone:**
  - Theo quy định của trình duyệt, tiếng chỉ bắt đầu sau lần chạm đầu tiên.
  - Gạt nút im lặng của iPhone thì game cũng im, để không làm phiền người bên cạnh. **(em đề xuất)**
- **Nếu anh nghe không ưng:** em đổi sang file nhạc CC0 có sẵn trên mạng. Trước khi tải file nào em sẽ hỏi anh tên file, nguồn và dung lượng.

## 12. Kiểm tra và tiêu chí xong

**Em tự kiểm tra ở mỗi đợt, đạt hết mới đẩy lên:**
- **Test tự động cho luật chơi**, không cần mở hình. Mỗi đợt có test riêng cho phần của đợt đó, ví dụ:
  - Kê đồ chắn lối thì bị từ chối.
  - Nhân viên tự mời khách và không giành khách chủ tiệm đã chọn.
  - Hết hàng thì không làm dịch vụ được.
  - Hết tiền, hết hàng, nợ lương cùng lúc thì tiệm vẫn nhập hàng và làm ra tiền lại được.
- **Test đọc tiệm cũ:** bản lưu của mọi đợt trước, kể cả đợt 1, mở ra đúng tiệm ở bản mới.
- **Tự chơi thử trên trình duyệt ở cỡ iPhone:**
  - Chơi phần mới của đợt đó.
  - Tắt giữa chừng rồi mở lại.
  - Chụp ảnh màn hình để xem có lệch nét, chữ có bị cắt không.
  - Xem lỗi trong console.
- **Sau khi đẩy lên:** mở link GitHub Pages thật, xem bản mới đã lên.

**Anh kiểm tra giúp trên iPhone 17 khi rảnh, không cần theo từng đợt:**
- Gõ tên tiệm có dấu.
- Kéo đồ bằng ngón tay xem có dễ không.
- Mini-game mặt nạ và massage có vui không.
- Nghe nhạc, thử gạt nút im lặng.

**Xong khi:** một người chưa chơi bao giờ mở link, tự tạo được chủ tiệm và chơi qua ngày đầu nhờ hướng dẫn. Những ngày sau lần lượt mua giường, thuê người, mở thêm dịch vụ, nhập hàng mà không cần ai chỉ. Tiệm cũ của cả nhà vẫn còn nguyên.

## 13. Để người làm tự quyết

- Cách viết code, cách lưu, cách nâng cấp bản lưu cũ lên bản mới.
- Hình vẽ cụ thể của đồ mới, phụ kiện của từng kiểu khách, bàn tay hướng dẫn, miễn đúng phong cách A.
- Cách xếp chi tiết các bảng (mua đồ, nhân viên, dịch vụ, kho), miễn đúng kiểu thẻ kem viền nâu và nút đủ to cho ngón cái.
- Mọi con số cân bằng: giá, lương, điểm đẹp, độ kiên nhẫn, độ dày khách, số sao của nhân viên.
- Tiếng nhạc và tiếng động cụ thể, miễn nhẹ nhàng, hợp không khí thư giãn.
