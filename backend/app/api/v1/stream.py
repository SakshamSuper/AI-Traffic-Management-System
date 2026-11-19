"""
Control-Room Stream Endpoints
==============================
GET /api/v1/stream/video              — Real-time annotated MJPEG stream (God's Eye Drone / Delhi cams)
GET /api/v1/stream/video-file         — Stream from uploaded MP4/AVI file
POST /api/v1/stream/upload-video      — Upload user video for YOLO processing
POST /api/v1/stream/push-frame        — Webcam frame ingestion & YOLO annotation
GET /api/v1/stream/webcam             — Annotated MJPEG stream for webcam
GET /api/v1/stream/status             — Live telemetry, Webster's cycle, LOS, alerts, active vehicles
POST /api/v1/stream/lock-track        — Target vehicle lock/unlock
GET /api/v1/stream/target-crop/{tid}  — High-res vehicle crop + ANPR plate
POST /api/v1/stream/night-mode        — Toggle CLAHE low-light enhancement filter
GET /api/v1/stream/snapshot           — Instant JPEG snapshot download of current frame
GET /api/v1/stream/export-csv         — Export session vehicle telemetry to CSV
"""

import asyncio
import base64
import csv
import io
import logging
import os
import shutil
import tempfile
import time
from typing import Optional, Dict, AsyncIterator

import cv2
import numpy as np
from fastapi import APIRouter, Query, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse, Response
from pydantic import BaseModel

