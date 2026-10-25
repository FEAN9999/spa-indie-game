# Bước 1b, đợt 1: lưu game, đưa game lên mạng, cài như app

- Ngày: 2026-10-25
- Trạng thái: anh đã duyệt (2026-10-25)
- Thuộc: spec chung `2026-10-25-spa-game-design.md`, mục 6 (bước 1b). Đây là đợt đầu trong 7 đợt nhỏ của bước 1b.

Cách đọc giống spec chung: **(anh chọn)** là điều anh đã quyết, **(em đề xuất)** là em tự điền, anh sửa được.

## 1. Vì sao làm đợt này trước

Hiện game chỉ chơi được khi máy tính ở nhà đang bật, điện thoại cùng Wi-Fi, và tắt trang là mất hết. Làm xong đợt này thì cả nhà mở một link là chơi ở bất cứ đâu, chơi nhiều ngày không mất tiến trình, và cài lên màn hình chính như một app. Có vậy cả nhà mới chơi thử thật được, và ý kiến của mọi người sẽ giúp chỉnh các đợt sau.

## 2. Mục tiêu

1. **Lưu game trên máy, có 3 ô lưu, xuất và nhập mã lưu** (spec chung mục 5.12).
2. **Đưa game lên GitHub Pages**, tự cập nhật mỗi lần em đẩy code mới. Link: `https://fean9999.github.io/spa-indie-game/`.
3. **Cài như app và chơi không cần mạng.**
4. **Sửa 4 lỗi nhỏ** còn lại từ đợt phong cách A (mục 7).

## 3. Chưa làm ở đợt này

- Xoá một ô lưu, hoặc chơi lại từ đầu trong ô đã có tiệm. Đổi sang ô trống là có tiệm mới.
- Lưu lên mây hoặc tự đồng bộ giữa các máy. Chuyển máy thì dùng mã lưu.
- Tên game, tên miền riêng. Chữ dưới biểu tượng app tạm là "Tiệm Spa".
- Tạo nhân vật, đặt tên tiệm, hướng dẫn ngày đầu (đợt 2), và các đợt sau.

## 4. Điều cấm (vẫn chạy được mà dính mấy điều này thì coi như hỏng)

- Cập nhật bản mới mà mất tiến trình. Từ đợt này về sau, bản mới phải đọc được tiến trình cũ. **(em đề xuất)**
- Game tự tải lại giữa lúc đang chơi, nhất là lúc đang gội đầu. **(anh chọn, cách A)**
- Mỗi lần mở game phải qua màn chọn ô lưu. **(anh chọn)**
- Mở game lúc không có mạng thì ra màn hình trắng.
- Tốn phí, hoặc phải tạo thêm tài khoản.

## 5. Ràng buộc

- iPhone Safari trước, Android Chrome cũng phải chạy được.
- Repo `FEAN9999/spa-indie-game` đã để công khai, nên dùng GitHub Pages miễn phí được. Không cần Cloudflare.
- **Anh làm một việc, một lần:** vào Settings → Pages của repo trên GitHub, chọn nguồn là "GitHub Actions". Công cụ tự đưa game lên không tự bật được mục này. Em sẽ chỉ từng bước lúc tới đó.
- **Trên iPhone, Safari và app ngoài màn hình chính giữ dữ liệu riêng.** Chơi trong Safari rồi mới cài app thì app bắt đầu từ ngày 1. Mã lưu là cách mang tiệm từ Safari sang app (mục 6.3).

## 6. Thiết kế

### 6.1 Lưu game

