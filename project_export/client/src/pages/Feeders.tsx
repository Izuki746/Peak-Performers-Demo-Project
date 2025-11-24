import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import FeederCard from "@/components/FeederCard";
import FeederDetailModal from "@/components/FeederDetailModal";
import { Search, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Feeders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeeder, setSelectedFeeder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [feeders, setFeeders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch feeders from backend
  useEffect(() => {
    const fetchFeeders = async () => {
      try {
        const response = await fetch("/api/feeders");
        const result = await response.json();
        if (result.success) {
          setFeeders(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch feeders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeders();
    // Refresh feeders every 5 seconds to show real-time updates when DERs are activated
    const interval = setInterval(fetchFeeders, 5000);
    return () => clearInterval(interval);
  }, []);

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
    },
    {
      id: "F-7890",
      name: "Feeder F-7890",
      substationName: "Tower Hamlets Substation",
      currentLoad: 55.2,
      capacity: 75,
      status: "normal" as const,
      criticality: "medium" as const,
      connectedDERs: 10
    },
    {
      id: "F-2468",
      name: "Feeder F-2468",
      substationName: "Lambeth Substation",
      currentLoad: 72.8,
      capacity: 85,
      status: "warning" as const,
      criticality: "high" as const,
      connectedDERs: 14
    }
  ];

  const handleViewFeederDetails = (feeder: any) => {
    setSelectedFeeder(feeder);
    setModalOpen(true);
    toast({
      title: "Loading Feeder Details",
      description: `Opening details for ${feeder.name}`,
    });
  };

  const handleActivateDERsForFeeder = async (feederId: string) => {
    const feeder = feeders.find(f => f.id === feederId) || mockFeeders.find(f => f.id === feederId);
    if (!feeder) return;

    toast({
      title: "Initiating Beckn Protocol",
      description: `Starting DER search and activation for ${feederId}...`,
    });

    try {
      // Step 1: Search for DERs via BECKN Protocol
      const searchResponse = await fetch("/api/der/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentType: "energy-dispatch",
          quantity: {
            amount: Math.round((feeder.capacity - feeder.currentLoad) * 0.8).toString(),
            unit: "kWh"
          }
        })
      });

      const searchResult = await searchResponse.json();
      if (!searchResult.success) throw new Error("Search failed");

      const availableDERs = searchResult.data.slice(0, 3); // Select top 3 DERs

      // Step 2: Activate DERs via BECKN Protocol (with feederId for load tracking)
      const activationPromises = availableDERs.map((der: any) =>
        fetch(`/api/der/${der.id}/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: { amount: "25", unit: "kWh" },
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            feederId: feederId // Pass feederId so backend tracks which feeder this reduces load for
          })
        })
      );

      const activationResponses = await Promise.all(activationPromises);
      const activationResults = await Promise.all(activationResponses.map(r => r.json()));

      const successfulActivations = activationResults.filter(r => r.success);

      // Refresh feeders to show updated load
      const refreshResponse = await fetch("/api/feeders");
      const refreshResult = await refreshResponse.json();
      if (refreshResult.success) {
        setFeeders(refreshResult.data);
      }

      toast({
        title: "DER Activation Successful",
        description: `${successfulActivations.length} DERs activated for ${feederId} via BECKN Protocol. Load reduction: ${successfulActivations.length * 25} kWh.`,
        variant: "default",
      });
    } catch (error) {
      console.error("BECKN activation error:", error);
      toast({
        title: "Activation Failed",
        description: "Failed to activate DERs via BECKN Protocol",
        variant: "destructive",
      });
    }
  };

  const displayFeeders = feeders.length > 0 ? feeders : mockFeeders;
  const filteredFeeders = displayFeeders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.substationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalFeeders = filteredFeeders.filter(f => f.status === "critical");
  const warningFeeders = filteredFeeders.filter(f => f.status === "warning");
  const normalFeeders = filteredFeeders.filter(f => f.status === "normal");

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Feeder Management</h1>
          <p className="text-muted-foreground">Monitor and manage grid feeders across all substations</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {displayFeeders.length} Total Feeders
          </Badge>
          <Badge variant="destructive">
            {criticalFeeders.length} Critical
          </Badge>
          <Badge variant="default">
            {warningFeeders.length} Warning
          </Badge>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by feeder name or substation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-feeders"
            />
          </div>
          <Badge variant="secondary" className="gap-2">
            <Filter className="h-3 w-3" />
            {filteredFeeders.length} Results
          </Badge>
        </div>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Feeders ({filteredFeeders.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({criticalFeeders.length})</TabsTrigger>
          <TabsTrigger value="warning">Warning ({warningFeeders.length})</TabsTrigger>
          <TabsTrigger value="normal">Normal ({normalFeeders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFeeders.map((feeder) => (
              <FeederCard
                key={feeder.id}
                {...feeder}
                onViewDetails={() => handleViewFeederDetails(feeder)}
                onActivateDERs={() => handleActivateDERsForFeeder(feeder.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="critical" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {criticalFeeders.map((feeder) => (
              <FeederCard
                key={feeder.id}
                {...feeder}
                onViewDetails={() => handleViewFeederDetails(feeder)}
                onActivateDERs={() => handleActivateDERsForFeeder(feeder.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warning" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {warningFeeders.map((feeder) => (
              <FeederCard
                key={feeder.id}
                {...feeder}
                onViewDetails={() => handleViewFeederDetails(feeder)}
                onActivateDERs={() => handleActivateDERsForFeeder(feeder.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="normal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {normalFeeders.map((feeder) => (
              <FeederCard
                key={feeder.id}
                {...feeder}
                onViewDetails={() => handleViewFeederDetails(feeder)}
                onActivateDERs={() => handleActivateDERsForFeeder(feeder.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <FeederDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feeder={selectedFeeder}
      />
    </div>
  );
}
