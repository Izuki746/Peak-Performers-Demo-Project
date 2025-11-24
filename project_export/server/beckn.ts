import { nanoid } from "nanoid";
import type { BecknContext, BecknSearchRequest, BecknSearchResponse, DERResource } from "@shared/beckn-types";

// BECKN Protocol implementation for DEG (Digital Energy Grid)

const BECKN_GATEWAY_URL = process.env.BECKN_GATEWAY_URL || "http://localhost:3001";
const BAP_ID = process.env.BAP_ID || "grid-command-center";
const BAP_URI = process.env.BAP_URI || "http://localhost:5000";

export function createBecknContext(action: BecknContext["action"]): BecknContext {
  return {
    domain: "energy:deg",
    action,
    transaction_id: nanoid(),
    message_id: nanoid(),
    timestamp: new Date().toISOString(),
    version: "1.1.0",
    bap_id: BAP_ID,
    bap_uri: BAP_URI,
  };
}

export async function searchDERs(
  fulfillmentType: "energy-dispatch" | "energy-storage" | "energy-demand-reduction",
  quantity?: { amount: string; unit: "kWh" | "kW" }
): Promise<DERResource[]> {
  const context = createBecknContext("search");

  const request: BecknSearchRequest = {
    context,
    message: {
      intent: {
        fulfillment: {
          type: fulfillmentType,
          quantity,
        },
        item: {
          tags: {
            energy_type: "renewable",
          },
        },
      },
    },
  };

  try {
    // In production, send to BECKN Gateway
    // const response = await fetch(`${BECKN_GATEWAY_URL}/search`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(request),
    // });
    // return handleBecknResponse(response);

    // For now, return mock data
    console.log("[BECKN] Search request:", request);
    return getMockDERs();
  } catch (error) {
    console.error("[BECKN] Search error:", error);
    return getMockDERs();
  }
}

export async function selectDER(
  derId: string,
  quantity: { amount: string; unit: "kWh" | "kW" },
  startTime: string,
  endTime: string
): Promise<{ id: string; estimatedCost: number }> {
  const context = createBecknContext("select");

  try {
    // In production, would call BECKN BPP's /on_select
    console.log("[BECKN] Select request for DER:", derId);

    return {
      id: derId,
      estimatedCost: parseFloat(quantity.amount) * 45, // Mock pricing
    };
  } catch (error) {
    console.error("[BECKN] Select error:", error);
    throw error;
  }
}

export async function initiateDERActivation(
  derId: string,
  quantity: { amount: string; unit: "kWh" | "kW" },
  startTime: string,
  endTime: string
): Promise<{ orderId: string; status: string }> {
  const context = createBecknContext("init");

  try {
    // In production, would call BECKN BPP's /on_init
    console.log("[BECKN] Init request for DER:", derId);

    return {
      orderId: `ORD-${Date.now()}`,
      status: "initialized",
    };
  } catch (error) {
    console.error("[BECKN] Init error:", error);
    throw error;
  }
}

export async function confirmDERActivation(
  derId: string,
  orderId: string,
  quantity: { amount: string; unit: "kWh" | "kW" },
  startTime: string,
  endTime: string
): Promise<{ orderId: string; status: string; activationTime: string }> {
  const context = createBecknContext("confirm");

  try {
    // In production, would call BECKN BPP's /on_confirm
    console.log("[BECKN] Confirm request for order:", orderId);

    return {
      orderId,
      status: "confirmed",
      activationTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[BECKN] Confirm error:", error);
    throw error;
  }
}

export async function getDERActivationStatus(orderId: string): Promise<{
  orderId: string;
  status: "active" | "completed" | "failed" | "cancelled";
  currentOutput: number;
}> {
  const context = createBecknContext("status");

  try {
    // In production, would call BECKN BPP's /on_status
    console.log("[BECKN] Status request for order:", orderId);

    return {
      orderId,
      status: "active",
      currentOutput: Math.random() * 50 + 25,
    };
  } catch (error) {
    console.error("[BECKN] Status error:", error);
    throw error;
  }
}

export async function cancelDERActivation(orderId: string): Promise<{
  orderId: string;
  status: string;
  reason: string;
}> {
  const context = createBecknContext("cancel");

  try {
    // In production, would call BECKN BPP's /on_cancel
    console.log("[BECKN] Cancel request for order:", orderId);

    return {
      orderId,
      status: "cancelled",
      reason: "User requested cancellation",
    };
  } catch (error) {
    console.error("[BECKN] Cancel error:", error);
    throw error;
  }
}

function getMockDERs(): DERResource[] {
  // Simulating real BECKN DEG provider catalog
  return [
    {
      id: "DER-BATT-001",
      name: "Tesla Powerwall #42",
      type: "battery",
      capacity: 13.5,
      currentOutput: 8.2,
      location: { gps: "51.5074,-0.1278", address: "Westminster, London" },
      price_per_unit: 45,
      availability: "available",
    },
    {
      id: "DER-EV-002",
      name: "Rapid EV Charger Station B",
      type: "ev",
      capacity: 150,
      currentOutput: 0,
      location: { gps: "51.5195,-0.1383", address: "Camden, London" },
      price_per_unit: 50,
      availability: "available",
    },
    {
      id: "DER-SOLAR-003",
      name: "Commercial Solar Array",
      type: "solar",
      capacity: 25,
      currentOutput: 18.5,
      location: { gps: "51.5211,-0.0759", address: "Hackney, London" },
      price_per_unit: 35,
      availability: "available",
    },
    {
      id: "DER-DR-004",
      name: "Smart HVAC Load Controller",
      type: "demand_response",
      capacity: 50,
      currentOutput: 0,
      location: { gps: "51.5112,-0.1289", address: "Islington, London" },
      price_per_unit: 40,
      availability: "available",
    },
    {
      id: "DER-BATT-005",
      name: "Community Battery Bank",
      type: "battery",
      capacity: 200,
      currentOutput: 120,
      location: { gps: "51.5045,-0.0865", address: "Tower Hamlets, London" },
      price_per_unit: 42,
      availability: "available",
    },
    {
      id: "DER-DR-006",
      name: "Industrial Load Shift System",
      type: "demand_response",
      capacity: 300,
      currentOutput: 0,
      location: { gps: "51.5010,-0.1142", address: "Lambeth, London" },
      price_per_unit: 38,
      availability: "available",
    },
  ];
}
