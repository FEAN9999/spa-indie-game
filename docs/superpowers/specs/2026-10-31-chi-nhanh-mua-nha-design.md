# Chi nhánh mua nhà

Ngày 2026-10-31. Nối tiếp [mở rộng đất](2026-10-30-mo-rong-dat-design.md) (lô A và lô B đã lên ở master 02e6147).

## Vì sao

Chồng yêu hỏi vì sao chi nhánh chưa mở rộng được. Hồi xem bản phác, chồng yêu chọn "Chi nhánh giữ cỡ cũ" cho đợt mở rộng đất. Giờ chồng yêu muốn chi nhánh cũng mua được bốn căn hai bên như tiệm chính, và duyệt đề xuất của em: luật và giá giống tiệm chính, nhà mang nét riêng của từng nơi, save lên bản 34.

## Mục tiêu

- Ở mỗi chi nhánh (bãi biển, phố cổ, khu phố mới), mua được bốn căn hai bên, theo đúng luật của tiệm chính.
- Nhìn là biết căn nào mới mua, mà vẫn thấy rõ đang ở chi nhánh nào.
- Không gì của tiệm chính thay đổi.

## Không làm

- Chi nhánh mở tầng 2 hay sân thượng. Chi nhánh vẫn một tầng, không có cầu thang.
- Giá nhà khác nhau theo nơi.
- Bán lại nhà.
- Khách tới đông hơn vì tiệm rộng.
- Gợi ý "Bấm Xây dựng để kê giường sang nhà mới" ở chi nhánh. Chi nhánh không bao giờ hiện gợi ý (`hintDone` luôn đúng khi `place !== null`), và gợi ý này đã hiện ở tiệm chính.

## Hiện giờ trong mã

- `SpaSim.houseProblem` trả `'branch'` khi `place !== null`. Vì vậy chi nhánh không rao bán, `shownHouses()` là `{0,0}` và không có mái nào.
- `save.ts:346` ép `houses` của chi nhánh về `{0,0}` khi tải. Trường `houses` đã có trong save của từng tiệm.
- Chi nhánh đã nằm trên lưới 37 cột (`BRANCH_LAYOUT = widen(BRANCH_ROOM)`), tiệm ở cột 12–24, nên `withHouses` mở cột cho chi nhánh y như tiệm chính.
- Chi nhánh dùng chung ví với tiệm chính (`branch.purse = main.purse`), và chạy cùng ngày với tiệm chính.
- `staffCap` đã cộng số nhà, và chuỗi đã truyền `housesBought(shop.houses)` khi chuyển thợ giữa các tiệm.
- `RoomView.setHouses` lấy hình `house-<key>-<tầng>` và `sale-<key>`, tức là hình của tiệm chính. Phòng chi nhánh là `room-beach`, `room-oldTown`, `room-uptown` (13 cột, vẽ trong `art/beach.ts`, `oldTown.ts`, `uptown.ts`).
- Khi đổi tiệm, scene khởi động lại và dựng `RoomView` mới, rồi `create` gọi `setHouses` trước lần vẽ phòng đầu tiên.

## Cách làm

Em đã cân nhắc ba cách vẽ nhà ở chi nhánh:

1. **Mỗi nơi có bốn căn riêng, cùng vật liệu với phòng chi nhánh, mỗi căn một màu tường. (em chọn)** Phố cổ vẫn gạch tàu và xà gỗ, bãi biển vẫn ván cát, khu phố mới vẫn đá hoa cương. Căn mới khác ở màu tường và nẹp, nên nhìn ra căn mới mà vẫn đúng chất từng nơi. Tốn công nhất: 12 hình nhà và một kiểu mái mới.
2. **Dùng lại bốn căn gạch bông của tiệm chính.** Gần như không phải vẽ gì. Nhưng nền gạch bông hồng xanh sẽ nằm sát sàn đá hoa cương hay ván cát, nhìn như hai tiệm ghép lại, mất chất riêng của chi nhánh.
3. **Mỗi nơi một kiểu cho cả bốn căn, nối liền phòng cũ không thấy đường ghép.** Vẽ ít hơn cách 1. Nhưng nhìn không ra căn nào mới mua, trái với mục tiêu ở trên và với spec mở rộng đất.

Chồng yêu giao em quyết, nên em chọn cách 1.

## Luật

- Giống hệt tiệm chính:
  - căn gần 3.000.000 đ, căn xa 6.000.000 đ;
  - phải mua căn gần trước, mỗi bên tối đa 2 căn;
  - rao bán từ ngày 10;
  - tiền trừ vào ví chung.
- Mỗi căn thêm 1 chỗ kỹ thuật viên. Chi nhánh có một tầng, nên tối đa 3 + 4 = 7 thợ. Lễ tân vẫn 1.
- `houseProblem` bỏ điều kiện `'branch'`. Kiểu `HouseProblem` bỏ luôn giá trị đó.
- Mỗi chi nhánh có số nhà riêng. Mua ở phố cổ không mở nhà ở bãi biển.
- Bảng mua, chạm mái, hiệu ứng mua, trượt màn hình, thanh vị trí, mảng tối khi cúp điện, nệm ghế dài: dùng y như lô B, không đổi.

