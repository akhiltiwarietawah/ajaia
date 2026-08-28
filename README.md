# Ajaia Docs — AI-Native Collaborative Document Editor

A fast, lightweight, and collaborative rich-text document editor inspired by Google Docs, built as part of the Ajaia AI-Native Full Stack Developer Assessment.

---

## 🌟 Key Features

### 1. Document Creation & Rich-Text Editing
- **Create, Open & Rename**: Fast document lifecycle with inline and dashboard renaming.
- **Rich-Text Engine (Tiptap)**:
  - Text formatting: **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~
  - Headings: Heading 1 (`H1`), Heading 2 (`H2`), Heading 3 (`H3`)
  - Lists: Bulleted lists (`<ul>`), Numbered lists (`<ol>`)
  - Blocks: Blockquotes (`>`), Code blocks (`<pre><code>`)
  - History: Full Undo (`Ctrl+Z`) & Redo (`Ctrl+Y`) support
  - Clear formatting tool
- **Autosave & Persistence**: Automatic 800ms debounced cloud sync with real-time save indicator badge (`Saving...`, `Saved`, `Unsaved changes`, `Error`) and keyboard shortcut (`Ctrl+S` / `Cmd+S`).

### 2. File Import & Export
- **File Import**: Drag-and-drop or browse files to turn existing content into editable docs.
  - **Supported formats**: `.txt` (Plain text) and `.md` (Markdown).
  - Explicit badges in the UI show supported file types and reject unsupported formats.
  - Auto-extracts document titles from markdown `# H1` headings or filenames.
- **Document Export**: One-click download as **Markdown (.md)**, **Plain Text (.txt)**, or **HTML (.html)**.

### 3. Collaboration & Access Control
- **Document Ownership**: Every document has a clear owner.
- **Role-based Sharing**: Owners can grant collaborator permissions (`Can edit` or `Can view`) to other users.
- **Dashboard Separation**: Clean visual separation between **Owned Documents** and **Shared With Me** (displaying owner badges and permission indicators).
- **Access Guard (403 Forbidden)**: Unrelated users who attempt to access a private document receive a friendly 403 Access Denied screen with instructions to switch personas.
- **Revocation**: Document owners can revoke collaborator access in real time.

---

## 👤 Intentional Demo Authentication Architecture

Per the assessment guidelines, **real email/password registration is intentionally omitted** in favor of a clean, seeded multi-user persona switcher. This eliminates registration friction and allows evaluators to test multi-user sharing and access denial in seconds.

### Seeded Demo Personas:
| Persona | Email | Purpose in Evaluation |
|---|---|---|
| 🟢 **Alice Johnson** | `alice@ajaia.demo` | **Primary Document Owner**: Creates documents, writes content, and shares with team members. |
| 🔵 **Bob Smith** | `bob@ajaia.demo` | **Shared Collaborator**: Receives document shares (`Can edit` / `Can view`) and tests collaborative editing. |
| 🟣 **Charlie Davis** | `charlie@ajaia.demo` | **Access Test Persona**: An unrelated third-party user who verifies that private documents reject unauthorized access with **403 Forbidden**. |

### How It Works:
- Evaluators can switch between Alice, Bob, and Charlie with 1 click using the **Demo Persona Switcher** in the top navigation bar.
- Switching updates the `ajaia_active_user` cookie and `localStorage`, refreshing Server Components to immediately render that persona's owned and shared documents.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Rich Text Editor** | Tiptap (ProseMirror React) |
| **Database & ORM** | Prisma ORM with **PostgreSQL / Supabase** |
| **Styling** | Tailwind CSS + Lucide React |
| **Parser / Importer** | `marked` (GFM Markdown parser) + custom sanitization |
| **Testing** | Vitest (37 automated unit & integration tests) |

---

## 🚀 Getting Started (Setup & Database)

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL database (e.g. Supabase or local PostgreSQL instance)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd ajaio
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your PostgreSQL / Supabase connection strings:
```bash
cp .env.example .env
```

Set:
- `DATABASE_URL`: Connection string for PostgreSQL (use Supabase connection pooler on port 6543 for serverless/Vercel).
- `DIRECT_URL`: Direct PostgreSQL connection string (port 5432) for running migrations.

