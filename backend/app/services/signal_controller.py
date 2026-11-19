import asyncio
import uuid
import logging
from enum import Enum
from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel
from .ai_engine.congestion_analyzer import TrafficMetrics

logger = logging.getLogger(__name__)

class SignalPhase(Enum):
    GREEN = 'green'
    YELLOW = 'yellow'
    RED = 'red'
    EMERGENCY = 'emergency'

class SignalState(BaseModel):
    camera_id: str
    phase: SignalPhase
    time_remaining: int
    is_overridden: bool
    last_updated: datetime

class SignalOptimization(BaseModel):
    recommended_phase: SignalPhase
    duration: int
    reason: str

class SignalConfig:
    min_green: int = 15
    max_green: int = 90
    yellow_duration: int = 4
    red_clearance: int = 2
    cycle_length: int = 120
    emergency_hold: int = 60

class AdaptiveSignalController:
    def __init__(self):
        self.configs = {}
        self.states: Dict[str, SignalState] = {}
        self.metrics_cache: Dict[str, TrafficMetrics] = {}
        self.is_running = False
        self.tasks: Dict[str, asyncio.Task] = {}

    async def start(self):
        self.is_running = True
        logger.info("Adaptive Signal Controller started.")

    async def stop(self):
        self.is_running = False
        for task in self.tasks.values():
            task.cancel()
        logger.info("Adaptive Signal Controller stopped.")

    async def update_metrics(self, camera_id: uuid.UUID, metrics: TrafficMetrics):
        cid = str(camera_id)
        self.metrics_cache[cid] = metrics
        if cid not in self.tasks and self.is_running:
            self.states[cid] = SignalState(camera_id=cid, phase=SignalPhase.RED, time_remaining=0, is_overridden=False, last_updated=datetime.utcnow())
            self.tasks[cid] = asyncio.create_task(self._phase_timer_loop(cid))

    async def get_signal_state(self, camera_id: uuid.UUID) -> Optional[SignalState]:
        return self.states.get(str(camera_id))

    async def optimize_phase(self, camera_id: uuid.UUID) -> SignalOptimization:
        cid = str(camera_id)
        metrics = self.metrics_cache.get(cid)
        if not metrics:
            return SignalOptimization(recommended_phase=SignalPhase.RED, duration=SignalConfig.min_green, reason="No data")
        
        opt_green = self._calculate_optimal_green(metrics)
        return SignalOptimization(recommended_phase=SignalPhase.GREEN, duration=opt_green, reason="Optimized based on metrics")

    async def handle_emergency(self, camera_id: uuid.UUID, emergency_type: str):
        cid = str(camera_id)
        if cid in self.states:
            self.states[cid].phase = SignalPhase.EMERGENCY
            self.states[cid].time_remaining = SignalConfig.emergency_hold
            self.states[cid].is_overridden = True
            await self._publish_signal_state(cid, self.states[cid])

    async def release_emergency(self, camera_id: uuid.UUID):
        cid = str(camera_id)
        if cid in self.states:
            self.states[cid].is_overridden = False
            self.states[cid].phase = SignalPhase.RED
            self.states[cid].time_remaining = SignalConfig.red_clearance

    async def manual_override(self, camera_id: uuid.UUID, phase: SignalPhase, duration: int, user_id: str):
        cid = str(camera_id)
        if cid in self.states:
            self.states[cid].phase = phase
            self.states[cid].time_remaining = duration
            self.states[cid].is_overridden = True
            await self._publish_signal_state(cid, self.states[cid])

    async def release_override(self, camera_id: uuid.UUID):
        cid = str(camera_id)
        if cid in self.states:
            self.states[cid].is_overridden = False

    def _calculate_optimal_green(self, metrics: TrafficMetrics) -> int:
        green = SignalConfig.min_green
        if metrics.congestion_score > 70:
            green = int(green * 1.2)
        if metrics.queue_length > 0.8:
            green = SignalConfig.max_green
        if metrics.avg_speed > 30 and metrics.density < 0.3:
            green = SignalConfig.min_green
        return min(SignalConfig.max_green, max(SignalConfig.min_green, green))

    async def _phase_timer_loop(self, camera_id: str):
        while self.is_running:
            state = self.states.get(camera_id)
            if not state:
                await asyncio.sleep(1)
                continue

            if state.is_overridden:
                if state.time_remaining > 0:
                    state.time_remaining -= 1
                else:
                    state.is_overridden = False
            else:
                if state.time_remaining <= 0:
                    if state.phase == SignalPhase.RED:
                        opt = await self.optimize_phase(uuid.UUID(camera_id))
                        state.phase = SignalPhase.GREEN
                        state.time_remaining = opt.duration
                    elif state.phase == SignalPhase.GREEN:
                        state.phase = SignalPhase.YELLOW
                        state.time_remaining = SignalConfig.yellow_duration
                    elif state.phase == SignalPhase.YELLOW:
                        state.phase = SignalPhase.RED
                        state.time_remaining = SignalConfig.red_clearance

                state.time_remaining -= 1
            
            state.last_updated = datetime.utcnow()
            await self._publish_signal_state(camera_id, state)
            await asyncio.sleep(1)

    async def _publish_signal_state(self, camera_id: str, state: SignalState):
        pass # To be integrated with Redis

signal_controller = AdaptiveSignalController()
