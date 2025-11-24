// BECKN Protocol types for DEG (Digital Energy Grid)

export interface BecknContext {
  domain: "energy:deg";
  action: "search" | "select" | "init" | "confirm" | "status" | "cancel";
  transaction_id: string;
  message_id: string;
  timestamp: string;
  version: "1.1.0";
  bap_id: string;
  bap_uri: string;
  bpp_id?: string;
  bpp_uri?: string;
  ttl?: string;
}

export interface DERResource {
  id: string;
  name: string;
  type: "battery" | "ev" | "solar" | "demand_response";
  capacity: number;
  currentOutput: number;
  location?: {
    gps: string;
    address: string;
  };
  price_per_unit?: number;
  availability?: string;
}

export interface BecknSearchRequest {
  context: BecknContext;
  message: {
    intent: {
      fulfillment: {
        type: "energy-dispatch" | "energy-storage" | "energy-demand-reduction";
        quantity?: {
          amount: string;
          unit: "kWh" | "kW";
        };
        start_time?: string;
        end_time?: string;
      };
      item?: {
        tags: {
          energy_type?: "renewable" | "grid" | "stored";
          location?: string;
        };
      };
    };
  };
}

export interface BecknSearchResponse {
  context: BecknContext;
  message: {
    catalog: {
      bpp_providers: Array<{
        id: string;
        descriptor: {
          name: string;
          short_desc: string;
        };
        items: DERResource[];
      }>;
    };
  };
}

export interface BecknSelectRequest {
  context: BecknContext;
  message: {
    order: {
      items: Array<{
        id: string;
        quantity: {
          count: number;
          measure: {
            value: string;
            unit: "kWh" | "kW";
          };
        };
      }>;
      fulfillment: {
        type: string;
        start_time: string;
        end_time: string;
      };
    };
  };
}

export interface BecknConfirmRequest {
  context: BecknContext;
  message: {
    order: {
      id?: string;
      items: Array<{
        id: string;
        quantity: {
          count: number;
          measure: {
            value: string;
            unit: "kWh" | "kW";
          };
        };
      }>;
      fulfillment: {
        start_time: string;
        end_time: string;
        state: {
          descriptor: {
            code: "initiated";
          };
        };
      };
      payment: {
        status: "NOT-PAID";
      };
    };
  };
}

export interface BecknStatusRequest {
  context: BecknContext;
  message: {
    order_id: string;
  };
}

export interface BecknStatusResponse {
  context: BecknContext;
  message: {
    order: {
      id: string;
      state: "active" | "completed" | "failed" | "cancelled";
      items: Array<{
        id: string;
        fulfillment_id: string;
        status: "active" | "completed" | "failed";
      }>;
      fulfillment: {
        start_time: string;
        end_time: string;
        state: {
          descriptor: {
            code: string;
          };
        };
      };
    };
  };
}