from app.services.stream_engine import (
    stream_engine,
    mjpeg_frames_from_image,
    mjpeg_frames_from_video,
    mjpeg_frames_from_device,
    mjpeg_frames_from_url,
    detect_available_cameras,
    generate_plate,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Paths ────────────────────────────────────────────────────────────────────
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TMP_DIR = os.path.join(BACKEND_DIR, "tmp")
AERIAL_VIDEO = os.path.join(BACKEND_DIR, "assets", "aerial_intersection.mp4")
os.makedirs(TMP_DIR, exist_ok=True)

# ── Push frame buffer (Webcam) ───────────────────────────────────────────────
_push_frame_buf: Optional[np.ndarray] = None
_push_frame_lock = asyncio.Lock()
_model_loaded = False


def _ensure_model():
    global _model_loaded
    if not _model_loaded:
        from app.core.config import settings
        stream_engine.load_model(getattr(settings, "AI_MODEL_PATH", "yolo11n.pt"))
        _model_loaded = True


# ── 1. Video Streams ─────────────────────────────────────────────────────────
@router.get("/video")
async def stream_live_video():
    """Streams real-time annotated God's Eye aerial drone feed with YOLOv11 + ByteTrack."""
    _ensure_model()
    if not os.path.exists(AERIAL_VIDEO):
        raise HTTPException(404, f"Aerial video not found: {AERIAL_VIDEO}")

    return StreamingResponse(
        mjpeg_frames_from_video(AERIAL_VIDEO, target_w=1280, target_h=720),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/available-cameras")
async def get_available_cameras():
    """Detects available hardware cameras (webcams, USB cams) and returns feed presets."""
    hw = detect_available_cameras()
    return {
        "hardware_cameras": hw,
        "presets": [
            {
                "id": "gods_eye",
                "label": "God's Eye Aerial (4K Drone)",
                "sub": "Overhead continuous multi-lane intersection live stream",
                "type": "drone"
            },
            {
                "id": "phone_ip_webcam",
                "label": "Phone Camera (IP Webcam App)",
                "sub": "Connect any smartphone via WiFi (http://<phone_ip>:8080/video)",
                "type": "ip_camera"
            },
            {
                "id": "rtsp_cctv",
                "label": "Network CCTV / RTSP Stream",
                "sub": "Connect any IP camera or NVR/DVR stream (rtsp://...)",
                "type": "rtsp"
            }
        ]
    }


@router.get("/live-device/{device_index}")
async def stream_live_device(device_index: int = 0):
    """Streams live frames directly from a local hardware camera with real-time YOLOv11."""
    _ensure_model()
    return StreamingResponse(
        mjpeg_frames_from_device(device_index=device_index, target_w=1280, target_h=720),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/live-url")
async def stream_live_url(url: str = Query(..., description="RTSP, HTTP, or HLS stream URL")):
    """Streams and annotates any external live RTSP, HTTP, or IP camera feed."""
    _ensure_model()
    return StreamingResponse(
        mjpeg_frames_from_url(url=url, target_w=1280, target_h=720),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/video-file")
async def stream_video_file(path: str = Query(..., description="Absolute path to video file")):
    """Streams an uploaded video file through the YOLO annotator."""
    _ensure_model()
    if not os.path.exists(path):
        raise HTTPException(404, f"Video not found: {path}")

    return StreamingResponse(
        mjpeg_frames_from_video(path, target_w=1280, target_h=720),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    """Uploads a traffic video file for God's-eye-view YOLO processing."""
    suffix = os.path.splitext(file.filename or "")[1] or ".mp4"
    tmp_path = os.path.join(TMP_DIR, f"upload_{int(time.time() * 1000)}{suffix}")
    try:
        with open(tmp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"path": os.path.abspath(tmp_path), "filename": file.filename}
    except Exception as e:
        logger.error(f"Failed to save uploaded video: {e}")
        raise HTTPException(500, f"Upload error: {str(e)}")


# ── 2. Webcam Pipeline ───────────────────────────────────────────────────────
class PushFrameRequest(BaseModel):
    frame_b64: str
    cam_id: str = "webcam"


@router.post("/push-frame")
async def push_frame(req: PushFrameRequest):
    """Processes browser webcam frame with YOLOv11 + ByteTracker."""
    global _push_frame_buf
    _ensure_model()

    b64 = req.frame_b64
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(400, "Invalid JPEG frame")

    frame = cv2.resize(frame, (1280, 720))
    annotated, metrics = stream_engine.process_frame(frame)

    async with _push_frame_lock:
        _push_frame_buf = annotated

    ok, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        raise HTTPException(500, "Frame encoding failed")

    return {
        "frame_b64": base64.b64encode(buf.tobytes()).decode(),
        "metrics": metrics,
    }


async def _push_frame_stream() -> AsyncIterator[bytes]:
    global _push_frame_buf
    while True:
        async with _push_frame_lock:
            frame = _push_frame_buf

        if frame is not None:
            ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if ok:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + buf.tobytes()
                    + b"\r\n"
                )
        await asyncio.sleep(0.06)


@router.get("/webcam")
async def stream_webcam():
    return StreamingResponse(
        _push_frame_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ── 3. Control-Room Telemetry & Status ────────────────────────────────────────
@router.get("/status")
async def get_stream_status():
    """Live traffic intelligence status including Webster's cycle, LOS, and active vehicles."""
    tot_up = sum(stream_engine._count_up.values())
    tot_dn = sum(stream_engine._count_dn.values())

    fps_now = 0.0
    if len(stream_engine._frame_times) >= 2:
        fps_now = (len(stream_engine._frame_times) - 1) / (stream_engine._frame_times[-1] - stream_engine._frame_times[0] + 1e-6)

    return JSONResponse({
        "phase": stream_engine._phase,
        "phase_timer": stream_engine._phase_timer,
        "green_duration": stream_engine.green_duration,
        "red_duration": stream_engine.red_duration,
        "yellow_duration": stream_engine.yellow_duration,
        "webster_cycle": stream_engine.webster_cycle,
        "pcu_load": round(stream_engine.pcu_load, 1),
        "los_grade": stream_engine.los_grade,
        "los_desc": stream_engine.los_desc,
        "saturation_ratio": stream_engine.saturation_ratio,
        "emergency": stream_engine.emergency,
        "emergency_type": stream_engine.emergency_type,
        "fps": round(fps_now, 1),
        "locked_target": stream_engine.locked_track_id,
        "night_mode": stream_engine.night_mode,
        "heatmap_mode": stream_engine.heatmap_mode,
        "active_vehicles": stream_engine.active_vehicles,
        "recent_alerts": list(stream_engine.recent_alerts),
        "count_up": tot_up,
        "count_dn": tot_dn,
        "total_active": len(stream_engine.active_vehicles),
        # NEMA TS2 State
        "nema": {
            "ring1_phase": stream_engine.nema_ring1_phase,
            "ring2_phase": stream_engine.nema_ring2_phase,
            "barrier": stream_engine.nema_barrier_active,
            "ring1_status": "GREEN" if stream_engine._phase == "GREEN" else stream_engine._phase,
            "ring2_status": "GREEN" if stream_engine._phase == "GREEN" else stream_engine._phase,
        },
        # ATSPM Performance
        "atspm": {
            "arrivals_on_green_pct": stream_engine.arrivals_on_green_pct,
            "purdue_split_failure_rate": stream_engine.purdue_split_failure_rate,
            "average_delay_seconds": stream_engine.average_delay_seconds,
            "green_wave_speed_kmh": stream_engine.green_wave_speed_kmh,
        },
        # Environmental Footprint
        "emissions": {
            "cumulative_co2_kg": round(stream_engine.cumulative_co2_kg, 2),
            "cumulative_fuel_liters": round(stream_engine.cumulative_fuel_liters, 2),
            "co2_saved_adaptive_kg": round(stream_engine.co2_saved_adaptive_kg, 2),
        },
        # Safety & Vision Zero Analytics
        "safety": {
            "near_miss_count": len(stream_engine.near_miss_conflicts),
            "red_light_violations_count": len(stream_engine.red_light_violations),
            "speed_violations_count": stream_engine.speed_violations_count,
            "stalled_vehicles_count": stream_engine.stalled_vehicles_count,
            "recent_red_light": stream_engine.red_light_violations[-5:],
        },
        # Multi-Approach Matrix
        "approach_matrix": stream_engine._get_approach_matrix(len(stream_engine.active_vehicles)),
    })


# ── 4. Target Vehicle Lock & ANPR Inspector ───────────────────────────────────
class LockTargetRequest(BaseModel):
    track_id: Optional[int] = None


@router.post("/lock-track")
async def lock_target_vehicle(req: LockTargetRequest):
    """Locks or unlocks onto a target vehicle for trajectory & ANPR tracking."""
    stream_engine.set_locked_track(req.track_id)
    return {"status": "ok", "locked_track_id": stream_engine.locked_track_id}


@router.get("/target-crop/{track_id}")
async def get_target_crop(track_id: int):
    """
    Returns an enhanced vehicle crop + localized license plate image for ANPR inspection.
    """
    target = next((v for v in stream_engine.active_vehicles if v["tid"] == track_id), None)
    if not target or stream_engine.last_annotated_frame is None:
        # Fallback plate data
        plate = generate_plate(track_id)
        return {
            "track_id": track_id,
            "plate": plate,
            "crop_b64": None,
            "plate_crop_b64": None,
            "speed_kmh": 0.0,
            "class_name": "vehicle",
            "confidence": 0.90,
            "duration_s": 0.0,
            "direction": "SOUTH",
            "violation": "NONE",
        }

    x1, y1, x2, y2 = target["bbox"]
    h_f, w_f = stream_engine.last_annotated_frame.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w_f, x2), min(h_f, y2)

    crop = stream_engine.last_annotated_frame[y1:y2, x1:x2]
    crop_b64 = None
    plate_b64 = None

    if crop.size > 0:
        # Resize crop for clean display
        disp_crop = cv2.resize(crop, (280, 200))
        ok, buf = cv2.imencode(".jpg", disp_crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if ok:
            crop_b64 = base64.b64encode(buf.tobytes()).decode()

        # Extract plate region (lower 35% of vehicle)
        ch, cw = crop.shape[:2]
        plate_region = crop[int(ch * 0.65):, int(cw * 0.20):int(cw * 0.80)]
        if plate_region.size > 0:
            plate_disp = cv2.resize(plate_region, (200, 60))
            ok2, buf2 = cv2.imencode(".jpg", plate_disp, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if ok2:
                plate_b64 = base64.b64encode(buf2.tobytes()).decode()

    return {
        "track_id": track_id,
        "class_name": target["cls"],
        "confidence": target["conf"],
        "speed_kmh": target["speed"],
        "plate": target["plate"],
        "duration_s": target["duration_s"],
        "direction": target["direction"],
        "violation": target["violation"],
        "crop_b64": crop_b64,
        "plate_crop_b64": plate_b64,
    }


# ── 5. Night Vision & Spatial Heatmap Toggles ─────────────────────────────────
class NightModeRequest(BaseModel):
    enabled: Optional[bool] = None


@router.post("/night-mode")
async def toggle_night_mode(req: NightModeRequest):
    """Enables/disables CLAHE contrast enhancement for low-light/night videos."""
    state = stream_engine.toggle_night_mode(req.enabled)
    stream_engine.add_alert(0, "SYSTEM", f"Night Vision (CLAHE) {'Activated' if state else 'Deactivated'}")
    return {"night_mode": state}


class HeatmapRequest(BaseModel):
    enabled: Optional[bool] = None


@router.post("/heatmap")
async def toggle_heatmap_mode(req: HeatmapRequest):
    """Toggles real-time 2D spatial congestion density heatmap overlay."""
    state = stream_engine.toggle_heatmap(req.enabled)
    stream_engine.add_alert(0, "SYSTEM", f"Spatial Density Heatmap {'Activated' if state else 'Deactivated'}")
    return {"heatmap_mode": state}


# ── 6. Snapshot & CSV Data Export ─────────────────────────────────────────────
@router.get("/snapshot")
async def download_snapshot():
    """Downloads the current annotated frame as a high-resolution JPEG image."""
    frame = stream_engine.last_annotated_frame
    if frame is None:
        # Fallback: read a frame from the aerial video and process it
        cap = cv2.VideoCapture(AERIAL_VIDEO)
        ret, raw_frame = cap.read()
        cap.release()
        if ret and raw_frame is not None:
            raw_frame = cv2.resize(raw_frame, (960, 540))
            frame, _ = stream_engine.process_frame(raw_frame)
            stream_engine.last_annotated_frame = frame
        else:
            raise HTTPException(404, "No frame available yet")

    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not ok:
        raise HTTPException(500, "Encoding failed")

    filename = f"traffic_snapshot_{int(time.time())}.jpg"
    return Response(
        content=buf.tobytes(),
        media_type="image/jpeg",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export-csv")
async def export_telemetry_csv():
    """Exports all vehicle track telemetry logs to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp", "Track_ID", "Vehicle_Class", "Confidence",
        "Speed_KMH", "Direction", "License_Plate", "Violation_Status", "PCU_Weight"
    ])

    for row in stream_engine.session_telemetry:
        writer.writerow([
            row["timestamp"], row["track_id"], row["class_name"], row["confidence"],
            row["speed_kmh"], row["direction"], row["license_plate"], row["violation"], row["pcu_weight"]
        ])

    filename = f"traffic_telemetry_export_{int(time.time())}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
