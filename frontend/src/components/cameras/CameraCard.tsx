import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Square, Settings } from "lucide-react"

export function CameraCard() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <div className="aspect-video bg-black relative">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Signal</div>
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="success">Online</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">Main St - North</h3>
            <p className="text-sm text-muted-foreground">RTSP / 1080p</p>
          </div>
          <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant="default" className="w-full" size="sm"><Play className="w-4 h-4 mr-2"/> Start</Button>
          <Button variant="outline" className="w-full" size="sm"><Square className="w-4 h-4 mr-2"/> Stop</Button>
        </div>
      </CardContent>
    </Card>
  )
}
