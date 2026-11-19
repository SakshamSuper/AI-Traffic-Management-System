import { create } from 'zustand';
import { Camera, TrafficMetrics, SignalState, Alert, DashboardData } from '@/types';

interface TrafficState {
  cameras: Camera[];
  cameraMetrics: Record<string, TrafficMetrics>;
  signals: Record<string, SignalState>;
  alerts: Alert[];
  dashboard: DashboardData | null;
  selectedCameraId: string | null;
  isConnected: boolean;
  
  setCameras: (cameras: Camera[]) => void;
  updateCamera: (camera: Camera) => void;
  updateCameraMetrics: (cameraId: string, metrics: TrafficMetrics) => void;
  setSignals: (signals: Record<string, SignalState>) => void;
  updateSignal: (signal: SignalState) => void;
  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  acknowledgeAlert: (alertId: string) => void;
  setDashboard: (data: DashboardData) => void;
  selectCamera: (id: string | null) => void;
  setConnected: (v: boolean) => void;
}

export const useTrafficStore = create<TrafficState>((set) => ({
  cameras: [],
  cameraMetrics: {},
  signals: {},
  alerts: [],
  dashboard: null,
  selectedCameraId: null,
  isConnected: false,

  setCameras: (cameras) => set({ cameras }),
  
  updateCamera: (camera) => set((state) => ({
    cameras: state.cameras.map(c => c.id === camera.id ? camera : c)
  })),
  
  updateCameraMetrics: (cameraId, metrics) => set((state) => ({
    cameraMetrics: { ...state.cameraMetrics, [cameraId]: metrics }
  })),
  
  setSignals: (signals) => set({ signals }),
  
  updateSignal: (signal) => set((state) => ({
    signals: { ...state.signals, [signal.camera_id]: signal }
  })),
  
  addAlert: (alert) => set((state) => {
    const exists = state.alerts.some(a => a.id === alert.id);
    if (exists) return state;
    return { alerts: [alert, ...state.alerts].slice(0, 100) }; // Keep last 100 alerts
  }),
  
  setAlerts: (alerts) => set({ alerts }),
  
  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map(a => 
      a.id === alertId ? { ...a, is_acknowledged: true } : a
    )
  })),
  
  setDashboard: (data) => set({ dashboard: data }),
  
  selectCamera: (id) => set({ selectedCameraId: id }),
  
  setConnected: (v) => set({ isConnected: v }),
}));
