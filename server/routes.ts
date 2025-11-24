import { Router, type Express } from "express";
import { createServer } from "node:http";
import { z } from "zod";
import { storage } from "./storage";
import * as beckn from "./beckn";
import { externalApis, fetchGridData } from "./api-integrations";
import * as bapSandbox from "./bap-sandbox";
import * as agentOrchestrator from "./agent-orchestrator";

const router = Router();

// Module-level state for pending auto-activation requests (accessible to all endpoints)
const pendingAutoActivationRequests = new Set<string>();

export async function registerRoutes(app: Express) {
  app.use(router);

  const server = createServer(app);
  
  // ============================================
  // AUTO-DEACTIVATION MONITOR
  // ============================================
  // Checks every 5 seconds if feeders are under control (SLA: <5s operations)
  // If load drops below 75% capacity, automatically deactivates DERs
  
  const AUTO_DEACTIVATION_INTERVAL = 5000; // 5 seconds for sub-5s SLA
  const LOAD_THRESHOLD_PERCENT = 75; // Auto-deactivate when below 75% load
  const CRITICAL_LOAD_PERCENT = 90; // Request user activation when above 90% load
  
  setInterval(async () => {
    try {
      const feeders = await storage.getFeedersWithLoad();
      const activeDERs = await storage.getAllActiveDERs();
      
      for (const feeder of feeders) {
        const loadPercent = (feeder.currentLoad / feeder.capacity) * 100;
        const feederActiveDERs = activeDERs.filter(d => d.feederId === feeder.id);
        
        // If load is under control and there are active DERs, deactivate them
        if (loadPercent < LOAD_THRESHOLD_PERCENT && feederActiveDERs.length > 0) {
          console.log(`\n⚡ AUTO-DEACTIVATION CHECK: Feeder ${feeder.id}`);
          console.log(`   Current Load: ${feeder.currentLoad.toFixed(1)}/${feeder.capacity} kW (${loadPercent.toFixed(1)}%)`);
          console.log(`   Status: Under Control - Deactivating ${feederActiveDERs.length} DER(s)`);
          
          for (const der of feederActiveDERs) {
            await storage.deactivateDER(der.orderId);
            console.log(`   ✅ DER ${der.derId} (Order ${der.orderId}) DEACTIVATED`);
          }
          
          console.log(`   📊 New Load: ${feeder.currentLoad.toFixed(1)}/${feeder.capacity} kW\n`);
          pendingAutoActivationRequests.delete(feeder.id); // Clear any pending request
        }
        // If load is critical and NO DERs are active, request user activation
        else if (loadPercent > CRITICAL_LOAD_PERCENT && feederActiveDERs.length === 0 && !pendingAutoActivationRequests.has(feeder.id)) {
          console.log(`\n🚨 CRITICAL LOAD DETECTED: Feeder ${feeder.id}`);
          console.log(`   Current Load: ${feeder.currentLoad.toFixed(1)}/${feeder.capacity} kW (${loadPercent.toFixed(1)}%)`);
          console.log(`   Status: CRITICAL - Requesting user confirmation to activate DERs`);
          pendingAutoActivationRequests.add(feeder.id);
        }
      }
    } catch (error) {
      console.error("[AUTO-DEACTIVATION] Error:", error);
    }
  }, AUTO_DEACTIVATION_INTERVAL);
  
  console.log(`⚡ Auto-Deactivation Monitor started (checks every ${AUTO_DEACTIVATION_INTERVAL / 1000}s)`);
  console.log(`   Threshold: ${LOAD_THRESHOLD_PERCENT}% of feeder capacity\n`);

  return server;
}

// ============================================
// BECKN PROTOCOL ROUTES
// ============================================

router.post("/api/der/search", async (req, res) => {
  try {
    const { fulfillmentType, quantity } = req.body;
    const ders = await beckn.searchDERs(fulfillmentType || "energy-dispatch", quantity);
    res.json({
      success: true,
      data: ders,
      message: `Found ${ders.length} available DER resources via BECKN Protocol`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search DERs",
    });
  }
});

