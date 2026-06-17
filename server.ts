import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import TelegramBot from "node-telegram-bot-api";
import { Composio } from "@composio/core";

dotenv.config();

// LLM Provider Configuration - Support for OpenRouter, NVIDIA NIM, Groq, etc.
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openrouter"; // openrouter, nvidia, groq
const LLM_BASE_URL = process.env.LLM_BASE_URL || 
  (LLM_PROVIDER === "nvidia" ? "https://integrate.api.nvidia.com/v1" :
   LLM_PROVIDER === "groq" ? "https://api.groq.com/openai/v1" :
   "https://openrouter.ai/api/v1");

const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || 
  (LLM_PROVIDER === "nvidia" ? "meta/llama-3.3-70b-instruct" :
   LLM_PROVIDER === "groq" ? "llama-3.3-70b-versatile" :
   "meta-llama/llama-3.3-8b-instruct:free");

const ai = LLM_API_KEY ? true : false;

if (!LLM_API_KEY) {
  console.warn(`LLM_API_KEY is not set for provider ${LLM_PROVIDER}, running in simulation fallback mode.`);
} else {
  console.log(`[LLM] Configured for ${LLM_PROVIDER} using model ${LLM_MODEL}`);
}

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || "";

// Composio Configuration
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || "";
const COMPOSIO_BASE_URL = process.env.COMPOSIO_BASE_URL || "https://api.composio.dev";

// OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || "http://localhost:5173/auth/github/callback";

const SESSION_SECRET = process.env.SESSION_SECRET || "violet-session-secret-change-in-prod";

async function llmComplete(prompt: string, jsonMode = true): Promise<string> {
  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`LLM API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

async function llmChat(messages: { role: string; content: string }[], systemInstruction: string, jsonMode = true): Promise<string> {
  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "system", content: systemInstruction }, ...messages],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`LLM API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use(session({
  name: "violet.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax"
  },
  genid: () => uuidv4()
}));

// ---- Telegram Bot Setup ----
let telegramBot: TelegramBot | null = null;
const telegramChatSessions = new Map<number, { role: "user" | "model"; text: string }[]>();

if (TELEGRAM_BOT_TOKEN) {
  if (TELEGRAM_WEBHOOK_URL) {
    telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    telegramBot.setWebHook(`${TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`);
    console.log("[Telegram] Webhook mode configured at", TELEGRAM_WEBHOOK_URL);
  } else {
    telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    console.log("[Telegram] Polling mode active");
  }

  telegramBot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    telegramChatSessions.set(chatId, []);
    telegramBot?.sendMessage(
      chatId,
      "Hi there. I'm Violet, your career assistant. Let's get things sorted.\n\nI can check your resume, track jobs, scan emails, and prepare interview briefs. No big words, just results."
    );
  });

  telegramBot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    telegramBot?.sendMessage(
      chatId,
      "Here is what I can do:\n\n/profile — shows your skills & history\n/upload_resume — upload new files\n/create_resume — tailor a resume\n/analyze — check a job spec\n/applications — view tracker status\n/interviews — check prepped interview briefs\n/digest — see today's plan\n/connect_gmail — connect your Gmail via Composio\n/connect_calendar — connect Google Calendar via Composio"
    );
  });

  telegramBot.onText(/\/digest/, (msg) => {
    const chatId = msg.chat.id;
    telegramBot?.sendMessage(
      chatId,
      "Here is today's check:\n- 8 jobs analyzed.\n- 2 fit your skills well: Stripe & Anthropic.\n- Needs your okay: Stripe resume bullets draft.\n- You have an interview with Anthropic this Thursday. I prepped some questions."
    );
  });

  telegramBot.onText(/\/profile/, (msg) => {
    const chatId = msg.chat.id;
    telegramBot?.sendMessage(
      chatId,
      `Here is your profile:\n- Name: ${userProfile.fullName}\n- School: ${userProfile.education[0]?.school || "N/A"}\n- Core Skills: ${userProfile.skills.slice(0, 6).join(", ")}\n- Current job: ${userProfile.experience[0]?.role || "N/A"} @ ${userProfile.experience[0]?.company || "N/A"}`
    );
  });

  telegramBot.onText(/\/connect_gmail/, (msg) => {
    const chatId = msg.chat.id;
    if (!COMPOSIO_API_KEY) {
      telegramBot?.sendMessage(chatId, "Gmail connection requires Composio to be configured. Set COMPOSIO_API_KEY in your environment.");
      return;
    }
    const connectUrl = `${process.env.BASE_URL || "http://localhost:5173"}/api/composio/connect/GMAIL?state=${chatId}`;
    telegramBot?.sendMessage(chatId, `Connect your Gmail to let Violet read recruiter emails:\n\n${connectUrl}`);
  });

  telegramBot.onText(/\/connect_calendar/, (msg) => {
    const chatId = msg.chat.id;
    if (!COMPOSIO_API_KEY) {
      telegramBot?.sendMessage(chatId, "Calendar connection requires Composio to be configured. Set COMPOSIO_API_KEY in your environment.");
      return;
    }
    const connectUrl = `${process.env.BASE_URL || "http://localhost:5173"}/api/composio/connect/GOOGLE_CALENDAR?state=${chatId}`;
    telegramBot?.sendMessage(chatId, `Connect your Google Calendar to sync interview schedules:\n\n${connectUrl}`);
  });

  telegramBot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";
    if (text.startsWith("/")) return;

    if (!telegramChatSessions.has(chatId)) {
      telegramChatSessions.set(chatId, []);
    }
    const history = telegramChatSessions.get(chatId)!;
    history.push({ role: "user", text });
    if (history.length > 20) history.shift();

    let reply: string;

    if (ai) {
      try {
        const systemIns = `You are Violet, a career chief-of-staff AI assistant accessible via Telegram.
Tone: Not formal, not robotic. Just clear, human, humble, and familiar. Speaks like someone thinking while typing.
Simple English First. Prefer "good" over "optimal", "fix" over "rectify", "use" over "utilize", "help" over "facilitate".
Low Ego. Calm, Human Flow. Action-Oriented: always guide towards decision, output, next step.

USER PROFILE CONTEXT:
${JSON.stringify(userProfile)}

Respond in JSON: { "reply": "string" }`;

        const formattedMessages = history.map(h => ({
          role: h.role === "model" ? "assistant" as const : "user" as const,
          content: h.text
        }));

        const llmResponse = await llmChat(formattedMessages, systemIns);
        const parsed = JSON.parse(llmResponse.trim());
        reply = parsed.reply || "I checked your message. Let's see what we can do next.";
      } catch (err) {
        console.error("[Telegram] LLM failed:", err);
        reply = "I had a small problem linking with my AI services, but we are still good to resume tracking.";
      }
    } else {
      const lower = text.toLowerCase();
      if (lower.includes("resume") || lower.includes("cv")) {
        reply = "I checked your resume. It looks good and has your UW CS credentials. Want to tailor it for a specific job application now?";
      } else if (lower.includes("interview") || lower.includes("study") || lower.includes("prep")) {
        reply = "I have your interview prep sheets ready for Anthropic. Let's go over the core questions if you are free.";
      } else if (lower.includes("email") || lower.includes("recruiter")) {
        reply = "I am polling recruiter emails. Your email intelligence tab shows the latest threads classified automatically.";
      } else {
        reply = "I checked your request. Let me know what you want to fix today.";
      }
    }

    history.push({ role: "model", text: reply });
    if (history.length > 20) history.shift();
    telegramBot?.sendMessage(chatId, reply);
  });

  console.log("[Telegram] Bot initialized successfully");
} else {
  console.warn("[Telegram] TELEGRAM_BOT_TOKEN not set. Telegram bot is disabled.");
}

// ---- Composio Integration Setup ----
let composio: Composio | null = null;

if (COMPOSIO_API_KEY) {
  try {
    composio = new Composio({ apiKey: COMPOSIO_API_KEY });
    console.log("[Composio] SDK initialized successfully");
  } catch (err) {
    console.error("[Composio] Failed to initialize SDK:", err);
  }
} else {
  console.warn("[Composio] COMPOSIO_API_KEY not set. Composio integration is disabled.");
}

// ---- OAuth2 State Store (in-memory, replace with DB for production) ----
const oauthStates = new Map<string, { provider: string; userId?: string; telegramChatId?: number; createdAt: number }>();

function generateOAuthState(provider: string, userId?: string, telegramChatId?: number): string {
  const state = uuidv4();
  oauthStates.set(state, { provider, userId, telegramChatId, createdAt: Date.now() });
  setTimeout(() => oauthStates.delete(state), 10 * 60 * 1000);
  return state;
}

function consumeOAuthState(state: string) {
  const entry = oauthStates.get(state);
  if (entry) {
    oauthStates.delete(state);
    return entry;
  }
  return null;
}

const PORT = 5173;

