import express from "express";
import { externalApis, fetchGridData } from "./api-integrations";

const router = express.Router();

// NESO Energy Data Portal Routes
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

// UK Power Networks API Routes
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

// Combined dashboard data
router.get("/api/external/dashboard", async (req, res) => {
  try {
    const [nesoStatus, ukpnFeeders, nesoForecast] = await Promise.all([
      fetchGridData("neso", "getGridStatus"),
      fetchGridData("ukpowernetworks", "getFeeders"),
      fetchGridData("neso", "getForecast", 24)
    ]);

    res.json({
      success: true,
      data: {
        national: nesoStatus,
        local: ukpnFeeders,
        forecast: nesoForecast
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch dashboard data" });
  }
});

export default router;
