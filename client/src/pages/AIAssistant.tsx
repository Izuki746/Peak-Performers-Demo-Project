import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ChatbotPanel from "@/components/ChatbotPanel";
import { Sparkles, Cpu, Zap } from "lucide-react";

export default function AIAssistant() {
  const { toast } = useToast();

  const handleSendMessage = async (message: string) => {
    toast({
      title: "Processing via BECKN Protocol",
      description: "AI is analyzing and executing your request...",
    });

    // Parse intent from message
    const lowerMessage = message.toLowerCase();
    
    try {
      if (lowerMessage.includes("search") || lowerMessage.includes("find") || lowerMessage.includes("discover")) {
        // BECKN Search workflow
        const response = await fetch("/api/der/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fulfillmentType: "energy-dispatch",
            quantity: { amount: "100", unit: "kWh" }
          })
        });

        const result = await response.json();
        if (result.success) {
          toast({
            title: "BECKN Search Complete",
            description: `Found ${result.data.length} available DER resources`,
            variant: "default",
          });
        }
      } else if (lowerMessage.includes("activate") || lowerMessage.includes("enable") || lowerMessage.includes("turn on")) {
        // BECKN Select + Confirm workflow
        toast({
          title: "BECKN Activation Workflow",
          description: "Executing select and confirm transactions...",
        });

        // Simulate activation of first available DER
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
          const activateResponse = await fetch(`/api/der/${der.id}/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quantity: { amount: "50", unit: "kWh" },
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 3600000).toISOString()
            })
          });

          const activateResult = await activateResponse.json();
          if (activateResult.success) {
            toast({
              title: "BECKN Activation Success",
              description: `DER ${der.name} activated. Order: ${activateResult.data.orderId}`,
              variant: "default",
            });
          }
        }
      } else if (lowerMessage.includes("status") || lowerMessage.includes("check")) {
        // BECKN Status workflow
        toast({
          title: "BECKN Status Check",
          description: "Retrieving current DER status via BECKN Protocol...",
          variant: "default",
        });
      } else if (lowerMessage.includes("cancel")) {
        // BECKN Cancel workflow
        toast({
          title: "BECKN Cancel Workflow",
          description: "Processing cancellation request...",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("BECKN workflow error:", error);
      toast({
        title: "BECKN Workflow Error",
        description: "Failed to execute BECKN protocol workflow",
        variant: "destructive",
      });
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
            <p className="text-muted-foreground">"Check status of feeder F-1234"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">2</Badge>
            <p className="text-muted-foreground">"Activate all available DERs for Westminster"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">3</Badge>
            <p className="text-muted-foreground">"Show me all critical feeders"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">4</Badge>
            <p className="text-muted-foreground">"List battery storage DERs currently idle"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">5</Badge>
            <p className="text-muted-foreground">"Reduce load on F-5678 by 15 MW"</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">6</Badge>
            <p className="text-muted-foreground">"What's the current grid response time?"</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
