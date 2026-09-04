import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertPaymentTransaction,
  InsertTrustedContact,
  InsertUser,
  InsertUserPreferences,
  paymentTransactions,
  trustedContacts,
  userPreferences,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function listTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentTransactions).where(eq(paymentTransactions.userId, userId)).orderBy(desc(paymentTransactions.createdAt)).limit(50);
}

export async function createTransaction(transaction: InsertPaymentTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(paymentTransactions).values(transaction);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id)).limit(1);
  return rows[0];
}

export async function listTrustedContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trustedContacts).where(eq(trustedContacts.userId, userId)).orderBy(desc(trustedContacts.createdAt));
}

export async function addTrustedContact(contact: InsertTrustedContact) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(trustedContacts).values(contact);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(trustedContacts).where(eq(trustedContacts.id, id)).limit(1);
  return rows[0];
}

export async function updateTrustedContact(userId: number, id: number, patch: Partial<Pick<InsertTrustedContact, "name" | "phone" | "relationship" | "isActive">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(trustedContacts).set(patch).where(and(eq(trustedContacts.userId, userId), eq(trustedContacts.id, id)));
  const rows = await db.select().from(trustedContacts).where(and(eq(trustedContacts.userId, userId), eq(trustedContacts.id, id))).limit(1);
  return rows[0];
}

export async function getPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertPreferences(userId: number, patch: Partial<Omit<InsertUserPreferences, "userId" | "id">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getPreferences(userId);
  if (existing) {
    await db.update(userPreferences).set(patch).where(and(eq(userPreferences.userId, userId), eq(userPreferences.id, existing.id)));
  } else {
    await db.insert(userPreferences).values({ userId, ...patch });
  }
  return getPreferences(userId);
}
