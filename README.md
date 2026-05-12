# BẢN THẢO ĐỀ XUẤT: HỆ THỐNG BÌNH CHỌN NHÓM TRỰC TUYẾN (INTERACTIVE GROUP VOTING SYSTEM)

## 1. Tổng quan dự án
Ứng dụng web thời gian thực (real-time) cho phép các nhóm tham gia đánh giá chéo và bình chọn cho nhau. Hệ thống đảm bảo tính công bằng bằng cách chặn tự bình chọn và cung cấp góc nhìn trực quan, minh bạch thông qua biểu đồ dữ liệu — chỉ dành cho Admin. Phong cách thiết kế hướng tới sự hiện đại, tối giản, tập trung vào trải nghiệm tương tác.

---

## 2. Luồng người dùng (User Flow)

### Màn hình Welcome: Chọn vai trò
Người dùng truy cập web và nhận được một popup/form yêu cầu chọn vai trò:
- **Tôi là thành viên nhóm** → Chọn tên nhóm từ dropdown → Vào màn hình bình chọn
- **Tôi là Admin** → Nhập mật khẩu Admin → Vào bảng điều khiển quản trị

### Màn hình Bình chọn (Voting — dành cho thành viên nhóm)
Sau khi xác nhận tên nhóm, hệ thống hiển thị danh sách các nhóm khác (đã loại trừ nhóm của người dùng). Người dùng chọn 1 nhóm xuất sắc nhất và nhấn "Bình chọn". Sau khi bình chọn thành công, hiển thị màn hình cảm ơn — **không hiển thị kết quả** để đảm bảo tính bảo mật.

### Bảng điều khiển Admin (Admin Dashboard)
Chỉ Admin mới có quyền truy cập sau khi xác thực mật khẩu:
- Xem biểu đồ bình chọn realtime (Bar Chart)
- Xem bảng xếp hạng các nhóm (Leaderboard)
- Xem nhật ký bình chọn chi tiết
- Reset toàn bộ phiếu bầu
- Xóa phiếu bầu của một nhóm
- Xuất dữ liệu JSON

---

## 3. Giải pháp kỹ thuật cho các yêu cầu đặc biệt

### Vấn đề 1: Nhận diện nhóm qua dữ liệu nhập không đồng nhất
**Giải pháp — Chuẩn hóa chuỗi (String Normalization):**
- Loại bỏ khoảng trắng ở hai đầu (`trim()`)
- Chuyển toàn bộ ký tự về chữ thường (`toLowerCase()`)
- Ví dụ: " Nhóm 1 ", "NHÓM 1", "nhóm 1" đều được hiểu chung là "nhóm 1"

**Giải pháp tối ưu UX:** Sử dụng Dropdown hỗ trợ tìm kiếm (Searchable Select/Combobox). Người tham gia chỉ cần gõ 1-2 ký tự, hệ thống gợi ý tên nhóm đúng chuẩn, loại bỏ hoàn toàn sai sót nhập liệu.

### Vấn đề 2: Chặn bình chọn cho chính nhóm mình
**Giải pháp:** Sau khi người dùng chọn tên nhóm, tên nhóm (đã chuẩn hóa) được lưu vào Session Storage. Khi render danh sách bình chọn, Frontend dùng `filter()` để ẩn nhóm trùng khớp. Backend cũng kiểm tra lại: nếu `voter_group === voted_group`, request bị từ chối.

### Vấn đề 3: Bảo mật kết quả
**Giải pháp:** Kết quả bình chọn (biểu đồ, xếp hạng, nhật ký) chỉ hiển thị trong Admin Dashboard sau khi xác thực mật khẩu. Thành viên nhóm sau khi bình chọn chỉ nhìn thấy màn hình cảm ơn.

---

## 4. Các tính năng cốt lõi (Core Features)

### Dành cho thành viên nhóm
- **Xác thực linh hoạt**: Không cần đăng nhập phức tạp, định danh tạm thời qua tên nhóm từ dropdown
- **Tương tác bình chọn**: Giao diện thẻ (Cards) với animation mượt mà (chọn, thả tim)
- **Chống spam**: Mỗi thiết bị chỉ vote được 1 lần (UID lưu trong LocalStorage)
- **Bảo mật kết quả**: Không hiển thị kết quả cho người bình chọn

### Dành cho Admin
- **Xác thực mật khẩu**: Bảo vệ bảng điều khiển bằng mật khẩu
- **Biểu đồ realtime**: Bar Chart cập nhật tự động mỗi 3 giây
- **Bảng xếp hạng**: Top 1/2/3 highlight vàng/bạc/đồng
- **Nhật ký chi tiết**: Xem ai bình chọn cho ai, thời gian
- **Quản lý dữ liệu**: Reset tất cả / xóa phiếu của tôi / xuất JSON

---

## 5. Đề xuất Công nghệ (Tech Stack)
- **Frontend**: HTML5 + Vanilla CSS + Vanilla JavaScript (không cần framework)
- **Biểu đồ**: Chart.js (CDN) — animation mượt, responsive
- **Lưu trữ**: LocalStorage (vote data) + SessionStorage (session user)
- **Real-time simulation**: `setInterval` polling mỗi 3 giây (có thể nâng cấp lên Firebase/Supabase)

---

## 6. Danh sách nhóm tham gia
1. 🔥 BẮT HỢP NHẤT TÂM
2. 🧠 LIÊN KẾT TRÍ TUỆ
3. 🌏 VƯƠN TẦM QUỐC TẾ
4. ⚡ KHÔNG TRÌ HOÃN
5. 🌊 ĐẠI DƯƠNG XANH

---

## 7. Giao diện & Trải nghiệm (UI/UX)
- **Phong cách**: Hiện đại, tối giản (Minimalist Dark Mode)
- **Màu sắc**: Nền tối (#0f0e17), màu chủ đạo Indigo/Violet (#7c3aed), accent Amber (#f59e0b)
- **Typography**: Google Fonts Inter (300–900)
- **Hiệu ứng**: Glassmorphism cards, gradient borders, floating hearts animation, smooth transitions
- **Responsive**: Tương thích mobile và desktop

---

## 8. Thông tin Admin
- **Mật khẩu mặc định**: `admin123`
- Nên đổi mật khẩu trong file `app.js` trước khi triển khai thực tế