- **Mở game là vào thẳng tiệm đang chơi dở**, ở ô lưu dùng lần trước. **(anh chọn)** Lần đầu mở game thì vào ô 1 với tiệm mới.
- **Lưu cả tiệm**: ngày, giờ, tiền, đánh giá, số liệu trong ngày, chỗ đứng của chủ tiệm, từng khách (đang ở đâu, còn bao nhiêu kiên nhẫn), giường và ghế. **(em đề xuất)**
- **Lúc lưu (em đề xuất):** khi hết ngày, khoảng 10 giây một lần trong ngày, ngay khi thoát ra màn hình chính hoặc tắt màn hình, trước khi tải bản mới, và trước khi đổi ô lưu.
- **Mở lại giữa ngày (em đề xuất):** game hiện màn tạm dừng, chạm "Chơi tiếp" mới chạy. Như vậy khách không bị mất kiên nhẫn trong lúc người chơi còn đang định thần.
  - Tắt game giữa lúc gội đầu: mở lại thì khách vẫn nằm trên giường, mini-game bắt đầu lại từ đầu.
  - Tắt game lúc đang xem bảng tổng kết: mở lại thì thấy lại bảng tổng kết.
- **Mỗi bản lưu ghi số phiên bản** để bản mới tự nâng cấp bản lưu cũ, không xoá. **(em đề xuất)**
- **Bản lưu hỏng hoặc không đọc được:** game không treo. Ô đó bắt đầu tiệm mới, còn bản hỏng được cất riêng để em gỡ sau. **(em đề xuất)**

### 6.2 Màn tạm dừng

Hiện tại chạm vào đâu trên màn tạm dừng cũng là chơi tiếp. Đợt này màn tạm dừng có các nút, kiểu thẻ nền kem viền nâu như bảng tổng kết. **(anh chọn chỗ đặt, em đề xuất cách xếp)**

- **Chơi tiếp**: nút to nhất. Chạm ra ngoài các nút thì không có gì xảy ra, để tránh lỡ tay.
- **Ô lưu**: hiện 3 ô, mỗi ô ghi "Ngày 5 · 340.000 đ" hoặc "Ô trống". Ô đang chơi được đánh dấu. Chạm ô khác thì game lưu ô hiện tại rồi chuyển sang ô đó. Ô trống thì có tiệm mới.
- **Xuất mã lưu**: hiện mã của ô đang chơi kèm nút "Chép". Chép xong hiện "Đã chép". Mã là một chuỗi chữ, dán vào Zalo hay ghi chú đều được.
- **Nhập mã lưu**: một ô để dán mã và nút "Nạp vào ô này". Game hỏi lại trước khi thay: "Tiệm trong ô 2 (Ngày 5) sẽ bị thay bằng tiệm trong mã. Tiếp tục?". Mã sai thì báo "Mã lưu không đúng" và không đổi gì.
- **Cài vào màn hình chính**: chỉ hiện khi game đang chạy trong trình duyệt, chưa cài. Chạm vào thì mở hướng dẫn ở mục 6.3.

### 6.3 Cài như app

- Biểu tượng app vẽ theo phong cách A, chữ dưới biểu tượng là "Tiệm Spa". Mở từ màn hình chính thì game chiếm cả màn hình, không có thanh địa chỉ. **(em đề xuất)**
- **Hướng dẫn cài (em đề xuất):** lần đầu mở game trong Safari, game hiện một thẻ: "Cài game vào màn hình chính để không mất tiến trình", kèm hình nút Chia sẻ và dòng "Thêm vào màn hình chính". Có nút "Để sau". Thẻ này chỉ tự hiện một lần. Sau đó vẫn mở lại được từ màn tạm dừng.
  - Nếu tiệm trong Safari đã qua ngày 1, thẻ thêm một bước: chép mã lưu trước, mở app rồi nhập mã. Lý do ở mục 5.
  - Trên Android Chrome, thẻ có nút "Cài" mở hộp cài của máy. Máy không hỗ trợ thì thẻ chỉ cách cài bằng menu.
