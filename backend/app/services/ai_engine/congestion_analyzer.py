import numpy as np
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from .tracker import Track
from .lane_detector import Lane

class CongestionLevel(Enum):
    FREE_FLOW = 'free_flow'       # 0-20
    LIGHT = 'light'               # 20-40
    MODERATE = 'moderate'         # 40-60
    HEAVY = 'heavy'               # 60-80
    STANDSTILL = 'standstill'     # 80-100

@dataclass
class TrafficMetrics:
    vehicle_counts: Dict[str, int]
    total_vehicles: int
    pedestrian_count: int
    queue_length: float  # 0-1
    density: float       # vehicles per unit area, 0-1
    occupancy: float     # % road covered, 0-1
    avg_speed: float     # km/h
    speed_stddev: float
    congestion_score: float  # 0-100
    congestion_level: CongestionLevel
    emergency_detected: bool
    emergency_type: Optional[str]
    incident_detected: bool
    timestamp: datetime

class CongestionAnalyzer:
    SPEED_WEIGHT = 0.3
    DENSITY_WEIGHT = 0.3
    QUEUE_WEIGHT = 0.25
    OCCUPANCY_WEIGHT = 0.15
    
    def analyze(self, tracks: List[Track], speeds: Dict[int, float], lanes: List[Lane], frame_shape: Tuple[int, int]) -> TrafficMetrics:
        vehicle_counts = {}
        pedestrian_count = 0
        total_vehicles = 0
        
        for t in tracks:
            if t.class_name == 'person':
                pedestrian_count += 1
            else:
                vehicle_counts[t.class_name] = vehicle_counts.get(t.class_name, 0) + 1
                total_vehicles += 1

        density = self.calculate_density(tracks, frame_shape[0] * frame_shape[1])
        occupancy = self.calculate_occupancy(tracks, frame_shape)
        
        speed_vals = list(speeds.values())
        avg_speed = np.mean(speed_vals) if speed_vals else 0.0
        speed_stddev = np.std(speed_vals) if speed_vals else 0.0

        # Simplified queue length calculation
        queue_length = min(1.0, total_vehicles / 50.0) 

        congestion_score = self.calculate_congestion_score(density, queue_length, avg_speed, occupancy)
        
        if congestion_score < 20: level = CongestionLevel.FREE_FLOW
        elif congestion_score < 40: level = CongestionLevel.LIGHT
        elif congestion_score < 60: level = CongestionLevel.MODERATE
        elif congestion_score < 80: level = CongestionLevel.HEAVY
        else: level = CongestionLevel.STANDSTILL
        
        emergency_detected = False
        emergency_type = None
        for t in tracks:
            if t.class_name in ['ambulance', 'police_car', 'fire_truck']:
                emergency_detected = True
                emergency_type = t.class_name
                break

        incident_detected = False # Simplify incident detection for now

        return TrafficMetrics(
            vehicle_counts=vehicle_counts,
            total_vehicles=total_vehicles,
            pedestrian_count=pedestrian_count,
            queue_length=queue_length,
            density=density,
            occupancy=occupancy,
            avg_speed=float(avg_speed),
            speed_stddev=float(speed_stddev),
            congestion_score=congestion_score,
            congestion_level=level,
            emergency_detected=emergency_detected,
            emergency_type=emergency_type,
            incident_detected=incident_detected,
            timestamp=datetime.utcnow()
        )

    def calculate_density(self, tracks: List[Track], area: float) -> float:
        # Very rough estimation of density
        return min(1.0, len(tracks) * 10000 / (area + 1e-5))

    def calculate_occupancy(self, tracks: List[Track], frame_shape: Tuple[int, int]) -> float:
        total_bbox_area = sum((t.bbox[2]-t.bbox[0]) * (t.bbox[3]-t.bbox[1]) for t in tracks)
        return min(1.0, total_bbox_area / (frame_shape[0] * frame_shape[1] + 1e-5))

    def calculate_congestion_score(self, density: float, queue: float, speed: float, occupancy: float) -> float:
        speed_factor = max(0.0, 1.0 - (speed / 60.0))  # Assuming 60km/h is free flow
        score = (
            self.DENSITY_WEIGHT * density +
            self.QUEUE_WEIGHT * queue +
            self.SPEED_WEIGHT * speed_factor +
            self.OCCUPANCY_WEIGHT * occupancy
        ) * 100.0
        return min(100.0, max(0.0, score))

    def detect_incident(self, tracks: List[Track], prev_tracks: List[Track], metrics: TrafficMetrics) -> bool:
        return False  # Placeholder logic
