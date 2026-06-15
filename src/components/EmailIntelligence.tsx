import React from "react";
import { 
  Mail, Calendar, FileText, ChevronRight, Check, RefreshCw, 
  HelpCircle, Sparkles, Filter, CheckCircle, Clock, Trash2, MailOpen, Zap, Key, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { EmailIntel, EmailType } from "../types";

interface EmailProps {
  emails: EmailIntel[];
  onMarkProcessed: (id: string) => void;
  onComposeResponse: (email: EmailIntel) => void;
  onNavigateToPrep: (company: string, role: string) => void;
  onTriggerScan?: () => Promise<void>;
}

export default function EmailIntelligence({ 
  emails, 
  onMarkProcessed, 
  onComposeResponse, 
  onNavigateToPrep,
  onTriggerScan
}: EmailProps) {
  const [filterType, setFilterType] = React.useState<EmailType | "ALL">("ALL");
  const [selectedMail, setSelectedMail] = React.useState<EmailIntel | null>(emails[0] || null);

  // States for simulated email scanner and real Gmail API operations
  const [isClassifying, setIsClassifying] = React.useState(false);
  const [googleAccessToken, setGoogleAccessToken] = React.useState("");
  const [isLinkingGoogle, setIsLinkingGoogle] = React.useState(false);
  const [showOAuthInput, setShowOAuthInput] = React.useState(false);
  const [alert, setAlert] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-highlight fresh classified incoming emails
  React.useEffect(() => {
    if (emails.length > 0) {
      if (!selectedMail || !emails.some(e => e.id === selectedMail.id)) {
        setSelectedMail(emails[0]);
      }
    }
  }, [emails]);

  const handleIntenseScan = async () => {
    setIsClassifying(true);
    setAlert(null);
    try {
      if (onTriggerScan) {
        await onTriggerScan();
      }
      setAlert({ 
        type: "success", 
        text: "Violet Email Agent parsed, classified, and indexed simulated recruiter correspondence logs successfully." 
      });
    } catch (err: any) {
      setAlert({ type: "error", text: "Simulation scanning failure: " + err.message });
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSyncRealGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleAccessToken.trim()) return;
    setIsLinkingGoogle(true);
    setAlert(null);
    try {
      const res = await fetch("/api/sync-real-gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: googleAccessToken })
      });
      if (res.ok) {
        const data = await res.json();
        setAlert({ 
          type: "success", 
          text: `Linked successfully! Imported and classified ${data.importedCount} genuine recruiter threads from your authentic Gmail inbox.` 
        });
        setGoogleAccessToken("");
        setShowOAuthInput(false);
        if (onTriggerScan) {
          await onTriggerScan();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Rejected by Google Workspace endpoints.");
      }
    } catch (err: any) {
      setAlert({ type: "error", text: "Workspace Integration Error: " + err.message });
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const getCategoryBadgeClass = (category: EmailType) => {
    switch (category) {
      case EmailType.OFFER:
        return "bg-green-150 text-green-800 border-green-200";
      case EmailType.INTERVIEW:
        return "bg-indigo-150 text-indigo-800 border-indigo-200";
      case EmailType.REJECTION:
        return "bg-red-150 text-red-800 border-red-200";
      case EmailType.FOLLOW_UP:
        return "bg-amber-150 text-amber-800 border-amber-200";
      case EmailType.OPPORTUNITY:
        return "bg-purple-150 text-purple-800 border-purple-200";
    }
  };

  const filteredMails = filterType === "ALL" 
    ? emails 
    : emails.filter(e => e.category === filterType);

  const handleSelect = (mail: EmailIntel) => {
    setSelectedMail(mail);
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5 animate-pulse">
            <Mail className="w-5 h-5 text-violet-500" /> Recruiter Email Intelligence
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Violet monitors and parses recruiter communication logs, categorizes status changes, and drafts dynamic suggestions.
          </p>
        </div>

        {/* Filter categories tabs selector */}
        <div className="flex gap-1 flex-wrap text-xs bg-gray-100/60 p-1.5 rounded-xl border">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === "ALL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-400 hover:text-gray-650"
            }`}
          >
            All
          </button>
          {Object.values(EmailType).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                filterType === type ? "bg-white text-gray-900 shadow-xs" : "text-gray-400 hover:text-gray-650"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Skeuomorphic Automations Control Strip */}
      <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-[0_4px_0_0_#f4f4f5] space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zinc-700 animate-spin" /> Automated Telemetry Pipeline Status: Live
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Email intelligence agent polls in background. Trigger immediate intakes manually below.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleIntenseScan}
              disabled={isClassifying}
              className="h-10 px-4 bg-zinc-950 text-white border border-zinc-800 rounded-xl shadow-[0_4px_0_0_#52525b] active:translate-y-[3px] active:shadow-none hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-[11px] font-extrabold cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> {isClassifying ? "CLASSIFYING..." : "TRIGGER SIMULATED RECRUITER SCAN"}
            </button>

            <button
              onClick={() => {
                setShowOAuthInput(!showOAuthInput);
                setAlert(null);
              }}
              className="h-10 px-4 bg-white border border-zinc-250 text-zinc-800 rounded-xl shadow-[0_4px_0_0_#e4e4e7] active:translate-y-[3px] active:shadow-none hover:bg-zinc-50 flex items-center gap-1.5 text-[11px] font-extrabold cursor-pointer transition-all"
            >
              <Key className="w-3.5 h-3.5 text-zinc-650" /> LINK REAL GMAIL OAUTH
            </button>
          </div>
        </div>

        {/* Gmail token interactive linking card */}
        {showOAuthInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl"
          >
            <form onSubmit={handleSyncRealGmail} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-505 block uppercase tracking-wider">
                  Google Account OAuth Access Token
                </label>
                <p className="text-[10px] text-zinc-400">
                  Provide your active Google user token to coordinate full-stack synchronization live with Gmail API users threads.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={googleAccessToken}
                  onChange={(e) => setGoogleAccessToken(e.target.value)}
                  placeholder="Paste oauth_token here..."
                  className="flex-1 text-xs h-10 px-3 border-2 border-zinc-200 rounded-xl shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.055)] focus:border-zinc-900 outline-none transition-all font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={isLinkingGoogle}
                  className="h-10 px-4 bg-zinc-905 bg-black text-white text-[11px] font-extrabold rounded-xl shadow-[0_3px_0_0_#52525b] active:translate-y-[2px] active:shadow-none disabled:opacity-55 cursor-pointer"
                >
                  {isLinkingGoogle ? "SYNCING..." : "SYNC GMAIL NOW"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Dynamic status alert */}
        {alert && (
          <div
            className={`p-3 rounded-xl text-[11px] font-bold border transition-all ${
              alert.type === "success"
                ? "bg-zinc-50 border-zinc-300 text-zinc-800 pl-4 border-l-4 border-l-zinc-900"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {alert.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Inbox col */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 space-y-3 max-h-[500px] overflow-y-auto shadow-xs">
          <span className="text-[10px] font-bold text-gray-450 uppercase block tracking-wider mb-2">Inbox Feed</span>
          
          <div className="space-y-2">
            {filteredMails.length === 0 ? (
              <div className="p-8 text-center text-gray-450 font-sans">
                No recruiter emails detected matching current coordinates
              </div>
            ) : (
              filteredMails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => handleSelect(mail)}
                  className={`p-3.5 border rounded-xl transition-all cursor-pointer text-left space-y-1 ${
                    selectedMail?.id === mail.id 
                      ? "bg-violet-50/40 border-violet-200" 
                      : "bg-gray-50/60 hover:bg-gray-50 border-gray-150"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-800 truncate max-w-[150px]">{mail.sender}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${getCategoryBadgeClass(mail.category)}`}>
                      {mail.category}
                    </span>
                  </div>
                  <h4 className={`truncate ${mail.processed ? "text-gray-550 font-medium" : "text-gray-950 font-bold"}`}>
                    {mail.subject}
                  </h4>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                    <span>{new Date(mail.receivedAt).toLocaleDateString()}</span>
                    {mail.processed ? (
                      <span className="text-green-600 font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Processed
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold animate-pulse">Action Pending</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Preview View col */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs relative">
          <AnimatePresence mode="wait">
            {selectedMail ? (
              <motion.div
                key={selectedMail.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 flex flex-col justify-between h-full min-h-[420px]"
              >
                <div className="space-y-4">
                  {/* Message header */}
                  <div className="border-b border-gray-150 pb-4 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">sender coordinates</span>
                        <h3 className="text-sm font-extrabold text-gray-950 mt-0.5">{selectedMail.sender}</h3>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase border rounded-md ${getCategoryBadgeClass(selectedMail.category)}`}>
                        {selectedMail.category}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-500 font-sans">
                      <span><strong>Subject:</strong> {selectedMail.subject}</span>
                      <span>{new Date(selectedMail.receivedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Body text */}
                  <div className="p-4 bg-gray-50/50 border rounded-xl text-xs font-sans text-gray-750 font-medium leading-relaxed whitespace-pre-wrap min-h-[140px]">
                    {selectedMail.body}
                  </div>

                  {/* Violet Suggestion bullet */}
                  {selectedMail.suggestedAction && (
                    <div className="p-3.5 bg-violet-50/40 border border-violet-100 rounded-xl space-y-1">
                      <h4 className="font-bold text-violet-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" /> Violet’s Intake Suggestion
                      </h4>
                      <p className="font-semibold text-violet-900 leading-normal pl-5">
                        {selectedMail.suggestedAction}
                      </p>
                    </div>
                  )}
                </div>

                {/* Intelligent buttons bar */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                  {selectedMail.category === EmailType.INTERVIEW && (
                    <button
                      onClick={() => onNavigateToPrep(selectedMail.sender.split("@")[0], "Software Engineer")}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 font-bold border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" /> Open Prep Strategy Sheets
                    </button>
                  )}
                  <button
                    onClick={() => onComposeResponse(selectedMail)}
                    className="flex-1 p-2.5 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Compose Suggested Response Draft
                  </button>
                  {!selectedMail.processed && (
                    <button
                      onClick={() => onMarkProcessed(selectedMail.id)}
                      className="p-2.5 bg-white border hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 inline-block mr-1" /> Mark Processed
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="p-12 text-center text-gray-400 font-sans flex flex-col items-center justify-center h-full min-h-[400px]">
                <MailOpen className="w-12 h-12 text-gray-300 stroke-1 mb-2 animate-bounce" />
                <h3 className="text-sm font-bold text-gray-800">No Email Selected</h3>
                <p className="text-xs text-gray-450 mt-1 max-w-sm">
                  Select any item on the left panel to display credentials details, parsed headers, and strategic outreach suggestions.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
