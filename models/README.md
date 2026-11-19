# AI Model Weights

Place YOLO model weights here. The system will attempt to download automatically on startup.

## Supported Models

| Model | File | Speed | Accuracy |
|-------|------|-------|----------|
| YOLOv11n | `yolo11n.pt` | Fastest | Good |
| YOLOv11s | `yolo11s.pt` | Fast | Better |
| YOLOv11m | `yolo11m.pt` | Moderate | Great |
| YOLOv11l | `yolo11l.pt` | Slow | Excellent |
| YOLOv11x | `yolo11x.pt` | Slowest | Best |

## Manual Download

```bash
# Inside backend container or with Python environment:
python -c "from ultralytics import YOLO; YOLO('yolo11n.pt')"

# Or via curl:
curl -L https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt -o yolo11n.pt
```

## Custom Models

For custom traffic detection models with additional classes (ambulances, police cars, etc.),
place the `.pt` file here and update `AI_MODEL_PATH` in `backend/.env`.
