import cv2
import easyocr
import re

class PlateReader:
    def __init__(self):
        self.reader = easyocr.Reader(['en'], gpu=False)
        self.cache = {}

    def read_plate(self, frame, vehicle_box, track_id):
        if track_id in self.cache:
            return self.cache[track_id]

        x1,y1,x2,y2 = vehicle_box
        crop = frame[y1:y2, x1:x2]

        if crop.size == 0:
            return None

        texts = self.reader.readtext(crop)
        for _, text, conf in texts:
            text = re.sub(r'[^A-Z0-9]', '', text.upper())
            if 6 <= len(text) <= 10:
                self.cache[track_id] = text
                return text

        return None
