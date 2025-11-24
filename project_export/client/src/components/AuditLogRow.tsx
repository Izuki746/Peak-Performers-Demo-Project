import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface AuditLogRowProps {
  id: string;
  timestamp: Date;
  actionType: string;
  operator: string;
  target: string;
  becknTransactionId?: string;
  status: "completed" | "pending" | "failed";
  details?: string;
}

const statusVariant = {
  completed: "default",
  pending: "secondary",
  failed: "destructive"
} as const;

export default function AuditLogRow({
  id,
  timestamp,
  actionType,
  operator,
  target,
  becknTransactionId,
  status,
  details
}: AuditLogRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className="hover-elevate" data-testid={`audit-row-${id}`}>
        <TableCell className="font-mono text-xs">
          {format(timestamp, 'yyyy-MM-dd HH:mm:ss')}
        </TableCell>
        <TableCell className="font-medium">{actionType}</TableCell>
        <TableCell>{operator}</TableCell>
        <TableCell className="font-mono text-xs">{target}</TableCell>
        <TableCell className="font-mono text-xs">
          {becknTransactionId || '—'}
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant[status]} className="text-xs">
            {status}
          </Badge>
        </TableCell>
        <TableCell>
          {details && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-audit-${id}`}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </TableCell>
      </TableRow>
      {expanded && details && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/50">
            <div className="p-4 text-sm">
              <p className="font-semibold mb-2">Details:</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{details}</p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
