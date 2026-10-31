# Phây: mạng xã hội trong game

- Ngày: 2026-10-31
- Trạng thái: chồng yêu đã duyệt bản phác và 11 điểm ("Anh duyệt cả 11 điểm", 2026-10-31), kèm một thay đổi: giá đẩy bài ×1,5. Đã qua một lượt người làm đọc thử; ba câu hỏi của họ em tự quyết (ngôi sao 1★, lý do cúp điện, đẩy bài hai ngày liền). Tài liệu này chờ chồng yêu duyệt.
- Bản phác: https://claude.ai/artifact/HxdS1nWs8UbKJL2vKYFitu
- Lý do: chồng yêu thấy "game càng về cuối càng hết thứ để làm, tiền dư không biết làm gì". Trong 24 ý em đưa ra, chồng yêu chọn làm trước mạng xã hội trong game, loại "có việc để chơi", theo cách A.

Cách đọc giống các spec trước:
- **(chồng yêu chọn)** là điều chồng yêu đã quyết.
- **(em đề xuất)** là em tự điền, chồng yêu sửa được sau khi chơi thử.
- Mọi con số là số khởi đầu.

## 1. Chồng yêu muốn gì

- **Một app giống Facebook trên điện thoại của chủ tiệm, tên Phây.** Chuyện thật trong tiệm thành bài đăng, để thế giới trong game như đang nhìn vào tiệm mình. **(chồng yêu chọn)**
- **Có việc để chơi, không chỉ để đọc:** trả lời khách chê, và bỏ tiền đẩy bài. **(chồng yêu chọn)**
- **Cách A:** bài đăng ghi lại chuyện thật và được lưu. Người theo dõi là con số để khoe, không đổi luật tiền và khách đang có. **(chồng yêu chọn)**
- **Giá đẩy bài ×1,5** so với bản phác đầu. **(chồng yêu chọn)**

## 2. Mục tiêu, việc chưa làm, điều cấm

### Mục tiêu
- Cuối game có thêm cái để xem mỗi ngày và một đích dài để đuổi theo (người theo dõi, tích xanh, khung vàng).
- Tiền dư có chỗ tiêu có ý nghĩa: đẩy bài.
- Khách chê có cách gỡ lại, nên một ngày xui không phải chịu mãi.

### Chưa làm
- Chủ tiệm tự chụp ảnh tiệm rồi đăng (chụp màn hình trong game tốn công).
- Người theo dõi làm tăng khách (cách C, chồng yêu không chọn).
- Bài và bình luận của người nhà thật, so tiệm với nhau.
- Khách ở chi nhánh đăng bài.

### Điều cấm
- Bản lưu cũ mở lên bị mất hay đổi bất cứ thứ gì đang có.
- Không có lượt đẩy bài nào mà số ngẫu nhiên của sim vẫn bị rút khác đi (`same-draws.test.ts` phải qua nguyên vẹn).
- Phây làm mất tiền, mất khách hay hạ sao khi người chơi bỏ qua nó. Không trả lời, không đẩy bài thì game y như bây giờ.
- Thông báo của Phây đè lên mini-game, thẻ vàng, thẻ tổng kết hay lúc đang phục vụ khách.
- Ngôi sao có thật nói lời chê tiệm (xem 4.6).
- Emoji trong chữ.

## 3. Hiện giờ (cho người làm)

- **Đánh giá:** `SpaSim.reviews: number[]` (`src/sim/spa.ts`), điểm 1–5. `rating()` lấy trung bình 20 điểm cuối (`RATING_WINDOW`). `addReview(c, score)` đẩy điểm 1 lần, 2 lần (lady, celeb) hoặc 3 lần (VIP, ngôi sao); Mi Mi không chấm. Bản lưu chỉ giữ 20 điểm cuối. **Điểm không mang mã khách**, nên hiện chưa tìm lại được điểm của một khách.
- **Điểm 1–2 chỉ đến từ hai đường:** khách giận bỏ về (`loseCustomer`, điểm `ANGRY_REVIEW` = 1), hoặc khách khó tính (picky, lady, celeb) được 1★ dịch vụ (điểm 2). Khách không có ghế thì bỏ đi không chấm.
- **Lý do biết được ngay lúc chấm:**
  - trong `loseCustomer`: thiếu hàng (`missingStock`), máy nghỉ vì cúp điện (`machineDown`), còn lại là chờ lâu;
  - trong `payFor`: `technician === null` là chủ tiệm làm; thợ "làm vội" có sự kiện `sloppy` nhưng không mang mã khách, phải truyền cờ vào `payFor`.
