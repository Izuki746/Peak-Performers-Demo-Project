import StatusCard from '../StatusCard';
import { Zap, Activity, Battery, Clock } from 'lucide-react';

export default function StatusCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-background">
      <StatusCard
        title="Total Load"
        value="2,847"
        unit="MW"
        icon={Zap}
        trend="+12% from last hour"
        trendPositive={false}
      />
      <StatusCard
        title="Available Capacity"
        value="1,453"
        unit="MW"
        icon={Activity}
        trend="+5% available"
        trendPositive={true}
      />
      <StatusCard
        title="Active DERs"
        value={124}
        icon={Battery}
        trend="87 standby"
        trendPositive={true}
      />
      <StatusCard
        title="Response Time"
        value="3.2"
        unit="sec"
        icon={Clock}
        trend="Sub-5s SLA met"
        trendPositive={true}
      />
    </div>
  );
}
