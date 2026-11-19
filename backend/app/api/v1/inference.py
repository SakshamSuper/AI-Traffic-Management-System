"""
Real-time Frame Inference API
Accepts a base64-encoded JPEG frame from the browser, runs YOLOv11 detection,
ByteTracker for object tracking, computes traffic metrics via CongestionAnalyzer,
then applies Webster's Signal Timing Engine for professional time allotment.

Endpoints:
  POST /api/v1/inference/analyze-frame   — single frame analysis
  GET  /api/v1/inference/timing-model    — describe the timing model parameters
"""

import base64
import logging
import time
from io import BytesIO
from typing import Dict, List, Optional, Any

import numpy as np
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request/Response Models ──────────────────────────────────────────────────

class FrameAnalysisRequest(BaseModel):
    """Browser sends a base64-encoded JPEG frame."""
    frame_b64: str = Field(..., description="Base64-encoded JPEG image (no data: prefix needed)")
    camera_id: str = Field(default="webcam", description="Camera identifier")
    frame_width: int = Field(default=640)
    frame_height: int = Field(default=360)
    observation_period_s: float = Field(default=1.0, description="Seconds since last frame (for flow rate)")


class BoundingBoxResult(BaseModel):
    track_id: int
    class_name: str
    confidence: float
    bbox_px: List[float]      # [x1, y1, x2, y2] in pixels
    bbox_pct: List[float]     # [x%, y%, w%, h%] as percentages for CSS overlay
    pcu_weight: float
    speed_kmh: Optional[float] = None


class TimingResult(BaseModel):
    green_duration: int
    red_duration: int
    yellow_duration: int
    cycle_length: int
    pcu_load: float
    saturation_degree: float
    congestion_score: float
    is_emergency: bool
    emergency_type: Optional[str]
    reasoning: str
    vehicle_counts: Dict[str, int]
    weighted_pcu: Dict[str, float]


class FrameAnalysisResponse(BaseModel):
    camera_id: str
    frame_id: int
    inference_ms: float
    total_detected: int
    detections: List[BoundingBoxResult]
    metrics: Dict[str, Any]
    timing: TimingResult


# ── Lazy-load AI components ───────────────────────────────────────────────────

_detector = None
_tracker = None
_analyzer = None
_timing_engine = None
_frame_counter = 0


def _get_components():
    global _detector, _tracker, _analyzer, _timing_engine

    if _timing_engine is None:
        from app.services.signal_timing_engine import timing_engine
        _timing_engine = timing_engine

    if _detector is None:
        from app.services.ai_engine.detector import TrafficDetector
        from app.core.config import settings
        _detector = TrafficDetector(
            model_path=settings.AI_MODEL_PATH,
            confidence_threshold=settings.AI_CONFIDENCE_THRESHOLD,
            nms_threshold=settings.AI_NMS_THRESHOLD,
        )
        # Initialize synchronously (blocking on first call only)
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            loop.run_until_complete(_detector.initialize())
        except RuntimeError:
            # Already in async context or no event loop — use thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, _detector.initialize())
                future.result(timeout=30)

    if _tracker is None:
        from app.services.ai_engine.tracker import ByteTracker
        _tracker = ByteTracker(max_age=30, min_hits=2, iou_threshold=0.3)

    if _analyzer is None:
        from app.services.ai_engine.congestion_analyzer import CongestionAnalyzer
        _analyzer = CongestionAnalyzer()

    return _detector, _tracker, _analyzer, _timing_engine


# ── Helper: decode base64 JPEG to numpy BGR frame ────────────────────────────

def _decode_frame(frame_b64: str) -> np.ndarray:
    """Decode base64 string → numpy BGR image for OpenCV."""
    import cv2

    # Strip data URL prefix if present
    if "," in frame_b64:
        frame_b64 = frame_b64.split(",", 1)[1]

    raw_bytes = base64.b64decode(frame_b64)
    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image — invalid JPEG bytes")
    return img