- **Khách tới:** khoảng cách giữa hai khách nhân với `arrivalFactor()`. Tiệm chính dùng `eventArrivalFactor()` = `min(lễ 0,8, ngày hot 0,8)`. `eventPatienceFactor()` cho khách kiên nhẫn ×1,2 ngày lễ và ngày hot. `recordDay(..., busy)` không tính ngày bận vào `progress.recent`.
- **Ngày hot của Mi Mi** (`EventBook.hotUntil`, `makeHot`, sự kiện `hotStarted`) là mẫu "từ sáng mai" để làm đẩy bài.
- **Boa:** `tipFor` × hệ số loại khách × `tipFactor` × `POWER_TIP_FACTOR` lúc cúp điện; boa hào phóng nhân thêm `GENEROUS_TIP` = 5.
- **Lãi trung bình 3 ngày:** `awayMean(sim.away)` (`src/sim/away.ts`), làm tròn 1.000 đ, có thể âm hoặc 0.
- **Mở khóa:** `UNLOCK_DAY.quests = 8`; `featureOpen`.
- **Chuỗi:** `Chain` (`src/sim/chain.ts`). Mọi sự kiện của chi nhánh bị bỏ; khi chủ ở chi nhánh, sự kiện của tiệm chính chỉ giữ loại trong `HELD`, nên `review`, `vipServed`, `idolServed` bị mất ở màn hình. Hạng tháng, Spa của năm, mở chi nhánh, nhận thú cưng không phát sự kiện nào. **Vì vậy bài phải được tạo trong sim, không phải ở màn hình.**
- **Số ngẫu nhiên riêng:** mỗi luồng là `createRng(day * PRIME + nextId [+ muối])` với số nguyên tố riêng (3301, 4241, 5303, 6151, 7919, 8737 đã dùng).
- **Bản lưu:** `SAVE_VERSION = 34` trên origin/master lúc viết. Nhánh `do-trang-tri` của phiên khác đã lấy 35. Mỗi khối mới sửa trong `parseShop` bằng một hàm `repair*`; thiếu thì lấy giá trị mặc định. Tăng số thì sửa cả danh sách trắng ở `save.ts` (`raw.v !== …`), `withNewKeys` và test phiên bản.
- **Màn hình:** thanh trên y 30–200; nút dừng (995, 115); nút sổ khách (870, 152). Bản đồ bắt đầu từ y 210. Dưới thanh trên bên phải có lúc hiện thẻ vàng (x 110–970, từ y 236), dải tên chi nhánh (y 198–262), băng chào buổi sáng (y 300). Mở bảng theo kiểu `QuestsScene`: `modal = true`, `scene.launch`, đóng thì `saveNow()`. Chưa có bảng nào cuộn. `queueToast` và `badgeQueue`/`pumpBadges`/`shopFree()` là hàng chờ thông báo.
- **Tên:** loại khách `KINDS`, chữ `kindStudent`…; khách quen `REGULAR_TEXT[id].name`; VIP `VIP_TEXT`; ngôi sao `IDOL_TEXT`; Mi Mi `kol*`; SPA MỚI `rivalSignName`. Chữ ở `src/strings/vi.ts`, điền tham số bằng `t(key, params)`; danh sách câu là mảng riêng (ví dụ `GENEROUS_LINES`).

## 4. Thiết kế

### 4.1 App và nút điện thoại **(chồng yêu duyệt)**

- Nút tròn hình điện thoại, nằm ngay dưới thanh trên, bên phải, cùng cột với nút phóng to (khoảng x 1010, y 280, bán kính 44) **(em đề xuất vị trí cụ thể)**.
- Chấm đỏ có số bài chưa đọc ("9+" khi quá 9). Mở Phây là đọc hết.
- Có từ ngày 8, cùng lúc Nhiệm vụ (`featureOpen('quests')`, nên chuỗi ngày đầu mở sớm thì Phây cũng mở sớm). Trước đó nút không hiện và không có bài nào.
- Nút hiện cả khi chủ tiệm ở chi nhánh (Phây là của cả chuỗi).
- Nút ẩn khi thẻ vàng, dải tên chi nhánh hay băng buổi sáng đang hiện ở chỗ đó **(em đề xuất)**.
- Chạm thì mở bảng Phây như các bảng khác: cả chuỗi dừng. Không mở khi đang có thẻ, mini-game, đang phục vụ khách hay đã hết ngày.

