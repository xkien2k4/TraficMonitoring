import os
import cv2
import json
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
from ultralytics import YOLO
from PIL import Image, ImageTk

from vehicle_counter import VehicleCounter
from speed_estimator import SpeedEstimator
from plate_reader import PlateReader

# =======================
# CONFIG
# =======================
OUTPUT_FOLDER = "outputs"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

RESIZE_W, RESIZE_H = 960, 540
FRAME_SKIP = 3

# =======================
# MODELS
# =======================
vehicle_model = YOLO("yolov8n.pt")
plate_reader = PlateReader()

# =======================
# GUI
# =======================
root = tk.Tk()
root.title("Giám sát giao thông (OFFLINE)")
root.geometry("1000x700")
root.resizable(False, False)

tk.Label(
    root,
    text="HỆ THỐNG GIÁM SÁT VI PHẠM GIAO THÔNG",
    font=("Arial", 13, "bold")
).pack(pady=10)

btn_choose = tk.Button(
    root,
    text="📂 Chọn video để xử lý",
    font=("Arial", 12),
    width=30
)
btn_choose.pack(pady=10)

video_label = tk.Label(root, bg="black", width=960, height=540)
video_label.pack(pady=10)

status_label = tk.Label(root, text="Trạng thái: Chưa xử lý", font=("Arial", 10))
status_label.pack(pady=5)

# =======================
# PLAY VIDEO IN TKINTER
# =======================
def play_frames_in_gui(frames):
    idx = 0

    def update():
        nonlocal idx
        if idx >= len(frames):
            status_label.config(text="Trạng thái: Hoàn thành")
            return

        frame = cv2.cvtColor(frames[idx], cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame)
        imgtk = ImageTk.PhotoImage(img)

        video_label.imgtk = imgtk
        video_label.config(image=imgtk)

        idx += 1
        video_label.after(30, update)

    update()

# =======================
# CORE PROCESS
# =======================
def process_video(input_path):
    status_label.config(text="Trạng thái: Đang xử lý...")

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        messagebox.showerror("Lỗi", "Không mở được video")
        return

    vehicle_counter = VehicleCounter(RESIZE_W, RESIZE_H)
    speed_estimator = SpeedEstimator(pixel_per_meter=8)

    plate_results = {}
    frames = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        frame = cv2.resize(frame, (RESIZE_W, RESIZE_H))

        if frame_idx % FRAME_SKIP == 0:
            results = vehicle_model.track(
                frame,
                persist=True,
                classes=[2, 3, 5, 7],
                conf=0.4,
                iou=0.5,
                verbose=False
            )[0]

            if results.boxes and results.boxes.id is not None:
                boxes = results.boxes.xyxy.cpu().numpy()
                ids = results.boxes.id.cpu().numpy().astype(int)
                classes = results.boxes.cls.cpu().numpy().astype(int)

                frame = vehicle_counter.process(frame, boxes, ids, classes)

                for box, tid in zip(boxes, ids):
                    x1, y1, x2, y2 = map(int, box)
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

                    speed = speed_estimator.estimate(tid, cx, cy)

                    if tid not in plate_results:
                        plate = plate_reader.read_plate(
                            frame,
                            vehicle_box=(x1, y1, x2, y2),
                            track_id=tid
                        )
                        if plate:
                            plate_results[tid] = plate

                    plate = plate_results.get(tid, "")

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame,
                        f"ID {tid} | {int(speed)} km/h",
                        (x1, y1 - 25),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 0),
                        2
                    )

                    if plate:
                        cv2.putText(
                            frame,
                            plate,
                            (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (255, 255, 0),
                            2
                        )

        frames.append(frame)

    cap.release()

    # SAVE JSON
    json_path = os.path.join(
        OUTPUT_FOLDER,
        os.path.basename(input_path).replace(".mp4", "_plates.json")
    )
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "vehicle_count": vehicle_counter.get_stats(),
            "plates": {str(k): v for k, v in plate_results.items()}
        }, f, ensure_ascii=False, indent=2)

    status_label.config(text="Trạng thái: Đang phát video kết quả")
    play_frames_in_gui(frames)

# =======================
# BUTTON ACTION
# =======================
def choose_video():
    path = filedialog.askopenfilename(
        title="Chọn video để xử lý",
        filetypes=[("Video", "*.mp4 *.avi *.mkv")]
    )
    if path:
        threading.Thread(target=process_video, args=(path,), daemon=True).start()

btn_choose.config(command=choose_video)

root.mainloop()
