# Đợt 5: ba dịch vụ mới, ba trò chơi tay mới

- Ngày: 2026-10-29
- Trạng thái: chờ anh duyệt
- Thuộc: spec chung `2026-10-25-spa-game-design.md`. Đi sau Đợt 4 (chuỗi spa, save v25, master 86a6a92). Anh chọn hướng "Dịch vụ mới" cho Đợt 5 (2026-10-29), sau khi bỏ làm lại từ đầu, tiếng Anh và lên store.
- Bản phác bấm thử: https://claude.ai/artifact/P2j3iiJzkyVgQr24Vtoa39 (ba trò chơi chơi được bằng ngón tay). Anh duyệt bản phác cùng tài liệu này một lần.

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự quyết, anh sửa được sau khi chơi thử. Anh giao em các quyết định thiết kế.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Thêm cái mới để làm ngay trong tiệm đang chơi, không bắt chơi lại.** **(anh chọn, 2026-10-29)**
- **Ba lô, mỗi lô một dịch vụ, làm lần lượt:** **(em đề xuất)**
  - **Lô A:** Chà muối biển (mở ở 3★), cùng phần chung: buổi học nghề, màn Dịch vụ và Kho có trang.
  - **Lô B:** Ngâm chân thảo mộc (mở ở 4★).
  - **Lô C:** Sơn móng (mở ở 5★).
  - Lô nào đổi hình dạng ô lưu thì lên một số save (v26, v27, v28).
- **Anh duyệt tài liệu này và bản phác một lần cho cả ba lô.** Sau đó em làm liền một mạch. Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt thì em tự merge vào master, đẩy lên mạng rồi báo anh. **(giữ cách của các đợt trước)**
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.

## 2. Hiện giờ

- **Sáu dịch vụ** (`src/sim/services.ts`):
  - gội đầu, đắp mặt nạ, massage mở lần lượt bằng tiền;
  - xông lá, đá nóng, tắm bùn mở khi pha đúng công thức ở bàn pha, sau massage.
- **Giá món** 40.000–160.000 đ (`SERVICE_PRICE`), **tiền mở** 0–800.000 đ (`SERVICE_OPEN_COST`).
- **Mỗi dịch vụ có:**
  - một loại giường riêng (`SERVICES[id].bed`, `serviceOfBed`);
  - món kho riêng cộng khăn (`STOCK_USES`);
  - bậc chuyên môn 0–3 của từng nhân viên (`Tiers`), đi học được;
  - một trò chơi nhỏ khi chủ tiệm tự làm (`ShampooScene`, `MaskScene`, `MassageScene`, `SteamScene`, `StoneScene`, `MudScene`), 15–25 giây, ra 1–3 sao. Mọi ván chơi trên thẻ có dòng chỉ dẫn (`addMiniGameCard`). Lần đầu chơi mỗi món có bàn tay mờ làm mẫu (`demo` trong `MiniGameData`, nhớ bằng các lời chỉ dẫn `demoShampoo`…`demoMud`).
- **Sáu trò chơi tay đã có:**
  - gội đầu: vuốt, giữ, vuốt;
  - mặt nạ: tô kín mặt tránh mắt, kéo dưa leo vào mắt;
  - massage: bấm vòng đang thu nhỏ và giữ điểm;
  - xông lá: hứng lá đúng đang rơi;
  - đá nóng: nhấc đá khi đủ nóng, đặt vào chỗ;
  - tắm bùn: giữ để đẩy vạch nằm trong dải đang trôi.
- **Khách chọn món** (`drawService`): 70% chọn trong các món mình thích mà tiệm có, còn lại chọn đều mọi món tiệm có.
- **Mỗi món mở thêm làm khách tới dày hơn** (`serviceArrivalFactor`): món thường 10%, món công thức 5%.
- **Chi nhánh có đúng các món của tiệm gốc** (chép mỗi sáng).
- **Màn Dịch vụ** có hai thẻ, Dịch vụ và Kho, mỗi thẻ vừa đúng 6 dòng cao 200 (`ServicesScene`).
- **Huy hiệu "Đủ món"** ghi "Mở đủ 6 dịch vụ." nhưng mục tiêu đang đọc từ `SERVICE_IDS.length`. Huy hiệu góp vào việc mở trang phục.
- **Hạng tiệm** tính phần dịch vụ theo số món mở, đủ ở 6 (`RANK_SERVICES_FULL`); thẻ hạng ghi "{n}/6 món".
- **Save v25, 1239 test.**