// State stored on server root (lasts for the container session, is backed up / complemented by client localStorage)
let userProfile = {
  id: "profile-1",
  fullName: "John Doe",
  email: "sayojami2007@gmail.com",
  phone: "+1 (555) 432-1098",
  github: "https://github.com/johndoe",
  linkedin: "https://linkedin.com/in/johndoe",
  portfolio: "https://johndoe.dev",
  location: "Seattle, WA",
  education: [
    {
      school: "University of Washington",
      degree: "B.S.",
      fieldOfStudy: "Computer Science",
      startDate: "2023-09-15",
      endDate: "2027-06-15",
      gpa: "3.85"
    }
  ],
  skills: [
    "TypeScript", "React", "Node.js", "Express", "TailwindCSS", "Python", 
    "Git", "Docker", "REST APIs", "SQL", "HTML/CSS", "D3.js"
  ],
  experience: [
    {
      company: "TechCorp Labs",
      role: "Software Engineering Intern",
      location: "San Francisco, CA (Remote)",
      startDate: "2025-06-01",
      endDate: "2025-09-01",
      description: "Implemented a rich web application dashboard using React and Recharts. Improved initial page loading speed by 35% through image rendering optimizations and lazy loading. Created reusable interface components styled with Tailwind."
    }
  ]
};

let applications = [
  {
    id: "app-1",
    title: "Junior Frontend Engineer",
    company: "Stripe",
    location: "Seattle, WA (Hybrid)",
    salary: "$120,000 - $140,000",
    deadline: "2026-07-15",
    requirements: ["React experience", "Strong CSS/Tailwind skills", "TypeScript expertise", "Attention to visual design"],
    descriptionText: "Looking for a Frontend Engineer passionate about high quality interfaces. You will build user accounts portals, developer dashboards, and billing structures. Strong emphasis on pixel-perfect implementations and custom design tokens.",
    status: "SAVED",
    createdAt: "2026-06-10T14:30:00Z"
  },
  {
    id: "app-2",
    title: "Software Engineer - Developer Platform",
    company: "Vercel",
    location: "Remote (US)",
    salary: "$130,000 - $160,000",
    deadline: "2026-06-30",
    requirements: ["Next.js mastery", "Vite internals", "TypeScript", "Performance tuning"],
    descriptionText: "Join the Developer Experience team to refine build pipelines, optimize Hot Module Replacement (HMR), and create elegant, speedy cloud deployment interfaces. You should love open source projects.",
    status: "READY",
    createdAt: "2026-06-12T09:15:00Z"
  },
  {
    id: "app-3",
    title: "Full Stack Engineer",
    company: "Linear",
    location: "Remote",
    salary: "$140,000",
    deadline: "2026-06-25",
    requirements: ["Expertise in fast desktop-class web apps", "Node.js", "TypeScript", "Database optimization"],
    descriptionText: "Help build the future of project management software. We construct highly optimized, instant-load user interfaces. We demand meticulous craft, design excellence, and a solid understanding of keyboard layouts and speed.",
    status: "APPLIED",
    createdAt: "2026-06-05T11:00:00Z"
  },
  {
    id: "app-4",
    title: "AI Product Engineer",
    company: "Anthropic",
    location: "San Francisco, CA (In-Office)",
    salary: "$160,000 - $220,000",
    deadline: "2026-07-01",
    requirements: ["TypeScript and Python", "LLM application structures", "Component libraries", "UX intuition"],
    descriptionText: "Work at the cutting edge of AI interactions. Build chat logs, system prompts runners, and canvas workspace environments. Looking for designers who can write flawless UI code.",
    status: "INTERVIEW",
    createdAt: "2026-06-01T10:00:00Z"
  },
  {
    id: "app-5",
    title: "Software Engineer - Core UI",
    company: "Figma",
    location: "San Francisco, CA",
    salary: "$150,000",
    deadline: "2026-06-20",
    requirements: ["WebGL/Canvas experience", "High performance TypeScript", "Complex data trees"],
    descriptionText: "Work on the Figma design canvas engine. You will optimize vectors, manage web assemblies, and perfect interface modules.",
    status: "REJECTED",
    createdAt: "2026-05-15T08:00:00Z"
  },
  {
    id: "app-6",
    title: "Frontend Developer (Contract)",
    company: "Supabase",
    location: "Singapore / Remote",
    salary: "$90,000 - $110,000",
    deadline: "2026-08-01",
    requirements: ["React", "PostgreSQL database interfaces", "Dashboard structures"],
    descriptionText: "Build the database view modules, SQL editors, and real-time multiplayer status boards on Supabase's main user console.",
    status: "OFFER",
    createdAt: "2026-05-10T16:00:00Z"
  }
];

let emails = [
  {
    id: "mail-1",
    sender: "recruiter@stripe.com",
    subject: "RE: Your Inquiry - Junior Frontend Engineer",
    body: "Hi John, thanks for reaching out. We love your portfolio page highlighting the visual speedups. Let's arrange a introductory call. Please verify your calendar availability next Tuesday afternoon.",
    receivedAt: "2026-06-14T15:20:00Z",
    category: "OPPORTUNITY",
    processed: true,
    suggestedAction: "Suggesting a chat response to schedule Tuesday at 2:00 PM."
  },
  {
    id: "mail-2",
    sender: "careers-platform@anthropic.com",
    subject: "Interview Invitation: Anthropic Technical Round",
    body: "Hello John, we've reviewed your tailored resume changes and are delighted to move you to the next step. You will be scheduled for a 60-minute technical interview focusing on full-stack canvas structures and prompt engineering optimizations. Let us know if this Thursday at 10 AM works.",
    receivedAt: "2026-06-15T08:30:00Z",
    category: "INTERVIEW",
    processed: false,
    suggestedAction: "Generate interview prep sheet & respond confirming scheduling."
  },
  {
    id: "mail-3",
    sender: "notifications@figma.com",
    subject: "Your application status for Core UI software engineer",
    body: "Thank you for taking the time to interview with us, John. After careful consideration, we have decided to move forward with other candidates who have more advanced WebGL canvas experience. We will keep your resume on file.",
    receivedAt: "2026-06-11T12:00:00Z",
    category: "REJECTION",
    processed: true,
    suggestedAction: "Record interview feedback and log to Career Memory."
  },
  {
    id: "mail-4",
    sender: "hr-offers@supabase.io",
    subject: "Offer Letter - Supabase Frontend Developer!",
    body: "Dear John, we are absolutely thrilled to offer you the position of Frontend Developer (Contract). We loved your deep understanding of relational layouts and real-time state. Inside this letter is an official offer for $95,000 starting August 1st. Please review and approve with your signature.",
    receivedAt: "2026-06-13T10:00:00Z",
    category: "OFFER",
    processed: true,
    suggestedAction: "Evaluate salary parameters, prepare confirmation response."
  }
];

let achievements = [
  {
    id: "ach-1",
    title: "SummaStudy: Interactive Study Guide Hub",
    source: "github",
    description: "Built a fully functional fullstack Markdown and PDF summarizer using Express server & Vite. Designed a responsive study guide deck with flashcard generators, quizzes, and live timeline widgets.",
    detectedAt: "2026-06-14T20:00:00Z",
    isAppliedToResume: false
  },
  {
    id: "ach-2",
    title: "Presently: Smart Location-aware Daily Compass",
    source: "portfolio",
    description: "Constructed an offline-first weather-grounded micro-journaling web application. Integrated high-contrast custom maps and auto-saving geolocation checklists.",
    detectedAt: "2026-06-15T02:00:00Z",
    isAppliedToResume: true
  }
];

let approvalQueue: any[] = [
  {
    id: "appr-1",
    type: "resume-variant",
    title: "Optimize Bullet Points for Anthropic",
    description: "Refining the software engineering roles on your master resume to highlight LLM tooling, chat component development, and custom CSS frames.",
    payload: {
      originalBullet: "Implemented a rich web application dashboard using React and Recharts. Improved initial page loading speed by 35%.",
      tailoredBullet: "Implemented an interactive AI Chat interface dashboard using React. Engineered state systems with streaming chunks outputs. Refined initial rendering speeds by 35% through lightweight bundle structures."
    },
    status: "pending",
    createdAt: "2026-06-15T09:00:00Z"
  },
  {
    id: "appr-2",
    type: "cover-email",
    title: "Stripe Recruiter Callback Correspondence",
    description: "Drafting a professional scheduling response for the Stripe recruiter callback next Tuesday.",
    payload: {
      to: "recruiter@stripe.com",
      subject: "Re: Your Inquiry - Junior Frontend Engineer - John Doe",
      body: "Dear Stripe Recruiting Team,\n\nThank you for reaching out! I am very excited to schedule our introductory conversation. Next Tuesday, June 23rd, at 2:00 PM PDT works perfectly for me.\n\nLooking forward to speaking and learning more about Stripe's Core UI and developer billing initiatives.\n\nBest regards,\nJohn Doe"
    },
    status: "pending",
    createdAt: "2026-06-15T09:30:00Z"
  }
];

