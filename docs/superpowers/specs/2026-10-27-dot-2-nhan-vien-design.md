# Đợt 2, phần 2: nhân viên có chuyên môn, đi học và tính cách

- Ngày: 2026-10-27
- Trạng thái: anh đã duyệt (2026-10-27)
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 5.8 và mục 6 (Đợt 2). Nhân viên hiện có xem spec bước 1b `2026-10-26-step-1b-batches-2-7-design.md`, mục 8. Phần 1 xem `2026-10-27-dot-2-khach-design.md`.

Cách đọc giống các spec trước:
- **(anh chọn)** là điều anh đã quyết.
- **(em đề xuất)** là em tự điền, anh sửa được.
- Mọi con số là số khởi đầu. Em chỉnh sau khi cả nhà chơi thử.

## 1. Cách làm

- **Phần này chia hai lô:** **(anh chọn)**
  - **Lô A:** chuyên môn và đi học.
  - **Lô B:** tính cách.
- **Anh duyệt tài liệu này một lần cho cả hai lô.** **(em đề xuất, giữ cách anh đã chọn ở phần 1)**
  - Sau đó em làm liền một mạch.
  - Xong lô nào, test tự động và phần em tự chơi thử trên trình duyệt đều đạt, thì em tự merge vào master, đẩy lên mạng rồi báo anh.
- Mỗi lô có kế hoạch kỹ thuật riêng, viết ngay trước khi làm lô đó.
- Phần 3 (dịch vụ mới) và phần 4 (tầng) vẫn chờ anh quyết chuyện làm lại 3D. Phần này chủ yếu là luật chơi và bảng Nhân viên, nên ít đụng tới 3D.

## 2. Hiện giờ

- **Mỗi nhân viên có:**
  - vai trò: lễ tân hoặc kỹ thuật viên;
  - 4 chỉ số từ 1 đến 5 chấm: tay nghề, tốc độ, thân thiện, sức bền;
  - lương mỗi ngày.
- **Số người tối đa:** 1 lễ tân và 3 kỹ thuật viên. Mỗi sáng có 3 ứng viên, khoảng 1 trong 10 là người giỏi hiếm gặp.
- **Kỹ thuật viên làm mọi dịch vụ giỏi như nhau.** Khi rảnh, họ mời khách chờ lâu nhất có giường trống hợp dịch vụ, có tính hai luật của phần 1:
  - nhường khách quen cho chủ tiệm 10 giây;
  - giữ giường cho VIP đang chờ.
- **Lên cấp nhanh và chạm trần sớm:**
  - Mỗi khách làm xong được 1 điểm kinh nghiệm. Đủ 25 khách là cấp 5, cấp cao nhất. Mỗi cấp cộng 1 chấm ngẫu nhiên.
  - Một kỹ thuật viên chăm làm chạm trần sau vài ngày, sau đó không còn gì để mong.
  - Người giỏi hiếm gặp thì vừa vào đã gần trần.
- **Tiền:**
  - Giá dịch vụ: gội đầu 40.000 đ, đắp mặt nạ 60.000 đ, massage 90.000 đ.
  - Cuối game tiệm dư hàng triệu mà ít chỗ tiêu.

## 3. Mục tiêu

- **Nhân viên giỏi lên mãi được**, kể cả khi đã chạm trần cấp 5. Đi học là đường thứ hai để giỏi lên.
- **Tiền dư cuối game có chỗ tiêu có ý nghĩa:** trả học phí cho người của mình.
- **Thuê ai là một quyết định thật:**
  - Mỗi người giỏi sẵn một dịch vụ.
  - Ở lô B, mỗi người có thêm một tính cách có mặt tốt và tật nhỏ.
- **Nhân viên thành những con người riêng.** Nhìn trong tiệm là nhận ra ai hay đi trễ, ai hay tán gẫu.
- **Không cầu kỳ.** **(anh chọn)** Đi học chỉ là bấm nút trả tiền. Tính cách chỉ là một nhãn ngắn và vài cử chỉ nhỏ.
- **Phần luật chơi dùng lại được khi chuyển sang 3D.**

## 4. Chưa làm ở phần này

