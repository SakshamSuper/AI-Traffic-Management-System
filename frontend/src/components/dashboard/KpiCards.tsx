'use client';

import { Car, Gauge, Camera, Bell, Siren, ArrowUpRight, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCards() {
  const kpis = [
    { title: "Delhi NCR Vehicles", value: "48,920", icon: Car, subtitle: "Today's Count", trend: "+8.4%", color: "text-blue-400 bg-blue-500/10" },
    { title: "Peak Congestion", value: "78%", icon: Gauge, subtitle: "ITO Corridor", trend: "+5%", color: "text-amber-400 bg-amber-500/10" },
    { title: "Active Cameras", value: "4/4", icon: Camera, subtitle: "Delhi NCR Streams", trend: "100%", color: "text-emerald-400 bg-emerald-500/10" },
    { title: "Active Incidents", value: "3", icon: Bell, subtitle: "Auto & Bus Slowdowns", trend: "-1", color: "text-orange-400 bg-orange-500/10" },
    { title: "Avg Speed", value: "32 km/h", icon: Navigation, subtitle: "Ring Road Average", trend: "+2 km/h", color: "text-indigo-400 bg-indigo-500/10" },
    { title: "Emergency Preemption", value: "1 Active", icon: Siren, subtitle: "Ambulance Hold (ITO)", trend: "Priority 1", color: "text-rose-400 bg-rose-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 mb-2">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <Card key={i} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-slate-900/80 backdrop-blur border-slate-800">
            <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">{kpi.title}</p>
                <div className={`p-2 rounded-xl ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 tracking-tight">{kpi.value}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{kpi.subtitle}</p>
              </div>
              <div className="flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                {kpi.trend}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
