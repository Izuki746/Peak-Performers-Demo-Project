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
      else if (lowerMessage.includes("activate") || lowerMessage.includes("enable") || lowerMessage.includes("turn on") || lowerMessage.includes("reduce")) {
        // Get feeders first to find one that needs help
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        // Find a critical or warning feeder
        const targetFeeder = feeders.find((f: any) => f.status === "critical") || feeders.find((f: any) => f.status === "warning");
        
        if (!targetFeeder) {
          return { response: "✅ No feeders need assistance at this time. Grid is operating normally." };
        }

        // Use the auto-activation endpoint to activate DERs for this feeder
        const activateResponse = await fetch(`/api/auto-activation/${targetFeeder.id}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const activateResult = await activateResponse.json();
        if (activateResult.success) {
          // Calculate load percentage and reduction
          const loadPercentage = Math.round((targetFeeder.currentLoad / targetFeeder.capacity) * 100);
          
          return {
            response: `⚡ **DER Activation Successful via BECKN Protocol!**\n\n**Status:** ✅ Active and Responding\n**Feeder:** ${targetFeeder.name}\n**Location:** ${targetFeeder.substationName}\n**Load Before:** ${loadPercentage}% (${targetFeeder.currentLoad.toFixed(1)} MW / ${targetFeeder.capacity} MW)\n**DERs Activated:** ${activateResult.dersActivated}\n**Expected Reduction:** ${activateResult.dersActivated * 25} kW\n\n🔄 DERs are now actively reducing load. The system will automatically deactivate them when load returns to normal levels.\n\n**Next Steps:** Monitor the feeder status to confirm load reduction.`,
            data: { feeder: targetFeeder, dersActivated: activateResult.dersActivated }
          };
        }
        return { response: "⚠️ Auto-activation is currently in progress. Please try again in a moment." };
      }

      // Dismiss auto-activation alerts
      else if (lowerMessage.includes("dismiss") || lowerMessage.includes("skip") || lowerMessage.includes("no thanks")) {
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        const criticalFeeder = feeders.find((f: any) => f.status === "critical");
        if (criticalFeeder) {
          await fetch(`/api/auto-activation/${criticalFeeder.id}/dismiss`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          
          return {
            response: `✅ **Alert Dismissed**\n\nI've dismissed the auto-activation alert for **${criticalFeeder.name}** at ${criticalFeeder.substationName}.\n\nCurrent Status:\n• Load: ${((criticalFeeder.currentLoad / criticalFeeder.capacity) * 100).toFixed(1)}%\n• Capacity: ${criticalFeeder.currentLoad.toFixed(1)} / ${criticalFeeder.capacity} MW\n\n📌 You can re-trigger activation anytime if needed.`
          };
        }
        return { response: "✅ No alerts to dismiss. All feeders are operating normally." };
      }

      // Deactivate DERs / Turn off
      else if (lowerMessage.includes("deactivate") || lowerMessage.includes("turn off") || lowerMessage.includes("stop")) {
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        let deactivatedCount = 0;
        let details = [];
        
        for (const feeder of feeders) {
          if (feeder.activeDERs && feeder.activeDERs.length > 0) {
            for (const der of feeder.activeDERs) {
              await fetch(`/api/der/${der.orderId}/deactivate`, { method: "POST" });
              deactivatedCount++;
              details.push(`• ${feeder.name}: Deactivated (Order ${der.orderId})`);
            }
          }
        }
        
        if (deactivatedCount > 0) {
          return {
            response: `🛑 **DERs Deactivated Successfully**\n\n${details.join("\n")}\n\n**Summary:**\n• Total DERs Deactivated: ${deactivatedCount}\n• Load reduction removed\n• Grid returning to baseline\n\n✅ All active DERs have been turned off.`
          };
        }
        return { response: "ℹ️ No active DERs to deactivate. The grid is running at baseline." };
      }

      // View audit logs / history
      else if (lowerMessage.includes("log") || lowerMessage.includes("history") || lowerMessage.includes("audit")) {
        const logsResponse = await fetch("/api/audit-logs");
        const logsResult = await logsResponse.json();
        const logs = logsResult.data || [];
        
        if (logs.length === 0) {
          return { response: "📋 **Audit Log**\n\nNo actions have been recorded yet." };
        }
        
        const recentLogs = logs.slice(0, 5).map((log: any) => {
          const time = new Date(log.timestamp);
          const timeStr = time.toLocaleTimeString();
          return `• [${timeStr}] ${log.action} - ${log.description}`;
        });
        
        return {
          response: `📋 **Recent Activity Log** (Last ${recentLogs.length} actions)\n\n${recentLogs.join("\n")}\n\n✅ Total events recorded: ${logs.length}`
        };
      }

      // Get recommendations
      else if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest") || lowerMessage.includes("what should")) {
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        const critical = feeders.filter((f: any) => f.status === "critical");
        const warning = feeders.filter((f: any) => f.status === "warning");
        
        let recommendations = "🎯 **AI Recommendations**\n\n";
        
        if (critical.length > 0) {
          recommendations += `⚠️ **CRITICAL ACTION NEEDED:**\n`;
          critical.forEach((f: any) => {
            const load = ((f.currentLoad / f.capacity) * 100).toFixed(1);
            recommendations += `• ${f.name} is at ${load}% capacity - ACTIVATE DERs NOW\n`;
          });
          recommendations += "\n";
        }
        
        if (warning.length > 0) {
          recommendations += `⚠️ **MONITOR CLOSELY:**\n`;
          warning.forEach((f: any) => {
            const load = ((f.currentLoad / f.capacity) * 100).toFixed(1);
            recommendations += `• ${f.name} is at ${load}% capacity - Ready to activate if needed\n`;
          });
          recommendations += "\n";
        }
        
        if (critical.length === 0 && warning.length === 0) {
          recommendations += "✅ **All feeders operating normally** - No immediate action needed\n• Grid is stable\n• All systems optimal\n• DERs on standby";
        }
        
        return { response: recommendations };
      }

      // BECKN Status - Check grid status
      else if (lowerMessage.includes("status") || lowerMessage.includes("check")) {
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        const totalLoad = feeders.reduce((sum: number, f: any) => sum + f.currentLoad, 0);
        const totalCapacity = feeders.reduce((sum: number, f: any) => sum + f.capacity, 0);
        const activeDERCount = feeders.reduce((sum: number, f: any) => sum + (f.activeDERs?.length || 0), 0);
        const loadPercent = Math.round((totalLoad / totalCapacity) * 100);
        
        return {
          response: `📊 **Grid Status Report**\n\n**Load Metrics:**\n• Total Load: ${totalLoad.toFixed(1)} MW / ${totalCapacity.toFixed(1)} MW\n• Load: ${loadPercent}%\n• Active DERs: ${activeDERCount}\n\n**Feeder Status:**\n• Critical: ${feeders.filter((f: any) => f.status === "critical").length}\n• Warning: ${feeders.filter((f: any) => f.status === "warning").length}\n• Normal: ${feeders.filter((f: any) => f.status === "normal").length}\n\n${loadPercent > 80 ? "⚠️ **Grid under stress - consider activating DERs**" : "✅ **Grid operating normally**"}`
        };
      }

      // BECKN Query - Check critical feeders
      else if (lowerMessage.includes("critical") || lowerMessage.includes("feeder")) {
        const feedersResponse = await fetch("/api/feeders");
        const feedersResult = await feedersResponse.json();
        const feeders = feedersResult.data || [];
        
        const criticalFeeders = feeders.filter((f: any) => f.status === "critical");
        const warningFeeders = feeders.filter((f: any) => f.status === "warning");
        
        let response = "📍 **Feeder Analysis**\n\n";
        
        if (criticalFeeders.length > 0) {
          response += "🔴 **CRITICAL FEEDERS:**\n";
          criticalFeeders.forEach((f: any) => {
            const load = ((f.currentLoad / f.capacity) * 100).toFixed(1);
            response += `• **${f.name}** (${f.substationName})\n  Load: ${load}% | ${f.currentLoad.toFixed(1)}/${f.capacity} MW\n  DERs Available: ${f.connectedDERs}\n`;
          });
        }
        
        if (warningFeeders.length > 0) {
          response += "\n🟡 **WARNING FEEDERS:**\n";
          warningFeeders.forEach((f: any) => {
            const load = ((f.currentLoad / f.capacity) * 100).toFixed(1);
            response += `• **${f.name}** (${f.substationName})\n  Load: ${load}% | ${f.currentLoad.toFixed(1)}/${f.capacity} MW\n  DERs Available: ${f.connectedDERs}\n`;
          });
        }
        
        if (criticalFeeders.length === 0 && warningFeeders.length === 0) {
          response += "✅ **All feeders operating normally** - No critical or warning status detected";
        }
        
        return { response };
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
          response: "I'm here to help! Here are things I can do via BECKN Protocol:\n\n⚡ **Activate:** 'Activate DERs' or 'Turn on energy'\n🛑 **Deactivate:** 'Turn off DERs' or 'Stop resources'\n📊 **Status:** 'Check grid status' or 'What's the current load?'\n⚠️ **Analyze:** 'Show critical feeders' or 'Get recommendations'\n❌ **Dismiss:** 'Dismiss alerts' or 'Skip activation'\n📋 **History:** 'Show logs' or 'View activity'\n🔍 **Search:** 'Find available DERs'\n\nWhat would you like me to do?"
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
