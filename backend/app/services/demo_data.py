"""
Demo Data Seeder
Seeds the database with realistic demo users, cameras, signals, detections, and alerts.
Skips if data already exists.
"""
import uuid
import random
from datetime import datetime, timedelta, timezone
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


async def seed_demo_data(db: AsyncSession) -> None:
    """Seed the database with demo data for development/testing."""
    try:
        from app.models.user import User, UserRole
        from app.models.camera import Camera, CameraStatus
        from app.models.detection import Detection
        from app.models.signal import TrafficSignal, SignalPhase
        from app.models.alert import Alert, AlertType, AlertSeverity
        from app.core.security import get_password_hash

        # ── Check if already seeded ────────────────────────────────────────────
        result = await db.execute(select(User).where(User.username == "admin"))
        if result.scalars().first():
            logger.info("Demo data already exists — skipping seed")
            return

        logger.info("🌱 Seeding demo data...")

        # ── Users ──────────────────────────────────────────────────────────────
        admin = User(
            id=uuid.uuid4(),
            username="admin",
            email="admin@traffic-ai.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        operator = User(
            id=uuid.uuid4(),
            username="operator",
            email="operator@traffic-ai.com",
            hashed_password=get_password_hash("operator123"),
            role=UserRole.OPERATOR,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        viewer = User(
            id=uuid.uuid4(),
            username="viewer",
            email="viewer@traffic-ai.com",
            hashed_password=get_password_hash("viewer123"),
            role=UserRole.VIEWER,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add_all([admin, operator, viewer])
        await db.flush()
        logger.info("  ✓ Users created (admin / operator / viewer)")

        # ── Cameras ────────────────────────────────────────────────────────────
        cameras_data = [
            {
                "name": "Main Intersection — North",
                "location": "Junction A1, Sector 5",
                "description": "Primary north-facing camera at main intersection",
                "rtsp_url": "demo://camera-1",
                "status": CameraStatus.ONLINE,
                "demo": True,
            },
            {
                "name": "Highway Entrance — East",
                "location": "Highway Ramp, Gate 2",
                "description": "High-traffic highway on-ramp monitoring",
                "rtsp_url": "demo://camera-2",
                "status": CameraStatus.ONLINE,
                "demo": True,
            },
            {
                "name": "School Zone Camera",
                "location": "School Street, Block 8",
                "description": "Pedestrian-heavy school zone monitoring",
                "rtsp_url": "rtsp://192.168.1.100:554/live",
                "status": CameraStatus.OFFLINE,
                "demo": False,
            },
        ]

        camera_objects = []
        for c in cameras_data:
            cam = Camera(
                id=uuid.uuid4(),
                name=c["name"],
                location=c["location"],
                description=c["description"],
                rtsp_url=c["rtsp_url"],
                status=c["status"],
                is_active=True,
                resolution_width=1280,
                resolution_height=720,
                fps=30,
                zone_config={
                    "demo_mode": c["demo"],
                    "lanes": [
                        {"id": 1, "name": "Lane 1", "direction": "incoming", "capacity": 10},
                        {"id": 2, "name": "Lane 2", "direction": "outgoing", "capacity": 10},
                    ],
                    "roi_points": [{"x": 0, "y": 0}, {"x": 1280, "y": 720}],
                },
                created_at=datetime.now(timezone.utc),
            )
            camera_objects.append(cam)
            db.add(cam)
        await db.flush()
        logger.info(f"  ✓ {len(camera_objects)} cameras created")

        # ── Traffic Signals ────────────────────────────────────────────────────
        signal_phases = [SignalPhase.GREEN, SignalPhase.YELLOW, SignalPhase.RED]
        for i, cam in enumerate(camera_objects):
            signal = TrafficSignal(
                id=uuid.uuid4(),
                camera_id=cam.id,
                intersection_name=f"Intersection {chr(65 + i)}",
                current_phase=signal_phases[i % 3],
                phase_duration=30 + i * 10,
                green_duration=45,
                yellow_duration=5,
                red_duration=40,
                next_phase_at=datetime.now(timezone.utc) + timedelta(seconds=30),
                is_manual_override=False,
                emergency_preemption=False,
                cycle_count=random.randint(50, 500),
                created_at=datetime.now(timezone.utc),
            )
            db.add(signal)
        await db.flush()
        logger.info("  ✓ Traffic signals created")

        # ── Historical Detections (last 24 hours) ──────────────────────────────
        now = datetime.now(timezone.utc)
        detection_count = 0

        for cam in camera_objects[:2]:  # Only demo cameras get history
            for hours_ago in range(24, 0, -1):
                for interval in range(0, 60, 10):  # Every 10 min
                    ts = now - timedelta(hours=hours_ago, minutes=interval)
                    hour = ts.hour

                    # Realistic traffic pattern
                    is_rush = (7 <= hour <= 9) or (17 <= hour <= 19)
                    is_night = hour < 5 or hour > 22

                    if is_rush:
                        total = random.randint(25, 45)
                        congestion = random.uniform(65, 90)
                        speed = random.uniform(15, 35)
                        queue = random.uniform(0.6, 0.9)
                    elif is_night:
                        total = random.randint(1, 8)
                        congestion = random.uniform(5, 20)
                        speed = random.uniform(50, 80)
                        queue = random.uniform(0.0, 0.1)
                    else:
                        total = random.randint(8, 25)
                        congestion = random.uniform(20, 60)
                        speed = random.uniform(30, 55)
                        queue = random.uniform(0.1, 0.5)

                    detection = Detection(
                        id=uuid.uuid4(),
                        camera_id=cam.id,
                        timestamp=ts,
                        frame_number=random.randint(1, 100000),
                        vehicle_count={
                            "car": max(0, int(total * 0.65)),
                            "bus": max(0, int(total * 0.08)),
                            "truck": max(0, int(total * 0.07)),
                            "motorcycle": max(0, int(total * 0.12)),
                            "bicycle": max(0, int(total * 0.05)),
                        },
                        pedestrian_count=random.randint(0, 15 if not is_night else 2),
                        queue_length=round(queue, 3),
                        density=round(min(1.0, total / 50), 3),
                        occupancy=round(min(1.0, random.uniform(queue * 0.5, queue * 1.2)), 3),
                        avg_speed=round(speed, 1),
                        congestion_score=round(congestion, 1),
                        emergency_detected=False,
                        raw_detections=[],
                    )
                    db.add(detection)
                    detection_count += 1

        await db.flush()
        logger.info(f"  ✓ {detection_count} historical detections created")

        # ── Alerts ─────────────────────────────────────────────────────────────
        alert_templates = [
            {
                "type": AlertType.CONGESTION,
                "severity": AlertSeverity.HIGH,
                "title": "High Congestion Detected",
                "description": "Congestion score exceeded 80% threshold on Main Intersection",
            },
            {
                "type": AlertType.EMERGENCY_VEHICLE,
                "severity": AlertSeverity.CRITICAL,
                "title": "Emergency Vehicle Detected",
                "description": "Ambulance detected — signal preemption activated",
            },
            {
                "type": AlertType.CONGESTION,
                "severity": AlertSeverity.MEDIUM,
                "title": "Queue Length Warning",
                "description": "Queue length exceeded 70% of lane capacity",
            },
            {
                "type": AlertType.DEBRIS,
                "severity": AlertSeverity.HIGH,
                "title": "Road Debris Detected",
                "description": "Potential road obstacle detected in Lane 1",
            },
        ]

        for i, tpl in enumerate(alert_templates):
            is_acked = (i % 2 == 0)
            alert = Alert(
                id=uuid.uuid4(),
                camera_id=camera_objects[i % len(camera_objects)].id,
                type=tpl["type"],
                severity=tpl["severity"],
                title=tpl["title"],
                description=tpl["description"],
                is_acknowledged=is_acked,
                acknowledged_by=admin.id if is_acked else None,
                acknowledged_at=(now - timedelta(hours=i)) if is_acked else None,
                created_at=now - timedelta(hours=i * 2 + 1),
                metadata_={"auto_generated": True, "source": "demo_seed"},
            )
            db.add(alert)

        await db.commit()
        logger.info("  ✓ Sample alerts created")
        logger.info("✅ Demo data seeding complete!")
        logger.info("  🔑 Credentials: admin/admin123 | operator/operator123 | viewer/viewer123")

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to seed demo data: {e}", exc_info=True)
        # Don't raise — app should still start even if seeding fails
