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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private activeDERs: Map<string, ActiveDER>; // key: orderId
  private mockFeeders: FeederWithCalculatedLoad[] = [
    {
      id: "F-1234",
      name: "Feeder F-1234",
      substationName: "Westminster Substation",
      baseLoad: 87.5,
      currentLoad: 87.5,
      capacity: 95,
      status: "critical",
      criticality: "critical",
      connectedDERs: 12,
      activeDERContribution: 0
    },
    {
      id: "F-5678",
      name: "Feeder F-5678",
      substationName: "Camden Substation",
      baseLoad: 68.2,
      currentLoad: 68.2,
      capacity: 90,
      status: "warning",
      criticality: "high",
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
      baseLoad: 72.8,
      currentLoad: 72.8,
      capacity: 85,
      status: "warning",
      criticality: "high",
      connectedDERs: 14,
      activeDERContribution: 0
    }
  ];

  constructor() {
    this.users = new Map();
    this.activeDERs = new Map();
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
      return {
        ...feeder,
        currentLoad: Math.max(0, feeder.baseLoad - feeder.activeDERContribution),
        activeDERs: activeDERs
      };
    });
  }
}

export const storage = new MemStorage();
