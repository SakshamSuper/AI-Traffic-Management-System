# REST API & WebSocket Protocol Specification

## 1. Overview & Authentication

The **AI Smart Traffic Management System** exposes a unified, high-throughput asynchronous REST API alongside real-time WebSocket channels.

- **Base URL (Local)**: `http://localhost:8000/api/v1`
- **Interactive Swagger Documentation**: `http://localhost:8000/api/docs`
- **Interactive ReDoc Documentation**: `http://localhost:8000/api/redoc`
- **WebSocket Gateway**: `ws://localhost:8000/ws`

### Authentication Scheme
Protected endpoints require an `Authorization` header containing an active JWT bearer token:
```http
Authorization: Bearer <your_access_token>
```

Tokens are obtained by authenticating against `/api/v1/auth/login`.

---

## 2. Authentication & User Management

### `POST /api/v1/auth/login`
Authenticates user credentials and issues an access token and refresh token.

**Request Body (`application/json`)**:
```json
{
  "username": "admin",
  "password": "adminpassword123"
}
```

**Response (`200 OK`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@traffic-ai.com",
    "role": "admin"
  }
}
```

**Example `curl`**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"adminpassword123"}'
```

---

### `GET /api/v1/auth/me`
Retrieves identity and permissions for the currently authenticated principal.

**Response (`200 OK`)**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@traffic-ai.com",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-11-15T10:00:00Z"
}
```

---

## 3. Camera Management & Video Feeds

### `GET /api/v1/cameras`
Lists all provisioned cameras with status, location, and resolution metadata.

**Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "name": "AIIMS Intersection - Approach North",
    "location": "Ring Road, New Delhi",
    "rtsp_url": "rtsp://camera-aiims.traffic.local:554/live",
    "status": "active",
    "fps": 25,
    "width": 1920,
    "height": 1080,
    "current_congestion_level": "moderate",
    "total_vehicles_present": 28
  }
]
```

---

### `POST /api/v1/cameras`
Registers a new RTSP camera feed or test video stream. Requires `admin` or `operator` role.

**Request Body (`application/json`)**:
```json
{
  "name": "Connaught Place Radial 1",
  "location": "Inner Circle, New Delhi",
  "rtsp_url": "rtsp://192.168.1.120:554/stream1",
  "fps": 30,
  "roi_polygon": [
    [100, 200], [800, 200], [950, 700], [50, 700]
  ]
}
```

---

### `GET /api/v1/stream/{camera_id}/mjpeg`
Streams real-time annotated video output formatted as `multipart/x-mixed-replace; boundary=frame`. Directly mountable inside standard HTML `<img>` elements.

**Example HTML Embedding**:
```html
<img src="http://localhost:8000/api/v1/stream/1/mjpeg" alt="Live AIIMS Stream" />
```

---

## 4. Signal Intelligence & Preemption Control

### `GET /api/v1/signals`
Returns real-time status of all managed traffic signals, current phase, and remaining countdown time.

**Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "camera_id": 1,
    "intersection_name": "AIIMS Flyover Junction",
    "current_phase": "green",
    "remaining_seconds": 38,
    "cycle_length": 90,
    "is_manual_override": false,
    "emergency_preempted": false,
    "optimal_pcu_load": 42.5
  }
]
```

---

### `POST /api/v1/signals/{camera_id}/emergency`
Triggers immediate priority clearance for an oncoming emergency vehicle (ambulance, fire, police). Sets phase to `emergency` green for 60 seconds and forces cross-traffic to `all_red`.

**Request Body (`application/json`)**:
```json
{
  "emergency_type": "ambulance",
  "duration_seconds": 60,
  "reason": "Ambulance en route to AIIMS Trauma Centre"
}
```

**Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Emergency preemption active",
  "phase": "emergency",
  "cleared_approach": "Approach North",
  "duration_seconds": 60,
  "timestamp": "2026-11-19T14:38:00Z"
}
```

---

### `POST /api/v1/signals/{camera_id}/override`
Allows traffic operators to manually hold a phase or toggle green/red manually.