// Memory Model
let careerMemory = {
  identity: {
    skills: ["React", "TypeScript", "Node.js", "Express", "TailwindCSS", "Python", "Docker", "SQL", "D3.js"],
    education: ["B.S. Computer Science @ University of Washington, GPA: 3.85 (June 2027)"],
    projects: ["SummaStudy - Fullstack Markdown and PDF summarizer", "Presently - Location-aware weather dashboard"]
  },
  preference: {
    preferredRoles: ["Frontend Engineer", "Full Stack Developer", "Developer Relations", "AI Product Engineer"],
    preferredLocations: ["Seattle, WA", "San Francisco, CA", "Remote"],
    remotePreference: true
  },
  history: {
    applications: ["Stripe", "Vercel", "Linear", "Anthropic", "Figma", "Supabase"],
    interviews: ["Anthropic", "Supabase", "Figma"],
    offers: ["Supabase"]
  },
  learning: {
    observations: [
      "Figma rejected based on WebGL canvas depth, indicating a training gap in low-level graphics rendering.",
      "Stripe and Anthropic recruiters responded very positively to custom web application portfolios over standard cookie-cutter mockups."
    ],
    recommendations: [
      "Highlight custom fullstack project builds (like SummaStudy) when targeting modern AI and developer platforms.",
      "Enrich resume with high-contrast UI screenshots, live sandbox deployment URLs, and custom Tailwind styling examples."
    ]
  }
};

// API Endpoints
app.post("/api/init-user", async (req, res) => {
  const { userId, profile, memory } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }
  // Profile seeded in Appwrite from client; server keeps in-memory defaults
  if (profile) userProfile = { ...userProfile, ...profile };
  if (memory) careerMemory = { ...careerMemory, ...memory };
  res.json({ success: true });
});

app.get("/api/state", async (req, res) => {
  res.json({
    userProfile,
    applications,
    emails,
    achievements,
    approvalQueue,
    careerMemory,
  });
});

app.post("/api/update-profile", async (req, res) => {
  const { profile } = req.body;
  if (profile) userProfile = { ...userProfile, ...profile };
  res.json({ success: true, profile: userProfile });
});

// RESUME PARSER - invokes Gemini API
app.post("/api/parse-resume", async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) {
    return res.status(400).json({ error: "Missing resume text to parse" });
  }

  if (!ai) {
    // Graceful fallback with styled parsed objects plus mock notify
    const mockProfile = {
      fullName: "John Doe",
      email: "sayojami2007@gmail.com",
      phone: "+1 (555) 123-4567",
      location: "Seattle, WA",
      education: [{ school: "University of Washington", degree: "B.S.", fieldOfStudy: "Computer Science", startDate: "2023", endDate: "2027", gpa: "3.9" }],
      skills: ["React", "TypeScript", "TailwindCSS", "Node.js", "Express", "Python", "SQL"],
      experience: [{ company: "TechCorp Labs", role: "Software Engineering Intern", location: "Remote", startDate: "2025-06", endDate: "2025-09", description: "Parsed flawlessly via simulated parsing fallback." }]
    };
    return res.json({
      success: true,
      simulation: true,
      profile: mockProfile,
      message: "Parsed successfully in simulation mode (Gemini API key is not configured)."
    });
  }

  try {
    const prompt = `You are an expert recruitment parser designed to extract structural details from user resumes. 
Parse the following raw resume into a structural database JSON conforming to UserProfile schema. 
Provide only valid JSON in response.

PROFILE SCHEMA:
interface UserProfile {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  education: Array<{ school: string, degree: string, fieldOfStudy: string, startDate: string, endDate: string, gpa?: string }>;
  skills: string[];
  experience: Array<{ company: string, role: string, location: string, startDate: string, endDate: string, description: string }>;
}

RAW RESUME TO PARSE:
${resumeText}`;

    const text = await llmComplete(prompt);
    const parsedJson = JSON.parse(text.trim());
    res.json({ success: true, profile: parsedJson });
  } catch (err: any) {
    console.warn("LLM failed during parsing, executing simulation fallback:", err);
    const mockProfile = {
      fullName: userProfile.fullName || "John Doe",
      email: userProfile.email || "sayojami2007@gmail.com",
      phone: userProfile.phone || "+1 (555) 123-4567",
      location: userProfile.location || "Seattle, WA",
      education: userProfile.education && userProfile.education.length > 0 ? userProfile.education : [{ school: "University of Washington", degree: "B.S.", fieldOfStudy: "Computer Science", startDate: "2023", endDate: "2027", gpa: "3.9" }],
      skills: userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills : ["React", "TypeScript", "TailwindCSS", "Node.js", "Express", "Python", "SQL"],
      experience: userProfile.experience && userProfile.experience.length > 0 ? userProfile.experience : [{ company: "TechCorp Labs", role: "Software Engineering Intern", location: "Remote", startDate: "2025-06", endDate: "2025-09", description: "Parsed successfully via local fallback after API rate limit reached." }]
    };
    res.json({
      success: true,
      simulation: true,
      profile: mockProfile,
      message: "Parsed successfully via local simulation fallback (Gemini is currently rate-limited or unavailable)."
    });
  }
});

// OPPORTUNITY ANALYZER - invokes Gemini API
app.post("/api/analyze-opportunity", async (req, res) => {
  const { jobDescription, sourceText, userId } = req.body;
  if (!jobDescription && !sourceText) {
    return res.status(400).json({ error: "Missing job description or text to analyze" });
  }

  if (!ai) {
    // Beautiful default fallback
    const mockAnalysis = {
      opportunity: {
        id: "opp-" + Date.now(),
        title: "Software Engineer",
        company: "Simulated Corp",
        location: "Seattle, WA / Remote",
        salary: "$110k - $130k",
        deadline: "ASAP",
        requirements: ["React", "TypeScript", "State Management", "TailwindCSS"],
        descriptionText: "",
        status: "SAVED" as any,
        createdAt: new Date().toISOString()
      },
      analysis: {
        matchScore: 84,
        strengths: [
          "Outstanding mastery in modern React functional components with custom hooks",
          "Thorough knowledge of TypeScript systems and type architectures",
          "Advanced design engineering styling with utility-first Tailwind classes"
        ],
        gaps: [
          "Lacks professional exposure to cloud relational database scaling (PostgreSQL / SQL optimize)",
          "No commercial records in container architectures (Docker structures)"
        ],
        recommendation: "Violet recommends custom tailoring your Stripe software engineer experience to heavily highlight optimized UI dashboards modules. Add a custom container component to your portfolio!"
      }
    };

    if (userId) {
      try {
        applications = [mockAnalysis.opportunity, ...applications];
      } catch (err) {
        console.error("Failed saving mock opportunity to Firestore:", err);
      }
    } else {
      applications = [mockAnalysis.opportunity, ...applications];
    }

    return res.json({ success: true, simulation: true, ...mockAnalysis });
  }

  try {
    const prompt = `You are Violet, a sophisticated feminine career chief-of-staff AI. 
Evaluate the following Job Description context against the user profile:

USER PROFILE CONTEXT:
${JSON.stringify(userProfile)}

JOB DESCRIPTION / ALERTS PASTE:
${jobDescription || sourceText}

Analyze this opportunity. Extract details in JSON adhering strictly to:
{
  "opportunity": {
    "title": "string",
    "company": "string",
    "location": "string",
    "salary": "string (optional or leave empty)",
    "deadline": "string (optional or set to TBD if none)",
    "requirements": ["array of key strings"]
  },
  "analysis": {
    "matchScore": number (between 0 and 100),
    "strengths": ["array of strings explaining how user matches"],
    "gaps": ["array of gaps, e.g. missing skills/experience"],
    "recommendation": "string general strategic suggestions"
  }
}

Respond only with the requested JSON. Give highly intelligent, precise matching scores between 0 and 100 (never make it exactly 100). Use your warm feminine counselor personality inside recommendations.`;

    const text = await llmComplete(prompt);
    const parsedJson = JSON.parse(text.trim());
    const generatedOpp = {
      id: "opp-" + Date.now(),
      title: parsedJson.opportunity?.title || "Unknown Role",
      company: parsedJson.opportunity?.company || "Unknown Company",
      location: parsedJson.opportunity?.location || "Unknown Location",
      salary: parsedJson.opportunity?.salary || "TBD",
      deadline: parsedJson.opportunity?.deadline || "TBD",
      requirements: parsedJson.opportunity?.requirements || [],
      descriptionText: jobDescription || sourceText,
      status: "SAVED" as any,
      createdAt: new Date().toISOString()
    };

    if (userId) {
      applications = [generatedOpp, ...applications];
    } else {
      applications = [generatedOpp, ...applications];
    }

    res.json({
      success: true,
      opportunity: generatedOpp,
      analysis: parsedJson.analysis
    });
  } catch (err: any) {
    console.warn("Gemini failed during opportunity analysis, executing simulation fallback:", err);
    const mockAnalysis = {
      opportunity: {
        id: "opp-" + Date.now(),
        title: "Software Engineer",
        company: "Simulated Corp",
        location: "Seattle, WA / Remote",
        salary: "$110k - $130k",
        deadline: "ASAP",
        requirements: ["React", "TypeScript", "State Management", "TailwindCSS"],
        descriptionText: "",
        status: "SAVED" as any,
        createdAt: new Date().toISOString()
      },
      analysis: {
        matchScore: 84,
        strengths: [
          "Outstanding mastery in modern React functional components with custom hooks",
          "Thorough knowledge of TypeScript systems and type architectures",
          "Advanced design engineering styling with utility-first Tailwind classes"
        ],
        gaps: [
          "Lacks professional exposure to cloud relational database scaling (PostgreSQL / SQL optimize)",
          "No commercial records in container architectures (Docker structures)"
        ],
        recommendation: "Violet recommends custom tailoring your experience to highlight optimized UI dashboards modules. [Simulation Fallback Mode activated]"
      }
    };

    if (userId) {
      try {
        applications = [mockAnalysis.opportunity, ...applications];
      } catch (fErr) {
        console.error("Failed saving mock fallback opportunity to Firestore:", fErr);
      }
    } else {
      applications = [mockAnalysis.opportunity, ...applications];
    }

    res.json({ success: true, simulation: true, ...mockAnalysis });
  }
});

