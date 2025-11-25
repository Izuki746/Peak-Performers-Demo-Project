import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import StatusCard from "@/components/StatusCard";
import DERCard from "@/components/DERCard";
import AlertBanner from "@/components/AlertBanner";
import { Zap, Activity, Battery, Clock, Globe, Server } from "lucide-react";

interface DashboardMetrics {
  totalLoad: number;
  availableCapacity: number;
  activeDERCount: number;
  avgResponseTime: number;
}

interface Alert {
  id: string;
  severity: "critical" | "warning";
  message: string;
  feederId: string;
  timestamp: Date;
  loadPercent?: number;
  capacity?: number;
  currentLoad?: number;
}

export default function Dashboard() {
  const [activatingDER, setActivatingDER] = useState<string | null>(null);
  const [mockDERs, setMockDERs] = useState<any[]>([]);
  const [externalData, setExternalData] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLoad: 0,
    availableCapacity: 0,
    activeDERCount: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch DERs from BECKN API and external grid data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [derResponse, dashboardResponse, feedersResponse, alertsResponse] = await Promise.all([
          fetch("/api/der/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fulfillmentType: "energy-dispatch",
              quantity: { amount: "100", unit: "kWh" }
            })
          }),
          fetch("/api/external/dashboard"),
          fetch("/api/feeders"),
          fetch("/api/alerts")
        ]);
        
        const derResult = await derResponse.json();
        const dashboardResult = await dashboardResponse.json();
        const feedersResult = await feedersResponse.json();
        const alertsResult = await alertsResponse.json();
        
        if (derResult.success) {
          setMockDERs(derResult.data);
        }
        if (dashboardResult.success) {
          setExternalData(dashboardResult.data);
        }
        
        // Update alerts - filter out dismissed ones
        if (alertsResult.success && alertsResult.data) {
          const allAlerts = alertsResult.data.map((alert: any) => ({
            ...alert,
            timestamp: new Date(alert.timestamp)
          }));
          const visibleAlerts = allAlerts.filter((a: Alert) => !dismissedAlerts.has(a.id));
          setAlerts(visibleAlerts);
        }
        
        // Calculate real metrics from feeders
        if (feedersResult.success && feedersResult.data) {
          const feeders = feedersResult.data;
          const totalLoad = feeders.reduce((sum: number, f: any) => sum + f.currentLoad, 0);
          const totalCapacity = feeders.reduce((sum: number, f: any) => sum + f.capacity, 0);
          const activeDERCount = feeders.reduce((sum: number, f: any) => sum + (f.activeDERs?.length || 0), 0);
          
          // Calculate average response time from feeders with active DERs
          const feedersWithActiveDERs = feeders.filter((f: any) => f.activeDERs?.length > 0);
          const avgResponseTime = feedersWithActiveDERs.length > 0
            ? feedersWithActiveDERs.reduce((sum: number, f: any) => sum + (f.responseTime || 0), 0) / feedersWithActiveDERs.length / 1000
            : 0;
          
          setMetrics({
            totalLoad: Math.round(totalLoad * 100) / 100,
            availableCapacity: Math.round((totalCapacity - totalLoad) * 100) / 100,
            activeDERCount,
            avgResponseTime: Math.round(avgResponseTime * 10) / 10
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Refresh every 3 seconds for real-time updates (<5s SLA)
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [dismissedAlerts]);



  const handleActivateDER = async (derId: string) => {
    setActivatingDER(derId);
    
    toast({
      title: "Activating DER",
      description: `Initiating Beckn Protocol for ${derId}...`,
    });

    try {
      const response = await fetch(`/api/der/${derId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: { amount: "50", unit: "kWh" },
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString()
        })
      });

      const result = await response.json();
      
      setTimeout(() => {
        setActivatingDER(null);
        if (result.success) {
          toast({
            title: "DER Activated",
            description: `${derId} activated successfully via BECKN Protocol. Order: ${result.data.orderId}`,
            variant: "default",
          });
        } else {
          throw new Error("Activation failed");
        }
      }, 1500);
    } catch (error) {
      setActivatingDER(null);
      toast({
        title: "Activation Failed",
        description: "Failed to activate DER via BECKN Protocol",
        variant: "destructive",
      });
    }
  };

  const handleDismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    
    // Remove from alerts display
    setAlerts(alerts.filter(a => a.id !== alertId));
    
    toast({
      title: "Alert Dismissed",
      description: `Alert has been acknowledged`,
    });
  };

  const activeDERs = mockDERs.filter(d => d.status === "active").length;
  const availableDERs = mockDERs.filter(d => d.availability === "available").length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* KPI Metrics */}
      <section>
        <h2 className="text-lg font-semibold mb-6">Grid Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            title="Total Load"
            value={metrics.totalLoad.toString()}
            unit="MW"
            icon={Zap}
            trend={metrics.totalLoad > 150 ? "⚠️ High demand" : "✅ Normal"}
            trendPositive={metrics.totalLoad <= 150}
          />
          <StatusCard
            title="Available Capacity"
            value={metrics.availableCapacity.toString()}
            unit="MW"
            icon={Activity}
            trend={`${Math.round((metrics.availableCapacity / (metrics.totalLoad + metrics.availableCapacity)) * 100)}% headroom`}
            trendPositive={true}
          />
          <StatusCard
            title="Active DERs"
            value={metrics.activeDERCount.toString()}
            icon={Battery}
            trend={metrics.activeDERCount > 0 ? "Actively reducing load" : "Standby"}
            trendPositive={metrics.activeDERCount > 0}
          />
          <StatusCard
            title="Response Time"
            value={metrics.avgResponseTime > 0 ? metrics.avgResponseTime.toString() : "—"}
            unit={metrics.avgResponseTime > 0 ? "sec" : ""}
            icon={Clock}
            trend={metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime < 5 ? "✅ Sub-5s SLA met" : "⚠️ Exceeding SLA"}` : "No active responses"}
            trendPositive={metrics.avgResponseTime < 5 || metrics.avgResponseTime === 0}
          />
        </div>
      </section>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-6">Active Alerts</h2>
          <div className="space-y-4">
            {alerts.map((alert) => (
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
