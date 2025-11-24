# Grid-Scale Demand Flexibility Platform
## Beckn ONIX + UEI Integration

This platform implements the **Unified Energy Interface (UEI)** specification with **Beckn ONIX** for grid-scale demand flexibility and DER orchestration.

---

## **Key Features**

### 🔄 **Beckn Protocol Workflows**
- ✅ **Search** - Find available DER resources via BECKN Gateway
- ✅ **Select** - Choose specific DERs for activation
- ✅ **Init** - Initiate DER activation orders
- ✅ **Confirm** - Confirm and activate DER resources
- ✅ **Status** - Track DER activation status in real-time
- ✅ **Cancel** - Deactivate DERs and cancel orders

### 🌍 **External API Integrations**

#### **NESO Energy Data Portal**
- National demand and renewable generation data
- Balancing services availability
- Grid forecasting (24-hour predictions)
- Frequency and voltage stability metrics

**API Endpoints:**
```
GET /api/external/neso/grid-status
GET /api/external/neso/balancing-services
GET /api/external/neso/forecast?hours=24
```

#### **UK Power Networks v2.1**
- Substation and feeder data
- Real-time load profiles
- Operating Mode Limits (OML)
- Connected DER information

**API Endpoints:**
```
GET /api/external/ukpn/substations?region=London
GET /api/external/ukpn/feeders
GET /api/external/ukpn/ders/:feederId
GET /api/external/ukpn/load-profile/:feederId
GET /api/external/ukpn/oml/:substationId
```

### 📊 **Real-Time Load Reduction**
- Active DERs automatically reduce feeder loads
- Dynamic feeder status updates (Critical → Warning → Normal)
- Base + calculated current load tracking
- Aggregate DER contribution per feeder

### 🤖 **AI Grid Assistant**
- Natural language command processing
- Intelligent intent recognition
- Automated Beckn workflow execution
- Real-time grid analysis and recommendations

### 📈 **Dashboard Features**
- Grid status KPIs (demand, renewable %, margins)
- Critical feeder alerts with auto-remediation
- DER inventory with activation controls
- Load forecasting
- Audit logs with compliance tracking

---

## **Architecture**

```
┌─────────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)               │
│  Dashboard | Feeders | AI Assistant | Audit Logs  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│         Backend (Express + Node.js)                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Beckn Protocol Engine (beckn.ts)            │  │
│  │  - Search, Select, Init, Confirm, Status    │  │
│  ├──────────────────────────────────────────────┤  │
│  │  Storage Layer (storage.ts)                  │  │
│  │  - DER activation tracking                   │  │
│  │  - Feeder load calculation                   │  │
│  ├──────────────────────────────────────────────┤  │
│  │  External APIs (api-integrations.ts)         │  │
│  │  - NESO Energy Data Portal                   │  │
│  │  - UK Power Networks v2.1                    │  │
│  ├──────────────────────────────────────────────┤  │
│  │  API Routes (routes.ts, routes-api-...)      │  │
│  │  - Beckn workflows                           │  │
│  │  - External data endpoints                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│    External Services (Integration Layer)            │
│  • NESO Energy Data Portal API                      │
│  • UK Power Networks API v2.1                       │
│  • Beckn Protocol Network Gateway                   │
└─────────────────────────────────────────────────────┘
```

---

## **UEI Schema Implementation**

The platform implements the **Unified Energy Interface (UEI)** message format:

### **Energy Fulfillment Types**
- `energy-dispatch` - DER activation for demand response
- `ev-charging` - EV charging station management
- `battery-storage` - Battery storage orchestration
- `demand-response` - Load shifting/shedding

### **DER Types**
- `solar-pv` - Photovoltaic systems
- `wind` - Wind turbines
- `battery-storage` - Energy storage systems
- `ev` - Electric vehicles
- `demand-response` - Flexible loads
- `hydro` - Hydroelectric resources

### **UEI Workflow Example**

```typescript
// 1. SEARCH - Discover DERs
POST /api/der/search
{
  fulfillmentType: "energy-dispatch",
  quantity: { amount: "50", unit: "kWh" }
}

// 2. SELECT - Choose specific DER
POST /api/der/DER-001/select
{
  quantity: { amount: "50", unit: "kWh" },
  startTime: "2025-11-24T22:00:00Z",
  endTime: "2025-11-24T23:00:00Z"
}

// 3. INIT - Prepare activation
// (Beckn workflow - internal)

// 4. CONFIRM - Execute activation
POST /api/der/DER-001/activate
{
  quantity: { amount: "50", unit: "kWh" },
  feederId: "F-1234",  // Optional: track load reduction
  startTime: "2025-11-24T22:00:00Z",
  endTime: "2025-11-24T23:00:00Z"
}

// 5. STATUS - Track order
GET /api/der/status/ORD-12345

// 6. CANCEL - Deactivate
POST /api/der/ORD-12345/cancel
```

