// External API Integrations
// NESO Energy Data Portal & UK Power Networks

const NESO_BASE_URL = "https://www.neso.energy/data-portal/api";
const UK_POWER_NETWORKS_BASE_URL = "https://ukpowernetworks.opendatasoft.com/api/explore/v2.1";

// Mock API responses (would use real APIs in production with proper authentication)
export const externalApis = {
  // NESO Energy Data Portal
  neso: {
    getGridStatus: async () => {
      // In production: fetch(`${NESO_BASE_URL}/grid-status`, { headers: { Authorization: `Bearer ${NESO_API_KEY}` }})
      return {
        timestamp: new Date().toISOString(),
        nationalDemand: {
          current: 32456, // MW
          forecast: 34200,
          unit: "MW",
          trend: "increasing"
        },
        renewableGeneration: {
          current: 8234, // MW
          percentage: 25.4,
          solar: 2145,
          wind: 6089,
          unit: "MW"
        },
        frequency: 50.02, // Hz
        frequency_status: "normal",
        margin: 4200, // MW spare capacity
        margin_status: "adequate"
      };
    },

    getBalancingServices: async () => {
      // fetch(`${NESO_BASE_URL}/balancing-services`)
      return {
        timestamp: new Date().toISOString(),
        demandResponse: {
          available: 2450, // MW
          active: 234,
          providers: 156
        },
        fastReserve: {
          available: 1200,
          active: 456,
          rampUpTime: 10 // minutes
        },
        shortTermOperatingReserve: {
          available: 3400,
          active: 789
        }
      };
    },

    getForecast: async (hours: number = 24) => {
      // fetch(`${NESO_BASE_URL}/forecast?hours=${hours}`)
      const forecast = [];
      const now = new Date();
      for (let i = 0; i < hours; i++) {
        const hour = new Date(now.getTime() + i * 3600000);
        forecast.push({
          timestamp: hour.toISOString(),
          demand: 32000 + Math.random() * 5000, // MW
          renewable_percentage: 20 + Math.random() * 15,
          surplus_capacity: 3500 + Math.random() * 2000 // MW
        });
      }
      return { forecast };
    }
  },

  // UK Power Networks API v2.1
  ukpowernetworks: {
    getSubstations: async (region?: string) => {
      // fetch(`${UK_POWER_NETWORKS_BASE_URL}/datasets/circuits-132k-circuit/records?limit=100`)
      return {
        records: [
          {
            recordid: "sub-001",
            fields: {
              name: "Westminster Substation",
              region: region || "London",
              voltage: "132 kV",
              substations_served: 4,
              estimated_capacity: 95,
              current_load: 87.5
            }
          },
          {
            recordid: "sub-002",
            fields: {
              name: "Camden Substation",
              region: region || "London",
              voltage: "132 kV",
              substations_served: 3,
              estimated_capacity: 90,
              current_load: 68.2
            }
          },
          {
            recordid: "sub-003",
            fields: {
              name: "Hackney Substation",
              region: region || "London",
              voltage: "132 kV",
              substations_served: 5,
              estimated_capacity: 85,
              current_load: 42.1
            }
          }
        ],
        total_count: 3
      };
    },

    getFeeders: async (substationId?: string) => {
      // fetch(`${UK_POWER_NETWORKS_BASE_URL}/datasets/circuits-11kv-circuit/records?limit=100`)
      return {
        records: [
          {
            recordid: "feeder-1",
            fields: {
              feeder_name: "Feeder F-1234",
              substation_id: substationId || "sub-001",
              substation_name: "Westminster Substation",
              voltage: "11 kV",
              capacity_amps: 400,
              current_load_amps: 368,
              load_percentage: 92,
              fault_level: 12500,
              last_updated: new Date().toISOString()
            }
          },
          {
            recordid: "feeder-2",
            fields: {
              feeder_name: "Feeder F-5678",
              substation_id: substationId || "sub-002",
              substation_name: "Camden Substation",
              voltage: "11 kV",
              capacity_amps: 400,
              current_load_amps: 302,
              load_percentage: 75.5,
              fault_level: 12500,
              last_updated: new Date().toISOString()
            }
          }
        ],
        total_count: 2
      };
    },

    getConnectedDERs: async (feederId: string) => {
      // fetch(`${UK_POWER_NETWORKS_BASE_URL}/datasets/distributed-generation-connections/records?where=feeder_id='${feederId}'`)
      return {
        records: [
          {
            recordid: "der-001",
            fields: {
              dg_name: "Rooftop Solar Array",
              connection_point: feederId,
              technology: "PV",
              capacity_kw: 15,
              commissioned_date: "2021-06-15",
              export_limit_kw: 12,
              status: "operational"
            }
          },
          {
            recordid: "der-002",
            fields: {
              dg_name: "Community Battery Storage",
              connection_point: feederId,
              technology: "Battery Storage",
              capacity_kw: 45,
              capacity_kwh: 180,
              commissioned_date: "2023-01-20",
              export_limit_kw: 40,
              status: "operational"
            }
          }
        ],
        total_count: 2
      };
    },

    getLoadProfile: async (feederId: string, hours: number = 24) => {
      // fetch(`${UK_POWER_NETWORKS_BASE_URL}/datasets/load-profiles/records?where=feeder_id='${feederId}'`)
      const profile = [];
      const now = new Date();
      for (let i = 0; i < hours; i++) {
        const hour = new Date(now.getTime() - (hours - i) * 3600000);
        profile.push({
          timestamp: hour.toISOString(),
          load_amps: 250 + Math.random() * 150,
          load_percentage: (250 + Math.random() * 150) / 4,
          harmonic_distortion: 3.5 + Math.random() * 2,
          voltage_variation: 0.02 + Math.random() * 0.04
        });
      }
      return { profile };
    },

    getOperatingModeLimits: async (substationId: string) => {
      // fetch(`${UK_POWER_NETWORKS_BASE_URL}/datasets/oml-data/records?where=substation_id='${substationId}'`)
      return {
        oml: {
          substation_id: substationId,
          circuit_name: "F-1234",
          oml_amperes: 400,
          emergency_amperes: 450,
          voltage_level: "11 kV",
          frequency_normal_range: [49.8, 50.2],
          voltage_normal_range: [10.1, 11.5],
          last_updated: new Date().toISOString()
        }
      };
    }
  }
};

// Helper to fetch real data (with fallback to mock)
export async function fetchGridData(source: "neso" | "ukpowernetworks", endpoint: string, params?: any) {
  try {
    if (source === "neso") {
      // In production with API key:
      // const response = await fetch(`${NESO_BASE_URL}/${endpoint}`, {
      //   headers: { Authorization: `Bearer ${process.env.NESO_API_KEY}` }
      // });
      return (externalApis.neso as any)[endpoint]?.(params);
    } else if (source === "ukpowernetworks") {
      // In production with API key:
      // const response = await fetch(`${UK_POWER_NETWORKS_BASE_URL}/datasets/${endpoint}/records`, {
      //   headers: { Authorization: `Bearer ${process.env.UK_POWER_NETWORKS_API_KEY}` }
      // });
      return (externalApis.ukpowernetworks as any)[endpoint]?.(params);
    }
  } catch (error) {
    console.error(`Error fetching ${source} data:`, error);
  }
  return null;
}
