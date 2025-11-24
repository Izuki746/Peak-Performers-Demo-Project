import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  unit?: string;
}

export default function StatusCard({ title, value, icon: Icon, trend, trendPositive, unit }: StatusCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-mono">{value}</p>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {trend && (
            <p className={`text-xs ${trendPositive ? 'text-accent-foreground' : 'text-destructive'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