---

## **Setting Up API Keys**

### **NESO Energy Data Portal**
1. Visit: https://www.neso.energy/data-portal/api-guidance
2. Sign up and generate API key
3. Store in environment: `NESO_API_KEY=your_key_here`

### **UK Power Networks API v2.1**
1. Visit: https://ukpowernetworks.opendatasoft.com/api/explore/v2.1/console
2. Request API access
3. Store in environment: `UK_POWER_NETWORKS_API_KEY=your_key_here`

### **Environment Variables**
```bash
# .env or environment setup
NESO_API_KEY=your_neso_key
UK_POWER_NETWORKS_API_KEY=your_ukpn_key
BECKN_GATEWAY_URL=https://beckn-gateway.example.com
BAP_ID=your-grid-operator-id
BAP_URI=https://your-grid-operator.com
SESSION_SECRET=your_session_secret_here
```

---

## **Project Structure**

```
project/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx           # Grid KPIs + status
│       │   ├── Feeders.tsx             # Feeder management
│       │   ├── AIAssistant.tsx          # AI chatbot with Beckn
│       │   └── AuditLogs.tsx            # Compliance logs
│       └── components/
│           ├── ChatbotPanel.tsx         # Chat UI
│           ├── FeederCard.tsx           # Feeder display
│           └── DERCard.tsx              # DER inventory
├── server/
│   ├── app.ts                           # Express setup
│   ├── beckn.ts                         # Beckn Protocol engine
│   ├── storage.ts                       # State management
│   ├── api-integrations.ts              # NESO + UK Power Networks
│   ├── routes.ts                        # API endpoints
│   └── routes-api-integration.ts        # External API routes
└── shared/
    ├── schema.ts                        # Drizzle data models
    ├── beckn-types.ts                   # Beckn message types
    └── uei-schema.ts                    # UEI specification types
```

---

## **Running the Application**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:5000
```

---

## **Usage Examples**

### **AI Assistant Commands**
- "Find available DERs" → Beckn search
- "Activate DERs" → Auto-selects critical feeder, activates top DER
- "Show grid status" → NESO national + UK Power Networks local data
- "Check critical feeders" → Lists feeders at risk

### **Direct API Calls**

**Get National Grid Status (NESO)**
```bash
curl http://localhost:5000/api/external/neso/grid-status
```

**Get Local Feeder Data (UK Power Networks)**
```bash
curl http://localhost:5000/api/external/ukpn/feeders
```

**Search for DERs**
```bash
curl -X POST http://localhost:5000/api/der/search \
  -H "Content-Type: application/json" \
  -d '{
    "fulfillmentType": "energy-dispatch",
    "quantity": { "amount": "50", "unit": "kWh" }
  }'
```

**Activate a DER**
```bash
curl -X POST http://localhost:5000/api/der/DER-001/activate \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": { "amount": "50", "unit": "kWh" },
    "feederId": "F-1234",
    "startTime": "2025-11-24T22:00:00Z",
    "endTime": "2025-11-24T23:00:00Z"
  }'
```

---

## **Compliance & Audit**

The platform tracks all DER activations with:
- ✅ Timestamp of decision
- ✅ Operator/AI initiator
- ✅ Beckn transaction ID
- ✅ DER response details
- ✅ Feeder impact (load reduction)
- ✅ Order status (pending, active, completed, cancelled)

**Audit Log Export**
```bash
curl http://localhost:5000/api/audit-logs
```

---

## **Beckn ONIX Resources**

- **GitHub**: https://github.com/beckn/Unified-Energy-Interface
- **Docs**: https://becknprotocol.io/beckn-onix/
- **User Guide**: https://becknprotocol.io/beckn-onix-user-guide/
- **Alliance**: https://ueialliance.org

---

## **License & References**

- **Beckn Protocol**: Open-source (Apache 2.0)
- **NESO**: https://www.neso.energy/data-portal
- **UK Power Networks**: https://ukpowernetworks.opendatasoft.com

---

**Built for DSOs (Distribution System Operators) managing demand flexibility at scale.**