router.post("/api/der/:id/select", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, startTime, endTime } = req.body;
    const result = await beckn.selectDER(id, quantity, startTime, endTime);
    res.json({
      success: true,
      data: result,
      message: `DER ${id} selected successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to select DER",
    });
  }
});

router.post("/api/der/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, startTime, endTime, feederId } = req.body;

    console.log(`\n🔌 DER ACTIVATION REQUEST: ${id}`);
    console.log(`   Requested Quantity: ${quantity?.amount} ${quantity?.unit}`);
    console.log(`   Feeder: ${feederId || "N/A"}`);

    // Execute full Beckn journey through BAP Sandbox for complete workflow
    const journeyResult = await bapSandbox.executeFullBecknjJourney(
      "energy-dispatch",
      quantity || { amount: "50", unit: "kWh" }
    );

    if (!journeyResult.success) {
      throw new Error("Beckn journey failed");
    }

    const output = parseFloat(quantity?.amount || "50");
    if (feederId) {
      console.log(`   💾 Recording load reduction on feeder: ${feederId}`);
      await storage.activateDERForFeeder(id, feederId, output, journeyResult.orderId);
      console.log(`   ✅ Feeder load updated - currentLoad reduced by ${output}kW`);
    }

    console.log(`\n✨ DER ${id} ACTIVATED`);
    console.log(`   Order ID: ${journeyResult.orderId}`);
    console.log(`   Status: ACTIVE`);
    console.log(`   Load Reduction: ${output} kW\n`);

    res.json({
      success: true,
      data: {
        orderId: journeyResult.orderId,
        derId: id,
        status: "ACTIVE",
        output,
        message: `DER ${id} activated via complete Beckn journey`
      },
      message: `DER ${id} activated successfully via BECKN Protocol`,
    });
  } catch (error) {
    console.error(`❌ DER activation failed: ${String(error)}`);
    res.status(500).json({
      success: false,
      error: "Failed to activate DER",
    });
  }
});

// ============================================
// DER DEACTIVATION ENDPOINT
// ============================================

router.post("/api/der/:orderId/deactivate", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`\n🔴 DER DEACTIVATION REQUEST`);
    console.log(`   Order ID: ${orderId}`);
    
    await storage.deactivateDER(orderId);
    
    console.log(`✅ DER DEACTIVATED - Load reduction removed\n`);
    
    res.json({
      success: true,
      message: `DER deactivated successfully`,
    });
  } catch (error) {
    console.error(`❌ DER deactivation failed: ${String(error)}`);
    res.status(500).json({
      success: false,
      error: "Failed to deactivate DER",
    });
  }
});

router.get("/api/feeders", async (req, res) => {
  try {
    const feeders = await storage.getFeedersWithLoad();
    res.json({
      success: true,
      data: feeders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch feeders",
    });
  }
});

// ============================================
// AUTO-ACTIVATION ENDPOINTS
// ============================================

router.get("/api/auto-activation-requests", async (req, res) => {
  try {
    const pendingRequests = Array.from(pendingAutoActivationRequests);
    res.json({
      success: true,
      data: {
        pendingFeeders: pendingRequests,
        count: pendingRequests.length
      }
    });
  } catch (error) {
    console.error("[AUTO-ACTIVATION] Error fetching requests:", error);
    res.json({
      success: true,
      data: {
        pendingFeeders: [],
        count: 0
      }
    });
  }
});

router.post("/api/auto-activation/:feederId/confirm", async (req, res) => {
  try {
    const { feederId } = req.params;
    
    console.log(`\n✅ USER CONFIRMED AUTO-ACTIVATION: Feeder ${feederId}`);
    console.log(`   Searching for available DERs...`);
    
    // Get feeder info
    const feeders = await storage.getFeedersWithLoad();
    const feeder = feeders.find(f => f.id === feederId);
    
    if (!feeder) {
      return res.status(404).json({
        success: false,
        error: "Feeder not found",
      });
    }
    
    // Search for DERs
    const searchResponse = await beckn.searchDERs("energy-dispatch", {
      amount: Math.round((feeder.capacity - feeder.currentLoad) * 0.8).toString(),
      unit: "kWh"
    });
    
    const availableDERs = searchResponse.slice(0, 2); // Activate top 2 DERs
    console.log(`   Found ${availableDERs.length} available DERs`);
    
    // Activate DERs
    const activationPromises = availableDERs.map((der: any) =>
      (async () => {
        const journeyResult = await bapSandbox.executeFullBecknjJourney(
          "energy-dispatch",
          { amount: "25", unit: "kWh" }
        );
        
        if (journeyResult.success) {
          await storage.activateDERForFeeder(der.id, feederId, 25, journeyResult.orderId);
          console.log(`   ✅ DER ${der.id} ACTIVATED (Order: ${journeyResult.orderId})`);
          return journeyResult;
        }
        throw new Error("Journey failed");
      })()
    );
    
    await Promise.all(activationPromises);
    pendingAutoActivationRequests.delete(feederId);
    
    console.log(`\n🎉 Auto-activation complete for ${feederId}\n`);
    
    // Log the action
    await storage.addAuditLog(
      "Auto-Activation Confirmed",
      "Operator: System User",
      `Feeder ${feederId}`,
      "success",
      `User confirmed auto-activation and activated ${availableDERs.length} DER(s) via Beckn Protocol`
    );
    
    res.json({
      success: true,
      message: `Auto-activated DERs for feeder ${feederId}`,
      dersActivated: availableDERs.length
    });
  } catch (error) {
    console.error(`❌ Auto-activation failed: ${String(error)}`);
    res.status(500).json({
      success: false,
      error: "Failed to auto-activate DERs",
    });
  }
});

router.post("/api/auto-activation/:feederId/dismiss", async (req, res) => {
  try {
    const { feederId } = req.params;
    
    console.log(`\n❌ USER DISMISSED AUTO-ACTIVATION: Feeder ${feederId}\n`);
    pendingAutoActivationRequests.delete(feederId);
    
    // Log the action
    await storage.addAuditLog(
      "Auto-Activation Dismissed",
      "Operator: System User",
      `Feeder ${feederId}`,
      "info",
      "User dismissed auto-activation alert for critical feeder"
    );
    
    res.json({
      success: true,
      message: `Dismissed auto-activation request for feeder ${feederId}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to dismiss auto-activation request",
    });
  }
});

