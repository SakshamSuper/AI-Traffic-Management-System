import asyncio
import cv2
import numpy as np
import uuid
import random
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class CameraStream:
    camera_id: uuid.UUID
    rtsp_url: str
    cap: Optional[cv2.VideoCapture] = None
    is_running: bool = False
    frame_count: int = 0
    last_frame: Optional[np.ndarray] = None
    last_frame_time: Optional[datetime] = None
    error_count: int = 0
    reconnect_attempts: int = 0
    task: Optional[asyncio.Task] = None
    demo_mode: bool = False

class DemoVideoGenerator:
    def __init__(self, width=1280, height=720):
        self.width = width
        self.height = height

    def generate_frame(self) -> np.ndarray:
        frame = np.ones((self.height, self.width, 3), dtype=np.uint8) * 50
        # Draw road
        cv2.rectangle(frame, (0, self.height//2), (self.width, self.height), (100, 100, 100), -1)
        # Draw lane markings
        for i in range(0, self.width, 100):
            cv2.line(frame, (i, self.height//2), (i, self.height), (255, 255, 255), 2)
        
        # Add random cars
        for _ in range(random.randint(2, 6)):
            x = random.randint(0, self.width-50)
            y = random.randint(self.height//2, self.height-50)
            color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
            cv2.rectangle(frame, (x, y), (x+50, y+30), color, -1)
            
        return frame

class CameraManager:
    def __init__(self):
        self.streams: Dict[uuid.UUID, CameraStream] = {}
        self.demo_generator = DemoVideoGenerator()

    async def start(self):
        logger.info("Starting CameraManager")

    async def stop(self):
        for stream in self.streams.values():
            stream.is_running = False
            if stream.task:
                stream.task.cancel()
            if stream.cap:
                stream.cap.release()

    async def add_camera(self, camera_id: uuid.UUID, rtsp_url: str) -> bool:
        if camera_id in self.streams:
            return True
        stream = CameraStream(camera_id=camera_id, rtsp_url=rtsp_url)
        self.streams[camera_id] = stream
        stream.task = asyncio.create_task(self._stream_loop(stream))
        return True

    async def remove_camera(self, camera_id: uuid.UUID) -> bool:
        if camera_id in self.streams:
            stream = self.streams.pop(camera_id)
            stream.is_running = False
            if stream.task:
                stream.task.cancel()
            if stream.cap:
                stream.cap.release()
            return True
        return False

    async def get_frame(self, camera_id: uuid.UUID) -> Optional[np.ndarray]:
        stream = self.streams.get(camera_id)
        if stream and stream.last_frame is not None:
            return stream.last_frame
        return None

    async def get_camera_status(self, camera_id: uuid.UUID) -> str:
        stream = self.streams.get(camera_id)
        if not stream:
            return "not_found"
        if stream.is_running:
            return "online"
        return "offline"

    async def _stream_loop(self, stream: CameraStream):
        stream.is_running = True
        while stream.is_running:
            try:
                if stream.demo_mode:
                    stream.last_frame = self.demo_generator.generate_frame()
                    stream.last_frame_time = datetime.utcnow()
                    stream.frame_count += 1
                    await asyncio.sleep(1/30.0)
                else:
                    if stream.cap is None or not stream.cap.isOpened():
                        stream.cap = cv2.VideoCapture(stream.rtsp_url)
                    
                    ret, frame = stream.cap.read()
                    if ret:
                        stream.last_frame = frame
                        stream.last_frame_time = datetime.utcnow()
                        stream.frame_count += 1
                        await asyncio.sleep(1/30.0)
                    else:
                        stream.error_count += 1
                        stream.cap.release()
                        await asyncio.sleep(2.0)  # Reconnect backoff
            except Exception as e:
                logger.error(f"Error in stream loop for {stream.camera_id}: {e}")
                await asyncio.sleep(2.0)

    def get_active_cameras(self) -> List[uuid.UUID]:
        return [cid for cid, s in self.streams.items() if s.is_running]

    async def set_demo_mode(self, camera_id: uuid.UUID, enabled: bool):
        if camera_id in self.streams:
            self.streams[camera_id].demo_mode = enabled

camera_manager = CameraManager()
