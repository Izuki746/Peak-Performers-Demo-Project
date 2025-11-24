# BAP Sandbox Agent Implementation Guide

## What You Implemented

You've built an **Agent Orchestrator** that communicates with the **BAP Sandbox** to orchestrate grid demand flexibility through the Beckn Protocol.

---

## Key Architecture

### **BAP Sandbox Concept**
```
Your Agent (Grid Command Center)
         ↓
    BAP Sandbox APIs (Fully Self-Contained)
         ↓
  [Handles all Beckn network communication internally]
         ↓
    BPPs (Beckn Platform Providers)
    - Solar operators
    - Battery storage
    - Demand response aggregators
```

**Important:** Your agent ONLY talks to the BAP Sandbox. The sandbox handles BPP communication internally.

---

## Files Created

| File | Purpose |
|------|---------|
| `server/bap-sandbox.ts` | Communicates with BAP Sandbox APIs |
| `server/agent-orchestrator.ts` | Analyzes problems and orchestrates journeys |
| `server/routes.ts` | API endpoints (updated with new routes) |

---

## How It Works

### **Step 1: Agent Receives Grid Problem**
```typescript
{
  type: "demand-spike",
  feederId: "F-1234",
  urgency: "critical",
  description: "Feeder at 92% capacity"
}
```

### **Step 2: Agent Analyzes & Plans**
```
ANALYSIS:
- Urgency: CRITICAL → Need immediate action
- Decision plan: Discover → Select → Init → Confirm → Status
```

### **Step 3: Agent Sends Beckn Requests to BAP Sandbox**

**1. DISCOVER**
```json
{
  "context": { "domain": "energy:deg", "action": "search", ... },
  "message": { "intent": { "fulfillment": { "type": "energy-dispatch" } } }
}
```
↓ *Sandbox handles BPP discovery internally*

**2. SELECT**
```json
{
  "context": { "domain": "energy:deg", "action": "select", ... },
  "message": { "order": { "provider": { "id": "BPP-001" }, ... } }
}
```

**3. INIT**
```json
{
  "context": { "domain": "energy:deg", "action": "init", ... },
  "message": { "order": { "id": "ORD-123", ... } }
}
```

**4. CONFIRM**
```json
{
  "context": { "domain": "energy:deg", "action": "confirm", ... },
  "message": { "order": { "id": "ORD-123", "state": "CONFIRMED" } }
}
```

**5. STATUS**
```json
{
  "context": { "domain": "energy:deg", "action": "status", ... },
  "message": { "order_id": "ORD-123" }
}
```

### **Step 4: Agent Returns Result**
```json
{
  "success": true,
  "orderId": "ORD-123",
  "decisions": [...],
  "message": "✅ DER activated"
}
```

---

## Decision Logic

### **CRITICAL Urgency**
- ✅ Execute FULL journey
- ✅ Discover → Select → Init → Confirm → Status
- ✅ Result: DER activated immediately

### **MEDIUM Urgency**
- ✅ Execute partial journey
- ✅ Discover → Select → Status
- ✅ Result: DER prepared, ready for quick activation

### **LOW Urgency**
- ✅ Information gathering only
- ✅ Discover only
- ✅ Result: Capacity assessment

---

## API Endpoints

### **Test the Agent**

```bash
# Critical scenario
curl -X POST http://localhost:5000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "demand-spike",
    "feederId": "F-1234",
    "urgency": "critical",
    "description": "Feeder at 92% capacity"
  }'

# Medium urgency
curl -X POST http://localhost:5000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "forecast-congestion",
    "feederId": "F-5678",
    "urgency": "medium",
    "description": "Predicted spike in 15 mins"
  }'

# Low urgency
curl -X POST http://localhost:5000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "general-optimization",
    "urgency": "low",
    "description": "Routine capacity check"
  }'
```

### **Direct BAP Sandbox Calls**

```bash
# Execute full journey
curl -X POST http://localhost:5000/api/sandbox/journey \
  -H "Content-Type: application/json" \
  -d '{
    "fulfillmentType": "energy-dispatch",
    "quantity": { "amount": "50", "unit": "kWh" }
  }'

# Just discover
curl -X POST http://localhost:5000/api/sandbox/discover \
  -H "Content-Type: application/json" \
  -d '{ "fulfillmentType": "energy-dispatch" }'
```

---

## Beckn Context Fields

Every request includes a Beckn context:

```typescript
{
  domain: "energy:deg",              // Digital Energy Grid
  action: "search|select|init|confirm|status|cancel",
  transaction_id: "unique-id",       // Links request→response
  message_id: "unique-id",           // Message identifier
  timestamp: "ISO-8601",             // Request time
  version: "1.1.0",                  // Beckn protocol version
  bap_id: "grid-command-center",     // Your BAP identifier
  bap_uri: "http://localhost:5000"   // Your BAP endpoint
}
```

---

