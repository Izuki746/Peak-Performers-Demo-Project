import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const feeders = pgTable("feeders", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  substationId: text("substation_id").notNull(),
  substationName: text("substation_name").notNull(),
  currentLoad: real("current_load").notNull(),
  capacity: real("capacity").notNull(),
  status: text("status").notNull(),
  criticality: text("criticality").notNull(),
  location: text("location"),
  connectedDERs: integer("connected_ders").default(0),
});

export const ders = pgTable("ders", {
  id: varchar("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  capacity: real("capacity").notNull(),
  currentOutput: real("current_output").notNull(),
  status: text("status").notNull(),
  feederId: text("feeder_id"),
  owner: text("owner"),
  available: boolean("available").default(true),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  actionType: text("action_type").notNull(),
  operator: text("operator").notNull(),
  target: text("target").notNull(),
  becknTransactionId: text("beckn_transaction_id"),
  status: text("status").notNull(),
  details: text("details"),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  feederId: text("feeder_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  acknowledged: boolean("acknowledged").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFeederSchema = createInsertSchema(feeders).omit({ id: true });
export const insertDERSchema = createInsertSchema(ders).omit({ id: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, timestamp: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Feeder = typeof feeders.$inferSelect;
export type DER = typeof ders.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type InsertFeeder = z.infer<typeof insertFeederSchema>;
export type InsertDER = z.infer<typeof insertDERSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