### 3. Run Database Migrations & Seed Demo Data
Apply the Prisma PostgreSQL migrations and seed sample documents and demo personas:
```bash
npm run db:setup
```
*Or execute individually:*
```bash
npm run db:migrate  # Applies Prisma migrations to PostgreSQL
npm run db:seed     # Seeds Alice, Bob, Charlie and sample documents
```

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

The project includes an automated test suite covering access control rules, file import parsing, full database CRUD/sharing lifecycle operations, and complete 23-point manual QA flows against PostgreSQL:

```bash
npm test
```

### Test Coverage Highlights:
- ✅ Owner access rights & permission grants.
- ✅ Shared collaborator read & edit authorization.
- ✅ Access denial (403 Forbidden) for unrelated personas.
- ✅ Markdown (`# Title`, formatting, lists) & Plaintext parsing.
- ✅ Real database document creation, sharing from Alice to Bob, and access revocation.
- ✅ 23-point complete user flow verification.

---

## 👥 Reviewer Walkthrough Guide

To evaluate the core product requirements in under 2 minutes:

1. **Document Creation & Editing**:
   - As **Alice**, click **"New Document"** or open *"Welcome to Ajaia Docs"*.
   - Edit text, test formatting toolbar buttons (**Bold**, *Italic*, <u>Underline</u>, Headings, Bullet Lists).
   - Watch the save indicator change to *"Saved"*. Refresh the page to verify persistence in PostgreSQL.
2. **File Import**:
   - On the Dashboard, click **"Import File"**.
   - Notice the `.txt` and `.md` format indicators.
   - Upload any sample markdown or plain text file — the document is created and opened immediately.
3. **Sharing Flow**:
   - In any owned document, click **"Share"**.
   - Select **Bob Smith** with role *"Can edit"* and click **"Share"**.
4. **Multi-User Persona Switcher**:
   - Click the user badge at top right and switch to **Bob Smith**.
   - The Dashboard now shows the document under **"Shared With Me"** with Alice listed as owner.
   - Open the document as Bob and edit content.
5. **Access Control (403 Test)**:
   - Switch to **Charlie Davis** (unrelated user).
   - Charlie's dashboard shows zero shared documents.
   - If Charlie attempts to navigate directly to Alice's private doc URL, a **403 Forbidden (Access Denied)** screen is shown.

---

## 🌐 Supabase & Vercel Deployment Guide

### Option A: Using Prisma Migrations (Recommended)
1. In Supabase: Create a project and retrieve the **Transaction Pooler** connection string (port 6543) and **Direct** connection string (port 5432).
2. Run migrations and seed against Supabase from your local CLI:
   ```bash
   DATABASE_URL="<supabase-pooler-url>" DIRECT_URL="<supabase-direct-url>" npm run db:setup
   ```
3. In Vercel:
   - Import the GitHub repository.
   - Add environment variables `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
   - Set `NEXT_PUBLIC_APP_URL` to your production URL.
   - Deploy.

### Option B: Using Supabase SQL Editor
1. In Supabase SQL Editor: Paste and execute the contents of `supabase/schema.sql`.
2. In Vercel: Set `DATABASE_URL` and deploy.

---

## 📁 Repository Structure

```
├── prisma/
│   ├── migrations/         # Prisma PostgreSQL migrations
│   ├── schema.prisma       # Prisma PostgreSQL schema (DATABASE_URL & DIRECT_URL)
│   └── seed.js             # Seed script for demo personas & docs
├── src/
│   ├── actions/            # Next.js Server Actions (CRUD, ACL, share)
│   ├── app/                # Next.js App Router pages & layout
│   ├── components/         # React UI components (Editor, Toolbar, Modals)
│   ├── context/            # UserContext & active demo persona store
│   ├── lib/                # Pure access control, auth, & import parsers
│   ├── types/              # TypeScript interfaces
│   └── __tests__/          # Vitest unit & integration test suites
├── supabase/
│   └── schema.sql          # PostgreSQL / Supabase migration script
├── ARCHITECTURE.md         # Detailed architectural documentation
├── AI_WORKFLOW.md          # AI-assisted development methodology notes
├── SUBMISSION.md           # Assessment summary & verification checklist
└── package.json
```