# ── Helper: convert pixel bbox to CSS-friendly percentage ────────────────────

def _bbox_to_pct(bbox: List[float], w: int, h: int) -> List[float]:
    """Convert [x1,y1,x2,y2] pixels → [left%, top%, width%, height%]"""
    x1, y1, x2, y2 = bbox
    left_pct  = round(x1 / w * 100, 2)
    top_pct   = round(y1 / h * 100, 2)
    width_pct = round((x2 - x1) / w * 100, 2)
    height_pct = round((y2 - y1) / h * 100, 2)
    return [left_pct, top_pct, width_pct, height_pct]


# ── Main Inference Endpoint ───────────────────────────────────────────────────

@router.post("/analyze-frame", response_model=FrameAnalysisResponse)
async def analyze_frame(request: FrameAnalysisRequest):
    """
    Accept a base64 JPEG frame, run full YOLOv11 + ByteTracker + Webster's timing pipeline.

    Returns:
      - Real YOLO detections with bounding boxes as % coordinates for CSS overlay
      - Traffic metrics (density, speed, congestion score)
      - Webster's optimal signal timing (green/red/cycle durations)
    """
    global _frame_counter
    _frame_counter += 1
    frame_id = _frame_counter

    t_start = time.monotonic()

    try:
        # 1. Decode frame
        frame = _decode_frame(request.frame_b64)
        h, w = frame.shape[:2]

    except Exception as e:
        logger.error(f"Frame decode error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid frame: {str(e)}")

    try:
        detector, tracker, analyzer, timing_engine = _get_components()

        # 2. Run YOLO detection
        raw_detections = detector.detect(frame)

        # 3. ByteTracker update — persistent IDs across frames
        tracks = tracker.update(raw_detections)

        # 4. Speed estimation from track history (pixels/frame → km/h approximation)
        speeds: Dict[int, float] = {}
        for t in tracks:
            if len(t.history) >= 2:
                dx = t.history[-1][0] - t.history[-2][0]
                dy = t.history[-1][1] - t.history[-2][1]
                pixel_speed = (dx**2 + dy**2) ** 0.5
                # Rough calibration: 1 pixel ≈ 0.1m, frame interval ≈ 0.1s
                speeds[t.track_id] = min(120.0, pixel_speed * 3.6)  # convert to km/h

        # 5. Congestion analysis from tracks
        from app.services.ai_engine.lane_detector import Lane
        metrics = analyzer.analyze(
            tracks=tracks,
            speeds=speeds,
            lanes=[],          # simplified — no lane map required
            frame_shape=(h, w)
        )

        # 6. Build vehicle counts for timing engine
        vehicle_counts: Dict[str, int] = {}
        for t in tracks:
            vehicle_counts[t.class_name] = vehicle_counts.get(t.class_name, 0) + 1

        # If no tracks yet (YOLO still warming up), fall back to raw detection counts
        if not vehicle_counts and raw_detections:
            for d in raw_detections:
                vehicle_counts[d.class_name] = vehicle_counts.get(d.class_name, 0) + 1

        # 7. Webster's Signal Timing Engine
        timing_decision = timing_engine.compute(
            vehicle_counts=vehicle_counts,
            frame_area_px=w * h,
            observation_period_s=request.observation_period_s,
        )

        # 8. Build response detections with percentage coordinates
        from app.services.signal_timing_engine import PCU_WEIGHTS
        result_detections: List[BoundingBoxResult] = []

        # Prefer tracked objects (have IDs), fall back to raw detections
        if tracks:
            for t in tracks:
                bbox_pct = _bbox_to_pct(t.bbox, w, h)
                result_detections.append(BoundingBoxResult(
                    track_id=t.track_id,
                    class_name=t.class_name,
                    confidence=round(t.confidence, 3),
                    bbox_px=[round(v, 1) for v in t.bbox],
                    bbox_pct=bbox_pct,
                    pcu_weight=PCU_WEIGHTS.get(t.class_name, 1.0),
                    speed_kmh=round(speeds.get(t.track_id, 0), 1),
                ))
        else:
            for idx, d in enumerate(raw_detections):
                bbox_pct = _bbox_to_pct(d.bbox, w, h)
                result_detections.append(BoundingBoxResult(
                    track_id=idx + 1,
                    class_name=d.class_name,
                    confidence=round(d.confidence, 3),
                    bbox_px=[round(v, 1) for v in d.bbox],
                    bbox_pct=bbox_pct,
                    pcu_weight=PCU_WEIGHTS.get(d.class_name, 1.0),
                    speed_kmh=None,
                ))

        inference_ms = round((time.monotonic() - t_start) * 1000, 1)

        # Synchronize Webster's timing with the MJPEG stream engine
        try:
            from app.services.stream_engine import stream_engine
            stream_engine.update_signal_timing(
                green=timing_decision.green_duration,
                red=timing_decision.red_duration,
                emergency=timing_decision.is_emergency,
                emergency_type=timing_decision.emergency_type or "",
            )
        except Exception as se_err:
            logger.debug(f"Stream engine timing sync notice: {se_err}")

        return FrameAnalysisResponse(
            camera_id=request.camera_id,
            frame_id=frame_id,
            inference_ms=inference_ms,
            total_detected=len(result_detections),
            detections=result_detections,
            metrics={
                "total_vehicles": metrics.total_vehicles,
                "pedestrian_count": metrics.pedestrian_count,
                "density": round(metrics.density, 4),
                "occupancy": round(metrics.occupancy, 4),
                "avg_speed_kmh": round(metrics.avg_speed, 1),
                "congestion_score": round(metrics.congestion_score, 1),
                "congestion_level": metrics.congestion_level.value,
                "emergency_detected": metrics.emergency_detected,
                "emergency_type": metrics.emergency_type,
                "vehicle_counts": metrics.vehicle_counts,
            },
            timing=TimingResult(
                green_duration=timing_decision.green_duration,
                red_duration=timing_decision.red_duration,
                yellow_duration=timing_decision.yellow_duration,
                cycle_length=timing_decision.cycle_length,
                pcu_load=timing_decision.pcu_load,
                saturation_degree=timing_decision.saturation_degree,
                congestion_score=timing_decision.congestion_score,
                is_emergency=timing_decision.is_emergency,
                emergency_type=timing_decision.emergency_type,
                reasoning=timing_decision.reasoning,
                vehicle_counts=timing_decision.vehicle_counts,
                weighted_pcu=timing_decision.weighted_pcu,
            ),
        )

    except Exception as e:
        logger.exception(f"Inference pipeline error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@router.get("/timing-model")
async def get_timing_model_info():
    """Returns the signal timing model parameters for documentation/transparency."""
    from app.services.signal_timing_engine import (
        PCU_WEIGHTS, SATURATION_FLOW_PCU_PER_HOUR, LANES_PER_APPROACH,
        MIN_GREEN, MAX_GREEN, YELLOW, ALL_RED, EMERGENCY_EXTENSION
    )
    return {
        "model": "Webster's Optimal Cycle Length Formula (1958)",
        "formula": "C_opt = (1.5 * L + 5) / (1 - ΣYi)",
        "description": (
            "PCU-weighted vehicle flow divided by saturation flow gives degree of saturation. "
            "Webster's formula minimises total delay at an intersection."
        ),
        "pcu_weights": PCU_WEIGHTS,
        "saturation_flow_pcu_per_hour_per_lane": SATURATION_FLOW_PCU_PER_HOUR,
        "lanes_per_approach": LANES_PER_APPROACH,
        "limits": {
            "min_green_s": MIN_GREEN,
            "max_green_s": MAX_GREEN,
            "yellow_s": YELLOW,
            "all_red_s": ALL_RED,
            "emergency_extension_s": EMERGENCY_EXTENSION,
        },
    }
