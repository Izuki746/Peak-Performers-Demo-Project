import DERCard from '../DERCard';

export default function DERCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-background">
      <DERCard
        id="DER-001"
        type="battery"
        name="Tesla Powerwall #42"
        capacity={13.5}
        currentOutput={8.2}
        status="active"
        owner="Smith Residence"
        available={true}
        onActivate={() => console.log('Activate DER-001')}
      />
      <DERCard
        id="DER-002"
        type="ev"
        name="EV Charger Station B"
        capacity={150}
        currentOutput={0}
        status="idle"
        owner="Public Charging Network"
        available={true}
        onActivate={() => console.log('Activate DER-002')}
      />
      <DERCard
        id="DER-003"
        type="solar"
        name="Rooftop Solar Array"
        capacity={25}
        currentOutput={18.5}
        status="active"
        owner="Johnson Commercial"
        available={true}
        onActivate={() => console.log('Activate DER-003')}
      />
      <DERCard
        id="DER-004"
        type="demand_response"
        name="HVAC Load Control"
        capacity={50}
        currentOutput={0}
        status="offline"
        owner="Office Building A"
        available={false}
        onActivate={() => console.log('Activate DER-004')}
      />
    </div>
  );
}