**Request Body (`application/json`)**:
```json
{
  "phase": "green",
  "duration_seconds": 45,
  "reason": "VIP motorcade transit"
}
```

---

## 5. Traffic Telemetry & Analytics

### `GET /api/v1/analytics/overview`
Aggregated system-wide telemetry across all connected intersections.

**Response (`200 OK`)**:
```json
{
  "total_active_cameras": 4,
  "system_status": "operational",
  "total_vehicles_tracked": 1284,
  "average_speed_kmh": 41.8,
  "average_congestion_score": 38.4,
  "active_incidents": 1,
  "active_emergency_preemptions": 0
}
```

---

### `GET /api/v1/analytics/congestion?timeframe=24h`
Historical congestion score distribution for charting and trend analysis.

**Response (`200 OK`)**:
```json
{
  "timeframe": "24h",
  "data_points": [
    { "timestamp": "2026-11-19T08:00:00Z", "score": 72.1, "level": "heavy" },
    { "timestamp": "2026-11-19T09:00:00Z", "score": 84.5, "level": "standstill" },
    { "timestamp": "2026-11-19T10:00:00Z", "score": 58.2, "level": "moderate" }
  ]
}
```

---

## 6. Real-Time WebSocket Protocols

### Channel 1: `/ws/traffic/{camera_id}`
Pushes real-time bounding boxes, vehicle classifications, speeds, and lane counts at 10 Hz.

**Sample Message Payload**:
```json
{
  "type": "telemetry",
  "camera_id": 1,
  "timestamp": "2026-11-19T14:38:30.120Z",
  "metrics": {
    "total_vehicles": 34,
    "avg_speed_kmh": 36.4,
    "congestion_score": 48.2,
    "congestion_level": "moderate",
    "queue_length_ratio": 0.32,
    "density_ratio": 0.41
  },
  "vehicle_breakdown": {
    "car": 18,
    "bus": 3,
    "motorcycle": 8,
    "auto_rickshaw": 4,
    "truck": 1
  },
  "lane_counts": {
    "lane_1": 12,
    "lane_2": 14,
    "lane_3": 8
  },
  "detections": [
    {
      "track_id": 412,
      "class": "car",
      "confidence": 0.94,
      "bbox": [240, 180, 360, 280],
      "speed_kmh": 42.1
    }
  ]
}
```

---

### Channel 2: `/ws/signals`
Broadcasts live traffic light state changes and millisecond-accurate countdowns.

**Sample Message Payload**:
```json
{
  "type": "signal_update",
  "camera_id": 1,
  "intersection": "AIIMS Intersection",
  "phase": "green",
  "remaining_seconds": 24,
  "cycle_length": 75,
  "emergency_active": false
}
```

---

### Channel 3: `/ws/alerts`
Instant high-priority alerts broadcast when emergency vehicles, severe blockages, or wrong-way drivers are perceived.

**Sample Message Payload**:
```json
{
  "type": "alert_triggered",
  "alert_id": 98,
  "camera_id": 2,
  "severity": "critical",
  "title": "Emergency Vehicle Preemption Engaged",
  "description": "Ambulance detected on Approach South (Track ID: 881). Signal #2 forced to GREEN.",
  "timestamp": "2026-11-19T14:38:45Z"
}
```

---

## 7. HTTP Status Code Conventions

| Status Code | Meaning | Context |
|---|---|---|
| `200 OK` | Request Succeeded | Normal query/fetch execution |
| `201 Created` | Resource Created | New camera, lane, or user created |
| `400 Bad Request` | Invalid Input | Malformed coordinate list or invalid parameters |
| `401 Unauthorized` | Missing / Invalid Token | Bearer token expired or missing |
| `403 Forbidden` | Insufficient Role | Action requires operator or admin role |
| `404 Not Found` | Entity Missing | Camera ID or Alert ID does not exist |
| `422 Unprocessable` | Schema Validation Failure | Pydantic model contract validation failed |
| `500 Server Error` | Internal Failure | Unhandled backend exception |