- **Chơi không cần mạng:** sau lần mở đầu tiên có mạng, game giữ sẵn mọi thứ trong máy. Lần sau không có mạng vẫn chơi bình thường.
- **Tai thỏ và thanh vuốt dưới đáy:** khi mở từ màn hình chính, game nằm gọn trong phần màn hình an toàn. Phần dư hai đầu tô màu cát như nền hiện tại. Việc này để lại từ bước 1a.

### 6.4 Nhận bản mới (anh chọn cách A)

- Mỗi lần mở game, hoặc quay lại game sau khi để đó, mà có mạng thì game xem có bản mới không. Có thì lưu, tải lại, rồi vào đúng chỗ đang chơi, ở màn tạm dừng như mục 6.1.
- Game không bao giờ tự tải lại khi đang chơi. Bản mới đưa lên lúc người chơi đang chơi thì đợi lần mở hoặc lần quay lại sau.
- Mạng yếu: game chờ bản mới tối đa khoảng 3 giây rồi chơi bản đang có. **(em đề xuất)**
- Không có mạng: chơi bản đang có, không báo lỗi.

### 6.5 Đưa game lên mạng

- Mỗi lần em đẩy code lên nhánh master trên GitHub, GitHub tự chạy test, đóng gói và đưa lên Pages. Test hỏng thì không đưa lên, bản đang chạy giữ nguyên. **(em đề xuất)**
- Link Wi-Fi nhà (`http://192.168.1.253:5173/`) vẫn dùng được để em thử bản đang làm dở.

## 7. Bốn lỗi nhỏ

1. **Viền nhân vật gần như đen.** Viền đang bị nhuộm theo màu áo và màu da. Sửa cho viền về đúng màu nâu #4A2E22 như đồ đạc.
2. **Chữ hoa có dấu cao nhất (Ẳ, Ẵ, Ỵ) có thể bị cắt tối đa 5 px.** Đợt 2 cho người chơi tự đặt tên tiệm nên phải sửa trước.
3. **Chạm vào phần chậu (viền đứt) phía trên ô giường trống thì không có gì xảy ra.** Sửa để chạm vào đâu trên chỗ giường trống cũng hiện "Tính năng này có ở bản sau".
4. **Chữ trên thanh trên cùng hơi nhỏ** (dòng ngày giờ chỉ cao khoảng 12 px trên iPhone). Làm chữ to hơn. Một dòng không đủ chỗ thì tách làm 2 dòng: tiền và sao ở trên, ngày giờ ở dưới. Em gửi ảnh chụp để anh duyệt. **(em đề xuất)**

## 8. Kiểm tra và tiêu chí xong

**Em tự kiểm tra:**
- Test tự động: lưu rồi đọc lại ra đúng tiệm cũ, kể cả khách đang đi giữa đường. Mã lưu xuất rồi nhập ra đúng tiệm. Mã sai bị từ chối. Bản lưu hỏng không làm treo game.
- Trên trình duyệt ở cỡ iPhone:
  - tắt giữa ngày rồi mở lại,
  - đổi ô lưu,
  - xuất rồi nhập mã,
  - tắt mạng rồi tải lại trang,
  - đưa một bản mới lên rồi quay lại game.
- Mở link GitHub Pages thật, chơi được.

**Anh kiểm tra giúp trên iPhone 17:**
- Mở link, cài vào màn hình chính.
- Bật chế độ máy bay rồi mở game.
- Chơi dở một ngày, tắt hẳn app, mở lại.
- Em báo có bản mới thì quay lại game xem đã lên chưa.

**Xong khi:** người trong nhà mở link trên điện thoại của mình, cài được, chơi nhiều ngày không mất tiến trình, và nhận được bản mới mà không phải làm gì.

## 9. Để người làm tự quyết

- Cách viết code, định dạng bản lưu và mã lưu, cách nén cho mã ngắn.
- Các con số: lưu mấy giây một lần, chờ bản mới bao lâu.
- Hình biểu tượng app, miễn theo phong cách A.
- Cách làm phần chạy không cần mạng, miễn không thêm thư viện và không tốn phí.
