import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface FeederCardProps {
  id: string;
  name: string;
  substationName: string;
  currentLoad: number;
  capacity: number;
  status: "normal" | "warning" | "critical";
  criticality: "critical" | "high" | "medium" | "low";
  connectedDERs: number;
  onViewDetails?: () => void;
  onActivateDERs?: () => void;
}

export default function FeederCard({
  id,
  name,
  substationName,
  currentLoad,
  capacity,
  status,
  criticality,
  connectedDERs,
  onViewDetails,
  onActivateDERs
}: FeederCardProps) {
  const loadPercentage = (currentLoad / capacity) * 100;
  
  const statusConfig = {
    normal: { icon: CheckCircle, color: "text-accent-foreground", bg: "bg-accent" },
    warning: { icon: AlertCircle, color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
    critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" }
  };

  const criticalityVariant = {
    critical: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline"
  } as const;

  const StatusIcon = statusConfig[status].icon;

  return (
    <Card className="p-4 hover-elevate">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate" data-testid={`text-feeder-${id}`}>{name}</h3>
              <Badge variant={criticalityVariant[criticality]} className="text-xs">
                {criticality}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{substationName}</p>
          </div>
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${statusConfig[status].bg}`}>
            <StatusIcon className={`h-4 w-4 ${statusConfig[status].color}`} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Load</span>
            <span className="font-mono font-medium">{loadPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                loadPercentage > 90 ? 'bg-destructive' : 
                loadPercentage > 75 ? 'bg-yellow-500' : 
                'bg-accent-foreground'
              }`}
              style={{ width: `${Math.min(loadPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{currentLoad.toFixed(1)} MW</span>
            <span>{capacity.toFixed(1)} MW</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {connectedDERs} DERs connected
          </span>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={onViewDetails}
            data-testid={`button-view-feeder-${id}`}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="default"
            onClick={onActivateDERs}
            data-testid={`button-activate-ders-${id}`}
          >
            Activate DERs
          </Button>
        </div>
      </div>
    </Card>
  );
}
