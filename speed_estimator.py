# speed_estimator.py
import time
from collections import defaultdict
import cv2

class SpeedEstimator:
    """
    Đo vận tốc dựa trên quãng đường pixel / thời gian
    """

    def __init__(self, pixel_per_meter=8):
        self.pixel_per_meter = pixel_per_meter
        self.track_history = defaultdict(list)

    def estimate(self, track_id, cx, cy):
        """
        Trả về vận tốc km/h của object
        """
        self.track_history[track_id].append((cx, cy, time.time()))

        if len(self.track_history[track_id]) < 2:
            return 0

        (x0, y0, t0), (x1, y1, t1) = self.track_history[track_id][-2:]
        dist_pixel = ((x1 - x0)**2 + (y1 - y0)**2) ** 0.5

        if t1 == t0:
            return 0

        speed = (dist_pixel / self.pixel_per_meter) / (t1 - t0) * 3.6
        return speed
