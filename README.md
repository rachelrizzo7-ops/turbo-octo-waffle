# Contract Manager

A contract intake and management tool: upload a contract, let AI extract the key data,
have a human review and approve it, then run Excel-based reports against the approved data.

## How it works

1. **Upload** — An Intake/Admin user uploads a PDF, Word, or text contract on the
   "Upload contract" page.
2. **AI extraction** — The server extracts the document's text and sends it to the
   Claude API, which returns structured fields (supplier, dates, value, category, risk
   flags, etc.) along with a confidence level per field.
3. **Human review** — The contract lands in "Needs Review." A reviewer sees the
   original document next to the AI-filled form, fixes anything wrong (low-confidence
   fields are flagged), and clicks "Submit for Approval."
4. **Approval** — An Approver/Admin reviews the submission and clicks Approve or
   Reject. Only this step changes the approval status — it can't be bulk-edited via
   spreadsheet.
5. **Reports** — From the Reports page, anyone can download all contract data as an
   `.xlsx` file. Edit it (values, dates, RAG status, owners, etc.) and upload it back;
   matching rows (by the hidden Contract ID column) are updated in place automatically.

Roles: **Admin** (everything, incl. managing users), **Approver** (review/approve/reject,
edit data), **Intake** (upload, edit data), **Viewer** (read-only, can download reports).

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `AUTH_SECRET` — session encryption key. Generate one with `openssl rand -base64 32`.
- `ANTHROPIC_API_KEY` — your Anthropic API key, from https://console.anthropic.com/.
  Without this, uploads still work but land in "Extraction Failed" for manual entry.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` — used once to create
  the first admin login.

Create the database and the first admin user:

```bash
npx prisma migrate dev
npm run seed
```

Run it:

```bash
npm run dev
```

Open http://localhost:3000 and sign in with the admin email/password from `.env`.
Once signed in as Admin, use "Manage users" to add teammates with the right role.

## Data storage

- Database: a local SQLite file at `dev.db` (path set by `DATABASE_URL` in `.env`).
- Uploaded documents: stored on disk under `data/uploads/`.

Both are gitignored — this app is meant to run locally / on your own server, not to
have contract data committed to source control.

## Tech stack

Next.js (App Router) + TypeScript, Prisma + SQLite, Auth.js (NextAuth) credentials
login, Anthropic Claude API for extraction, ExcelJS for the report round-trip.
