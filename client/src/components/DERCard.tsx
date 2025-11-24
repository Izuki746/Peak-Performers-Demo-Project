import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Battery, Car, Sun, Home, Zap } from "lucide-react";

interface DERCardProps {
  id: string;
  type: "battery" | "ev" | "solar" | "demand_response" | "other";
  name: string;
  capacity: number;
  currentOutput: number;
  status: "active" | "idle" | "offline";
  owner?: string;
  available: boolean;
  onActivate?: () => void;
}

const typeConfig = {
  battery: { icon: Battery, label: "Battery Storage", color: "text-blue-600 dark:text-blue-400" },
  ev: { icon: Car, label: "EV Charging", color: "text-purple-600 dark:text-purple-400" },
  solar: { icon: Sun, label: "Solar Panel", color: "text-yellow-600 dark:text-yellow-400" },
  demand_response: { icon: Home, label: "Demand Response", color: "text-green-600 dark:text-green-400" },
  other: { icon: Zap, label: "Other DER", color: "text-gray-600 dark:text-gray-400" }
};

const statusVariant = {
  active: "default",
  idle: "secondary",
  offline: "outline"
} as const;

export default function DERCard({
  id,
  type,
  name,
  capacity,
  currentOutput,
  status,
  owner,
  available,
  onActivate
}: DERCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const utilizationPercent = (currentOutput / capacity) * 100;

  return (
    <Card className="p-4 hover-elevate">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate" data-testid={`text-der-${id}`}>{name}</h4>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </div>
          </div>
          <Badge variant={statusVariant[status]} className="text-xs">
            {status}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-mono font-medium">{capacity} kW</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Current Output</span>
            <span className="font-mono font-medium">{currentOutput} kW</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Utilization</span>
            <span className="font-mono font-medium">{utilizationPercent.toFixed(1)}%</span>
          </div>
        </div>

        {owner && (
          <p className="text-xs text-muted-foreground">Owner: {owner}</p>
        )}

        <Button
          size="sm"
          variant={available ? "default" : "outline"}
          className="w-full"
          disabled={!available || status === "offline"}
          onClick={onActivate}
          data-testid={`button-activate-der-${id}`}
        >
          {available ? (status === "active" ? "Deactivate" : "Activate DER") : "Unavailable"}
        </Button>
      </div>
    </Card>
  );
}
