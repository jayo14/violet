import React from "react";
import { 
  Sparkles, CheckCircle2, ChevronRight, RefreshCw, FileText, 
  Mail, Download, Check, X, AlertCircle, Bookmark, Clipboard, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Opportunity, OpportunityAnalysis } from "../types";

interface ResumeTailorProps {
  selectedOpportunity: Opportunity | null;
  analysisContext: OpportunityAnalysis | null;
  onGenerateTailored: (opp: Opportunity) => Promise<{ approvedBullets: string[], coverLetter: string, coverEmail: string }>;
  onCreateApproval: (type: "resume-variant" | "cover-letter" | "cover-email", title: string, description: string, payload: any) => void;
  applications: Opportunity[];
}

interface CoTStep {
  id: string;
  label: string;
  status: "idle" | "running" | "done";
}

export default function ResumeTailor({
  selectedOpportunity,
  analysisContext,
  onGenerateTailored,
  onCreateApproval,
  applications
}: ResumeTailorProps) {
  const [opp, setOpp] = React.useState<Opportunity | null>(selectedOpportunity);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [activeStepId, setActiveStepId] = React.useState<string | null>(null);

  const [cotSteps, setCotSteps] = React.useState<CoTStep[]>([
    { id: "read", label: "Reading Base Master Resume", status: "idle" },
    { id: "analyze", label: "Analyzing Target Job Requirements", status: "idle" },
    { id: "match", label: "Matching Professional Experience Blocks", status: "idle" },
    { id: "optimize", label: "Optimizing Achievement Bullet Points", status: "idle" },
    { id: "pdf", label: "Generating Tailored Output Blueprint & PDF", status: "idle" }
  ]);

  const [tailorResult, setTailorResult] = React.useState<{
    approvedBullets: string[];
    coverLetter: string;
    coverEmail: string;
  } | null>(null);

  const [emailCopied, setEmailCopied] = React.useState(false);
  const [letterCopied, setLetterCopied] = React.useState(false);

  React.useEffect(() => {
    if (selectedOpportunity) {
      setOpp(selectedOpportunity);
    }
  }, [selectedOpportunity]);

  const handleRunTailoring = async () => {
    if (!opp) return;
    setIsGenerating(true);
    setTailorResult(null);

    // Initial steps state
    setCotSteps(steps => steps.map(s => ({ ...s, status: "idle" })));

    // Step 1
    updateStep("read", "running");
    await sleep(1500);
    updateStep("read", "done");

    // Step 2
    updateStep("analyze", "running");
    await sleep(1500);
    updateStep("analyze", "done");

    // Step 3
    updateStep("match", "running");
    await sleep(1500);
    updateStep("match", "done");

    // Step 4
    updateStep("optimize", "running");
    await sleep(1500);
    updateStep("optimize", "done");

    // Step 5
    updateStep("pdf", "running");

    try {
      const response = await onGenerateTailored(opp);
      updateStep("pdf", "done");
      await sleep(400);
      setTailorResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStep = (id: string, status: "idle" | "running" | "done") => {
    setCotSteps(steps => steps.map(s => s.id === id ? { ...s, status } : s));
    if (status === "running") {
      setActiveStepId(id);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Trigger safety approval creation on user action
  const handleRequestApproval = (type: "resume-variant" | "cover-letter" | "cover-email") => {
    if (!tailorResult || !opp) return;
    
    if (type === "resume-variant") {
      onCreateApproval(
        "resume-variant",
        `Tailored Bullets for ${opp.company}`,
        `Refine TechCorp Labs internship bullets to focus heavily on ${opp.title} requirements.`,
        {
          originalBullet: "Implemented a rich web application dashboard using React and Recharts. Improved loading speed.",
          tailoredBullet: tailorResult.approvedBullets[0]
        }
      );
    } else if (type === "cover-letter") {
      onCreateApproval(
        "cover-letter",
        `Cover Letter for ${opp.company}`,
        `Custom drafted recruitment application letter targeting ${opp.title}.`,
        { body: tailorResult.coverLetter }
      );
    } else if (type === "cover-email") {
      onCreateApproval(
        "cover-email",
        `Cover Email for ${opp.company}`,
        `Cold referral callback note regarding ${opp.title}.`,
        {
          to: `recruiting@${opp.company.toLowerCase().replace(/\s/g, "")}.com`,
          subject: `Inquiry: John Doe - ${opp.title}`,
          body: tailorResult.coverEmail
        }
      );
    }
  };

  const handleCopy = (text: string, type: "email" | "letter") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } else {
      letterCopied;
      setLetterCopied(true);
      setTimeout(() => setLetterCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" /> Material Tailoring Engine
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Synchronize resume variants and generate premium custom letters based on specified role criteria.
          </p>
        </div>

        {/* Opportunity picker */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={opp?.id || ""}
            onChange={(e) => {
              const selected = applications.find(a => a.id === e.target.value);
              if (selected) setOpp(selected);
            }}
            className="text-xs p-2.5 border border-gray-250 bg-white rounded-xl focus:border-violet-500 font-semibold"
          >
            <option value="" disabled>Select an Application...</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company} — {app.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Selected Job Summary / Chain of Thought */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl space-y-4">
            <div>
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                Active Context Target
              </span>
              {opp ? (
                <div className="p-4 bg-gray-50 border rounded-xl space-y-1">
                  <h4 className="text-sm font-bold text-gray-800">{opp.title}</h4>
                  <p className="text-xs text-gray-500">{opp.company} • {opp.location}</p>
                  <p className="text-[11px] text-gray-400 mt-2 truncate leading-relaxed">
                    {opp.descriptionText || "Requirements: " + opp.requirements.join(", ")}
                  </p>
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed rounded-xl text-xs text-gray-400">
                  Select a job target using top selector to commence tailoring
                </div>
              )}
            </div>

            {opp && (
              <button
                onClick={handleRunTailoring}
                disabled={isGenerating}
                className="w-full p-2.5 bg-violet-600 hover:bg-violet-750 disabled:bg-gray-100 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? "Violet Tailoring..." : "🔥 Commence Tailoring Pipeline"}
              </button>
            )}

            {/* Loading sequence details */}
            {isGenerating && (
              <div className="pt-3 border-t space-y-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Violet Tailoring Pipeline
                </span>
                {cotSteps.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-1.5 px-2 bg-gray-50/50 rounded-lg">
                    <span className="text-gray-600 font-medium">{s.label}</span>
                    {s.status === "done" && (
                      <span className="p-0.5 bg-green-100 rounded-full text-green-600"><Check className="w-3.5 h-3.5" /></span>
                    )}
                    {s.status === "running" && (
                      <span className="w-3.5 h-3.5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    {s.status === "idle" && (
                      <span className="w-3.5 h-3.5 border border-gray-200 rounded-full"></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Results & Custom Approvals UI */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!opp && (
              <div className="p-10 text-center bg-gray-50 border border-dashed rounded-2xl flex flex-col items-center justify-center h-full min-h-[350px]">
                <FileText className="w-12 h-12 text-gray-300 stroke-1" />
                <h3 className="text-sm font-bold text-gray-800 mt-4">Commence Professional tailoring</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Choose your target opportunity, and run Violet's optimizing algorithms to generate premium letters and resume variant bullets.
                </p>
              </div>
            )}

            {opp && !isGenerating && !tailorResult && (
              <div className="p-10 text-center bg-gray-50 border border-dashed rounded-2xl flex flex-col items-center justify-center h-full min-h-[350px]">
                <Sparkles className="w-10 h-10 text-violet-300 animate-pulse" />
                <h3 className="text-sm font-bold text-gray-800 mt-4">Pipeline Ready</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Press 'Commence Tailoring Pipeline' to begin. Violet will run our 5-step analysis loop and display tailored output blocks here.
                </p>
              </div>
            )}

            {tailorResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Variant bullets */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        📂 Tailored Resume Experience Bullet
                      </h3>
                      <p className="text-[10px] text-gray-400">Refined for {opp?.company} recruitment criteria</p>
                    </div>
                    <button
                      onClick={() => handleRequestApproval("resume-variant")}
                      className="p-1 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Send to Approval Queue
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-gray-50 border rounded-xl">
                      <span className="text-[10px] font-bold text-gray-450 uppercase block mb-1">Proposed Bullet Point:</span>
                      <p className="text-xs text-gray-700 leading-relaxed font-sans mt-0.5">
                        {tailorResult.approvedBullets[0]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cover letter */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        📝 Meticulous Custom Cover Letter
                      </h3>
                      <p className="text-[10px] text-gray-400">Prepared on behalf of {opp?.company}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(tailorResult.coverLetter, "letter")}
                        className="p-1 px-2.5 bg-white border text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {letterCopied ? "Copied!" : <Clipboard className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRequestApproval("cover-letter")}
                        className="p-1 px-3 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Draft
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border rounded-xl text-xs font-sans text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {tailorResult.coverLetter}
                  </div>
                </div>

                {/* Cover Email */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        ✉️ Concise Cover / Referral Email
                      </h3>
                      <p className="text-[10px] text-gray-400">Direct Recruiter Outreach block</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(tailorResult.coverEmail, "email")}
                        className="p-1 px-2.5 bg-white border text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {emailCopied ? "Copied!" : <Clipboard className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRequestApproval("cover-email")}
                        className="p-1 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Queue Outreach
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border rounded-xl text-xs font-sans text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {tailorResult.coverEmail}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
