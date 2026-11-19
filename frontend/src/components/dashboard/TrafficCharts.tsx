'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTrafficStore } from '@/store/traffic';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

// Color palette
const COLORS = {
  indigo: '#6366f1',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
};

const VEHICLE_COLORS: Record<string, string> = {
  car: COLORS.indigo,
  motorcycle: COLORS.violet,
  bus: COLORS.cyan,
  truck: COLORS.amber,
  bicycle: COLORS.emerald,
  pedestrian: COLORS.slate,
};

interface ChartDataPoint {
  time: string;
  congestion: number;
  vehicles: number;
  speed: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold ml-auto pl-4">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function TrafficCharts() {
  const { cameraMetrics, cameras } = useTrafficStore();
  const [chartHistory, setChartHistory] = useState<ChartDataPoint[]>([]);

  // Build rolling time-series from live metrics
  useEffect(() => {
    const now = new Date();
    const metrics = Object.values(cameraMetrics);
    if (metrics.length === 0) return;

    const avgCongestion = metrics.reduce((s, m) => s + m.congestion_score, 0) / metrics.length;
    const totalVehicles = metrics.reduce((s, m) => s + m.total_vehicles, 0);
    const avgSpeed = metrics.reduce((s, m) => s + m.avg_speed, 0) / metrics.length;

    const newPoint: ChartDataPoint = {
      time: format(now, 'HH:mm:ss'),
      congestion: Math.round(avgCongestion),
      vehicles: totalVehicles,
      speed: Math.round(avgSpeed),
    };

    setChartHistory(prev => {
      const updated = [...prev, newPoint];
      return updated.slice(-30); // Keep last 30 data points
    });
  }, [cameraMetrics]);

  // Vehicle type breakdown (aggregate from all cameras)
  const vehicleBreakdown = Object.values(cameraMetrics).reduce((acc, m) => {
    for (const [type, count] of Object.entries(m.vehicle_counts ?? {})) {
      acc[type] = (acc[type] ?? 0) + (count as number);
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(vehicleBreakdown)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ name: type, value: count }));

  // Demo data if no real metrics yet
  const displayData = chartHistory.length >= 2 ? chartHistory : Array.from({ length: 20 }, (_, i) => ({
    time: format(new Date(Date.now() - (19 - i) * 10000), 'HH:mm:ss'),
    congestion: 20 + Math.random() * 40,
    vehicles: Math.floor(10 + Math.random() * 25),
    speed: 25 + Math.random() * 30,
  }));

  return (
    <div className="space-y-4">
      {/* Congestion timeline */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-slate-100 font-semibold text-sm">Live Traffic Flow</h3>
          <span className="ml-auto text-slate-600 text-xs">Last 30 readings</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <defs>
              <linearGradient id="congGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="congestion" stroke={COLORS.indigo} fill="url(#congGrad)" strokeWidth={2} name="Congestion %" dot={false} />
            <Area type="monotone" dataKey="speed" stroke={COLORS.emerald} fill="url(#speedGrad)" strokeWidth={2} name="Speed km/h" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle count bar chart */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
          <h3 className="text-slate-100 font-semibold text-sm mb-4">Vehicles per Interval</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={displayData.slice(-12)} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vehicles" fill={COLORS.violet} radius={[4, 4, 0, 0]} name="Vehicles" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle type pie chart */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
          <h3 className="text-slate-100 font-semibold text-sm mb-4">Vehicle Type Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map(entry => (
                    <Cell
                      key={entry.name}
                      fill={VEHICLE_COLORS[entry.name] ?? COLORS.slate}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'capitalize' }}>
                      {value}
                    </span>
                  )}
                />
                <Tooltip
                  formatter={(value, name) => [value, String(name).toUpperCase()]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-slate-600 text-sm">
              Waiting for detection data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
