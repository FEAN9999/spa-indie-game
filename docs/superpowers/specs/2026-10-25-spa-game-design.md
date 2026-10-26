# Thiết kế game quản lý tiệm spa

- Ngày: 2026-10-25
- Trạng thái: anh đã duyệt (2026-10-25). Cập nhật cùng ngày: phong cách hình A và cách xếp tiệm mới (mục 4.4 và 7), chờ anh duyệt.
- Tên game: chưa đặt (xem mục 10)

Cách đọc: chỗ ghi **(anh chọn)** là điều anh đã quyết trong lúc trao đổi. Chỗ ghi **(em đề xuất)** là em tự điền, anh sửa được. Chỗ không ghi gì là hệ quả trực tiếp của hai loại trên.

---

## 1. Ý tưởng và lý do

Người chơi mở một tiệm spa nhỏ, tự tay phục vụ từng khách, kiếm tiền để nâng cấp tiệm và thuê nhân viên. Dần dần tiệm lớn lên thành nhiều tầng, cuối cùng là một chuỗi spa mà người chơi điều hành từ trên xuống. **(anh chọn)**

- **Cho ai:** trước hết là gia đình anh. Nếu ổn thì phát hành rộng hơn. **(anh chọn)**
- **Người chơi:** khoảng 20–30 tuổi, đọc tiếng Việt thoải mái, ít chơi game. Máy chính là iPhone 17. **(anh chọn)** Người ít chơi game cần được dẫn dắt từ từ, xem mục 5.14.
- **Cảm giác cần có:** sống động như Stardew Valley và Dave the Dive. Nhân vật đi lại, có cử động, người chơi thao tác thật bằng tay. Không phải game toàn chữ và menu. **(anh chọn)**
- **Nét vẽ:** vector, không dùng pixel. **(anh chọn)** Hai game tham khảo ở trên đều vẽ pixel. Mình chỉ học cái sống động của chúng, không học nét vẽ.

## 2. Mục tiêu, những gì chưa làm, những điều cấm

### Mục tiêu
- Chơi trên điện thoại, cầm dọc, độ khó vừa phải. **(anh chọn)**
- Tiến trình 3 giai đoạn: tự tay làm, rồi thuê người phụ, rồi nhân viên làm hết và chủ tiệm quản lý toàn cảnh. **(anh chọn)**
- Nâng cấp được nhiều thứ: thêm tầng, nội thất, số giường, dịch vụ. **(anh chọn)**
- Có nhiều thứ để cày và chơi được lâu nhờ 7 nhóm tính năng ở mục 6. **(anh chọn, nội dung các nhóm do em đề xuất và anh đã đồng ý)**
- Miễn phí hoàn toàn, không trả phí cho công cụ hay dịch vụ nào. **(anh chọn)**

### Chưa làm ở bản đầu
- Chưa đưa lên Google Play hay App Store, vì phải đóng phí nhà phát triển (25 USD và 99 USD/năm). **(anh chọn)**
- Không cần mạng, không tài khoản, không máy chủ, không lưu lên mây. **(em đề xuất)**
- Chưa có tiếng Anh, nhưng toàn bộ chữ trong game để riêng một chỗ, để sau này thêm dễ dàng. **(em đề xuất)**
- Không có quảng cáo, không có mua bán trong game. **(em đề xuất)**

### Điều cấm (vẫn chạy được mà dính mấy điều này thì coi như hỏng)
- Game chỉ có chữ và nút bấm, nhân vật đứng im. **(anh chọn)**
- Nét vẽ pixel. **(anh chọn)**
- Phải trả tiền cho bất kỳ công cụ hay dịch vụ nào. **(anh chọn)**
- Giai đoạn cuối nhạt, người chơi chỉ ngồi nhìn tiền tăng. **(em đề xuất, anh đồng ý)**
- Hình ảnh lệch nét nhau, món này một kiểu món kia một kiểu. **(em đề xuất)**
- Bắt người chơi chờ đợi theo kiểu "hết năng lượng, mai quay lại", hoặc chờ lâu để ép bỏ tiền. **(em đề xuất)**

## 3. Ràng buộc

