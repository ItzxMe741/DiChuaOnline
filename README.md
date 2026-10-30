# 🪷 Chùa An Lạc 3D - Đi Chùa Online & Chiêm Bái Lễ Phật

Game 3D trực tuyến tái hiện không gian Chùa truyền thống Việt Nam, hỗ trợ nhiều người chơi cùng lúc (Multiplayer), giao lưu trò chuyện và thực hiện đầy đủ các nghi lễ tâm linh chân thực.

---

## 🌟 Các Tính Năng Tâm Linh & Tương Tác

1. **🙏 Lạy Phật (Phím 1):**
   - Đảnh lễ Tam Bái (lạy 3 lạy trang nghiêm thành kính) với cử động quỳ lạy mượt mà, kèm tiếng khánh chuông thanh tịnh.

2. **🕯️ Thắp Nhang / Dâng Hương (Phím 2):**
   - Thắp 3 nén tâm hương dâng lên bàn thờ Tam Bảo hoặc Đại Lư Hương ngoài sân.
   - Đầu nhang đỏ rực, khói trầm hương uốn lượn bay lên chân thực bằng hệ thống hạt Particle.
   - Nhang thắp xong sẽ lưu lại trong không gian để mọi người cùng chiêm bái.

3. **📿 Lần Chuỗi Hạt Niệm Phật (Phím 3 / Phím Space):**
   - Mở giao diện Tràng Hạt 108 Hạt phong cách mỹ thuật cổ truyền.
   - Mỗi lần bấm (hoặc phím Space), hạt tràng xoay một nấc, âm thanh lách cách êm tai, câu niệm *"Nam Mô A Di Đà Phật"* hiện lên và bộ đếm ghi nhận công đức.

4. **🔔 Thỉnh Đại Hồng Chung (Phím 4):**
   - Vồ gỗ đung đưa thỉnh chuông đồng cổ kính.
   - Âm thanh Đại Hồng Chung ngân vang trầm ấm, rung chấn tâm thức (tổng hợp trực tiếp qua Web Audio API).

5. **🪵 Gõ Mõ Tụng Kinh (Phím 5):**
   - Dùi mõ gõ tiếng *"cốc cốc"* trầm ngâm, thanh tịnh vang khắp chánh điện.

6. **📜 Xin Xăm Quán Âm (Phím 6):**
   - Lắc ống xăm bốc quẻ cầu an, hiển thị bài thơ xăm tứ tuyệt, ý nghĩa và lời khuyên tu dưỡng hướng thiện.

7. **💬 Trò Chuyện & Nhiều Người Chơi (Multiplayer):**
   - Nhiều người cùng vào chùa qua mạng nội bộ hoặc Internet.
   - Tùy chọn Pháp danh và màu y phục Phật tử (Áo Lam, Áo Nâu, Bạch Y, Áo Vàng).
   - Khung chat cộng đồng + **Bóng thoại (Speech Bubble)** hiển thị trực tiếp trên đầu nhân vật trong không gian 3D.

8. **🎵 Nhạc Phật Tĩnh Tâm:**
   - Phát MP3 nội bộ theo yêu cầu, có thể dùng trên điện thoại và không nhúng YouTube.
   - Nhạc nền lấy từ `public/music/nhac-phat-tinh-tam.mp3`; người dùng chỉ thấy nút bật/tắt.

---

## 🎮 Hướng Dẫn Điều Khiển

- **W, A, S, D** hoặc **Phím Mũi Tên**: Di chuyển nhân vật
- **Giữ Chuột Trái & Kéo**: Xoay góc nhìn 360 độ xung quanh nhân vật
- **Cuộn Chuột**: Phóng to / Thu nhỏ góc nhìn camera
- **Phím 1 - 6**: Thực hiện các nghi lễ tâm linh
- **Phím Enter**: Mở khung chat gửi lời chào đến các đạo hữu

---

## 🚀 Khởi Chạy Game

1. Nhấp đúp chuột vào file `start.bat` (hoặc chạy lệnh `python server.py`).
2. Mở trình duyệt và truy cập: **`http://localhost:8000`**
3. Mở trên nhiều tab trình duyệt hoặc gửi địa chỉ IP máy tính cho bạn bè trong mạng LAN để cùng vào chùa trải nghiệm!

---

## 🌐 Deploy lên Vercel

1. Đưa dự án lên GitHub/GitLab rồi import repository tại Vercel.
2. Vercel nhận diện FastAPI từ `server.py` và cài các gói trong `requirements.txt`.
3. MP3 đã nằm tại `public/music/nhac-phat-tinh-tam.mp3`. File này được phục vụ như static asset; trình phát chỉ tải khi khách bấm nút nhạc.

Vercel hiện hỗ trợ WebSocket, nhưng dữ liệu người chơi/chat trong `server.py` đang lưu trong RAM của từng instance. Muốn multiplayer ổn định khi Vercel tạo nhiều instance, cần thêm kho dữ liệu chia sẻ như Redis.
