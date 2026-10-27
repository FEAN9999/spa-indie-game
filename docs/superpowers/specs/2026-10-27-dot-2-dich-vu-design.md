# Đợt 2, phần 3: dịch vụ mới và pha công thức

- Ngày: 2026-10-27
- Trạng thái: chờ anh duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.9 và mục 6 (Đợt 2). Phần 1 xem `2026-10-27-dot-2-khach-design.md`, phần 2 xem `2026-10-27-dot-2-nhan-vien-design.md`.
- Bản phác bấm thử (anh đã xem và chịu): https://claude.ai/artifact/NVKrBLM9G7huu7fLWH912X

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự điền, anh sửa được.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Làm ngay bằng 2D**, không chờ quyết định bố cục 3D. **(anh chọn)**
  - Đồ mới vẽ đơn giản cho hợp đồ đang có.
  - Luật chơi, trò chơi nhỏ, kho và nhân viên vẫn dùng lại được nếu sau này lên 3D. Chỉ hình đồ mới phải vẽ lại.
- **Chia hai lô:** **(anh chọn)**
  - **Lô A:** bàn pha công thức, khách quen kể gợi ý, xếp gọn màn Dịch vụ và Kho, cùng trọn vẹn dịch vụ Xông lá.
  - **Lô B:** Đá nóng và Tắm bùn.
- **Anh duyệt tài liệu này một lần cho cả hai lô.** **(em đề xuất, giữ cách của phần 1 và phần 2)**
  - Sau đó em làm liền một mạch.
  - Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh.
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Ba dịch vụ, mở theo thứ tự:**

| Dịch vụ | Giá khách trả | Tiền mở | Giường | Kho mỗi khách |
|---|---|---|---|---|
| Gội đầu | 40.000 đ | có sẵn | Giường gội 1×3, 300.000 đ | 1 dầu gội, 1 khăn |
| Đắp mặt nạ | 60.000 đ | 200.000 đ | Giường đắp mặt nạ 1×3, 350.000 đ | 1 mặt nạ, 1 khăn |
| Massage | 90.000 đ | 400.000 đ | Giường massage 1×3, 450.000 đ | 1 dầu, 1 khăn |

- **Màn Dịch vụ** mở từ ngày 4, có hai thẻ: Dịch vụ và Kho (Kho từ ngày 5). Màn này chỉ vừa đúng 3 dòng dịch vụ và 4 dòng kho.
- **Chủ tiệm tự làm thì chơi trò chơi nhỏ** của dịch vụ đó. Lần đầu có bảng chỉ cách chơi. Nhân viên làm thì tự chấm sao theo tay nghề và bậc chuyên môn.
- **Mỗi dịch vụ mở thêm** làm khách tới dày hơn 10%.
- **Khách mỗi loại thích vài dịch vụ:**
  - sinh viên thích gội đầu;
  - dân văn phòng thích gội đầu và đắp mặt nạ;
  - cô chú lớn tuổi thích massage;
  - người nổi tiếng thích massage và đắp mặt nạ;
  - khách khó tính dịch vụ nào cũng chịu.
- **Khách quen** (8 người, phần 1) ghé lại, được tim, tặng quà. Trong tiệm đã có bong bóng chữ trên đầu khách.
- **Nhân viên** có bậc chuyên môn 0–3 cho từng dịch vụ và đi học được dịch vụ tiệm đang mở (phần 2). Bậc tự có cho dịch vụ mới thêm sau.

## 3. Mục tiêu

- **Tiệm có chỗ lớn lên giữa và cuối game:** ba dịch vụ mới đắt hơn, đồ mới để mua, kho mới để lo.
- **Mở dịch vụ mới là một việc thú vị, không chỉ bấm trả tiền.** Pha đúng công thức bí truyền mới mở được. **(anh chọn)**
- **Khách quen có thêm ý nghĩa:** lời họ kể giúp pha công thức.
- **Mỗi dịch vụ mới có trò chơi nhỏ riêng**, chơi bằng ngón cái trên iPhone, đúng như bản phác. **(anh chọn)**
- **Chất Việt Nam:** lá bưởi, sả, gừng, bùn khoáng, muối hột, dầu tràm.

## 4. Chưa làm ở phần này