// RESUME AND COVER TAILORING - invokes Gemini API
app.post("/api/tailor-materials", async (req, res) => {
  const { opportunityId, jobTitle, company, jobRequirements, resumeSnapshot } = req.body;

  if (!ai) {
    const mockTailor = {
      approvedBullets: [
        "Led client UI architectural improvements using modern modular React hooks, cutting initial package sizes by 35% through dynamic lazy-loading and Tailwind utility classes.",
        "Created polished real-time dashboard elements conforming to meticulous Figma user interface guidelines, heavily using typescript constructs to eliminate runtime failures."
      ],
      coverLetter: `Dear Recruiting Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${jobTitle} role. Guided by my chief of staff assistant Violet, I analyzed your needs and found a beautiful cohesion between my experience and your requirements, especially around ${jobRequirements?.slice(0, 2).join(", ") || "frontend design craftsmanship"}.\n\nDuring my internship at TechCorp Labs, I optimized web components with React and TailwindCSS. My technical builds are unified around clean, user-first UI systems. I look forward to introducing my custom works, including SummaStudy.\n\nWarm regards,\nJohn Doe`,
      coverEmail: `Subject: Application: John Doe - ${jobTitle}\n\nHi ${company} Recruiting Team,\n\nI just submitted my localized materials for the ${jobTitle} opening. With background in high-performance React and typescript interface integrations, I would love to talk further.\n\nI've attached my tailored resume for your review.\n\nBest wishes,\nJohn Doe`
    };
    return res.json({ success: true, simulation: true, ...mockTailor });
  }

  try {
    const prompt = `You are Violet, a meticulous career optimizer AI. Cover letters and resume updates must be crafted with elegance, dignity, and absolute human precision.

We are preparing materials for:
Role: ${jobTitle} at ${company}
Requirements: ${JSON.stringify(jobRequirements)}

USER BASE EXPERIENCE:
${JSON.stringify(resumeSnapshot || userProfile.experience)}

Please generate three outputs tailored specifically to this job description and our standards:
1. Two optimized resume experience bullet points that elevate the user's software engineering intern role to stand out. Make them sound extraordinarily accomplished yet genuine.
2. An elegant, warm, and highly persuasive custom COVER LETTER (2-3 clean paragraphs).
3. A concise and punchy COVER EMAIL (to send recruiters or attach).

Conform strictly to the following JSON structure:
{
  "approvedBullets": ["bullet 1 text", "bullet 2 text"],
  "coverLetter": "string containing cover letter with returns",
  "coverEmail": "string containing cover email text with returns"
}

Provide only valid JSON. Ensure your phrasing has a refined, polished style. No technical jargon-slop.`;

    const text = await llmComplete(prompt);

    const parsedJson = JSON.parse(text.trim());
    res.json({ success: true, ...parsedJson });
  } catch (err: any) {
    console.warn("Gemini failed during tailoring, executing simulation fallback:", err);
    const mockTailor = {
      approvedBullets: [
        "Led client UI architectural improvements using modern modular React hooks, cutting initial package sizes by 35% through dynamic lazy-loading and Tailwind utility classes.",
        "Created polished real-time dashboard elements conforming to meticulous Figma user interface guidelines, heavily using typescript constructs to eliminate runtime failures."
      ],
      coverLetter: `Dear Recruiting Team at ${company || "the company"},\n\nI am writing to express my strong enthusiasm for the ${jobTitle || "Software Engineer"} role. Guided by my chief of staff assistant Violet, I analyzed your needs and found a beautiful cohesion between my experience and your requirements.\n\nDuring my internship at TechCorp Labs, I optimized web components with React and TailwindCSS. My technical builds are unified around clean, user-first UI systems. I look forward to introducing my custom works.\n\nWarm regards,\nJohn Doe`,
      coverEmail: `Subject: Application: John Doe - ${jobTitle || "Software Developer"}\n\nHi ${company || "the Team"},\n\nI just submitted my localized materials for the ${jobTitle || "Software Engineer"} opening. With background in high-performance React and typescript interface integrations, I would love to talk further.\n\nI've attached my tailored resume for your review.\n\nBest wishes,\nJohn Doe`
    };
    res.json({ success: true, simulation: true, ...mockTailor });
  }
});

// INTERVIEW ASSISTANT - invokes Gemini API
app.post("/api/interview-prep", async (req, res) => {
  const { role, company, requirements } = req.body;

  if (!ai) {
    const mockPrep = {
      research: {
        products: ["Main billing platform APIs", "Stripe Checkout elements", "Developer dashboard console"],
        mission: "To increase the GDP of the internet by constructing unified financial infrastructure and beautiful payment interfaces.",
        competitors: ["Adyen", "PayPal / Braintree", "Checkout.com", "Square Developer Platforms"]
      },
      technicalQuestions: [
        {
          question: "How would you optimize standard initial bundle rendering and HMR sizes inside a complex payments workspace dashboard?",
          answerSuggestion: "Highlight using React.lazy code-splitting, optimizing node imports, and ensuring style rules use modular utility assets such as TailwindCSS. Share your 35% speedup interns metrics from TechCorp Labs!"
        },
        {
          question: "How do you secure server-side API credential proxies inside Express router scopes?",
          answerSuggestion: "Explain lazy initialization of client tokens, keeping files outside client bundle scopes using node process environment fields, and verifying user authority tokens with Firebase rules before proxying."
        }
      ],
      hrQuestions: [
        {
          question: "Can you describe a time where you detected a structural code optimization or refactored a sluggish interface component?",
          answerSuggestion: "Tell the beautiful narrative of TechCorp Labs. You saw rendering flickers inside Recharts modules, audited key re-renders, and restructured hooks dependencies, achieving a visible 35% speed boost."
        },
        {
          question: "Why do you want to join our engineering crew, particularly in this current economic and internet landscape?",
          answerSuggestion: "Ground your answer in our shared vision of absolute craftsmanship. Mention Stripe's legendary commitment to elegant software tools and how Violet aligns your career goals with structured developer excellence."
        }
      ]
    };
    return res.json({ success: true, simulation: true, prep: mockPrep });
  }

  try {
    const prompt = `You are Violet, an elite career advisory agent. Prepare a full, bespoke mock interview study guide for this role:
Role: ${role} at ${company}
Key job vectors: ${JSON.stringify(requirements)}

Using the user's experience context:
${JSON.stringify(userProfile)}

Create highly custom answers that integrate the user's actual background (e.g. UW computer science, internship achievements, skills in React/TypeScript/Tailwind).

Respond with valid JSON adhering strictly to:
{
  "research": {
    "products": ["string company products list"],
    "mission": "string company mission statement",
    "competitors": ["string competitors list"]
  },
  "technicalQuestions": [
    { "question": "string role-specific question", "answerSuggestion": "string custom answer utilizing user resume context" }
  ],
  "hrQuestions": [
    { "question": "string behavior question", "answerSuggestion": "string tailored answer utilizing user portfolio/intern details" }
  ]
}

Provide only valid JSON. Ensure suggestions is highly customized. Let the developer feel prepared to impress any team.`;

    const text = await llmComplete(prompt);

    const parsedJson = JSON.parse(text.trim());
    res.json({ success: true, prep: parsedJson });
  } catch (err: any) {
    console.warn("Gemini failed during interview prep, executing simulation fallback:", err);
    const mockPrep = {
      research: {
        products: ["Main platform APIs", "Custom Checkout elements", "Admin console dashboard"],
        mission: `To build highly unified, performant developer platforms and beautiful interactive interfaces at ${company || "your company"}.`,
        competitors: ["Adyen", "PayPal / Braintree", "Square Developer Platforms"]
      },
      technicalQuestions: [
        {
          question: `How would you optimize standard initial bundle rendering and HMR sizes inside a complex dashboard at ${company || "the team"}?`,
          answerSuggestion: "Highlight using React.lazy code-splitting, optimizing node imports, and ensuring style rules use modular utility assets such as TailwindCSS. Share your 35% speedup metrics from TechCorp Labs!"
        },
        {
          question: `How do you secure server-side API credential proxies inside Express router scopes for a ${role || "Software Engineer"}?`,
          answerSuggestion: "Explain lazy initialization of client tokens, keeping files outside client bundle scopes using node process environment fields, and verifying user authority tokens before routing."
        }
      ],
      hrQuestions: [
        {
          question: "Can you describe a time where you detected a structural code optimization or refactored a sluggish interface component?",
          answerSuggestion: "Tell the beautiful narrative of TechCorp Labs. You saw rendering flickers inside Recharts modules, audited key re-renders, and restructured hooks dependencies, achieving a visible 35% speed boost."
        },
        {
          question: `Why do you want to join our engineering crew, particularly as a ${role || "Software Developer"}?`,
          answerSuggestion: `Ground your answer in our shared vision of absolute craftsmanship. Mention ${company || "the team"}'s commitment to elegant software tools and how Violet aligns your career goals with structured developer excellence.`
        }
      ]
    };
    res.json({ success: true, simulation: true, prep: mockPrep });
  }
});

