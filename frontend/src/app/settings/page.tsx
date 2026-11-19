"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="p-4 border rounded-xl mt-4">Account Settings</TabsContent>
        <TabsContent value="system" className="p-4 border rounded-xl mt-4">System Settings</TabsContent>
        <TabsContent value="ai" className="p-4 border rounded-xl mt-4">AI Model Config</TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
