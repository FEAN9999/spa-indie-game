# Chi nhánh thêm tầng

Ngày 2026-11-01. Nối tiếp [chi nhánh mua nhà](2026-10-31-chi-nhanh-mua-nha-design.md) (save 34) và [nhà hàng](2026-10-31-nha-hang-design.md) (save 39).

## Vì sao

Chồng yêu muốn chi nhánh của tiệm spa và nhà hàng đều mở rộng và thêm tầng được. Hiện giờ:

- chi nhánh spa đã mua được bốn căn hai bên (save 34), nhưng vẫn một tầng;
- nhà hàng chỉ có một cái, cạnh tiệm chính, và đã có nhà hai bên, tầng 2, sân thượng (save 39).

Phần còn thiếu là tầng cho chi nhánh. Chồng yêu chọn:

- chỉ thêm tầng cho chi nhánh, không thêm nhà hàng ở chi nhánh;
- vẽ riêng tầng 2 và sân thượng cho từng nơi;
- giá và luật giống tiệm chính.

## Mục tiêu

- Ở mỗi chi nhánh (bãi biển, phố cổ, khu phố mới), mở được tầng 2 rồi sân thượng, đúng luật của tiệm chính.
- Tầng trên mang chất riêng từng nơi, cả phòng lẫn các căn đã mua.
- Tiệm chính và nhà hàng không đổi gì. `same-draws` giữ nguyên.

## Không làm

- Nhà hàng ở chi nhánh.
- Giá tầng khác nhau theo nơi.
- Chuồng cu trên sân thượng vẽ riêng từng nơi: dùng chung cái của tiệm chính, vì nó là chòi che đầu cầu thang.
- Gợi ý "mở tầng" ở chi nhánh (chi nhánh không hiện gợi ý).

## Hiện giờ trong mã

- `BRANCH_ROOM` (`places.ts`) đổi cầu thang `U` thành sàn, nên `maxFloors()` của chi nhánh là 1.
- `PLACE_DECOR` đặt món quà của từng nơi ở ô (23, 10). Ô này là chân cầu thang tầng 1 (`grid.feet[0]`).
- `floorProblem`/`openFloor` của `SpaSim` không xét nơi, `staffCap` đã cộng 2 thợ mỗi tầng.
- `clearStairs` (`stairs.ts`) đã dọn đồ khỏi chỗ cầu thang cho save trước bản 14: dời giường hay ghế cuối cùng, bán lại món khác, trả quà về sổ khách.
- `RoomView.setFloor` lấy `room-2`, `room-3` cho mọi tiệm; `houseTextureKey` của chi nhánh không theo tầng.

## Luật

- Giống tiệm chính: tầng 2 3.000.000 đ, sân thượng 6.000.000 đ, mở từ ngày 6, phải mở tầng 2 trước, lối từ cửa tới chân cầu thang phải thông, trừ ví chung.
- Mỗi tầng thêm 2 chỗ thợ. Chi nhánh tối đa 3 + 2 × 2 + 4 = 11 thợ. Lễ tân vẫn 1.
- Mỗi chi nhánh mở tầng riêng.
- Chi nhánh dựng trên đúng phòng ngày đầu của tiệm chính, có cầu thang (`BRANCH_LAYOUT = SHOP_LAYOUT`).
- Món quà của từng nơi chuyển sang ô (13, 10), sát tường trái. Ô (23, 12) ngay dưới bình hoa thì món quà cao che mất bình hoa.
- Tin Phây khi chi nhánh mở tầng nói rõ chi nhánh nào, như tin mua nhà.

## Save

- Save lên bản 41 (`BRANCH_FLOORS_SAVE_VERSION`).
- Chi nhánh lưu trước bản 41 khi mở ra:
  - món quà của nơi đó còn ở (23, 10) thì dời sang (13, 10) nếu đặt được ở đó;
  - đồ còn lại trên cầu thang hay chân cầu thang được dọn bằng `clearStairs`, như save trước bản 14;
  - tiền hoàn của chi nhánh vào ví chung.
- Bản game cũ (40) gặp save 41 sẽ từ chối, như mọi lần thêm dữ liệu.

## Hình

Khuôn giống tầng trên của tiệm chính: phòng 13 × (18 + 2) ô, nhà 6,5 × (18 + 2) ô. Mỗi nơi giữ vật liệu và màu của tầng 1.

| Nơi | Tầng 2 | Sân thượng |
|---|---|---|
| Phố cổ | ván gỗ sẫm, tường vàng Hội An có xà và cột gỗ, hai cửa chớp, đèn lồng; ban công gỗ có lan can con tiện | gạch tàu, mái ngói phố xa, tường thấp vàng có gờ ngói, dây đèn lồng; dưới là mái ngói nhà bên |
| Bãi biển | ván cát, tường trắng có dải ván xanh và sọc biển, cửa sổ tròn nhìn biển, phao; ban công ván cát, lan can trắng có dây thừng | gạch xanh nhạt, biển xa có cánh buồm, dây cờ, tường thấp trắng gờ xanh biển; dưới là mái tôn nhà bên |
| Khu phố mới | đá hoa cương ron vàng, tường kem ô ván nẹp vàng, tranh và hai tường kính nhìn ra toà nhà; ban công đá hoa cương, lan can kính | gỗ sáng, toà nhà xa, lan can kính gờ bạc, hai chậu cây; dưới là mái bằng bê tông nhà bên |

- Các căn đã mua ở tầng trên: sàn và ban công như phòng tầng đó, tường sau giữ màu từng căn như tầng 1 (`BRANCH_HOUSE_LOOK`), sân thượng có tường thấp màu căn.
- Tên hình: `room-<nơi>-2`, `room-<nơi>-3`, `house-<nơi>-<căn>-<tầng>` (tầng 1 cũng đổi sang tên có tầng).

## Thử

- Test sim: chi nhánh mở tầng 2 rồi sân thượng, đúng giá, đúng thứ tự, trừ ví chung; thêm chỗ thợ; khách lên giường tầng 2; save 41 giữ tầng; save 40 dời quà, dọn cầu thang, hoàn tiền vào ví chung.
- Test hình: đủ hình, đúng cỡ, đúng bảng màu, mỗi nơi khác nhau.
- Trình duyệt khung iPhone: nút tầng hiện ở chi nhánh, mở tầng, xem từng tầng của ba nơi.