## 3. Mục tiêu

- **Có việc mới cho tiệm đã lớn:** từ 3★ trở đi, mỗi mốc sao mở thêm một món, đắt hơn mọi món cũ.
- **Ba trò chơi tay chưa từng có trong game:** vẽ vòng tròn, nhớ thứ tự, tô theo nét.
- **Mở món mới là một buổi học, không chỉ bấm trả tiền:** học xong là biết chơi, khỏi bảng hướng dẫn.
- **Chuỗi có thêm ý nghĩa:** mỗi món mang chất của một nơi (muối Bãi biển, thảo mộc Phố cổ, móng Khu cao cấp), và khách của nơi đó thích món đó.
- **Không làm tiệm ngộp khách, không làm game khó hơn cho người chưa tới 3★.**

## 4. Chưa làm ở đợt này

- Món mới cho chi nhánh mà tiệm gốc không có.
- Công thức, khách quen, VIP, lễ, sự kiện riêng cho món mới.
- Trò chơi tay cho nhân viên.
- Tự chọn mẫu móng để vẽ tự do.
- Sửa sáu trò chơi cũ.
- Huy hiệu mới.

## 5. Điều cấm (dính là coi như hỏng)

- **Tiệm chưa mở món mới thì chơi y như cũ.** Mọi test cũ còn đạt, `same-draws` giữ nguyên. Không bốc thêm gì trong dòng ngẫu nhiên khi món mới chưa mở.
- **Không ngộp khách:** món mới không làm khách tới dày hơn (mục 7.1).
- **Huy hiệu "Đủ món" vẫn là 6 món,** đúng như chữ trên huy hiệu: mở đủ 6 món bất kỳ là được, món mới cũng tính. Hạng tiệm vẫn đủ ở 6 món, thẻ hạng không bao giờ ghi quá "6/6 món". **(em đề xuất)**
- **Không trả học phí hai lần:** đã trả thì học lại bao nhiêu lần cũng không mất thêm, tải lại trang cũng vậy.
- **Trò chơi chạm được bằng ngón cái trên iPhone,** kể cả thứ đang chạy. Người lớn chơi lần đầu, chịu khó làm theo thì đạt 2★.
- **Ô lưu cũ mở được, không mất gì.**
- **Chữ và số trên màn hình không được tràn, đè lên nhau** ở màn iPhone.

## 6. Các cách đã cân nhắc

**Mở món mới thế nào:**
- **A. Tới mốc sao thì được học nghề: trả học phí một lần, chơi một ván tập; đạt 2★ là mở.** **(em đề xuất)** Ván tập thay bảng hướng dẫn, nên lần đầu gặp khách thật là đã biết chơi. Học lại không mất tiền.
- B. Pha công thức ở bàn pha như xông lá, đá nóng, tắm bùn. Bỏ: lặp lại đúng cái đã có.
- C. Trả tiền là mở, như gội đầu, mặt nạ, massage. Bỏ: Đợt 2 anh đã chọn "mở món mới phải là một việc thú vị, không chỉ bấm trả tiền".

**Khi nào có:**
- **A. Theo sao tiệm gốc: 3★, 4★, 5★, cùng mốc mở ba nơi.** **(em đề xuất)** Ai chưa mua chi nhánh vẫn có món mới.
- B. Mở chi nhánh nào thì có món của nơi đó. Bỏ: phải bỏ ra 5–12 triệu mới thấy cái mới.

**Món mới có làm khách tới dày hơn không:**
- **A. Không.** **(em đề xuất)** Đủ sáu món thì khoảng cách giữa hai khách đã còn 65% so với lúc chỉ có gội đầu. Thêm nữa thì tiệm ngộp. Món mới đem lợi bằng giá cao hơn và khách thích nó.
- B. Mỗi món thêm 5% như món công thức. Bỏ: đủ chín món thì khoảng cách còn 50%, tức khách tới gấp đôi lúc đầu.

