import pytest
import numpy as np
from app.services.signal_timing_engine import WebsterSignalTimingEngine, PCU_WEIGHTS, MIN_GREEN, MAX_GREEN
from app.services.ai_engine.congestion_analyzer import CongestionAnalyzer, CongestionLevel
from app.services.ai_engine.speed_estimator import SpeedEstimator
from app.services.ai_engine.lane_detector import LaneDetector, Lane
from app.services.ai_engine.tracker import Track, TrackState

def make_test_track(track_id=1, class_name="car", bbox=None, confidence=0.9, history=None):
    if bbox is None:
        bbox = [100.0, 100.0, 150.0, 150.0]
    return Track(
        track_id=track_id,
        class_name=class_name,
        bbox=bbox,
        confidence=confidence,
        state=TrackState.Confirmed,
        age=5,
        hits=5,
        time_since_update=0,
        velocity=(0.0, 0.0),
        history=history or []
    )

def test_webster_pcu_weights():
    """Verify PCU weight mapping for mixed traffic classes."""
    assert PCU_WEIGHTS["car"] == 1.0
    assert PCU_WEIGHTS["bus"] == 3.0
    assert PCU_WEIGHTS["motorcycle"] == 0.5
    assert PCU_WEIGHTS["auto_rickshaw"] == 0.8
    assert PCU_WEIGHTS["ambulance"] == 0.0

def test_webster_normal_timing():
    """Verify normal traffic computes bounded optimal green time within [MIN_GREEN, MAX_GREEN]."""
    engine = WebsterSignalTimingEngine(num_phases=1)
    counts = {"car": 10, "bus": 2, "motorcycle": 8}
    decision = engine.compute(counts)
    
    assert decision.green_duration >= MIN_GREEN
    assert decision.green_duration <= MAX_GREEN
    assert not decision.is_emergency
    assert decision.emergency_type is None
    assert decision.pcu_load > 0

def test_webster_emergency_preemption():
    """Verify emergency vehicles immediately trigger emergency green preemption."""
    engine = WebsterSignalTimingEngine(num_phases=1)
    counts = {"car": 15, "ambulance": 1}
    decision = engine.compute(counts)
    
    assert decision.is_emergency is True
    assert decision.emergency_type == "ambulance"
    assert decision.green_duration >= 60

def test_webster_heavy_traffic_capping():
    """Verify high congestion saturates green time without exceeding MAX_GREEN."""
    engine = WebsterSignalTimingEngine(num_phases=1)
    counts = {"car": 150, "bus": 20, "truck": 30}
    decision = engine.compute(counts)
    
    assert decision.green_duration <= MAX_GREEN
    assert decision.congestion_score > 60

def test_speed_estimator_calculation():
    """Verify pixel displacement converts correctly to km/h based on fps and calibration."""
    estimator = SpeedEstimator(pixels_per_meter=10.0, fps=30.0)
    
    track = make_test_track(track_id=1, bbox=[100.0, 100.0, 150.0, 150.0], history=[(100.0, 100.0), (100.0, 120.0)])
    # 20 px / 10 px/m = 2m per frame. 2m * 30 fps = 60 m/s = 216 km/h
    speed = estimator.update_track(track)
    assert speed is not None
    assert abs(speed - 216.0) < 1e-2

def test_speed_estimator_stationary():
    """Verify zero displacement returns 0 km/h."""
    estimator = SpeedEstimator(pixels_per_meter=10.0, fps=30.0)
    track = make_test_track(track_id=2, bbox=[50.0, 50.0, 80.0, 80.0], history=[(50.0, 50.0), (50.0, 50.0)])
    speed = estimator.update_track(track)
    assert speed == 0.0

def test_speed_percentiles():
    """Verify percentiles calculation."""
    estimator = SpeedEstimator()
    speeds = {1: 20.0, 2: 40.0, 3: 60.0, 4: 80.0, 5: 100.0}
    percentiles = estimator.calculate_speed_percentiles(speeds)
    assert percentiles["p50"] == 60.0
    assert percentiles["p85"] > 60.0

def test_congestion_analyzer_free_flow():
    """Verify low density and high speed produces FREE_FLOW level."""
    analyzer = CongestionAnalyzer()
    tracks = [
        make_test_track(track_id=1, bbox=[10.0, 10.0, 30.0, 30.0])
    ]
    speeds = {1: 75.0}
    lanes = []
    metrics = analyzer.analyze(tracks, speeds, lanes, frame_shape=(720, 1280))
    
    assert metrics.total_vehicles == 1
    assert metrics.congestion_level in [CongestionLevel.FREE_FLOW, CongestionLevel.LIGHT]
    assert metrics.congestion_score < 40

def test_congestion_analyzer_standstill():
    """Verify high vehicle count with 0 speed produces high congestion."""
    analyzer = CongestionAnalyzer()
    tracks = [
        make_test_track(track_id=i, bbox=[float(i*10), 100.0, float(i*10+40), 200.0])
        for i in range(45)
    ]
    speeds = {i: 0.0 for i in range(45)}
    lanes = []
    metrics = analyzer.analyze(tracks, speeds, lanes, frame_shape=(720, 1280))
    
    assert metrics.total_vehicles == 45
    assert metrics.congestion_score > 60
    assert metrics.congestion_level in [CongestionLevel.HEAVY, CongestionLevel.STANDSTILL]

def test_lane_detector_configuration():
    """Verify manual lane zone configuration."""
    detector = LaneDetector()
    lanes_cfg = [
        {
            "id": 1,
            "points": [(0, 0), (100, 100)],
            "direction": "incoming",
            "max_capacity": 15,
            "roi_points": [(0, 0), (200, 0), (200, 200), (0, 200)]
        }
    ]
    detector.configure_lanes_manual(lanes_cfg)
    assert len(detector.lanes) == 1
    assert detector.lanes[0].max_capacity == 15
    assert detector.lanes[0].direction == "incoming"

def test_lane_detector_vehicle_counting():
    """Verify point-in-polygon counting logic."""
    detector = LaneDetector()
    detector.configure_lanes_manual([
        {
            "id": 101,
            "points": [(0, 0), (100, 100)],
            "direction": "incoming",
            "max_capacity": 10,
            "roi_points": [(0, 0), (300, 0), (300, 300), (0, 300)]
        }
    ])
    # Track inside [0, 300] polygon
    inside_track = make_test_track(track_id=1, bbox=[50.0, 50.0, 100.0, 100.0])
    counts = detector.count_vehicles_per_lane([inside_track], detector.lanes)
    assert counts[101] == 1

def test_speed_estimator_calibration():
    """Verify calibrate dynamically updates pixels_per_meter."""
    estimator = SpeedEstimator(pixels_per_meter=10.0)
    estimator.calibrate(reference_distance_m=5.0, reference_distance_px=100.0)
    assert estimator.pixels_per_meter == 20.0

def test_webster_saturation_flow_metrics():
    """Verify saturation flow calculations and reasoning string output."""
    engine = WebsterSignalTimingEngine(num_phases=1)
    counts = {"car": 25, "bus": 5, "motorcycle": 10}
    decision = engine.compute(counts)
    
    assert decision.cycle_length > 0
    assert len(decision.reasoning) > 0
    assert "PCU" in decision.reasoning or "Webster" in decision.reasoning or "saturation" in decision.reasoning.lower()
