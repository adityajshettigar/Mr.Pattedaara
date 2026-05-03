<div align="center">

<img src="public/logo.png" alt="Mr. Pattedaara Logo" width="100" />

# Mr. Pattedaara | Mr. ಪತ್ತೇದಾರ

### Social Engineering Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-3.0-f59e0b?style=flat-square)](#roadmap)

A free, open-source investigation dashboard for cyber crime units, law enforcement agencies, and government organisations built to map social engineering attacks, manage cases, and generate legal-grade reports.

[Features](#features) · [Quick Start](#quick-start) · [API Reference](#api-reference) · [Roadmap](#roadmap)

</div>

---

## What is Mr. Pattedaara?

Social engineering fraud UPI scams, phishing, romance scams, SIM swaps, impersonation is one of the fastest-growing categories of cybercrime. Yet most investigation tools are either too technical for frontline officers or too generic for law enforcement workflows.

**Mr. Pattedaara** bridges that gap. It is designed for:

- **Absolute beginners** constables and victim support officers with no technical background
- **Experienced investigators** cyber crime unit leads and forensic analysts
- **Supervisors** superintendents who need visibility across all active cases

Everything runs in the browser. No complex installations. No cloud subscriptions required to get started.

---

## Features

### Case Management
- FIR-linked case records with classification, priority, and status tracking
- Full victim and suspect profiling contact details, financial loss, attack channel
- Evidence locker with file attachments and chain-of-custody notes
- Team assignment with role-based access control
- Complete audit log every action timestamped and attributed to an officer

### OSINT Graph
- Interactive entity mapping powered by **Cytoscape.js**
- 9 node types with professional SVG icons Person, Email, Phone, IP Address, Domain, Bank Account, Organisation, Device, Social Handle
- Confidence levels (Confirmed / Suspected / Unverified) shown visually on each node
- Draw connections between entities with typed relationship labels
- Multiple layout engines force-directed, hierarchical, circular, grid
- One-click **⚡ Enrich** auto-queries threat intel APIs and adds child nodes to the graph automatically
- Export graph as PNG for reports and court submissions

### Attack Chain Timeline
- Chronological event reconstruction with date, time, and evidence detail
- Event types Attack, Financial, Investigation, Victim Action
- **MITRE ATT&CK** technique tagging on every event
- Colour-coded visual timeline

### Forensics & Threat Intelligence
- Paste any URL, domain, IP address, or email → instant threat analysis
- **VirusTotal** malicious/suspicious/harmless vendor scores with threat percentage
- **WHOIS / RDAP** domain age, registrar, nameservers (no API key needed)
- **Shodan** open ports, ISP, geolocation, CVEs, OS fingerprint
- **Have I Been Pwned** breach history with exposed data types and record counts
- All scan results saved per case with full searchable history

### Legal-Grade PDF Reports
- One-click report generation from any case
- Auto-populates: case identity, FIR number, victim profile, suspect details, attack timeline, OSINT entity table
- **IT Act 2000/2008 and BNS 2023** applicable section references
- Formatted for legal proceedings and court submission

### Authentication & Roles
- Secure JWT login with httpOnly cookies and Bearer token support
- 4-tier role system with granular per-action permissions

| Action | Superintendent | IO (own cases) | Analyst | Viewer |
|---|:---:|:---:|:---:|:---:|
| View all cases | ✅ | ✅ | ✅ | ✅ |
| Create / Edit case | ✅ | ✅ | Status only | ❌ |
| Delete case | ✅ | ❌ | ❌ | ❌ |
| Add graph nodes / timeline events | ✅ | ✅ | ✅ | ❌ |
| Run forensic scans | ✅ | ✅ | ✅ | ❌ |
| Manage officers | ✅ | ❌ | ❌ | ❌ |

### Training Library
- Reference cards for every major SE attack type
- Covers UPI fraud, phishing, SIM swap, romance scams, business email compromise, crypto fraud, and OSINT techniques
- Designed so a constable with zero technical background can understand and apply the material

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL 16 |
| Authentication | JWT + bcryptjs |
| Graph Engine | Cytoscape.js + cytoscape-fcose layout |
| PDF Generation | jsPDF + jsPDF-AutoTable |
| Styling | Plain CSS with CSS variables (dark + light themes) |
| Threat Intel | VirusTotal · Shodan · Have I Been Pwned · WHOIS/RDAP |
=======
# Mr. Pattedaara — ಪತ್ತೇದಾರ
## Social Engineering Intelligence Platform · v3.0

> "ಪತ್ತೇದಾರ — The Authorised Investigator"

---

## What's New in v3
- PostgreSQL backend — real database, not localStorage
- JWT authentication — secure login with httpOnly cookies
- 4-tier roles — Superintendent / IO / Analyst / Viewer
- Officer management — create, edit, deactivate officers
- Audit log — every action recorded
- Logo — detective icon, white in dark / black in light theme
- Kannada fix — correctly spelled ಪತ್ತೇದಾರ
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)

