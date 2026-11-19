import asyncio
import logging
from typing import List, Tuple, Dict, Any
from dataclasses import dataclass
import numpy as np
import cv2

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

logger = logging.getLogger(__name__)

@dataclass
class Detection:
    class_id: int
    class_name: str
    confidence: float
    bbox: List[float] # [x1, y1, x2, y2]

class TrafficDetector:
    TRAFFIC_CLASSES = {
        0: 'person',  # pedestrian
        1: 'bicycle',
        2: 'car',
        3: 'motorcycle',
        5: 'bus',
        7: 'truck',
        # custom classes (index 80+):
        80: 'ambulance',
        81: 'police_car',
        82: 'fire_truck',
        83: 'animal',
        84: 'debris',
        85: 'road_barrier'
    }
    EMERGENCY_CLASSES = {'ambulance', 'police_car', 'fire_truck'}
    
    def __init__(self, model_path: str = 'yolo11n.pt', confidence_threshold: float = 0.4, nms_threshold: float = 0.4):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
        self.model = None
        self._is_ready = False

    async def initialize(self) -> bool:
        try:
            if YOLO is None:
                logger.warning("ultralytics not installed. Falling back to mock detector.")
                self._is_ready = True
                return True
                
            logger.info(f"Loading YOLO model from {self.model_path}")
            self.model = YOLO(self.model_path)
            await self.warmup()
            self._is_ready = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize TrafficDetector: {e}")
            self._is_ready = False
            return False

    def detect(self, frame: np.ndarray) -> List[Detection]:
        if not self._is_ready:
            return []
            
        if self.model is None:
            # Mock mode
            return [Detection(2, 'car', 0.9, [100.0, 100.0, 200.0, 200.0])]

        results = self.model(frame, conf=self.confidence_threshold, iou=self.nms_threshold, verbose=False)
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                if cls_id in self.TRAFFIC_CLASSES:
                    class_name = self.TRAFFIC_CLASSES[cls_id]
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append(Detection(cls_id, class_name, conf, [x1, y1, x2, y2]))
        return detections

    def detect_emergency(self, detections: List[Detection]) -> Tuple[bool, str]:
        for d in detections:
            if d.class_name in self.EMERGENCY_CLASSES:
                return True, d.class_name
        return False, ""

    def draw_detections(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        out_frame = frame.copy()
        for d in detections:
            x1, y1, x2, y2 = map(int, d.bbox)
            color = (0, 0, 255) if d.class_name in self.EMERGENCY_CLASSES else (0, 255, 0)
            cv2.rectangle(out_frame, (x1, y1), (x2, y2), color, 2)
            label = f"{d.class_name} {d.confidence:.2f}"
            cv2.putText(out_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        return out_frame

    def get_vehicle_counts(self, detections: List[Detection]) -> Dict[str, int]:
        counts = {}
        for d in detections:
            counts[d.class_name] = counts.get(d.class_name, 0) + 1
        return counts

    async def warmup(self):
        if self.model:
            dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
            self.model(dummy_frame, verbose=False)
            logger.info("YOLO model warmup complete.")

    @property
    def is_ready(self) -> bool:
        return self._is_ready
