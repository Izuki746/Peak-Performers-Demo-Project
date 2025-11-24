import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import StatusCard from "@/components/StatusCard";
import FeederCard from "@/components/FeederCard";
import DERCard from "@/components/DERCard";
import AlertBanner from "@/components/AlertBanner";
import ChatbotPanel from "@/components/ChatbotPanel";
import FeederDetailModal from "@/components/FeederDetailModal";
import ThemeToggle from "@/components/ThemeToggle";
import { Zap, Activity, Battery, Clock, Search, MessageSquare, Menu, FileText } from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeeder, setSelectedFeeder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Hidden by default
  const [activatingDER, setActivatingDER] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Feature flags
  const SHOW_FEEDERS = false; // TODO: Set to true when ready to show feeders
  const SHOW_CHATBOT = false; // TODO: Set to true when ready to show chatbot

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
      status: "idle" as const,
      owner: "Factory Complex",
      available: true
    }
  ];

  const handleViewFeederDetails = (feeder: any) => {
    setSelectedFeeder(feeder);
    setModalOpen(true);
    toast({
      title: "Opening Feeder Details",
      description: `Loading data for ${feeder.name}`,
    });
  };

  const handleActivateDERsForFeeder = (feederId: string) => {
    toast({
      title: "Initiating Beckn Protocol",
      description: `Starting DER activation workflow for ${feederId}`,
    });
    
    setTimeout(() => {
      toast({
        title: "DER Activation Successful",
        description: `8 DERs activated for ${feederId}. Load reduced by 12.5 MW.`,
        variant: "default",
      });
    }, 2000);
  };

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
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {SHOW_FEEDERS && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Grid Command Center</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Beckn Protocol DER Orchestration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 hidden sm:flex">
              <div className="h-2 w-2 rounded-full bg-accent-foreground animate-pulse" />
              Live
            </Badge>
            {SHOW_CHATBOT && (
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-open-chat">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[500px] p-0">
                  <SheetHeader className="p-6 pb-0">
                    <SheetTitle>AI Grid Assistant</SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100vh-5rem)] p-6 pt-4">
                    <ChatbotPanel
                      onSendMessage={(msg) => {
                        toast({
                          title: "Processing Request",
                          description: "AI is analyzing your request...",
                        });
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Collapsible Sidebar */}
        {SHOW_FEEDERS && sidebarOpen && (
          <aside className="w-80 border-r border-border bg-card hidden lg:block">
            <div className="p-6 border-b border-border">
              <h2 className="font-semibold mb-4 text-lg">Feeders</h2>
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
            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="p-6 space-y-4">
                {mockFeeders
                  .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               f.substationName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((feeder) => (
                    <FeederCard
                      key={feeder.id}
                      {...feeder}
                      onViewDetails={() => handleViewFeederDetails(feeder)}
                      onActivateDERs={() => handleActivateDERsForFeeder(feeder.id)}
                    />
                  ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
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
                        if (alert.feederId) {
                          const feeder = mockFeeders.find(f => f.id === alert.feederId);
                          if (feeder) handleViewFeederDetails(feeder);
                        }
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
        </main>
      </div>

      {/* Mobile Feeders Sheet */}
      {SHOW_FEEDERS && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0 lg:hidden">
            <SheetHeader className="p-6 pb-0">
              <SheetTitle>Feeders</SheetTitle>
            </SheetHeader>
            <div className="p-6 pt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feeders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-4">
                  {mockFeeders
                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 f.substationName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((feeder) => (
                      <FeederCard
                        key={feeder.id}
                        {...feeder}
                        onViewDetails={() => {
                          handleViewFeederDetails(feeder);
                          setSidebarOpen(false);
                        }}
                        onActivateDERs={() => {
                          handleActivateDERsForFeeder(feeder.id);
                          setSidebarOpen(false);
                        }}
                      />
                    ))}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Feeder Detail Modal */}
      <FeederDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feeder={selectedFeeder}
      />
    </div>
  );
}
