import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addTrustedContact,
  createTransaction,
  getPreferences,
  getUserById,
  listTransactions,
  listTrustedContacts,
  updateTrustedContact,
  upsertPreferences,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  safepay: router({
    profile: protectedProcedure.query(({ ctx }) => getUserById(ctx.user.id)),
    transactions: protectedProcedure.query(({ ctx }) => listTransactions(ctx.user.id)),
    createTransaction: protectedProcedure
      .input(z.object({
        recipientName: z.string().trim().min(1).max(160),
        upiId: z.string().trim().min(3).max(160),
        amountInr: z.number().int().positive().max(10_000_000),
        riskScore: z.number().int().min(0).max(100),
        riskLevel: z.enum(["low", "medium", "high"]),
        status: z.enum(["completed", "cancelled", "frozen"]),
        paymentMode: z.enum(["pin", "fingerprint", "voice"]),
        isDuplicate: z.boolean().default(false),
      }))
      .mutation(({ ctx, input }) => createTransaction({ userId: ctx.user.id, ...input })),
    trustedContacts: protectedProcedure.query(({ ctx }) => listTrustedContacts(ctx.user.id)),
    addTrustedContact: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(160), phone: z.string().trim().min(7).max(32), relationship: z.string().trim().min(1).max(80) }))
      .mutation(({ ctx, input }) => addTrustedContact({ userId: ctx.user.id, ...input })),
    updateTrustedContact: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(160), phone: z.string().trim().min(7).max(32), relationship: z.string().trim().min(1).max(80), isActive: z.boolean() }))
      .mutation(({ ctx, input }) => updateTrustedContact(ctx.user.id, input.id, { name: input.name, phone: input.phone, relationship: input.relationship, isActive: input.isActive })),
    preferences: protectedProcedure.query(({ ctx }) => getPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure
      .input(z.object({
        language: z.enum(["English", "Tamil"]).optional(),
        largeText: z.boolean().optional(),
        voiceEnabled: z.boolean().optional(),
        hapticsEnabled: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => upsertPreferences(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
