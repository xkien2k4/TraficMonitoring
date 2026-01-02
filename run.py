# run.py
import cv2
from ultralytics import YOLO
from vehicle_counter import VehicleCounter
from speed_estimator import SpeedEstimator

cap = cv2.VideoCapture("video.mp4")
assert cap.isOpened()

w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30

out = cv2.VideoWriter(
    "output_test.avi",
    cv2.VideoWriter_fourcc(*"mp4v"),
    fps,
    (w, h)
)

model = YOLO("yolov8n.pt")
counter = VehicleCounter(w, h)
speed_estimator = SpeedEstimator(pixel_per_meter=8)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    results = model.track(frame, persist=True, classes=[2,3,5,7])[0]

    if results.boxes.id is not None:
        boxes = results.boxes.xyxy.cpu().numpy()
        ids = results.boxes.id.cpu().numpy()
        classes = results.boxes.cls.cpu().numpy().astype(int)

        frame = counter.process(frame, boxes, ids, classes)

        for box, tid in zip(boxes, ids):
            x1,y1,x2,y2 = map(int, box)
            cx = (x1+x2)//2
            cy = (y1+y2)//2

            speed = speed_estimator.estimate(tid, cx, cy)
            cv2.putText(frame, f"{int(speed)} km/h",
                        (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                        (255,255,0), 2)

            cv2.rectangle(frame, (x1,y1),(x2,y2),(0,255,0),2)

    out.write(frame)

cap.release()
out.release()

print("Done. Output: output_test.avi")
