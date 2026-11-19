"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { VehicleTypeDonut } from "@/components/charts/VehicleTypeDonut"
import { CongestionTimeline } from "@/components/charts/CongestionTimeline"
import { QueueLengthChart } from "@/components/charts/QueueLengthChart"
import { SpeedDistribution } from "@/components/charts/SpeedDistribution"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VehicleTypeDonut />
        <CongestionTimeline />
        <QueueLengthChart />
        <SpeedDistribution />
      </div>
    </DashboardLayout>
  )
}
