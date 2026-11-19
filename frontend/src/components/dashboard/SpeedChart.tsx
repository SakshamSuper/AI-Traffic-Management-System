import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SpeedChart() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Average Speed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
          [Area Chart Placeholder]
        </div>
      </CardContent>
    </Card>
  )
}