- **Chủ tiệm tự tay dạy nhân viên, hay trò chơi nhỏ khi đào tạo.** Đi học chỉ cần trả tiền. **(anh chọn)**
- Đi học mất ngày công: nhân viên đi học buổi tối, không vắng ngày nào. **(em đề xuất)**
- Sự kiện đòi tăng lương riêng. "Đòi lương" chỉ là tật của tính cách "Ham học" ở lô B. **(em đề xuất)**
- **Vai trò mới**, như nhân viên dọn dẹp. **(em đề xuất)**
- **Đổi số người tối đa.** Để phần 4 (tầng) tính. **(em đề xuất)**
- Tâm trạng, độ hài lòng của nhân viên, hay nhân viên tự bỏ việc. **(em đề xuất)**
- Nhân viên nói chuyện bằng chữ, màn hình hội thoại. **(em đề xuất)**
- Chuyên môn cho chủ tiệm. Chủ tiệm vẫn tự chơi trò chơi nhỏ như cũ. **(em đề xuất)**

## 5. Điều cấm (dính là coi như hỏng)

Giữ mọi điều cấm của bước 1b và phần 1, thêm:

- **Đào tạo cầu kỳ.** Không có màn hình học, không có trò chơi nhỏ, không mất ngày công. **(anh chọn)**
- **Tật làm hỏng tiệm:**
  - Tật luôn nhẹ. Không bao giờ làm khách bỏ về hàng loạt.
  - Không bao giờ làm mất tiền bất ngờ, ngoài lương.
  - Không bao giờ làm tiệm kẹt hẳn.
- **Thành game đọc chữ:**
  - Tính cách chỉ là nhãn ngắn trên thẻ, cộng với cử chỉ hay hình nhỏ trên đầu nhân viên.
  - Không có bảng chữ nào chặn tay.
- **Tiệm cũ mất người hay mất sức:**
  - Mở tiệm cũ bằng bản mới thì mọi nhân viên còn nguyên chỉ số, cấp, lương.
  - Họ chỉ được gán thêm chuyên môn (lô A) và tính cách (lô B).
- **Khách bị bỏ rơi vì chuyên môn.** Khách chờ gần hết kiên nhẫn thì kỹ thuật viên nào rảnh cũng mời, đúng nghề hay không (xem mục 7.3).

## 6. Các cách đã cân nhắc

| Việc | Cách | Được | Mất | Kết quả |
|---|---|---|---|---|
| Đào tạo | **Trả tiền cho nhân viên đi học** | Đơn giản, có chỗ tiêu tiền dư | Chủ tiệm không tự tay làm gì | **Anh chọn** |
| | Chủ tiệm tự tay dạy, tốn thời gian trong ngày | Chủ tiệm có việc đáng làm khi tiệm lớn | Cầu kỳ, thêm trò chơi | Loại |
| Tính cách | **Mỗi người một tính cách, có mặt tốt và tật nhỏ thấy rõ trong tiệm** | Chọn người thuê phải nghĩ, nhân viên có hồn | Phải vẽ thêm vài hình nhỏ trên đầu | **Anh chọn** |
| | Chỉ có mặt tốt | Không ai thấy bị phạt | Ai cũng tốt thì chọn ai cũng như nhau | Loại |
| Chuyên môn | **Giỏi sẵn một dịch vụ, đi học thì giỏi thêm hoặc giỏi sâu hơn** | Thuê người phải tính, có đường giỏi lên | Thêm bậc cho từng dịch vụ | **Anh chọn** |
| Chia việc | **Hai lô: chuyên môn và đi học trước, tính cách sau** | Có sớm phần lấp chỗ hụt (chạm trần, tiền dư). "Ham học" cần có đi học trước | Bản lưu đổi phiên bản hai lần | **Anh chọn** |
| | Một lô làm hết | Bản lưu đổi một lần | Lâu mới chơi được. Lỗi phần này chặn phần kia | Loại |
| | Tính cách trước | | "Ham học" chưa có tác dụng gì | Loại |

## 7. Lô A: chuyên môn và đi học

### 7.1 Bậc chuyên môn

- **Bậc chuyên môn:** mỗi kỹ thuật viên có một bậc cho từng dịch vụ, từ 0 đến 3. Bậc 0 là chưa học. **(anh chọn ý, em đề xuất số bậc)**
- **Lúc mới vào làm:** **(anh chọn ý, em đề xuất số)**
  - Ứng viên kỹ thuật viên đã giỏi sẵn bậc 1 ở một dịch vụ.
  - Người giỏi hiếm gặp thì bậc 2.
  - Dịch vụ đó rút ngẫu nhiên trong mọi dịch vụ của game, kể cả dịch vụ tiệm chưa mở.
    - Ngày 3 tiệm thường mới có gội đầu. Nếu chỉ rút trong dịch vụ đang mở thì ai cũng giỏi gội đầu, chọn người chẳng còn gì để tính.
    - Người giỏi một dịch vụ chưa mở vẫn làm mọi dịch vụ khác như thường, và là một lý do để mở dịch vụ đó.
    - Trên thẻ, biểu tượng của dịch vụ chưa mở hiện mờ.
  - **(em quyết khi soát tài liệu)**
