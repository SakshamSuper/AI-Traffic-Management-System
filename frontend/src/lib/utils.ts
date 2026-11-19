import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  try {
    return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
  } catch (error) {
    return date;
  }
}

export function formatRelativeTime(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return date;
  }
}

export function getCongestionColor(score: number): string {
  if (score < 30) return 'text-success';
  if (score < 60) return 'text-warning';
  if (score < 85) return 'text-orange-500';
  return 'text-danger';
}

export function getCongestionLabel(level: string): string {
  const levels: Record<string, string> = {
    free_flow: 'Free Flow',
    light: 'Light Traffic',
    moderate: 'Moderate',
    heavy: 'Heavy Traffic',
    standstill: 'Standstill'
  };
  return levels[level] || level;
}

export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getSignalColor(phase: string): string {
  switch (phase.toLowerCase()) {
    case 'green': return 'bg-traffic-green';
    case 'yellow': return 'bg-traffic-yellow';
    case 'red': return 'bg-traffic-red';
    case 'emergency': return 'bg-blue-500 animate-pulse';
    default: return 'bg-gray-500';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-danger text-danger-foreground border-danger/50';
    case 'high': return 'bg-orange-500 text-white border-orange-500/50';
    case 'medium': return 'bg-warning text-warning-foreground border-warning/50';
    case 'low': return 'bg-blue-500 text-white border-blue-500/50';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
