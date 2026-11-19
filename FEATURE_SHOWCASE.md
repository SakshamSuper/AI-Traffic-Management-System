# 🚦 AI Smart Traffic Management System — Feature Showcase

> **Live Command Center**: [traffic-ai-frontend-wlie.onrender.com](https://traffic-ai-frontend-wlie.onrender.com)  
> **Backend API & Swagger**: [traffic-ai-backend-xu5g.onrender.com/api/docs](https://traffic-ai-backend-xu5g.onrender.com/api/docs)

A production-engineered, end-to-end intelligent transportation management platform. Built with **FastAPI**, **YOLOv11**, **ByteTrack**, **PostgreSQL**, **Redis**, and a high-performance **Next.js 14** operational command center.

---

## 📸 Platform Views & Feature Walkthrough

### 1. 🌐 "God's Eye" Mission Command Center (`/dashboard`)

The operator command center provides centralized situational awareness across all metropolitan intersections.

#### 4 Live System KPI Cards
| KPI Indicator | Metric Tracked | Operational Value |
|---|---|---|
| 🟢 **Active Intersections** | Online video stream feeds | Instant detection of camera link loss |
| 🟠 **Congestion Index** | Real-time score ($0 - 100$) | City-wide composite traffic health index |
| 🔵 **Vehicles in Flow** | Active tracked entities across all lanes | High-density load estimation |
| 🔴 **Priority Emergencies** | Active emergency preemptions | Highlights ambulances / police requiring clearance |

#### Interactive Features
- **Real-Time Video Mosaic**: Live MJPEG video feeds with dynamic bounding boxes, vehicle classifications, and calculated velocities overlaid directly on the canvas.
- **Dynamic Phase Counters**: Animated SVG progress dials showing real-time green/red countdown timers computed dynamically by Webster's engine.
- **Instant Preemption Banners**: Flashing alert banner when an emergency vehicle is detected on any approach.

---

### 2. 📷 Multi-Camera Surveillance & Calibration Studio (`/cameras`)

A dedicated surveillance console for monitoring and configuring cameras across metropolitan junctions:
- **Junction Matrix**: Live thumbnail grid showing status for AIIMS, Connaught Place, Dhaula Kuan, and ITO.
- **Per-Camera Drilldown (`/cameras/[id]`)**: Full-resolution stream inspection with latency indicators, frame rate counters, and raw detection logs.
- **Polygonal Lane Calibration**: Visual ROI editor allowing operators to draw and save polygonal lane zones directly on camera snapshots.
- **Direction & Capacity Rules**: Configure incoming/outgoing directional lane flows and maximum saturation capacity.

---

### 3. 🚦 Adaptive Signal Control Center (`/signals`)

The automated civil engineering brain controlling physical traffic lights:
- **Webster's Timing Engine Telemetry**: Visualizes exact PCU (Passenger Car Unit) weight loads, saturation flow rates, and degree of saturation $y = q/S$ for every approach.
- **State Machine Phases**:
  - `GREEN`: Variable duration ($15\text{s} - 120\text{s}$) proportional to traffic volume.
  - `YELLOW`: $4\text{s}$ standardized caution transition.
  - `ALL_RED`: $2\text{s}$ intersection clearance window.
  - `EMERGENCY`: Immediate phase preemption clearing the priority path.
- **Emergency Priority Trigger**: Operator override button providing instant 60-second priority clearance for ambulances, fire engines, and VIP convoys.
- **Manual Phase Holding**: Allows traffic police to freeze or toggle green splits during parades, marathons, or extreme weather events.

---

### 4. 📊 Traffic Intelligence & Historical Analytics (`/analytics`)

Deep telemetry for city planners and civil engineers:
- **Congestion Trends**: Interactive multi-line time series charts comparing diurnal traffic peaks across morning rush hour ($8:00\text{ AM} - 11:00\text{ AM}$) and evening rush hour ($5:00\text{ PM} - 9:00\text{ PM}$).
- **Fleet Composition Breakdown**: Donut and radar charts detailing the percentage distribution of cars, heavy buses, freight trucks, motorcycles, and three-wheelers.
- **Speed Velocity Distributions**: Box plots and 50th, 85th, and 95th percentile speeds ($p50, p85, p95$) used to audit urban speeding and traffic calming efficacy.
- **Spatial Heatmaps**: Density distribution maps displaying intersection bottlenecks and recurrent queue spillbacks.
- **Automated Report Export**: Instant generation of daily and weekly traffic performance reports in CSV format.

---

### 5. 🚨 Real-Time Alert & Incident Command (`/alerts`)

Automated incident perception alerting operators to hazardous road conditions:
- **Perceptual Incident Detection**:
  - `Emergency Vehicle Detected`: Triggers automatic signal preemption.
  - `Critical Congestion Threshold Exceeded`: Alerts when congestion index surpasses $80\%$.
  - `Stationary Vehicle / Lane Blockage`: Perceived when vehicle velocity drops below $2\text{ km/h}$ for $>60\text{s}$.
  - `Video Feed Degraded / Offline`: Perceived upon RTSP packet loss or camera tampering.
- **Operator Triage Actions**: One-click "Acknowledge" and "Mark as Resolved" workflow with operator timestamp auditing.

---

### 6. ⚙️ Node Settings & System Administration (`/settings`)

Comprehensive control over model parameters and system thresholds:
- **Inference Configuration**: Adjust detection confidence thresholds ($\tau_{\text{conf}}$) and NMS overlap parameters in real time without restarting backend services.
- **Sampling FPS Control**: Throttle video analysis framerates ($5 - 30\text{ FPS}$) to balance GPU compute utilization.
- **Role-Based Access Management (RBAC)**: Manage user permissions (`admin`, `operator`, `viewer`) and generate secure API keys for external smart city telemetry integrations.