- **Bậc lưu cho mọi dịch vụ.** Dịch vụ chưa học là bậc 0. Dịch vụ mới mở sau này tự có bậc 0 cho mọi người. Ứng viên đã ra trong ngày không bị rút lại. **(em quyết khi soát tài liệu)**
- **Mỗi bậc giúp gì khi làm đúng dịch vụ đó:** **(em đề xuất)**
  - Làm nhanh hơn chừng 15% mỗi bậc. Phần trăm này nhân vào thời gian làm, không đổi tốc độ đi lại.
  - Dễ được 3 sao hơn: mỗi bậc tính như có thêm 1 chấm tay nghề cho dịch vụ đó.
  - Người tay nghề đã 5 chấm thì bậc chỉ giúp làm nhanh.
- **Cộng dồn với tính cách ở lô B:** **(em quyết khi soát tài liệu)**
  - **Tay nghề:** tay nghề gốc, cộng bậc, cộng 1 nếu "Khéo tay". Tổng tối đa 5 chấm, và chỉ dùng để tính số sao. Thẻ vẫn hiện tay nghề gốc. Tip, lương và mọi thứ khác vẫn dùng chỉ số gốc.
  - **Thời gian làm:** các phần nhanh hơn nhân với nhau (bậc, "Nhanh nhẹn"). Thời gian làm không bao giờ dưới một nửa thời gian của người tốc độ 5 chấm chưa có bậc nào.
- **Dịch vụ bậc 0:** làm như bây giờ, không bị phạt.
- **Lễ tân không có bậc chuyên môn.** Lễ tân đi học để tiếp khách khéo hơn (mục 7.2).
- **Dịch vụ mới ở phần 3** (đá nóng, tắm bùn, xông hơi) tự có bậc và tự thành môn học được. **(em đề xuất)**

### 7.2 Đi học

- **Cách cho đi học:** **(anh chọn ý, em đề xuất cách làm)**
  - Trên thẻ mỗi người ở phần "Đang làm" có nút "Cho đi học".
  - Bấm vào thì hiện các môn người đó học được, mỗi môn ghi học phí. Chọn một môn thì hiện bảng xác nhận: "Cho Lan đi học massage tối nay? 200.000 đ".
  - Đồng ý thì trừ tiền ngay. Thẻ người đó có hình quyển sách để biết tối nay đi học.
- **Học buổi tối, sáng mai giỏi lên:**
  - Không mất ngày công, hôm đó vẫn làm như thường.
  - Sáng hôm sau, lúc mở cửa, bậc mới có hiệu lực. Bậc tăng đúng lúc sang ngày mới, không phải lúc mở game. Tắt game rồi mở lại vẫn giữ môn đã đăng ký. **(em quyết khi soát tài liệu)**
  - Đã đăng ký thì học xong chắc chắn, kể cả khi dịch vụ đó đổi gì trong ngày.
  - Có thông báo ngắn kiểu "Lan học xong massage bậc 2!" và pháo hoa nhỏ trên đầu như lúc lên cấp. **(em đề xuất)**
- **Mỗi người mỗi tối học một môn.**
- **Môn của kỹ thuật viên:**
  - Môn là một dịch vụ tiệm đang mở mà người đó chưa đạt bậc 3.
  - Dịch vụ chưa mở thì chưa học được, để tiền không bị phí. **(em đề xuất)**
- **Môn của lễ tân:** khoá "Tiếp khách", mỗi khoá cộng 1 chấm thân thiện, tối đa 5 chấm. Đã 5 chấm thì nút ghi "Đã giỏi nhất" và không bấm được.
- **Học phí khởi đầu:** **(em đề xuất)**
  - Kỹ thuật viên lên bậc 1: 100.000 đ, lên bậc 2: 200.000 đ, lên bậc 3: 400.000 đ.
  - Lễ tân: học phí khoá "Tiếp khách" tăng dần theo cùng thang, tính theo chấm sắp lên. Người làm tự chốt số cụ thể.
