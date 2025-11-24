import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import StatusCard from "@/components/StatusCard";
import DERCard from "@/components/DERCard";
import AlertBanner from "@/components/AlertBanner";
import { Zap, Activity, Battery, Clock } from "lucide-react";

export default function Dashboard() {
  const [activatingDER, setActivatingDER] = useState<string | null>(null);
  const { toast } = useToast();

  // TODO: remove mock data
  const mockAlerts = [
    {
      id: "alert-1",
      severity: "critical" as const,
      message: "Feeder F-1234 at Westminster Substation exceeding 92% capacity. Immediate DER activation recommended.",
      feederId: "F-1234",
      timestamp: new Date(Date.now() - 45000)
    },
    {
      id: "alert-2",
      severity: "warning" as const,
      message: "Predicted load spike in Camden area within next 15 minutes.",
      feederId: "F-5678",
      timestamp: new Date(Date.now() - 120000)
    }
  ];

  const mockDERs = [
    {
      id: "DER-001",
      type: "battery" as const,
      name: "Tesla Powerwall #42",
      capacity: 13.5,
      currentOutput: 8.2,
      status: "active" as const,
      owner: "Smith Residence",
      available: true
    },
    {
      id: "DER-002",
      type: "ev" as const,
      name: "EV Charger Station B",
      capacity: 150,
      currentOutput: 0,
      status: "idle" as const,
      owner: "Public Charging Network",
      available: true
    },
    {
      id: "DER-003",
      type: "solar" as const,
      name: "Rooftop Solar Array",
      capacity: 25,
      currentOutput: 18.5,
      status: "active" as const,
      owner: "Johnson Commercial",
      available: true
    },
    {
      id: "DER-004",
      type: "demand_response" as const,
      name: "HVAC Load Control",
      capacity: 50,
      currentOutput: 0,
      status: "idle" as const,
      owner: "Office Building A",
      available: true
    },
    {
      id: "DER-005",
      type: "battery" as const,
      name: "Community Battery Bank",
      capacity: 200,
      currentOutput: 120,
      status: "active" as const,
      owner: "Energy Co-op",
      available: true
    },
    {
      id: "DER-006",
      type: "demand_response" as const,
      name: "Industrial Load Shift",
      capacity: 300,
      currentOutput: 0,
      status: "idle" as const,
      owner: "Factory Complex",
      available: true
    }
  ];

  const handleActivateDER = (derId: string) => {
    setActivatingDER(derId);
    
    toast({
      title: "Activating DER",
      description: `Initiating Beckn Protocol for ${derId}`,
    });

    setTimeout(() => {
      setActivatingDER(null);
      toast({
        title: "DER Activated",
        description: `${derId} is now active and providing grid services.`,
        variant: "default",
      });
    }, 1500);
  };

  const handleDismissAlert = (alertId: string) => {
    toast({
      title: "Alert Dismissed",
      description: `Alert ${alertId} has been acknowledged`,
    });
  };

  const activeDERs = mockDERs.filter(d => d.status === "active").length;
  const availableDERs = mockDERs.filter(d => d.available).length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* KPI Metrics */}
            <section>
              <h2 className="text-lg font-semibold mb-6">Grid Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  value={activeDERs}
                  icon={Battery}
                  trend={`${availableDERs - activeDERs} standby`}
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
            </section>

            {/* Active Alerts */}
            {mockAlerts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-6">Active Alerts</h2>
                <div className="space-y-4">
                  {mockAlerts.map((alert) => (
                    <AlertBanner
                      key={alert.id}
                      {...alert}
                      onDismiss={() => handleDismissAlert(alert.id)}
                      onTakeAction={() => {
                        toast({
                          title: "Viewing Alert Details",
                          description: `Opening details for ${alert.feederId}`,
                        });
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* DER Catalogue */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">DER Catalogue</h2>
                <Badge variant="secondary">
                  {activeDERs} Active • {availableDERs - activeDERs} Available
                </Badge>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All ({mockDERs.length})</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                  <TabsTrigger value="ev">EV Charging</TabsTrigger>
                  <TabsTrigger value="solar">Solar</TabsTrigger>
                  <TabsTrigger value="demand">Demand Response</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockDERs.map((der) => (
                      <DERCard
                        key={der.id}
                        {...der}
                        onActivate={() => handleActivateDER(der.id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="battery" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockDERs.filter(d => d.type === "battery").map((der) => (
                      <DERCard
                        key={der.id}
                        {...der}
                        onActivate={() => handleActivateDER(der.id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ev" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockDERs.filter(d => d.type === "ev").map((der) => (
                      <DERCard
                        key={der.id}
                        {...der}
                        onActivate={() => handleActivateDER(der.id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="solar" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockDERs.filter(d => d.type === "solar").map((der) => (
                      <DERCard
                        key={der.id}
                        {...der}
                        onActivate={() => handleActivateDER(der.id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="demand" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockDERs.filter(d => d.type === "demand_response").map((der) => (
                      <DERCard
                        key={der.id}
                        {...der}
                        onActivate={() => handleActivateDER(der.id)}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>
  );
}