- **Người làm:** Claude làm hết, từ code, hình vẽ đến chọn âm thanh. Anh chỉ xem và duyệt kết quả. **(anh chọn)** Vì vậy mọi thứ phải kiểm tra được ngay trên trình duyệt, không đòi phần mềm nặng.
- **Nền tảng:** chạy trên trình duyệt điện thoại. Ưu tiên số một là iPhone (Safari), vì máy chính là iPhone 17. Android (Chrome) và máy tính bảng cũng phải chạy được. Màn hình dọc, điều khiển bằng chạm.
- **Như một app:** người chơi bấm "Thêm vào màn hình chính" là có biểu tượng như app. Sau lần mở đầu tiên thì chơi được không cần mạng.
- **Nên cài vào màn hình chính:** Safari có thể tự xóa dữ liệu của trang web lâu ngày không mở. Bản cài vào màn hình chính an toàn hơn, nên game sẽ nhắc người chơi cài. Mã lưu dự phòng vẫn giữ. **(em đề xuất)**
- **Lưu game:** lưu ngay trên máy. Có 3 ô lưu cho nhiều người dùng chung một máy. Có nút xuất ra một mã lưu để cất giữ hoặc chuyển sang máy khác, vì xóa dữ liệu trình duyệt là mất hết. **(em đề xuất)**
- **Ngôn ngữ:** tiếng Việt.
- **Gemini:** anh có tài khoản Gemini Pro. Chỉ dùng khi cần, cho ảnh tham khảo hoặc vài ảnh lớn (màn hình mở đầu, chân dung khách VIP), và phải hỏi anh trước mỗi lần. Game không được phụ thuộc vào Gemini.
- **Nơi đặt game lên mạng:** GitHub Pages, vì anh đã có tài khoản GitHub. **(anh có GitHub, phần còn lại em đề xuất)**
  - Muốn đặt game miễn phí trên GitHub Pages thì mã nguồn phải để công khai. Thực ra game web nào thì ai mở cũng xem được phần code đã đóng gói. Để công khai chỉ lộ thêm mã nguồn dễ đọc và các tài liệu.
  - Nếu anh không muốn công khai thì chuyển sang Cloudflare Pages. Cách này cần thêm một tài khoản Cloudflare miễn phí, anh tự tạo.
  - Mỗi khi có bản mới, game tự được đóng gói và đưa lên mạng (bằng GitHub Actions, miễn phí với mã nguồn công khai).
  - Lần đầu đẩy code lên, máy sẽ mở trang đăng nhập GitHub để anh tự đăng nhập. Từ đó về sau Claude tự đưa bản mới lên được.
  - Việc này làm ở bước 1b. Bước 1a chơi thử qua Wi-Fi nhà.
- **Hiệu năng:** chạy mượt trên điện thoại tầm trung. **(em đề xuất)**

## 4. Các cách đã cân nhắc

### 4.1 Làm bằng gì

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **A. Game web + hình vector Claude tự vẽ** | Mở link là chơi. Claude tự chạy và tự kiểm tra được. Hình đồng đều, sắc nét ở mọi màn hình, miễn phí. Sau này vẫn đóng gói lên store được. | Hình đơn giản hơn tranh vẽ tay chi tiết. | **Anh chọn** |
| B. Godot (công cụ làm game) + hình vector | Ra app điện thoại gọn, chạy mượt hơn chút. | Claude không tự xem game chạy được. Anh phải cài phần mềm hoặc cài app thử rồi báo lỗi lại, nên mỗi lần sửa chậm hơn. | Loại |
| C. Game web + AI tạo hình | Hình chi tiết, giống tranh vẽ hơn. | Tốn phí. Khó giữ hàng trăm món cùng một nét. Hình phải xóa nền và chỉnh lại. Bán game thì phải đọc kỹ điều khoản. | Loại cho hình chính. Có thể dùng sau cho vài ảnh lớn qua Gemini. |
| Unity | | Quá nặng, phải thao tác qua phần mềm có giao diện. | Loại sớm |
| Mua bộ hình làm sẵn | | Không đủ đồ cho tiệm spa, mỗi bộ một nét vẽ. | Loại sớm |

**Công cụ cụ thể (em đề xuất):** TypeScript, thư viện làm game Phaser và công cụ đóng gói Vite. Phaser có sẵn sân khấu, nhận chạm, camera kéo và phóng to, chuyển động mượt, âm thanh và bản đồ ô lưới. Nó đúng thứ game này cần và miễn phí.

### 4.2 Góc nhìn

