'use client';

/**
 * AURA // ITS · Autonomous Traffic Intelligence Platform
 * =======================================================
 * Enterprise Next-Generation Traffic Command Center & AI Signal Controller
 * Powered by Ultralytics YOLOv11, ByteTrack, NEMA TS2 Dual-Ring Phasing,
 * and Real-Time Time-to-Collision (TTC) Vision Zero Radar.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Upload, Download, Moon, Maximize2, Minimize2,
  Crosshair, ShieldAlert, Gauge, Car, FileSpreadsheet,
  Wifi, Siren, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Radio, Activity, Sparkles,
  Flame, Leaf, Clock, ArrowUpRight, ArrowDownRight, Eye,
  Database, Sliders, Zap, Video, Globe,
  Smartphone, Link2, Play, X, ExternalLink, HardDrive,
  Cpu, RadioTower, RefreshCw, BarChart3, Search, Filter,
  Shield, Navigation, Layers, Info
} from 'lucide-react';

/* ─── Interfaces ───────────────────────────────────────────────────────────── */
interface ActiveVehicle {
  tid: number;
  cls: string;
  conf: number;
  speed: number;
  bbox: number[];
  plate: string;
  duration_s: number;
  direction: string;
  violation: string;
  is_locked: boolean;
}

interface SafetyAlert {
  timestamp: string;
  track_id: number;
  type: string;
  message: string;
}

interface TargetCropData {
  track_id: number;
  class_name: string;
  confidence: number;
  speed_kmh: number;
  plate: string;
  duration_s: number;
  direction: string;
  violation: string;
  crop_b64: string | null;
  plate_crop_b64: string | null;
}

interface StreamStatus {
  phase: string;
  phase_timer: number;
  green_duration: number;
  red_duration: number;
  yellow_duration: number;
  webster_cycle: number;
  pcu_load: number;
  los_grade: string;
  los_desc: string;
  saturation_ratio: number;
  emergency: boolean;
  emergency_type: string;
  fps: number;
  locked_target: number | null;
  night_mode: boolean;
  heatmap_mode: boolean;
  active_vehicles: ActiveVehicle[];
  recent_alerts: SafetyAlert[];
  count_up: number;
  count_dn: number;
  total_active: number;
  nema: {
    ring1_phase: number;
    ring2_phase: number;
    barrier: string;
    ring1_status: string;
    ring2_status: string;
  };
  atspm: {
    arrivals_on_green_pct: number;
    purdue_split_failure_rate: number;
    average_delay_seconds: number;
    green_wave_speed_kmh: number;
  };
  emissions: {
    cumulative_co2_kg: number;
    cumulative_fuel_liters: number;
    co2_saved_adaptive_kg: number;
  };
  safety: {
    near_miss_count: number;
    red_light_violations_count: number;
    speed_violations_count: number;
    stalled_vehicles_count: number;
    recent_red_light: Array<{
      timestamp: string;
      track_id: number;
      plate: string;
      speed_kmh: number;
      approach: string;
    }>;
  };
}

interface HardwareCamera {
  index: number;
  name: string;
  type: string;
}