### 4.2 Bảng Phây **(chồng yêu duyệt, theo bản phác)**

- Một khung điện thoại phủ gần hết màn hình. Trên cùng: chữ Phây và nút đóng. Dưới đó: ảnh chủ tiệm, tên tiệm, tích xanh (từ 100.000), viền vàng quanh ảnh (từ 1.000.000), dòng "N người theo dõi".
- Danh sách bài mới nhất ở trên, **vuốt lên xuống để lướt**. Mỗi bài có: ảnh đại diện, tên (tích cho ngôi sao, Mi Mi, phường), "Ngày N · HH:MM", sao (bài của khách), chữ, có khi có ảnh, số thích, số bình luận, 0–2 bình luận, và nút của bài (Trả lời, Đẩy bài).
- Bài chê chưa trả lời có viền đỏ đất và dòng lý do.
- Cách cuộn **(em đề xuất)**: không dùng mặt nạ. Danh sách vẽ phía sau, phần đầu khung và đáy khung vẽ đè lên, che phần bài bị cắt. Kéo quá 14 px thì là vuốt, không tính là chạm.
- Ảnh trong bài **(em đề xuất)**: ngôi sao đứng cạnh chủ tiệm trước bảng tên tiệm; Mi Mi với nút phát và "0:45"; bảng sao của tiệm; giấy khen. Bài của khách chỉ có chữ.

### 4.3 Ai đăng bài **(chồng yêu duyệt)**

Bài được tạo trong sim của tiệm chính, ngay lúc chuyện xảy ra:

| Bài | Khi nào | Ghi chú |
|---|---|---|
| Khách khen | Điểm 5, tối đa 3 bài một ngày | Bài đầu tiên của ngày luôn đăng; sau đó mỗi điểm 5 có 1/3 cơ hội đăng, tới khi đủ 3 **(em đề xuất)** |
| Khách chê | Điểm 1–2, tối đa 3 bài một ngày | Mỗi lần chấm 1–2 đều đăng cho tới khi đủ 3; quá 3 thì không đăng và không trả lời được |
| Ngôi sao | Mỗi lần ngôi sao được phục vụ xong với 2★ hoặc 3★ | Ảnh chụp chung, thích rất nhiều. Phục vụ 1★ thì không có bài khoe mà có bài chê của quản lý (4.6) **(em đề xuất)** |
| VIP | Mỗi lần VIP được phục vụ xong với 2★ hoặc 3★ | Phục vụ 1★ thì VIP tự đăng bài chê bằng tên mình, vì VIP là nhân vật bịa **(em đề xuất)** |
| Mi Mi | Khi Mi Mi đăng video (`kolPosted`) | Có ảnh video |
| SPA MỚI | Sáng ngày thách đấu, và khi tiệm mình thắng (`rivalBeaten`) | Có bình luận khách quen bênh tiệm mình |
| Tiệm mình | Lên sao hạng, Spa của năm (hạng 1–3), giấy khen thanh tra, mở chi nhánh, mua nhà (cả ở chi nhánh), mở tầng, nhận thú cưng, ngày đầu mùa lễ | |

- Khách quen đăng bằng tên thật của họ trong sổ. Khách lạ đăng bằng một tên gọi mẫu theo loại khách (ví dụ "Chị Thu", "Anh Tuấn", "Bác Ba") **(em đề xuất)**.
- Khách ở chi nhánh không đăng bài. Mi Mi, ngôi sao, VIP, SPA MỚI chỉ có ở tiệm chính nên đã đúng như vậy.
- Bài vẫn được tạo khi chủ tiệm đang ở chi nhánh; bài chỉ chờ trong Phây.

### 4.4 Lời viết **(chồng yêu duyệt, kiểu Tracery)**

