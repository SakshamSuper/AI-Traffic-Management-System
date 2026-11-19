"""
Professional Webster's-based Adaptive Signal Timing Engine
Uses vehicle type PCU weights, saturation flow, and degree of saturation
to compute optimal green time per Webster's (1958) optimal cycle formula.

Vehicle Class PCU Weights (Passenger Car Units):
  car/taxi      = 1.0  (baseline)
  auto_rickshaw = 0.8  (smaller footprint, slower)
  motorcycle    = 0.5  (very small footprint)
  bus           = 3.0  (high PCU, takes 3 car lengths)
  truck         = 2.5
  ambulance     = EMERGENCY PREEMPTION (override)
  bicycle       = 0.3
  person        = 0.1
"""

import math
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)

# ── PCU (Passenger Car Unit) weights per vehicle class ──────────────────────
PCU_WEIGHTS: Dict[str, float] = {
    "car":            1.0,
    "taxi":           1.0,
    "auto_rickshaw":  0.8,
    "motorcycle":     0.5,
    "bicycle":        0.3,
    "bus":            3.0,
    "truck":          2.5,
    "van":            1.5,
    "person":         0.1,
    "ambulance":      0.0,   # handled via emergency preemption
    "police_car":     0.0,
    "fire_truck":     0.0,
}

# ── Saturation flow rate (PCU per hour per lane) ─────────────────────────────
# Standard Indian roads: 1800 PCU/hr/lane
SATURATION_FLOW_PCU_PER_HOUR = 1800.0
LANES_PER_APPROACH = 2        # assume 2 lanes per approach
TOTAL_SATURATION_FLOW = SATURATION_FLOW_PCU_PER_HOUR * LANES_PER_APPROACH  # 3600 PCU/hr

# ── Phase limits ──────────────────────────────────────────────────────────────
MIN_GREEN  = 15   # seconds (pedestrian safety minimum)
MAX_GREEN  = 120  # seconds (driver frustration limit)
YELLOW     = 4    # seconds (universal)
ALL_RED    = 2    # seconds (clearance)
EMERGENCY_EXTENSION = 60  # seconds of green held for emergency vehicle