Đã làm bản phác thảo động cho cả hai cách, đặt trong khung điện thoại (`.superpowers/brainstorm/1251-1792908216/content/perspective.html`).

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| Nhìn ngang như nhà búp bê (giống quán sushi trong Dave the Dive) | Thấy nhiều tầng cùng lúc. Dễ vẽ, làm được nhiều đồ hơn. | Mỗi tầng là một dải ngang, chỉ kê đồ theo chiều trái phải. | Em đề xuất ban đầu, anh không chọn |
| **Nhìn chéo từ trên xuống (giống trang trại Stardew Valley)** | Kê đồ, xếp phòng tự do theo cả hai chiều. Cảm giác "ông chủ nhìn toàn cảnh" rõ hơn. | Mỗi lúc chỉ thấy một tầng. Nhân vật phải vẽ 4 hướng, nội thất phức tạp hơn, nên bản đầu sẽ ít đồ hơn. | **Anh chọn** |

### 4.3 Chủ tiệm

| Cách | Kết quả |
|---|---|
| **Chủ tiệm là một nhân vật đi lại trên màn hình, chọn được tóc và quần áo** | **Anh chọn** |
| Chủ tiệm chỉ là "bàn tay", chạm vào khách là bắt đầu phục vụ ngay | Không chọn |

### 4.4 Đưa phong cách A vào game

Anh đã chọn nét vẽ và cách xếp tiệm trên bảng Claude Design (mục 7). Có ba cách đưa vào game:

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **Vẽ lại bằng code, giữ cách làm của bước 1a** | Mọi hình vẫn sinh từ SVG trong code, nên nét sắc ở mọi cỡ màn hình và đồng đều với nhau. Nhân vật vẫn ghép bộ phận, tô màu bằng code. Không thêm công cụ hay thư viện hình. | Phải vẽ lại từng món bằng tay theo bản vẽ mẫu, tốn công nhất. | **Em chọn** |
| Xuất hình từ Claude Design thành ảnh rồi nạp vào | Phòng có ngay, giống hệt bản vẽ. | Nhân vật không ghép bộ phận được nữa. Ảnh mờ khi phóng to. Mỗi lần sửa phải xuất lại. | Loại |
| Dùng nguyên bản vẽ mẫu làm ảnh nền | Nhanh nhất. | Đồ đạc dính vào nền nên không che nhân vật đúng lớp. Bước 1b kê đồ theo ô không làm được. | Loại |

Em chọn cách đầu vì nó giữ được hai thứ đã chốt: nhân vật ghép bộ phận (mục 7.2) và kê đồ theo ô ở bước 1b. Phần luật chơi chỉ đổi đúng chỗ cần cho giường gội (mục 7.3).

## 5. Thiết kế game

### 5.1 Vòng chơi chính (em đề xuất, anh đồng ý)

Khách tới, chờ, được phục vụ, trả tiền, để lại đánh giá. Người chơi dùng tiền để nâng cấp hoặc thuê người. Tiệm tốt hơn thì khách tới đông hơn và chịu chi hơn. Cứ thế lặp lại.

### 5.2 Ba giai đoạn (anh chọn)

1. **Mới mở:** ít vốn, một tầng nhỏ, chủ tiệm tự làm mọi dịch vụ qua mini-game.
2. **Có tiền:** thuê nhân viên làm phụ. Chủ tiệm vẫn tự làm phần lớn hoặc chỉ những khách khó.
3. **Tiệm lớn:** nhân viên làm hết. Chủ tiệm lo quản lý: phục vụ khách VIP (chỉ chủ tiệm làm được), đào tạo nhân viên, xử lý sự kiện, mở rộng tiệm và mở chi nhánh. Đây là cách giữ cho giai đoạn cuối không nhạt.

Giữa các giai đoạn không có ranh giới cứng. Người chơi tự chuyển dần khi thuê thêm người.

### 5.3 Một ngày trong game (em đề xuất)

- Tiệm mở từ 8 giờ sáng đến 8 giờ tối, bằng khoảng 2 phút 30 giây ngoài đời. **(anh chọn)**
- Hết giờ thì không nhận khách mới, khách đang làm được làm nốt.
- Cuối ngày có bảng tổng kết: thu, chi (lương, nguyên liệu), số khách, đánh giá trung bình.
- Giữa hai ngày là lúc nâng cấp, kê đồ, nhập hàng và thuê người. Trong giờ mở cửa vẫn kê đồ được, nhưng có thể làm gián đoạn khách.
- Người chơi có thể tạm dừng bất cứ lúc nào.

### 5.4 Chủ tiệm và điều khiển

