export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  rtsp_url?: string;
  status: 'online' | 'offline' | 'error' | 'connecting';
  is_active: boolean;
  fps: number;
  resolution_width: number;
  resolution_height: number;
  zone_config?: ZoneConfig;
  created_at: string;
}

export interface ZoneConfig {
  lanes: Lane[];
  roi_points: Point[];
}

export interface Lane {
  id: number;
  name: string;
  direction: 'incoming' | 'outgoing' | 'both';
  capacity: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Detection {
  track_id: number;
  class_name: string;
  confidence: number;
  bbox: number[];
  speed?: number;
}

export interface TrafficMetrics {
  camera_id: string;
  vehicle_counts: Record<string, number>;
  total_vehicles: number;
  pedestrian_count: number;
  queue_length: number;
  density: number;
  occupancy: number;
  avg_speed: number;
  congestion_score: number;
  congestion_level: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'standstill';
  emergency_detected: boolean;
  emergency_type?: string;
  timestamp: string;
}

export interface SignalState {
  camera_id: string;
  intersection_name: string;
  current_phase: 'green' | 'yellow' | 'red' | 'emergency';
  phase_duration: number;
  next_phase_at: string;
  is_manual_override: boolean;
  emergency_preemption: boolean;
}

export interface Alert {
  id: string;
  camera_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  is_acknowledged: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: string;
  camera_id?: string;
}

export interface DashboardData {
  total_cameras: number;
  online_cameras: number;
  total_vehicles_today: number;
  avg_congestion_score: number;
  active_alerts: number;
  active_emergencies: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface HeatmapCell {
  camera_id: string;
  camera_name: string;
  hour: number;
  congestion_score: number;
}