class SignalPhase(Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    EMERGENCY = "emergency"


@dataclass
class TimingDecision:
    """Output of the signal timing engine for one cycle."""
    green_duration: int          # seconds
    red_duration: int            # seconds (others get green while this phase is red)
    yellow_duration: int         # always YELLOW constant
    all_red_duration: int        # always ALL_RED constant
    cycle_length: int            # total cycle seconds
    pcu_load: float              # total PCU on approach (0..∞)
    saturation_degree: float     # y = flow/saturation (0..1)
    congestion_score: float      # 0..100
    is_emergency: bool
    emergency_type: Optional[str]
    reasoning: str               # human-readable explanation
    # Breakdown
    vehicle_counts: Dict[str, int] = field(default_factory=dict)
    weighted_pcu: Dict[str, float] = field(default_factory=dict)


class WebsterSignalTimingEngine:
    """
    Implements Webster's (1958) optimal cycle length formula for
    adaptive signal control in Indian mixed-traffic conditions.

    C_opt = (1.5 * L + 5) / (1 - ΣYi)

    Where:
      L   = total lost time per cycle (startup + clearance losses, ~2s/phase)
      Yi  = qi / Si  (demand flow / saturation flow per approach)

    Green split for phase i:
      g_i = (C_opt - L) * Yi / ΣYi
    """

    def __init__(
        self,
        num_phases: int = 1,          # 1 = single-approach simplified (camera view)
        lost_time_per_phase: int = 3,  # seconds of startup + clearance loss
    ):
        self.num_phases = num_phases
        self.lost_time_per_phase = lost_time_per_phase
        self.total_lost_time = num_phases * lost_time_per_phase

    def compute(
        self,
        vehicle_counts: Dict[str, int],
        frame_area_px: int = 640 * 360,
        observation_period_s: float = 10.0,
    ) -> TimingDecision:
        """
        Main entry point: given YOLO vehicle counts, compute optimal signal timing.

        Args:
            vehicle_counts: e.g. {"car": 12, "bus": 2, "motorcycle": 5}
            frame_area_px: pixel area of the observed frame (for density calculation)
            observation_period_s: seconds over which counts were observed
        """

        # ── 1. Check for emergency vehicles ──────────────────────────────────
        emergency_types = [k for k in vehicle_counts if k in {"ambulance", "police_car", "fire_truck"} and vehicle_counts[k] > 0]
        is_emergency = len(emergency_types) > 0
        emergency_type = emergency_types[0] if is_emergency else None

        if is_emergency:
            return self._emergency_decision(vehicle_counts, emergency_type)

        # ── 2. Compute PCU-weighted flow ──────────────────────────────────────
        weighted_pcu: Dict[str, float] = {}
        total_pcu = 0.0
        for cls_name, count in vehicle_counts.items():
            pcu = PCU_WEIGHTS.get(cls_name, 1.0)
            weighted_pcu[cls_name] = round(pcu * count, 2)
            total_pcu += pcu * count

        # ── 3. Convert count to hourly flow rate ──────────────────────────────
        # vehicles observed in `observation_period_s` → extrapolate to 1 hour
        hourly_flow_pcu = (total_pcu / max(observation_period_s, 1.0)) * 3600.0

        # ── 4. Degree of Saturation (y = q/S) ─────────────────────────────────
        saturation_degree = min(0.98, hourly_flow_pcu / TOTAL_SATURATION_FLOW)

        # ── 5. Webster's Optimal Cycle Length ────────────────────────────────
        L = self.total_lost_time
        sigma_y = saturation_degree  # for single approach
        if sigma_y >= 1.0:
            sigma_y = 0.95   # cap to avoid division by zero (oversaturation)

        C_opt = (1.5 * L + 5) / (1.0 - sigma_y)
        C_opt = max(MIN_GREEN + YELLOW + ALL_RED, min(300, C_opt))  # practical bounds

        # ── 6. Effective green time for this phase ────────────────────────────
        effective_green = C_opt - L
        # For single approach: full effective green goes to this phase
        g_i = effective_green * sigma_y / max(sigma_y, 0.001)  # simplified single-phase
        g_i = max(MIN_GREEN, min(MAX_GREEN, g_i))
        green_duration = int(round(g_i))

        # Red = rest of cycle minus our green minus yellow minus all-red
        cycle_length = int(round(C_opt))
        red_duration = max(MIN_GREEN, cycle_length - green_duration - YELLOW - ALL_RED)

        # ── 7. Congestion Score (0–100) ───────────────────────────────────────
        congestion_score = self._compute_congestion_score(
            total_pcu=total_pcu,
            saturation_degree=saturation_degree,
        )

        # ── 8. Build human-readable reasoning ────────────────────────────────
        total_vehicles = sum(v for k, v in vehicle_counts.items() if k not in {"ambulance", "police_car", "fire_truck"})
        reasoning = (
            f"Webster Optimal Cycle: {cycle_length}s | "
            f"Total PCU Load: {total_pcu:.1f} | "
            f"Saturation Degree: {saturation_degree:.2%} | "
            f"Hourly Flow: {hourly_flow_pcu:.0f} PCU/hr | "
            f"→ Allotted Green: {green_duration}s, Red: {red_duration}s"
        )

        logger.info(f"[Webster] {total_vehicles} vehicles → green={green_duration}s red={red_duration}s cycle={cycle_length}s (y={saturation_degree:.2f})")

        return TimingDecision(
            green_duration=green_duration,
            red_duration=red_duration,
            yellow_duration=YELLOW,
            all_red_duration=ALL_RED,
            cycle_length=cycle_length,
            pcu_load=round(total_pcu, 2),
            saturation_degree=round(saturation_degree, 4),
            congestion_score=round(congestion_score, 1),
            is_emergency=False,
            emergency_type=None,
            reasoning=reasoning,
            vehicle_counts=vehicle_counts,
            weighted_pcu=weighted_pcu,
        )

    def _emergency_decision(self, vehicle_counts: Dict[str, int], emergency_type: str) -> TimingDecision:
        """
        Emergency preemption: hold GREEN for EMERGENCY_EXTENSION seconds.
        Cross-street signals are held RED.
        """
        reasoning = (
            f"🚨 EMERGENCY PREEMPTION — {emergency_type.upper()} detected. "
            f"Immediate GREEN extended to {EMERGENCY_EXTENSION}s. "
            f"All crossing phases HELD RED."
        )
        return TimingDecision(
            green_duration=EMERGENCY_EXTENSION,
            red_duration=EMERGENCY_EXTENSION + ALL_RED,
            yellow_duration=0,
            all_red_duration=ALL_RED,
            cycle_length=EMERGENCY_EXTENSION + ALL_RED,
            pcu_load=0.0,
            saturation_degree=0.0,
            congestion_score=100.0,
            is_emergency=True,
            emergency_type=emergency_type,
            reasoning=reasoning,
            vehicle_counts=vehicle_counts,
            weighted_pcu={},
        )

    def _compute_congestion_score(self, total_pcu: float, saturation_degree: float) -> float:
        """
        Composite score (0–100):
          40% from PCU load (normalized against threshold of 30 PCU)
          60% from saturation degree
        """
        pcu_factor = min(1.0, total_pcu / 30.0)
        score = (0.4 * pcu_factor + 0.6 * saturation_degree) * 100.0
        return min(100.0, max(0.0, score))


# ── Singleton ─────────────────────────────────────────────────────────────────
timing_engine = WebsterSignalTimingEngine(num_phases=1, lost_time_per_phase=3)
