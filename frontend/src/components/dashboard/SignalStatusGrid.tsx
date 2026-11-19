'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrafficCone, Cpu, Timer, Zap, CheckCircle2 } from "lucide-react";

interface DelhiSignal {
  id: number;
  intersection: string;
  location: string;
  phase: 'GREEN' | 'YELLOW' | 'RED' | 'EMERGENCY';
  phaseText: string;
  redStoppage: number;
  greenClearance: number;
  remainingSeconds: number;
  aiAppliedChange: string;
}

const INITIAL_SIGNALS: DelhiSignal[] = [
  {
    id: 1,
    intersection: 'ITO Crossroad Junction',
    location: 'Vikas Marg & DDU Marg, Delhi',
    phase: 'EMERGENCY',
    phaseText: '🚨 EMERGENCY HOLD (Ambulance)',
    redStoppage: 10,
    greenClearance: 65,
    remainingSeconds: 65,
    aiAppliedChange: '⚡ Ambulance Priority 1: Red Stoppage cut from 45s to 10s',
  },
  {
    id: 2,
    intersection: 'Connaught Place Radial 1',
    location: 'Janpath & Inner Circle, Delhi',
    phase: 'GREEN',
    phaseText: 'Green Signal Active',
    redStoppage: 40,
    greenClearance: 35,
    remainingSeconds: 22,
    aiAppliedChange: '⚡ Density 45%: Applied Standard Stoppage 40s Red / 35s Green',
  },
  {
    id: 3,
    intersection: 'Dhaula Kuan Interchange',
    location: 'NH-48 & Ring Road, Delhi',
    phase: 'RED',
    phaseText: 'Red Stoppage Active',
    redStoppage: 15,
    greenClearance: 75,
    remainingSeconds: 12,
    aiAppliedChange: '⚡ Heavy Jam (92%): Reduced Red Stoppage from 45s to 15s',
  },
  {
    id: 4,
    intersection: 'AIIMS Flyover Signal',
    location: 'Aurobindo Marg, Delhi',
    phase: 'YELLOW',
    phaseText: 'Phase Caution Yellow',
    redStoppage: 35,
    greenClearance: 40,
    remainingSeconds: 4,
    aiAppliedChange: '⚡ Balanced Flow: Applied Stoppage 35s Red / 40s Green',
  },
];

export function SignalStatusGrid() {
  const [signals, setSignals] = useState<DelhiSignal[]>(INITIAL_SIGNALS);

  // Live countdown and real-time stoppage time adjustment loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSignals((prevSignals) =>
        prevSignals.map((sig) => {
          let newRem = sig.remainingSeconds - 1;
          let newPhase = sig.phase;
          let newText = sig.phaseText;
          let newRed = sig.redStoppage;
          let newGreen = sig.greenClearance;
          let newChange = sig.aiAppliedChange;

          if (newRem <= 0) {
            if (sig.phase === 'GREEN') {
              newPhase = 'YELLOW';
              newText = 'Yellow Caution';
              newRem = 5;
            } else if (sig.phase === 'YELLOW') {
              newPhase = 'RED';
              newText = 'Red Stoppage Active';
              newRem = newRed; // Apply recalculated Red Stoppage time!
            } else {
              newPhase = 'GREEN';
              newText = 'Green Signal Active';
              newRem = newGreen; // Apply recalculated Green Clearance time!
            }
          }

          return {
            ...sig,
            phase: newPhase,
            phaseText: newText,
            remainingSeconds: newRem,
            redStoppage: newRed,
            greenClearance: newGreen,
            aiAppliedChange: newChange,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <TrafficCone className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-sm">Live Adaptive Signal Controllers</h3>
        </div>
        <Badge variant="outline" className="text-[10px] bg-slate-800 text-emerald-400 border-emerald-500/30 font-semibold flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Applied Live
        </Badge>
      </div>

      <div className="grid gap-3">
        {signals.map((sig) => {
          const isGreen = sig.phase === 'GREEN';
          const isYellow = sig.phase === 'YELLOW';
          const isRed = sig.phase === 'RED';
          const isEmerg = sig.phase === 'EMERGENCY';

          return (
            <Card
              key={sig.id}
              className={`bg-slate-900/90 backdrop-blur border transition-all duration-300 ${
                isEmerg
                  ? 'border-rose-500/80 shadow-lg shadow-rose-950/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <CardContent className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-100 text-xs truncate">{sig.intersection}</p>
                    {isEmerg && (
                      <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 font-bold animate-pulse">
                        EMERGENCY
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mb-1.5">{sig.location}</p>

                  {/* Applied Stoppage & Clearance Badges */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/80 border border-rose-900 px-1.5 py-0.5 rounded">
                      Red Stoppage: {sig.redStoppage}s
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-900 px-1.5 py-0.5 rounded">
                      Green Clear: {sig.greenClearance}s
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{sig.aiAppliedChange}</span>
                  </div>
                </div>

                {/* Vertical Traffic Light Lamp */}
                <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      isRed || isEmerg
                        ? 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse'
                        : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      isYellow
                        ? 'bg-amber-500 shadow-[0_0_12px_rgba(234,179,8,0.9)] animate-pulse'
                        : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-300 ${
                      isGreen
                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span className="text-xs font-mono font-bold text-white mt-0.5">{sig.remainingSeconds}s</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