export function GodsEyeView() {
  /* ── State ── */
  const [activeTab, setActiveTab] = useState<'mission' | 'signals' | 'safety' | 'registry'>('mission');
  const [feedMode, setFeedMode] = useState<'drone' | 'hardware' | 'network' | 'upload'>('drone');
  const [streamSrc, setStreamSrc] = useState(`/api/v1/stream/video?t=${Date.now()}`);
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [backendOk, setBackendOk] = useState(false);
  const [lockedTargetId, setLockedTargetId] = useState<number | null>(null);
  const [targetCrop, setTargetCrop] = useState<TargetCropData | null>(null);
  const [nightMode, setNightMode] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterClassFilter, setRosterClassFilter] = useState('ALL');

  // Hardware Cameras & Stream Ingestion
  const [hwCameras, setHwCameras] = useState<HardwareCamera[]>([]);
  const [selectedCamIndex, setSelectedCamIndex] = useState<number>(0);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [customRtspUrl, setCustomRtspUrl] = useState('');
  const [phoneIp, setPhoneIp] = useState('192.168.1.100:8080');
  const [activeFeedLabel, setActiveFeedLabel] = useState("God's Eye Aerial (4K Drone Live)");

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 1. Telemetry Polling ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/stream/status');
      if (res.ok) {
        const data: StreamStatus = await res.json();
        setStatus(data);
        setBackendOk(true);
        setNightMode(data.night_mode);
        setHeatmapMode(data.heatmap_mode);
        if (data.locked_target !== lockedTargetId) {
          setLockedTargetId(data.locked_target);
        }
      }
    } catch {
      setBackendOk(false);
    }
  }, [lockedTargetId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 900);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Fetch available hardware cameras once on mount
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await fetch('/api/v1/stream/available-cameras');
        if (res.ok) {
          const data = await res.json();
          if (data.hardware_cameras && data.hardware_cameras.length > 0) {
            setHwCameras(data.hardware_cameras);
          }
        }
      } catch { /* silent */ }
    };
    fetchCameras();
  }, []);

  /* ── 2. Locked Target Details (ANPR) ── */
  useEffect(() => {
    if (lockedTargetId === null) {
      setTargetCrop(null);
      return;
    }
    const fetchTargetData = async () => {
      try {
        const r = await fetch(`/api/v1/stream/target-crop/${lockedTargetId}`);
        if (r.ok) {
          const d = await r.json();
          setTargetCrop(d);
        }
      } catch { /* silent */ }
    };
    fetchTargetData();
    const interval = setInterval(fetchTargetData, 1000);
    return () => clearInterval(interval);
  }, [lockedTargetId]);

  /* ── 3. Feed Switching Handlers ── */
  const selectDroneFeed = () => {
    setFeedMode('drone');
    setActiveFeedLabel("God's Eye Aerial (4K Drone Live)");
    setStreamSrc(`/api/v1/stream/video?t=${Date.now()}`);
    setStreamConnected(false);
    setStreamError(false);
  };

  const selectHardwareCamera = (index: number, name?: string) => {
    setFeedMode('hardware');
    setSelectedCamIndex(index);
    const label = name ? `${name} [Cam #${index}]` : `Hardware Camera #${index}`;
    setActiveFeedLabel(label);
    setStreamSrc(`/api/v1/stream/live-device/${index}?t=${Date.now()}`);
    setStreamConnected(false);
    setStreamError(false);
    setShowStreamModal(false);
  };

  const connectNetworkStream = (url: string) => {
    if (!url || !url.trim()) return;
    setFeedMode('network');
    const cleanUrl = url.trim();
    const shortLabel = cleanUrl.length > 30 ? cleanUrl.slice(0, 27) + '...' : cleanUrl;
    setActiveFeedLabel(`Network Stream: ${shortLabel}`);
    setStreamSrc(`/api/v1/stream/live-url?url=${encodeURIComponent(cleanUrl)}&t=${Date.now()}`);
    setStreamConnected(false);
    setStreamError(false);
    setShowStreamModal(false);
  };

  // Auto-retry when drone stream temporarily disconnects
  useEffect(() => {
    if (streamError && feedMode === 'drone') {
      const timer = setTimeout(() => {
        setStreamSrc(`/api/v1/stream/video?t=${Date.now()}`);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [streamError, feedMode]);

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/v1/stream/upload-video', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setFeedMode('upload');
        setActiveFeedLabel(`File: ${file.name}`);
        setStreamSrc(`/api/v1/stream/video-file?path=${encodeURIComponent(data.path)}&t=${Date.now()}`);
      }
    } catch { /* silent */ }
  };

  const handleLockTarget = async (tid: number | null) => {
    try {
      await fetch('/api/v1/stream/lock-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: tid }),
      });
      setLockedTargetId(tid);
    } catch { /* silent */ }
  };

  const handleToggleNightMode = async () => {
    try {
      const r = await fetch('/api/v1/stream/night-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !nightMode }),
      });
      if (r.ok) {
        const d = await r.json();
        setNightMode(d.night_mode);
      }
    } catch { /* silent */ }
  };

  const handleToggleHeatmap = async () => {
    try {
      const r = await fetch('/api/v1/stream/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !heatmapMode }),
      });
      if (r.ok) {
        const d = await r.json();
        setHeatmapMode(d.heatmap_mode);
      }
    } catch { /* silent */ }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /* ── Derived Telemetry ── */
  const isEmerg = status?.emergency ?? false;
  const phase = status?.phase ?? 'GREEN';
  const timer = status?.phase_timer ?? 45;
  const pcu = status?.pcu_load ?? 0.0;
  const los = status?.los_grade ?? 'A';
  const losDesc = status?.los_desc ?? 'Free Flow';
  const websterCycle = status?.webster_cycle ?? 79;
  const totalVehicles = status?.total_active ?? 0;
  const nema = status?.nema ?? { ring1_phase: 2, ring2_phase: 6, barrier: 'BARRIER_1_NS', ring1_status: 'GREEN', ring2_status: 'GREEN' };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen bg-[#07090E] text-slate-100 font-sans antialiased overflow-hidden select-none"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          AURA // TOP COMMAND NAVIGATION BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="h-16 shrink-0 bg-[#090C15]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 flex items-center justify-between z-30">
        {/* Brand & Operational Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.45)]">
              <RadioTower className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090C15] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-wider text-white">AURA // ITS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold">
                  AUTONOMOUS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Urban Traffic Intelligence & Signal Controller</p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-white/[0.08]" />

          {/* Engine Capsule */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
            <div className={`w-2.5 h-2.5 rounded-full ${backendOk ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span className={backendOk ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {backendOk ? 'ONLINE' : 'CONNECTING...'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{status?.fps ?? 30} FPS</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400 font-semibold">YOLOv11+ByteTrack</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-[#05070E] p-1.5 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'mission'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Mission Control</span>
          </button>

          <button
            onClick={() => setActiveTab('signals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'signals'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>NEMA Dual-Ring</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'safety'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Vision Zero</span>
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'registry'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ANPR Database</span>
          </button>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5">
          {/* Heatmap Toggle */}
          <button
            onClick={handleToggleHeatmap}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              heatmapMode
                ? 'bg-rose-500/20 border-rose-500/70 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white'
            }`}
            title="Toggle 2D Spatial Density Heatmap"
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Heatmap</span>
          </button>

          {/* Night Vision CLAHE */}
          <button
            onClick={handleToggleNightMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              nightMode
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white'
            }`}
            title="Toggle CLAHE Low-Light Enhancement"
          >
            <Moon className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Night CLAHE</span>
          </button>

          {/* Snapshot */}
          <button
            onClick={() => window.open('/api/v1/stream/snapshot', '_blank')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 text-xs font-semibold transition-all"
            title="Export Full HD Snapshot"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => window.location.href = '/api/v1/stream/export-csv'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-emerald-300 hover:border-emerald-500/50 text-xs font-semibold transition-all"
            title="Export Telemetry CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          TACTICAL SOURCE SELECTOR DOCK
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="h-12 shrink-0 bg-[#060810] border-b border-white/[0.06] px-6 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            Live Stream Feed:
          </span>

          {/* 1. God's Eye 4K Drone */}
          <button
            onClick={selectDroneFeed}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              feedMode === 'drone'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>God's Eye Aerial Drone (4K)</span>
          </button>

          {/* 2. Hardware Webcams */}
          {hwCameras.map((hw) => (
            <button
              key={hw.index}
              onClick={() => selectHardwareCamera(hw.index, hw.name)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                feedMode === 'hardware' && selectedCamIndex === hw.index
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hw.index === 0 ? 'Local Hardware Webcam' : `Camera #${hw.index}`}</span>
            </button>
          ))}

          {/* 3. Connect RTSP / Phone */}
          <button
            onClick={() => setShowStreamModal(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              feedMode === 'network'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Connect RTSP / Phone WiFi</span>
          </button>

          {/* 4. Upload MP4 */}
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleUploadVideo} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              feedMode === 'upload'
                ? 'bg-purple-500/20 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Upload Video</span>
          </button>
        </div>

        {/* Live Diagnostics */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-bold">{activeFeedLabel}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">{totalVehicles} Vehicles Monitored</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MISSION CONTROL (HERO CANOPY & BENTO GRID)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mission' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">

          {/* Left: Expansive Cinematic Video Viewport */}
          <div className="flex-1 flex flex-col rounded-3xl bg-black border border-white/[0.08] overflow-hidden relative shadow-2xl">
            {/* Preemption Emergency Banner */}
            {isEmerg && (
              <div className="shrink-0 flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-black py-2 uppercase tracking-widest animate-pulse z-20 shadow-xl">
                <Siren className="w-4 h-4 text-white animate-spin" />
                🚨 EMERGENCY PREEMPTION ACTIVE ({status?.emergency_type?.toUpperCase()}) — ALL CONFLICTING PHASES HELD RED
              </div>
            )}

            {/* Locked Vehicle Inspector Card */}
            {lockedTargetId !== null && targetCrop && (
              <div className="shrink-0 flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-cyan-950/90 to-[#070b18]/90 border-b border-cyan-500/40 text-xs font-mono z-20 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="font-extrabold text-white">LOCKED TARGET #{targetCrop.track_id}</span>
                  </div>
                  <span className="text-slate-600">|</span>
                  <span className="uppercase text-amber-300 font-bold">{targetCrop.class_name}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400 font-bold">{targetCrop.speed_kmh} km/h</span>
                  <span className="text-slate-600">|</span>
                  <span className="px-2.5 py-0.5 bg-black border border-cyan-400/50 rounded-lg text-white font-bold tracking-widest shadow-inner">
                    {targetCrop.plate}
                  </span>
                </div>
                <button
                  onClick={() => handleLockTarget(null)}
                  className="px-3 py-1 rounded-xl bg-cyan-900/60 hover:bg-cyan-800 text-xs font-bold text-cyan-200 border border-cyan-400 transition-all"
                >
                  DISENGAGE TARGET
                </button>
              </div>
            )}

            {/* MJPEG Live Stream Viewport */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {/* Tactical Corner Brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none z-10" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none z-10" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none z-10" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none z-10" />

              {/* Floating Top Telemetry HUD */}
              <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
                <div className="flex items-center gap-2.5 bg-black/75 backdrop-blur-md border border-white/[0.1] rounded-2xl px-4 py-2 pointer-events-auto shadow-2xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">LIVE HUD</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-xs font-bold text-white">{activeFeedLabel}</span>
                </div>

                <div className="flex items-center gap-3 bg-black/75 backdrop-blur-md border border-white/[0.1] rounded-2xl px-4 py-2 text-xs font-mono text-slate-300 pointer-events-auto shadow-2xl">
                  <span>PHASE: <strong className="text-emerald-400 font-bold">Φ{nema.ring1_phase}+Φ{nema.ring2_phase}</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>LOS: <strong className="text-cyan-400 font-bold">{los} ({losDesc})</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>CYCLE: <strong className="text-amber-400 font-bold">{websterCycle}s</strong></span>
                </div>
              </div>

              {/* Video Element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={streamSrc}
                alt=""
                onLoad={() => {
                  setStreamConnected(true);
                  setStreamError(false);
                }}
                onError={() => {
                  setStreamConnected(false);
                  setStreamError(true);
                }}
                className={`w-full h-full object-contain cursor-crosshair select-none transition-opacity duration-300 ${
                  streamConnected ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ imageRendering: 'crisp-edges' }}
                onClick={() => {
                  if (!lockedTargetId && status?.active_vehicles && status.active_vehicles.length > 0) {
                    handleLockTarget(status.active_vehicles[0].tid);
                  }
                }}
              />

              {/* Connecting / Reconnecting Tactical Overlay */}
              {(!streamConnected || !backendOk) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070a14]/92 backdrop-blur-md z-15 gap-4 p-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping" />
                    <div className="absolute inset-1 rounded-full border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
                    <Radio className="w-7 h-7 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-mono font-bold text-sm tracking-wide mb-1">
                      AURA // CONNECTING LIVE AERIAL FEED
                    </p>
                    <p className="text-slate-400 text-xs font-mono max-w-sm">
                      {streamError
                        ? 'Synchronizing telemetry with God\'s Eye drone stream...'
                        : 'Establishing secure high-throughput RTSP/MJPEG video pipeline...'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setStreamError(false);
                      setStreamSrc(`/api/v1/stream/video?t=${Date.now()}`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    RETRY FEED CONNECTION
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Active Vehicle Ticker */}
            <div className="h-10 shrink-0 bg-[#080B14] border-t border-white/[0.08] px-6 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-bold">{totalVehicles} Vehicles Monitored in Intersection</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Northbound Flow: <strong className="text-cyan-400">{status?.count_up ?? 0}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Southbound Flow: <strong className="text-cyan-400">{status?.count_dn ?? 0}</strong></span>
              </div>
              <span className="text-[11px] text-slate-500">Click any vehicle to engage tracking reticle</span>
            </div>
          </div>

          {/* Right: Modern Telemetry Bento Rail */}
          <aside className="w-full lg:w-96 shrink-0 flex flex-col space-y-4 overflow-y-auto">

            {/* 1. Adaptive Signal Controller Card */}
            <div className="p-5 rounded-3xl bg-[#090C15] border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Signal Controller</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
                  WEBSTER OPTIMIZED
                </span>
              </div>

              {/* 3-Aspect Traffic Signal Halo */}
              <div className="flex items-center justify-around bg-[#05070E] p-4 rounded-2xl border border-white/[0.06] shadow-inner">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full transition-all duration-300 ${
                    phase === 'RED' || phase === 'EMERGENCY'
                      ? 'bg-rose-500 shadow-[0_0_24px_rgba(239,68,68,1)] ring-4 ring-rose-400/40'
                      : 'bg-slate-900 border border-slate-800 opacity-20'
                  }`} />
                  <span className="text-[10px] text-slate-500 font-mono font-bold">RED</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full transition-all duration-300 ${
                    phase === 'YELLOW'
                      ? 'bg-amber-400 shadow-[0_0_24px_rgba(234,179,8,1)] ring-4 ring-amber-300/40'
                      : 'bg-slate-900 border border-slate-800 opacity-20'
                  }`} />
                  <span className="text-[10px] text-slate-500 font-mono font-bold">YEL</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full transition-all duration-300 ${
                    phase === 'GREEN'
                      ? 'bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,1)] ring-4 ring-emerald-300/40'
                      : 'bg-slate-900 border border-slate-800 opacity-20'
                  }`} />
                  <span className="text-[10px] text-slate-500 font-mono font-bold">GRN</span>
                </div>
              </div>

              {/* Phase Timer Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Phase Concurrency</div>
                  <div className="text-sm font-bold text-cyan-300 font-mono">
                    {phase === 'GREEN' ? `Φ${nema.ring1_phase} + Φ${nema.ring2_phase} (Through)` : 'Clearance Phase'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white font-mono">{timer}</span>
                  <span className="text-xs text-slate-400 ml-1 font-mono">sec</span>
                </div>
              </div>

              {/* Webster Formulation Breakdown */}
              <div className="space-y-2 text-xs font-mono text-slate-400 border-t border-white/[0.06] pt-3">
                <div className="flex justify-between">
                  <span>Optimum Cycle Length:</span>
                  <strong className="text-cyan-300 font-bold">{websterCycle}s</strong>
                </div>
                <div className="flex justify-between">
                  <span>Green Phase Split:</span>
                  <strong className="text-emerald-400 font-bold">{status?.green_duration ?? 45}s</strong>
                </div>
                <div className="flex justify-between">
                  <span>Red Clearance Split:</span>
                  <strong className="text-rose-400 font-bold">{status?.red_duration ?? 30}s</strong>
                </div>
              </div>
            </div>

            {/* 2. Capacity & Level of Service (LOS) Card */}
            <div className="p-5 rounded-3xl bg-[#090C15] border border-white/[0.08] shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Capacity & LOS</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">HCM Standard</span>
              </div>

              <div className="flex items-center gap-4">
                <div className={`text-2xl font-black px-3 py-1.5 rounded-2xl border ${
                  los === 'A' || los === 'B' ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300' :
                  los === 'C' ? 'bg-cyan-950/90 border-cyan-500/70 text-cyan-300' :
                  los === 'D' ? 'bg-amber-950/90 border-amber-500/70 text-amber-300' :
                  'bg-rose-950/90 border-rose-500/70 text-rose-300'
                }`}>
                  {los}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{losDesc}</div>
                  <div className="text-xs text-slate-400 font-mono">V/C Ratio: {(status?.saturation_ratio ?? 0.22).toFixed(2)}</div>
                </div>
              </div>

              <div className="w-full bg-[#05070E] h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (status?.saturation_ratio ?? 0.22) > 0.8 ? 'bg-rose-500' :
                    (status?.saturation_ratio ?? 0.22) > 0.6 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((status?.saturation_ratio ?? 0.22) * 100))}%` }}
                />
              </div>
            </div>

            {/* 3. Vision Zero Safety & Carbon Metrics Card */}
            <div className="p-5 rounded-3xl bg-[#090C15] border border-white/[0.08] shadow-2xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Vision Zero & Emissions</h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">TTC Conflicts</div>
                  <div className="text-xl font-black text-amber-300 font-mono">{status?.safety?.near_miss_count ?? 0}</div>
                  <div className="text-[9px] text-slate-500">&lt; 2.0s Near-Miss</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Red Light Breaches</div>
                  <div className="text-xl font-black text-rose-400 font-mono">{status?.safety?.red_light_violations_count ?? 0}</div>
                  <div className="text-[9px] text-slate-500">Radar Enforced</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">CO2 Emitted</div>
                  <div className="text-xl font-black text-slate-200 font-mono">{status?.emissions?.cumulative_co2_kg ?? 14.2} kg</div>
                  <div className="text-[9px] text-slate-500">EPA MOVES3 Idle</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">CO2 Averted</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">+{status?.emissions?.co2_saved_adaptive_kg ?? 3.6} kg</div>
                  <div className="text-[9px] text-emerald-500">Signal Savings</div>
                </div>
              </div>
            </div>

            {/* 4. ANPR Target Inspector Card (when locked) */}
            {targetCrop && (
              <div className="p-5 rounded-3xl bg-cyan-950/30 border border-cyan-500/40 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase text-cyan-200">ANPR Target Inspector</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-900/60 px-2 py-0.5 rounded-lg">
                    #{targetCrop.track_id}
                  </span>
                </div>

                {/* Embossed Indian License Plate */}
                <div className="flex items-center justify-between bg-white text-black px-4 py-2 rounded-xl border-2 border-slate-300 shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-700 flex items-center justify-center text-[7px] text-white font-bold">
                      IND
                    </div>
                  </div>
                  <span className="font-mono text-base font-black tracking-widest">{targetCrop.plate}</span>
                  <span className="text-[9px] text-slate-400 font-bold">RTO</span>
                </div>

                {/* Vehicle & Plate Crops */}
                <div className="grid grid-cols-2 gap-2">
                  {targetCrop.crop_b64 && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.1] bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/jpeg;base64,${targetCrop.crop_b64}`}
                        alt="Vehicle Crop"
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-1 text-[9px] font-mono text-center text-slate-400">VEHICLE CROP</div>
                    </div>
                  )}
                  {targetCrop.plate_crop_b64 && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.1] bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/jpeg;base64,${targetCrop.plate_crop_b64}`}
                        alt="Plate Crop"
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-1 text-[9px] font-mono text-center text-slate-400">PLATE REGION</div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </aside>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 2: NEMA TS2 DUAL-RING CONTROLLER
      ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'signals' && (
        <div className="flex-1 bg-[#060812] p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div>
                <h2 className="text-xl font-black text-white tracking-wide uppercase">NEMA TS2 Dual-Ring 8-Phase Controller</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Dual-Ring Concurrency State Machine with Dynamic Barrier Sync</p>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold">
                BARRIER: {nema.barrier}
              </span>
            </div>

            {/* Swimlanes */}
            <div className="p-6 rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-2xl space-y-6">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Phase Concurrency Diagram</h3>
              <div className="space-y-4 font-mono text-xs">
                {/* Ring 1 */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white">RING 1 (Phases Φ1 – Φ4)</span>
                    <span className="text-emerald-400 font-bold">CURRENT: Φ{nema.ring1_phase} (North-South Through)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-500">Φ1: North Left</div>
                    <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      Φ2: North Through [GREEN]
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-500">Φ3: South Left</div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-500">Φ4: South Through</div>
                  </div>
                </div>

                {/* Barrier */}
                <div className="flex items-center justify-center gap-4 py-2 text-xs text-amber-400 font-bold border-y border-amber-900/50 bg-amber-950/20">
                  <span>━━━━━━━━━━━━━━━━━━</span>
                  <span>COORDINATION BARRIER 1 (NORTH-SOUTH // EAST-WEST)</span>
                  <span>━━━━━━━━━━━━━━━━━━</span>
                </div>

                {/* Ring 2 */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white">RING 2 (Phases Φ5 – Φ8)</span>
                    <span className="text-emerald-400 font-bold">CURRENT: Φ{nema.ring2_phase} (South-North Through)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-500">Φ5: South Left</div>
                    <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      Φ6: South Through [GREEN]
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-500">Φ7: East Left</div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-500">Φ8: East Through</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Webster Formula Mathematical Card */}
            <div className="p-6 rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Webster Minimum Delay Formula</h3>
              <div className="p-5 rounded-2xl bg-black/60 font-mono text-xs leading-relaxed text-slate-300 border border-white/[0.06]">
                <p className="text-emerald-300 font-bold text-sm mb-2">C₀ = (1.5L + 5) / (1 - Y)</p>
                <p>Lost time per cycle <span className="text-cyan-300">L = 12.0 seconds</span></p>
                <p>Intersection saturation ratio <span className="text-cyan-300">Y = Σ yᵢ = {(status?.saturation_ratio ?? 0.22).toFixed(2)}</span></p>
                <p>Optimum Cycle Length Calculated: <span className="text-amber-300 font-bold">{websterCycle} seconds</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 3: VISION ZERO SAFETY & CONFLICT RADAR
      ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'safety' && (
        <div className="flex-1 bg-[#060812] p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div>
                <h2 className="text-xl font-black text-white tracking-wide uppercase">Vision Zero Conflict Radar</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Real-Time Trajectory Convergence & Stop-Line Red Light Violation Logging</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-xl space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">TTC Near-Miss Conflicts</div>
                <div className="text-4xl font-black text-amber-300 font-mono">{status?.safety?.near_miss_count ?? 0}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vehicular trajectory convergence with projected time-to-collision delta &lt; 2.0s.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-xl space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Red Light Breaches</div>
                <div className="text-4xl font-black text-rose-400 font-mono">{status?.safety?.red_light_violations_count ?? 0}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vehicles crossing stop lines during active RED signal with speed &gt; 10 km/h.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-xl space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Speed Limit Breaches</div>
                <div className="text-4xl font-black text-cyan-300 font-mono">{status?.safety?.speed_violations_count ?? 0}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vehicles exceeding intersection corridor speed limit (&gt; 50 km/h).
                </p>
              </div>
            </div>

            {/* Red Light Runner Audit Trail */}
            <div className="p-6 rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Automated Red Light Violation Audit Log</h3>
              {status?.safety?.recent_red_light && status.safety.recent_red_light.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/[0.08] pb-2">
                        <th className="py-2 px-3">TIMESTAMP</th>
                        <th className="py-2 px-3">TRACK ID</th>
                        <th className="py-2 px-3">REGISTRATION PLATE</th>
                        <th className="py-2 px-3">SPEED</th>
                        <th className="py-2 px-3">APPROACH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.safety.recent_red_light.map((r, i) => (
                        <tr key={i} className="border-b border-white/[0.04] text-slate-200">
                          <td className="py-2.5 px-3">{r.timestamp}</td>
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">#{r.track_id}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-300">{r.plate}</td>
                          <td className="py-2.5 px-3 text-rose-400 font-bold">{r.speed_kmh} km/h</td>
                          <td className="py-2.5 px-3 uppercase">{r.approach}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  Zero red light breaches recorded in the current operational cycle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 4: ANPR VEHICLE REGISTRY & ENFORCEMENT
      ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'registry' && (
        <div className="flex-1 bg-[#060812] p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/[0.08] pb-5 gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-wide uppercase">ANPR Vehicle Registry</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Automatic Number Plate Recognition Database & Audit Roster</p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#090C16] border border-white/[0.08] rounded-xl px-3 py-1.5">
                  <Search className="w-4 h-4 text-slate-500 mr-2" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search license plate..."
                    className="bg-transparent text-xs font-mono text-cyan-300 outline-none w-48"
                  />
                </div>

                <select
                  value={rosterClassFilter}
                  onChange={(e) => setRosterClassFilter(e.target.value)}
                  className="bg-[#090C16] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none"
                >
                  <option value="ALL">All Classes</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bus">Bus</option>
                  <option value="truck">Truck</option>
                  <option value="auto_rickshaw">Auto Rickshaw</option>
                </select>
              </div>
            </div>

            {/* Roster Table */}
            <div className="rounded-3xl bg-[#090C16] border border-white/[0.08] shadow-2xl overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 bg-black/40 border-b border-white/[0.08]">
                    <th className="py-3 px-4">TRACK ID</th>
                    <th className="py-3 px-4">INDIAN RTO REGISTRATION</th>
                    <th className="py-3 px-4">CLASS</th>
                    <th className="py-3 px-4">SPEED</th>
                    <th className="py-3 px-4">HEADING</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(status?.active_vehicles || [])
                    .filter((v) => {
                      const matchQ = v.plate.toLowerCase().includes(rosterSearch.toLowerCase());
                      const matchC = rosterClassFilter === 'ALL' || v.cls.toLowerCase() === rosterClassFilter.toLowerCase();
                      return matchQ && matchC;
                    })
                    .map((v) => (
                      <tr key={v.tid} className="border-b border-white/[0.04] hover:bg-white/[0.02] text-slate-200">
                        <td className="py-3 px-4 font-bold text-cyan-400">#{v.tid}</td>
                        <td className="py-3 px-4 font-bold text-amber-300">{v.plate}</td>
                        <td className="py-3 px-4 uppercase">{v.cls}</td>
                        <td className={`py-3 px-4 font-bold ${v.speed > 55 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {v.speed} km/h
                        </td>
                        <td className="py-3 px-4 text-slate-400">{v.direction}</td>
                        <td className="py-3 px-4">
                          {v.violation === 'RED_LIGHT_RUNNER' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                              RED LIGHT RUNNER
                            </span>
                          ) : v.violation === 'SPEED_LIMIT' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
                              SPEEDING
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                              COMPLIANT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              handleLockTarget(v.tid);
                              setActiveTab('mission');
                            }}
                            className="px-3.5 py-1 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold hover:bg-cyan-900 transition-colors"
                          >
                            INSPECT
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CONNECT LIVE CAMERA / RTSP / PLATFORM STREAM MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#090C16] border border-cyan-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#090C16]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Connect Live Video Feed</h3>
                  <p className="text-xs text-slate-400">Directly ingest hardware webcams, smartphones, or network RTSP streams.</p>
                </div>
              </div>
              <button
                onClick={() => setShowStreamModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Hardware Cameras */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Direct Hardware Cameras</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/60 font-semibold">
                    {hwCameras.length} DETECTED
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  {hwCameras.map((hw) => (
                    <button
                      key={hw.index}
                      onClick={() => selectHardwareCamera(hw.index, hw.name)}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/[0.08] hover:border-emerald-400 hover:bg-emerald-950/20 text-left transition-all group"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                          {hw.index === 0 ? 'Primary System Camera' : `Camera #${hw.index}`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">{hw.name}</div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-[10px] font-mono font-bold text-cyan-400 group-hover:text-emerald-300">
                        CAM {hw.index}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Smartphone IP Webcam (WiFi) */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Connect Phone Camera (WiFi)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 mb-3 bg-black/40 p-3 rounded-xl border border-white/[0.04] leading-relaxed">
                  <p>1. Install the free <strong className="text-cyan-300">IP Webcam</strong> app on Android or iOS.</p>
                  <p>2. Connect your phone to the same WiFi and tap <strong className="text-cyan-300">Start Server</strong>.</p>
                  <p>3. Enter the URL shown on your phone screen:</p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-black border border-white/[0.1] rounded-xl px-3 py-2 focus-within:border-cyan-500">
                    <span className="text-slate-500 text-xs font-mono mr-1">http://</span>
                    <input
                      type="text"
                      value={phoneIp}
                      onChange={(e) => setPhoneIp(e.target.value)}
                      placeholder="192.168.1.100:8080"
                      className="w-full bg-transparent text-xs font-mono text-cyan-300 outline-none"
                    />
                    <span className="text-slate-500 text-xs font-mono ml-1">/video</span>
                  </div>
                  <button
                    onClick={() => {
                      const host = phoneIp.trim();
                      const fullUrl = host.startsWith('http') ? host : `http://${host}/video`;
                      connectNetworkStream(fullUrl);
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all whitespace-nowrap"
                  >
                    Connect Phone
                  </button>
                </div>
              </div>

              {/* Network RTSP / HLS Stream */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Network RTSP / HLS Stream</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRtspUrl}
                    onChange={(e) => setCustomRtspUrl(e.target.value)}
                    placeholder="rtsp://admin:password@192.168.1.50:554/live or http://..."
                    className="flex-1 bg-black border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-amber-300 outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => connectNetworkStream(customRtspUrl)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all whitespace-nowrap"
                  >
                    Connect Stream
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] bg-black/60 flex items-center justify-end">
              <button
                onClick={() => setShowStreamModal(false)}
                className="px-5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
