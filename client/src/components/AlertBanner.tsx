import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertBannerProps {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  feederId?: string;
  timestamp: Date;
  onDismiss?: () => void;
  onTakeAction?: () => void;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    variant: "destructive" as const,
    label: "Critical",
    actionLabel: "Activate DERs Now"
  },
  warning: {
    icon: AlertTriangle,
    variant: "default" as const,
    label: "Warning",
    actionLabel: "Review & Act"
  },
  info: {
    icon: Info,
    variant: "default" as const,
    label: "Info",
    actionLabel: "View Details"
  }
};

export default function AlertBanner({
  id,
  severity,
  message,
  feederId,
  timestamp,
  onDismiss,
  onTakeAction
}: AlertBannerProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="relative" data-testid={`alert-${id}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
            {feederId && (
              <span className="text-xs text-muted-foreground font-mono">{feederId}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>
          <AlertDescription className="text-sm">
            {message}
          </AlertDescription>
          {onTakeAction && (
            <Button
              size="sm"
              variant={severity === "critical" ? "default" : "outline"}
              onClick={onTakeAction}
              data-testid={`button-action-alert-${id}`}
            >
              {config.actionLabel}
            </Button>
          )}
        </div>
        {onDismiss && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onDismiss}
            data-testid={`button-dismiss-alert-${id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
