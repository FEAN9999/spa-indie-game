# Ngày và đêm theo giờ trong game

Anh duyệt ngày 2026-10-31.

## Vì sao

Tiệm trông giống nhau từ 8:00 đến 20:00. Anh muốn trời sáng tối theo đồng hồ game, và khi trời tối thì đèn trong tiệm sáng lên.

## Làm gì

- Ánh sáng tính thẳng từ phút trong ngày (`sim.clock.minutes`), không lưu gì, không đổi phiên bản save.
- Mốc giờ (em đề xuất):
  - 8:00 hơi dịu xanh nhạt, sáng hẳn lúc 9:00.
  - 9:00–16:00 như bây giờ, không phủ màu.
  - 16:00–18:00 nắng chiều vàng cam nhạt, đậm dần.
  - 18:00–19:30 chuyển sang xanh đêm, tối dần; giữ tối tới 20:00 và cả sau khi đóng cửa.
  - Đèn bật từ 18:30, sáng hẳn lúc 19:00.
- Lớp phủ nằm trên tiệm và người, dưới tiền bay, bong bóng và thanh trên cùng, như lớp tối lúc cúp điện. Vỉa hè và đường tối hơn trong tiệm một chút, để tiệm trông như còn sáng đèn.
- Đèn sáng có quầng vàng ấm (dùng lại `fx-glow` của nến cúp điện, cộng sáng):
  - đèn lồng đỏ trên tường của mỗi giường,
  - đèn bàn làm móng (cả khi xoay),
  - đèn tre đứng, dây đèn lồng Hội An,
  - đèn lồng trên tường tầng 2,
  - ánh đèn hắt ra cửa trước xuống vỉa hè ở tầng 1.
- Lúc cúp điện thì đèn không bật (cúp điện 14:00–16:00 nên thực tế không trùng).

## Không làm

- Không đổi giờ mở/đóng cửa (vẫn 8:00–20:00, đêm khoảng 25 giây thật cuối ngày).
- Không phủ màu trong mini-game, thẻ, thanh trên cùng.
- Không thêm biểu tượng mặt trời/mặt trăng ở đồng hồ.

## Cách làm

Đã cân nhắc:
1. **Một lớp màu phủ + quầng sáng ở đèn** (chọn): giống hệt lớp tối lúc cúp điện, nhẹ, mượt trên iPhone.
2. Hệ ánh sáng Light2D của Phaser: đẹp hơn nhưng phải bật cho từng hình, nặng trên điện thoại.
3. Tô màu (tint) từng hình: nhiều công, dễ sót các hình vẽ bằng Graphics.

Phần tính màu/độ đậm/độ sáng đèn theo phút là một hàm thuần trong `src/view/daylight.ts`, có test. `RoomView` vẽ lớp phủ và quầng sáng; vị trí đèn của từng món đồ ghi theo toạ độ trong hình của món đó.

## Cập nhật 2026-11-01: đêm thật hơn

Chồng yêu duyệt hướng A và mấy chi tiết phụ, vì đêm cũ là một lớp màu phủ đều lên cả trong tiệm lẫn ngoài phố, trông như sương mù (gạch trắng 246 xuống 138, vỉa hè 116, gần bằng nhau).

- Lớp đêm nhân màu (MULTIPLY) thay vì phủ màu: tối đi mà không bạc màu. `daylight(minutes)` trả về ba màu nhân: `sky` cho ngoài trời, `indoor` cho phòng đã bật đèn (trắng ấm), `rooftop` cho sân thượng (nửa đường giữa hai màu kia, nhờ dây đèn), cùng `lamps` như cũ.
- Trong tiệm và nhà hàng đã bật đèn thì gần như sáng như ban ngày; ngoài phố, nhà hàng xóm, nhà rao bán xanh đêm. Tầng chưa mở và lúc cúp điện thì tối như ngoài phố.
- Ánh đèn từ mặt tiền hắt xuống vỉa hè, nhạt dần tới mép đường; trước cửa tầng 1 có vệt sáng hình thang (`fx-doorLight`).
- Nhà hàng xóm (mặt tiền đóng cửa `lot-front`) sáng khoảng hai trong ba ô cửa sổ, vàng ấm, có quầng; tắt khi cúp điện. Nhà rao bán và nhà cũ "SANG NHƯỢNG" để tối vì không có người ở.
- Không đổi: mốc giờ, giờ đèn bật 18:30–19:00, ban ngày (y hệt từng điểm ảnh). Đèn đường, đèn lồng chợ đêm, đèn công viên thuộc lô B của spec nâng cấp phố.
