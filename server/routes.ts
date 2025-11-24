import { Router, type Express } from "express";
import { createServer } from "node:http";
import { z } from "zod";
import { storage } from "./storage";
import * as beckn from "./beckn";
import { externalApis, fetchGridData } from "./api-integrations";
import * as bapSandbox from "./bap-sandbox";
import * as agentOrchestrator from "./agent-orchestrator";

const router = Router();

export async function registerRoutes(app: Express) {
  app.use(router);

  const server = createServer(app);
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

    const initResult = await beckn.initiateDERActivation(id, quantity, startTime, endTime);
    const confirmResult = await beckn.confirmDERActivation(
      id,
      initResult.orderId,
      quantity,
      startTime,
      endTime
    );

    const output = parseFloat(quantity.amount);
    if (feederId) {
      await storage.activateDERForFeeder(id, feederId, output, confirmResult.orderId);
    }

    res.json({
      success: true,
      data: confirmResult,
      message: `DER ${id} activated successfully via BECKN Protocol`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to activate DER",
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

export default router;
