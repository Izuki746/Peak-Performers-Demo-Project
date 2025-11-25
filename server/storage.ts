import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// DER activation tracking
interface ActiveDER {
  derId: string;
  feederId: string;
  output: number; // kW
  activatedAt: Date;
  orderId: string;
}

interface FeederWithCalculatedLoad {
  id: string;
  name: string;
  substationName: string;
  baseLoad: number;
  currentLoad: number; // base - active DER contributions
  capacity: number;
  status: "critical" | "warning" | "normal";
  criticality: "critical" | "high" | "medium" | "low";
  connectedDERs: number;
  activeDERContribution: number; // total kW from active DERs
  activeDERs?: ActiveDER[]; // List of DERs actively helping this feeder
  responseTime?: number; // ms since last DER activation
  isResponding?: boolean; // true if DERs are currently responding
}

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  target: string;
  status: "success" | "error" | "info";
  description: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  activateDERForFeeder(derId: string, feederId: string, output: number, orderId: string): Promise<ActiveDER>;
  deactivateDER(orderId: string): Promise<void>;
  getActiveDERsForFeeder(feederId: string): Promise<ActiveDER[]>;
  getAllActiveDERs(): Promise<ActiveDER[]>;
  getFeedersWithLoad(): Promise<FeederWithCalculatedLoad[]>;
  addAuditLog(action: string, user: string, target: string, status: "success" | "error" | "info", description: string): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private activeDERs: Map<string, ActiveDER>; // key: orderId
  private auditLogs: AuditLog[] = [];
  private feederBaseLoads: Map<string, { baseLoad: number; targetLoad: number; variance: number }>;
  private feederActivationTimes: Map<string, number>; // track when DERs were last activated
  private mockFeeders: FeederWithCalculatedLoad[] = [
    {
      id: "F-1234",
      name: "Feeder F-1234",
      substationName: "Westminster Substation",
      baseLoad: 70.0,
      currentLoad: 70.0,
      capacity: 95,
      status: "normal",
      criticality: "medium",
      connectedDERs: 12,
      activeDERContribution: 0
    },
    {
      id: "F-5678",
      name: "Feeder F-5678",
      substationName: "Camden Substation",
      baseLoad: 60.0,
      currentLoad: 60.0,
      capacity: 90,
      status: "normal",
      criticality: "medium",
      connectedDERs: 8,
      activeDERContribution: 0
    },
    {
      id: "F-9012",
      name: "Feeder F-9012",
      substationName: "Hackney Substation",
      baseLoad: 42.1,
      currentLoad: 42.1,
      capacity: 85,
      status: "normal",
      criticality: "medium",
      connectedDERs: 15,
      activeDERContribution: 0
    },
    {
      id: "F-3456",
      name: "Feeder F-3456",
      substationName: "Islington Substation",
      baseLoad: 35.8,
      currentLoad: 35.8,
      capacity: 80,
      status: "normal",
      criticality: "low",
      connectedDERs: 6,
      activeDERContribution: 0
    },
    {
      id: "F-7890",
      name: "Feeder F-7890",
      substationName: "Tower Hamlets Substation",
      baseLoad: 55.2,
      currentLoad: 55.2,
      capacity: 75,
      status: "normal",
      criticality: "medium",
      connectedDERs: 10,
      activeDERContribution: 0
    },
    {
      id: "F-2468",
      name: "Feeder F-2468",
      substationName: "Lambeth Substation",
      baseLoad: 62.0,
      currentLoad: 62.0,
      capacity: 85,
      status: "normal",
      criticality: "medium",
      connectedDERs: 14,
      activeDERContribution: 0
    }
  ];

  constructor() {
    this.users = new Map();
    this.activeDERs = new Map();
    this.feederActivationTimes = new Map();
    
    // Initialize dynamic load tracking for each feeder
    this.feederBaseLoads = new Map();
    this.mockFeeders.forEach(feeder => {
      this.feederBaseLoads.set(feeder.id, {
        baseLoad: feeder.baseLoad,
        targetLoad: feeder.baseLoad,
        variance: 0
      });
    });
    
    // Start dynamic load simulation
    this.startDynamicLoadSimulation();
  }

  private startDynamicLoadSimulation() {
    // Update loads every 3 seconds to simulate grid fluctuations
    // But keep them stable most of the time - only spike occasionally
    let cycleCount = 0;
    
    setInterval(() => {
      cycleCount++;
      this.feederBaseLoads.forEach((loadData, feederId) => {
        // Most cycles (80% of time): small variations (±5%)
        // Some cycles (20% of time): larger variations (±8%)
        // Only occasional spikes to critical levels
        
        let maxVariance = loadData.baseLoad * 0.05; // Default: ±5%
        
        // 20% of the time, allow slightly larger variations
        if (cycleCount % 5 === 0) {
          maxVariance = loadData.baseLoad * 0.08; // Every 5th cycle: ±8%
        }
        
        // Only 10% chance to spike near critical (once every 10 cycles)
        if (cycleCount % 10 === 0 && Math.random() < 0.5) {
          // Spike to near-critical for this one feeder
          loadData.variance = loadData.baseLoad * 0.12; // Push to ~97% of capacity
        } else {
          // Normal small random walk
          const change = (Math.random() - 0.5) * maxVariance * 0.2;
          loadData.variance += change;
          
          // Keep variance within bounds (smaller than before)
          if (Math.abs(loadData.variance) > maxVariance) {
            loadData.variance = Math.sign(loadData.variance) * (maxVariance * 0.8);
          }
        }
        
        // Gradually return to baseline if not spiking
        loadData.variance *= 0.95; // Decay towards baseline
        
        loadData.targetLoad = loadData.baseLoad + loadData.variance;
        loadData.targetLoad = Math.max(0, Math.min(loadData.targetLoad, 100));
      });
    }, 3000);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async activateDERForFeeder(derId: string, feederId: string, output: number, orderId: string): Promise<ActiveDER> {
    const activeDER: ActiveDER = {
      derId,
      feederId,
      output,
      activatedAt: new Date(),
      orderId
    };

    this.activeDERs.set(orderId, activeDER);
    
    // Track activation time for response time calculation
    this.feederActivationTimes.set(feederId, Date.now());

    // Update feeder's active DER contribution
    const feeder = this.mockFeeders.find(f => f.id === feederId);
    if (feeder) {
      feeder.activeDERContribution += output;
      feeder.currentLoad = Math.max(0, feeder.baseLoad - feeder.activeDERContribution);

      // Recalculate status based on new load
      const loadPercentage = (feeder.currentLoad / feeder.capacity) * 100;
      if (loadPercentage > 90) {
        feeder.status = "critical";
      } else if (loadPercentage > 75) {
        feeder.status = "warning";
      } else {
        feeder.status = "normal";
      }
    }

    return activeDER;
  }

  async deactivateDER(orderId: string): Promise<void> {
    const activeDER = this.activeDERs.get(orderId);
    if (activeDER) {
      const feeder = this.mockFeeders.find(f => f.id === activeDER.feederId);
      if (feeder) {
        feeder.activeDERContribution -= activeDER.output;
        feeder.currentLoad = Math.max(0, feeder.baseLoad - feeder.activeDERContribution);

        // Recalculate status
        const loadPercentage = (feeder.currentLoad / feeder.capacity) * 100;
        if (loadPercentage > 90) {
          feeder.status = "critical";
        } else if (loadPercentage > 75) {
          feeder.status = "warning";
        } else {
          feeder.status = "normal";
        }
      }

      this.activeDERs.delete(orderId);
    }
  }

  async getActiveDERsForFeeder(feederId: string): Promise<ActiveDER[]> {
    return Array.from(this.activeDERs.values()).filter(der => der.feederId === feederId);
  }

  async getAllActiveDERs(): Promise<ActiveDER[]> {
    return Array.from(this.activeDERs.values());
  }

  async getFeedersWithLoad(): Promise<FeederWithCalculatedLoad[]> {
    return this.mockFeeders.map(feeder => {
      const activeDERs = Array.from(this.activeDERs.values()).filter(d => d.feederId === feeder.id);
      
      // Get dynamic load for this feeder
      const loadData = this.feederBaseLoads.get(feeder.id);
      const dynamicBaseLoad = loadData?.targetLoad || feeder.baseLoad;
      
      // Calculate current load accounting for active DER contributions
      const calculatedLoad = Math.max(0, dynamicBaseLoad - feeder.activeDERContribution);
      
      // Calculate response time since last DER activation
      const activationTime = this.feederActivationTimes.get(feeder.id);
      const responseTime = activationTime ? Date.now() - activationTime : undefined;
      const isResponding = activeDERs.length > 0;
      
      return {
        ...feeder,
        baseLoad: dynamicBaseLoad,
        currentLoad: calculatedLoad,
        activeDERs: activeDERs,
        responseTime: responseTime,
        isResponding: isResponding
      };
    });
  }

  async addAuditLog(action: string, user: string, target: string, status: "success" | "error" | "info", description: string): Promise<AuditLog> {
    const logId = `LOG-${randomUUID().substring(0, 8).toUpperCase()}`;
    const log: AuditLog = {
      id: logId,
      timestamp: new Date(),
      action,
      user,
      target,
      status,
      description
    };
    this.auditLogs.unshift(log); // Add to beginning (newest first)
    return log;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs;
  }
}

export const storage = new MemStorage();
