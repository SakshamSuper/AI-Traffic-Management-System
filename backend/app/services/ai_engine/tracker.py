import numpy as np
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional
from .detector import Detection
from scipy.optimize import linear_sum_assignment

class TrackState(Enum):
    Tentative = 1
    Confirmed = 2
    Lost = 3
    Deleted = 4

@dataclass
class Track:
    track_id: int
    class_name: str
    bbox: List[float]  # [x1, y1, x2, y2]
    confidence: float
    state: TrackState
    age: int
    hits: int
    time_since_update: int
    velocity: Tuple[float, float]
    history: List[Tuple[float, float]] = field(default_factory=list)

class ByteTracker:
    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks: List[Track] = []
        self.next_id = 1

    def update(self, detections: List[Detection]) -> List[Track]:
        self._predict()

        matched, unmatched_tracks, unmatched_dets = self._hungarian_match(self.tracks, detections)

        # Update matched tracks
        for track_idx, det_idx in matched:
            track = self.tracks[track_idx]
            det = detections[det_idx]
            
            # Simple constant velocity update
            old_cx = (track.bbox[0] + track.bbox[2]) / 2
            old_cy = (track.bbox[1] + track.bbox[3]) / 2
            new_cx = (det.bbox[0] + det.bbox[2]) / 2
            new_cy = (det.bbox[1] + det.bbox[3]) / 2
            
            track.velocity = (new_cx - old_cx, new_cy - old_cy)
            track.history.append((new_cx, new_cy))
            if len(track.history) > 30:
                track.history.pop(0)

            track.bbox = det.bbox
            track.confidence = det.confidence
            track.hits += 1
            track.time_since_update = 0
            if track.state == TrackState.Tentative and track.hits >= self.min_hits:
                track.state = TrackState.Confirmed
            elif track.state == TrackState.Lost:
                track.state = TrackState.Confirmed

        # Mark unmatched tracks as lost or deleted
        for track_idx in unmatched_tracks:
            track = self.tracks[track_idx]
            track.time_since_update += 1
            if track.state == TrackState.Tentative:
                track.state = TrackState.Deleted
            elif track.time_since_update > self.max_age:
                track.state = TrackState.Deleted
            else:
                track.state = TrackState.Lost

        # Create new tracks for unmatched detections
        for det_idx in unmatched_dets:
            det = detections[det_idx]
            new_track = Track(
                track_id=self.next_id,
                class_name=det.class_name,
                bbox=det.bbox,
                confidence=det.confidence,
                state=TrackState.Tentative,
                age=0,
                hits=1,
                time_since_update=0,
                velocity=(0.0, 0.0),
                history=[]
            )
            self.tracks.append(new_track)
            self.next_id += 1

        # Remove deleted tracks
        self.tracks = [t for t in self.tracks if t.state != TrackState.Deleted]

        return self.active_tracks

    def _iou(self, bbox1: List[float], bbox2: List[float]) -> float:
        x_left = max(bbox1[0], bbox2[0])
        y_top = max(bbox1[1], bbox2[1])
        x_right = min(bbox1[2], bbox2[2])
        y_bottom = min(bbox1[3], bbox2[3])

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        iou = intersection_area / float(area1 + area2 - intersection_area)
        return iou

    def _hungarian_match(self, tracks: List[Track], detections: List[Detection]) -> Tuple[List[Tuple[int, int]], List[int], List[int]]:
        if len(tracks) == 0 or len(detections) == 0:
            return [], list(range(len(tracks))), list(range(len(detections)))

        iou_matrix = np.zeros((len(tracks), len(detections)), dtype=np.float32)
        for t_idx, track in enumerate(tracks):
            for d_idx, det in enumerate(detections):
                iou_matrix[t_idx, d_idx] = self._iou(track.bbox, det.bbox)

        cost_matrix = 1.0 - iou_matrix
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched = []
        unmatched_tracks = set(range(len(tracks)))
        unmatched_dets = set(range(len(detections)))

        for r, c in zip(row_ind, col_ind):
            if iou_matrix[r, c] >= self.iou_threshold:
                matched.append((r, c))
                unmatched_tracks.discard(r)
                unmatched_dets.discard(c)

        return matched, list(unmatched_tracks), list(unmatched_dets)

    def _predict(self):
        for track in self.tracks:
            track.age += 1
            if track.state == TrackState.Lost:
                track.bbox[0] += track.velocity[0]
                track.bbox[1] += track.velocity[1]
                track.bbox[2] += track.velocity[0]
                track.bbox[3] += track.velocity[1]

    @property
    def active_tracks(self) -> List[Track]:
        return [t for t in self.tracks if t.state == TrackState.Confirmed]