// ============================================
// AUDIT LOG ENDPOINTS
// ============================================

router.get("/api/audit-logs", async (req, res) => {
  try {
    const logs = await storage.getAuditLogs();
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("[AUDIT-LOG] Error fetching logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
});

router.get("/api/der/status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const status = await beckn.getDERActivationStatus(orderId);
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get DER status",
    });
  }
});

router.post("/api/der/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await beckn.cancelDERActivation(orderId);
    res.json({
      success: true,
      data: result,
      message: `Order ${orderId} cancelled successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to cancel DER activation",
    });
  }
});

// ============================================
// EXTERNAL API ROUTES (NESO + UK Power Networks)
// ============================================

router.get("/api/external/neso/grid-status", async (req, res) => {
  try {
    const data = await fetchGridData("neso", "getGridStatus");
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch grid status" });
  }
});

router.get("/api/external/neso/balancing-services", async (req, res) => {
  try {
    const data = await fetchGridData("neso", "getBalancingServices");
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch balancing services" });
  }
});

router.get("/api/external/neso/forecast", async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const data = await fetchGridData("neso", "getForecast", hours);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch forecast" });
  }
});

router.get("/api/external/ukpn/substations", async (req, res) => {
  try {
    const region = req.query.region as string;
    const data = await fetchGridData("ukpowernetworks", "getSubstations", region);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch substations" });
  }
});

router.get("/api/external/ukpn/feeders", async (req, res) => {
  try {
    const substationId = req.query.substation_id as string;
    const data = await fetchGridData("ukpowernetworks", "getFeeders", substationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch feeders" });
  }
});

router.get("/api/external/ukpn/ders/:feederId", async (req, res) => {
  try {
    const { feederId } = req.params;
    const data = await fetchGridData("ukpowernetworks", "getConnectedDERs", feederId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch DERs" });
  }
});

router.get("/api/external/ukpn/load-profile/:feederId", async (req, res) => {
  try {
    const { feederId } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    const data = await fetchGridData("ukpowernetworks", "getLoadProfile", feederId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch load profile" });
  }
});

router.get("/api/external/ukpn/oml/:substationId", async (req, res) => {
  try {
    const { substationId } = req.params;
    const data = await fetchGridData("ukpowernetworks", "getOperatingModeLimits", substationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch operating mode limits" });
  }
});

router.get("/api/external/dashboard", async (req, res) => {
  try {
    const [nesoStatus, ukpnFeeders, nesoForecast] = await Promise.all([
      fetchGridData("neso", "getGridStatus"),
      fetchGridData("ukpowernetworks", "getFeeders"),
      fetchGridData("neso", "getForecast", 24),
    ]);

    res.json({
      success: true,
      data: {
        national: nesoStatus,
        local: ukpnFeeders,
        forecast: nesoForecast,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch dashboard data" });
  }
});

// ============================================
// BAP SANDBOX ROUTES
// ============================================

router.post("/api/sandbox/discover", async (req, res) => {
  try {
    const result = await bapSandbox.discoverDERs(req.body.fulfillmentType || "energy-dispatch");
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post("/api/sandbox/journey", async (req, res) => {
  try {
    const result = await bapSandbox.executeFullBecknjJourney(
      req.body.fulfillmentType || "energy-dispatch",
      req.body.quantity || { amount: "50", unit: "kWh" }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AGENT ORCHESTRATOR ROUTES
// ============================================

router.post("/api/agent/orchestrate", async (req, res) => {
  try {
    const problem = req.body;
    const result = await agentOrchestrator.orchestrateGridResponse(problem);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get("/api/agent/analyze", async (req, res) => {
  try {
    const exampleProblem = {
      type: "demand-spike",
      feederId: "F-1234",
      substationId: "Westminster",
      currentLoad: 92,
      capacity: 95,
      urgency: "critical",
      description: "Feeder F-1234 at Westminster exceeding 92% capacity",
    };

    const decisions = agentOrchestrator.analyzeProblem(exampleProblem);
    res.json({
      success: true,
      problem: exampleProblem,
      decisions,
      message: "Agent analysis complete",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// BAP CALLBACK ENDPOINTS (from Sandbox/BPPs)
// ============================================
// These endpoints receive callbacks from the BAP Sandbox when responding to Beckn requests

router.post("/beckn/on_search", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("\n" + "=".repeat(70));
    console.log("📨 BAP CALLBACK RECEIVED: on_search");
    console.log("=".repeat(70));
    console.log(`Transaction ID: ${context?.transaction_id}`);
    console.log(`Message ID: ${context?.message_id}`);
    console.log(`Timestamp: ${context?.timestamp}`);
    console.log(`Providers: ${message?.catalog?.providers?.length || 0}`);
    if (message?.catalog?.providers) {
      message.catalog.providers.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`  ${i + 1}. ${p.descriptor?.name} (${p.id})`);
      });
    }
    console.log("=".repeat(70) + "\n");
    res.json({ ack: { status: "ACK" } });
  } catch (error) {
    console.error("[BAP] on_search callback error:", error);
    res.status(400).json({ ack: { status: "NACK" } });
  }
});

router.post("/beckn/on_select", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("\n" + "=".repeat(70));
    console.log("📨 BAP CALLBACK RECEIVED: on_select");
    console.log("=".repeat(70));
    console.log(`Transaction ID: ${context?.transaction_id}`);
    console.log(`Order ID: ${message?.order?.id}`);
    console.log(`Quote: ${message?.order?.quote?.price?.value} ${message?.order?.quote?.price?.currency}`);
    console.log("=".repeat(70) + "\n");
    res.json({ ack: { status: "ACK" } });
  } catch (error) {
    console.error("[BAP] on_select callback error:", error);
    res.status(400).json({ ack: { status: "NACK" } });
  }
});

router.post("/beckn/on_init", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("\n" + "=".repeat(70));
    console.log("📨 BAP CALLBACK RECEIVED: on_init");
    console.log("=".repeat(70));
    console.log(`Transaction ID: ${context?.transaction_id}`);
    console.log(`Order ID: ${message?.order?.id}`);
    console.log(`State: ${message?.order?.state}`);
    console.log("=".repeat(70) + "\n");
    res.json({ ack: { status: "ACK" } });
  } catch (error) {
    console.error("[BAP] on_init callback error:", error);
    res.status(400).json({ ack: { status: "NACK" } });
  }
});

router.post("/beckn/on_confirm", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("\n" + "=".repeat(70));
    console.log("📨 BAP CALLBACK RECEIVED: on_confirm");
    console.log("=".repeat(70));
    console.log(`Transaction ID: ${context?.transaction_id}`);
    console.log(`Order ID: ${message?.order?.id}`);
    console.log(`State: ${message?.order?.state}`);
    console.log(`Provider: ${message?.order?.provider?.descriptor?.name}`);
    console.log("✨ DER IS NOW ACTIVE AND PROVIDING LOAD REDUCTION");
    console.log("=".repeat(70) + "\n");
    res.json({ ack: { status: "ACK" } });
  } catch (error) {
    console.error("[BAP] on_confirm callback error:", error);
    res.status(400).json({ ack: { status: "NACK" } });
  }
});

router.post("/beckn/on_status", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("\n" + "=".repeat(70));
    console.log("📨 BAP CALLBACK RECEIVED: on_status");
    console.log("=".repeat(70));
    console.log(`Transaction ID: ${context?.transaction_id}`);
    console.log(`Order ID: ${message?.order?.id}`);
    console.log(`State: ${message?.order?.state}`);
    console.log(`Current Output: ${message?.order?.fulfillments?.[0]?.state?.descriptor?.gps || "N/A"}`);
    console.log("=".repeat(70) + "\n");
    res.json({ ack: { status: "ACK" } });
  } catch (error) {
    console.error("[BAP] on_status callback error:", error);
    res.status(400).json({ ack: { status: "NACK" } });
  }
});

router.post("/beckn/on_cancel", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("\n" + "=".repeat(70));
    console.log("📨 BAP CALLBACK RECEIVED: on_cancel");
    console.log("=".repeat(70));
    console.log(`Transaction ID: ${context?.transaction_id}`);
    console.log(`Order ID: ${message?.order?.id}`);
    console.log(`State: ${message?.order?.state}`);
    console.log("=".repeat(70) + "\n");
    res.json({ ack: { status: "ACK" } });
  } catch (error) {
    console.error("[BAP] on_cancel callback error:", error);
    res.status(400).json({ ack: { status: "NACK" } });
  }
});

// ============================================
// BAP HEALTH & DIAGNOSTIC ENDPOINTS
// ============================================

router.get("/beckn/health", async (req, res) => {
  res.json({
    status: "healthy",
    bap_id: process.env.BAP_ID || "grid-command-center",
    bap_uri: process.env.BAP_URI || "http://localhost:5000",
    endpoints: {
      on_search: "POST /beckn/on_search",
      on_select: "POST /beckn/on_select",
      on_init: "POST /beckn/on_init",
      on_confirm: "POST /beckn/on_confirm",
      on_status: "POST /beckn/on_status",
      on_cancel: "POST /beckn/on_cancel"
    }
  });
});

export default router;
