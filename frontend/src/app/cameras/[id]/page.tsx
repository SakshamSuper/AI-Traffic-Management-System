"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CameraPlayer } from "@/components/cameras/CameraPlayer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CameraDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Camera {params.id}</h1>
        <CameraPlayer />
        <Tabs defaultValue="live">
          <TabsList>
            <TabsTrigger value="live">Live Feed</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="p-4 border rounded-xl mt-4">Live details</TabsContent>
          <TabsContent value="analytics" className="p-4 border rounded-xl mt-4">Charts here</TabsContent>
          <TabsContent value="config" className="p-4 border rounded-xl mt-4">Settings form</TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
