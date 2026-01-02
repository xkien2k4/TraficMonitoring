# TraficMonitoring
Hệ thống giám sát giao thông
* Công nghệ sử dụng
Python 3.9+
YOLOv8 (Ultralytics)
OpenCV
NumPy
Tesseract OCR (đọc biển số)
⚙️ Cài đặt
1️⃣ Clone repository
git clone https://github.com/xkien2k4/TraficMonitoring.git
cd TraficMonitoring
2️⃣ Tạo môi trường ảo
python -m venv .venv
source .venv/bin/activate   # Linux / Mac
.venv\Scripts\activate      # Windows
3️⃣ Cài đặt thư viện
pip install -r requirements.txt
📦 Model YOLO
Model YOLO không được upload lên GitHub do dung lượng lớn.
👉 Bạn có thể tải tự động bằng:
pip install ultralytics
YOLO sẽ tự tải model khi chạy lần đầu.
▶️ Chạy chương trình
Chạy ứng dụng chính
python app.py