**Ba trò chơi:** (mục 8; tham khảo game mã nguồn mở ở cuối mục này)
- **A. Ba cách chơi chưa có trong game: vẽ vòng tròn, nhớ thứ tự, tô theo nét.** **(em đề xuất)**
- B. Biến thể của trò cũ (ví dụ sơn móng = tô kín như mặt nạ). Bỏ: chơi không thấy mới.

Ý tưởng lấy từ game và mã nguồn mở. Em đã đọc mã, ghi lại ở `dot-5-oss.md`. Em chỉ lấy ý, không chép mã; nhiều kho không có giấy phép:
- **westures (`Swivel`):** đếm góc ngón tay quay quanh một tâm, có vùng chết sát tâm. → Chà muối đếm vòng theo góc quanh tâm vệt muối, không bắt vẽ tròn đẹp.
- **simon2020 (Phaser 3) và hai game Simon khác:** khoá tay lúc đang chiếu, bấm là nhận ngay khi chạm xuống. → Ngâm chân khoá tay lúc huyệt đang sáng. Em đổi "dài thêm mãi" thành 3 lượt cố định và cho chiếu lại một lần khi sai, để ván ngắn và dễ với trẻ con.
- **NailSalon (React):** chọn màu bằng đúng lọ trong bảng màu, chà bọt bằng các điểm ẩn. → Sơn móng chọn màu bằng bấm đúng lọ, không pha màu.
- **Letterpaint, game kẹo dalgona:** trượt ra khỏi nét là thua ngay. → Em bỏ, quá khắt khe với ngón tay trẻ con. Sơn móng dùng nét chấm: chạm tới chấm nào thì chấm đó sáng, lem chỉ bị trừ chứ không thua.
- **$1 Unistroke Recognizer:** chấm điểm bằng khoảng cách trung bình tới đường mẫu. → Không cần: nét chấm dễ hiểu hơn trên điện thoại.

## 7. Ba món mới

### 7.1 Số liệu

| Món | Khóa trong mã | Mở ở | Học phí | Giá món | Kho dùng | Đồ (giá) |
|---|---|---|---|---|---|---|
| Chà muối biển | `scrub` | 3★ | 700.000 đ | 170.000 đ | Muối biển + khăn | Giường chà muối (600.000 đ) |
| Ngâm chân thảo mộc | `foot` | 4★ | 850.000 đ | 190.000 đ | Thảo mộc (chung với xông lá) + khăn | Ghế ngâm chân (650.000 đ) |
| Sơn móng | `nails` | 5★ | 1.000.000 đ | 220.000 đ | Sơn móng + khăn | Bàn làm móng (750.000 đ) |

- **Điều kiện học:** tiệm gốc đủ sao **và đã mở massage**. Trước đó dòng món hiện mờ, ghi "Đạt 3★" (hay 4★, 5★) hoặc "Mở massage trước". **(em đề xuất)**
- **Khách tới:** món mới không đổi `serviceArrivalFactor`. **(em đề xuất)**
- **Khách thích:** thêm món mới vào danh sách món thích (`prefers`), không đổi cách bốc (`drawService`). **(em đề xuất)**
  - sinh viên và khách du lịch (Bãi biển) thêm Chà muối biển;
  - người lớn tuổi và khách Tây ba lô (Phố cổ) thêm Ngâm chân thảo mộc;
  - dân văn phòng, người nổi tiếng và quý bà (Khu cao cấp) thêm Sơn móng;
  - khách khó tính thích mọi món như bây giờ.
  - Món chưa mở thì không nằm trong danh sách tiệm có, nên tiệm chưa học món mới bốc y như cũ.
- **Kho:** hai món mới, mỗi lần nhập 20 phần, có sẵn 20 phần khi học xong. **(em đề xuất)**
  - Muối biển: 400.000 đ.
  - Sơn móng: 560.000 đ.
  - Ngâm chân dùng chung thảo mộc với xông lá, như đá nóng dùng chung dầu với massage.
