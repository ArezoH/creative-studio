# AI Creative Studio - Development Setup

A modern Nuxt.js application with a drag-and-drop dashboard, rich text editing, PocketBase backend, and real-time collaboration.

## Quick Start

### Prerequisites

- Node.js 18+ or 20+ (LTS recommended)
- npm, yarn, pnpm, or bun
- [PocketBase](https://pocketbase.io/docs/) (self-hosted backend)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nuxt-app
npm install
```

### 2. PocketBase Setup

Download and run PocketBase (the project's backend and database):

```bash
# Download PocketBase from https://pocketbase.io/docs/
# Extract it into the project root (or anywhere you prefer):
mkdir -p pocketbase && cd pocketbase
# Download the binary for your OS from https://pocketbase.io/docs/
```

#### Apply Migrations (creates all collections automatically)

The project includes migration files in `pb_migrations/` that set up all required collections. Just make sure PocketBase can find them:

```bash
# If pb_migrations/ is in the project root, symlink or copy to PocketBase directory
cp -r pb_migrations/* pocketbase/pb_migrations/

# Start PocketBase — migrations run automatically on first serve
cd pocketbase
./pocketbase serve
```

PocketBase will start at `http://127.0.0.1:8090`. On first run, open the Admin UI at `http://127.0.0.1:8090/_/` to create your superadmin account.


#### Squashing Migrations (for maintainers)

PocketBase auto-generates a new migration file for every collection change in the Admin UI. Over time this creates clutter. To squash into a single clean snapshot:

```bash
cd pocketbase

# 1. Generate a single snapshot of your current schema
./pocketbase migrate collections

# 2. Delete all old migration files
rm pb_migrations/17*.js

# 3. Keep only the new snapshot file (the one just generated)

# 4. Sync the migration history table
./pocketbase migrate history-sync

# 5. Test — nuke the DB and re-run from the snapshot
rm pb_data/data.db
./pocketbase serve
```

Commit just the single snapshot file. This is what new developers will use.

#### OAuth Providers (Optional)

To enable Google/GitHub login, configure OAuth providers in the PocketBase Admin UI under **Settings → Auth providers**.

#### Troubleshooting Migrations

| Problem | Fix |
|---|---|
| `collection "users" not found` during migration | The `_pb_users_auth_` ID is PocketBase's default. If you renamed or deleted the users collection, restore it first via the Admin UI. |
| Migration already applied but collections are missing | Delete `pocketbase/pb_data/data.db` and re-run `./pocketbase serve` for a clean start. Or run `./pocketbase migrate down` then `./pocketbase migrate up`. |
| `relation collection ID mismatch` | The migration references `_pb_users_auth_` as the users collection ID. If your PocketBase instance uses a different ID, update the `collectionId` in the migration file. Find your actual ID in Admin UI → Users → gear icon → API Preview. |
| Port 8090 already in use | Another PocketBase instance is running. Kill it with `lsof -ti:8090 \| xargs kill` or use `./pocketbase serve --http=127.0.0.1:8091`. |

### 3. Environment Setup (Optional)

The app works out of the box with defaults (PocketBase at `http://127.0.0.1:8090`, auto-generated session). Create a `.env` file only if you need to override defaults:

```env
# Session password — auto-generated if not set, but set one for stable sessions across restarts
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NUXT_SESSION_PASSWORD=

# PocketBase URL — only change if not running on default port
POCKETBASE_URL=http://127.0.0.1:8090

# PocketBase admin credentials — only needed if server routes use admin API
PB_ADMIN_EMAIL=
PB_ADMIN_PASSWORD=

# OAuth — only if you configure providers in PocketBase Admin UI
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
```

> **Note:** If you skip `.env` entirely, everything still works for local development.

### 4. Start Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## Technology Stack

### Core Framework

- **Nuxt.js** — Full-stack Vue framework (SSR enabled)
- **Vue 3** — Frontend framework
- **TypeScript** — Type safety

### UI & Styling

- **@nuxt/ui** — Component library (built on Tailwind CSS)
- **Tailwind CSS** — Utility-first CSS
- **@iconify-json/heroicons** — Icon library

### Rich Text Editor

- **TipTap** — Extensible rich text editor
  - StarterKit (headings, lists, bold, italic, etc.)
  - Character count extension
  - Image support
  - Link extension
  - Underline & Highlight extensions
  - Text alignment

### Backend & Database

- **PocketBase** — Backend-as-a-service (SQLite under the hood)
  - REST API & real-time subscriptions
  - Built-in auth (email/password + OAuth)
  - File storage (used by the Image Gallery widget)

### Authentication

- **nuxt-auth-utils** — Server-side session management
- **PocketBase Auth** — Client-side auth with cookie sync (dual-layer auth)

### State Management & Utilities

- **Pinia** — State management
- **@vueuse/core & @vueuse/nuxt** — Composition utilities (breakpoints, media queries, etc.)
- **@nuxt/eslint** — Linting

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run preview          # Preview production build
npm run generate         # Generate static site

# PocketBase (run from pocketbase/ directory)
./pocketbase serve                  # Start PocketBase (http://127.0.0.1:8090)
./pocketbase migrate up             # Apply pending migrations
./pocketbase migrate down           # Revert last migration
./pocketbase migrate collections    # Generate a schema snapshot migration
./pocketbase migrate history-sync   # Clean stale entries from _migrations table
./pocketbase backup create          # Create a backup zip
./pocketbase backup restore <file>  # Restore from a backup zip
```

---

## Key Features

### 1. Drag-and-Drop Dashboard

- Infinite canvas with grid snapping
- Widget library sidebar (toggle with `Ctrl+B`)
- Drag widgets from the library onto the canvas
- Move, resize, rename, and delete widgets
- Responsive layout: desktop (free positioning), tablet (1-2 column grid), mobile (single column)

### 2. Widget Types

| Widget | Description |
|--------|-------------|
| Content Editor | Full TipTap rich text editor |
| Quick Notes | Lightweight notes with rich text |
| Todo List | Task management with checkboxes |
| Calendar | Monthly calendar with events, due dates, and urgency tracking |
| Image Gallery | Upload and manage images via PocketBase file storage |

### 3. Rich Text Editor (TipTap)

- WYSIWYG toolbar: bold, italic, underline, highlight, headings (H1-H3), lists, text alignment
- Character and word count
- Auto-save with debounce
- Copy to clipboard and export as HTML

### 4. Real-time Sync

- PocketBase real-time subscriptions keep widgets in sync across browser tabs
- Optimistic UI updates for snappy interactions

### 5. Authentication

- Email/password registration and login
- OAuth login (Google, GitHub) via PocketBase
- Dual-layer auth: PocketBase token + nuxt-auth-utils server session

### 6. Widget Sharing

- Share individual widgets via expiring links
- Recipients get an independent copy of the shared widget

---

## Development Tips

- Run PocketBase and Nuxt dev server simultaneously in separate terminals
- Use the PocketBase Admin UI (`http://127.0.0.1:8090/_/`) to inspect data, manage users, and configure auth providers
- Check the browser console for client-side errors
- Check terminal output for server-side errors
- Ensure all environment variables are set before starting development
- The `POCKETBASE_URL` is used in `nuxt.config.ts` runtime config but is also hardcoded in `pocketbase.ts` plugin and `Images.vue` — update those if you change the PocketBase URL

---

## Backup & Restore

PocketBase stores everything in `pb_data/`. Back it up and you back up your entire app state.

### Manual Backup

```bash
cd pocketbase

# Stop PocketBase first (or use the API for a safe live copy)
cp -r pb_data/ pb_data_backup_$(date +%Y%m%d)
```

### Backup via Admin UI

Open `http://127.0.0.1:8090/_/` → **Settings → Backups** → click **Create backup**. You can download the `.zip` file directly from the UI.

### Backup via CLI

```bash
# Create a backup zip (can be run while PocketBase is serving)
./pocketbase backup create

# Backups are stored in pb_data/backups/
ls pb_data/backups/
```

### Restore

```bash
# From a CLI backup
./pocketbase backup restore pb_data/backups/<backup-file>.zip

# From a manual copy — just replace pb_data/
rm -rf pb_data
cp -r pb_data_backup_20250408 pb_data
./pocketbase serve
```

### What's inside `pb_data/`

| File/Folder | Contains |
|---|---|
| `data.db` | All collections, records, and user accounts (SQLite) |
| `storage/` | Uploaded files (images from the gallery widget) |
| `backups/` | Auto/manual backups |
| `types.d.ts` | Auto-generated TypeScript definitions |

> **Tip:** Add `pb_data/` to `.gitignore` — never commit the database. Commit only `pb_migrations/`.

---

## Known Considerations

- PocketBase URL is hardcoded to `http://127.0.0.1:8090` in `pocketbase.ts` plugin and `Images.vue`. The `nuxt.config.ts` reads from `POCKETBASE_URL` env var but those two files don't. Update them if deploying to a remote server.
- The `pocketbase.ts` plugin references `document?.cookie` which will error during SSR. This is a client-only plugin in practice.

---

## Support & Documentation

- **Nuxt.js**: [https://nuxt.com/docs](https://nuxt.com/docs)
- **PocketBase**: [https://pocketbase.io/docs](https://pocketbase.io/docs)
- **TipTap Editor**: [https://tiptap.dev](https://tiptap.dev)
- **Nuxt UI**: [https://ui.nuxt.com](https://ui.nuxt.com)
- **Pinia**: [https://pinia.vuejs.org](https://pinia.vuejs.org)
- **VueUse**: [https://vueuse.org](https://vueuse.org)
- **nuxt-auth-utils**: [https://nuxt.com/modules/auth-utils](https://nuxt.com/modules/auth-utils)