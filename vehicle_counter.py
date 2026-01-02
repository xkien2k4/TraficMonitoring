# vehicle_counter.py
import cv2
from collections import defaultdict, deque

class VehicleCounter:
    """
    Đếm xe IN / OUT dựa trên line crossing
    """

    CLASS_NAMES = {
        2: "car",
        3: "motorcycle",
        5: "bus",
        7: "truck"
    }

    def __init__(self, frame_width, frame_height, line_y=None):
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.line_y = line_y if line_y else frame_height // 2

        self.in_count = 0
        self.out_count = 0

        self.tracks = {}                 # id -> counted
        self.points = defaultdict(lambda: deque(maxlen=2))
        self.by_class_in = defaultdict(int)
        self.by_class_out = defaultdict(int)

    def process(self, frame, boxes, ids, classes):
        """
        frame  : frame gốc
        boxes  : xyxy
        ids    : track id
        classes: class id
        """
        for box, tid, cls in zip(boxes, ids, classes):
            x1, y1, x2, y2 = map(int, box)
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            self.points[tid].append(cy)

            if tid not in self.tracks:
                self.tracks[tid] = False

            if len(self.points[tid]) == 2 and not self.tracks[tid]:
                prev_y, curr_y = self.points[tid]

                if prev_y < self.line_y and curr_y > self.line_y:
                    self.out_count += 1
                    self.by_class_out[self.CLASS_NAMES.get(cls, "other")] += 1
                    self.tracks[tid] = True

                elif prev_y > self.line_y and curr_y < self.line_y:
                    self.in_count += 1
                    self.by_class_in[self.CLASS_NAMES.get(cls, "other")] += 1
                    self.tracks[tid] = True

        # vẽ line
        cv2.line(frame, (0, self.line_y),
                 (self.frame_width, self.line_y),
                 (0, 0, 255), 2)

        # hiển thị số lượng
        cv2.putText(frame, f"IN: {self.in_count}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f"OUT: {self.out_count}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        return frame

    def get_stats(self):
        return {
            "in": self.in_count,
            "out": self.out_count,
            "by_class_in": dict(self.by_class_in),
            "by_class_out": dict(self.by_class_out)
        }
