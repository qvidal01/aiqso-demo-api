# AIQSO Demo API - Quick Start Guide

**Get running in 30 minutes!** (Firebase authentication removed for simplicity)

---

## ✅ What You Need (4 Services - All FREE)

1. **Supabase** (Database) - 15 min
2. **SendGrid** (Email) - 10 min
3. **OpenAI** (AI Chat) - 5 min
4. **Google Calendar** (Calendar Invites) - 15 min

**Firebase skipped!** The demo works perfectly without user authentication.

---

## 🚀 STEP 1: Setup Supabase (15 minutes)

### Create Project
1. Go to https://supabase.com/
2. Sign in or create account
3. Click **"New project"**
   - Name: `aiqso-demo-portal`
   - Password: Generate strong password (save it!)
   - Region: Choose closest to you
4. Click **"Create new project"** → wait ~2 minutes

### Get Credentials
5. Go to **Project Settings** (gear icon) → **API**
6. Copy these values:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon public** key (long string starting with `eyJ`)
   - **service_role** key (click "Reveal", longer string starting with `eyJ`)

### Create Database Tables
7. Click **"SQL Editor"** in left sidebar
8. Click **"New query"**
9. **Copy and paste this entire SQL script:**

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
```

10. Click **"Run"** → Should see "Success. No rows returned"
11. Click **"Table Editor"** → Verify you see 4 tables

**✅ Keep these handy:**
- Supabase URL
- Anon key
- Service role key

---

## 📧 STEP 2: Setup SendGrid (10 minutes)

### Create Account
1. Go to https://sendgrid.com/
2. Click **"Start for free"**
3. Fill in details (use real email)
4. Verify your email (check inbox)

### Create API Key
5. Login to SendGrid dashboard
6. Skip onboarding wizards (click "Maybe later")
7. Go to **Settings → API Keys**
8. Click **"Create API Key"**
   - Name: `AIQSO Demo Portal`
   - Permissions: **"Full Access"**
9. Click **"Create & View"**
10. **COPY THE KEY NOW!** (Starts with `SG.` - won't be shown again)

### Verify Sender Email
11. Go to **Settings → Sender Authentication**
12. Click **"Verify a Single Sender"**
13. Fill in:
    - From Name: `AIQSO Demo Portal`
    - From Email: Your email address
    - Reply To: Same as above
    - Company Address: Your address
14. Click **"Create"**
15. **Check your email inbox** → Click verification link

**✅ Keep these handy:**
- SendGrid API key (starts with `SG.`)
- Verified email address

---

## 🤖 STEP 3: Setup OpenAI (5 minutes)

### Create API Key
1. Go to https://platform.openai.com/
2. Sign in or create account
3. Add payment method (Settings → Billing)
4. Go to **API keys** (https://platform.openai.com/api-keys)
5. Click **"Create new secret key"**
   - Name: `AIQSO Demo Portal`
6. **COPY THE KEY NOW!** (Starts with `sk-`)

### Set Usage Limits (Important!)
7. Go to **Settings → Limits**
8. Set **Monthly budget**: `$10.00`
9. Set **Email notification**: `$5.00`
10. Click **"Save"**

**✅ Keep handy:**
- OpenAI API key (starts with `sk-`)

---

## 📅 STEP 4: Setup Google Calendar (15 minutes)

### Create Project
1. Go to https://console.cloud.google.com/
2. Click **"Select a project"** → **"NEW PROJECT"**
3. Name: `AIQSO Demo Portal`
4. Click **"Create"** → Wait ~10 seconds
5. Make sure new project is selected

### Enable Calendar API
6. Search for "Google Calendar API" in search bar
7. Click **"Google Calendar API"**
8. Click **"ENABLE"**

### Configure OAuth Consent Screen
9. Click **"OAuth consent screen"** in left sidebar
10. User Type: **"External"** → Click **"CREATE"**
11. Fill in:
    - App name: `AIQSO Demo Portal`
    - User support email: Your email
    - Developer contact: Your email
12. Click **"SAVE AND CONTINUE"** (x3 - skip Scopes and Test users)

### Create OAuth Credentials
13. Click **"Credentials"** in left sidebar
14. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
15. Application type: **"Web application"**
16. Name: `AIQSO Demo Portal`
17. Authorized redirect URIs → Click **"+ ADD URI"**:
    - `http://localhost:3000/portal-demo/callback`
    - `https://aiqso.io/portal-demo/callback`
