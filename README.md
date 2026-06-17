<div align="center">
<img width="1200" height="475" alt="VioletBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Violet Career OS

An AI-powered personal career operating system with an approval-driven workflow, managing application tailoring, Gmail intelligence, tracking, interview prep, Telegram bot integration, and Composio-powered tool connections.

## Features

- **AI Career Copilot** — Chat assistant that adapts to your communication style (Quiet Adaptive Scribe)
- **Opportunity Analyzer** — Paste job descriptions and get match scores, strengths, gaps, and recommendations
- **Resume & Cover Tailoring** — Generate tailored resume bullets, cover letters, and outreach emails
- **Email Intelligence** — Classify recruiter emails (Offer, Interview, Rejection, Follow-up, Opportunity)
- **Application Tracker** — Kanban-style pipeline from SAVED → READY → APPLIED → INTERVIEW → OFFER → ACCEPTED
- **Interview Prep** — Company research, technical mocks, and HR question guides auto-generated per role
- **Memory Vault** — Stores identity, preferences, history, and learning observations across sessions
- **Project Mining** — Auto-detect achievements from GitHub repos and portfolio links
- **Approval Queue** — All AI-generated outputs require human approval before execution
- **Multi-LLM Support** — Use OpenRouter, NVIDIA NIM, or Groq
- **Telegram Bot** — Full chat access to Violet via Telegram with slash commands
- **Composio Integration** — Connect Gmail, Google Calendar, and 250+ tools via Composio
- **OAuth2 Auth** — Google and GitHub sign-in with token management and refresh

## Architecture

```
violet-career-os/
├── server.ts              # Express backend (API, Telegram, Composio, OAuth2)
├── src/
│   ├── App.tsx            # Main React SPA with tab navigation
│   ├── types.ts           # TypeScript interfaces (Profile, Opportunity, Email, etc.)
│   ├── appwrite.ts        # Appwrite auth & database client
│   ├── components/
│   │   ├── AuthAndOnboarding.tsx
│   │   ├── DashboardOverview.tsx
│   │   ├── VioletChat.tsx
│   │   ├── OpportunityAnalyzer.tsx
│   │   ├── ResumeTailor.tsx
│   │   ├── EmailIntelligence.tsx
│   │   ├── ApplicationTracker.tsx
│   │   ├── InterviewPrepComp.tsx
│   │   ├── MemoryVault.tsx
│   │   ├── ProfileManager.tsx
│   │   └── CherryBlossomBackground.tsx
│   └── pages/
│       ├── Privacy.tsx
│       └── Terms.tsx
├── .env.example           # Environment variable template
├── .env.local             # Local environment (gitignored)
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Prerequisites

- **Node.js** 18+
- **Appwrite** project (for auth and data persistence)
- **LLM API Key** (optional, runs in simulation mode without it)
- **Telegram Bot Token** (optional, for Telegram integration)
- **Composio API Key** (optional, for tool integrations)
- **Google/GitHub OAuth2 credentials** (optional, for OAuth2 flows)

## Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys and credentials.

3. **Run the app:**
   ```bash
   npm run dev
   ```
   The server starts at `http://localhost:5173`.

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram and get your token.
2. Set the environment variables in your `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_WEBHOOK_URL=https://your-domain.com   # Optional; uses polling if unset
   ```
3. Connect your account via the **Integrations** tab in the web dashboard or use `/start` in Telegram.

### Telegram Commands

| Command | Description |
| :--- | :--- |
| `/start` | Initialize Violet bot session |
| `/help` | List available commands |
| `/digest` | Show today's prioritized career actions |
| `/profile` | Display master profile summary |
| `/connect_gmail` | Get Composio Gmail connection link |
| `/connect_calendar` | Get Composio Calendar connection link |

Natural language messages are also accepted — Violet responds with the same personality and tone adaptation as the web chat.

> **Webhook mode**: Set `TELEGRAM_WEBHOOK_URL` to your public domain. Violet registers `POST /api/telegram/webhook` as the webhook endpoint.
>
> **Polling mode**: Leave `TELEGRAM_WEBHOOK_URL` empty. The bot polls Telegram servers automatically.

## LLM Provider Configuration

Violet supports multiple OpenAI-compatible LLM providers. Configure your preferred provider in `.env`:

| Provider | `LLM_PROVIDER` | `LLM_BASE_URL` (default) | `LLM_MODEL` (default) |
| :--- | :--- | :--- | :--- |
| **OpenRouter** | `openrouter` | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-8b-instruct:free` |
| **NVIDIA NIM** | `nvidia` | `https://integrate.api.nvidia.com/v1` | `meta/llama-3.3-70b-instruct` |
| **Groq** | `groq` | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |

