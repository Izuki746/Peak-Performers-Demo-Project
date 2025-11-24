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

  const timestamp = new Date().toISOString();
  console.log(`\n[BAP Sandbox] ⏰ ${timestamp}`);
  console.log(`[BAP Sandbox] 📤 SENDING: ${action.toUpperCase()}`);
  console.log(`[BAP Sandbox] Transaction ID: ${payload.context.transaction_id}`);
  console.log(`[BAP Sandbox] Message ID: ${payload.context.message_id}`);
  console.log(`[BAP Sandbox] Domain: ${payload.context.domain}`);
  console.log(`[BAP Sandbox] 🔗 Endpoint: POST ${BAP_SANDBOX_URL}/api/sandbox/${action}`);
  console.log(`[BAP Sandbox] 📋 REQUEST PAYLOAD:`);
  console.log(JSON.stringify(payload, null, 2));

  switch (action) {
    case "search":
      const providers = [
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
      ];
      const searchResponse = {
        success: true,
        providers,
      };
      console.log(`[BAP Sandbox] 📥 RESPONSE: SEARCH`);
      console.log(`[BAP Sandbox] ✅ Success: true`);
      console.log(`[BAP Sandbox] 🏢 Providers found: ${providers.length}`);
      providers.forEach((p, i) => {
        console.log(`[BAP Sandbox]    ${i + 1}. ${p.descriptor.name} (${p.id})`);
      });
      console.log(`[BAP Sandbox] 📋 RESPONSE PAYLOAD:`);
      console.log(JSON.stringify(searchResponse, null, 2));
      return searchResponse;

    case "select":
      const selectionId = `SEL-${nanoid()}`;
      const selectResponse = {
        success: true,
        data: {
          id: selectionId,
          items: payload.message.items || [],
          quote: {
            price: { currency: "GBP", value: "250.00" },
            ttl: "PT30M",
          },
        },
      };
      console.log(`[BAP Sandbox] 📥 RESPONSE: SELECT`);
      console.log(`[BAP Sandbox] ✅ Success: true`);
      console.log(`[BAP Sandbox] 📋 Selection ID: ${selectionId}`);
      console.log(`[BAP Sandbox] 💰 Quote: GBP 250.00`);
      console.log(`[BAP Sandbox] ⏱️  Valid for: 30 minutes`);
      console.log(`[BAP Sandbox] 📋 RESPONSE PAYLOAD:`);
      console.log(JSON.stringify(selectResponse, null, 2));
      return selectResponse;

    case "init":
      const initOrderId = `ORD-${nanoid()}`;
      const initResponse = {
        success: true,
        data: {
          id: initOrderId,
          state: "DRAFT",
        },
      };
      console.log(`[BAP Sandbox] 📥 RESPONSE: INIT`);
      console.log(`[BAP Sandbox] ✅ Success: true`);
      console.log(`[BAP Sandbox] 📋 Order ID: ${initOrderId}`);
      console.log(`[BAP Sandbox] 🔄 State: DRAFT (prepared, not yet active)`);
      console.log(`[BAP Sandbox] 📋 RESPONSE PAYLOAD:`);
      console.log(JSON.stringify(initResponse, null, 2));
      return initResponse;

    case "confirm":
      const confirmOrderId = payload.message.id || `ORD-${nanoid()}`;
      const confirmResponse = {
        success: true,
        orderId: confirmOrderId,
        state: "ACTIVE",
      };
      console.log(`[BAP Sandbox] 📥 RESPONSE: CONFIRM`);
      console.log(`[BAP Sandbox] ✅ Success: true`);
      console.log(`[BAP Sandbox] 📋 Order ID: ${confirmOrderId}`);
      console.log(`[BAP Sandbox] 🔄 State: ACTIVE`);
      console.log(`[BAP Sandbox] ✨ DER IS NOW ACTIVELY REDUCING LOAD`);
      console.log(`[BAP Sandbox] 📋 RESPONSE PAYLOAD:`);
      console.log(JSON.stringify(confirmResponse, null, 2));
      return confirmResponse;

    case "status":
      const statusOrderId = payload.message.order_id;
      const statusResponse = {
        success: true,
        state: "ACTIVE",
        orderId: statusOrderId,
      };
      console.log(`[BAP Sandbox] 📥 RESPONSE: STATUS`);
      console.log(`[BAP Sandbox] ✅ Success: true`);
      console.log(`[BAP Sandbox] 📋 Order ID: ${statusOrderId}`);
      console.log(`[BAP Sandbox] 🔄 State: ACTIVE`);
      console.log(`[BAP Sandbox] ✅ DER is running and providing load reduction`);
      console.log(`[BAP Sandbox] 📋 RESPONSE PAYLOAD:`);
      console.log(JSON.stringify(statusResponse, null, 2));
      return statusResponse;

    case "cancel":
      const cancelOrderId = payload.message.order_id;
      const cancelResponse = {
        success: true,
        state: "CANCELLED",
        orderId: cancelOrderId,
      };
      console.log(`[BAP Sandbox] 📥 RESPONSE: CANCEL`);
      console.log(`[BAP Sandbox] ✅ Success: true`);
      console.log(`[BAP Sandbox] 📋 Order ID: ${cancelOrderId}`);
      console.log(`[BAP Sandbox] 🔄 State: CANCELLED`);
      console.log(`[BAP Sandbox] ⏹️  DER deactivated`);
      console.log(`[BAP Sandbox] 📋 RESPONSE PAYLOAD:`);
      console.log(JSON.stringify(cancelResponse, null, 2));
      return cancelResponse;

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
  console.log("\n" + "=".repeat(70));
  console.log("🚀 BECKN JOURNEY - COMPLETE WORKFLOW");
  console.log("=".repeat(70));
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log(`📝 Fulfillment Type: ${fulfillmentType}`);
  console.log(`📦 Quantity: ${quantity.amount} ${quantity.unit}`);

  try {
    // Step 1: DISCOVER
    console.log("\n" + "-".repeat(70));
    console.log("STEP 1️⃣  DISCOVER - Finding active DER subscribers");
    console.log("-".repeat(70));
    const discoverRes = await discoverDERs(fulfillmentType);
    if (!discoverRes.success || !discoverRes.providers?.length) {
      throw new Error("No providers found");
    }
    const provider = discoverRes.providers[0];

    // Step 2: SELECT
    console.log("\n" + "-".repeat(70));
    console.log("STEP 2️⃣  SELECT - Selecting provider and resources");
    console.log("-".repeat(70));
    console.log(`[Agent] Selecting provider: ${provider.descriptor.name}`);
    const selectRes = await selectDER(provider.id, quantity);
    if (!selectRes.success) throw new Error("Selection failed");

    // Step 3: INIT
    console.log("\n" + "-".repeat(70));
    console.log("STEP 3️⃣  INIT - Initializing order");
    console.log("-".repeat(70));
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 3600000).toISOString();
    console.log(`[Agent] Start Time: ${startTime}`);
    console.log(`[Agent] End Time: ${endTime}`);
    const initRes = await initOrder(provider.id, startTime, endTime);
    if (!initRes.success) throw new Error("Init failed");
    const orderId = initRes.data?.id || `ORD-${nanoid()}`;

    // Step 4: CONFIRM
    console.log("\n" + "-".repeat(70));
    console.log("STEP 4️⃣  CONFIRM - Confirming and activating DER");
    console.log("-".repeat(70));
    console.log(`[Agent] Confirming Order: ${orderId}`);
    const confirmRes = await confirmOrder(orderId, provider.id);
    if (!confirmRes.success) throw new Error("Confirmation failed");

    // Step 5: STATUS
    console.log("\n" + "-".repeat(70));
    console.log("STEP 5️⃣  STATUS - Verifying final status");
    console.log("-".repeat(70));
    const statusRes = await checkOrderStatus(orderId);
    if (!statusRes.success) throw new Error("Status check failed");

    console.log("\n" + "=".repeat(70));
    console.log("✅ BECKN JOURNEY COMPLETE!");
    console.log("=".repeat(70));
    console.log(`📋 Order ID: ${orderId}`);
    console.log(`🏢 Provider: ${provider.descriptor.name}`);
    console.log(`🔄 Final State: ${statusRes.state}`);
    console.log(`⏰ Completed: ${new Date().toISOString()}`);
    console.log("=".repeat(70) + "\n");

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
    console.log("\n" + "=".repeat(70));
    console.log("❌ BECKN JOURNEY FAILED!");
    console.log("=".repeat(70));
    console.error(`Error: ${String(error)}`);
    console.log("=".repeat(70) + "\n");
    return { success: false, error: String(error) };
  }
}
