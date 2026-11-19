import cv2
import numpy as np
from typing import List, Tuple, Dict, Any
from dataclasses import dataclass
from .tracker import Track

@dataclass
class Lane:
    id: int
    points: List[Tuple[int, int]]
    direction: str  # 'incoming', 'outgoing', 'both'
    max_capacity: int
    region_of_interest: np.ndarray  # polygon

class LaneDetector:
    def __init__(self):
        self.lanes: List[Lane] = []
        self.roi_points = None

    def set_roi(self, frame_shape: Tuple[int, int], roi_points: List[Tuple[int, int]]):
        self.roi_points = np.array(roi_points, np.int32)

    def detect_lanes(self, frame: np.ndarray) -> List[Lane]:
        # Simplistic Hough lines detection for demo purposes
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        
        mask = np.zeros_like(edges)
        if self.roi_points is not None:
            cv2.fillPoly(mask, [self.roi_points], 255)
        else:
            h, w = frame.shape[:2]
            polygon = np.array([[(0, h), (w, h), (w, h//2), (0, h//2)]], np.int32)
            cv2.fillPoly(mask, polygon, 255)
            
        masked_edges = cv2.bitwise_and(edges, mask)
        lines = cv2.HoughLinesP(masked_edges, 1, np.pi/180, 50, minLineLength=100, maxLineGap=50)
        
        lanes = []
        if lines is not None:
            for idx, line in enumerate(lines):
                x1, y1, x2, y2 = line[0]
                poly = np.array([[(x1-20, y1), (x1+20, y1), (x2+20, y2), (x2-20, y2)]], np.int32)
                lanes.append(Lane(id=idx, points=[(x1, y1), (x2, y2)], direction='both', max_capacity=10, region_of_interest=poly))
        return lanes

    def configure_lanes_manual(self, lanes: List[dict]):
        self.lanes = []
        for l in lanes:
            poly = np.array(l['roi_points'], np.int32)
            lane = Lane(id=l['id'], points=l['points'], direction=l.get('direction', 'both'), 
                        max_capacity=l.get('max_capacity', 10), region_of_interest=poly)
            self.lanes.append(lane)

    def count_vehicles_per_lane(self, tracks: List[Track], lanes: List[Lane]) -> Dict[int, int]:
        counts = {lane.id: 0 for lane in lanes}
        for track in tracks:
            cx = int((track.bbox[0] + track.bbox[2]) / 2)
            cy = int((track.bbox[1] + track.bbox[3]) / 2)
            for lane in lanes:
                # Check if center point is in lane polygon
                if cv2.pointPolygonTest(lane.region_of_interest, (cx, cy), False) >= 0:
                    counts[lane.id] += 1
        return counts

    def calculate_queue_length(self, tracks: List[Track], lane: Lane) -> float:
        # Simplistic queue length normalized 0-1
        count = 0
        for track in tracks:
            cx = int((track.bbox[0] + track.bbox[2]) / 2)
            cy = int((track.bbox[1] + track.bbox[3]) / 2)
            if cv2.pointPolygonTest(lane.region_of_interest, (cx, cy), False) >= 0:
                # Check if speed is nearly zero
                speed = np.sqrt(track.velocity[0]**2 + track.velocity[1]**2)
                if speed < 1.0: 
                    count += 1
        return min(1.0, count / float(lane.max_capacity))

    def get_lane_occupancy(self, tracks: List[Track], lane: Lane) -> float:
        count = 0
        for track in tracks:
            cx = int((track.bbox[0] + track.bbox[2]) / 2)
            cy = int((track.bbox[1] + track.bbox[3]) / 2)
            if cv2.pointPolygonTest(lane.region_of_interest, (cx, cy), False) >= 0:
                count += 1
        return min(1.0, count / float(lane.max_capacity))

    def draw_lanes(self, frame: np.ndarray, lanes: List[Lane], vehicle_counts: Dict[int, int]) -> np.ndarray:
        out_frame = frame.copy()
        for lane in lanes:
            cv2.polylines(out_frame, [lane.region_of_interest], True, (255, 0, 0), 2)
            count = vehicle_counts.get(lane.id, 0)
            pts = lane.points
            if pts:
                cv2.putText(out_frame, f"Lane {lane.id}: {count}", pts[0], cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        return out_frame
