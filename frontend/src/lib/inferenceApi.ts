/**
 * Inference API Client
 * Sends frames to the backend YOLOv11 inference pipeline and returns
 * real bounding boxes + Webster's signal timing decisions.
 */

export interface BoundingBoxResult {
  track_id: number;
  class_name: string;
  confidence: number;
  bbox_px: [number, number, number, number];    // [x1, y1, x2, y2] in pixels
  bbox_pct: [number, number, number, number];   // [left%, top%, width%, height%]
  pcu_weight: number;
  speed_kmh: number | null;
}

export interface TimingResult {
  green_duration: number;
  red_duration: number;
  yellow_duration: number;
  cycle_length: number;
  pcu_load: number;
  saturation_degree: number;
  congestion_score: number;
  is_emergency: boolean;
  emergency_type: string | null;
  reasoning: string;
  vehicle_counts: Record<string, number>;
  weighted_pcu: Record<string, number>;
}

export interface FrameMetrics {
  total_vehicles: number;
  pedestrian_count: number;
  density: number;
  occupancy: number;
  avg_speed_kmh: number;
  congestion_score: number;
  congestion_level: string;
  emergency_detected: boolean;
  emergency_type: string | null;
  vehicle_counts: Record<string, number>;
}

export interface FrameAnalysisResponse {
  camera_id: string;
  frame_id: number;
  inference_ms: number;
  total_detected: number;
  detections: BoundingBoxResult[];
  metrics: FrameMetrics;
  timing: TimingResult;
}

/**
 * Capture a video/canvas frame as base64 JPEG and send to backend for YOLO inference.
 */
export async function analyzeFrame(
  videoOrCanvas: HTMLVideoElement | HTMLCanvasElement,
  cameraId: string = 'webcam',
  observationPeriodS: number = 1.0,
  targetWidth: number = 640,
  targetHeight: number = 360,
): Promise<FrameAnalysisResponse | null> {
  try {
    // 1. Draw the current video frame to an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (videoOrCanvas instanceof HTMLVideoElement) {
      ctx.drawImage(videoOrCanvas, 0, 0, targetWidth, targetHeight);
    } else {
      ctx.drawImage(videoOrCanvas, 0, 0, targetWidth, targetHeight);
    }

    // 2. Export as base64 JPEG (quality 0.75 = good trade-off for bandwidth)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    const base64 = dataUrl.split(',')[1];

    // 3. POST to backend inference endpoint
    const res = await fetch('/api/v1/inference/analyze-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frame_b64: base64,
        camera_id: cameraId,
        frame_width: targetWidth,
        frame_height: targetHeight,
        observation_period_s: observationPeriodS,
      }),
    });

    if (!res.ok) {
      console.error('[InferenceAPI] Error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as FrameAnalysisResponse;
  } catch (err) {
    console.error('[InferenceAPI] Failed to analyze frame:', err);
    return null;
  }
}

/** Vehicle class display config */
export const VEHICLE_COLORS: Record<string, string> = {
  car:            '#22c55e',
  taxi:           '#84cc16',
  auto_rickshaw:  '#eab308',
  motorcycle:     '#a855f7',
  bicycle:        '#06b6d4',
  bus:            '#3b82f6',
  truck:          '#f97316',
  van:            '#64748b',
  person:         '#e2e8f0',
  ambulance:      '#ef4444',
  police_car:     '#ef4444',
  fire_truck:     '#dc2626',
};

export const VEHICLE_LABELS: Record<string, string> = {
  car:            'Car',
  taxi:           'Taxi',
  auto_rickshaw:  'Auto-Rickshaw',
  motorcycle:     'Motorcycle',
  bicycle:        'Bicycle',
  bus:            'Bus',
  truck:          'Truck',
  van:            'Van',
  person:         'Pedestrian',
  ambulance:      '🚨 Ambulance',
  police_car:     '🚨 Police',
  fire_truck:     '🚨 Fire Truck',
};
