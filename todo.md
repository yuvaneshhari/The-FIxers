# SafePay persistence upgrade

- [x] Read the full-stack webdev guide and inspect the upgraded scaffold.
- [x] Confirm the database entities and ownership boundaries for SafePay data.
- [x] Add persistent schema and safe migration/seed strategy without fabricating user-generated content.
- [x] Add authenticated server routes for profile, transactions, trusted contacts, and preferences.
- [x] Replace frontend demo-only reads/writes with database-backed calls and loading/error states.
- [x] Validate create/read/update flows and run typecheck/build.
- [x] Save a database-enabled checkpoint and document required follow-up configuration.
- [x] Add a dedicated protected SafePay profile procedure and connect profile/account data in the UI.
- [x] Replace remaining hardcoded SafePay history/profile values with database-backed data or clearly scope them out of the persistence upgrade.
- [x] Implement visible loading, empty, and error states for transactions, contacts, and preferences queries.
- [x] Persist trusted-contact creation/edit flows instead of showing a placeholder toast, and verify saved contacts render from the database.
- [x] Connect real account/profile metadata in the UI, including the account label and masked account identifier.
- [x] Clarify persisted-versus-demo behavior and scope remaining non-authenticated demo fallback values in the UI.
- [x] Add a real trusted-contact edit form for name, phone, and relationship and render refreshed values after save.
- [x] Add persisted account label and masked account identifier fields to the SafePay profile model and UI.
- [x] Fix trusted-contact editing so it preserves active status, with a separate explicit pause/activate action.
- [x] Document the required follow-up configuration for the database-enabled SafePay build, including sign-in/auth expectations, migration state, and runtime notes.
- [x] Fix authenticated preferences query returning undefined when no preference row exists, and verify the page has no query errors.

# Production refactor

- [ ] Audit the live SafePay deployment, current code, and production runtime logs.
- [ ] Read the safety guidance and document transaction-provider, TTS, auth, and compliance boundaries.
- [ ] Replace demo-only transaction behavior with provider-backed transaction-safe APIs or a clearly blocked configuration state.
- [ ] Add production-grade Tamil voice playback with ta-IN selection, fallback handling, and active voice-wave state.
- [ ] Modernize the bilingual fintech UI with glass surfaces, gradients, depth, motion, and Tamil typography.
- [ ] Remove demo/mock labels and copy without falsely claiming real settlement where providers are not configured.
- [ ] Add/update Vitest coverage and validate authenticated, unauthenticated, error, voice, and responsive flows.
- [ ] Configure mandatory production secrets, save a verified checkpoint, and deploy.
- [ ] Write the production handoff with any provider activation blockers and next steps.

# Razorpay test-mode integration

- [ ] Confirm Razorpay test API requirements and the available connector state.
- [ ] Configure Razorpay test credentials securely and document test-mode boundaries.
- [ ] Add a server-side Razorpay adapter with order creation and signature verification.
- [ ] Persist provider order/payment identifiers and statuses in SafePay’s transaction model.
- [ ] Connect the sandbox order flow to the payment UI and Tamil voice confirmation states.
- [ ] Add tests for provider validation, signature verification, and protected access.
- [ ] Run sandbox verification, typecheck, build, and save a test-mode checkpoint.

# Download experience

- [x] Create a real downloadable SafePay document artifact and place it in the managed static asset storage.
- [x] Add a first-visit download-option prompt with a clear manual-dismiss path.
- [x] Add a prominent bilingual Download / பதிவிறக்கம் action to the main layout.
- [x] Validate download behavior, keyboard accessibility, mobile layout, and production build.
- [ ] Save and deploy the updated SafePay checkpoint.
