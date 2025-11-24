// BAP Sandbox Integration
// The BAP Sandbox is fully self-contained
// It communicates internally with appropriate BPPs through the Beckn network
// Your only point of interaction is the BAP Sandbox APIs
// You do NOT call BPPs directly

import { nanoid } from "nanoid";

const BAP_SANDBOX_URL = process.env.BAP_SANDBOX_URL || "http://localhost:5001";

interface SandboxRequest {
  context: {
    domain: string;
    action: string;
    transaction_id: string;
    message_id: string;
    timestamp: string;
    version: string;
    bap_id: string;
    bap_uri: string;
  };
  message: any;
}

interface SandboxResponse {
  success: boolean;
  data?: any;
  error?: string;
  providers?: any[];
  state?: string;
  orderId?: string;
}

function createContext(action: string) {
  return {
    domain: "energy:deg",
    action,
    transaction_id: nanoid(),
    message_id: nanoid(),
    timestamp: new Date().toISOString(),
    version: "1.1.0",
    bap_id: process.env.BAP_ID || "grid-command-center",
    bap_uri: process.env.BAP_URI || "http://localhost:5000",
  };
}

async function callSandboxAPI(action: string, payload: SandboxRequest): Promise<SandboxResponse> {
  // Mock implementation - in production this would call the actual sandbox
  // const response = await fetch(`${BAP_SANDBOX_URL}/api/sandbox/${action}`, {...})

  console.log(`[BAP Sandbox] ${action.toUpperCase()}: Sending Beckn-compliant request...`);

  switch (action) {
    case "search":
      return {
        success: true,
        providers: [
          {
            id: "BPP-SOLAR-001",
            descriptor: { name: "Solar Energy Provider" },
            category_id: "SOLAR-PV",
          },
          {
            id: "BPP-BATTERY-001",
            descriptor: { name: "Battery Storage Provider" },
            category_id: "BATTERY-STORAGE",
          },
          {
            id: "BPP-DEMAND-001",
            descriptor: { name: "Demand Response Aggregator" },
            category_id: "DEMAND-RESPONSE",
          },
        ],
      };

    case "select":
      return {
        success: true,
        data: {
          id: `SEL-${nanoid()}`,
          items: payload.message.items || [],
          quote: {
            price: { currency: "GBP", value: "250.00" },
            ttl: "PT30M",
          },
        },
      };

    case "init":
      return {
        success: true,
        data: {
          id: `ORD-${nanoid()}`,
          state: "DRAFT",
        },
      };

    case "confirm":
      const orderId = payload.message.id || `ORD-${nanoid()}`;
      return {
        success: true,
        orderId,
        state: "ACTIVE",
      };

    case "status":
      return {
        success: true,
        state: "ACTIVE",
        orderId: payload.message.order_id,
      };

    case "cancel":
      return {
        success: true,
        state: "CANCELLED",
        orderId: payload.message.order_id,
      };

    default:
      return { success: false, error: "Unknown action" };
  }
}

export async function discoverDERs(fulfillmentType: string): Promise<SandboxResponse> {
  const message = {
    intent: {
      fulfillment: { type: fulfillmentType },
    },
  };

  const payload: SandboxRequest = { context: createContext("search"), message };
  return callSandboxAPI("search", payload);
}

export async function selectDER(
  providerId: string,
  quantity: { amount: string; unit: string }
): Promise<SandboxResponse> {
  const message = {
    order: {
      provider: { id: providerId },
      items: [
        {
          id: `ITEM-${nanoid()}`,
          quantity: { selected: { count: parseInt(quantity.amount) } },
        },
      ],
    },
  };

  const payload: SandboxRequest = { context: createContext("select"), message };
  return callSandboxAPI("select", payload);
}

export async function initOrder(
  providerId: string,
  startTime: string,
  endTime: string
): Promise<SandboxResponse> {
  const message = {
    order: {
      id: `ORD-${nanoid()}`,
      provider: { id: providerId },
      fulfillments: [{ start: { time: { range: { start: startTime, end: endTime } } } }],
      billing: { name: "Grid Operator", email: "operator@grid.local" },
    },
  };

  const payload: SandboxRequest = { context: createContext("init"), message };
  return callSandboxAPI("init", payload);
}

export async function confirmOrder(orderId: string, providerId: string): Promise<SandboxResponse> {
  const message = { order: { id: orderId, provider: { id: providerId } } };

  const payload: SandboxRequest = { context: createContext("confirm"), message };
  return callSandboxAPI("confirm", payload);
}

export async function checkOrderStatus(orderId: string): Promise<SandboxResponse> {
  const message = { order_id: orderId };

  const payload: SandboxRequest = { context: createContext("status"), message };
  return callSandboxAPI("status", payload);
}

export async function cancelOrder(orderId: string): Promise<SandboxResponse> {
  const message = { order_id: orderId };

  const payload: SandboxRequest = { context: createContext("cancel"), message };
  return callSandboxAPI("cancel", payload);
}

// Execute the complete Beckn journey through the sandbox
export async function executeFullBecknjJourney(
  fulfillmentType: string,
  quantity: { amount: string; unit: string }
): Promise<SandboxResponse> {
  console.log("\n[BAP Sandbox Agent] Starting Beckn Journey through BAP Sandbox...\n");

  try {
    // Step 1: DISCOVER - Find active subscribers
    console.log("1️⃣  DISCOVER - Finding active DER subscribers...");
    const discoverRes = await discoverDERs(fulfillmentType);
    if (!discoverRes.success || !discoverRes.providers?.length) {
      throw new Error("No providers found");
    }
    const provider = discoverRes.providers[0];
    console.log(`   ✅ Found ${discoverRes.providers.length} providers`);
    console.log(`   Selected: ${provider.descriptor.name}\n`);

    // Step 2: SELECT - Choose provider
    console.log("2️⃣  SELECT - Selecting provider and resources...");
    const selectRes = await selectDER(provider.id, quantity);
    if (!selectRes.success) throw new Error("Selection failed");
    console.log(`   ✅ Provider selected with quote: ${selectRes.data?.quote?.price?.value}\n`);

    // Step 3: INIT - Prepare order
    console.log("3️⃣  INIT - Initializing order...");
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 3600000).toISOString();
    const initRes = await initOrder(provider.id, startTime, endTime);
    if (!initRes.success) throw new Error("Init failed");
    const orderId = initRes.data?.id || `ORD-${nanoid()}`;
    console.log(`   ✅ Order initialized: ${orderId}\n`);

    // Step 4: CONFIRM - Execute order
    console.log("4️⃣  CONFIRM - Confirming and activating...");
    const confirmRes = await confirmOrder(orderId, provider.id);
    if (!confirmRes.success) throw new Error("Confirmation failed");
    console.log(`   ✅ Order CONFIRMED and ACTIVE\n`);

    // Step 5: STATUS - Verify
    console.log("5️⃣  STATUS - Verifying order status...");
    const statusRes = await checkOrderStatus(orderId);
    if (!statusRes.success) throw new Error("Status check failed");
    console.log(`   ✅ Status: ${statusRes.state}\n`);

    console.log("🎯 Beckn Journey Complete! DER activated through BAP Sandbox.\n");

    return {
      success: true,
      orderId,
      data: {
        orderId,
        provider: provider.descriptor.name,
        quantity,
        status: statusRes.state,
      },
    };
  } catch (error) {
    console.error(`\n❌ Journey failed: ${String(error)}\n`);
    return { success: false, error: String(error) };
  }
}