- Thêm dịch vụ khác ngoài ba dịch vụ này. **(em đề xuất)**
- Pha công thức cho ba dịch vụ cũ. Ba dịch vụ cũ mở như bây giờ. **(em đề xuất)**
- Công thức khác nhau mỗi ván. Công thức cố định, dựa theo đồ thật, để lời khách kể nghe có lý. **(em đề xuất)**
- Nguyên liệu pha công thức thành hàng trong kho. Ở bàn pha, nguyên liệu không tốn gì ngoài tiền mỗi lần pha. **(em đề xuất)**
- Nâng cấp công thức hay chất lượng công thức. **(em đề xuất)**
- Khách quen hay VIP mới thích dịch vụ mới. Khách quen và VIP vẫn thích dịch vụ cũ như phần 1. **(em đề xuất)**
- Đổi số nhân viên tối đa hay thêm tầng. Để phần 4 tính. **(em đề xuất)**

## 5. Điều cấm (dính là coi như hỏng)

Giữ mọi điều cấm của bước 1b, phần 1 và phần 2, thêm:

- **Bàn pha thành trò đoán mò tốn tiền:**
  - Mỗi lần pha rẻ.
  - Pha lại chén đã thử thì không mất tiền.
  - Không bao giờ kẹt: lúc nào đủ tiền cũng pha được, và công thức luôn tìm ra được dù chưa nghe gợi ý nào.
- **Tiệm cũ mất gì:** mở tiệm cũ bằng bản mới thì mọi thứ còn nguyên. Tiệm chỉ được thêm những thứ mới với giá trị khởi đầu.
- **Tiệm bị ngộp khách:** mở đủ sáu dịch vụ thì khách tới dày hơn bây giờ nhiều nhất 15% (mục 6.3).
- **Trò chơi nhỏ khó chạm trên iPhone:** thứ gì phải chạm thì đủ to cho ngón cái, kể cả thứ đang rơi hay đang chạy.
- **Thành game đọc chữ:** lời khách kể là một câu ngắn trong bong bóng, không có bảng chữ chặn tay.
- **Bị chen ngang:** bàn pha mở từ màn Dịch vụ lúc tiệm đứng yên. Không có bảng nào tự bật lên bắt pha.

## 6. Các cách đã cân nhắc

| Việc | Cách | Được | Mất | Kết quả |
|---|---|---|---|---|
| Lúc nào làm | **Làm ngay bằng 2D, vẽ đồ mới đơn giản** | Có dịch vụ mới sớm. Phần lớn dùng lại được khi lên 3D | Hình đồ mới phải vẽ lại nếu lên 3D | **Anh chọn** |
| | Chờ quyết định bố cục 3D | Vẽ đồ một lần | Chờ không biết bao lâu | Loại |
| Cách mở dịch vụ mới | **Pha đúng công thức bí truyền ở bàn pha, rồi trả tiền mở** | Mở dịch vụ thành trò chơi, khách quen có thêm ý nghĩa | Thêm một màn và phần gợi ý | **Anh chọn** |
| | Chỉ trả tiền như ba dịch vụ cũ | Dễ làm | Mở dịch vụ nhạt | Loại |
| Chia việc | Một lần cả ba dịch vụ | Một lần phát hành | Lâu mới chơi được. Bàn pha chưa vui thì phải sửa trên cả ba | Loại |
| | **Hai lô: bàn pha và Xông lá trước, Đá nóng và Tắm bùn sau** | Chơi thử bàn pha sớm, chỉnh trước khi làm hai dịch vụ còn lại | Bản lưu đổi phiên bản hai lần | **Anh chọn** |
| | Ba lô, mỗi lô một dịch vụ | Góp ý nhiều lần nhất | Thêm một vòng phát hành. Đá nóng và Tắm bùn giống nhau nên tách ra không lợi thêm bao nhiêu | Loại |

## 7. Ba dịch vụ mới

### 7.1 Giá, đồ và khách

- **Số liệu:** **(anh chọn)**

