import { useEffect, useState, useCallback } from 'react';
import { useTrafficStore } from '@/store/traffic';
import { useWebSocket } from './useWebSocket';
import { wsChannels } from '@/lib/websocket';
import { cameraApi, analyticsApi, signalApi, alertApi } from '@/lib/api';
import toast from 'react-hot-toast';

export function useTrafficData() {
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    cameras, 
    cameraMetrics, 
    signals, 
    alerts, 
    dashboard,
    setCameras,
    updateCameraMetrics,
    updateSignal,
    setSignals,
    addAlert,
    setAlerts,
    setDashboard,
    setConnected
  } = useTrafficStore();

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedCameras, overview, signalsData, recentAlerts] = await Promise.all([
        cameraApi.list(),
        analyticsApi.getOverview(),
        signalApi.list(),
        alertApi.list({ limit: 50 })
      ]);

      setCameras(fetchedCameras);
      setDashboard(overview);
      
      const signalsMap = signalsData.reduce((acc, curr) => ({ ...acc, [curr.camera_id]: curr }), {});
      setSignals(signalsMap);
      
      setAlerts(recentAlerts);
    } catch (error) {
      console.error("Failed to fetch initial traffic data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [setCameras, setDashboard, setSignals, setAlerts]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Connect to global dashboard channel for high-level updates
  const { isConnected } = useWebSocket(wsChannels.DASHBOARD, {
    onMessage: (msg) => {
      switch (msg.type) {
        case 'metrics_update':
          if (msg.camera_id && msg.data) {
            updateCameraMetrics(msg.camera_id, msg.data as any);
          }
          break;
        case 'signal_update':
          if (msg.data) {
            updateSignal(msg.data as any);
          }
          break;
        case 'new_alert':
          if (msg.data) {
            addAlert(msg.data as any);
            toast.error(`Alert: ${(msg.data as any).title}`);
          }
          break;
        case 'dashboard_summary':
          if (msg.data) {
            setDashboard(msg.data as any);
          }
          break;
      }
    },
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false)
  });

  return {
    cameras,
    metrics: cameraMetrics,
    signals,
    alerts,
    dashboard,
    isLoading,
    refetch: fetchInitialData,
    isConnected
  };
}
