// Unified Energy Interface (UEI) Schema
// Based on Beckn ONIX Open Network for Energy Transactions

export interface UEIContext {
  domain: "energy:deg"; // Digital Energy Grid
  action: "search" | "select" | "init" | "confirm" | "status" | "cancel";
  transaction_id: string;
  message_id: string;
  timestamp: string;
  version: "1.1.0";
  bap_id: string;
  bap_uri: string;
}

export interface EnergyItem {
  id: string;
  descriptor: {
    name: string;
    short_desc?: string;
    long_desc?: string;
    images?: string[];
  };
  price?: {
    currency: string;
    value: string;
  };
  quantity?: {
    selected: {
      count: number;
    };
  };
  category_id?: string;
  category_tag_ids?: string[];
  location_id?: string;
  provider_id?: string;
  rateable?: boolean;
}

export interface EnergyFulfillment {
  id: string;
  type: "energy-dispatch" | "ev-charging" | "battery-storage" | "demand-response";
  start?: {
    location?: {
      gps?: string;
      address?: string;
    };
    time?: {
      range?: {
        start: string;
        end: string;
      };
    };
  };
  end?: {
    location?: {
      gps?: string;
      address?: string;
    };
    time?: {
      range?: {
        start: string;
        end: string;
      };
    };
  };
  state?: {
    descriptor?: {
      code: string;
      name?: string;
    };
  };
  tags?: {
    display: boolean;
    descriptor: {
      code: string;
      name?: string;
    };
    list?: Array<{
      descriptor: {
        code: string;
        name?: string;
      };
      value: string;
      display?: boolean;
    }>;
  }[];
}

export interface DERProfile {
  id: string;
  name: string;
  type: "solar-pv" | "wind" | "battery-storage" | "ev" | "demand-response" | "hydro";
  capacity: {
    value: number;
    unit: "kW" | "kWh" | "MW" | "MWh";
  };
  location: {
    gps?: string;
    address?: string;
    feederId?: string;
  };
  status: "available" | "active" | "inactive" | "maintenance";
  owner: string;
  provider: string;
  responseTime: number; // seconds
  tags?: Record<string, string>;
}

export interface GridFeedr {
  id: string;
  name: string;
  substation: {
    id: string;
    name: string;
    location: string;
  };
  capacity: {
    value: number;
    unit: "kW" | "MW";
  };
  currentLoad: {
    value: number;
    unit: "kW" | "MW";
  };
  status: "normal" | "warning" | "critical";
  voltage?: number;
  frequency?: number;
  harmonicDistortion?: number;
  connectedDERs: number;
  lastUpdated: string;
}

export interface UEISearchRequest {
  context: UEIContext;
  message: {
    intent: {
      fulfillment: EnergyFulfillment;
      item?: Partial<EnergyItem>;
      provider?: {
        id?: string;
        descriptor?: {
          name?: string;
        };
      };
    };
  };
}

export interface UEIOrder {
  id: string;
  state: "created" | "accepted" | "in-progress" | "completed" | "cancelled" | "failed";
  items: EnergyItem[];
  billing: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  fulfillments: EnergyFulfillment[];
  quote?: {
    price: {
      currency: string;
      value: string;
    };
    breakup?: Array<{
      title: string;
      price: {
        currency: string;
        value: string;
      };
    }>;
    ttl: string;
  };
  payments?: Array<{
    uri: string;
    tl_method: string;
    params?: Record<string, string>;
    status?: string;
    type?: string;
  }>;
}

export type { DERProfile as DER };
export type { GridFeedr as Feeder };