| Dịch vụ | Lô | Giá khách trả | Tiền mở | Đồ cần mua | Kho mỗi khách |
|---|---|---|---|---|---|
| Xông lá | A | 110.000 đ | 500.000 đ | Lều xông lá 2×2, 500.000 đ | 1 gói lá xông, 1 khăn |
| Đá nóng | B | 130.000 đ | 650.000 đ | Giường đá nóng 1×3, 550.000 đ | 1 dầu (chung với massage), 1 khăn |
| Tắm bùn | B | 160.000 đ | 800.000 đ | Bồn tắm bùn 2×3, 700.000 đ | 1 túi bùn khoáng, 1 khăn |

- **Khi nào có:** **(anh chọn)**
  - Ba dịch vụ cũ vẫn mở theo thứ tự như bây giờ.
  - Khi tiệm đã mở massage, ba dịch vụ mới hiện trên màn Dịch vụ. Dịch vụ nào cũng phải pha đúng công thức rồi mới trả tiền mở được. Ba công thức pha theo thứ tự nào cũng được.
- **Khách nào thích:** **(anh chọn)**
  - cô chú lớn tuổi thích thêm Xông lá;
  - dân văn phòng thích thêm Đá nóng;
  - người nổi tiếng thích thêm Tắm bùn;
  - khách khó tính thích cả sáu.
- **Khách tới dày hơn:** mỗi dịch vụ mới có giường chỉ làm khách tới dày hơn 5%, nửa mức của dịch vụ cũ. **(anh chọn)** Đủ sáu dịch vụ thì khoảng cách giữa hai khách còn 65% so với lúc chỉ có gội đầu, thay vì 50% nếu giữ mức cũ.
- **Đồ mới:** **(em đề xuất)**
  - Nằm chung nhóm giường trong cửa hàng đồ, hiện và mua được theo đúng luật của giường hiện giờ.
  - Dịch vụ chỉ có khách khi có ít nhất một món đồ của nó trong tiệm, như bây giờ.
  - Kích thước và hình nhìn từ trên giống bản phác:
    - Lều xông lá 2×2: lều vải tròn sọc cam kem.
    - Giường đá nóng 1×3: giống giường massage, thêm hàng đá.
    - Bồn tắm bùn 2×3: bồn gỗ có bùn.
- **Lúc làm dịch vụ, nhìn trong tiệm:** **(em đề xuất)**
  - **Xông lá:** khách vào lều thì khuất, lều bốc khói nhẹ, thợ hay chủ tiệm đứng cạnh lều.
  - **Đá nóng:** khách nằm như massage, có hàng đá trên lưng.
  - **Tắm bùn:** khách ngồi trong bồn, chỉ thấy đầu quấn khăn.
  - Người làm tự vẽ, miễn đúng phong cách A và đọc được ở cỡ iPhone.

### 7.2 Kho

- **Hai món mới:** **(anh chọn)**

| Món | Lô | Ai dùng | Giá 20 phần |
|---|---|---|---|
| Gói lá xông | A | Xông lá | 440.000 đ |
| Túi bùn khoáng | B | Tắm bùn | 640.000 đ |

- **Đá nóng dùng chung dầu với massage**, không thêm món. **(anh chọn)**
- **Phần có sẵn:** mỗi món mới có sẵn 20 phần, giống lúc đầu game. Tiệm cũ mở bằng bản mới cũng có sẵn 20 phần. **(anh chọn ý, em đề xuất cách làm)**
- **Thẻ Kho** chỉ hiện món của dịch vụ đang mở, như bây giờ. Lô A có tối đa 5 món, lô B có tối đa 6 món.
- **Hết đồ thì thợ không làm dịch vụ đó**, đúng luật kho hiện giờ.

### 7.3 Nhân viên

- **Bậc chuyên môn:** mọi người có thêm bậc 0 cho mỗi dịch vụ mới. Học phí như cũ: lên bậc 1 là 100.000 đ, bậc 2 là 200.000 đ, bậc 3 là 400.000 đ. **(anh chọn)**
- **Đi học:** chỉ học được dịch vụ tiệm đã mở, như phần 2.
- **Ứng viên mới:** **(anh chọn)**
  - Dịch vụ giỏi sẵn của ứng viên kỹ thuật viên rút trong ba dịch vụ cũ, cộng với các dịch vụ mới tiệm đã mở.
  - Ba dịch vụ cũ vẫn rút kể cả khi tiệm chưa mở, như phần 2 mục 7.1.
  - Ứng viên đã ra trong ngày không bị rút lại khi tiệm mở thêm dịch vụ.