- Mỗi loại bài có các mẫu câu ghép từ mảnh, ví dụ: `[mở đầu] [khen dịch vụ theo tên dịch vụ] [kết]`. Mảnh chọn theo loại khách, dịch vụ và số điểm, để ít khi lặp.
- Viết trong một tệp chữ riêng (`src/strings/phay.ts`), không thêm thư viện.
- Lời được ghép xong rồi **lưu nguyên câu vào bài** **(em đề xuất)**: đổi mẫu câu ở bản sau không làm đổi bài cũ.
- Không emoji. Mỗi câu không quá khoảng 120 chữ.
- Bình luận cũng lấy từ mẫu, người bình luận là khách quen (tên thật) hoặc tên mẫu.

### 4.5 Thích, bình luận, người theo dõi **(chồng yêu duyệt)**

- Số thích của bài phụ thuộc số người theo dõi lúc đăng và loại bài. Ngôi sao và Mi Mi có số thích riêng rất lớn (người hâm mộ của họ).
- Mỗi bài cộng thêm người theo dõi. Mục tiêu khởi đầu để người làm chỉnh hệ số bằng một đoạn chạy thử nhiều ngày:
  - khoảng 1.000 vào ngày 20–30;
  - khoảng 10.000 vào ngày 60–90;
  - 100.000 cần có ngôi sao ghé và đẩy bài đều;
  - 1.000.000 là đích rất xa, cho người chơi lâu.
- Người theo dõi không bao giờ giảm **(em đề xuất)**.
- Ván mới: 50 người (bạn bè) khi Phây mở.
- **Bản lưu cũ** được tính sẵn **(em đề xuất)**: 50 + 1.000 × số sao hạng trên 1 sao đầu + 5.000 × số ngôi sao đã gặp + 20.000 × số lần đoạt Spa của năm, tối đa 99.000 để mốc 100.000 vẫn còn để đạt.
- **Mốc:** 1.000, 10.000, 100.000 (tích xanh cạnh tên tiệm), 1.000.000 (viền vàng quanh ảnh tiệm). Mỗi mốc có một thẻ chúc mừng, mỗi mốc một lần. Bản lưu cũ được tính sẵn thì không hiện thẻ cho những mốc đã có sẵn.
- Người theo dõi **không đổi số khách, tiền hay sao**. **(chồng yêu chọn, cách A)**

### 4.6 Ngôi sao và VIP không vui **(em đề xuất)**

- Ngôi sao giận bỏ về (3 điểm 1) hay được phục vụ 1★ (3 điểm 2) thì vẫn có bài chê. Nhưng bài do **"Quản lý của [tên]"** đăng, với lời lịch sự, không đặt lời chê vào miệng người thật. Lần ghé đó không có bài khoe ảnh.
- VIP là nhân vật bịa, nên VIP tự đăng bài chê bằng tên mình.
- Trả lời đúng thì sửa cả 3 điểm.

### 4.7 Lưu bài

- Giữ 50 bài gần nhất; bài thứ 51 đẩy bài cũ nhất đi. **(chồng yêu duyệt)**
- Lưu cả mã bài cuối cùng đã đọc, để chấm đỏ đúng sau khi tải lại.

### 4.8 Thông báo trượt xuống **(chồng yêu duyệt)**

- Có thông báo khi có bài của ngôi sao, Mi Mi, khách chê, và khi đạt mốc theo dõi.
- Kiểu điện thoại: khung kem từ trên trượt xuống, biểu tượng Phây, "Phây · vừa xong", một dòng "Tên: việc". Hiện khoảng 4 giây. Chạm vào thì mở Phây ở bài đó.
- Chỉ hiện khi `shopFree()` và không có thẻ vàng nào đang chờ. Đang bận thì xếp hàng; nhiều thông báo dồn lại thì chỉ hiện cái mới nhất và gộp phần còn lại vào chấm đỏ **(em đề xuất)**.

### 4.9 Trả lời khách chê **(chồng yêu duyệt, lô B)**

- **Lý do** gắn với bài chê, lấy từ chuyện thật lúc chấm:

| Mã | Khi nào | Câu đúng (ý) |
|---|---|---|
| `wait` | Bỏ về vì chờ lâu (không phải hai lý do dưới) | Xin lỗi, lần sau nhắn trước tiệm giữ giường |
| `stock` | Bỏ về khi dịch vụ đang thiếu hàng | Xin lỗi, tiệm đã nhập thêm hàng |
| `power` | Bỏ về vào ngày cúp điện, khi khách chờ một dịch vụ dùng máy **(em đề xuất: trong lúc cúp, khách không mất kiên nhẫn nên không bỏ về; khách bỏ về sau đó vì hàng dồn lại, nên tính theo ngày và loại dịch vụ, không cần thêm cờ cho khách)** | Xin lỗi, hôm đó cúp điện, lần sau mời làm bù |
| `sloppy` | Thợ làm vội, khách chấm 2 | Tiệm sẽ nhắc thợ làm kỹ, lần sau chủ tiệm tự làm |
| `tech` | Thợ làm 1★ (không vội), khách chấm 2 | Tiệm sẽ cho thợ học thêm |
| `owner` | Chủ tiệm làm 1★, khách chấm 2 | Chủ tiệm xin lỗi, lần sau làm kỹ hơn |

- Bấm "Trả lời" mở một thẻ: tên khách, sao, câu chê, dòng lý do, ba câu trả lời và nút "Để sau". Thứ tự ba câu xáo theo từng bài, cố định sau khi tạo bài.
- **Câu đúng lý do:** mọi điểm của khách đó còn trong sổ 20 điểm đổi thành 4. Bài đổi sao thành 4★, có câu trả lời của tiệm và một câu cảm ơn của khách. Thêm người theo dõi.
- **Câu xin lỗi chung:** điểm đổi thành 3, bài thành 3★, khách đáp một câu nhạt. Thêm ít người theo dõi.
- **Câu cãi lại:** không đổi điểm. Bài thành drama: thêm thích, thêm bình luận kiểu "Thái độ gì vậy tiệm?". Không mất người theo dõi, không mất tiền.
- Mỗi bài trả lời được một lần. Không hết hạn. Bỏ qua thì không sao.
- Nếu điểm của khách đã trôi khỏi sổ 20 điểm thì trả lời vẫn đổi bài và người theo dõi, chỉ không đổi được sao tiệm.
- **Cách tìm lại điểm** **(em đề xuất)**: thêm một dãy mã khách `reviewIds` song song với `reviews`, luôn cắt cùng nhau (trong bộ nhớ và lúc lưu). Không đổi `reviews` thành đối tượng, vì bản cũ sẽ coi bản lưu là hỏng. Mã khách là `Customer.id`, chỉ tăng, có lưu.

### 4.10 Đẩy bài **(chồng yêu duyệt, giá ×1,5 do chồng yêu chọn, lô B)**

- Nút "Đẩy bài" có trên bài khen của khách và bài của tiệm mình.
- Ba mức. Giá = phần trăm của `awayMean` (lãi trung bình 3 ngày), làm tròn lên 10.000 đ, không dưới giá tối thiểu:

| Mức | Giá | Hôm sau | Người theo dõi |
|---|---|---|---|
| Nhỏ | 22,5%, tối thiểu 150.000 đ | khách tới ×1,15, boa ×1,1 | thêm ít |
| Vừa | 60%, tối thiểu 450.000 đ | khách tới ×1,3, boa ×1,2 | thêm vừa |
| Lớn | 120%, tối thiểu 900.000 đ | khách tới ×1,5, boa ×1,3 | thêm nhiều |

- Mỗi ngày đẩy được một bài. Đẩy rồi thì các nút Đẩy bài khác mờ, chạm vào hiện "Hôm nay đã đẩy một bài rồi. Mai đẩy tiếp nha." Bài đã đẩy có nhãn "Đang đẩy".
- Không đủ tiền thì mức đó mờ.
- **Hiệu lực:** chỉ ngày hôm sau, chỉ tiệm chính. Sáng hôm đó có một dòng nhắc kiểu ngày hot ("Hôm nay bài đẩy đang chạy, khách đông hơn").
- **Ghép với lễ và ngày hot** **(em đề xuất)**: nhân thêm vào `eventArrivalFactor()` (không nằm trong `min`), nên đẩy bài vào ngày lễ vẫn có tác dụng.
- Ngày được đẩy: khách kiên nhẫn ×1,2 như ngày lễ (`eventPatienceFactor`) và được tính là ngày bận trong `recordDay`, để không thổi phồng mục tiêu nhiệm vụ và đối thủ **(em đề xuất)**.
- Hệ số boa nhân cạnh `POWER_TIP_FACTOR`, trước phần boa hào phóng.
- **Giá ×1,5 nghĩa là đẩy bài chủ yếu là chỗ tiêu tiền dư**, đổi lấy ngày đông khách và người theo dõi. Người làm chạy thử để biết mức lời lỗ thật của mỗi mức và ghi vào báo cáo cho chồng yêu, nhưng không tự đổi giá.

