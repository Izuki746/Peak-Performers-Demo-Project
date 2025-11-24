// Agent Orchestrator
// Analyzes grid problems and orchestrates Beckn journeys through the BAP Sandbox
// The agent understands the problem, makes decisions, and orchestrates the complete workflow

import * as bapSandbox from "./bap-sandbox";

export interface GridProblem {
  type: "demand-spike" | "feeder-overload" | "forecast-congestion" | "general-optimization";
  feederId?: string;
  substationId?: string;
  currentLoad?: number;
  capacity?: number;
  urgency: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface AgentDecision {
  step: number;
  action: "discover" | "select" | "init" | "confirm" | "status" | "cancel";
  reasoning: string;
  expectedOutcome: string;
}

export interface OrchestrationResult {
  success: boolean;
  problem: GridProblem;
  decisions: AgentDecision[];
  orderId?: string;
  executionTime: number;
  message: string;
  details?: string;
}

// Analyze the grid problem and create agent decisions
export function analyzeProblem(problem: GridProblem): AgentDecision[] {
  const decisions: AgentDecision[] = [];
  let step = 1;

  if (problem.urgency === "critical" || problem.urgency === "high") {
    // CRITICAL: Need immediate action
    decisions.push({
      step: step++,
      action: "discover",
      reasoning: `CRITICAL: ${problem.feederId || "Grid"} at critical capacity. Discovering active DER subscribers immediately.`,
      expectedOutcome: "BAP Sandbox returns list of active DER providers",
    });

    decisions.push({
      step: step++,
      action: "select",
      reasoning: "Selecting the most suitable and available DER resource",
      expectedOutcome: "Provider selected with quote and terms",
    });

    decisions.push({
      step: step++,
      action: "init",
      reasoning: "Preparing order with billing and fulfillment details for activation",
      expectedOutcome: "Order prepared and ready for confirmation",
    });

    decisions.push({
      step: step++,
      action: "confirm",
      reasoning: "CONFIRMING DER ACTIVATION to immediately reduce load",
      expectedOutcome: "DER activated, load reduction begins",
    });

    decisions.push({
      step: step++,
      action: "status",
      reasoning: "Verifying DER is active and load reduction is in effect",
      expectedOutcome: "Confirmation of active status",
    });
  } else if (problem.urgency === "medium") {
    // MEDIUM: Prepare but don't activate yet
    decisions.push({
      step: step++,
      action: "discover",
      reasoning: "Medium urgency - proactively discovering available DER options",
      expectedOutcome: "Get list of available providers",
    });

    decisions.push({
      step: step++,
      action: "select",
      reasoning: "Pre-selecting optimal resources for quick activation if needed",
      expectedOutcome: "DER resource prepared and quoted",
    });

    decisions.push({
      step: step++,
      action: "status",
      reasoning: "Monitoring and checking readiness",
      expectedOutcome: "Current availability status",
    });
  } else {
    // LOW: Information gathering only
    decisions.push({
      step: step++,
      action: "discover",
      reasoning: "Low urgency - monitoring available DER capacity for planning",
      expectedOutcome: "List of available resources for future use",
    });
  }

  return decisions;
}

// Execute the agent orchestration
export async function orchestrateGridResponse(problem: GridProblem): Promise<OrchestrationResult> {
  const startTime = Date.now();

  console.log("\n" + "=".repeat(60));
  console.log("AGENT ORCHESTRATOR - ANALYZING GRID PROBLEM");
  console.log("=".repeat(60));
  console.log(`\nProblem: ${problem.description}`);
  console.log(`Urgency: ${problem.urgency.toUpperCase()}`);
  console.log(`Feeder: ${problem.feederId || "N/A"}`);

  const decisions = analyzeProblem(problem);

  console.log(`\n📋 Agent Decision Plan:`);
  decisions.forEach((d) => {
    console.log(`   ${d.step}. ${d.action.toUpperCase()}`);
  });

  console.log("\n" + "-".repeat(60));
  console.log("EXECUTING BECKN JOURNEY THROUGH BAP SANDBOX");
  console.log("-".repeat(60));

  try {
    let orderId: string | undefined;

    // For critical/high urgency, execute full journey
    if (problem.urgency === "critical" || problem.urgency === "high") {
      const journeyResult = await bapSandbox.executeFullBecknjJourney("energy-dispatch", {
        amount: Math.round((problem.capacity || 100) * 0.5).toString(),
        unit: "kWh",
      });

      if (!journeyResult.success) {
        throw new Error("BAP Sandbox journey failed");
      }

      orderId = journeyResult.orderId;
    } else {
      // For medium/low urgency, just discover
      const discoverResult = await bapSandbox.discoverDERs("energy-dispatch");
      if (!discoverResult.success) {
        throw new Error("DER discovery failed");
      }
    }

    const executionTime = Date.now() - startTime;

    const result: OrchestrationResult = {
      success: true,
      problem,
      decisions,
      orderId,
      executionTime,
      message: `✅ Grid orchestration successful (${executionTime}ms)`,
      details:
        problem.urgency === "critical" || problem.urgency === "high"
          ? `DER activated: ${orderId}`
          : "DER capacity assessed and ready",
    };

    console.log("\n" + "=".repeat(60));
    console.log("ORCHESTRATION RESULT");
    console.log("=".repeat(60));
    console.log(`Status: ${result.message}`);
    if (result.orderId) {
      console.log(`Order ID: ${result.orderId}`);
    }
    console.log(`Time: ${executionTime}ms`);
    console.log("=".repeat(60) + "\n");

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.log("\n" + "=".repeat(60));
    console.log("ORCHESTRATION ERROR");
    console.log("=".repeat(60));
    console.log(`Error: ${String(error)}`);
    console.log("=".repeat(60) + "\n");

    return {
      success: false,
      problem,
      decisions,
      executionTime,
      message: `❌ Orchestration failed: ${String(error)}`,
    };
  }
}

// Test the agent with different scenarios
export async function runAgentScenarios() {
  console.log("\n\n");
  console.log("╔" + "═".repeat(58) + "╗");
  console.log("║" + " BAP SANDBOX AGENT - TEST SCENARIOS".padEnd(59) + "║");
  console.log("╚" + "═".repeat(58) + "╝");

  const scenarios: GridProblem[] = [
    {
      type: "demand-spike",
      feederId: "F-1234",
      substationId: "Westminster",
      currentLoad: 92,
      capacity: 95,
      urgency: "critical",
      description: "CRITICAL: Feeder F-1234 at 92% capacity - immediate DER activation required",
    },
    {
      type: "forecast-congestion",
      feederId: "F-5678",
      substationId: "Camden",
      currentLoad: 88,
      capacity: 90,
      urgency: "medium",
      description:
        "MEDIUM: Camden feeder forecast to reach 88% - prepare DERs proactively",
    },
    {
      type: "general-optimization",
      urgency: "low",
      description: "LOW: Routine capacity assessment and DER availability check",
    },
  ];

  for (const scenario of scenarios) {
    await orchestrateGridResponse(scenario);
    // Small delay between scenarios
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("✅ All scenarios executed!\n");
}