- **Thời gian làm và cách chấm sao** của nhân viên ở dịch vụ mới giống dịch vụ cũ. **(em đề xuất)**

## 8. Bàn pha công thức (lô A)

### 8.1 Mở ở đâu

- **Bàn pha mở từ màn Dịch vụ.** Không thêm đồ vào tiệm. **(em đề xuất, anh đã chịu qua bản phác)**
  - Dòng của dịch vụ mới chưa pha ra có nút "Pha công thức" thay cho nút Mở.
  - Pha ra rồi thì dòng đó có nút Mở với tiền mở, như dịch vụ cũ.
- **Tiệm đứng yên** lúc ở bàn pha, như ở màn Dịch vụ.
- **Bàn pha có từ lúc tiệm mở massage.** Trước đó ba dịch vụ mới hiện mờ trên màn Dịch vụ, ghi "Mở massage trước". **(em đề xuất)**

### 8.2 Cách pha

Giống bản phác. **(anh chọn)**

- **Màn bàn pha có:**
  - tên các dịch vụ có công thức, chọn một để pha. Ở lô A chỉ có Xông lá, lô B thêm Đá nóng và Tắm bùn. Dịch vụ đã pha ra có dấu ✓;
  - chén 3 ô;
  - kệ 8 nguyên liệu;
  - nút "Pha thử · 20.000 đ";
  - dòng kết quả;
  - các câu khách quen đã kể cho dịch vụ đang chọn;
  - các lần đã pha của dịch vụ đó.
- **8 nguyên liệu:** Lá bưởi, Sả, Gừng, Muối hột, Bùn khoáng, Mật ong, Dầu dừa, Tinh dầu tràm.
- **Pha:**
  - Chạm nguyên liệu để bỏ vào ô trống, chạm món trong chén để bỏ ra.
  - Mỗi món chỉ bỏ được một lần. Thứ tự trong chén không quan trọng.
  - Đủ 3 món thì bấm Pha. Mỗi lần pha trừ 20.000 đ ngay.
- **Kết quả:**
  - Đúng cả 3 món: dịch vụ đó coi như đã pha ra, có pháo hoa nhỏ và dòng "Đúng cả 3 món! Giờ mở được Xông lá." **(em đề xuất câu chữ)**
  - Sai: dòng "Đúng 2 món", có chấm tròn cho số món đúng. Không nói món nào đúng.
- **Pha lại đúng một chén đã thử** thì không trừ tiền, chỉ nhắc kết quả cũ.
- **Thiếu tiền hoặc tiền đang âm:** nút Pha mờ, ghi lý do như khi mua đồ.
- **Tiền pha không tính vào Chi trong ngày**, giống học phí và tiền mở dịch vụ. **(em đề xuất)**
- **Danh sách các lần đã pha:** mới nhất ở trên, mỗi lần gồm 3 hình nguyên liệu và số món đúng. Dài quá thì chỉ hiện vài lần gần nhất. **(em đề xuất)**
- Với 8 món chọn 3 có 56 cách. Nhờ biết số món đúng, thường 4–6 lần là ra, khoảng 100.000 đ.

### 8.3 Công thức

**(em đề xuất)**

| Dịch vụ | Công thức | Món khách quen kể | Món tự tìm |
|---|---|---|---|
| Xông lá | Lá bưởi · Sả · Gừng | Lá bưởi, Sả | Gừng |
| Đá nóng | Dầu dừa · Tinh dầu tràm · Gừng | Dầu dừa, Tinh dầu tràm | Gừng |
| Tắm bùn | Bùn khoáng · Muối hột · Mật ong | Bùn khoáng, Muối hột | Mật ong |

- Công thức giống nhau ở mọi ván.

### 8.4 Khách quen kể gợi ý

**(anh chọn)**

- **Khi nào kể:**
  - Chỉ khi tiệm đã có bàn pha (đã mở massage).
  - Khách quen ra về vui vẻ (từ 2 sao trở lên), chủ tiệm hay nhân viên làm đều được.
  - Có 1 phần 2 khả năng kể một câu, nếu còn câu chưa nghe của một công thức chưa pha ra. **(anh chọn khi soát tài liệu)**