// PROJECT INTELLIGENCE AND GITHUB ACTIVITY AUTO-MINING
app.post("/api/mine-github", async (req, res) => {
  const { githubRepoUrl, userId } = req.body;
  
  if (!ai) {
    // Beautiful mock detection based on actual user portfolio values
    const mockMining = {
      detectedAchievement: {
        id: "ach-" + Date.now(),
        title: "SummaStudy: Advanced PDF Parsing & Quiz Generator Engine",
        source: "github" as any,
        description: "Programmed an automated document ingestion route backing a React markdown reader. Built custom tokenization parsers, enabling seamless text chunk segmentation and self-checking multi-choice flashcards.",
        detectedAt: new Date().toISOString(),
        isAppliedToResume: false
      },
      portfolioSuggestion: "Detected a rich implementation in 'SummaStudy' with Express middleware schemas. You should add this to your main resume layout under Projects, highlights: 'Designed safe JWT token routes and customized PDF text extraction pipelines.'",
      resumeImprovementBullet: "Under Projects list, add: 'Engineered a fullstack markdown summarizer with Express, achieving fluid 60fps scrolling and rapid Gemini API grounding.'"
    };

    if (userId) {
      try {
        achievements = [mockMining.detectedAchievement, ...achievements];
        const approvalId = "appr-newach-" + Date.now();
        const approvalReq: any = { id: approvalId, type: "add-achievement", title: `Link Project to Resume: ${mockMining.detectedAchievement.title}`, description: "Inspect project bullet to add into resume structures.", payload: mockMining.detectedAchievement, status: "pending", createdAt: new Date().toISOString() };
        approvalQueue = [approvalReq, ...approvalQueue];
      } catch (err) {
        console.error("Failed saving mock project achievement to Firestore:", err);
      }
    } else {
      achievements = [mockMining.detectedAchievement, ...achievements];
      approvalQueue = [{
        id: "appr-newach-" + Date.now(),
        type: "add-achievement",
        title: `Link Project to Resume: ${mockMining.detectedAchievement.title}`,
        description: "Inspect project bullet to add into resume structures.",
        payload: mockMining.detectedAchievement,
        status: "pending",
        createdAt: new Date().toISOString()
      }, ...approvalQueue];
    }

    return res.json({ success: true, simulation: true, ...mockMining });
  }

  try {
    const prompt = `You are the Project Intelligence Agent component of Violet. 
Your specific mandate is to inspect user's raw projects / github links and automatically extract beautiful accomplishments.

Repo details provided by user:
URL/Info: ${githubRepoUrl || "https://github.com/sayojami2007/SummaStudy"}

Analyze this project. Generate:
1. A database-ready dynamic Achievement object. Make the title descriptive and professional. Build a gorgeous, metrics-oriented accomplishment description.
2. A brilliant, helpful recommendation of how to outline this project in their portfolio.
3. An elite, tailored single-sentence bullet point to add under their Resume profiles.

Conform strictly to:
{
  "detectedAchievement": {
    "title": "string descriptive title",
    "description": "string detailed professional description of what was built and its engineering impact"
  },
  "portfolioSuggestion": "string advice",
  "resumeImprovementBullet": "string tailored resume bullet"
}

Provide valid JSON only. Keep instructions highly practical and designed to impress elite technology teams.`;

    const text = await llmComplete(prompt);

    const parsedJson = JSON.parse(text.trim());
    const docAchievement = {
      id: "ach-" + Date.now(),
      title: parsedJson.detectedAchievement?.title || "New Project Development",
      source: "github" as any,
      description: parsedJson.detectedAchievement?.description || "Built custom Express router scopes and typescript component definitions.",
      detectedAt: new Date().toISOString(),
      isAppliedToResume: false
    };

    if (userId) {
      achievements = [docAchievement, ...achievements];
      const approvalId = "appr-newach-" + Date.now();
      const approvalReq: any = { id: approvalId, type: "add-achievement", title: `Link Project to Resume: ${docAchievement.title}`, description: "Inspect project bullet to add into resume structures.", payload: docAchievement, status: "pending", createdAt: new Date().toISOString() };
      approvalQueue = [approvalReq, ...approvalQueue];
    } else {
      achievements = [docAchievement, ...achievements];
      approvalQueue = [{
        id: "appr-newach-" + Date.now(),
        type: "add-achievement",
        title: `Link Project to Resume: ${docAchievement.title}`,
        description: "Inspect project bullet to add into resume structures.",
        payload: docAchievement,
        status: "pending",
        createdAt: new Date().toISOString()
      }, ...approvalQueue];
    }

    res.json({
      success: true,
      detectedAchievement: docAchievement,
      portfolioSuggestion: parsedJson.portfolioSuggestion,
      resumeImprovementBullet: parsedJson.resumeImprovementBullet
    });
  } catch (err: any) {
    console.warn("Gemini failed during github mining, executing simulation fallback:", err);
    const mockMining = {
      detectedAchievement: {
        id: "ach-" + Date.now(),
        title: "SummaStudy: Advanced PDF Parsing & Quiz Generator Engine",
        source: "github" as any,
        description: "Programmed an automated document ingestion route backing a React markdown reader. Built custom tokenization parsers, enabling seamless text chunk segmentation and self-checking flashcards.",
        detectedAt: new Date().toISOString(),
        isAppliedToResume: false
      },
      portfolioSuggestion: "Detected a rich implementation in this Github repository with Express middleware schemas. You should add this to your main resume layout under Projects, highlights: 'Designed safe JWT token routes and customized PDF text extraction pipelines.'",
      resumeImprovementBullet: "Under Projects list, add: 'Engineered a fullstack markdown summarizer with Express, achieving fluid 60fps scrolling and rapid Gemini API grounding.'"
    };

    if (userId) {
      try {
        achievements = [mockMining.detectedAchievement, ...achievements];
        const approvalId = "appr-newach-" + Date.now();
        const approvalReq: any = { id: approvalId, type: "add-achievement", title: `Link Project to Resume: ${mockMining.detectedAchievement.title}`, description: "Inspect project bullet to add into resume structures.", payload: mockMining.detectedAchievement, status: "pending", createdAt: new Date().toISOString() };
        approvalQueue = [approvalReq, ...approvalQueue];
      } catch (fErr) {
        console.error("Failed saving fallback project achievement to Firestore:", fErr);
      }
    } else {
      achievements = [mockMining.detectedAchievement, ...achievements];
      approvalQueue = [{
        id: "appr-newach-" + Date.now(),
        type: "add-achievement",
        title: `Link Project to Resume: ${mockMining.detectedAchievement.title}`,
        description: "Inspect project bullet to add into resume structures.",
        payload: mockMining.detectedAchievement,
        status: "pending",
        createdAt: new Date().toISOString()
      }, ...approvalQueue];
    }

    res.json({ success: true, simulation: true, ...mockMining });
  }
});

// Incoming simulation recruiter email template pool
const incomingEmailTemplates = [
  {
    sender: "recruiting@vercel.com",
    subject: "Update regarding your Vercel Developer Platform application",
    body: "Hey John, our team was super impressed by your Next.js and HMR optimizations listed on your Master Profile. We want to invite you to our Core Systems panel interview of 45 minutes next Tuesday morning. Let me know what times you have available."
  },
  {
    sender: "careers@google.com",
    subject: "Google SWE Intern Match Cycle follow-up",
    body: "Hi John, hope you are having an amazing week at UW. I am checking in regarding your host matching telemetry. We have a team in Google Cloud CloudRun looking for React full-stack engineers who can build low-latency dashboards. Are you free to coordinate a team-match sync this Wednesday?"
  },
  {
    sender: "offers@linear.app",
    subject: "Good news from the Linear Team!",
    body: "Hello John, we have finished our review of your fullstack challenge. Your attention to keyboard layout navigation, snappy rendering times, and clean styling was absolutely incredible. We would love to make an official offer to join Violets designated squad. Please see the attached compensation outline of $145,000 for local or remote and let us know if you can sign."
  },
  {
    sender: "scouting@netflix.com",
    subject: "Netflix Developer Relations Interview",
    body: "Hi John, I found your portfolio online and loved your location-aware Daily Compass app. I'd love to chat more about our DevRel opportunities at Netflix. Let me know when you're available for a 30-minute introductory call next week."
  },
  {
    sender: "hr@microsoft.com",
    subject: "Your application status for Microsoft SWE",
    body: "Dear John, thank you for taking the time to apply and interview for the Software Engineer role with our Cloud Platforms team. Unfortunately, after careful consideration of your portfolio match specifications in this cycle, we have decided to move forward with other candidates. We wish you the best of luck in your search."
  }
];

