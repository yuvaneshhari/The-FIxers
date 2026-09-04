# SafePay persistence notes

## What is enabled

SafePay is now a full-stack React, Express, tRPC, Drizzle, and Manus OAuth project. Authenticated users can persist payment transactions, trusted contacts, accessibility preferences, and non-sensitive account display metadata. All feature procedures are protected and scope reads and writes to the authenticated user ID.

## Authentication expectation

The overview remains usable as a clearly labelled demo when the visitor is signed out. Select **Sign in to save** to start Manus OAuth. After authentication, the header changes to **LIVE DATA**, the profile comes from the authenticated user record, and payment history, trusted contacts, and accessibility preferences are read from the database. No real PIN is stored, and no bank settlement or real payment network is connected.

## Database and migration state

The database contains the `users`, `paymentTransactions`, `trustedContacts`, and `userPreferences` tables. The initial schema migration is `drizzle/0000_many_giant_girl.sql`; the additive account metadata migration is `drizzle/0001_whole_pete_wisdom.sql`. Both migrations have been applied to the connected project database. The account metadata fields use safe defaults: `Primary account` and `•• 4820`; these are display values only and are not financial credentials.

## Runtime and verification

The development server is running in the managed SafePay project. The verified commands are `pnpm check`, `pnpm test`, and `pnpm build`. The test suite includes the existing authentication logout test and SafePay procedure tests covering protected access and input validation. The production build completes successfully; Vite emits only a non-blocking bundle-size advisory.

## Follow-up for a real product

Before production financial use, connect a compliant payment provider or UPI sandbox, replace the illustrative balance and risk engine with server-side sources, add stronger audit logging and rate limiting, and configure real notification delivery for trusted contacts. Keep all payment secrets server-side and continue to treat PINs as non-persistent authentication inputs.
