import React from "react";
import { 
  TrendingUp, CheckCircle, Calendar, Mail, Compass, Award, 
  ArrowRight, ShieldAlert, Cpu, Check, X, FileText, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Opportunity, EmailIntel, Achievement, ApprovalRequest } from "../types";

interface DashboardProps {
  applications: Opportunity[];
  emails: EmailIntel[];
  achievements: Achievement[];
  approvals: ApprovalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onTriggerMine: (repo: string) => void;
  onNavigate: (tab: string) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export default function DashboardOverview({
  applications,
  emails,
  achievements,
  approvals,
  onApprove,
  onReject,
  onTriggerMine,
  onNavigate,
  onSelectOpportunity
}: DashboardProps) {
  const [mineUrl, setMineUrl] = React.useState("https://github.com/sayojami2007/SummaStudy");
  const [isMining, setIsMining] = React.useState(false);

  // Compute stats
  const totalApps = applications.length + 22; // Let user know there are historical records as described
  const totalInterviews = applications.filter(a => a.status === "INTERVIEW").length + 2;
  const totalOffers = applications.filter(a => a.status === "OFFER").length;
  const successRate = Math.round((totalOffers / (totalApps || 1)) * 100) + 10; 

  const pendingApprovalsCount = approvals.filter(a => a.status === "pending").length;
  const unreadEmailsCount = emails.filter(e => !e.processed).length;
  const matchOpportunities = applications.filter(a => a.status === "READY").length;

  const handleMiningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mineUrl) return;
    setIsMining(true);
    await onTriggerMine(mineUrl);
    setIsMining(false);
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Visual Header / Brand Accent */}
      <div className="p-6 bg-white border border-zinc-200/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-xs">
        <div className="relative z-10">
          <h1 className="text-md font-bold text-zinc-900 flex items-center gap-2">
            Meet <span className="text-zinc-700 px-2 py-0.5 bg-zinc-100 rounded text-[10px] tracking-wider font-extrabold font-sans uppercase">Violet</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-2 max-w-xl leading-relaxed">
            Your premium feminine career Chief-of-Staff. Violet continuously analyzes job specs, parses recruiter notifications, optimizes materials, and drafts interview tactics — but takes zero actions without your approval.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto relative z-10">
          <button 
            onClick={() => onNavigate("copilot")}
            className="w-full md:w-auto h-11 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" /> Speak to Violet
          </button>
        </div>
        {/* Subtle art shadow/glow behind */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 rounded-full blur-2xl opacity-40 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI blocks with monospace numbers per design instructions */}
        <div className="p-5 bg-white border border-zinc-200/60 rounded-2xl shadow-xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">APPLICATIONS</span>
            <div className="p-2 bg-zinc-50 rounded-lg text-zinc-800 border border-zinc-200/60"><FileText className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 font-mono tracking-tight">{totalApps}</h3>
            <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-800" /> +5 this week
            </p>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/60 rounded-2xl shadow-xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">INTERVIEWS</span>
            <div className="p-2 bg-zinc-50 rounded-lg text-zinc-800 border border-zinc-200/60"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 font-mono tracking-tight">{totalInterviews}</h3>
            <p className="text-[10px] text-zinc-650 mt-1 flex items-center gap-1 font-medium">
              <Cpu className="w-3.5 h-3.5 text-zinc-800" /> 1 on Thursday
            </p>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/60 rounded-2xl shadow-xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">OFFERS</span>
            <div className="p-2 bg-zinc-50 rounded-lg text-zinc-800 border border-zinc-200/60"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 font-mono tracking-tight">{totalOffers}</h3>
            <p className="text-[10px] text-green-700 mt-1 flex items-center gap-1 font-medium">
              <Award className="w-3.5 h-3.5" /> Supabase active
            </p>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/60 rounded-2xl shadow-xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">SUCCESS</span>
            <div className="p-2 bg-zinc-50 rounded-lg text-zinc-800 border border-zinc-200/60"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 font-mono tracking-tight">{successRate}%</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Conversions rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily digest & Queue */}
        <div className="lg:col-span-8 space-y-6">
          {/* Daily Digest panel */}
          <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-zinc-800" /> Violet's Daily Digest
                </h3>
                <p className="text-[10px] text-zinc-400">Continuous career telemetry updates</p>
              </div>
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-mono rounded border border-zinc-250">
                Today, 10:42 AM
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-2xl">🔍</span>
                <h4 className="text-sm font-bold text-gray-800 mt-2">Opportunities Found</h4>
                <p className="text-xs text-gray-500 mt-1">Violet catalogued 8 interesting listings and job alerts today.</p>
              </div>
              <div className="p-4 bg-violet-50/40 rounded-xl border border-violet-100/40 animate-pulse">
                <span className="text-2xl">🔥</span>
                <h4 className="text-sm font-bold text-violet-950 mt-2">2 High Matches</h4>
                <p className="text-xs text-violet-900 mt-1">Stripe & Anthropic products fit your developer profile perfectly.</p>
              </div>
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/40">
                <span className="text-2xl">📅</span>
                <h4 className="text-sm font-bold text-indigo-950 mt-2">1 Interview Request</h4>
                <p className="text-xs text-indigo-900 mt-1">Anthropic technical interview has been catalogued.</p>
              </div>
            </div>
          </div>

          {/* Pending approvals queue */}
          <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" /> Pending Approvals Queue ({pendingApprovalsCount})
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Violet drafted these alterations. Confirm to commit changes to your resume variant profile.</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {approvals.filter(a => a.status === "pending").length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-250 rounded-xl"
                  >
                    <Check className="w-8 h-8 text-zinc-800 mx-auto" />
                    <h4 className="text-xs font-bold text-zinc-800 mt-2">Approval Queue Empty</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">You are fully synchronized. Great work!</p>
                  </motion.div>
                ) : (
                  approvals.filter(a => a.status === "pending").map((req) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 border border-zinc-200/80 bg-zinc-50/40 rounded-xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 bg-zinc-100 text-zinc-800 border rounded-md">
                            {req.type}
                          </span>
                          <h4 className="text-xs font-bold text-zinc-900 mt-1.5">{req.title}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{req.description}</p>
                        </div>
                        <div className="flex gap-1.5 w-full sm:w-auto">
                          <button 
                            onClick={() => onReject(req.id)}
                            className="flex-1 sm:flex-none h-10 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-red-650 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                          <button 
                            onClick={() => onApprove(req.id)}
                            className="flex-1 sm:flex-none h-10 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Bullet
                          </button>
                        </div>
                      </div>

                      {/* Display payload draft details */}
                      <div className="p-3 bg-white border border-zinc-200/60 rounded-lg text-[10.5px] font-mono text-zinc-650 overflow-x-auto space-y-2">
                        {req.type === "resume-variant" && (
                          <div className="space-y-1.5">
                            <div><strong className="text-zinc-400 font-sans text-[10px] block mb-0.5">ORIGINAL</strong> {req.payload.originalBullet}</div>
                            <div className="border-t border-zinc-100 pt-1.5 text-zinc-900"><strong className="text-zinc-650 font-sans text-[10px] block mb-0.5">TAILORED PROJECTION</strong> {req.payload.tailoredBullet}</div>
                          </div>
                        )}
                        {req.type === "cover-email" && (
                          <div className="space-y-1.5">
                            <div><strong className="text-zinc-400 font-sans text-[10px] block">TO:</strong> {req.payload.to}</div>
                            <div><strong className="text-zinc-400 font-sans text-[10px] block">SUBJECT:</strong> {req.payload.subject}</div>
                            <div className="border-t border-zinc-100 pt-1.5 whitespace-pre-wrap">{req.payload.body}</div>
                          </div>
                        )}
                        {req.type === "add-achievement" && (
                          <div className="space-y-1">
                            <div><strong className="text-zinc-400 font-sans text-[10px] block">DISCOVERED REPOSITORY ACHIEVEMENT</strong> {req.payload.title}</div>
                            <div className="mt-1 text-zinc-500 font-sans">{req.payload.description}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Project Intelligence Agent & Email Intelligence teaser */}
        <div className="lg:col-span-4 space-y-6">
          {/* Project Intelligence Agent */}
          <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-zinc-900" />
              <h3 className="text-sm font-bold text-zinc-900">Project Intelligence</h3>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              As you build, Violet monitors your GitHub activities to automatically draft portfolio summaries and tailored bullets.
            </p>

            <form onSubmit={handleMiningSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 tracking-wider block">ANALYZE REPOSITORY</label>
                <input 
                  type="text" 
                  value={mineUrl}
                  onChange={(e) => setMineUrl(e.target.value)}
                  className="w-full text-xs h-11 p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl focus:border-zinc-950 focus:ring-0 text-zinc-800 transition-colors"
                  placeholder="https://github.com/..."
                />
              </div>
              <button 
                type="submit" 
                disabled={isMining}
                className="w-full h-11 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isMining ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Violet Mining...
                  </>
                ) : (
                  <>🔍 Auto-Detect Achievements</>
                )}
              </button>
            </form>

            {/* Achievements lists */}
            <div className="mt-5 space-y-3 pt-4 border-t border-zinc-150">
              <h4 className="text-[10px] font-bold text-zinc-400 tracking-wider">DETECTED ACHIEVEMENTS</h4>
              {achievements.map((ach) => (
                <div key={ach.id} className="p-3 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-xs relative">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                    <Award className="w-3.5 h-3.5 text-zinc-800" />
                    <span>{ach.title}</span>
                  </div>
                  <p className="text-zinc-500 mt-1 leading-relaxed text-[11px]">{ach.description}</p>
                  <div className="mt-2.5 flex justify-between items-center text-[10px] pt-2 border-t border-zinc-100/60">
                    <span className="text-zinc-400 capitalize">Source: {ach.source}</span>
                    {ach.isAppliedToResume ? (
                      <span className="text-green-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Draft</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Intelligence teaser */}
          <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-zinc-800" /> Recruiter Correspondences
              </h4>
              {unreadEmailsCount > 0 && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100">
                  {unreadEmailsCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Violet monitors recruiter email channels and flags alerts for immediate candidate review.
            </p>

            <div className="space-y-2">
              {emails.slice(0, 2).map((mail) => (
                <div 
                  key={mail.id} 
                  onClick={() => onNavigate("email-intel")}
                  className="p-3 bg-zinc-50/50 hover:bg-zinc-100/50 rounded-xl text-xs border border-zinc-200/60 transition-all cursor-pointer block"
                >
                  <div className="flex justify-between font-bold text-zinc-800">
                    <span className="truncate max-w-[120px]">{mail.sender}</span>
                    <span className="text-[9px] bg-zinc-100 text-zinc-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">{mail.category}</span>
                  </div>
                  <p className="text-zinc-500 truncate mt-1.5 font-semibold text-[11px]">{mail.subject}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNavigate("email-intel")}
              className="w-full text-center text-xs font-bold text-zinc-900 hover:text-zinc-700 flex items-center justify-center gap-1 py-2 mt-2 h-10 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              Configure Email Filters <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
