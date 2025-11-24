import AlertBanner from '../AlertBanner';

export default function AlertBannerExample() {
  return (
    <div className="space-y-4 p-6 bg-background">
      <AlertBanner
        id="alert-1"
        severity="critical"
        message="Feeder F-1234 at Westminster Substation exceeding 92% capacity. Immediate DER activation recommended to prevent overload."
        feederId="F-1234"
        timestamp={new Date(Date.now() - 45000)}
        onDismiss={() => console.log('Dismissed alert-1')}
        onTakeAction={() => console.log('Take action on alert-1')}
      />
      <AlertBanner
        id="alert-2"
        severity="warning"
        message="Predicted load spike in Camden area within next 15 minutes. Consider pre-activating available DERs."
        feederId="F-5678"
        timestamp={new Date(Date.now() - 120000)}
        onDismiss={() => console.log('Dismissed alert-2')}
        onTakeAction={() => console.log('Take action on alert-2')}
      />
      <AlertBanner
        id="alert-3"
        severity="info"
        message="Successfully completed Beckn Protocol DER activation for 8 resources. Transaction ID: BKN-2025-001234"
        timestamp={new Date(Date.now() - 300000)}
        onDismiss={() => console.log('Dismissed alert-3')}
      />
    </div>
  );
}
