# Grid Command Center Design Guidelines

## Design Approach

**Selected Framework:** Carbon Design System adapted for mission-critical grid operations

**Rationale:** This is a utility-focused, information-dense control room application where operational efficiency, data clarity, and decision speed are paramount. Carbon Design System provides the robust foundation needed for enterprise-grade monitoring dashboards with real-time data visualization.

## Core Design Principles

1. **Clarity Over Decoration** - Every pixel serves a functional purpose
2. **Information Hierarchy** - Critical alerts and metrics demand immediate attention
3. **Operational Confidence** - Professional, stable interface that operators trust
4. **Rapid Comprehension** - Grid state understood within 3 seconds of viewing

## Typography System

**Font Family:** IBM Plex Sans (Carbon's native typeface)
- **Dashboard Headers:** 28px/Bold - Main section titles
- **Panel Titles:** 20px/Semibold - Component headers (Feeders, DERs, Alerts)
- **Data Labels:** 14px/Medium - Metric labels, table headers
- **Body Text:** 14px/Regular - Descriptions, chatbot messages
- **Small Text:** 12px/Regular - Timestamps, secondary info
- **Numerical Data:** IBM Plex Mono 16px/Medium - For metrics requiring precision

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: `p-6` to `p-8`
- Section gaps: `gap-6` or `gap-8`
- Card spacing: `space-y-4`
- Tight elements: `gap-2` (badges, pills)

**Grid Structure:**
- **Main Dashboard:** 4-column grid (`grid-cols-4 gap-6`)
  - Left sidebar (1 col): Feeder list navigation
  - Main area (2 cols): Real-time metrics, active alerts, grid visualization
  - Right panel (1 col): Chatbot + quick actions
- **Responsive:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

## Component Library

### 1. **Status Cards**
- Compact metric displays (grid health, demand level, active DERs)
- Icon (16px) + Large number (32px/Bold) + Label (12px/Regular)
- Border thickness: `border-2` for active states, `border` for normal

### 2. **Feeder List Panel**
- Scrollable list with fixed header
- Each item: Feeder ID + Status badge + Load percentage
- Hover state: subtle background change
- Active selection: distinct border treatment
- Grouped by substation

### 3. **Alert System**
- Prominent banner for critical alerts (sub-5 second detection)
- Alert cards with severity badges (Critical/Warning/Info)
- Icon (24px) + Message + Timestamp + Action button
- Auto-dismissable with manual override

### 4. **DER Catalogue Grid**
- Card-based layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Each card: DER type icon + ID + Status (Active/Idle) + Capacity + Activate button
- Quick activation: Large prominent button (`px-6 py-3`)
- Categorized tabs: Batteries, EVs, Solar, Demand Response

### 5. **Feeder Detail Modal**
- Full-screen overlay with close button
- Header: Feeder ID + Location + Current status
- Tabbed interface:
  - Overview: Load curve chart, capacity gauge, connected DERs count
  - DERs: Detailed list with individual activation controls
  - History: Recent events timeline
  - Recommendations: AI-suggested actions
- Action footer: Primary "Activate Recommended DERs" button

### 6. **Chatbot Interface**
- Fixed right-side panel or expandable drawer
- Message bubbles with avatar icons (User vs AI)
- Action confirmations embedded in chat (buttons within messages)
- Status indicators: "Analyzing feeders...", "Activating DERs..."
- Input field with send button and quick action chips

### 7. **Audit Log Viewer**
- Data table with fixed header, sortable columns
- Columns: Timestamp, Action Type, Operator/Agent, Target (Feeder/DER), Beckn Transaction ID, Status
- Row expansion for detailed payload view
- Export button for compliance reporting

### 8. **Navigation Bar**
- Top horizontal bar (`h-16`)
- Logo + Dashboard title + Grid health indicator + User profile
- Minimal, non-distracting

### 9. **Real-time Metrics Dashboard**
- KPI cards in grid layout
- Live updating counters with subtle animation
- Comparison indicators (vs. previous hour/day)
- Metrics: Total Load, Available Capacity, Active DERs, Response Time

## Interaction Patterns

### DER Activation Workflow
1. Click feeder from list → Modal opens with details
2. Review load curve and recommendations
3. Click individual DER or "Activate All Recommended"
4. Confirmation dialog with Beckn transaction preview
5. Progress indicator during activation
6. Success notification with transaction ID

### Chatbot Execution Flow
1. User types query (e.g., "Check feeder F-1234 status")
2. Chatbot shows loading state
3. Displays results in formatted cards within chat
4. Offers action buttons: "Activate recommended DERs for F-1234"
5. User confirms → Beckn workflow executes → Status updates in chat

## Special Considerations

**Real-time Updates:**
- Pulsing indicators for active data streams
- Subtle animations for state changes (avoid distraction)
- Toast notifications for background events

**Critical Alerts:**
- High contrast treatment
- Persistent until acknowledged
- Audio notification option (configurable)

**Data Visualization:**
- Line charts for load trends (use recharts or similar)
- Gauge charts for capacity utilization
- Simple bar charts for DER comparison
- Heat maps for multi-feeder overview

**Accessibility:**
- High contrast ratios for all text
- Keyboard navigation for all actions
- ARIA labels for dynamic content
- Focus indicators on all interactive elements

**Performance:**
- Virtualized scrolling for long lists (feeder/DER catalogues)
- Debounced API calls (300ms)
- Optimistic UI updates for instant feedback

## Layout Specifications

**Dashboard Structure:**
```
[Top Nav Bar - h-16]
[Main Container - flex]
  [Left Sidebar - w-80] - Feeder list with search
  [Center Area - flex-1 grid grid-cols-2 gap-6]
    [Metrics Row - col-span-2] - 4 KPI cards
    [Alerts Panel - col-span-1] - Active warnings
    [Grid Viz - col-span-1] - Network overview
    [Active DERs - col-span-2] - Current activations
  [Right Panel - w-96] - Chatbot interface
```

**Responsive Breakpoints:**
- Mobile: Stack all to single column, hide sidebar (hamburger menu)
- Tablet: 2-column layout, collapsible sidebar
- Desktop: Full 4-column grid as described

This design prioritizes operational efficiency and data clarity while maintaining Carbon Design System's enterprise-grade consistency.