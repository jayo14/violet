import React from "react";
import { 
  Sparkles, ShieldCheck, ChevronRight, Play, BookOpen, Clock, 
  HelpCircle, MessageSquare, AlertCircle, Cpu, Calendar, Star, Compass, Building2, Code, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Opportunity, InterviewPrep } from "../types";

interface PrepProps {
  onGeneratePrep: (opp: Opportunity) => Promise<InterviewPrep>;
  applications: Opportunity[];
}

interface CoTStep {
  id: string;
  label: string;
  status: "idle" | "running" | "done";
}

export default function InterviewPrepComp({ onGeneratePrep, applications }: PrepProps) {
  const [opp, setOpp] = React.useState<Opportunity | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [prepResult, setPrepResult] = React.useState<InterviewPrep | null>(null);
  const [activeTab, setActiveTab] = React.useState<"research" | "technical" | "hr">("research");

  const [cotSteps, setCotSteps] = React.useState<CoTStep[]>([
    { id: "research", label: "Researching Company & Products", status: "idle" },
    { id: "competitors", label: "Finding Competitors & Market Space", status: "idle" },
    { id: "technical", label: "Generating Role-Specific Technical Questions", status: "idle" },
    { id: "hr", label: "Creating Narrative HR Answer Suggestions", status: "idle" }
  ]);

  const handleCommencePrep = async () => {
    if (!opp) return;
    setIsGenerating(true);
    setPrepResult(null);

    // Reset steps
    setCotSteps(steps => steps.map(s => ({ ...s, status: "idle" })));

    // Step 1
    updateStep("research", "running");
    await sleep(1500);
    updateStep("research", "done");

    // Step 2
    updateStep("competitors", "running");
    await sleep(1500);
    updateStep("competitors", "done");

    // Step 3
    updateStep("technical", "running");
    await sleep(1500);
    updateStep("technical", "done");

    // Step 4
    updateStep("hr", "running");

    try {
      const response = await onGeneratePrep(opp);
      updateStep("hr", "done");
      await sleep(400);
      setPrepResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStep = (id: string, status: "idle" | "running" | "done") => {
    setCotSteps(steps => steps.map(s => s.id === id ? { ...s, status } : s));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <Compass className="w-5 h-5 text-indigo-500 animate-pulse" /> Custom Interview Assistant
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Formulate detailed, tailored company sheets and behavioral strategies based on active applicant details.
          </p>
        </div>

        {/* Picker */}
        <select
          value={opp?.id || ""}
          onChange={(e) => {
            const selected = applications.find(a => a.id === e.target.value);
            if (selected) setOpp(selected);
          }}
          className="text-xs p-2.5 border border-gray-250 bg-white rounded-xl focus:border-violet-500 font-semibold w-full md:w-auto"
        >
          <option value="" disabled>Select an Application...</option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.company} — {app.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Setup and CoT */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Target Profile</span>
              {opp ? (
                <div className="p-4 bg-gray-50 border rounded-xl space-y-1">
                  <h4 className="text-sm font-bold text-gray-800">{opp.title}</h4>
                  <p className="text-xs text-gray-500">{opp.company}</p>
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed rounded-xl text-xs text-gray-400">
                  Select an interview target from top dropdown.
                </div>
              )}
            </div>

            {opp && (
              <button
                onClick={handleCommencePrep}
                disabled={isGenerating}
                className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-150 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-transform hover:scale-102 active:scale-98 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Prepare Tactical Study Sheet
              </button>
            )}

            {isGenerating && (
              <div className="pt-3 border-t space-y-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Curating Interview Telemetry
                </span>
                {cotSteps.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-1.5 px-2 bg-gray-50/50 rounded-lg">
                    <span className="text-gray-600 font-medium">{s.label}</span>
                    {s.status === "done" && (
                      <span className="p-0.5 bg-green-100 rounded-full text-green-600"><Star className="w-3.5 h-3.5 fill-green-600" /></span>
                    )}
                    {s.status === "running" && (
                      <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    {s.status === "idle" && (
                      <span className="w-3.5 h-3.5 border border-gray-250 rounded-full"></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Prep materials tabber view */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!opp && (
              <div className="p-12 text-center bg-gray-50 border border-dashed rounded-2xl flex flex-col items-center justify-center h-full min-h-[350px]">
                <BookOpen className="w-12 h-12 text-gray-300 stroke-1" />
                <h3 className="text-sm font-bold text-gray-800 mt-4">Compile Study sheets</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Choose your active application opening inside the list menu, and trigger Violet to run competitive intelligence and HR narrative matching.
                </p>
              </div>
            )}

            {opp && !isGenerating && !prepResult && (
              <div className="p-12 text-center bg-gray-50 border border-dashed rounded-2xl flex flex-col items-center justify-center h-full min-h-[350px]">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-bold text-gray-800 mt-4">Preps Generator Ready</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Press 'Prepare Tactical Study Sheet' to continue. Violet will construct structured narrative mock questions tailored to your resume context.
                </p>
              </div>
            )}

            {prepResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-2xl p-5 space-y-4"
              >
                {/* Tab selector */}
                <div className="flex border-b text-xs">
                  <button
                    onClick={() => setActiveTab("research")}
                    className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "research" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Company Insights
                  </button>
                  <button
                    onClick={() => setActiveTab("technical")}
                    className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "technical" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> Core Tech Questions
                  </button>
                  <button
                    onClick={() => setActiveTab("hr")}
                    className={`pb-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "hr" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Behavioral Strategy
                  </button>
                </div>

                {/* Tab content loops */}
                {activeTab === "research" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 gap-4 text-xs font-sans"
                  >
                    <div className="p-4 bg-gray-50 border rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Mission Statement</span>
                      <p className="text-gray-700 leading-relaxed font-semibold">{prepResult.research.mission}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 border rounded-xl space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Key Core Products</span>
                        <ul className="space-y-1 text-gray-600">
                          {prepResult.research.products.map((p, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">• <span>{p}</span></li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-gray-50 border rounded-xl space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Primary Competitors</span>
                        <ul className="space-y-1 text-gray-600">
                          {prepResult.research.competitors.map((c, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">• <span>{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "technical" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4"
                  >
                    {prepResult.technicalQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-2 text-xs">
                        <h4 className="font-bold text-indigo-950 flex gap-2">
                          <span>Q{idx+1}:</span> <span>{q.question}</span>
                        </h4>
                        <p className="text-gray-650 bg-white p-3 border rounded-lg leading-relaxed font-sans mt-1">
                          <strong className="text-violet-600">Violet Strategy formulation:</strong> {q.answerSuggestion}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "hr" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4"
                  >
                    {prepResult.hrQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-violet-50/30 border border-violet-100 rounded-xl space-y-2 text-xs">
                        <h4 className="font-bold text-violet-950 flex gap-2">
                          <span>Q{idx+1}:</span> <span>{q.question}</span>
                        </h4>
                        <p className="text-gray-650 bg-white p-3 border rounded-lg leading-relaxed font-sans mt-1">
                          <strong className="text-violet-600">Your Experience anchor:</strong> {q.answerSuggestion}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
