# AIQSO Demo API - Claude Reference

## Quick Overview
Backend API for interactive automation demo portal. Powers workflow builder, AI chat, and business dashboards with real and simulated automation.

## Tech Stack
- **Runtime:** Node.js 20+
- **Framework:** Fastify 4.26
- **Language:** TypeScript 5.3.3
- **Database:** Supabase (PostgreSQL)
- **Auth:** Firebase (optional)
- **AI:** OpenAI GPT-4o-mini
- **Email:** SendGrid
- **Calendar:** Google Calendar API (OAuth2)
- **Deployment:** Docker + Proxmox LXC 141

## Project Structure
```
src/
├── index.ts             # Main server entry
├── routes/
│   ├── automation.ts    # POST /api/automation/execute
│   ├── workflows.ts     # Workflow CRUD & execution
│   ├── chat.ts          # AI chat & generation
│   ├── dashboard.ts     # Metrics & analytics
│   ├── session.ts       # Demo session management
│   └── calendar.ts      # Google Calendar OAuth
├── services/
│   ├── openai.ts        # OpenAI wrapper
│   ├── supabase.ts      # Database ops
│   ├── sendgrid.ts      # Email service
│   ├── google-calendar.ts
│   └── simulation.ts    # Simulated automation
├── middleware/
├── types/
└── utils/
```

## API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `POST /api/automation/execute` | Execute automation |
| `GET /api/automation/services` | List services |
| `POST /api/workflows` | Create workflow |
| `POST /api/workflows/:id/execute` | Run workflow |
| `GET /api/workflows/templates` | Get templates |
| `POST /api/chat` | AI chat |
| `POST /api/chat/generate-workflow` | AI workflow gen |
| `GET /api/dashboard/metrics` | Dashboard metrics |
| `GET /health` | Health check |

## Quick Commands
```bash
# Development
npm run dev  # Port 3001

# Build
npm run build

# Start production
npm start

# Docker
docker-compose up -d
```

## Database Schema (Supabase)
- `demo_sessions` - User sessions with expiration
- `workflows` - Workflow definitions (nodes, edges)
- `workflow_executions` - Execution history
- `automation_results` - Delivery logs

## Environment Variables
Key vars in `.env`:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
SENDGRID_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Deployment
- **Container:** LXC 141 on Proxmox
- **Path:** `/opt/aiqso-demo-api`
- **Service:** systemd managed
- **URL:** demo-api.aiqso.io (Cloudflare Tunnel)

## Security
- Rate limiting: 100 req/15 min/IP
- Helmet headers
- CORS configured
- Zod validation
- Budget controls (OpenAI monthly, SendGrid daily)

## Documentation
- `README.md` - Full setup & API docs
- `QUICK_START.md` - 30-min setup guide
- `DEPLOYMENT.md` - Production deployment