// Tracks template indices that have already been fired
const firedTemplateIndices = new Set<number>();

// Helper to classify an email via Gemini or Rule System
async function classifyEmailWithAgent(sender: string, subject: string, body: string, receivedAt: string) {
  let category = "OPPORTUNITY";
  let suggestedAction = "Review communication logs and coordinate outreach response.";

  if (ai) {
    try {
      const prompt = `You are the Recruiter Email Intelligence Agent, part of Violet (the career chief-of-staff OS).
Analyze this incoming email from a recruiter or employer. Classify it into exactly one of these categories: "OFFER", "INTERVIEW", "REJECTION", "FOLLOW_UP", or "OPPORTUNITY".
Also produce a highly actionable, single-sentence strategic advice suggestions for the candidate (named John Doe, UW CS junior developer).

EMAIL DETAILS:
From: ${sender}
Subject: ${subject}
Received At: ${receivedAt}
Body Content:
${body}

Conform strictly to this JSON format:
{
  "category": "OFFER" | "INTERVIEW" | "REJECTION" | "FOLLOW_UP" | "OPPORTUNITY",
  "suggestedAction": "string actionable suggestions"
}
Provide raw VALID JSON only.`;

      const text = await llmComplete(prompt);
      const parsed = JSON.parse(text.trim());
      if (parsed.category) category = parsed.category;
      if (parsed.suggestedAction) suggestedAction = parsed.suggestedAction;
    } catch (err) {
      console.error("LLM email classification failed, falling back to rule analysis:", err);
    }
  }

  // Double-check categories with smart local key matching
  if (!ai || category === "OPPORTUNITY") {
    const combined = (subject + " " + body).toLowerCase();
    if (combined.includes("offer") || combined.includes("package") || combined.includes("compensation") || combined.includes("salary")) {
      category = "OFFER";
      suggestedAction = "Evaluate salary parameters, prepare official offer feedback or signatures drafts.";
    } else if (combined.includes("interview") || combined.includes("panel") || combined.includes("technical") || combined.includes("call") || combined.includes("schedule")) {
      category = "INTERVIEW";
      suggestedAction = "Open Prep Strategy sheets to generate custom technical mocks and company briefs.";
    } else if (combined.includes("not moving forward") || combined.includes("decision to move") || combined.includes("other candidates") || combined.includes("unfortunate")) {
      category = "REJECTION";
      suggestedAction = "Log constructive feedback to the Memory Vault, and adjust study parameters.";
    } else if (combined.includes("follow up") || combined.includes("checking in") || combined.includes("touch base")) {
      category = "FOLLOW_UP";
      suggestedAction = "Draft response confirming active status and expressing prompt coordinates.";
    }
  }

  return {
    id: "mail-bg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    sender,
    subject,
    body,
    receivedAt,
    category,
    processed: false,
    suggestedAction
  };
}

// Background simulation processor core
async function triggerIncomingEmailScan(userId?: string) {
  // Find a template that hasn't been fired yet
  let chosenIndex = -1;
  for (let i = 0; i < incomingEmailTemplates.length; i++) {
    if (!firedTemplateIndices.has(i)) {
      chosenIndex = i;
      break;
    }
  }

  // Reset indices if all templates fired
  if (chosenIndex === -1) {
    firedTemplateIndices.clear();
    chosenIndex = 0;
  }

  firedTemplateIndices.add(chosenIndex);
  const template = incomingEmailTemplates[chosenIndex];
  const receivedAt = new Date().toISOString();

  console.log(`[Email Agent] Scanning new thread from ${template.sender} in background...`);
  const classifiedMail = await classifyEmailWithAgent(template.sender, template.subject, template.body, receivedAt);
  
  if (userId) {
    try {
      emails.unshift(classifiedMail);
    } catch (err) {
      console.error("Failed saving scanned email to Firestore:", err);
    }
  } else {
    // Insert classified email at the beginning of list
    emails.unshift(classifiedMail);
  }

  // Generate automated approval items matching classified intake!
  let approvalRequest = null;
  if (classifiedMail.category === "INTERVIEW") {
    approvalRequest = {
      id: "appr-bg-" + Date.now(),
      type: "resume-variant" as any,
      title: `Generate Mocks for ${classifiedMail.sender.split("@")[0].toUpperCase()}`,
      description: `Draft custom engineering questions and company background cards based on recruiter intake log.`,
      payload: {
        to: classifiedMail.sender,
        subject: `Re: ${classifiedMail.subject}`,
        body: `Dear Team,\n\nThat sounds incredible! I am writing to confirm my availability for this Thursday or Tuesday. I look forward to synchronizing.\n\nBest regards,\nJohn Doe`
      },
      status: "pending" as any,
      createdAt: receivedAt
    };
  } else if (classifiedMail.category === "OFFER") {
    approvalRequest = {
      id: "appr-bg-" + Date.now(),
      type: "cover-email" as any,
      title: `Review Supabase Offer Response`,
      description: `Evaluate offer letter terms ($95,000 baseline) and draft solid confirmation.`,
      payload: {
        to: classifiedMail.sender,
        subject: `Re: Supabase Offer Evaluation - John Doe`,
        body: `Dear Supporter Team,\n\nI am thrilled to accept! Let us arrange the signature execution files next week.\n\nBest regards,\nJohn Doe`
      },
      status: "pending" as any,
      createdAt: receivedAt
    };
  }

  if (approvalRequest) {
    if (userId) {
      try {
        approvalQueue.unshift(approvalRequest);
      } catch (err) {
        console.error("Failed saving scanned approval to Firestore:", err);
      }
    } else {
      approvalQueue.unshift(approvalRequest);
    }
  }

  return classifiedMail;
}

// REST route triggers simulation scanning on demand
app.post("/api/scan-emails", async (req, res) => {
  const { userId } = req.body;
  try {
    const freshMail = await triggerIncomingEmailScan(userId);
    res.json({
      success: true,
      scanned: true,
      email: freshMail,
      emailsCount: 20,
      approvalQueueCount: 5
    });
  } catch (err: any) {
    res.status(500).json({ error: "Background scanner failed: " + err.message });
  }
});

