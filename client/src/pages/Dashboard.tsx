import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatusCard from "@/components/StatusCard";
import FeederCard from "@/components/FeederCard";
import DERCard from "@/components/DERCard";
import AlertBanner from "@/components/AlertBanner";
import ChatbotPanel from "@/components/ChatbotPanel";
import FeederDetailModal from "@/components/FeederDetailModal";
import AuditLogRow from "@/components/AuditLogRow";
import ThemeToggle from "@/components/ThemeToggle";
import { Zap, Activity, Battery, Clock, Search, AlertCircle } from "lucide-react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeeder, setSelectedFeeder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // TODO: remove mock data
  const mockAlerts = [
    {
      id: "alert-1",
      severity: "critical" as const,
      message: "Feeder F-1234 at Westminster Substation exceeding 92% capacity. Immediate DER activation recommended to prevent overload.",
      feederId: "F-1234",
      timestamp: new Date(Date.now() - 45000)
    },
    {
      id: "alert-2",
      severity: "warning" as const,
      message: "Predicted load spike in Camden area within next 15 minutes. Consider pre-activating available DERs.",
      feederId: "F-5678",
      timestamp: new Date(Date.now() - 120000)
    }
  ];

  const mockFeeders = [
    {
      id: "F-1234",
      name: "Feeder F-1234",
      substationName: "Westminster Substation",
      currentLoad: 87.5,
      capacity: 95,
      status: "critical" as const,
      criticality: "critical" as const,
      connectedDERs: 12
    },
    {
      id: "F-5678",
      name: "Feeder F-5678",
      substationName: "Camden Substation",
      currentLoad: 68.2,
      capacity: 90,
      status: "warning" as const,
      criticality: "high" as const,
      connectedDERs: 8
    },
    {
      id: "F-9012",
      name: "Feeder F-9012",
      substationName: "Hackney Substation",
      currentLoad: 42.1,
      capacity: 85,
      status: "normal" as const,
      criticality: "medium" as const,
      connectedDERs: 15
    },
    {
      id: "F-3456",
      name: "Feeder F-3456",
      substationName: "Islington Substation",
      currentLoad: 35.8,
      capacity: 80,
      status: "normal" as const,
      criticality: "low" as const,
      connectedDERs: 6
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
      status: "offline" as const,
      owner: "Factory Complex",
      available: false
    }
  ];

  const mockAuditLogs = [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 300000),
      actionType: "DER_ACTIVATION",
      operator: "AI Assistant",
      target: "F-1234",
      becknTransactionId: "BKN-2025-001234",
      status: "completed" as const,
      details: "Activated 8 DERs via Beckn Protocol: search→select→init→confirm workflow completed. Load reduced by 12.5 MW."
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 600000),
      actionType: "FEEDER_ANALYSIS",
      operator: "Operator: john.smith",
      target: "F-5678",
      status: "completed" as const
    },
    {
      id: "log-3",
      timestamp: new Date(Date.now() - 900000),
      actionType: "DER_ACTIVATION",
      operator: "AI Assistant",
      target: "F-9012",
      becknTransactionId: "BKN-2025-001235",
      status: "pending" as const,
      details: "Beckn Protocol init stage - awaiting confirmation from 3 DER providers."
    }
  ];

  const handleViewFeederDetails = (feeder: any) => {
    setSelectedFeeder(feeder);
    setModalOpen(true);
  };

  const activeDERs = mockDERs.filter(d => d.status === "active").length;
  const availableDERs = mockDERs.filter(d => d.available).length;
  const totalDERCapacity = mockDERs.reduce((sum, d) => sum + d.capacity, 0);
  const activeDEROutput = mockDERs.filter(d => d.status === "active").reduce((sum, d) => sum + d.currentOutput, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Grid Command Center</h1>
              <p className="text-xs text-muted-foreground">Beckn Protocol DER Orchestration Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-foreground animate-pulse" />
              Live Monitoring
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Feeder List */}
        <aside className="w-80 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold mb-3">Feeders</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feeders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-feeders"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-3">
              {mockFeeders
                .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             f.substationName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((feeder) => (
                  <FeederCard
                    key={feeder.id}
                    {...feeder}
                    onViewDetails={() => handleViewFeederDetails(feeder)}
                    onActivateDERs={() => console.log(`Activate DERs for ${feeder.id}`)}
                  />
                ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Center Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Active Alerts */}
            {mockAlerts.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Active Alerts
                </h2>
                {mockAlerts.map((alert) => (
                  <AlertBanner
                    key={alert.id}
                    {...alert}
                    onDismiss={() => console.log(`Dismiss ${alert.id}`)}
                    onTakeAction={() => console.log(`Action on ${alert.id}`)}
                  />
                ))}
              </div>
            )}

            {/* DER Catalogue & Audit Logs */}
            <Tabs defaultValue="ders" className="w-full">
              <TabsList>
                <TabsTrigger value="ders">DER Catalogue ({mockDERs.length})</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </TabsList>

              <TabsContent value="ders" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockDERs.map((der) => (
                    <DERCard
                      key={der.id}
                      {...der}
                      onActivate={() => console.log(`Activate ${der.id}`)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <Card>
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
                      {mockAuditLogs.map((log) => (
                        <AuditLogRow key={log.id} {...log} />
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Panel - Chatbot */}
        <aside className="w-96 border-l border-border">
          <div className="h-[calc(100vh-4rem)] p-4">
            <ChatbotPanel
              onSendMessage={(msg) => console.log('User sent:', msg)}
            />
          </div>
        </aside>
      </div>

      {/* Feeder Detail Modal */}
      <FeederDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feeder={selectedFeeder}
      />
    </div>
  );
}
