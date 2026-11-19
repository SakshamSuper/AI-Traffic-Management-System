'use client';

import { useTrafficStore } from '@/store/traffic';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Siren, AlertCircle, Info, CheckCircle, X } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: {
    icon: Siren,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    dot: 'bg-rose-500',
    label: 'CRITICAL',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
    dot: 'bg-orange-500',
    label: 'HIGH',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-500',
    label: 'MED',
  },
  low: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    dot: 'bg-blue-400',
    label: 'LOW',
  },
} as const;

const TYPE_ICONS: Record<string, string> = {
  emergency_vehicle: '🚨',
  congestion: '🚦',
  accident: '💥',
  debris: '⚠️',
  wrong_way: '⛔',
  animal: '🦊',
  manual: '📋',
};

export function AlertsFeed() {
  const { alerts, cameras, acknowledgeAlert } = useTrafficStore();

  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 12);

  const getCameraName = (cameraId: string) =>
    cameras.find(c => c.id === cameraId)?.name ?? 'Unknown Camera';

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-100 font-semibold text-sm">Alert Feed</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-slate-500 text-xs">Live</span>
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
        {sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <p className="text-slate-400 text-sm">All clear — no active alerts</p>
          </div>
        ) : (
          sortedAlerts.map(alert => {
            const severity = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
            const Icon = severity.icon;
            const typeIcon = TYPE_ICONS[alert.type] ?? '⚠️';

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex gap-3 p-3 rounded-xl border transition-all duration-200',
                  alert.is_acknowledged
                    ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                    : severity.bg
                )}
              >
                {/* Severity icon */}
                <div className={cn('mt-0.5 shrink-0', severity.color)}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-0.5">
                    <span className="text-sm">{typeIcon}</span>
                    <p className={cn(
                      'text-xs font-semibold leading-tight',
                      alert.is_acknowledged ? 'text-slate-400' : 'text-slate-100'
                    )}>
                      {alert.title}
                    </p>
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded border ml-auto shrink-0',
                      severity.bg, severity.color
                    )}>
                      {severity.label}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px] truncate">{getCameraName(alert.camera_id)}</p>
                  <p className="text-slate-600 text-[10px]">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Acknowledge button */}
                {!alert.is_acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-200 transition-colors p-0.5"
                    title="Acknowledge"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {alerts.length > 12 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <a href="/alerts" className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
            View all {alerts.length} alerts →
          </a>
        </div>
      )}
    </div>
  );
}
