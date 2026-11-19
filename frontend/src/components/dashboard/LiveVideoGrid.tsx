'use client';

/**
 * LiveVideoGrid — Professional AI Traffic Camera with Real YOLO Backend Integration
 *
 * Pipeline:
 *   Video/Webcam → Canvas frame capture (every 800ms) → Backend YOLOv11 inference
 *   → ByteTracker → CongestionAnalyzer → Webster's Signal Timing Engine
 *   → Render real bounding boxes + professional signal timing panel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, RefreshCw, ShieldAlert, Cpu, Zap, Activity, Camera,
  VideoOff, Eye, EyeOff, Scan, BarChart3, AlertCircle, Wifi,
  WifiOff, Clock, Car, Bike, Bus, User, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  analyzeFrame,
  FrameAnalysisResponse,
  BoundingBoxResult,
  TimingResult,
  VEHICLE_COLORS,
  VEHICLE_LABELS,
} from '@/lib/inferenceApi';

// ── Constants ────────────────────────────────────────────────────────────────
const INFERENCE_INTERVAL_MS = 800;  // Send frame to backend every 800ms
const FALLBACK_ENABLED = true;       // Show degraded UI if backend unavailable

// ── Vehicle class icon mapping ───────────────────────────────────────────────
function VehicleIcon({ cls }: { cls: string }) {
  if (cls === 'bus' || cls === 'truck') return <Bus className="w-3 h-3" />;
  if (cls === 'motorcycle' || cls === 'bicycle') return <Bike className="w-3 h-3" />;
  if (cls === 'person') return <User className="w-3 h-3" />;
  return <Car className="w-3 h-3" />;
}

// ── Phase colors ─────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  RED:       { dot: 'bg-rose-500 shadow-rose-500/60', text: 'text-rose-400', label: 'RED PHASE' },
  YELLOW:    { dot: 'bg-amber-400 shadow-amber-400/60', text: 'text-amber-400', label: 'YELLOW' },
  GREEN:     { dot: 'bg-emerald-500 shadow-emerald-500/60', text: 'text-emerald-400', label: 'GREEN PHASE' },
  EMERGENCY: { dot: 'bg-rose-500 shadow-rose-500/60 animate-ping', text: 'text-rose-400', label: '🚨 EMERGENCY' },
};

// ── Signal Timing Panel ──────────────────────────────────────────────────────
function SignalTimingPanel({ timing, inferenceMs, frameId, backendConnected }: {
  timing: TimingResult | null;
  inferenceMs: number;
  frameId: number;
  backendConnected: boolean;
}) {
  const [phase, setPhase] = useState<'RED' | 'YELLOW' | 'GREEN' | 'EMERGENCY'>('RED');
  const [countdown, setCountdown] = useState(0);
  const phaseRef = useRef<'RED' | 'YELLOW' | 'GREEN' | 'EMERGENCY'>('RED');

  // When new timing arrives from backend, reset phase cycle
  useEffect(() => {
    if (!timing) return;
    const newPhase = timing.is_emergency ? 'EMERGENCY' : 'RED';
    phaseRef.current = newPhase;
    setPhase(newPhase);
    setCountdown(timing.is_emergency ? timing.green_duration : timing.red_duration);
  }, [timing?.green_duration, timing?.red_duration, timing?.is_emergency]);

  // Local countdown that transitions phases
  useEffect(() => {
    if (!timing) return;
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Advance phase
          if (phaseRef.current === 'RED' || phaseRef.current === 'EMERGENCY') {
            phaseRef.current = 'GREEN';
            setPhase('GREEN');
            return timing.green_duration;
          } else if (phaseRef.current === 'GREEN') {
            phaseRef.current = 'YELLOW';
            setPhase('YELLOW');
            return timing.yellow_duration || 4;
          } else {
            phaseRef.current = timing.is_emergency ? 'EMERGENCY' : 'RED';
            setPhase(phaseRef.current);
            return timing.red_duration;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timing]);

  const pCfg = PHASE_CONFIG[phase];
  const satPct = timing ? Math.round(timing.saturation_degree * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-slate-100">Webster's Adaptive Signal Controller</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className={`text-[10px] font-semibold ${backendConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {backendConnected ? `YOLOv11 LIVE • ${inferenceMs}ms` : 'BACKEND OFFLINE'}
          </span>
        </div>
      </div>

      {/* Signal lamp + countdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Traffic Light */}
          <div className="flex flex-col items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <div className={`w-5 h-5 rounded-full ${phase === 'RED' || phase === 'EMERGENCY' ? `bg-rose-500 shadow-[0_0_14px_3px_rgba(239,68,68,0.7)]` : 'bg-slate-800'}`} />
            <div className={`w-5 h-5 rounded-full ${phase === 'YELLOW' ? `bg-amber-400 shadow-[0_0_14px_3px_rgba(251,191,36,0.7)]` : 'bg-slate-800'}`} />
            <div className={`w-5 h-5 rounded-full ${phase === 'GREEN' ? `bg-emerald-500 shadow-[0_0_14px_3px_rgba(34,197,94,0.7)]` : 'bg-slate-800'}`} />
          </div>

          <div>
            <div className={`text-xs font-bold ${pCfg.text}`}>{pCfg.label}</div>
            <div className="text-3xl font-mono font-black text-white leading-none mt-0.5">{countdown}<span className="text-lg text-slate-400 ml-0.5">s</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">FRAME #{frameId}</div>
          </div>
        </div>

        {/* Green / Red Duration Display */}
        {timing && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium">GREEN Allotted</span>
              <span className="text-sm font-mono font-bold text-white bg-emerald-900/60 border border-emerald-700 px-2 py-0.5 rounded-lg">{timing.green_duration}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium">RED Allotted</span>
              <span className="text-sm font-mono font-bold text-white bg-rose-900/60 border border-rose-700 px-2 py-0.5 rounded-lg">{timing.red_duration}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium">Cycle</span>
              <span className="text-sm font-mono font-bold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-lg">{timing.cycle_length}s</span>
            </div>
          </div>
        )}
      </div>

      {/* PCU Load Bar */}
      {timing && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-semibold">PCU Load (Passenger Car Units)</span>
            <span className="text-white font-bold">{timing.pcu_load} PCU</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                satPct > 80 ? 'bg-rose-500' : satPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, satPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>0%</span>
            <span className={`font-bold ${satPct > 80 ? 'text-rose-400' : satPct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
              y = {(timing.saturation_degree * 100).toFixed(1)}% saturation
            </span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Webster AI Decision */}
      {timing && (
        <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-2.5 flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{timing.reasoning}</p>
        </div>
      )}

      {/* Vehicle Count Breakdown */}
      {timing && Object.keys(timing.vehicle_counts).length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(timing.vehicle_counts).map(([cls, count]) => (
            <div key={cls} className="bg-slate-950 rounded-lg px-2 py-1.5 border border-slate-800 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: VEHICLE_COLORS[cls] || '#64748b' }} />
              <div className="min-w-0">
                <div className="text-[9px] text-slate-400 truncate">{VEHICLE_LABELS[cls] || cls}</div>
                <div className="text-xs font-bold text-white">{count}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bounding Box Overlay rendered absolutely over video ──────────────────────
function BBoxOverlay({ detections, frameWidth, frameHeight }: {
  detections: BoundingBoxResult[];
  frameWidth: number;
  frameHeight: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {detections.map((d) => {
        const [left, top, width, height] = d.bbox_pct;
        const color = VEHICLE_COLORS[d.class_name] || '#64748b';
        const isEmergency = ['ambulance', 'police_car', 'fire_truck'].includes(d.class_name);

        return (
          <div
            key={`${d.track_id}-${d.class_name}`}
            className="absolute"
            style={{
              left:   `${left}%`,
              top:    `${top}%`,
              width:  `${width}%`,
              height: `${height}%`,
              border: `2px solid ${color}`,
              boxShadow: isEmergency ? `0 0 16px 4px ${color}88` : `0 0 6px 1px ${color}44`,
            }}
          >
            {/* Label tag */}
            <div
              className="absolute -top-5 left-0 text-[9px] font-mono font-bold text-white px-1 py-0.5 whitespace-nowrap rounded-sm flex items-center gap-1"
              style={{ backgroundColor: color }}
            >
              <span>#{d.track_id}</span>
              <span>{VEHICLE_LABELS[d.class_name] || d.class_name}</span>
              <span className="opacity-90">{Math.round(d.confidence * 100)}%</span>
              {d.speed_kmh !== null && d.speed_kmh > 0 && (
                <span className="opacity-75">• {d.speed_kmh.toFixed(0)} km/h</span>
              )}
            </div>

            {/* PCU weight badge bottom-right */}
            <div
              className="absolute -bottom-4 right-0 text-[8px] font-mono text-white px-1 py-0.5 rounded-sm opacity-80"
              style={{ backgroundColor: color }}
            >
              {d.pcu_weight}x PCU
            </div>

            {/* Center tracking dot */}
            {isEmergency && (
              <div
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function LiveVideoGrid() {
  const [sourceMode, setSourceMode] = useState<'delhi' | 'upload' | 'webcam'>('delhi');
  const [delhiCamId, setDelhiCamId] = useState<number>(1);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);

  // Inference state
  const [analysisResult, setAnalysisResult] = useState<FrameAnalysisResponse | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [frameId, setFrameId] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inferenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Delhi camera configs ───────────────────────────────────────────────────
  const delhiCams = {
    1: { name: 'ITO Junction', location: 'Vikas Marg & DDU Marg, Central Delhi', img: '/images/ito.jpg' },
    2: { name: 'Connaught Place', location: 'Inner Circle & Janpath Radial, New Delhi', img: '/images/cp.jpg' },
    3: { name: 'Dhaula Kuan', location: 'NH-48 & Ring Road Interchange, Delhi', img: '/images/dhaula_kuan.jpg' },
    4: { name: 'AIIMS Flyover', location: 'Ring Road & Sri Aurobindo Marg, Delhi', img: '/images/aiims.jpg' },
  };
  const activeCam = delhiCams[delhiCamId as keyof typeof delhiCams];

  // ── Active video element ref (unified for inference) ──────────────────────
  const getActiveVideoRef = useCallback(() => {
    if (sourceMode === 'webcam') return webcamVideoRef.current;
    if (sourceMode === 'upload') return videoRef.current;
    return null; // Delhi static images → handled differently
  }, [sourceMode]);

  // ── Backend inference loop ────────────────────────────────────────────────
  const runInference = useCallback(async () => {
    if (isInferring) return;

    let target: HTMLVideoElement | null = getActiveVideoRef();

    // For Delhi image mode: create an off-screen image element to send
    if (!target && sourceMode === 'delhi') {
      // Build a canvas from the static img element
      const imgEl = document.querySelector<HTMLImageElement>('[data-delhi-img]');
      if (!imgEl || !imgEl.complete) return;

      setIsInferring(true);
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setIsInferring(false); return; }
      ctx.drawImage(imgEl, 0, 0, 640, 360);

      try {
        const fakeVideoEl = { tagName: 'CANVAS' } as HTMLVideoElement;
        // Send canvas directly
        const result = await analyzeFrame(canvas as unknown as HTMLVideoElement, `delhi-cam-${delhiCamId}`, 1.0);
        if (result) {
          setAnalysisResult(result);
          setBackendConnected(true);
          setFrameId(result.frame_id);
          setInferenceMs(result.inference_ms);
          setLastError(null);
        }
      } catch (e) {
        setBackendConnected(false);
      } finally {
        setIsInferring(false);
      }
      return;
    }

    if (!target) return;

    setIsInferring(true);
    try {
      const result = await analyzeFrame(target, `cam-${sourceMode}`, 1.0);
      if (result) {
        setAnalysisResult(result);
        setBackendConnected(true);
        setFrameId(result.frame_id);
        setInferenceMs(result.inference_ms);
        setLastError(null);
      } else {
        setBackendConnected(false);
        setLastError('No response from backend');
      }
    } catch (e: any) {
      setBackendConnected(false);
      setLastError(e?.message || 'Backend unavailable');
    } finally {
      setIsInferring(false);
    }
  }, [isInferring, sourceMode, delhiCamId, getActiveVideoRef]);

  // Start / stop inference loop
  useEffect(() => {
    inferenceTimerRef.current = setInterval(runInference, INFERENCE_INTERVAL_MS);
    return () => {
      if (inferenceTimerRef.current) clearInterval(inferenceTimerRef.current);
    };
  }, [runInference]);

  // ── Webcam handlers ────────────────────────────────────────────────────────
  const startWebcam = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
      setSourceMode('webcam');
    } catch (err: any) {
      setWebcamError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
    setSourceMode('delhi');
  };

  // ── Video upload handler ───────────────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopWebcam();
    setVideoUrl(URL.createObjectURL(file));
    setSourceMode('upload');
  };

  // ── Select Delhi preset ───────────────────────────────────────────────────
  const selectDelhi = (id: number) => {
    stopWebcam();
    setVideoUrl(null);
    setDelhiCamId(id);
    setSourceMode('delhi');
    setAnalysisResult(null);
  };

  const detections = showBoxes ? (analysisResult?.detections ?? []) : [];
  const timing     = analysisResult?.timing ?? null;
  const metrics    = analysisResult?.metrics ?? null;

  return (
    <div className="space-y-4">
      {/* ── Top Control Bar ──────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇮🇳</span>
              <h2 className="text-sm font-bold text-slate-100">
                AI Traffic Signal Controller — YOLOv11 + Webster's Timing
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real YOLO inference on every frame → PCU-weighted signal timing via Webster's formula
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Delhi presets */}
            <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 gap-0.5">
              {Object.entries(delhiCams).map(([id, cam]) => (
                <button
                  key={id}
                  onClick={() => selectDelhi(Number(id))}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    sourceMode === 'delhi' && delhiCamId === Number(id)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {cam.name}
                </button>
              ))}
            </div>

            <input type="file" accept="video/*" ref={fileInputRef} onChange={handleUpload} className="hidden" />

            <Button size="sm" onClick={() => fileInputRef.current?.click()}
              className="h-8 text-[11px] bg-indigo-700 hover:bg-indigo-600 text-white px-3 rounded-xl flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Upload Video
            </Button>

            <Button size="sm" onClick={webcamActive ? stopWebcam : startWebcam}
              className={`h-8 text-[11px] px-3 rounded-xl flex items-center gap-1.5 ${
                webcamActive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-700 hover:bg-emerald-600'
              } text-white`}>
              <Camera className="w-3.5 h-3.5" />
              {webcamActive ? 'Stop Camera' : 'Connect Camera'}
            </Button>

            <Button size="sm" variant="outline" onClick={() => setShowBoxes(!showBoxes)}
              className={`h-8 text-[11px] px-3 rounded-xl border flex items-center gap-1.5 ${
                showBoxes ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
              {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              YOLO Boxes
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Video Feed + Signal Panel ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Video Feed — 2/3 width on xl */}
        <div className="xl:col-span-2">
          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Emergency banner */}
            {metrics?.emergency_detected && (
              <div className="absolute top-0 inset-x-0 z-30 bg-rose-600 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                EMERGENCY PREEMPTION — {(metrics.emergency_type || '').replace('_', ' ').toUpperCase()} DETECTED — ALL CROSSING SIGNALS HELD RED
              </div>
            )}

            {/* Stream source */}
            {sourceMode === 'webcam' ? (
              <div className="w-full h-full bg-black">
                <video ref={webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {webcamError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-rose-400 z-20 p-6 text-center gap-3">
                    <VideoOff className="w-12 h-12" />
                    <p className="font-bold text-sm">{webcamError}</p>
                  </div>
                )}
              </div>
            ) : sourceMode === 'upload' && videoUrl ? (
              <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img
                data-delhi-img
                src={activeCam.img}
                alt={activeCam.name}
                className="w-full h-full object-cover"
              />
            )}

            {/* Real YOLO bounding boxes */}
            <BBoxOverlay detections={detections} frameWidth={640} frameHeight={360} />

            {/* Top-right metrics overlay */}
            <div className={`absolute right-3 flex flex-col items-end gap-1.5 z-20 pointer-events-none ${metrics?.emergency_detected ? 'top-10' : 'top-3'}`}>
              {metrics && (
                <>
                  <Badge className={`text-xs font-bold px-2.5 py-1 ${
                    metrics.congestion_score > 75 ? 'bg-rose-600 animate-pulse' :
                    metrics.congestion_score > 50 ? 'bg-amber-600' : 'bg-emerald-600'
                  } text-white`}>
                    Congestion: {metrics.congestion_score.toFixed(0)}%
                  </Badge>
                  <Badge variant="outline" className="bg-black/80 backdrop-blur text-slate-200 border-slate-700 text-[11px] px-2.5 py-1">
                    🚗 {metrics.total_vehicles} detected
                  </Badge>
                  <Badge variant="outline" className="bg-black/80 backdrop-blur text-indigo-300 border-indigo-600/50 text-[11px] px-2.5 py-1">
                    ⚡ {metrics.avg_speed_kmh.toFixed(0)} km/h avg
                  </Badge>
                </>
              )}
            </div>

            {/* Bottom status bar */}
            <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none`}>
              <div className="flex items-center gap-2 bg-black/80 border border-slate-700/60 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${isInferring ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[10px] text-slate-200 font-mono font-bold">
                  {sourceMode === 'webcam' ? 'LIVE WEBCAM' : sourceMode === 'upload' ? 'VIDEO STREAM' : activeCam.name.toUpperCase()}
                  {' • '}
                  {isInferring ? 'RUNNING YOLO...' : `FRAME #${frameId}`}
                </span>
              </div>

              {/* Backend connection indicator */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-sm border text-[10px] font-semibold ${
                backendConnected
                  ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-700/50 text-rose-300'
              }`}>
                {backendConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {backendConnected ? `YOLOv11 Connected` : 'Connecting...'}
              </div>
            </div>

            {/* Camera location label */}
            <div className={`absolute left-3 z-20 pointer-events-none ${metrics?.emergency_detected ? 'top-10' : 'top-3'}`}>
              <Badge className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-100 font-bold text-[11px] px-2.5 py-1">
                📍 {sourceMode === 'upload' ? 'Custom Video' : sourceMode === 'webcam' ? 'Device Camera' : activeCam.name}
              </Badge>
              {sourceMode === 'delhi' && (
                <p className="text-[10px] text-slate-300 mt-1 bg-black/70 px-2 py-0.5 rounded backdrop-blur max-w-[280px] truncate">
                  {activeCam.location}
                </p>
              )}
            </div>
          </div>

          {/* Backend offline notice */}
          {lastError && !backendConnected && (
            <div className="mt-2 flex items-center gap-2 bg-rose-950/50 border border-rose-700/40 rounded-xl px-3 py-2 text-[11px] text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Backend unavailable: <span className="font-bold">{lastError}</span> — Start the backend server to enable real YOLO detection.</span>
            </div>
          )}
        </div>

        {/* Signal Timing Panel — 1/3 width on xl */}
        <div>
          <SignalTimingPanel
            timing={timing}
            inferenceMs={inferenceMs}
            frameId={frameId}
            backendConnected={backendConnected}
          />
        </div>
      </div>
    </div>
  );
}
