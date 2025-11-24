import { useState } from 'react';
import FeederDetailModal from '../FeederDetailModal';
import { Button } from '@/components/ui/button';

export default function FeederDetailModalExample() {
  const [open, setOpen] = useState(true);

  const mockFeeder = {
    id: "F-1234",
    name: "Feeder F-1234",
    substationName: "Westminster Substation",
    currentLoad: 87.5,
    capacity: 95,
    status: "critical" as const,
    criticality: "critical" as const,
    location: "Central London",
    connectedDERs: 12
  };

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)} data-testid="button-open-modal">
        Open Feeder Detail Modal
      </Button>
      <FeederDetailModal
        open={open}
        onOpenChange={setOpen}
        feeder={mockFeeder}
      />
    </div>
  );
}
