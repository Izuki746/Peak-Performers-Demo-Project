import { Router, type Express } from "express";
import { createServer } from "node:http";
import { z } from "zod";
import { storage } from "./storage";
import * as beckn from "./beckn";

const router = Router();

export async function registerRoutes(app: Express) {
  app.use(router);
  
  const server = createServer(app);
  return server;
}

// BECKN Protocol DER Search
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

// BECKN Protocol DER Selection
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

// BECKN Protocol DER Activation (Init + Confirm combined)
router.post("/api/der/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, startTime, endTime, feederId } = req.body;

    // Step 1: Init
    const initResult = await beckn.initiateDERActivation(id, quantity, startTime, endTime);

    // Step 2: Confirm
    const confirmResult = await beckn.confirmDERActivation(
      id,
      initResult.orderId,
      quantity,
      startTime,
      endTime
    );

    // Step 3: Track DER activation and update feeder load
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

// Get Feeders with calculated loads
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

// BECKN Protocol Check Status
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

// BECKN Protocol Cancel
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

export default router;