- **Thiếu tiền:** tiền ít hơn học phí, hoặc đang âm, thì không cho đi học. Nút mờ, ghi lý do như khi mua đồ. **(em đề xuất)**
- **Cho nghỉ một người đã đăng ký học tối nay:** trả lại đúng số tiền đã trả, kể cả khi tiền đang âm. **(em đề xuất)**
- **Học phí đã giảm** (người "Ham học" ở lô B) làm tròn tới nghìn đồng. Số ghi trên nút, trên bảng xác nhận và số dùng để xét đủ tiền là cùng một số. **(em quyết khi soát tài liệu)**
- **Học phí trong bảng tổng kết:** học phí là tiền đầu tư như mua đồ và mở dịch vụ, nên không tính vào Chi trong ngày. **(em đề xuất)**
- **Lương:** không đổi khi đi học. Học phí là chi phí duy nhất. **(em đề xuất)**
- **Lên cấp vẫn như bây giờ.** Mỗi cấp cộng 1 chấm ngẫu nhiên và lương tăng một chút.
- **Mở khi nào:** đi học mở cùng lúc với việc thuê người (ngày 3). **(em đề xuất)**

### 7.3 Kỹ thuật viên chọn khách theo nghề

- **Khi rảnh:** **(em đề xuất)**
  - Kỹ thuật viên ưu tiên khách của dịch vụ mình có bậc cao nhất, nếu có giường trống hợp.
  - Cùng bậc thì chọn khách chờ lâu nhất.
  - Không có khách đúng nghề thì mời như bây giờ: khách chờ lâu nhất có giường trống hợp.
- **Chống bỏ rơi khách:** khách nào đã mất quá nửa kiên nhẫn của chính mình thì được mời trước tiên, kỹ thuật viên đúng nghề hay không. **(em đề xuất)**
  - Tính theo thanh kiên nhẫn đầy của người đó, đã gồm phần cộng thêm khi được lễ tân chào.
  - Nhiều khách cùng quá nửa thì người chờ lâu nhất trước.
- **Luật của phần 1 giữ nguyên và đứng trước cả hai luật trên:** **(em quyết khi soát tài liệu)**
  - nhường khách quen cho chủ tiệm 10 giây;
  - không mời VIP;
  - giữ giường cho VIP đang chờ.

  Luật chống bỏ rơi chỉ đổi thứ tự trong những khách nhân viên được phép mời.

### 7.4 Bảng Nhân viên

- **Thẻ ở phần "Đang làm" và "Tuyển người"** thêm một hàng chuyên môn. Hàng này gồm biểu tượng các dịch vụ người đó có bậc, kèm 1 đến 3 sao nhỏ cho bậc. **(em đề xuất)**
- **Thẻ ở phần "Đang làm"** thêm nút "Cho đi học". Tối nay đã đăng ký thì thay bằng dòng "Tối nay học: massage" có hình quyển sách.
- Cách xếp chi tiết để người làm tự quyết, miễn:
  - đúng kiểu thẻ kem viền nâu;
  - nút đủ to cho ngón cái;
  - vừa màn hình iPhone dọc.

### 7.5 Dẫn dắt và lưu game

- **Dẫn dắt:** lần đầu mở bảng Nhân viên khi đã có kỹ thuật viên, hiện một dòng ngắn: "Cho nhân viên đi học để giỏi hơn một dịch vụ. Học tối nay, sáng mai giỏi lên." Không có mũi tên chỉ dẫn mới. **(em đề xuất)**
- **Bản lưu lên phiên bản 10.** Bản lưu thêm:
  - bậc chuyên môn từng dịch vụ của mỗi kỹ thuật viên;
  - môn người đó đăng ký học tối nay, nếu có;
  - chuyên môn của 3 ứng viên trong ngày.
- **Tiệm cũ mở bằng bản mới:**
  - Mỗi kỹ thuật viên đang làm được gán bậc 1 ở một dịch vụ. Với tiệm cũ, dịch vụ này rút trong các dịch vụ tiệm đang mở, vì họ đã làm ở tiệm rồi.
  - Chỉ số, cấp, lương giữ nguyên.
  - Ứng viên của ngày được gán chuyên môn theo luật của ứng viên mới (mục 7.1).
  - Mấy lần rút này dùng một dòng ngẫu nhiên riêng, tính từ chính bản lưu. Nhờ vậy chuỗi ngẫu nhiên của tiệm (khách tới, sao…) không bị xô lệch, và mở lại cùng bản lưu cho ra cùng kết quả. **(em quyết khi soát tài liệu)**