- **Kể gì:**
  - Mỗi công thức có 2 câu, mỗi câu lộ một món (mục 8.3).
  - Còn nhiều câu chưa nghe thì rút ngẫu nhiên một câu trong các công thức chưa pha ra.
  - Lô A chỉ có câu của Xông lá.
- **Cách hiện:**
  - Câu kể là bong bóng chữ trên đầu khách lúc ra về, dùng đúng kiểu bong bóng đang có trong tiệm.
  - Câu đó được ghi lại ở bàn pha, dưới dịch vụ của nó. Câu nào đã kể thì không kể lại.
- **Lần ghé có tim mới vẫn kể được.** Bong bóng câu chuyện của tim hiện trước, hết rồi mới tới bong bóng gợi ý. Hai bong bóng không bao giờ chồng hay thay nhau. **(anh chọn khi soát tài liệu)**
- **Lần ghé có quà thì không kể,** để khoảnh khắc nhận quà không bị chen. **(anh chọn khi soát tài liệu)**
- **Gợi ý thường tới muộn với Xông lá, và vậy là được.** **(anh chọn khi soát tài liệu)**
  - Khách quen tới từ ngày 7, trong khi bàn pha có thể có từ ngày 4.
  - Xông lá rẻ, nên nhiều người sẽ tự thử ra trước khi nghe câu nào.
  - Gợi ý có ích rõ nhất ở Đá nóng và Tắm bùn (lô B).
- **Câu mẫu:** **(em đề xuất, người làm sửa được câu chữ)**
  - Xông lá, lá bưởi: "Hồi xưa má tui nấu nồi xông có lá bưởi, thơm cả nhà."
  - Xông lá, sả: "Nồi xông mà thiếu sả là mất nửa mùi."
  - Đá nóng, dầu dừa: "Chỗ tui hay đi, người ta thoa dầu dừa lên lưng trước rồi mới đặt đá."
  - Đá nóng, tinh dầu tràm: "Nhỏ vài giọt dầu tràm lên đá, hít vô là thông mũi liền."
  - Tắm bùn, bùn khoáng: "Bùn phải là bùn khoáng nghen, bùn ao là ngứa cả tuần."
  - Tắm bùn, muối hột: "Bùn mà không bỏ chút muối hột thì ngâm chẳng đã gì hết."
- **Nghe đủ 2 câu của một công thức** thì món thứ ba nằm trong 6 món còn lại. Nhiều nhất 6 lần thử là chắc chắn ra.

## 9. Ba trò chơi nhỏ

### 9.1 Chung

- **Chủ tiệm tự làm thì chơi trò chơi nhỏ**, nhân viên làm thì tự chấm sao, giống ba dịch vụ cũ. **(anh chọn)**
- **Lần đầu chơi mỗi trò** có bảng chỉ cách chơi, như mặt nạ và massage. **(em đề xuất)**
- **Chơi giống bản phác**, chạy trên màn hình riêng như các trò chơi nhỏ hiện giờ, tiệm đứng yên lúc chơi. **(anh chọn)**
- **Khách khó tính** làm trò chơi khó hơn một chút, như massage hiện giờ. **(em đề xuất)**
- Thời gian tính bằng giây thật.

### 9.2 Xông lá (lô A)

- **Cách chơi:**
  - Lá và đồ khác rơi từ trên xuống nồi xông ở dưới.
  - Chạm đúng ba thứ của công thức Xông lá (lá bưởi, sả, gừng) để bỏ vào nồi. Chạm nhầm thứ khác (lá ổi, ớt, lá chuối) là nhầm một lần.
  - Thứ rơi có hình kèm tên ngắn, đủ to cho ngón cái.
- **Số khởi đầu:** **(em đề xuất, như bản phác)**
  - Gom đủ 6 trong 15 giây thì xong sớm. Đủ 6 thứ đúng nào cũng được, không cần đủ cả ba loại.
  - Mỗi 0,55–0,8 giây rơi một thứ, nửa đúng nửa nhầm.
- **Sao:**
  - 3 sao: gom đủ 6, không nhầm lần nào.
  - 2 sao: gom từ 4 và nhầm không quá 2 lần.
  - Còn lại 1 sao.