### 4.11 Số ngẫu nhiên **(em đề xuất)**

- Mọi lựa chọn của Phây (đăng hay không, mẫu câu, tên mẫu, thích, bình luận, thứ tự câu trả lời) dùng một luồng riêng với số nguyên tố mới (ví dụ 9431), không bao giờ rút từ `sim.rng`.
- Ngày không đẩy bài thì luồng chính của sim rút y như trước. Ngày có đẩy bài thì khoảng cách khách đổi, đó là chủ đích.

## 5. Lưu game

- Số phiên bản: **số trống kế tiếp khi lô A lên master** (36 nếu đồ trang trí lên trước với 35, ngược lại 35). Đóng băng fixture của số ngay trước, ghi bằng code master trước khi đổi.
- Tiệm chính có thêm `feed: FeedBook`:
  - `posts`: tối đa 50 bài. Mỗi bài: `id`, `day`, `minute`, `kind`, `name`, `look` (cho ảnh đại diện, nếu có), `tick`, `stars` (nếu có), `text`, `pic` (nếu có), `likes`, `comments: [tên, câu][]`, `extra` (số bình luận không hiện), và:
    - bài chê: `complaint: { reason, customerId, replies (thứ tự 3 câu), answered: null | 'right' | 'plain' | 'rude' }`;
    - bài đẩy được: `boostable`, `boosted: null | tier`.
  - `nextId`, `lastSeen`, `followers`, `milestones` (các mốc đã chúc mừng), `postedToday: { day, good, bad }`, `boosts: { day, tier }[]` (ngày có hiệu lực, tối đa 2: hôm nay và mai). Một danh sách chứ không phải một ô, để đẩy bài hai ngày liền không xóa mất lượt đang chạy **(em đề xuất)**.
- `reviewIds: number[]` song song với `reviews`, cùng độ dài. Bản cũ hơn: điền 0 (không khớp khách nào).
- Bản lưu trước phiên bản này: `feed` rỗng với người theo dõi tính sẵn theo 4.5 (chỉ khi đã qua ngày mở Phây; chưa tới thì để 0 và tính 50 khi mở), các mốc đã vượt thì ghi là đã chúc mừng.
- Chi nhánh: `feed` luôn rỗng và cố định, `reviewIds` vẫn có (mỗi tiệm có sổ điểm riêng).
- Sửa khi đọc: bài hỏng thì bỏ; quá 50 bài giữ 50 bài mới nhất; mã trùng bỏ bài sau; `nextId` lớn hơn mọi mã; lý do lạ thì bài thành bài thường không trả lời được; `reviewIds` sai độ dài thì điền 0 cho khớp.
- Lô B không đổi bản lưu: mọi trường cho trả lời và đẩy bài đã có từ lô A.

## 6. Cách làm đã cân nhắc

| Cách | Được | Mất | Kết quả |
|---|---|---|---|
| **A. Bài ghi chuyện thật, lưu lại; người theo dõi chỉ để khoe** | Có việc để chơi thật, có chỗ tiêu tiền. Không đổi luật tiền và khách đang ổn. | Phải tăng bản lưu; phải tạo bài trong sim. | **Chồng yêu chọn** |
| B. Bài tự sinh lúc mở, không lưu | Làm nhanh nhất. | Trả lời không gắn được khách thật; bài mất khi tải lại. | Không chọn |
| C. Người theo dõi quyết định số khách | Sâu nhất. | Phải cân lại cả nền kinh tế. | Không chọn |

