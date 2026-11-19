"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SignalStatusGrid } from "@/components/dashboard/SignalStatusGrid"

export default function SignalsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Traffic Signals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SignalStatusGrid />
      </div>
    </DashboardLayout>
  )
}
