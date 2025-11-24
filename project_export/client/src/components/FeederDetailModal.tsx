import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Battery, TrendingUp, Clock, MapPin } from "lucide-react";
import DERCard from "./DERCard";

interface FeederDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeder?: {
    id: string;
    name: string;
    substationName: string;
    currentLoad: number;
    capacity: number;
    status: "normal" | "warning" | "critical";
    criticality: "critical" | "high" | "medium" | "low";
    location?: string;
    connectedDERs: number;
  };
}

export default function FeederDetailModal({ open, onOpenChange, feeder }: FeederDetailModalProps) {
  if (!feeder) return null;

  const loadPercentage = (feeder.currentLoad / feeder.capacity) * 100;
  
  // TODO: remove mock data
  const mockDERs = [
    {
      id: "DER-101",
      type: "battery" as const,
      name: "Battery Storage Unit A",
      capacity: 15,
      currentOutput: 8.5,
      status: "active" as const,
      owner: "Community Energy Co-op",
      available: true
    },
    {
      id: "DER-102",
      type: "ev" as const,
      name: "EV Charging Hub",
      capacity: 50,
      currentOutput: 0,
      status: "idle" as const,
      owner: "Transport Authority",
      available: true
    },
    {
      id: "DER-103",
      type: "demand_response" as const,
      name: "Office HVAC Control",
      capacity: 25,
      currentOutput: 0,
      status: "idle" as const,
      owner: "Commercial Building",
      available: true
    }
  ];

  const mockHistory = [
    { time: "12 mins ago", event: "Load spike detected - 92.1%", type: "warning" },
    { time: "1 hour ago", event: "DER activation completed - 8 resources", type: "success" },
    { time: "2 hours ago", event: "Routine capacity check performed", type: "info" },
    { time: "4 hours ago", event: "Peak demand forecast updated", type: "info" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-feeder-detail">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl">{feeder.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {feeder.substationName}
                {feeder.location && ` - ${feeder.location}`}
              </DialogDescription>
            </div>
            <Badge
              variant={
                feeder.criticality === "critical" ? "destructive" :
                feeder.criticality === "high" ? "default" :
                "secondary"
              }
            >
              {feeder.criticality.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ders">DERs ({mockDERs.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Current Load</span>
                </div>
                <p className="text-2xl font-bold font-mono">{feeder.currentLoad} MW</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Capacity</span>
                </div>
                <p className="text-2xl font-bold font-mono">{feeder.capacity} MW</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Utilization</span>
                </div>
                <p className="text-2xl font-bold font-mono">{loadPercentage.toFixed(1)}%</p>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Load Profile (Last 24 Hours)</h4>
              <div className="space-y-2">
                <Progress value={loadPercentage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 MW</span>
                  <span>{feeder.capacity} MW</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Peak load today: {(feeder.capacity * 0.95).toFixed(1)} MW at 14:30
              </p>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-2">Connected Resources</h4>
              <p className="text-sm text-muted-foreground">
                {feeder.connectedDERs} DERs connected • {mockDERs.filter(d => d.status === "active").length} currently active
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="ders" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockDERs.map((der) => (
                <DERCard
                  key={der.id}
                  {...der}
                  onActivate={() => console.log(`Activate ${der.id}`)}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="default" data-testid="button-activate-all-ders">
                Activate All Available DERs
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="p-4">
              <div className="space-y-3">
                {mockHistory.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{item.event}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                    <Badge variant={
                      item.type === "warning" ? "destructive" :
                      item.type === "success" ? "default" :
                      "secondary"
                    } className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on current load patterns and forecasted demand, I recommend activating 3 DER resources
                    to reduce load by approximately 15 MW, bringing utilization down to 76%.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm p-2 bg-muted rounded-md">
                      <span>Battery Storage Unit A</span>
                      <span className="font-mono">-8.5 MW</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-muted rounded-md">
                      <span>Office HVAC Control</span>
                      <span className="font-mono">-4.0 MW</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-muted rounded-md">
                      <span>EV Charging Deferment</span>
                      <span className="font-mono">-2.5 MW</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" data-testid="button-activate-recommended">
                    Activate Recommended DERs via Beckn Protocol
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