Cách làm A cụ thể **(em đề xuất)**:
- `src/sim/feed.ts`: `FeedBook`, tạo bài, thích, người theo dõi, mốc, trả lời, đẩy bài, sửa khi đọc. Thuần TypeScript, test được.
- `SpaSim` gọi feed ở các chỗ có chuyện (4.3), truyền lý do vào `addReview`. `Chain` gọi feed của tiệm chính khi mở chi nhánh hay chi nhánh mua nhà.
- `src/strings/phay.ts`: mẫu câu.
- `PhayScene`: bảng, thẻ trả lời, thẻ đẩy bài, thẻ mốc. Nút điện thoại và thông báo nằm trong `Hud`/`SpaScene`.
- Mở rộng đất và các ý khác của đợt sau không bị ảnh hưởng.

Mã nguồn mở đã xem: Tracery (galaxykate/tracery) cho cách ghép mẫu câu; các khung điện thoại trong Ren'Py (kleineluka, Better-EMR-Phone) cho màn hình điện thoại và chấm đỏ. Không chép code, chỉ học ý.

## 7. Hai lô **(chồng yêu duyệt)**

- **Lô A, bảng tin:** `FeedBook`, `reviewIds`, bản lưu mới và fixture, mọi loại bài ở 4.3, mẫu câu, thích, người theo dõi, mốc và thẻ chúc mừng, nút điện thoại, bảng Phây với cuộn, thông báo. Bài chê đã có lý do và dòng lý do, nhưng chưa có nút Trả lời; bài khen chưa có nút Đẩy bài.
- **Lô B, việc để chơi:** nút và thẻ Trả lời, đổi điểm trong sổ; nút và thẻ Đẩy bài, hiệu lực hôm sau, dòng nhắc buổi sáng. Không đổi bản lưu.

## 8. Kiểm tra

- **Test sim:**
  - từng loại bài được tạo đúng lúc, kể cả khi chủ ở chi nhánh; không có bài trước ngày mở;
  - giới hạn 3 khen, 3 chê mỗi ngày; giới hạn 50 bài;
  - lý do chê đúng cho cả 6 trường hợp; ngôi sao giận bỏ về hay được 1★ thì bài chê do quản lý đăng và không có bài khoe; VIP chê bằng tên mình;
  - đẩy bài hai ngày liền: lượt đang chạy vẫn chạy hết ngày;
  - `reviewIds` luôn cùng độ dài với `reviews`, sau cả lưu và mở lại;
  - trả lời: đúng → 4, chung → 3, cãi → không đổi; cả 3 điểm của VIP; điểm đã trôi khỏi sổ; mỗi bài một lần;
  - đẩy bài: giá theo `awayMean` và giá tối thiểu, lãi âm, thiếu tiền, một lần một ngày, chỉ hôm sau, chỉ tiệm chính, ghép với lễ, ngày bận trong `recordDay`, boa;
  - `same-draws.test.ts` qua nguyên vẹn khi không đẩy bài;
  - người theo dõi không bao giờ giảm; mốc mỗi cái một lần.
- **Test bản lưu:** bản cũ mở lên với người theo dõi tính sẵn và mốc đã có được đánh dấu; lưu rồi mở lại giữ nguyên bài; sửa dữ liệu hỏng; mọi fixture cũ vẫn qua; chi nhánh có `feed` rỗng.
- **Chạy thử nhiều ngày** (đoạn script, không phải test): đường người theo dõi so với mục tiêu ở 4.5; số bài chê trung bình mỗi ngày ở tiệm đầu game và cuối game; lời lỗ của mỗi mức đẩy bài.
- **Xem trên trình duyệt ở 390 px:** nút và chấm đỏ; bảng, cuộn, chạm trong khi cuộn; từng loại bài; thông báo không đè thẻ; thẻ mốc. Lô B: trả lời cả ba câu, sao tiệm đổi; đẩy bài, sáng hôm sau đông khách.

## 9. Để người làm tự quyết

- Hệ số thích và người theo dõi, miễn là đạt mục tiêu ở 4.5.
- Tên mẫu cho khách lạ theo từng loại, và số mẫu câu (ít nhất khoảng 6 mảnh mở đầu và 6 mảnh khen cho mỗi loại bài chính).
- Cỡ chữ và khoảng cách trong bảng, miễn là đọc được ở 390 px và giống bản phác.
- Thứ tự thông báo của Phây với thẻ vàng khi cùng lúc: thẻ vàng trước.
- Có nên ghi tên chi nhánh trong bài mở chi nhánh hay mua nhà ở chi nhánh: nên có.