---

## Quick Start

### Prerequisites
- Node.js 18+
<<<<<<< HEAD
- PostgreSQL 14+ (or Docker)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/mr-pattedaara.git
cd mr-pattedaara
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pattedaara
JWT_SECRET=your-64-char-random-secret
```

Generate a secure JWT secret:
```bash
openssl rand -hex 64
```

### 3. Database Setup

**Option A Docker (recommended for development):**
```bash
docker run -d \
 --name pattedaara-db \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_PASSWORD=yourpassword \
 -e POSTGRES_DB=pattedaara \
 -p 5432:5432 \
 postgres:16
```

**Option B Local PostgreSQL:**
```bash
psql -U postgres -c "CREATE DATABASE pattedaara;"
```

**Option C Free cloud database (Neon / Supabase):**

Create a free project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) and paste the connection string into `DATABASE_URL`.

### 4. Initialise & Seed
```bash
npm run db:init  # creates all tables and indexes
npm run db:seed  # adds demo users and 3 demo cases
```

### 5. Run
```bash
npm run dev
# → http://localhost:3000
=======
- PostgreSQL 14+

### Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Edit DATABASE_URL and JWT_SECRET

# 3. Create DB
psql -U postgres -c "CREATE DATABASE pattedaara;"
npm run db:init

# 4. Seed demo data
npm run db:seed