- **Đồ mới:** mỗi món một loại đồ để khách nằm hay ngồi (giá ở bảng trên; giường tắm bùn hiện là 700.000 đ), mua ở Xây dựng khi đã học xong món đó. Học xong được tặng sẵn một cái vào hộp quà. **(em đề xuất)**
- **Nhân viên:** mọi người có thêm bậc 0 cho món mới, đi học như món cũ (100.000 / 200.000 / 400.000 đ). Ứng viên có thể có sẵn bậc ở món mới khi tiệm đã mở món đó. Nhân viên làm thì tự chấm sao theo tay nghề và bậc, thời gian làm như món cũ cùng giá.
- **Chi nhánh** có món mới khi tiệm gốc đã học, như mọi món khác. Muốn khách ở chi nhánh làm được thì mua đồ ở chi nhánh.

### 7.2 Buổi học nghề (lô A, dùng cho cả ba món)

- **Trên màn Dịch vụ,** món đủ điều kiện có nút **"Học nghề"**, học phí ở dòng thứ hai trong cùng nút (một dòng thì không vừa nút 310 của màn Dịch vụ). **(em đề xuất)**
- **Bấm vào:** trừ học phí, rồi mở **thẻ cô giáo**:
  - tiêu đề "Học {tên món}";
  - hình cô giáo (chibi mặc áo dài, vẽ từ các mảnh áo dài và nón lá đã có ở `src/art/outfits.ts`);
  - hai dòng chỉ cách chơi **(em đề xuất)**:
    - Chà muối: "Đặt ngón lên vệt muối rồi xoay vòng tròn." / "Xoay vừa tay thôi, nhanh quá khách kêu rát."
    - Ngâm chân: "Nhìn các huyệt sáng lên lần lượt." / "Rồi bấm lại đúng thứ tự đó."
    - Sơn móng: "Chọn lọ sơn đúng màu thẻ mẫu." / "Kéo ngón theo nét chấm, đừng lem ra ngoài móng."
  - nút **"Bắt đầu"**.
- **Ván tập** là chính trò chơi của món đó, với khách là cô giáo, không có đánh giá, không có tiền. Lần tập đầu tiên có bàn tay mờ làm mẫu như các món cũ (mỗi món một lời chỉ dẫn mới: `demoScrub`, `demoFoot`, `demoNails`). Học xong rồi thì gặp khách thật không có tay mẫu nữa. **(em đề xuất)**
- **Đạt 2★ trở lên:** thẻ **"Học xong!"**, dòng "Tiệm đã có {tên món}. Quà: một {tên đồ} trong hộp quà.", nút **"Xong"**. Món mở ở mọi tiệm từ lúc này.
- **Dưới 2★:** thẻ **"Chưa đạt"**, dòng "Thử lại không mất tiền.", nút **"Thử lại"** và **"Để sau"**. Để sau thì nút trên màn Dịch vụ thành **"Học tiếp"** (không ghi giá).
- **Thiếu tiền hay tiền âm:** nút mờ, ghi lý do như khi mua đồ.
- **Tiệm đứng yên** suốt buổi học, như ở màn Dịch vụ.
- **Học phí không tính vào Chi trong ngày,** như học phí nhân viên và tiền mở món cũ.
- **Báo có món mới để học:** **(em đề xuất)**
  - thẻ lên hạng ở 3★, 4★, 5★ thêm một dòng "Món mới để học: {tên món}.";
  - nút Dịch vụ ở thanh dưới có chấm nhỏ khi có món học được mà chưa đóng học phí (tính ngay lúc đó, không lưu);
  - mở màn Dịch vụ lúc đó thì mở thẳng trang có món ấy.

### 7.3 Màn Dịch vụ và Kho có trang (lô A)

- **Thẻ Dịch vụ** hiện tối đa 6 dòng một trang. Có món thứ 7 trở đi thì có nút trang như bảng nhân viên.
- **Thẻ Kho** cũng vậy, 6 dòng một trang, chỉ hiện món kho của dịch vụ đang mở như bây giờ.
- Món mới chưa đủ sao vẫn hiện (mờ, ghi điều kiện) để người chơi biết còn món để mong. **(em đề xuất)**

## 8. Ba trò chơi

Mọi trò: thanh thời gian và thanh tiến độ như trò cũ (`drawBars`), sao hiện cuối ván (`revealStars`). Khách khó tính (và quý bà) chơi bản khó.