- **Khách khó tính:** rơi nhanh hơn, và thứ nhầm rơi nhiều hơn. **(em đề xuất)**

### 9.3 Đá nóng (lô B)

- **Cách chơi:**
  - Trên là lưng khách với 6 chỗ đặt đá. Dưới là nồi có 4 viên đá.
  - Đá nóng dần: xám là nguội, cam là vừa, đỏ là nóng quá.
  - Chạm một viên đá để đặt nó vào chỗ trống kế tiếp, rồi một viên nguội mới thế vào nồi.
  - Đặt đá đỏ thì khách giật mình, có câu ngắn trên đầu.
- **Số khởi đầu:** **(em đề xuất, như bản phác)**
  - 25 giây. Đặt đủ 6 viên thì xong sớm.
  - Mỗi viên nóng theo tốc độ riêng, mỗi viên cam chừng 1–1,5 giây.
- **Sao:**
  - Đá vừa +1 điểm, đá nóng quá −1, đá nguội hay chỗ trống 0.
  - Từ 5 điểm là 3 sao, 3–4 điểm 2 sao, còn lại 1 sao.
- **Khách khó tính:** đá nóng nhanh hơn, nên lúc cam ngắn hơn. **(em đề xuất)**

### 9.4 Tắm bùn (lô B)

- **Cách chơi:**
  - Cột nhiệt bên cạnh bồn, có một khoảng xanh tự trôi lên xuống.
  - Giữ nút "thêm nước nóng" thì vạch nhiệt lên, thả ra thì vạch xuống, như câu cá trong Stardew.
  - Mặt khách trong bồn đổi theo nhiệt: run khi nguội, lim dim khi vừa, nhăn mặt khi nóng.
- **Số khởi đầu:** **(em đề xuất, như bản phác)**
  - 20 giây.
  - Khoảng xanh cao chừng 1/5 cột.
- **Sao:** vạch nằm trong khoảng xanh từ 70% thời gian là 3 sao, từ 45% là 2 sao, còn lại 1 sao.
- **Khách khó tính:** khoảng xanh hẹp hơn. **(em đề xuất)**

## 10. Màn Dịch vụ và Kho

- **Xếp gọn dòng** để vừa sáu dịch vụ và sáu món kho trong một màn hình iPhone dọc, không phải kéo. **(em đề xuất)**
  - Làm ngay ở lô A, dù lô A mới có 4 dịch vụ và 5 món.
  - Mỗi dòng vẫn có hình, tên, giá, đồ cần mua và nút.
- **Dòng dịch vụ mới:**
  - chưa mở massage: mờ, ghi "Mở massage trước";
  - chưa pha ra: nút "Pha công thức" mở bàn pha;
  - đã pha ra: nút Mở với tiền mở;
  - đã mở: như dịch vụ cũ.
- **Dẫn dắt:** lần đầu mở màn Dịch vụ khi đã có bàn pha, hiện một dòng ngắn: "Dịch vụ mới phải pha đúng công thức mới mở được. Khách quen đôi khi kể bí quyết." Không có mũi tên chỉ dẫn mới. **(em đề xuất)**
- Chi tiết xếp đặt để người làm quyết, miễn đúng kiểu thẻ kem viền nâu và nút đủ to cho ngón cái.

## 11. Lưu game

- **Lô A: bản lưu lên phiên bản 12.** Bản lưu thêm:
  - Xông lá trong danh sách dịch vụ đã mở;
  - với mỗi công thức: đã pha ra chưa, các chén đã thử cùng số món đúng, các câu đã nghe;
  - gói lá xông trong kho;
  - bậc Xông lá của mỗi nhân viên và ứng viên.
- **Lô B: bản lưu lên phiên bản 13**, thêm như trên cho Đá nóng, Tắm bùn và túi bùn khoáng.
- **Tiệm cũ mở bằng bản mới:**
  - mọi thứ cũ giữ nguyên;
  - dịch vụ mới chưa mở, công thức chưa pha;
  - món kho mới có 20 phần;
  - bậc dịch vụ mới là 0 cho mọi người.
  - Không cần rút ngẫu nhiên gì, nên chuỗi ngẫu nhiên của tiệm không bị xô lệch.