- **Tạo nhân vật (anh chọn):** lúc bắt đầu game, chọn kiểu tóc, màu tóc, màu da và quần áo. Người chơi cũng tự đặt tên cho tiệm. **(em đề xuất)**
- **Mở thêm trang phục:** chơi lâu mở được thêm trang phục, bằng tiền hoặc thành tựu. **(em đề xuất)**
- **Điều khiển một tay (em đề xuất):**
  - Chạm vào sàn thì nhân vật đi tới đó, tự tìm đường vòng qua đồ đạc.
  - Chạm vào khách hoặc đồ vật thì nhân vật đi tới rồi làm luôn: mời khách vào, bắt đầu mini-game, dọn giường, nói chuyện với nhân viên.
  - Vuốt để di chuyển màn hình, chụm hai ngón để phóng to thu nhỏ.

### 5.5 Màn hình chính (theo bản phác thảo B)

- Thanh trên cùng: tiền, đánh giá sao, ngày và giờ trong game.
- Nút chuyển tầng ngay dưới thanh trên cùng. Tầng chưa mở hiện viền đứt kèm giá. Tầng khác đang cần chú ý thì nút tầng đó có chấm thông báo.
- Khu vực chính là tầng đang xem, nhìn chéo từ trên xuống, chia ô lưới.
- Thanh dưới cùng có 4 nút: Xây dựng, Nhân viên, Dịch vụ, Nhiệm vụ.
- Các tầng chạy song song. Tầng không xem vẫn có khách và nhân viên làm việc.

### 5.6 Mini-game dịch vụ (em đề xuất)

- Mỗi dịch vụ là một mini-game ngắn khoảng 15–30 giây, chơi bằng chạm và vuốt.
- Kết quả chấm 1 đến 3 sao. Làm càng khéo thì khách càng vui, tip càng nhiều.
- Khi nhân viên làm thì không có mini-game. Chất lượng tính theo chỉ số của nhân viên, và nhân viên lúc mới thuê làm kém hơn chủ tiệm.

Ba mini-game của đợt 1:

| Dịch vụ | Cách chơi |
|---|---|
| Gội đầu | Vuốt qua lại trên tóc để tạo bọt cho đầy thanh, giữ ngón tay để xả nước, rồi vuốt để lau khăn. |
| Đắp mặt nạ | Tô kín khuôn mặt bằng ngón tay, tránh vùng mắt, rồi đặt lát dưa leo lên mắt. |
| Massage | Chạm đúng nhịp vào các điểm sáng trên lưng khách, giữ ngón tay để ấn huyệt. |

Khách VIP và khách khó tính có phiên bản khó hơn của cùng mini-game.

### 5.7 Khách hàng

- **Đường đi của khách:**
  1. Đi vào cửa, tới quầy lễ tân, chọn dịch vụ.
  2. Ngồi chờ, trên đầu có thanh kiên nhẫn.
  3. Vào giường hoặc ghế, được phục vụ.
  4. Trả tiền, để lại đánh giá (bong bóng biểu cảm trên đầu), rồi ra về.
- **Hết kiên nhẫn:** khách bỏ về, và đánh giá của tiệm giảm.
- **Lối đi ảnh hưởng tới khách:** khách tự tìm đường. Kê đồ chắn lối thì khách đi lâu hơn và mất kiên nhẫn nhanh hơn.
- **Lượng khách** tăng theo đánh giá sao, độ đẹp của tiệm và các dịch vụ đang có.
- **Kiểu khách (em đề xuất):** sinh viên ít tiền, dân văn phòng vội, khách khó tính, người nổi tiếng. Đợt 1 có 4–5 kiểu. Mỗi kiểu khác nhau ở độ kiên nhẫn, số tiền chịu chi, dịch vụ hay chọn và độ khó tính khi chấm điểm.
- **Ngoại hình:** khách được ghép ngẫu nhiên từ bộ phận (tóc, mặt, áo, màu da), nên chỉ cần vẽ ít mà vẫn ra nhiều người khác nhau.

### 5.8 Nhân viên (nhóm 1)

- **Tuyển người:** có bảng ứng viên, đổi mới mỗi ngày. Thỉnh thoảng có ứng viên giỏi hiếm gặp.
- **Chỉ số:** tay nghề, tốc độ, thân thiện. Có thêm sức bền: mệt thì phải nghỉ.
- **Tiền và cấp:** có lương theo ngày. Làm nhiều thì lên cấp, chỉ số tăng.
- **Vai trò:** lễ tân và kỹ thuật viên ở đợt 1. Nhân viên dọn dẹp thêm sau.
- **Để sau:** tính cách riêng (ví dụ "khéo tay nhưng hay đi trễ"), học thêm chuyên môn, đòi tăng lương.

### 5.9 Dịch vụ và nguyên liệu (nhóm 3)

