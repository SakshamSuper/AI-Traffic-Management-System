import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function AddCameraDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Camera</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Camera</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Camera Name</Label>
            <Input id="name" placeholder="Main St Intersection" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">RTSP URL</Label>
            <Input id="url" placeholder="rtsp://..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Camera</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
