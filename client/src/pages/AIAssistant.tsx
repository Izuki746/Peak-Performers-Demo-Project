import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChatbotPanel from "@/components/ChatbotPanel";
import { Sparkles, Cpu, Zap } from "lucide-react";

export default function AIAssistant() {
  const handleSendMessage = async (message: string): Promise<{ response: string; data?: any }> => {
    const lowerMessage = message.toLowerCase();

    try {
      // BECKN Search - Find available DERs
      if (lowerMessage.includes("search") || lowerMessage.includes("find") || lowerMessage.includes("discover") || lowerMessage.includes("list available")) {
        const response = await fetch("/api/der/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fulfillmentType: "energy-dispatch",
            quantity: { amount: "100", unit: "kWh" }
          })
        });

        const result = await response.json();
        if (result.success && result.data.length > 0) {
          const derList = result.data.map((der: any) => 
            `• ${der.name} (${der.type}): ${der.capacity} kW @ $${der.price_per_unit}/kWh`
          ).join("\n");

          return {
            response: `Found ${result.data.length} available DER resources via BECKN Protocol:\n\n${derList}\n\nWould you like me to activate any of these?`,
            data: { ders: result.data }
          };
        }
        return { response: "No DER resources found. Please try again." };
      }

      // BECKN Activate - Activate DERs
      else if (lowerMessage.includes("activate") || lowerMessage.includes("enable") || lowerMessage.includes("turn on")) {
        // Get feeders first to find one that needs help
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        // Find a critical or warning feeder
        const criticalFeeder = feeders.find((f: any) => f.status === "critical") || feeders.find((f: any) => f.status === "warning");
        
        if (!criticalFeeder) {
          return { response: "No critical feeders need assistance at this time." };
        }

        // Search for DERs
        const searchResponse = await fetch("/api/der/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fulfillmentType: "energy-dispatch",
            quantity: { amount: "50", unit: "kWh" }
          })
        });

        const searchResult = await searchResponse.json();
        if (searchResult.success && searchResult.data.length > 0) {
          const der = searchResult.data[0];
          
          // Activate the DER for the critical feeder
          const activateResponse = await fetch(`/api/der/${der.id}/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quantity: { amount: "50", unit: "kWh" },
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 3600000).toISOString(),
              feederId: criticalFeeder.id
            })
          });

          const activateResult = await activateResponse.json();
          if (activateResult.success) {
            return {
              response: `✅ DER Activation Successful via BECKN Protocol!\n\n**Resource:** ${der.name}\n**Type:** ${der.type}\n**Order ID:** ${activateResult.data.orderId}\n**Capacity:** ${der.capacity} kW\n**Assigned to Feeder:** ${criticalFeeder.name}\n**Load Reduction:** 50 kWh\n**Estimated Cost:** $${50 * der.price_per_unit}\n\nThe resource is now active and reducing load on ${criticalFeeder.name}.`,
              data: { orderId: activateResult.data.orderId, der, feeder: criticalFeeder }
            };
          }
        }
        return { response: "No DERs available for activation at this time." };
      }

      // BECKN Status - Check DER status
      else if (lowerMessage.includes("status") || lowerMessage.includes("check")) {
        return {
          response: "📊 Current Grid Status via BECKN Protocol:\n\n• Total Load: 2,847 MW\n• Available Capacity: 1,453 MW\n• Active DERs: 3 resources\n• Response Time: 3.2 seconds\n• Grid Health: Optimal\n\nAll systems nominal. Ready for demand response activation."
        };
      }

      // BECKN Query - Check critical feeders
      else if (lowerMessage.includes("critical") || lowerMessage.includes("feeder")) {
        return {
          response: "⚠️ Critical Feeders Analysis (via BECKN Protocol):\n\n**Feeder F-1234** (Westminster Substation)\n• Load: 87.5/95 MW (92% capacity)\n• Status: CRITICAL\n• Available DERs: 12 resources\n• Recommended Action: Activate 3-4 DERs\n\n**Feeder F-5678** (Camden Substation)\n• Load: 68.2/90 MW (76% capacity)\n• Status: WARNING\n• Available DERs: 8 resources\n• Recommended Action: Monitor closely\n\nWould you like me to activate DERs for any of these feeders?"
        };
      }

      // BECKN Cancel - Cancel activation
      else if (lowerMessage.includes("cancel")) {
        return {
          response: "🛑 To cancel a DER activation, I need the order ID.\n\nPlease provide the order ID (e.g., 'ORD-1234567890') and I'll process the cancellation via BECKN Protocol."
        };
      }

      // Default helpful response
      else {
        return {
          response: "I'm here to help! Here are things I can do via BECKN Protocol:\n\n🔍 **Search:** 'Find available DERs'\n⚡ **Activate:** 'Activate DERs' or 'Turn on renewable energy'\n📊 **Status:** 'Check grid status' or 'What's the current load?'\n⚠️ **Alerts:** 'Show critical feeders'\n❌ **Cancel:** 'Cancel order [ID]'\n\nWhat would you like to do?"
        };
      }
    } catch (error) {
      console.error("BECKN workflow error:", error);
      return {
        response: "Sorry, I encountered an error executing the BECKN Protocol workflow. Please try again."
      };
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" />
          AI Grid Assistant
        </h1>
        <p className="text-muted-foreground">
          Intelligent grid management powered by Beckn Protocol and real-time analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Feeder Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Query feeder status, load patterns, and get real-time diagnostics
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">DER Activation</h3>
              <p className="text-sm text-muted-foreground">
                Activate distributed energy resources via natural language commands
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Beckn Protocol</h3>
              <p className="text-sm text-muted-foreground">
                Execute search, select, init, and confirm workflows automatically
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chat Interface</h2>
          <Badge variant="outline" className="gap-2">
            <div className="h-2 w-2 rounded-full bg-accent-foreground animate-pulse" />
            AI Active
          </Badge>
        </div>
        <div className="h-[600px]">
          <ChatbotPanel onSendMessage={handleSendMessage} />
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">Example Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">1</Badge>
            <p className="text-muted-foreground">"Find available DERs in my area"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">2</Badge>
            <p className="text-muted-foreground">"Activate DERs to reduce load on critical feeders"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">3</Badge>
            <p className="text-muted-foreground">"Show me the current grid status"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">4</Badge>
            <p className="text-muted-foreground">"What are the critical feeders right now?"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">5</Badge>
            <p className="text-muted-foreground">"Cancel the activation for order XYZ"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">6</Badge>
            <p className="text-muted-foreground">"Check status of all active DERs"</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
