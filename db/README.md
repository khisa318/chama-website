# Chama SQL Scripts

Run these files in this order inside the Supabase SQL editor:

1. `001_chama_wallet_schema.sql`
2. `002_chama_wallet_helpers.sql`
3. `004_chama_wallet_policies.sql`
4. `003_chama_wallet_seed.sql`

What each script does:

- `001_chama_wallet_schema.sql`
  Creates the core tables for profiles, groups, group members, wallet ledger, loans, and group chat.

- `002_chama_wallet_helpers.sql`
  Adds helper triggers and read-only views such as derived wallet balances and group financial summaries.

- `004_chama_wallet_policies.sql`
  Enables Supabase row-level security so only the right users can read or change each chama's data.

- `003_chama_wallet_seed.sql`
  Seeds demo chama data. It uses the first `auth.users` record as the main admin. If you already have second and third users in `auth.users`, it also adds them as test members.

Notes:

- The seed script is rerunnable. It deletes and recreates only the demo groups with join codes `FSC250`, `BGF500`, and `CWC300`.
- Wallet balances are meant to come from `group_ledger` and the helper views, not from manual editing.
- If you want better multi-user testing, create 2-3 accounts in the app first, then rerun the seed script.