## Production Deployment

### **Step 1: Deploy BAP Sandbox**
```bash
# Download from: https://becknprotocol.io/beckn-onix/
# Deploy with Docker or Kubernetes
docker-compose up -d bap-sandbox
```

### **Step 2: Set Environment Variables**
```bash
export BAP_SANDBOX_URL=https://your-bap-sandbox.com
export BAP_ID=your-grid-operator-id
export BAP_URI=https://your-grid-operator-app.com
export SESSION_SECRET=random-secure-string
```

### **Step 3: Update API Integration**
In `server/bap-sandbox.ts`, replace mock responses with real API calls:

```typescript
async function callSandboxAPI(action: string, payload: SandboxRequest) {
  // Replace this:
  // return mockResponses[action];
  
  // With this:
  const response = await fetch(`${BAP_SANDBOX_URL}/api/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  return response.json();
}
```

### **Step 4: Register with BPPs**
- Solar providers register with your sandbox
- Battery storage operators register
- Demand response aggregators register
- Sandbox maintains the registry

---

## Testing Scenarios

### **Scenario 1: Critical Load**
```bash
curl -X POST http://localhost:5000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "demand-spike",
    "feederId": "F-1234",
    "substationId": "Westminster",
    "currentLoad": 92,
    "capacity": 95,
    "urgency": "critical",
    "description": "Westminster feeder at 92% - activation required"
  }'
```

**Expected:**
- DISCOVER: Finds 3+ DER providers
- SELECT: Chooses best provider
- INIT: Prepares order
- CONFIRM: Activates DER
- STATUS: Confirms active
- Result: `orderId` returned

### **Scenario 2: Forecast Warning**
```bash
curl -X POST http://localhost:5000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "forecast-congestion",
    "feederId": "F-5678",
    "urgency": "medium",
    "description": "Camden predicted 88% in 15 mins"
  }'
```

**Expected:**
- DISCOVER: Gets available resources
- SELECT: Pre-selects optimal DER
- STATUS: Checks readiness
- Result: `ready` for quick activation

### **Scenario 3: Routine Check**
```bash
curl -X POST http://localhost:5000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "general-optimization",
    "urgency": "low",
    "description": "Weekly capacity assessment"
  }'
```

**Expected:**
- DISCOVER: Lists available resources
- Result: Capacity report

---

## Response Structure

All agent responses follow this structure:

```json
{
  "success": true|false,
  "problem": { /* your problem */ },
  "decisions": [
    {
      "step": 1,
      "action": "discover",
      "reasoning": "Why this step",
      "expectedOutcome": "What we expect"
    },
    // ... more decisions
  ],
  "orderId": "ORD-123",  // If activated
  "executionTime": 1234,  // milliseconds
  "message": "Status message",
  "details": "Additional info"
}
```

---

## Understanding Beckn Messages

### **Search (Discover)**
Request: "Find all energy dispatch providers"
Response: List of BPPs with catalog

### **Select**
Request: "I want this provider's solar energy"
Response: Quote with price and terms

### **Init**
Request: "Prepare order with these details"
Response: Draft order created

### **Confirm**
Request: "Activate this order"
Response: Order confirmed, DER active

### **Status**
Request: "What's the order status?"
Response: Current state (ACTIVE, COMPLETED, etc.)

### **Cancel**
Request: "Deactivate this order"
Response: Order cancelled

---

## Key Differences from Direct BPP Calls

❌ **DON'T DO THIS:**
```typescript
// Wrong: Direct BPP communication
fetch("https://bpp-solar.com/api/search");
```

✅ **DO THIS:**
```typescript
// Correct: Via BAP Sandbox
fetch("https://bap-sandbox.com/api/search");
// Sandbox handles:
// - Broadcasting to all BPPs
// - Collecting responses
// - Returning aggregated results
// - Network protocol handling
```

---

## Debugging

### **Check Agent Logs**
```bash
# Watch the workflow logs
# Look for: [Agent Orchestrator] and [BAP Sandbox] markers
```

### **Test Individual Steps**
```bash
# Test discovery only
curl -X POST http://localhost:5000/api/sandbox/discover \
  -H "Content-Type: application/json" \
  -d '{"fulfillmentType": "energy-dispatch"}'
```

### **Verify Beckn Context**
- Check `transaction_id` links request→response
- Verify `timestamp` is ISO-8601
- Confirm `domain` is "energy:deg"
- Ensure `action` matches endpoint

---

## Next Steps

1. **Get BAP Sandbox**: Deploy from https://github.com/beckn/onix
2. **Register BPPs**: Add solar, storage, demand response providers
3. **Set API Keys**: Configure real NESO and UK Power Networks data
4. **Test**: Run agent scenarios
5. **Monitor**: Check audit logs for compliance
6. **Deploy**: Go live with real grid data

---

**Your agent is now ready to orchestrate grid demand flexibility at scale!** 🚀
