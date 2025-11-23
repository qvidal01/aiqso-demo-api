# AIQSO Demo API

Backend API for the AIQSO Interactive Demo Portal - Powers automation demonstrations, AI chat workflows, and interactive business dashboards.

## 🚀 Features

- **Automation Execution**: Real and simulated automation delivery (Email, SMS, Calendar, Webhooks)
- **AI-Powered Chat**: Cyberque AI assistant for workflow guidance
- **Visual Workflow Builder**: Create and execute custom automation workflows
- **Interactive Dashboards**: Real-time analytics and business intelligence demos
- **Service Catalog**: 8+ pre-built automation templates
- **OAuth Integration**: Google Calendar API with OAuth2 flow
- **Rate Limiting**: Built-in abuse prevention and budget controls

## 🏗️ Architecture

**Stack**:
- **Runtime**: Node.js 20+
- **Framework**: Fastify (high-performance web framework)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Firebase Authentication
- **AI**: OpenAI GPT-4o-mini
- **Email**: SendGrid
- **Calendar**: Google Calendar API
- **Deployment**: Docker + Proxmox LXC

## 📋 Prerequisites

Before running this API, you need:

1. **Node.js 20+** installed
2. **Firebase Project** (for authentication)
3. **Supabase Project** (for database)
4. **SendGrid Account** (for email integration)
5. **OpenAI API Key** (for AI chat)
6. **Google Cloud Project** (for Calendar API)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/aiqso-demo-api.git
cd aiqso-demo-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials (see [Configuration](#configuration) below).

### 4. Setup Supabase Database

Run these SQL commands in your Supabase SQL editor:

```sql
-- Demo Sessions Table
CREATE TABLE demo_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_demo_sessions_user_id ON demo_sessions(user_id);
CREATE INDEX idx_demo_sessions_expires_at ON demo_sessions(expires_at);

-- Workflows Table
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_updated_at ON workflows(updated_at);

-- Workflow Executions Table
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  steps JSONB NOT NULL,
  error TEXT
);

CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at);

-- Automation Results Table
CREATE TABLE automation_results (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_automation_results_timestamp ON automation_results(timestamp);
CREATE INDEX idx_automation_results_delivery_method ON automation_results(delivery_method);

-- Auto-delete old sessions (optional)
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM demo_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT delete_expired_sessions()');
```

### 5. Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the credentials to your `.env` file

### 6. Setup SendGrid

1. Go to [SendGrid](https://sendgrid.com/)
2. Create a free account (100 emails/day)
3. Create an API key
4. Verify sender email
5. Add API key to `.env`

### 7. Setup OpenAI

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Set usage limits ($10/month recommended)
4. Add key to `.env`

### 8. Setup Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://aiqso.io/portal-demo/callback`
6. Copy Client ID and Secret to `.env`

## ⚙️ Configuration

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,https://aiqso.io

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=demo@aiqso.io
SENDGRID_FROM_NAME=AIQSO Demo Portal

# Google Calendar
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://aiqso.io/portal-demo/callback

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Demo Configuration
DEMO_SESSION_DURATION=3600000
AUTO_DELETE_DEMO_DATA_DAYS=7
MAX_WORKFLOW_STEPS=20
MAX_WORKFLOW_EXECUTION_TIME=30000

# Budget Controls
OPENAI_MONTHLY_BUDGET_USD=10
SENDGRID_DAILY_LIMIT=50
```

## 🏃 Running the API

### Development Mode

```bash
npm run dev
```

Server runs on `http://localhost:3001` with hot reload.

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
docker-compose up -d
```

## 📡 API Endpoints

### Automation
- `POST /api/automation/execute` - Execute automation
- `GET /api/automation/services` - Get service catalog

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow
- `GET /api/workflows/templates` - Get templates

### Chat
- `POST /api/chat` - Chat with Cyberque AI
- `POST /api/chat/generate-workflow` - Generate workflow from description
- `GET /api/chat/usage` - Get AI usage stats

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/charts` - Get chart data
- `GET /api/dashboard/activity` - Get activity feed

### Session
- `POST /api/session` - Create demo session
- `GET /api/session/:id` - Get session

### Calendar
- `GET /api/calendar/auth-url` - Get OAuth URL
- `GET /api/calendar/callback` - OAuth callback

### Health
- `GET /health` - Health check
- `GET /` - API info

## 🔒 Security Features

- **Firebase Authentication**: Optional auth for all endpoints
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Configured allowed origins
- **Input Validation**: Zod schema validation
- **Budget Controls**: OpenAI and SendGrid usage limits

## 📊 Monitoring

The API includes built-in monitoring:

- Request logging
- Error tracking
- Usage analytics (OpenAI tokens, email count)
- Health check endpoint

## 🚢 Deployment

### Proxmox LXC (Recommended)

1. Create Ubuntu 24.04 LXC container
2. Install Docker and Docker Compose
3. Clone repository
4. Setup environment variables
5. Run with docker-compose
6. Setup Cloudflare Tunnel for HTTPS

### Deploy Script

```bash
#!/bin/bash
cd /path/to/aiqso-demo-api
git pull origin main
npm ci
npm run build
pm2 restart aiqso-demo-api
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test health endpoint
curl http://localhost:3001/health

# Test automation
curl -X POST http://localhost:3001/api/automation/execute \
  -H "Content-Type: application/json" \
  -d '{
    "service": "lead-notification",
    "deliveryMethod": "email",
    "recipient": "test@example.com",
    "payload": {
      "subject": "Test",
      "message": "Testing AIQSO Demo API"
    }
  }'
```

## 💰 Cost Estimate

With $25/month budget:

- **Firebase**: $0 (free tier)
- **Supabase**: $0 (free tier, upgrade to $25 if needed)
- **SendGrid**: $0 (free 100 emails/day)
- **OpenAI**: $2-10/month (GPT-4o-mini)
- **Google Calendar**: $0 (free)

Total: **$2-10/month** for moderate demo usage

## 🐛 Troubleshooting

### "Failed to start server"
- Check that port 3001 is not in use
- Verify environment variables are set correctly

### "OpenAI API error"
- Check API key is valid
- Verify usage limits not exceeded
- Check monthly budget not exceeded

### "Supabase connection failed"
- Verify Supabase URL and keys
- Check database tables exist
- Verify network connectivity

### "SendGrid email not sending"
- Verify sender email is verified
- Check daily limit not exceeded
- Verify API key permissions

## 📝 License

MIT License - See LICENSE file for details

## 👥 Support

For issues or questions:
- GitHub Issues: [aiqso-demo-api/issues](https://github.com/yourusername/aiqso-demo-api/issues)
- Email: demo@aiqso.io
- Website: https://aiqso.io

## 🎯 Roadmap

- [ ] Add more automation templates
- [ ] Implement workflow versioning
- [ ] Add A/B testing for automations
- [ ] Real-time workflow execution logs (WebSocket)
- [ ] Export workflow as code (Python, Node.js)
- [ ] Integration marketplace
- [ ] Analytics dashboard
- [ ] Multi-language support
