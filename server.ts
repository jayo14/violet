import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Generic LLM client - compatible with OpenRouter, Nvidia NIM, and any OpenAI-compatible API
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "meta-llama/llama-3.3-8b-instruct:free";

const ai = LLM_API_KEY ? true : false;

if (!LLM_API_KEY) {
  console.warn("LLM_API_KEY is not set, running in simulation fallback mode.");
}

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