- Dịch vụ mở dần theo cây: gội đầu, đắp mặt nạ, massage, rồi đá nóng, tắm bùn, xông hơi. Đợt 1 chỉ có 3 dịch vụ đầu.
- Mỗi dịch vụ cần đúng loại đồ đạc mới làm được, ví dụ giường gội đầu, giường massage.
- Có kho nguyên liệu (tinh dầu, mặt nạ, khăn), dùng hết thì phải nhập hàng.
- Để sau: tự pha công thức để mở dịch vụ cao cấp.

### 5.10 Xây dựng và trang trí (nhóm 4)

- Sàn mỗi tầng chia ô lưới. Đồ đạc chiếm một số ô, kéo thả để đặt, xoay được.
- Tường và vách ngăn chia phòng.
- Mỗi món đồ có điểm "đẹp". Tổng điểm đẹp của tiệm giúp hút khách.
- Nâng cấp đồ, ví dụ giường gỗ lên giường cao cấp: khách thoải mái hơn, phục vụ nhanh hơn.
- Nội thất đi theo bộ phong cách (Nhật, Bali, Hàn, tối giản…). Gom đủ một bộ thì được thưởng thêm. Đợt 1 có 1–2 bộ.
- Mở thêm tầng bằng tiền. Có cầu thang hoặc thang máy nối các tầng.

### 5.11 Tiền và đánh giá

- Tiền vào: giá dịch vụ cộng tiền tip.
- Tiền ra: lương, nguyên liệu, nội thất, mở tầng.
- Đánh giá sao của tiệm là trung bình các đánh giá gần đây.
- Độ khó vừa phải: khó lỗ nặng tới mức phải bỏ save chơi lại. Nếu hết sạch tiền thì có cách gỡ, ví dụ vay nhẹ hoặc giảm giá dịch vụ.

### 5.12 Lưu game

- Tự lưu cuối mỗi ngày trong game, và lưu định kỳ trong ngày.
- Có 3 ô lưu.
- Xuất và nhập mã lưu bằng chép và dán.

### 5.13 Âm thanh (em đề xuất)

- Nhạc nền nhẹ nhàng, thư giãn.
- Tiếng động: tiền rơi, nước chảy, chuông cửa, tiếng bấm nút.
- Lấy từ kho âm thanh miễn phí được phép dùng tự do (CC0), ghi rõ nguồn trong game.
- Có nút tắt nhạc và tắt tiếng riêng.

### 5.14 Dẫn dắt người mới (em đề xuất)

Người chơi ít chơi game, nên:

- **Hướng dẫn ngày đầu:** ngày đầu tiên có hướng dẫn từng bước, chỉ dạy bằng cách cho làm thật. Ví dụ: một bàn tay chỉ vào khách, kèm một câu ngắn "Chạm vào khách để mời vào".
- **Mở từ từ:** mỗi tính năng mới (thuê người, nhập hàng, kê đồ) chỉ hiện ra khi cần tới, kèm một lời giải thích ngắn. Không dồn hết vào ngày đầu.
- **Dễ trước khó sau:** mini-game và thanh kiên nhẫn của khách những ngày đầu nới tay, khó dần theo cấp độ tiệm.
- **Nút bấm dễ hiểu:** chữ rõ ràng, có biểu tượng đi kèm. Nút đủ to để bấm bằng ngón cái.

## 6. Bảy nhóm tính năng mở rộng và thứ tự làm

Các nhóm (em đề xuất, anh đồng ý):

1. Nhân viên có chiều sâu
2. Khách hàng và sổ sưu tập
3. Dịch vụ và nguyên liệu
4. Trang trí theo phong cách
5. Mở chi nhánh, là phần chính của cuối game
6. Sự kiện
7. Mục tiêu dài hạn

Nội dung chi tiết các nhóm đã ghi ở mục 5 và trong phần các đợt dưới đây.

### Đợt 1: bản chơi được

Đợt này gồm phần core cộng nhóm 1, 3, 4 ở mức cơ bản và vài kiểu khách. **(anh chọn)**

Em đề xuất chia đợt này làm hai bước:

**1a. Một lát cắt mỏng để duyệt cảm giác chơi trước.** Anh chơi thử trên điện thoại và duyệt cảm giác trước khi làm tiếp. Bước này gồm:
- Một tầng nhỏ.
- Chủ tiệm đi lại bằng chạm.
- Khách vào, chờ, được phục vụ, rồi về.
- Một mini-game (gội đầu).
- Tiền, đánh giá, và một ngày trọn vẹn có bảng tổng kết.
- Anh chơi thử qua Wi-Fi nhà: máy tính chạy game, điện thoại mở một link nội bộ. Bước này chưa cần đặt game lên mạng, nên chưa cần tài khoản nào. **(em đề xuất)**