## 12. Kiểm tra và tiêu chí xong

**Em tự kiểm tra ở mỗi lô, đạt hết mới đẩy lên** (giống phần 1 và phần 2):

- **Test tự động cho luật chơi.** Ví dụ:
  - **Mở dịch vụ:**
    - dịch vụ mới cần massage đã mở và công thức đã pha ra;
    - ba dịch vụ mới mở theo thứ tự nào cũng được;
    - ba dịch vụ cũ vẫn theo thứ tự.
  - **Pha:**
    - trừ đúng 20.000 đ;
    - đếm đúng số món đúng, không kể thứ tự;
    - chén đã thử không trừ tiền;
    - thiếu tiền hay tiền âm thì không pha được;
    - đúng cả 3 thì pha ra.
  - **Gợi ý:**
    - chỉ kể khi có bàn pha và khách quen từ 2 sao;
    - lần có tim mới vẫn kể được, lần có quà thì không;
    - không kể câu đã nghe;
    - không kể cho công thức đã pha ra.
  - **Khách:** khách tới dày hơn đúng mức ở mục 7.1. Khách có dịch vụ yêu thích mới.
  - **Kho:** dịch vụ mới dùng đúng món. Đá nóng dùng chung dầu. Hết đồ thì thợ không làm.
  - **Nhân viên:** ứng viên giỏi sẵn dịch vụ mới chỉ khi tiệm đã mở nó. Học được dịch vụ mới đã mở.
  - **Trò chơi nhỏ:** cách tính sao đúng mốc ở mục 9.
- **Test đọc tiệm cũ:** bản lưu của mọi bản trước mở đúng tiệm ở bản mới, còn nguyên mọi thứ, có thêm phần mới với giá trị khởi đầu (mục 11).
- **Tự chơi thử trên trình duyệt ở cỡ iPhone:**
  - Mở massage, thấy bàn pha.
  - Pha sai, pha lại chén cũ, rồi pha đúng.
  - Nghe khách quen kể và thấy câu đó ở bàn pha. Có cả lần kể ngay sau bong bóng tim mới.
  - Mở dịch vụ, mua đồ, chủ tiệm tự làm và chơi trò chơi nhỏ, rồi nhân viên làm.
  - Xem màn Dịch vụ và Kho có vừa không.
  - Tắt giữa chừng rồi mở lại.
  - Chụp ảnh xem có chật hay cắt chữ không.
  - Xem lỗi trong console.
- **Sau khi đẩy lên:** mở link GitHub Pages thật, xem bản mới đã lên.

**Anh xem giúp trên iPhone khi rảnh:**

- Pha công thức có vui không, có thấy tốn tiền quá không.
- Ba trò chơi nhỏ dễ hay khó.
- Giá dịch vụ, tiền mở và giá đồ mới đắt hay rẻ so với tiền tiệm đang có.

**Xong khi:**

- Người chơi tự tìm ra bàn pha và pha ra công thức, không cần ai chỉ.
- Lời khách quen kể giúp pha được, tính trên cả ba công thức. Xông lá tự thử ra trước khi nghe gợi ý cũng được.
- Ba dịch vụ mới chạy trong tiệm, cả lúc chủ tiệm làm lẫn lúc nhân viên làm.
- Tiệm cũ của cả nhà vẫn còn nguyên.

## 13. Để người làm tự quyết

- Cách viết code, tên trong code, cách lưu, cách nâng cấp bản lưu cũ.
- Cách thợ và khách đứng quanh lều 2×2 và bồn 2×3.
- Thêm lần rút ngẫu nhiên cho gợi ý làm đổi chuỗi ngẫu nhiên của tiệm. Người làm tự xử lý các test có hạt giống ngẫu nhiên cố định.
- Câu chữ cụ thể, miễn ngắn, giọng Sài Gòn thân thiện.
- Hình đồ mới, nguyên liệu, món kho và biểu tượng dịch vụ, miễn đúng phong cách A.
- Cách xếp màn bàn pha, màn Dịch vụ và Kho, miễn đúng kiểu thẻ kem viền nâu và nút đủ to cho ngón cái.
- Mọi con số trong trò chơi nhỏ và mức khó hơn cho khách khó tính.
