"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>
      <AlertsPanel />
    </DashboardLayout>
  )
}