**1b. Hoàn thiện đợt 1:**
- Tạo nhân vật chủ tiệm và đặt tên tiệm.
- Hướng dẫn ngày đầu và mở tính năng từ từ (mục 5.14).
- Đủ 3 mini-game, 4–5 kiểu khách.
- Kê đồ theo ô lưới, 1–2 bộ nội thất.
- Thuê nhân viên cơ bản.
- Kho và nhập hàng.
- Lưu game, 3 ô lưu, xuất nhập mã.
- Âm thanh.
- Cài như app và chơi không cần mạng.
- Đặt game lên mạng để cả nhà mở link.

### Các đợt sau (thứ tự em đề xuất, anh sửa được sau khi chơi đợt 1)

- **Đợt 2:**
  - Mở tầng 2 và tầng 3.
  - Thêm dịch vụ (đá nóng, tắm bùn, xông hơi) và pha công thức.
  - Khách quen có câu chuyện và thẻ thành viên, sổ sưu tập khách.
  - Khách VIP chỉ chủ tiệm phục vụ.
  - Nhân viên có tính cách, chuyên môn, đào tạo.
- **Đợt 3:**
  - Sự kiện theo lịch thật (Tết, Trung thu, Valentine) và sự kiện ngẫu nhiên (thanh tra vệ sinh, KOL ghé review, đối thủ mở sát bên, mất điện).
  - Nhiệm vụ hằng ngày và hằng tuần, thành tựu.
  - Xếp hạng tiệm 1 đến 5 sao, giải "Spa của năm".
  - Tắt game tiền vẫn vào khi đã có nhân viên làm hết.
  - Thêm trang phục cho chủ tiệm.
- **Đợt 4:**
  - Mở chi nhánh: bãi biển, phố cổ, khu cao cấp, mỗi nơi một kiểu khách.
  - Điều nhân viên và hàng hoá giữa các chi nhánh.
  - Làm lại từ đầu: bán chuỗi spa để bắt đầu lại, đổi lấy phần thưởng giữ mãi về sau.
  - Thêm tiếng Anh.
  - Lên store nếu anh muốn trả phí.

## 7. Phong cách hình ảnh

Anh chọn hướng **A · Gạch bông Sài Gòn** trên bảng Claude Design, rồi duyệt cách xếp tiệm vẽ lại trên bảng đó. **(anh chọn, 2026-10-25)** Bản vẽ mẫu đã duyệt nằm ở `docs/art/style-a-board.svg`, khung điện thoại 390 × 844. Hình trong game vẽ theo bản này.

### 7.1 Nét vẽ

- **Chất liệu Sài Gòn xưa:** gạch bông, mây tre, gỗ nâu, sứ xanh trắng, đèn lồng đỏ, cửa chớp xanh, hoa sen, hoa đào. **(anh chọn)**
- **Viền nâu đậm cho mọi hình:** đồ đạc, nhân vật, nút bấm, hiệu ứng đều có viền màu #4A2E22. Nhờ viền chung, món vẽ sau vẫn khớp với món vẽ trước. **(anh chọn)**
- **Màu phẳng, không tô bóng mềm.** Bóng dưới chân nhân vật là một hình elip nâu mờ.
- **Độ dày nét (em đề xuất):** viền ngoài dày khoảng 4 điểm ảnh trên khung game rộng 1080, nét chi tiết bên trong khoảng 2–3 điểm ảnh. Trên bản vẽ 390 thì là 1,5 và 1 điểm.
- **Bảng màu (lấy từ bản vẽ mẫu):**

| Màu | Mã | Dùng cho |
|---|---|---|
| Nâu viền | #4A2E22 | viền, chữ |
| Kem | #FBF7EE, #FBF3E4 | sứ, thanh trên và dưới, ô gợi ý |
| Cát | #F3E6D3 | nền ngoài khung game |
| Đất nung | #C65D3B | gạch bông, nệm ghế chờ, khăn |
| Xanh ngọc | #2F7D6E, #3E9682, #2A6B5C | áo bà ba, nệm giường, cửa chớp, nút tạm dừng |
| Vàng nghệ | #E3A73B, #C78A22 | đồng xu, sao, đồ đồng thau |
| Tường vàng | #F2CC6B, #E0B04F | tường |
| Xanh men | #2D5FA8 | sứ xanh trắng, viền nút thanh dưới |
| Gỗ | #8A5634, #6B4027, #A86E45 | giường, quầy, kệ, tủ |
| Sàn gỗ | #C99A6A, vân #A87A4E | phòng gội |
| Đèn lồng | #D8463A, #A8302A | đèn lồng, mặt bực |
| Sen, đào | #F28CA0, #E8708A | hoa |
| Lá | #4E9A6B, #5FAE7B | cây |
| Nước, kính | #BFE3F2, #7FC4D8, #CFE8F0 | chậu gội, bể sen, mặt tiền kính |
| Mây đan | #D9A866, sợi #B98544 | bình phong, ghế chờ |
| Chiếu cói | #EBD29E, sợi #D9B577 | thảm lối đi, thảm dưới ghế chờ |