## 8. Lô B: tính cách

### 8.1 Sáu tính cách

- **Mỗi nhân viên có đúng một tính cách**, có sẵn từ lúc còn là ứng viên. Tính cách hiện bằng một nhãn ngắn trên thẻ, ở cả phần "Tuyển người" lẫn "Đang làm". **(anh chọn ý, em đề xuất cách hiện)**
- **Mỗi tính cách có một mặt tốt và một tật nhỏ thấy rõ trong tiệm.** **(anh chọn)**
- **Sáu tính cách và số liệu khởi đầu:** **(em đề xuất)**

| Tính cách | Ai có | Mặt tốt | Tật nhỏ | Thấy trong tiệm |
|---|---|---|---|---|
| Khéo tay, hay đi trễ | Kỹ thuật viên | Tính như thêm 1 chấm tay nghề, tối đa 5 | Sáng vào tiệm muộn chừng nửa giờ trong game, đi từ cửa vào | Đồng hồ nhỏ trên đầu lúc đi vào |
| Nhanh nhẹn, hơi ẩu | Kỹ thuật viên | Làm nhanh hơn chừng 20% | Chừng 1 trong 7 lần bị trừ 1 sao, thấp nhất 1 sao | Giọt mồ hôi trên đầu lần làm ẩu |
| Vui tính, hay tám | Cả hai | Kỹ thuật viên: khách tip nhiều hơn. Lễ tân: khách được chào kiên nhẫn lâu hơn nữa | Thỉnh thoảng đứng tán gẫu 3–5 giây. Lễ tân đang tán gẫu thì khách mới vào không được chào | Bong bóng "…" trên đầu |
| Chăm chỉ, mau mệt | Cả hai | Lên cấp nhanh hơn: kinh nghiệm gấp rưỡi | Phải nghỉ sớm hơn một khách | Ly trà hiện sớm hơn |
| Điềm tĩnh, chậm chạp | Kỹ thuật viên | Khách khó tính do người này làm chấm dễ như khách thường | Đi lại chậm hơn chừng 20% | Bước đi chậm |
| Ham học, hay đòi lương | Cả hai | Học phí giảm 30% | Lên cấp thì lương tăng gấp đôi mức thường | Bong bóng đồng tiền trên đầu lúc lên cấp |

- **Rút tính cách:** ứng viên kỹ thuật viên rút ngẫu nhiên trong cả 6 tính cách. Ứng viên lễ tân chỉ rút trong 3 tính cách có ý nghĩa với lễ tân: Vui tính, Chăm chỉ, Ham học. **(em đề xuất)**
- **Tật luôn nhẹ** (mục 5). Ví dụ nửa giờ đi trễ chỉ là một phần nhỏ của ngày mở cửa 12 tiếng, tán gẫu chỉ vài giây.
- **Đi trễ, cụ thể:** **(em quyết khi soát tài liệu)**
  - Người hay đi trễ vẫn là nhân viên đang làm, vẫn tính vào số người và vẫn ăn đủ lương ngày.
  - Mỗi sáng họ chưa có mặt trong tiệm cho tới khoảng 8:30 trong game, rồi đi từ cửa vào chỗ làm.
  - Ngày được thuê thì vào làm ngay, không trễ.
  - Tắt game lúc họ chưa tới thì mở lại họ vẫn chưa tới, tới đúng giờ như cũ.
  - Lúc chủ tiệm chơi trò chơi nhỏ, giờ trong game đứng yên nên họ cũng chưa tới.
- **Chăm chỉ, cụ thể:** **(em quyết khi soát tài liệu)**
  - Mỗi khách cho 1,5 điểm kinh nghiệm thay vì 1.
  - Nghỉ sớm hơn tính theo số khách đã làm từ lần nghỉ trước, giống bây giờ, chỉ bớt đi 1 khách. Hai việc này không dính nhau.
- **Điềm tĩnh, cụ thể:** chậm 20% là tốc độ đi lại, không đổi thời gian làm. **(em quyết khi soát tài liệu)**
- **Khi chủ tiệm đang chơi trò chơi nhỏ:** cả tiệm vẫn đứng yên như bây giờ, tật cũng vậy.

### 8.2 Lưu game

