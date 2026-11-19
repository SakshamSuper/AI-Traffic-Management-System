"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CameraCard } from "@/components/cameras/CameraCard"
import { AddCameraDialog } from "@/components/cameras/AddCameraDialog"

export default function CamerasPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Live Cameras</h1>
        <AddCameraDialog />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CameraCard />
        <CameraCard />
        <CameraCard />
      </div>
    </DashboardLayout>
  )
}
