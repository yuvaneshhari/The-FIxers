import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("SafePay persistence procedures", () => {
  it("rejects unauthenticated transaction reads", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.safepay.transactions()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects invalid payment amounts before touching the database", async () => {
    const caller = appRouter.createCaller(context({
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.safepay.createTransaction({
      recipientName: "Arjun Stores",
      upiId: "arjun.stores@axis",
      amountInr: 0,
      riskScore: 78,
      riskLevel: "high",
      status: "completed",
      paymentMode: "pin",
      isDuplicate: true,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

  it("returns null for a user without saved preferences", async () => {
    const caller = appRouter.createCaller(context({
      id: 999999999,
      openId: "preferences-regression-user",
      name: "Preferences Regression User",
      email: null,
      loginMethod: "test",
      role: "user",
      accountLabel: "Primary account",
      maskedAccount: "demo",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    const result = await caller.safepay.preferences();
    expect(result).toBeNull();
  });