Luật dưới đây đã chơi thử trong bản phác bằng ngón tay thật và bằng ván chơi tự động cho từng mức sao. Số trong bản phác (ghi ở thẻ "Em đề xuất" của bản phác) là số khởi đầu. **(em đề xuất)**

Dòng chỉ dẫn trên thẻ trò chơi **(em đề xuất)**:
- Chà muối: "Xoay vòng tròn trên vệt muối".
- Ngâm chân: "Nhớ thứ tự huyệt sáng", "Bấm lại đúng thứ tự", "Sai rồi, xem lại một lần", "Bỏ qua lượt này", "Đúng rồi!".
- Sơn móng: "Chọn lọ đúng màu khách muốn", "Kéo ngón theo nét chấm".
- Chữ bay lên: "Rát quá!", "Lem rồi!", "Đẹp!", "Chưa đẹp".

### 8.1 Chà muối biển (lô A): vẽ vòng tròn

- **Màn:** lưng khách nằm sấp (như massage). Lần lượt hiện 4 vệt muối trên lưng (bản khó: 5).
- **Chơi:** đặt ngón lên vệt muối và **xoay vòng tròn**. Mỗi vòng xoay đủ làm vệt mờ đi một nấc; đủ 3 vòng thì vệt sạch, vệt kế hiện ra.
- **Tốc độ:** một đồng hồ nhỏ cạnh vệt chỉ tốc độ xoay. Chỉ có mức trần, không bắt giữ nhịp: xoay quá nhanh thì khách kêu "Rát quá!" và vòng đó không tính. Bản khó có mức trần thấp hơn.
  - "Vòng đó không tính" là bỏ phần vòng đang xoay dở; các vòng đã đủ vẫn giữ. **(em đề xuất)**
  - Sau "Rát quá!", phải chậm xuống dưới 80% mức trần thì mới đếm lại và mới kêu được lần nữa. Không có khoảng này thì ngón xoay sát mức trần sẽ kêu liên tục. **(em đề xuất)**
  - Xoay nhanh mãi thì không vòng nào được đếm và ra 1★. Đó là cố ý: trò này thưởng tay vừa phải.
  - Trong bản phác (trần 2,5 vòng mỗi giây, bản khó 1,8), xoay đều từ khoảng 0,65 tới 2,4 vòng mỗi giây đều ra 3★.
- **Đếm vòng:** cộng góc ngón tay quay quanh tâm vệt, không bắt vẽ tròn đẹp, xoay chiều nào cũng được. Ngón sát tâm quá (vùng chết) hay trượt ra xa quá thì tạm dừng đếm.
- **Sao:** 3★ sạch hết các vệt và kêu rát nhiều nhất 1 lần; 2★ sạch ít nhất 3 vệt; còn lại 1★. Thời gian 20 giây.

### 8.2 Ngâm chân thảo mộc (lô B): nhớ thứ tự

- **Màn:** bàn chân khách đặt trên chậu nước thảo mộc, lòng bàn chân có 6 huyệt.
- **Chơi:** mỗi lượt, các huyệt sáng lên lần lượt (kèm tiếng "tinh" cao dần), rồi người chơi bấm lại đúng thứ tự.
  - Lượt 1: 3 huyệt, lượt 2: 4, lượt 3: 5. Bản khó: 4, 5, 6 và sáng nhanh hơn.
  - Cả ván là một chuỗi dài dần: lượt sau lặp lại lượt trước rồi thêm huyệt ở cuối, như trò Simon. **(em đề xuất)**
  - Bấm sai thì huyệt rung đỏ, lượt đó chiếu lại một lần và bấm lại từ huyệt đầu. Sai lần nữa thì bỏ qua lượt đó. **(em đề xuất)**
- **Sao:** 3★ đủ 3 lượt và sai nhiều nhất 1 lần trong cả ván; 2★ đúng ít nhất 2 lượt; còn lại 1★. Thời gian **15 giây**, chỉ chạy lúc đến lượt người chơi bấm. **(em đề xuất)**
  - Bản phác cho thấy 30 giây không bao giờ quyết định gì: ván 3★ chỉ dùng 2,4 tới 4 giây bấm. 15 giây vẫn đủ cho người bấm chậm 1 giây mỗi huyệt.

### 8.3 Sơn móng (lô C): chọn màu và tô theo nét

