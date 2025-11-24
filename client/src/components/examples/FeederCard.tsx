import FeederCard from '../FeederCard';

export default function FeederCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-background">
      <FeederCard
        id="F-1234"
        name="Feeder F-1234"
        substationName="Westminster Substation"
        currentLoad={87.5}
        capacity={95}
        status="critical"
        criticality="critical"
        connectedDERs={12}
        onViewDetails={() => console.log('View details clicked')}
        onActivateDERs={() => console.log('Activate DERs clicked')}
      />
      <FeederCard
        id="F-5678"
        name="Feeder F-5678"
        substationName="Camden Substation"
        currentLoad={68.2}
        capacity={90}
        status="warning"
        criticality="high"
        connectedDERs={8}
        onViewDetails={() => console.log('View details clicked')}
        onActivateDERs={() => console.log('Activate DERs clicked')}
      />
      <FeederCard
        id="F-9012"
        name="Feeder F-9012"
        substationName="Hackney Substation"
        currentLoad={42.1}
        capacity={85}
        status="normal"
        criticality="medium"
        connectedDERs={15}
        onViewDetails={() => console.log('View details clicked')}
        onActivateDERs={() => console.log('Activate DERs clicked')}
      />
    </div>
  );
}