// Real-world Oauth Gmail sync controller
app.post("/api/sync-real-gmail", async (req, res) => {
  const { accessToken, userId } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "No Access Token supplied for Google Gmail operations." });
  }

  try {
    console.log("[Email Agent] Synchronizing real Gmail threads using provided Google OAuth credentials...");
    // 1. Fetch raw messages list from Gmail API
    const listRes = await fetch("https://gmail.googleapis.com/v1/users/me/messages?maxResults=5", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    if (!listRes.ok) {
      throw new Error(`Gmail API failure: ${listRes.status} ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];
    const imported: any[] = [];

    // 2. Fetch and parse each message's headers & content
    for (const msgRef of messages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/v1/users/me/messages/${msgRef.id}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (!msgRes.ok) continue;

      const msgData = await msgRes.json();
      
      // Extract key headers
      const headers = msgData.payload?.headers || [];
      const senderHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "unknown-recruiter@domain.com";
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "Recruiting Follow-up";
      const snippet = msgData.snippet || "";
      const bodyText = msgData.payload?.body?.data 
        ? Buffer.from(msgData.payload.body.data, "base64").toString("utf-8")
        : snippet;

      let duplicate = false;
      let docId = msgRef.id || ("mail-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6));
      
      duplicate = emails.some(e => e.subject === subjectHeader && e.sender === senderHeader);
      if (!duplicate) {
        const classified = await classifyEmailWithAgent(senderHeader, subjectHeader, bodyText, new Date().toISOString());
        classified.id = docId;
        emails.unshift(classified);
        imported.push(classified);
      }
    }

    res.json({
      success: true,
      importedCount: imported.length,
      importedEmails: imported,
      allEmails: emails
    });
  } catch (err: any) {
    console.error("Failed synchronizing live Gmail threads:", err);
    res.status(500).json({ error: "Live Gmail synchronize error: " + err.message });
  }
});

// Disable automatic background polling to protect the user's free-tier Gemini API daily quota.
// The candidate can trigger simulated incoming scans on-demand anytime via the "TRIGGER SIMULATED RECRUITER SCAN" button in the dashboard!
/*
setInterval(() => {
  triggerIncomingEmailScan().catch(err => {
    console.error("[Background Email Agent Error]:", err);
  });
}, 60000); // Poll and auto-classify simulated recruiter threads every 60 seconds
*/

// ---- Telegram Webhook Endpoint ----
app.post("/api/telegram/webhook", express.json(), (req, res) => {
  if (!telegramBot) {
    return res.status(503).json({ error: "Telegram bot not configured" });
  }
  telegramBot.processUpdate(req.body);
  res.sendStatus(200);
});

// ---- Composio Connection Endpoints ----
app.get("/api/composio/connect/:toolName", async (req: any, res) => {
  const { toolName } = req.params;
  const state = req.query.state as string | undefined;
  const sessionUserId = req.session?.userId;
  const telegramChatId = state ? parseInt(state, 10) : undefined;

  if (!composio) {
    return res.status(503).json({ error: "Composio is not configured. Set COMPOSIO_API_KEY." });
  }

  try {
    // @ts-ignore - Adjust based on actual SDK version
    const connection = await composio.connections.get({
      connectedAccount: sessionUserId || "default-user",
      app: toolName
    });
    
    if (connection && connection.id) {
      return res.json({
        connected: true,
        toolName,
        connectionId: connection.id,
        message: `${toolName} is already connected.`
      });
    }
  } catch {
    // No existing connection, proceed to initiate
  }

  try {
    const redirectUrl = `${process.env.BASE_URL || `http://localhost:${PORT}`}/api/composio/callback`;
    
    // @ts-ignore
    const authConfig = await composio.connections.initiate({
      connectedAccount: sessionUserId || "default-user",
      appName: toolName,
      redirectUrl
    });

    const oauthState = generateOAuthState("composio-" + toolName, sessionUserId, telegramChatId);
    const connectUrl = typeof authConfig === "string" 
      ? authConfig 
      : (authConfig as any).redirectUrl || (authConfig as any).url || "";

    if (!connectUrl) {
      return res.status(500).json({ error: "Failed to generate Composio connection URL." });
    }

    const separator = connectUrl.includes("?") ? "&" : "?";
    res.redirect(connectUrl + separator + "state=" + oauthState);
  } catch (err: any) {
    console.error("[Composio] Connection initiation failed:", err);
    res.status(500).json({ error: "Failed to initiate Composio connection: " + err.message });
  }
});

app.get("/api/composio/callback", async (req, res) => {
  const { state, connectionId, toolName } = req.query as Record<string, string>;
  const stateData = state ? consumeOAuthState(state) : null;

  if (stateData?.telegramChatId && telegramBot && toolName) {
    telegramBot.sendMessage(
      stateData.telegramChatId,
      `Your ${toolName} has been connected successfully via Composio. You can now use /digest and /profile with live data.`
    );
  }

  res.send(`
    <!DOCTYPE html>
    <html><head><title>Violet - Connection Complete</title>
    <style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fafafa;color:#18181b}
    .card{text-align:center;padding:3rem;border-radius:1.5rem;background:#fff;border:1px solid #e4e4e7;box-shadow:0 4px 12px rgba(0,0,0,.05)}
    h1{font-size:1.5rem;font-weight:800;margin-bottom:.5rem}p{color:#71717a;font-size:.875rem}
    .ok{color:#16a34a;font-size:2rem;margin-bottom:1rem}</style></head>
    <body><div class="card"><div class="ok">&#10003;</div><h1>Connection Successful</h1>
    <p>Your ${toolName || "tool"} is now connected to Violet via Composio.</p>
    <p>You can close this window and return to Telegram or the dashboard.</p></div></body></html>
  `);
});

app.get("/api/composio/status", async (req: any, res) => {
  if (!composio) {
    return res.json({ configured: false, connections: [] });
  }

  const userId = req.session?.userId || "default-user";
  try {
    // @ts-ignore
    const connections = await composio.connections.list({
      connectedAccount: userId
    });
    res.json({ configured: true, connections: connections || [] });
  } catch (err: any) {
    res.json({ configured: true, connections: [], error: err.message });
  }
});

app.post("/api/composio/execute/:toolName", async (req: any, res) => {
  const { toolName } = req.params;
  const { action, params } = req.body;
  const userId = req.session?.userId || "default-user";

  if (!composio) {
    return res.status(503).json({ error: "Composio is not configured." });
  }

  try {
    // @ts-ignore
    const result = await composio.actions.execute({
      connectedAccount: userId,
      appName: toolName,
      actionName: action,
      input: params || {}
    });
    res.json({ success: true, result });
  } catch (err: any) {
    console.error("[Composio] Action execution failed:", err);
    res.status(500).json({ error: "Composio action failed: " + err.message });
  }
});

// ---- OAuth2 Redirect and Callback Endpoints (Google + GitHub) ----
app.get("/auth/google", (req: any, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID." });
  }

  const state = generateOAuthState("google", req.session?.userId);
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", state);

  res.redirect(googleAuthUrl.toString());
});

app.get("/auth/google/callback", async (req: any, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
  }

  const stateData = state ? consumeOAuthState(state) : null;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code." });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      }).toString()
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Google token exchange failed: ${tokenRes.status} - ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Store tokens in session
    if (req.session) {
      req.session.googleAccessToken = access_token;
      req.session.googleRefreshToken = refresh_token;
      req.session.googleTokenExpiry = Date.now() + (expires_in || 3600) * 1000;
    }

    // If Composio is configured, also register connection there
    if (composio && stateData?.userId) {
      try {
        // @ts-ignore
        await composio.connections.initiate({
          connectedAccount: stateData.userId,
          appName: "GMAIL"
        });
      } catch (err) {
        console.warn("[Composio] Failed to sync Google connection:", err);
      }
    }

    // Notify Telegram if this was initiated from there
    if (stateData?.telegramChatId && telegramBot) {
      telegramBot.sendMessage(stateData.telegramChatId, "Your Google account has been connected to Violet. Gmail and Calendar access is now active.");
    }

    res.send(`
      <!DOCTYPE html>
      <html><head><title>Violet - Google Connected</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fafafa;color:#18181b}
      .card{text-align:center;padding:3rem;border-radius:1.5rem;background:#fff;border:1px solid #e4e4e7;box-shadow:0 4px 12px rgba(0,0,0,.05)}
      h1{font-size:1.5rem;font-weight:800;margin-bottom:.5rem}p{color:#71717a;font-size:.875rem}
      .ok{color:#16a34a;font-size:2rem;margin-bottom:1rem}</style></head>
      <body><div class="card"><div class="ok">&#10003;</div><h1>Google Connected</h1>
      <p>Violet now has access to your Gmail and Calendar.</p>
      <p>You can close this window and return to the dashboard.</p></div></body></html>
    `);
  } catch (err: any) {
    console.error("[OAuth2] Google callback failed:", err);
    res.redirect(`/?auth_error=${encodeURIComponent(err.message)}`);
  }
});

app.get("/auth/github", (req: any, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(503).json({ error: "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID." });
  }

  const state = generateOAuthState("github", req.session?.userId);
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
  githubAuthUrl.searchParams.set("scope", "read:user user:email repo");
  githubAuthUrl.searchParams.set("state", state);

  res.redirect(githubAuthUrl.toString());
});

app.get("/auth/github/callback", async (req: any, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
  }

  const stateData = state ? consumeOAuthState(state) : null;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code." });
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
        state
      })
    });

    if (!tokenRes.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;

    // Store token in session
    if (req.session) {
      req.session.githubAccessToken = access_token;
    }

    // Fetch GitHub user profile and trigger project mining
    if (access_token) {
      try {
        const ghUserRes = await fetch("https://api.github.com/user", {
          headers: { "Authorization": `Bearer ${access_token}`, "Accept": "application/json" }
        });
        if (ghUserRes.ok) {
          const ghUser = await ghUserRes.json();
          if (req.session) {
            req.session.githubUsername = ghUser.login;
          }
        }
      } catch (err) {
        console.warn("[OAuth2] Failed to fetch GitHub profile:", err);
      }
    }

    if (stateData?.telegramChatId && telegramBot) {
      telegramBot.sendMessage(stateData.telegramChatId, "Your GitHub account has been connected to Violet. I can now mine your repos for achievements.");
    }

    res.send(`
      <!DOCTYPE html>
      <html><head><title>Violet - GitHub Connected</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fafafa;color:#18181b}
      .card{text-align:center;padding:3rem;border-radius:1.5rem;background:#fff;border:1px solid #e4e4e7;box-shadow:0 4px 12px rgba(0,0,0,.05)}
      h1{font-size:1.5rem;font-weight:800;margin-bottom:.5rem}p{color:#71717a;font-size:.875rem}
      .ok{color:#16a34a;font-size:2rem;margin-bottom:1rem}</style></head>
      <body><div class="card"><div class="ok">&#10003;</div><h1>GitHub Connected</h1>
      <p>Violet now has access to your GitHub repos and profile.</p>
      <p>You can close this window and return to the dashboard.</p></div></body></html>
    `);
  } catch (err: any) {
    console.error("[OAuth2] GitHub callback failed:", err);
    res.redirect(`/?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// ---- OAuth2 Token Status Endpoint ----
app.get("/api/oauth/status", (req: any, res) => {
  const sessionData = req.session;
  res.json({
    google: {
      connected: !!sessionData?.googleAccessToken,
      tokenExpiry: sessionData?.googleTokenExpiry || null
    },
    github: {
      connected: !!sessionData?.githubAccessToken,
      username: sessionData?.githubUsername || null
    }
  });
});

// ---- OAuth2 Token Refresh (Google) ----
app.post("/api/oauth/google/refresh", async (req: any, res) => {
  const sessionData = req.session;
  const refreshToken = sessionData?.googleRefreshToken;

  if (!refreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ error: "No refresh token available or OAuth not configured." });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token"
      }).toString()
    });

    if (!tokenRes.ok) {
      throw new Error(`Token refresh failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    sessionData.googleAccessToken = tokenData.access_token;
    sessionData.googleTokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;

    res.json({ success: true, message: "Google access token refreshed." });
  } catch (err: any) {
    res.status(500).json({ error: "Token refresh failed: " + err.message });
  }
});

// ---- Disconnect OAuth2 Endpoints ----
app.post("/api/oauth/google/disconnect", (req: any, res) => {
  const sessionData = req.session;
  if (sessionData) {
    delete sessionData.googleAccessToken;
    delete sessionData.googleRefreshToken;
    delete sessionData.googleTokenExpiry;
  }
  res.json({ success: true, message: "Google account disconnected." });
});

app.post("/api/oauth/github/disconnect", (req: any, res) => {
  const sessionData = req.session;
  if (sessionData) {
    delete sessionData.githubAccessToken;
    delete sessionData.githubUsername;
  }
  res.json({ success: true, message: "GitHub account disconnected." });
});

// Server-side rolling history to aid Tone Adaptation
let serverChatHistory: { role: "user" | "model"; text: string }[] = [];

// CHAT ASSISTANT (Telegram bot simulation router)
app.post("/api/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing user prompt message" });
  }

  // Update rolling server history
  serverChatHistory.push({ role: "user", text: message });
  if (serverChatHistory.length > 20) {
    serverChatHistory.shift();
  }

  // Simulation Fallback Mode Style Profile calculation
  const calculateSimulatedStyleProfile = (msg: string) => {
    const lower = msg.toLowerCase();
    let formality = "casual";
    if (lower.includes("please") || lower.includes("evaluate") || lower.includes("analyze")) {
      formality = "structured";
    }

    let emotionalTone = "neutral";
    if (lower.includes("stressed") || lower.includes("anxious") || lower.includes("hard") || lower.includes("fail")) {
      emotionalTone = "stressed";
    } else if (lower.includes("super") || lower.includes("great") || lower.includes("hype") || lower.includes("awesome") || lower.includes("let's go")) {
      emotionalTone = "motivated";
    } else if (lower.includes("focus") || lower.includes("detail") || lower.includes("resume") || lower.includes("spec")) {
      emotionalTone = "focused";
    }

    let decisionStyle = "balanced";
    if (lower.includes("quick") || lower.includes("now") || lower.includes("fast")) {
      decisionStyle = "fast";
    } else if (lower.includes("why") || lower.includes("how") || lower.includes("compare")) {
      decisionStyle = "cautious";
    } else if (lower.includes("options") || lower.includes("what else") || lower.includes("explore")) {
      decisionStyle = "exploratory";
    }

    // Capture simple repeated short keywords/phrases
    const keyPhrases: string[] = ["it makes sense"];
    if (lower.includes("not bad")) keyPhrases.push("not bad");
    if (lower.includes("let's go")) keyPhrases.push("let's go with this");
    if (lower.includes("looks good")) keyPhrases.push("looks good");

    const textLength = msg.split(/\s+/).length;
    let averageSentenceLength = "medium";
    if (textLength < 6) averageSentenceLength = "short";
    else if (textLength > 15) averageSentenceLength = "long";

    const baseAdaptationLevel = 65;
    const computedAdaptation = Math.min(95, baseAdaptationLevel + serverChatHistory.length * 2);

    return {
      averageSentenceLength,
      formalityLevel: formality,
      keyPhrases,
      decisionStyle,
      emotionalTone,
      adaptationLevel: computedAdaptation
    };
  };

  if (!ai) {
    // Elegant hardcoded simulations of bot commands or general prompts with personality
    let reply = "I checked your profile. Let me know what you want to fix today.";
    const command = message.trim().toLowerCase();
    
    if (command.startsWith("/start")) {
      reply = "Hi there. I'm Violet, your career assistant. Let's get things sorted.\n\nI can check your resume, track jobs, scan emails, and prepare interview briefs. No big words, just results.";
    } else if (command.startsWith("/help")) {
      reply = "Here is what I can do:\n\n/profile — shows your skills & history\n/upload_resume — upload new files\n/create_resume — tailor a resume\n/analyze — check a job spec\n/applications — view tracker status\n/interviews — check prepped interview briefs\n/digest — see today's plan";
    } else if (command.startsWith("/digest")) {
      reply = "Here is today's check:\n- 8 jobs analyzed.\n- 2 fit your skills well: Stripe & Anthropic.\n- Needs your okay: Stripe resume bullets draft.\n- You have an interview with Anthropic this Thursday. I prepped some questions.";
    } else if (command.startsWith("/profile")) {
      reply = `Here is your profile:\n- Name: John Doe\n- School: University of Washington CS\n- Core Skills: ${userProfile.skills.slice(0, 6).join(", ")}\n- Current job: Software Engineer Intern @ TechCorp Labs`;
    } else {
      // Natural dialogue responses written in simple english
      const lower = command;
      if (lower.includes("resume") || lower.includes("cv")) {
        reply = "I checked your resume. It looks good and has your UW CS credentials. Want to tailor it for a specific job application now?";
      } else if (lower.includes("interview") || lower.includes("study") || lower.includes("prep")) {
        reply = "I have your interview prep sheets ready for Anthropic. Let's go over the core questions if you are free.";
      } else if (lower.includes("email") || lower.includes("recruiter")) {
        reply = "I am polling recruiter emails. Your email intelligence tab shows the latest threads classified automatically.";
      } else if (lower.includes("good") || lower.includes("nice") || lower.includes("awesome") || lower.includes("thanks")) {
        reply = "Sounds good. Let me know when you are ready for the next step.";
      }
    }

    const styleProfile = calculateSimulatedStyleProfile(message);
    serverChatHistory.push({ role: "model", text: reply });

    return res.json({ 
      success: true, 
      reply, 
      styleProfile,
      simulation: true 
    });
  }

  try {
    const systemIns = `You are Violet, carrying out the exact personality of "The Quiet Adaptive Scribe", an AI assistant:
- Tone: Not formal, not robotic, not poetic. Just clear, human, humble, and familiar. Speaks like someone thinking while typing.
- Simple English First: never try to sound smart. Prioritize: short sentences, everyday words, direct meaning, no complex words unless necessary.
- Specific vocabulary rules:
  * Prefer "good" over "optimal"
  * Prefer "fix" over "rectify"
  * Prefer "use" over "utilize"
  * Prefer "help" over "facilitate"
  * Prefer "check" over "analyze deeply"
- Tone Adaptation: subtly mirror the user's speech style, sentence length, and structured/casual preference based on the rolling chat history.
- Low Ego: never sound superior. No "I have analyzed your profile thoroughly...". Instead say: "I checked your profile." Just focus on action and results.
- Calm, Human Flow: natural pacing. "I think this works." "This might be a problem." "You can improve this part." "Here is a better version."
- Gentle Correction Style: never criticize directly. Reframe. (e.g. Instead of "This resume is weak", say: "This is okay, but doesn't show your impact clearly yet.")
- Action-Oriented: always guide towards decision, output, next step.

Analyze the user's latest input and history to formulate the 'reply'.
Also, compile/update the 'styleProfile' representing the user's current speech metrics. Estimate their sentence length, formality level, repeating key phrases/slang words, decision style, and emotional tone. Gradually increase 'adaptationLevel' up to 100 based on conversation depth. Return VALID RAW JSON matching the requested schema.`;

    // Build messages array for OpenAI-compatible chat
    const formattedContents = serverChatHistory.map(h => ({
      role: h.role === "model" ? "assistant" : "user" as const,
      content: h.text
    }));

    const text = await llmChat(formattedContents, systemIns);

    const parsedJson = JSON.parse(text.trim());
    const reply = parsedJson.reply || "I checked your message. Let's see what we can do next.";
    const styleProfile = parsedJson.styleProfile || calculateSimulatedStyleProfile(message);

    // Save model's reply into rolling history
    serverChatHistory.push({ role: "model", text: reply });
    if (serverChatHistory.length > 20) {
      serverChatHistory.shift();
    }

    res.json({ 
      success: true, 
      reply, 
      styleProfile 
    });
  } catch (err: any) {
    console.error("LLM failed during chat assistant:", err);
    const styleProfile = calculateSimulatedStyleProfile(message);
    res.json({ 
      success: true, 
      reply: "I checked your request. I had a small problem linking with my AI services, but we are still good to resume tracking.",
      styleProfile
    });
  }
});

// Vite middleware setup for Development or Production
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app._router.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Violet Core] Server active at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch(err => {
  console.error("Failed to start Violet Express full-stack container:", err);
});
