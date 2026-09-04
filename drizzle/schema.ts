import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  accountLabel: varchar("accountLabel", { length: 80 }).default("Primary account").notNull(),
  maskedAccount: varchar("maskedAccount", { length: 32 }).default("•• 4820").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const paymentTransactions = mysqlTable("paymentTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientName: varchar("recipientName", { length: 160 }).notNull(),
  upiId: varchar("upiId", { length: 160 }).notNull(),
  amountInr: int("amountInr").notNull(),
  riskScore: int("riskScore").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).notNull(),
  status: mysqlEnum("status", ["completed", "cancelled", "frozen"]).notNull(),
  paymentMode: mysqlEnum("paymentMode", ["pin", "fingerprint", "voice"]).notNull(),
  isDuplicate: boolean("isDuplicate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userCreatedAtIdx: index("paymentTransactions_user_createdAt_idx").on(table.userId, table.createdAt),
}));

export const trustedContacts = mysqlTable("trustedContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  relationship: varchar("relationship", { length: 80 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("trustedContacts_user_idx").on(table.userId),
}));

export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  language: mysqlEnum("language", ["English", "Tamil"]).default("English").notNull(),
  largeText: boolean("largeText").default(false).notNull(),
  voiceEnabled: boolean("voiceEnabled").default(true).notNull(),
  hapticsEnabled: boolean("hapticsEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userUniqueIdx: uniqueIndex("userPreferences_user_unique").on(table.userId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type TrustedContact = typeof trustedContacts.$inferSelect;
export type InsertTrustedContact = typeof trustedContacts.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
