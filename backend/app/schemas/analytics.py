from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import enum

class AggregationPeriod(str, enum.Enum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

class TimeRange(BaseModel):
    start_time: datetime
    end_time: datetime

class VehicleTypeBreakdown(BaseModel):
    type: str
    count: int
    percentage: float

class SpeedStats(BaseModel):
    average_speed: float
    max_speed: float
    min_speed: float
    speed_percentile_85: float

class HourlyStats(BaseModel):
    hour: datetime
    total_vehicles: int
    avg_congestion: float
    alerts_count: int

class DailyStats(BaseModel):
    date: datetime
    total_vehicles: int
    peak_hour: datetime
    avg_congestion: float
    alerts_count: int

class TrafficSummary(BaseModel):
    period: TimeRange
    total_vehicles_processed: int
    average_congestion_score: float
    total_alerts: int
    vehicle_breakdown: List[VehicleTypeBreakdown]
    speed_statistics: Optional[SpeedStats] = None
    hourly_trend: List[HourlyStats] = []
    daily_trend: List[DailyStats] = []

class CongestionHeatmapData(BaseModel):
    camera_id: str
    location: str
    coordinates: Optional[Dict[str, float]] = None # lat/lng
    congestion_score: float

class ReportRequest(BaseModel):
    period: AggregationPeriod
    start_time: datetime
    end_time: datetime
    camera_ids: Optional[List[str]] = None

class ReportResponse(BaseModel):
    report_id: str
    generated_at: datetime
    summary: TrafficSummary
    heatmap: List[CongestionHeatmapData]