18. Click **"CREATE"**
19. **Copy these values:**
    - Client ID (ends with `.apps.googleusercontent.com`)
    - Client Secret (starts with `GOCSPX-`)

**✅ Keep these handy:**
- Google Client ID
- Google Client Secret

---

## 📝 STEP 5: Create .env File

```bash
cd /Users/cyberque/aiqso-demo-api
cp .env.example .env
nano .env
```

**Fill in with your values:**

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,https://aiqso.io

# Firebase - SKIPPED (commented out)
# FIREBASE_PROJECT_ID=
# FIREBASE_CLIENT_EMAIL=
# FIREBASE_PRIVATE_KEY=

# Supabase (from Step 1)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...YOUR-ANON-KEY
SUPABASE_SERVICE_KEY=eyJhbGci...YOUR-SERVICE-KEY

# OpenAI (from Step 3)
OPENAI_API_KEY=sk-YOUR-OPENAI-KEY
OPENAI_MODEL=gpt-4o-mini

# SendGrid (from Step 2)
SENDGRID_API_KEY=SG.YOUR-SENDGRID-KEY
SENDGRID_FROM_EMAIL=your-verified-email@example.com
SENDGRID_FROM_NAME=AIQSO Demo Portal

# Google Calendar (from Step 4)
GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR-CLIENT-SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/portal-demo/callback

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

**Save:** Ctrl+X, then Y, then Enter

---

## 🏃 STEP 6: Run the API!

```bash
cd /Users/cyberque/aiqso-demo-api

# Install dependencies
npm install

# Start the server
npm run dev
```

**You should see:**
```
⚠️  Firebase not configured - authentication disabled (demo will work without user accounts)
🚀 AIQSO Demo API running on http://0.0.0.0:3001
📊 Environment: development
🔒 CORS allowed origins: http://localhost:3000, https://aiqso.io
```

**✅ The warning about Firebase is NORMAL!** It means everything is working.

---

## 🧪 STEP 7: Test Your API

Open a **new terminal** and run these tests:

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```
**Expected:** `{"status":"ok","timestamp":"2025-11-22T..."}`

### Test 2: Service Catalog
```bash
curl http://localhost:3001/api/automation/services
```
**Expected:** JSON array with 8 services

### Test 3: AI Chat (OpenAI)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How can I automate lead notifications?"}'
```
**Expected:** AI response about automation

### Test 4: Send Email (SendGrid)
```bash
curl -X POST http://localhost:3001/api/automation/execute \
  -H "Content-Type: application/json" \
  -d '{
    "service": "lead-notification",
    "deliveryMethod": "email",
    "recipient": "YOUR-EMAIL@example.com",
    "payload": {
      "subject": "Test from AIQSO Demo API",
      "message": "If you receive this, everything is working!"
    }
  }'
```
**Expected:** Check your email inbox! 📧

---

## ✅ SUCCESS CHECKLIST

- [ ] Supabase: 4 tables created
- [ ] SendGrid: Sender email verified
- [ ] OpenAI: Usage limits set
- [ ] Google Calendar: OAuth credentials created
- [ ] `.env` file: All values filled in
- [ ] `npm install`: Completed successfully
- [ ] `npm run dev`: Server started
- [ ] Health check: Returns OK
- [ ] Service catalog: Returns 8 services
- [ ] AI chat: Returns response
- [ ] Email test: Arrives in inbox

---

## 🎉 YOU'RE DONE!

Your demo API is now running and ready to power your interactive demo portal!

**What works:**
- ✅ Email automation (real)
- ✅ SMS/calls (simulated with previews)
- ✅ AI chat workflows with Cyberque
- ✅ Visual workflow builder
- ✅ Calendar invites (real, with OAuth)
- ✅ Interactive dashboards
- ✅ Service catalog with 8 templates

**What's missing:**
- ⚠️ User authentication (not needed for demo - guests can test everything)

**Next steps:**
1. Keep the API running (`npm run dev`)
2. Build the frontend components
3. Test end-to-end
4. Deploy to Proxmox

**Need help?** Check the full README.md or the troubleshooting section.

---

**Cost:** Still just **$2-5/month** with your $25 budget! 🎉
