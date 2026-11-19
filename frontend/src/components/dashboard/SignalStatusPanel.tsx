'use client';

import { useTrafficStore } from '@/store/traffic';
import { cn } from '@/lib/utils';
import { TrafficCone } from 'lucide-react';

const PHASE_CONFIG = {
  green: {
    label: 'GO',
    bg: 'bg-emerald-500/20 border-emerald-500/40',
    lightActive: 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
    lightRed: 'bg-slate-700',
    lightYellow: 'bg-slate-700',
    textColor: 'text-emerald-400',
  },
  yellow: {
    label: 'WAIT',
    bg: 'bg-amber-500/20 border-amber-500/40',
    lightActive: 'bg-amber-500 shadow-lg shadow-amber-500/50',
    lightRed: 'bg-slate-700',
    lightYellow: 'bg-amber-500 shadow-lg shadow-amber-500/50',
    textColor: 'text-amber-400',
  },
  red: {
    label: 'STOP',
    bg: 'bg-rose-500/20 border-rose-500/40',
    lightActive: 'bg-rose-500 shadow-lg shadow-rose-500/50',
    lightRed: 'bg-rose-500 shadow-lg shadow-rose-500/50',
    lightYellow: 'bg-slate-700',
    textColor: 'text-rose-400',
  },
  emergency: {
    label: '🚨 EMERG',
    bg: 'bg-rose-900/30 border-rose-500/60',
    lightActive: 'bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50',
    lightRed: 'bg-rose-500 animate-ping',
    lightYellow: 'bg-amber-500 animate-ping',
    textColor: 'text-rose-300',
  },
};

interface SignalLightProps {
  phase: string;
  intersectionName: string;
  cameraName: string;
  nextPhaseAt?: string;
  isManualOverride?: boolean;
  emergencyPreemption?: boolean;
}

function SignalLight({ phase, intersectionName, cameraName, nextPhaseAt, isManualOverride, emergencyPreemption }: SignalLightProps) {
  const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG] ?? PHASE_CONFIG.red;

  // Calculate seconds until next phase
  const secondsUntil = nextPhaseAt
    ? Math.max(0, Math.round((new Date(nextPhaseAt).getTime() - Date.now()) / 1000))
    : 0;

  return (
    <div className={cn('rounded-xl border p-4 flex items-center gap-4 transition-all', config.bg)}>
      {/* Traffic light visual */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center gap-2 p-2.5 shrink-0">
        {/* Red */}
        <div className={cn(
          'w-7 h-7 rounded-full transition-all duration-500',
          phase === 'red' || phase === 'emergency' ? config.lightRed : 'bg-slate-700/50'
        )} />
        {/* Yellow */}
        <div className={cn(
          'w-7 h-7 rounded-full transition-all duration-500',
          phase === 'yellow' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-slate-700/50'
        )} />
        {/* Green */}
        <div className={cn(
          'w-7 h-7 rounded-full transition-all duration-500',
          phase === 'green' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-700/50'
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-slate-300 text-xs font-medium truncate">{intersectionName}</p>
        <p className="text-slate-500 text-[10px] truncate mb-1">{cameraName}</p>
        <div className={cn('text-base font-black leading-tight', config.textColor)}>
          {config.label}
        </div>
        {secondsUntil > 0 && (
          <p className="text-slate-500 text-[10px]">
            Changes in <span className="text-slate-300 font-mono">{secondsUntil}s</span>
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="shrink-0 flex flex-col gap-1">
        {isManualOverride && (
          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
            MANUAL
          </span>
        )}
        {emergencyPreemption && (
          <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold animate-pulse">
            PREEMPT
          </span>
        )}
      </div>
    </div>
  );
}

export function SignalStatusPanel() {
  const { signals, cameras } = useTrafficStore();

  const getCameraName = (cameraId: string) =>
    cameras.find(c => c.id === cameraId)?.name ?? 'Unknown';

  const signalEntries = Object.values(signals);

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <TrafficCone className="w-4 h-4 text-amber-400" />
        <h3 className="text-slate-100 font-semibold text-sm">Signal Status</h3>
        <span className="ml-auto text-slate-600 text-xs">{signalEntries.length} intersections</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {signalEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-600">
            <TrafficCone className="w-8 h-8" />
            <p className="text-sm">No signals configured</p>
          </div>
        ) : (
          signalEntries.map(signal => (
            <SignalLight
              key={signal.camera_id}
              phase={signal.current_phase}
              intersectionName={signal.intersection_name}
              cameraName={getCameraName(signal.camera_id)}
              nextPhaseAt={signal.next_phase_at}
              isManualOverride={signal.is_manual_override}
              emergencyPreemption={signal.emergency_preemption}
            />
          ))
        )}
      </div>
    </div>
  );
}