# 5. Run
npm run dev
# http://localhost:3000
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)
```

---

<<<<<<< HEAD
## Default Login Credentials

> ⚠️ **Change all passwords immediately after first login in any non-development environment.**
=======
## Default Logins (change immediately)
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)

| Role | Email | Password |
|---|---|---|
| Superintendent | admin@pattedaara.local | Admin@1234 |
<<<<<<< HEAD
| Investigating Officer | ramesh.k@pattedaara.local | Officer@1234 |
=======
| IO | ramesh.k@pattedaara.local | Officer@1234 |
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)
| Analyst | deepa.r@pattedaara.local | Analyst@1234 |

---

<<<<<<< HEAD
## API Keys (Optional Phase 2 Features)

Add keys in **Settings → API Integrations**. All keys are stored in your browser's localStorage only they are never sent to any server except the respective third-party API directly.

| Service | Free Tier | Get Key | Used For |
|---|---|---|---|
| VirusTotal | ✅ 4 req/min | [virustotal.com](https://www.virustotal.com/gui/my-apikey) | URL, domain, IP threat analysis |
| Shodan | ✅ Limited | [shodan.io](https://account.shodan.io/) | IP infrastructure intelligence |
| Have I Been Pwned | 💳 $3.50/mo | [haveibeenpwned.com](https://haveibeenpwned.com/API/Key) | Email breach checking |

The platform works fully without API keys WHOIS/RDAP lookups are free and require no key, and all manual investigation features remain available.

---

## Project Structure

```
mr-pattedaara/
├── app/
│  ├── api/             # All backend API routes (JWT protected)
│  │  ├── auth/{login,me,logout}/ # Authentication
│  │  ├── cases/[id]/       # Case CRUD with role guards
│  │  ├── graph/[id]/       # Graph node/edge management
│  │  ├── timeline/[id]/      # Timeline entry management
│  │  ├── forensics/[id]/     # Forensic scan results
│  │  └── users/[id]/       # Officer management
│  ├── login/            # Login page
│  ├── dashboard/          # Stats, recent cases, quick actions
│  ├── cases/            # Case list + split-view detail
│  ├── users/            # Officer management (Superintendent only)
│  ├── training/          # SE attack type training cards
│  └── settings/          # API keys + appearance
├── components/
│  ├── graph/OsintGraph.js     # Cytoscape.js OSINT graph with enrichment
│  └── cases/{TimelineTab,ForensicsTab}.js
├── lib/
│  ├── db.js            # PostgreSQL connection pool
│  ├── auth.js           # JWT sign/verify/role guards
│  ├── apiClient.js         # Browser-side fetch wrapper
│  ├── api.js            # VirusTotal, HIBP, Shodan, WHOIS calls
│  └── nodeIcons.js         # SVG icon data URIs + Cytoscape styles
├── scripts/
│  ├── initDb.js          # npm run db:init
│  └── seedDb.js          # npm run db:seed
├── middleware.js          # Next.js edge route protection
├── public/logo.png         # Theme-adaptive detective logo
└── styles/globals.css        # Full design system (dark + light)
```

---

## API Reference

All routes require `Authorization: Bearer <token>` header or `pttdr_token` cookie, except `/api/auth/login`.

| Method | Route | Min Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | | Issue JWT token |
| GET | `/api/auth/me` | Viewer | Get current user |
| POST | `/api/auth/logout` | Any | Clear session |
| GET | `/api/cases` | Viewer | List cases |
| POST | `/api/cases` | IO | Create case |
| GET | `/api/cases/:id` | Viewer | Get single case |
| PATCH | `/api/cases/:id` | Analyst | Update case |
| DELETE | `/api/cases/:id` | Superintendent | Delete case |
| GET | `/api/graph/:id` | Viewer | Get graph data |
| POST | `/api/graph/:id` | Analyst | Add node or edge |
| DELETE | `/api/graph/:id` | IO | Remove node or edge |
| GET | `/api/timeline/:id` | Viewer | Get timeline entries |
| POST | `/api/timeline/:id` | Analyst | Add timeline entry |
| DELETE | `/api/timeline/:id` | IO | Remove entry |
| GET | `/api/forensics/:id` | Viewer | Get scan history |
| POST | `/api/forensics/:id` | Analyst | Save scan result |
| DELETE | `/api/forensics/:id` | IO | Remove result |
| GET | `/api/users` | Superintendent | List all officers |
| POST | `/api/users` | Superintendent | Create officer |
| PATCH | `/api/users/:id` | Superintendent | Update role / password |
| DELETE | `/api/users/:id` | Superintendent | Deactivate officer |
=======
## Role Permissions

| Action | Supt | IO | Analyst | Viewer |
|---|:---:|:---:|:---:|:---:|
| View all cases | ✅ | own | ✅ | ✅ |
| Create / Edit case | ✅ | ✅ | status only | ❌ |
| Delete case | ✅ | ❌ | ❌ | ❌ |
| Graph / Timeline / Forensics | ✅ | ✅ | add only | ❌ |
| Manage officers | ✅ | ❌ | ❌ | ❌ |

---

## Generate JWT Secret
```bash
openssl rand -hex 64
```
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)

---

## Deployment

<<<<<<< HEAD
### Environment Variables for Production
```env
DATABASE_URL=postgresql://user:pass@host:5432/pattedaara?sslmode=require
=======
Set in production environment:
```env
DATABASE_URL=postgresql://...?sslmode=require
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)
JWT_SECRET=<64-char-random-hex>
NODE_ENV=production
```

<<<<<<< HEAD
### Recommended Platforms

| Layer | Free | Paid |
|---|---|---|
| App | Vercel, Render | Railway, Fly.io |
| Database | Neon, Supabase | Railway PostgreSQL |

```bash
npm run build
npm start
```
=======
Recommended: Vercel (app) + Supabase or Neon (database)
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)

---

## Roadmap
<<<<<<< HEAD

```
v1.0 Phase 1 Manual Core (LocalStorage)    ✅ Complete
v2.0 Phase 2 Threat Intel API Integrations   ✅ Complete
v3.0 Phase 3 PostgreSQL + JWT Authentication  ✅ Current
v4.0 Phase 4 Mobile PWA             🔲 Planned
v5.0 Phase 5 Deep Learning Steganalysis     🔲 Planned
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## Disclaimer

This platform is intended for **authorised investigative and educational use only**. Handle all case data in accordance with applicable data protection, privacy, and digital evidence laws. The authors are not responsible for misuse.

---

## License

[MIT](LICENSE)

---

<div align="center">
 <sub>Built for cyber crime investigators everywhere &nbsp;·&nbsp; Mr. ಪತ್ತೇದಾರ</sub>
</div>
=======
```
v1  Phase 1 — Manual Core          ✅
v2  Phase 2 — API Integrations     ✅
v3  Phase 3 — PostgreSQL + Auth    ✅  current
v4  Phase 4 — Mobile PWA           planned
v5  Phase 5 — DL Steganalysis      planned
```
>>>>>>> 64376b0 (feat: implement JWT auth pipeline, fix middleware loop, and build dynamic training UI)