- **Gạch bông:** viên vuông nền kem #F6ECDB, bốn góc là bốn phần tư hình tròn đất nung, giữa là hoa bốn cánh xanh ngọc, nhụy và hình thoi ở mép màu vàng nghệ, ron #E2D3BC. Mỗi viên đúng bằng một ô lưới, để người chơi nhìn ra ô khi kê đồ ở bước 1b. **(em đề xuất)**
- **Chữ:** Be Vietnam Pro, độ đậm 600 và 800, thay cho Baloo 2. Phông miễn phí (giấy phép OFL), làm cho tiếng Việt nên dấu chồng như ặ, ố, ữ hiện đẹp. **(em đề xuất)**
- **Thanh trên, thanh dưới và nút:** nền kem, viền nâu. Đồng xu vàng có lỗ vuông như xu xưa. Sao vàng viền nâu. Nút tạm dừng tròn xanh ngọc. Bốn nút thanh dưới là hình tròn kem, viền đôi xanh men như đĩa sứ. Ô gợi ý nền kem, góc bo nhỏ, viền nâu. Thanh kiên nhẫn của khách nền kem viền nâu.
- **Hiệu ứng:** hơi nước bốc lên, tiền bay lên, sao lấp lánh, bong bóng biểu cảm, vòng gợi ý chỗ chạm. Bong bóng nền kem viền nâu, vòng gợi ý màu trắng.
- **Đồ đạc:** vẽ theo góc nhìn chéo từ trên xuống, khớp với ô lưới.

### 7.2 Nhân vật

- **Nhân vật:** kiểu chibi đầu to, má hồng, đường nét đơn giản, viền nâu như đồ đạc.
- **Trang phục (em đề xuất):** chủ tiệm mặc áo bà ba xanh ngọc, quần nâu. Khách mặc áo đất nung, vàng nghệ, xanh men, hồng sen hoặc kem. Không khách nào mặc xanh ngọc, để liếc qua là nhận ra chủ tiệm. Da và tóc lấy từ tông trong bản vẽ mẫu.
- **Nhân vật ghép từ bộ phận (em đề xuất):** đầu, tóc, mặt, áo, tay, chân vẽ riêng. Nhờ vậy:
  - Đổi tóc và quần áo cho chủ tiệm được.
  - Sinh ra nhiều khách khác nhau từ ít hình.
  - Cử động bằng cách xoay, nhún các bộ phận, không phải vẽ từng khung hình. Rẻ hơn và mượt hơn.
- **Hướng nhìn:** mỗi nhân vật có mặt trước, sau lưng và bên hông. Hướng bên kia lật hình lại.
- **Cử động tối thiểu:** đi, đứng làm việc, ngồi chờ, nằm trên giường, biểu cảm vui hoặc bực. Khách nằm ngửa trên giường gội, đắp khăn, mắt nhắm.

### 7.3 Cách xếp tiệm lúc mới mở (anh duyệt, 2026-10-25)

Đồ đạc xếp theo đường đi của khách, từ ngoài cửa vào trong:

