'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Siren, Clock, AlertCircle } from "lucide-react";

interface DelhiAlert {
  id: number;
  title: string;
  location: string;
  time: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  icon: 'siren' | 'triangle' | 'circle';
}

const DELHI_ALERTS: DelhiAlert[] = [
  {
    id: 1,
    title: 'Emergency Vehicle (Ambulance DL 01 AM 9999)',
    location: 'ITO Junction - Vikas Marg, Delhi',
    time: 'Just now',
    severity: 'CRITICAL',
    icon: 'siren',
  },
  {
    id: 2,
    title: 'Heavy Traffic Standstill (82% Congestion)',
    location: 'Dhaula Kuan Interchange - NH-48, Delhi',
    time: '3 mins ago',
    severity: 'HIGH',
    icon: 'triangle',
  },
  {
    id: 3,
    title: 'DTC Bus Lane Slowdown',
    location: 'Connaught Place - Janpath Radial, Delhi',
    time: '7 mins ago',
    severity: 'MEDIUM',
    icon: 'circle',
  },
];

export function AlertsPanel() {
  return (
    <Card className="h-full bg-slate-900/80 backdrop-blur border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span>🚨 Live Incident Alerts</span>
        </CardTitle>
        <Badge variant="destructive" className="bg-rose-600 text-white text-[10px] animate-pulse">
          3 Active
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-800 max-h-[350px] overflow-y-auto">
          {DELHI_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 hover:bg-slate-800/40 transition-colors flex gap-3 border-l-4 ${
                alert.severity === 'CRITICAL'
                  ? 'border-l-rose-500 bg-rose-950/20'
                  : alert.severity === 'HIGH'
                  ? 'border-l-orange-500'
                  : 'border-l-amber-500'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.severity === 'CRITICAL' ? (
                  <Siren className="w-4 h-4 text-rose-400 animate-pulse" />
                ) : alert.severity === 'HIGH' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-xs font-semibold text-slate-100 truncate">{alert.title}</p>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{alert.location}</p>
                <div className="flex items-center text-[10px] text-slate-500 mt-1">
                  <Clock className="w-3 h-3 mr-1" /> {alert.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