- **Màn:** bàn tay khách trên gối kê, 5 móng. Góc trên có thẻ mẫu khách muốn: một màu và một hoa văn (chấm bi, sọc, trái tim, hoa).
- **Bước 1, chọn màu:** 4 lọ sơn, bấm lọ đúng màu mẫu. Sai thì khách lắc đầu, lọ đó mờ đi, chọn lại được; lần chọn sai được tính vào sao.
- **Bước 2, tô:** mỗi móng hiện hoa văn bằng nét chấm, phóng to trong một kính lúp phía trên bàn tay. Kéo ngón theo nét chấm để tô.
  - Nét là một hàng chấm to. Ngón chạm tới chấm nào (tính cả đoạn giữa hai lần chạm) thì chấm đó sáng.
  - Móng xong khi sáng hết chấm, hoặc khi nhấc ngón lên sau khi đã tới chấm cuối. Không vậy thì người sót một chấm sẽ kẹt tới hết giờ. **(em đề xuất)**
  - Nhấc ngón chỉ kết thúc móng khi chấm cuối đã sáng và đã sáng ít nhất 80% số chấm; ít hơn thì tô tiếp. Hình tim và hoa khép kín nên chấm cuối nằm sát chấm đầu, chạm vòng bắt đầu cũng làm chấm cuối sáng.
  - Ngón đi ra ngoài viền móng lúc đang tô là một lần lem (cho lố viền vài điểm ảnh, bản phác dùng 8 trên khung 1080).
  - Một móng **đẹp** khi sáng được ít nhất 80% số chấm và lem nhiều nhất 1 lần.
  - Bản khó có nét mảnh hơn và hoa văn khó hơn (trái tim, hoa).
  - Quẹt zíc zắc kín móng cũng sáng hết chấm, nhưng chậm hơn đi theo nét (khoảng 3,5 giây so với 2,5 giây một móng), nên em không cấm. **(em đề xuất)**
- **Sao:** 3★ chọn đúng màu ngay lần đầu và 5 móng đẹp; 2★ chọn sai nhiều nhất 1 lần và ít nhất 3 móng đẹp; còn lại 1★. Thời gian 25 giây. **(em đề xuất)**
  - Luật cũ ("đúng màu và 3 móng đẹp, hoặc 5 móng đẹp dù chọn sai một lần") có một vách: sai 1 lần mà 4 móng đẹp lại chỉ 1★, kém người không sai mà 3 móng đẹp.
  - Bản khó hình trái tim hơi chật thời gian ở tốc độ tô chậm (còn khoảng 3 giây), em để vậy vì đó là bản khó.

## 9. Kiểm tra

- **Test tự động cho mỗi lô:**
  - luật của trò chơi (đếm vòng theo góc và tốc độ; chuỗi huyệt và chiếu lại; chấm nét và lem) với các ca đạt 3★, 2★, 1★ và bản khó;
  - học nghề: đủ và thiếu điều kiện, trả một lần, học lại miễn phí, tải lại giữa chừng;
  - món mới không đổi `serviceArrivalFactor`, huy hiệu "Đủ món" vẫn ở 6, hạng vẫn đủ ở 6;
  - khách chọn món mới theo bảng thích; chi nhánh có món sau khi tiệm gốc học;
  - kho, đồ, bậc chuyên môn của món mới; nâng save lên.
- **Em tự chơi thử trên trình duyệt ở khổ 390 px:** học nghề cả hai đường (đạt và chưa đạt), chơi trò với khách thường và khách khó, xem màn Dịch vụ và Kho có trang, mua đồ, nhân viên làm món mới.

## 10. Để lại cho người làm

- Hình vẽ cụ thể của đồ, lưng, bàn chân, bàn tay, cô giáo, miễn theo nét vẽ chung (viền nâu, màu phẳng) và bản phác.
- Cách lưu "đã trả học phí, chưa đạt" trong ô lưu.
- Hằng số chi tiết của trò chơi (bán kính vệt, dải tốc độ, độ dày nét, khoảng sáng huyệt) trong `config.ts`, miễn đạt luật sao ở mục 8 và tinh chỉnh được. Số trong bản phác là điểm bắt đầu.
- Tên kiểu, tên hàm, tên chữ trong `vi.ts`.