- **Bản lưu lên phiên bản 11.** Bản lưu thêm tính cách của mỗi nhân viên và mỗi ứng viên.
- **Tiệm cũ mở bằng bản mới:** mỗi nhân viên và ứng viên được gán ngẫu nhiên một tính cách hợp vai trò. Mọi thứ khác giữ nguyên. Việc rút dùng dòng ngẫu nhiên riêng như ở mục 7.5.

## 9. Kiểm tra và tiêu chí xong

**Em tự kiểm tra ở mỗi lô, đạt hết mới đẩy lên** (giống phần 1 mục 8):

- **Test tự động cho luật chơi.** Ví dụ:
  - **Ứng viên:** kỹ thuật viên mới có đúng một dịch vụ bậc 1 (người hiếm gặp: bậc 2), rút trong mọi dịch vụ của game.
  - **Cộng dồn:** tay nghề cộng dồn không quá 5 chấm. Thời gian làm không dưới mức sàn ở mục 7.1.
  - **Hiệu quả của bậc:** bậc làm nhanh hơn và tăng khả năng 3 sao đúng dịch vụ đó. Dịch vụ bậc 0 làm như cũ.
  - **Đi học:**
    - trừ đúng học phí;
    - sáng mai bậc tăng, mỗi người mỗi tối một môn, không quá bậc 3;
    - thiếu tiền thì không cho học;
    - cho nghỉ thì trả lại học phí.
  - **Lễ tân:** đi học thì thân thiện tăng, không quá 5 chấm.
  - **Chọn khách theo nghề:**
    - ưu tiên đúng nghề;
    - khách chờ quá nửa kiên nhẫn được mời trước;
    - luật nhường khách quen và giữ giường VIP vẫn đúng.
  - **Lô B:**
    - mỗi tính cách có đúng mặt tốt và tật của nó;
    - lễ tân chỉ có 3 tính cách hợp vai trò;
    - tật không bao giờ làm khách bỏ về hàng loạt.
- **Test đọc tiệm cũ:**
  - Bản lưu của mọi bản trước mở đúng tiệm ở bản mới, nhân viên còn nguyên chỉ số.
  - Kỹ thuật viên có chuyên môn (lô A), mọi người có tính cách (lô B).
- **Tự chơi thử trên trình duyệt ở cỡ iPhone:**
  - Thuê người, xem chuyên môn trên thẻ.
  - Cho đi học, hết ngày, sáng mai thấy thông báo và bậc mới.
  - Thấy kỹ thuật viên ưu tiên khách đúng nghề.
  - Ở lô B: thấy người đi trễ, người tán gẫu, giọt mồ hôi.
  - Tắt giữa chừng rồi mở lại, kể cả khi đã đăng ký học tối nay.
  - Chụp ảnh xem thẻ có bị chật hay cắt chữ không.
  - Xem lỗi trong console.
- **Sau khi đẩy lên:** mở link GitHub Pages thật, xem bản mới đã lên.

**Anh xem giúp trên iPhone khi rảnh:**

- Cho nhân viên đi học có thấy đáng tiền, có muốn cho đi tiếp không.
- Học phí đắt hay rẻ so với tiền tiệm đang có.
- Tật của tính cách thấy vui hay thấy phiền.

**Xong khi:**

- Người chơi tự thấy chuyên môn khi thuê người.
- Người chơi tự cho nhân viên đi học và thấy họ giỏi lên, không cần ai chỉ.
- Nhìn trong tiệm là nhận ra vài tính cách.
- Tiệm cũ của cả nhà vẫn còn nguyên người.

## 10. Để người làm tự quyết

- Cách viết code, cách lưu, cách nâng cấp bản lưu cũ.
- Thêm lần rút ngẫu nhiên cho chuyên môn và tính cách làm đổi chuỗi ngẫu nhiên của tiệm. Người làm tự xử lý các test có hạt giống ngẫu nhiên cố định.
- Câu chữ cụ thể: tên tính cách, thông báo học xong, dòng dẫn dắt. Miễn ngắn, giọng Sài Gòn thân thiện.
- Hình nhỏ trên đầu (đồng hồ, giọt mồ hôi, bong bóng "…", đồng tiền, quyển sách) và biểu tượng dịch vụ trên thẻ, miễn đúng phong cách A.
- Cách xếp chi tiết bảng Nhân viên và bảng chọn môn học, miễn đúng kiểu thẻ kem viền nâu và nút đủ to cho ngón cái.
- Mọi con số: phần trăm nhanh hơn, khả năng 3 sao, học phí, độ trễ, tần suất tán gẫu và làm ẩu, mức tăng lương của người ham học.
