import AuditLogRow from '../AuditLogRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AuditLogRowExample() {
  return (
    <div className="p-6 bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action Type</TableHead>
            <TableHead>Operator</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Beckn TX ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AuditLogRow
            id="log-1"
            timestamp={new Date(Date.now() - 300000)}
            actionType="DER_ACTIVATION"
            operator="AI Assistant"
            target="F-1234"
            becknTransactionId="BKN-2025-001234"
            status="completed"
            details="Activated 8 DERs via Beckn Protocol: search→select→init→confirm workflow completed. Load reduced by 12.5 MW."
          />
          <AuditLogRow
            id="log-2"
            timestamp={new Date(Date.now() - 600000)}
            actionType="FEEDER_ANALYSIS"
            operator="Operator: john.smith"
            target="F-5678"
            status="completed"
          />
          <AuditLogRow
            id="log-3"
            timestamp={new Date(Date.now() - 900000)}
            actionType="DER_ACTIVATION"
            operator="AI Assistant"
            target="F-9012"
            becknTransactionId="BKN-2025-001235"
            status="pending"
            details="Beckn Protocol init stage - awaiting confirmation from 3 DER providers."
          />
          <AuditLogRow
            id="log-4"
            timestamp={new Date(Date.now() - 1200000)}
            actionType="ALERT_TRIGGERED"
            operator="System"
            target="F-1234"
            status="completed"
            details="Critical alert triggered: Load exceeded 90% threshold at 92.1%"
          />
        </TableBody>
      </Table>
    </div>
  );
}