## Hình nhà ở chi nhánh

- **Khuôn giống nhà tầng 1 của tiệm chính:**
  - rộng 6,5 ô, cao 18 + 2 ô;
  - vẽ cho căn bên phải, căn bên trái lật lại;
  - x = 0 ở giữa cột tường cũ, sàn tới 6,0, tường ngoài 6,0–6,2;
  - kính mặt tiền suốt bề ngang, không có cửa, rồi vỉa hè.
- **Mỗi nơi giữ vật liệu sàn và kiểu tường sau của phòng chi nhánh.** Chỉ đổi màu chính của tường hoặc nẹp:

  | Nơi | Sàn | Tường sau | R1 | L1 | R2 | L2 | Mái khi rao bán |
  |---|---|---|---|---|---|---|---|
  | Phố cổ | ván gỗ sẫm phía sau, gạch tàu phía trước, như phòng | tường vôi có xà gỗ sẫm và cột | xanh rêu `#A9C29A` | xanh lam `#9DBBD0` | hồng đất `#E6AE96` | vàng nhạt `#F2D28C` | ngói |
  | Bãi biển | gạch xanh nhạt phía sau, ván cát phía trước, như phòng | tường trắng có dải ván | dải san hô `#F2A48E` | dải bạc hà `#9FD8C2` | dải vàng nắng `#F4D27A` | dải biển `C.sea` | tôn |
  | Khu phố mới | ván gỗ sáng phía sau, đá hoa cương phía trước, như phòng | tường kem ô ván có nẹp | nẹp xanh ngọc `#5FA39A` | nẹp bạc `#AEB6BC` | nẹp hồng `#D99AA5` | nẹp xanh lá `#8FB28A` | mái bằng (mới) |

  - Ở phố cổ và bãi biển, cột màu là màu tường hoặc dải ván.
  - Ở khu phố mới, cột màu là màu nẹp tường và đường ron đá. Thay cho vàng `C.caoGoldLight` của phòng chính chi nhánh.
- **Đồ trang trí trên tường:**
  - mỗi căn một món nhỏ đúng chất nơi đó (đèn lồng, cửa chớp gỗ, phao, vỏ sò, khung tranh…);
  - không lặp lại cả dãy đèn hay ô kính nhìn ra toà nhà của phòng chính.
  - Nét vẽ chi tiết để người làm quyết.
- **Mái bằng của khu phố mới (kiểu mái mới):**
  - mặt bê tông xám nhạt có đường ron;
  - gờ tường quanh mép;
  - một bồn nước nhỏ;
  - phía trước vẫn là cửa cuốn và vỉa hè như hai kiểu mái cũ.
- **Biển "BÁN NHÀ / CHÍNH CHỦ" và giá:** giống tiệm chính.
- **Đặt tên hình:** người làm tự đặt. Hình của tiệm chính giữ nguyên tên `house-<key>-<tầng>` và `sale-<key>`.

## Save

- Save lên bản 34. Từ bản 34, `houses` của chi nhánh được giữ khi tải, không ép về 0 nữa.
- Bản game cũ (33) gặp save 34 sẽ từ chối, không âm thầm xoá nhà đã mua ở chi nhánh. Đây là cách game vẫn làm mỗi khi thêm dữ liệu mới.
- Mở save 33 trở xuống: nhà ở chi nhánh là `{0,0}`, như bây giờ.

## Thử

- **Test sim:**
  - chi nhánh ngày 12 mua đủ bốn căn, gần trước xa, trừ ví chung;
  - đường đi từ cửa vào căn mới;
  - kê giường và ghế dài trong căn mới;
  - giới hạn 7 thợ;
  - mua ở một chi nhánh không mở nhà ở chi nhánh khác hay ở tiệm chính;
  - save 34 giữ nhà của chi nhánh, save 33 mở ra là 0.
- **Test hình:** đủ hình cho ba nơi × bốn căn và mái của từng nơi, đúng cỡ, đúng màu trong bảng.
- **Kiểm trên trình duyệt**, khung cỡ iPhone, ở cả ba chi nhánh:
  - mái và biển hiện;
  - chạm mái mở bảng mua; mua xong mái bay lên và căn mới hiện;
  - kê giường sang căn mới, chủ tiệm dẫn khách tới;
  - tải lại vẫn giữ nhà;
  - đổi qua lại tiệm chính và chi nhánh, mỗi nơi đúng nhà của mình. Đây cũng là bước lô B còn thiếu.

## Để người làm quyết

- Nét vẽ chi tiết, đồ trang trí trên tường từng căn, và tông tối của từng màu tường hoặc nẹp.
- Tên hình và cách tổ chức file vẽ.
- Chia thành một lô hay hai lô (luật và save trước, hình sau). Em nghĩ một lô là đủ.
