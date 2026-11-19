'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Upload, Cpu, Zap, ShieldAlert, Car, Bus, Bike, User,
  Activity, Wifi, WifiOff, Eye, EyeOff, AlertTriangle, Siren,
  Clock, TrendingUp, TrendingDown, Gauge, ArrowUpRight, ArrowDownRight,
  RefreshCw, ChevronRight, Circle, Square, Triangle
} from 'lucide-react';
import { analyzeFrame, FrameAnalysisResponse, BoundingBoxResult, TimingResult, VEHICLE_COLORS, VEHICLE_LABELS } from '@/lib/inferenceApi';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface SignalLane {
  id: number;
  dir: string;
  fullName: string;
  phase: 'GREEN' | 'YELLOW' | 'RED' | 'EMERGENCY';
  timer: number;
  greenDur: number;
  redDur: number;
  vehicles: number;
  density: number;
  pcu: number;
  congestion: number;
  priority: string;
}

interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  level: 'INFO' | 'WARN' | 'CRIT';
}

/* ─── Delhi junction signal data ─────────────────────────────────────────── */
const INIT_LANES: SignalLane[] = [
  { id: 1, dir: 'N', fullName: 'North · ITO Vikas Marg', phase: 'GREEN', timer: 42, greenDur: 55, redDur: 20, vehicles: 18, density: 82, pcu: 24.4, congestion: 85, priority: 'NORMAL' },
  { id: 2, dir: 'S', fullName: 'South · DDU Marg', phase: 'RED', timer: 28, greenDur: 35, redDur: 30, vehicles: 9, density: 44, pcu: 11.2, congestion: 42, priority: 'NORMAL' },
  { id: 3, dir: 'E', fullName: 'East · Ring Road', phase: 'RED', timer: 61, greenDur: 25, redDur: 65, vehicles: 6, density: 28, pcu: 7.8, congestion: 28, priority: 'NORMAL' },
  { id: 4, dir: 'W', fullName: 'West · NH-48 Flyover', phase: 'EMERGENCY', timer: 60, greenDur: 60, redDur: 10, vehicles: 1, density: 5, pcu: 0.0, congestion: 100, priority: '🚨 AMBULANCE' },
];

const INIT_LOGS: LogEntry[] = [
  { id: 1, ts: '', msg: 'Ambulance DL-01-AM-9999 detected on West approach — Emergency preemption activated', level: 'CRIT' },
  { id: 2, ts: '', msg: 'North lane congestion 85% → Green extended from 40s to 55s via Webster\'s model', level: 'WARN' },
  { id: 3, ts: '', msg: 'YOLOv11 inference engine online — model yolo11n.pt loaded, warmup complete', level: 'INFO' },
  { id: 4, ts: '', msg: 'Webster\'s cycle C_opt = 118s computed (ΣY = 0.73, L = 9s)', level: 'INFO' },
];

