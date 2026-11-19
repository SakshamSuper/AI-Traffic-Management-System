import asyncio
import uuid
import cv2
import base64
import logging
from typing import Dict, Any
from ..services.camera_manager import camera_manager
from ..services.ai_engine.detector import TrafficDetector
from ..services.ai_engine.tracker import ByteTracker
from ..services.ai_engine.lane_detector import LaneDetector
from ..services.ai_engine.speed_estimator import SpeedEstimator
from ..services.ai_engine.congestion_analyzer import CongestionAnalyzer
from ..services.signal_controller import signal_controller
from ..services.alert_service import alert_service

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self, camera_id: uuid.UUID, db_session_factory):
        self.camera_id = camera_id
        self.db_session_factory = db_session_factory
        self.is_running = False
        self.detector = TrafficDetector()
        self.tracker = ByteTracker()
        self.lane_detector = LaneDetector()
        self.speed_estimator = SpeedEstimator()
        self.analyzer = CongestionAnalyzer()
        self.task = None

    async def start(self):
        self.is_running = True
        await self.detector.initialize()
        self.task = asyncio.create_task(self._process_loop())
        logger.info(f"Started video processor for {self.camera_id}")

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()

    async def _process_loop(self):
        frame_counter = 0
        while self.is_running:
            try:
                frame = await camera_manager.get_frame(self.camera_id)
                if frame is None:
                    await asyncio.sleep(0.1)
                    continue

                detections = self.detector.detect(frame)
                tracks = self.tracker.update(detections)
                lanes = self.lane_detector.detect_lanes(frame)
                vehicle_counts = self.lane_detector.count_vehicles_per_lane(tracks, lanes)
                speeds = self.speed_estimator.estimate_speeds(tracks)
                metrics = self.analyzer.analyze(tracks, speeds, lanes, frame.shape[:2])

                frame_counter += 1
                if frame_counter % 30 == 0:
                    await self._save_detection(metrics)
                    # Use a dummy redis instance or handle properly
                    await alert_service.auto_generate_alerts(None, None, str(self.camera_id), metrics)

                await signal_controller.update_metrics(self.camera_id, metrics)
                
                # Encode and publish
                # b64_frame = await self._encode_frame(frame, detections, tracks)

                await asyncio.sleep(1/30.0)
            except Exception as e:
                logger.error(f"Error in video processor {self.camera_id}: {e}")
                await asyncio.sleep(1)

    async def _encode_frame(self, frame, detections, tracks) -> str:
        # Draw annotations and encode
        out = self.detector.draw_detections(frame, detections)
        _, buffer = cv2.imencode('.jpg', out)
        return base64.b64encode(buffer).decode('utf-8')

    async def _save_detection(self, metrics):
        pass

class ProcessorManager:
    def __init__(self):
        self.processors: Dict[uuid.UUID, VideoProcessor] = {}

    async def start_processor(self, camera_id: uuid.UUID):
        if camera_id not in self.processors:
            p = VideoProcessor(camera_id, None)
            self.processors[camera_id] = p
            await p.start()

    async def stop_processor(self, camera_id: uuid.UUID):
        if camera_id in self.processors:
            p = self.processors.pop(camera_id)
            await p.stop()

    async def get_stats(self) -> Dict:
        return {"active_processors": len(self.processors)}

processor_manager = ProcessorManager()
