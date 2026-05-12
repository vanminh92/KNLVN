const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh (HTML, CSS, JS) trong cùng thư mục
app.use(express.static(__dirname));

// Lưu trữ dữ liệu trong RAM (Sẽ mất khi khởi động lại server)
// Trong thực tế, có thể lưu vào file JSON hoặc Database (MySQL, MongoDB)
let votes = [];

// Khôi phục dữ liệu từ file JSON nếu có
const dataFile = path.join(__dirname, 'votes_data.json');
function loadData() {
  if (fs.existsSync(dataFile)) {
    try {
      const data = fs.readFileSync(dataFile, 'utf8');
      votes = JSON.parse(data);
    } catch (e) {
      console.error("Lỗi đọc file dữ liệu:", e);
    }
  }
}
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(votes, null, 2));
}

loadData();

// --- API ENDPOINTS ---

// 1. Lấy toàn bộ phiếu bầu
app.get('/api/votes', (req, res) => {
  res.json(votes);
});

// 2. Gửi một phiếu bầu mới
app.post('/api/votes', (req, res) => {
  const { uid, voter, voted, time } = req.body;
  
  if (!uid || !voter || !voted) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  // Kiểm tra xem user này đã vote chưa
  const hasVoted = votes.some(v => v.uid === uid);
  if (hasVoted) {
    return res.status(400).json({ error: 'Người dùng này đã bình chọn rồi' });
  }

  const newVote = { uid, voter, voted, time: time || new Date().toISOString() };
  votes.push(newVote);
  saveData();

  res.status(201).json({ success: true, message: 'Đã ghi nhận phiếu bầu', vote: newVote });
});

// 3. Reset toàn bộ dữ liệu (Chỉ dành cho Admin)
app.delete('/api/votes', (req, res) => {
  // Trong môi trường thực tế, cần có thêm xác thực token admin ở đây
  votes = [];
  saveData();
  res.json({ success: true, message: 'Đã reset toàn bộ dữ liệu' });
});

// Bắt đầu server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📱 Để truy cập từ điện thoại/máy tính khác cùng mạng WiFi,`);
  console.log(`   hãy dùng địa chỉ IPv4 của máy tính này (VD: http://192.168.1.x:${PORT})\n`);
});
