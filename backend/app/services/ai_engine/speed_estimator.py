import math
import numpy as np
from typing import Dict, List, Optional
from .tracker import Track

class SpeedEstimator:
    def __init__(self, pixels_per_meter: float = 10.0, fps: float = 30.0):
        self.pixels_per_meter = pixels_per_meter
        self.fps = fps

    def update_track(self, track: Track) -> Optional[float]:
        if len(track.history) < 2:
            return None
            
        p1 = track.history[-2]
        p2 = track.history[-1]
        
        pixel_distance = math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
        meters = pixel_distance / self.pixels_per_meter
        speed_mps = meters * self.fps
        speed_kmh = speed_mps * 3.6
        
        return speed_kmh

    def estimate_speeds(self, tracks: List[Track]) -> Dict[int, float]:
        speeds = {}
        for track in tracks:
            speed = self.update_track(track)
            if speed is not None:
                speeds[track.track_id] = speed
        return speeds

    def calculate_average_speed(self, speeds: Dict[int, float]) -> float:
        if not speeds:
            return 0.0
        return sum(speeds.values()) / len(speeds)

    def calculate_speed_percentiles(self, speeds: Dict[int, float]) -> Dict[str, float]:
        if not speeds:
            return {'p50': 0.0, 'p85': 0.0, 'p95': 0.0}
        
        values = list(speeds.values())
        return {
            'p50': float(np.percentile(values, 50)),
            'p85': float(np.percentile(values, 85)),
            'p95': float(np.percentile(values, 95))
        }

    def calibrate(self, reference_distance_m: float, reference_distance_px: float):
        if reference_distance_m > 0:
            self.pixels_per_meter = reference_distance_px / reference_distance_m
