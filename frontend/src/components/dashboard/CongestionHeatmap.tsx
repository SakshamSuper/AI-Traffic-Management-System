import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CongestionHeatmap() {
  return (
    <Card className="col-span-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Congestion Heatmap (Last 24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
          [Heatmap Chart Placeholder]
        </div>
      </CardContent>
    </Card>
  )
}