/* ─── Bounding-box overlay ───────────────────────────────────────────────── */
function BBoxOverlay({ detections }: { detections: BoundingBoxResult[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {detections.map((d) => {
        const [left, top, width, height] = d.bbox_pct;
        const color = VEHICLE_COLORS[d.class_name] || '#64748b';
        const isEmerg = ['ambulance', 'police_car', 'fire_truck'].includes(d.class_name);
        return (
          <div key={`${d.track_id}-${d.class_name}`} className="absolute" style={{
            left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
            border: `2px solid ${color}`,
            boxShadow: isEmerg ? `0 0 18px 4px ${color}88` : `0 0 6px 1px ${color}44`,
          }}>
            <div className="absolute -top-5 left-0 flex items-center gap-0.5 px-1 py-0.5 rounded-sm text-[9px] font-mono font-bold text-white whitespace-nowrap"
              style={{ backgroundColor: color }}>
              <span>#{d.track_id}</span>
              <span>{VEHICLE_LABELS[d.class_name] || d.class_name}</span>
              <span>{Math.round(d.confidence * 100)}%</span>
            </div>
            {d.speed_kmh !== null && d.speed_kmh > 0 && (
              <div className="absolute -bottom-4 right-0 text-[8px] font-mono text-white px-1 py-0.5 rounded-sm opacity-80" style={{ backgroundColor: color }}>
                {d.speed_kmh.toFixed(0)} km/h
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Vertical traffic light ─────────────────────────────────────────────── */
function TrafficLight({ phase, timer }: { phase: SignalLane['phase']; timer: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-[#060b12] p-2 rounded-xl border border-slate-800/80 w-12 shrink-0">
      <div className={`w-7 h-7 rounded-full transition-all duration-300 ${(phase === 'RED' || phase === 'EMERGENCY') ? 'bg-rose-500 glow-red' : 'bg-slate-800/80'}`} />
      <div className={`w-7 h-7 rounded-full transition-all duration-300 ${phase === 'YELLOW' ? 'bg-amber-400 glow-amber' : 'bg-slate-800/80'}`} />
      <div className={`w-7 h-7 rounded-full transition-all duration-300 ${phase === 'GREEN' ? 'bg-emerald-500 glow-green' : 'bg-slate-800/80'}`} />
      <span className="mono text-white font-black text-sm leading-none mt-1">{timer}</span>
      <span className="text-[9px] text-slate-500">sec</span>
    </div>
  );
}

/* ─── Single lane row ────────────────────────────────────────────────────── */
function LaneRow({ lane }: { lane: SignalLane }) {
  const isEmerg = lane.phase === 'EMERGENCY';
  const phaseColor = {
    GREEN: 'text-emerald-400 bg-emerald-500/10 border-emerald-600/30',
    YELLOW: 'text-amber-400 bg-amber-500/10 border-amber-600/30',
    RED: 'text-rose-400 bg-rose-500/10 border-rose-600/30',
    EMERGENCY: 'text-rose-300 bg-rose-500/20 border-rose-500/60',
  }[lane.phase];

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
      isEmerg ? 'emergency-flash border-rose-500/60 bg-rose-950/20' : 'border-slate-800/60 bg-[#0a1120]/60 hover:border-slate-700/60'
    }`}>
      <TrafficLight phase={lane.phase} timer={lane.timer} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border mono ${phaseColor}`}>
              {lane.phase === 'EMERGENCY' ? '🚨 EMERG' : lane.phase}
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">{lane.fullName}</span>
          </div>
          {isEmerg && (
            <span className="text-[9px] font-bold text-rose-300 bg-rose-900/60 border border-rose-600/50 px-2 py-0.5 rounded whitespace-nowrap animate-pulse">
              {lane.priority}
            </span>
          )}
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-slate-400"><span className="text-white font-bold">{lane.vehicles}</span> vehicles</span>
          <span className="text-[10px] text-slate-400"><span className="font-bold" style={{
            color: lane.density > 70 ? '#f87171' : lane.density > 40 ? '#fbbf24' : '#34d399'
          }}>{lane.density}%</span> density</span>
          <span className="text-[10px] text-slate-400"><span className="text-cyan-400 font-bold">{lane.pcu}</span> PCU</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            lane.congestion > 70 ? 'text-rose-400 bg-rose-950/60' : lane.congestion > 40 ? 'text-amber-400 bg-amber-950/60' : 'text-emerald-400 bg-emerald-950/60'
          }`}>
            {lane.congestion > 70 ? 'HEAVY' : lane.congestion > 40 ? 'MODERATE' : 'LIGHT'}
          </span>
        </div>

        {/* Green / Red duration bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(lane.greenDur / (lane.greenDur + lane.redDur)) * 100}%` }} />
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(lane.redDur / (lane.greenDur + lane.redDur)) * 100}%` }} />
          </div>
          <span className="text-[9px] text-emerald-400 mono whitespace-nowrap">G:{lane.greenDur}s</span>
          <span className="text-[9px] text-rose-400 mono whitespace-nowrap">R:{lane.redDur}s</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Log feed ───────────────────────────────────────────────────────────── */
function LogFeed({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div ref={ref} className="h-32 overflow-y-auto space-y-1 font-mono text-[10px]">
      {logs.map((l) => (
        <div key={l.id} className={`flex gap-2 items-start px-2 py-0.5 rounded ${
          l.level === 'CRIT' ? 'bg-rose-950/30 text-rose-300' :
          l.level === 'WARN' ? 'bg-amber-950/30 text-amber-300' :
          'text-slate-400'
        }`}>
          <span className="text-slate-600 shrink-0">{l.ts}</span>
          <span className={`shrink-0 font-bold ${l.level === 'CRIT' ? 'text-rose-400' : l.level === 'WARN' ? 'text-amber-400' : 'text-cyan-500'}`}>
            [{l.level}]
          </span>
          <span className="break-words">{l.msg}</span>
        </div>
      ))}
      <div className="text-slate-600 px-2">▌</div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export function CommandCenterDashboard() {
  const [sourceMode, setSourceMode] = useState<'delhi' | 'upload' | 'webcam'>('delhi');
  const [delhiCamIdx, setDelhiCamIdx] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);

  const [result, setResult] = useState<FrameAnalysisResponse | null>(null);
  const [inferring, setInferring] = useState(false);
  const [connected, setConnected] = useState(false);
  const [frameId, setFrameId] = useState(0);
  const [inferMs, setInferMs] = useState(0);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef(0);
  const lastFpsTs = useRef(Date.now());

  const [lanes, setLanes] = useState<SignalLane[]>(INIT_LANES);
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return INIT_LOGS.map(l => ({ ...l, ts: now }));
  });
  const logIdRef = useRef(10);

  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const delhiCams = [
    { name: 'ITO Junction', loc: 'Vikas Marg & DDU Marg', img: '/images/ito.jpg' },
    { name: 'Connaught Place', loc: 'Inner Circle & Janpath', img: '/images/cp.jpg' },
    { name: 'Dhaula Kuan', loc: 'NH-48 & Ring Road', img: '/images/dhaula_kuan.jpg' },
    { name: 'AIIMS Flyover', loc: 'Sri Aurobindo Marg', img: '/images/aiims.jpg' },
  ];
  const cam = delhiCams[delhiCamIdx];

  /* ── Signal countdown loop ── */
  useEffect(() => {
    const t = setInterval(() => {
      setLanes(prev => prev.map(lane => {
        let timer = lane.timer - 1;
        let phase = lane.phase;
        let greenDur = lane.greenDur;
        let redDur = lane.redDur;

        if (timer <= 0) {
          if (phase === 'GREEN') { phase = 'YELLOW'; timer = 4; }
          else if (phase === 'YELLOW') { phase = 'RED'; timer = redDur; }
          else if (phase === 'RED') { phase = 'GREEN'; timer = greenDur; }
          else { phase = 'GREEN'; timer = greenDur; } // EMERGENCY → GREEN
        }
        return { ...lane, phase, timer };
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Inference loop ── */
  const getTarget = useCallback((): HTMLVideoElement | HTMLCanvasElement | null => {
    if (sourceMode === 'webcam') return webcamRef.current;
    if (sourceMode === 'upload') return videoRef.current;
    return null;
  }, [sourceMode]);

  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'INFO') => {
    const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-40), { id: ++logIdRef.current, ts, msg, level }]);
  }, []);

  const runInference = useCallback(async () => {
    if (inferring) return;
    setInferring(true);

    let target = getTarget();
    let canvas: HTMLCanvasElement | null = null;

    // For Delhi image mode — capture static image via canvas
    if (!target && sourceMode === 'delhi') {
      const img = document.querySelector<HTMLImageElement>('[data-delhi-img]');
      if (!img || !img.complete) { setInferring(false); return; }
      canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setInferring(false); return; }
      ctx.drawImage(img, 0, 0, 640, 360);
      target = canvas as unknown as HTMLVideoElement;
    }

    if (!target) { setInferring(false); return; }

    try {
      const r = await analyzeFrame(target as HTMLVideoElement, `cam-${delhiCamIdx}`, 1.0);
      if (r) {
        setResult(r);
        setConnected(true);
        setFrameId(r.frame_id);
        setInferMs(r.inference_ms);

        // FPS calc
        fpsRef.current++;
        const now = Date.now();
        if (now - lastFpsTs.current >= 1000) {
          setFps(fpsRef.current);
          fpsRef.current = 0;
          lastFpsTs.current = now;
        }

        // Update lane 1 with real YOLO data
        if (r.metrics.total_vehicles > 0) {
          setLanes(prev => prev.map((l, i) => i === 0 ? {
            ...l,
            vehicles: r.metrics.total_vehicles,
            density: Math.round(r.metrics.congestion_score),
            pcu: r.timing.pcu_load,
            congestion: Math.round(r.metrics.congestion_score),
            greenDur: r.timing.green_duration,
            redDur: r.timing.red_duration,
          } : l));
        }

        // Log interesting events
        if (r.metrics.emergency_detected && r.metrics.emergency_type) {
          addLog(`${r.metrics.emergency_type.replace('_', ' ').toUpperCase()} detected → emergency preemption (Green ${r.timing.green_duration}s)`, 'CRIT');
        } else if (r.metrics.congestion_score > 75) {
          addLog(`High congestion ${r.metrics.congestion_score.toFixed(0)}% on active cam → Webster's: G:${r.timing.green_duration}s R:${r.timing.red_duration}s`, 'WARN');
        }
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setInferring(false);
    }
  }, [inferring, sourceMode, delhiCamIdx, getTarget, addLog]);

  useEffect(() => {
    timerRef.current = setInterval(runInference, 900);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [runInference]);

  /* ── Webcam ── */
  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      streamRef.current = stream;
      if (webcamRef.current) webcamRef.current.srcObject = stream;
      setWebcamActive(true); setSourceMode('webcam');
      addLog('Device camera connected — YOLO inference active', 'INFO');
    } catch { addLog('Camera access denied', 'WARN'); }
  };
  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setWebcamActive(false); setSourceMode('delhi');
  };

  /* ── Upload ── */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    stopCam(); setVideoUrl(URL.createObjectURL(f)); setSourceMode('upload');
    addLog(`Video file loaded: ${f.name}`, 'INFO');
  };

  /* ── Derived state ── */
  const detections = showBoxes ? (result?.detections ?? []) : [];
  const timing = result?.timing ?? null;
  const metrics = result?.metrics ?? null;
  const totalVehicles = metrics?.total_vehicles ?? lanes.reduce((s, l) => s + l.vehicles, 0);
  const avgCong = Math.round(lanes.reduce((s, l) => s + l.congestion, 0) / lanes.length);
  const hasEmerg = lanes.some(l => l.phase === 'EMERGENCY') || (metrics?.emergency_detected ?? false);

  return (
    <div className="flex flex-col h-screen bg-[#060d1a] text-slate-200 overflow-hidden">

      {/* ── TOP HEADER ── */}
      <header className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-slate-800/80 bg-[#040a14]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black tracking-widest text-slate-300 uppercase">AI Traffic Command Center</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-[10px] text-slate-500 font-mono">ITO Junction Complex · Delhi NCR</span>
        </div>

        <div className="flex items-center gap-4">
          {hasEmerg && (
            <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-600/60 px-3 py-1 rounded-lg animate-pulse">
              <Siren className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wide">Emergency Preemption Active</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px]">
            <div className={`flex items-center gap-1 ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="font-bold">{connected ? `YOLOv11 • ${inferMs}ms` : 'OFFLINE'}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-400">
              <Activity className="w-3 h-3" />
              <span className="mono">{fps} fps</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <Clock className="w-3 h-3 text-slate-500" />
            <LiveClock />
          </div>
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="w-14 shrink-0 flex flex-col items-center gap-4 py-4 border-r border-slate-800/60 bg-[#040a14]">
          {[
            { icon: '⌂', label: 'Dashboard', active: true },
            { icon: '📷', label: 'Cameras', active: false },
            { icon: '🚦', label: 'Signals', active: false },
            { icon: '📊', label: 'Analytics', active: false },
            { icon: '🔔', label: 'Alerts', active: false },
            { icon: '⚙', label: 'Settings', active: false },
          ].map((item) => (
            <button key={item.label} title={item.label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                item.active ? 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-300' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'
              }`}
            >{item.icon}</button>
          ))}
        </aside>

        {/* CENTER: VIDEO + CONTROLS */}
        <div className="flex flex-col flex-1 overflow-hidden p-2.5 gap-2.5 min-w-0">

          {/* Video feed */}
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden border border-slate-800/80 min-h-0">

            {/* Emergency banner */}
            {hasEmerg && (
              <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-center gap-2 bg-rose-700/90 text-white text-[11px] font-black py-1.5 uppercase tracking-widest animate-pulse">
                <Siren className="w-4 h-4" />
                Emergency Preemption — All Crossing Approaches Held RED — West Approach Extended GREEN 60s
              </div>
            )}

            {/* Video / image source */}
            {sourceMode === 'webcam' ? (
              <video ref={webcamRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : sourceMode === 'upload' && videoUrl ? (
              <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img data-delhi-img src={cam.img} alt={cam.name} className="w-full h-full object-cover" />
            )}

            {/* YOLO bounding boxes */}
            <BBoxOverlay detections={detections} />

            {/* Top-left: camera info */}
            <div className={`absolute left-3 z-20 flex flex-col gap-1.5 ${hasEmerg ? 'top-10' : 'top-3'}`}>
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur border border-slate-700/60 px-2.5 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">LIVE</span>
                <div className="h-3 w-px bg-slate-700" />
                <span className="text-[10px] text-slate-300 font-semibold">
                  {sourceMode === 'webcam' ? 'Device Camera' : sourceMode === 'upload' ? 'Video File' : cam.name}
                </span>
                {inferring && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
              </div>
              {sourceMode === 'delhi' && (
                <span className="text-[9px] text-slate-400 bg-black/60 backdrop-blur px-2 py-0.5 rounded">📍 {cam.loc}, Delhi NCR</span>
              )}
            </div>

            {/* Top-right: live metrics */}
            <div className={`absolute right-3 z-20 flex flex-col gap-1.5 ${hasEmerg ? 'top-10' : 'top-3'}`}>
              {metrics && (
                <>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur text-[10px] font-bold ${
                    metrics.congestion_score > 75 ? 'bg-rose-950/80 border-rose-600/50 text-rose-300 animate-pulse' :
                    metrics.congestion_score > 50 ? 'bg-amber-950/80 border-amber-600/50 text-amber-300' :
                    'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
                  }`}>
                    <Gauge className="w-3 h-3" />
                    Congestion: {metrics.congestion_score.toFixed(0)}%
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/70 border border-slate-700/60 px-2.5 py-1.5 rounded-lg backdrop-blur text-[10px] text-slate-200">
                    <Car className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold">{metrics.total_vehicles}</span> vehicles detected
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/70 border border-slate-700/60 px-2.5 py-1.5 rounded-lg backdrop-blur text-[10px] text-slate-200">
                    <Activity className="w-3 h-3 text-indigo-400" />
                    <span className="font-bold">{metrics.avg_speed_kmh.toFixed(0)}</span> km/h avg
                  </div>
                </>
              )}
            </div>

            {/* Bottom: status bar */}
            <div className={`absolute bottom-0 inset-x-0 z-20 flex items-center justify-between gap-3 px-3 py-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent`}>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Delhi cam selector */}
                {delhiCams.map((c, i) => (
                  <button key={i} onClick={() => { setDelhiCamIdx(i); setSourceMode('delhi'); stopCam(); }}
                    className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                      sourceMode === 'delhi' && delhiCamIdx === i
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-black/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >{c.name}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="file" accept="video/*" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-700/80 hover:bg-indigo-600 text-white border border-indigo-600/60 transition-all">
                  <Upload className="w-3 h-3" /> Upload Video
                </button>
                <button onClick={webcamActive ? stopCam : startCam}
                  className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    webcamActive ? 'bg-rose-700/80 hover:bg-rose-600 border-rose-600/60 text-white' : 'bg-emerald-800/60 hover:bg-emerald-700 border-emerald-600/40 text-emerald-200'
                  }`}>
                  <Camera className="w-3 h-3" /> {webcamActive ? 'Stop Cam' : 'Live Cam'}
                </button>
                <button onClick={() => setShowBoxes(!showBoxes)}
                  className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    showBoxes ? 'bg-cyan-800/60 border-cyan-600/40 text-cyan-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}>
                  {showBoxes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Boxes
                </button>
              </div>
            </div>
          </div>

          {/* System Log */}
          <div className="shrink-0 bg-[#040a14] rounded-xl border border-slate-800/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Event Log</span>
              </div>
              <span className="text-[9px] text-slate-600 mono">Webster's Adaptive Signal Control · YOLOv11 Inference</span>
            </div>
            <LogFeed logs={logs} />
          </div>
        </div>

        {/* RIGHT PANEL: Signal Matrix + Stats */}
        <aside className="w-80 xl:w-96 shrink-0 flex flex-col gap-2.5 p-2.5 border-l border-slate-800/60 overflow-y-auto bg-[#040c18]">

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total Vehicles', value: totalVehicles.toLocaleString(), icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-600/20' },
              { label: 'Avg Congestion', value: `${avgCong}%`, icon: Gauge, color: avgCong > 70 ? 'text-rose-400' : 'text-amber-400', bg: avgCong > 70 ? 'bg-rose-500/10 border-rose-600/20' : 'bg-amber-500/10 border-amber-600/20' },
              { label: 'YOLOv11 Detections', value: detections.length, icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-600/20' },
              { label: 'PCU Load', value: timing ? `${timing.pcu_load}` : '—', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-600/20' },
            ].map((k, i) => (
              <div key={i} className={`rounded-xl border p-3 ${k.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wide font-semibold">{k.label}</span>
                  <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                </div>
                <div className={`text-xl font-black mono ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Webster's cycle box */}
          {timing && (
            <div className="rounded-xl border border-indigo-600/20 bg-indigo-950/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">Webster's Signal Decision</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-950/60 border border-emerald-700/40 rounded-lg p-2 text-center">
                  <div className="text-xs text-emerald-400 font-semibold">GREEN</div>
                  <div className="text-2xl font-black text-emerald-300 mono">{timing.green_duration}</div>
                  <div className="text-[9px] text-slate-500">seconds</div>
                </div>
                <div className="bg-amber-950/60 border border-amber-700/40 rounded-lg p-2 text-center">
                  <div className="text-xs text-amber-400 font-semibold">CYCLE</div>
                  <div className="text-2xl font-black text-amber-300 mono">{timing.cycle_length}</div>
                  <div className="text-[9px] text-slate-500">seconds</div>
                </div>
                <div className="bg-rose-950/60 border border-rose-700/40 rounded-lg p-2 text-center">
                  <div className="text-xs text-rose-400 font-semibold">RED</div>
                  <div className="text-2xl font-black text-rose-300 mono">{timing.red_duration}</div>
                  <div className="text-[9px] text-slate-500">seconds</div>
                </div>
              </div>
              {/* Saturation bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Saturation Degree (y = q/S)</span>
                  <span className="font-bold text-slate-300">{(timing.saturation_degree * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${timing.saturation_degree * 100}%`,
                    backgroundColor: timing.saturation_degree > 0.8 ? '#ef4444' : timing.saturation_degree > 0.6 ? '#f59e0b' : '#10b981'
                  }} />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-900/60 rounded p-2 font-mono">
                {timing.reasoning}
              </p>
              {timing.is_emergency && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-300 bg-rose-950/50 border border-rose-700/40 px-2.5 py-2 rounded-lg animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  EMERGENCY: {timing.emergency_type?.toUpperCase().replace('_', ' ')} — Cross-signals held RED
                </div>
              )}
            </div>
          )}

          {/* Vehicle counts from YOLO */}
          {timing && Object.keys(timing.vehicle_counts).length > 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-[#060d1a] p-3 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">YOLO Detection Breakdown</span>
              <div className="space-y-1.5">
                {Object.entries(timing.vehicle_counts).map(([cls, count]) => (
                  <div key={cls} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: VEHICLE_COLORS[cls] || '#64748b' }} />
                    <span className="text-[10px] text-slate-400 flex-1">{VEHICLE_LABELS[cls] || cls}</span>
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (count / Math.max(...Object.values(timing.vehicle_counts))) * 100)}%`,
                        backgroundColor: VEHICLE_COLORS[cls] || '#64748b'
                      }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 w-6 text-right mono">{count}</span>
                    <span className="text-[9px] text-slate-500 w-10 text-right">{timing.weighted_pcu[cls]?.toFixed(1)} PCU</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signal matrix */}
          <div className="rounded-xl border border-slate-800/60 bg-[#060d1a] p-3 space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Signal Matrix — All Approaches</span>
              <div className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-700/30 px-1.5 py-0.5 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ADAPTIVE
              </div>
            </div>
            <div className="space-y-2">
              {lanes.map(lane => <LaneRow key={lane.id} lane={lane} />)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LiveClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const update = () => setT(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="mono text-slate-300 font-bold text-[10px]">{t}</span>;
}