- **Mặt tiền:** cửa kính hai bên, cửa ra vào ở giữa có thảm đỏ. Kệ dép cạnh cửa. Hai chậu cây ở hai góc.
- **Lễ tân:** quầy gỗ bên phải cửa, trên quầy có bình hoa sen, sổ và chuông đồng. Đầu ngày chủ tiệm đứng sau quầy. **(em đề xuất)**
- **Lối đi:** thảm cói chạy thẳng từ cửa vào tới khe hở của bình phong.
- **Chỗ chờ:** ghế dài 3 chỗ, nệm đất nung, quay mặt ra cửa kính, trên thảm cói. Bàn trà có ấm và chén ở phía trước ghế, chừa một hàng ô để đi.
- **Bồn cây thấp sau lưng ghế chờ (em đề xuất, chưa có trên bảng):** chắn để khách không đi xuyên qua lưng ghế và chủ tiệm không đứng sau lưng ghế để mời khách. Khách vào và ra khỏi ghế từ phía trước hoặc hai đầu ghế.
- **Bình phong mây** chia đôi tiệm, chừa khe hở ở giữa thẳng với cửa. Sát bình phong phía ngoài: kệ sản phẩm bên trái, bể sen sứ xanh bên phải. Góc phải có bình hoa đào.
- **Phòng gội phía trong, sàn gỗ:** 2 giường gội đặt dọc, đầu giường sát chậu sứ gắn tường. Chủ tiệm đứng bên phải giường để gội. Hai chỗ giường trống vẽ viền đứt có dấu +, gợi ý mua thêm giường sau. Ở bước 1a chưa mua được: chạm vào thì hiện "Tính năng này có ở bản sau", giống các nút thanh dưới. **(em đề xuất)** Tủ khăn ở góc phải, cửa chớp xanh phía trên. Đèn lồng đỏ treo giữa các giường, đồng hồ giữa tường. Một chậu cây ở góc phải.
- **Khách nằm thay vì ngồi:** khách được gội nằm trên giường. Bước 1a đổi ghế gội thành giường gội.

Sơ đồ ô của tiệm (13 cột × 18 hàng; hàng 0–1 là tường sau, hàng 17 là mặt tiền):

```
#############
#############
#.B.B.E.EKKK#
#.CWCW......#
#.B.B.......#
#..........P#
#HHHHH.HHHHH#
#.LLL....OO.#
#...........#
#...........#
#...........#
#..........V#
#.YYY.......#
#.SSS.......#
#.......RRR.#
#..TT.......#
#P..GG.....P#
######D######
```

Ký hiệu: `#` tường, `.` sàn, `D` cửa, `S` chỗ ngồi chờ, `C` giữa giường gội (khách nằm ở ô này), `B` đầu và chân giường, `W` chỗ chủ tiệm đứng gội (bên phải giường), `E` đầu một chỗ giường trống (vẫn đi qua được), `R` quầy lễ tân, `P` chậu cây, `H` bình phong, `K` tủ khăn, `L` kệ sản phẩm, `O` bể sen, `V` bình hoa đào, `T` bàn trà, `G` kệ dép, `Y` bồn cây.

- **Nhịp chơi (em đề xuất):** đường từ ghế chờ vào giường giờ dài hơn bước 1a. Từ lúc chạm vào khách đang chờ tới lúc mở mini-game không quá 8 giây, kể cả khi khách ngồi chỗ xa nhất và chủ tiệm đang đứng ở quầy. Muốn vậy thì khách đi nhanh hơn trước.

## 8. Kiểm tra và tiêu chí xong

- **Tách luật chơi khỏi phần hình (em đề xuất):** phần luật chơi (khách tới, tính tiền, chỉ số nhân viên, lưu game) viết tách riêng, để kiểm tra tự động được mà không cần mở hình.
- **Claude tự kiểm tra:** Claude tự chơi thử trên trình duyệt ở cỡ màn hình iPhone trước khi gửi anh. Chạm, cuộn, phóng to thu nhỏ và âm thanh trên Safari thật thì anh kiểm tra giúp trên iPhone 17.
- **Tiêu chí xong của đợt 1a:**
  - Anh mở link trên điện thoại.
  - Chơi trọn một ngày trong game không gặp lỗi.
  - Thấy nhân vật đi lại và thao tác thật.
  - Anh thấy vui và muốn chơi tiếp.
- **Tiêu chí thành công lâu dài (em đề xuất):** người nhà anh tự quay lại chơi nhiều ngày liền mà không cần nhắc.

## 9. Để người làm tự quyết

- Mọi con số cân bằng game: giá dịch vụ, lương, tốc độ khách tới, độ kiên nhẫn, chi phí mở tầng.
- Kích thước ô lưới, độ phân giải gốc, cách co giãn theo màn hình.
- Cách tổ chức code, định dạng dữ liệu, cách viết kiểm tra tự động.
- Hình vector nạp thẳng hay chuyển sẵn thành ảnh lúc đóng gói, chọn sao cho mượt trên điện thoại tầm trung.
- Phiên bản cụ thể của Phaser và các thư viện, miễn là miễn phí.
- Chi tiết từng bước trong mini-game, miễn đúng tinh thần ở mục 5.6.
- Chọn cụ thể nhạc và tiếng động, miễn là CC0 và hợp không khí thư giãn.

## 10. Còn để ngỏ

- **Tên game:** chưa đặt. Trong game, người chơi tự đặt tên tiệm.