```bash
# Example for Groq
LLM_PROVIDER=groq
LLM_API_KEY=gsk_your_groq_key
```

## Composio Integration

[Composio](https://composio.dev) provides managed OAuth for 250+ SaaS tools (Gmail, Google Calendar, Slack, Notion, etc.).

1. Get an API key from [app.composio.dev](https://app.composio.dev).
2. Set the environment variable:
   ```bash
   COMPOSIO_API_KEY=your-composio-key
   ```
3. **Connect a tool**: Use the **Integrations** tab in the dashboard or navigate to `/api/composio/connect/{toolName}` (e.g., `/api/composio/connect/GMAIL`).
4. **Execute actions**: `POST /api/composio/execute/{toolName}` with `{ action, params }` in the body.


### Composio API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/composio/connect/:toolName` | Initiate OAuth flow for a tool |
| `GET` | `/api/composio/callback` | Composio OAuth callback handler |
| `GET` | `/api/composio/status` | List connected tool integrations |
| `POST` | `/api/composio/execute/:toolName` | Execute an action on a connected tool |

## OAuth2 (Google & GitHub)

Violet implements full OAuth2 authorization code flows for Google and GitHub, with token storage in server-side sessions and automatic refresh for Google.

### Google OAuth2 Setup

1. Create credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:5173/auth/google/callback` as a redirect URI.
3. Set environment variables:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
   ```
4. Scopes requested: `openid email profile gmail.readonly calendar.readonly`

### GitHub OAuth2 Setup

1. Register an OAuth app at [GitHub Developer Settings](https://github.com/settings/developers).
2. Set `http://localhost:5173/auth/github/callback` as the callback URL.
3. Set environment variables:
   ```
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback
   ```
4. Scopes requested: `read:user user:email repo`

### OAuth2 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/google` | Redirect to Google consent screen |
| `GET` | `/auth/google/callback` | Handle Google OAuth callback and store tokens |
| `GET` | `/auth/github` | Redirect to GitHub consent screen |
| `GET` | `/auth/github/callback` | Handle GitHub OAuth callback and store tokens |
| `GET` | `/api/oauth/status` | Check connection status for Google & GitHub |
| `POST` | `/api/oauth/google/refresh` | Refresh Google access token |
| `POST` | `/api/oauth/google/disconnect` | Revoke Google token from session |
| `POST` | `/api/oauth/github/disconnect` | Revoke GitHub token from session |

## Core API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/init-user` | Initialize user profile and memory |
| `GET` | `/api/state` | Get full application state |
| `POST` | `/api/update-profile` | Update user profile |
| `POST` | `/api/parse-resume` | Parse resume text into structured profile |
| `POST` | `/api/analyze-opportunity` | Analyze job description against profile |
| `POST` | `/api/tailor-materials` | Generate tailored resume bullets and cover letter |
| `POST` | `/api/interview-prep` | Generate interview prep materials |
| `POST` | `/api/mine-github` | Extract achievements from GitHub repos |
| `POST` | `/api/scan-emails` | Trigger incoming email scan |
| `POST` | `/api/sync-real-gmail` | Sync real Gmail messages using OAuth token |
| `POST` | `/api/chat` | Chat with Violet (used by web and Telegram) |

## Production Build

```bash
npm run build
NODE_ENV=production npm run start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_API_KEY` | No | OpenAI-compatible API key (falls back to simulation mode) |
| `LLM_BASE_URL` | No | LLM API base URL (default: OpenRouter) |
| `LLM_MODEL` | No | Model identifier (default: `meta-llama/llama-3.3-8b-instruct:free`) |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token from @BotFather |
| `TELEGRAM_WEBHOOK_URL` | No | Public URL for webhook mode (polling if unset) |
| `COMPOSIO_API_KEY` | No | Composio API key for tool integrations |
| `COMPOSIO_BASE_URL` | No | Composio API base URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | No | Google OAuth2 redirect URI |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth2 client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth2 client secret |
| `GITHUB_REDIRECT_URI` | No | GitHub OAuth2 redirect URI |
| `SESSION_SECRET` | No | Secret for signing session cookies (change in production) |
| `BASE_URL` | No | Public base URL for OAuth and Composio callbacks |
| `VITE_APPWRITE_ENDPOINT` | Yes | Appwrite API endpoint |
| `VITE_APPWRITE_PROJECT_ID` | Yes | Appwrite project ID |
| `VITE_APPWRITE_DATABASE_ID` | Yes | Appwrite database ID |
| `APPWRITE_API_KEY` | No | Appwrite server-side API key |

## License

Private. All rights reserved.
