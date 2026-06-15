import React from "react";
import { 
  Sparkles, ShieldCheck, CheckCircle2, ChevronRight, ChevronDown, 
  Trash2, Plus, Calendar, MapPin, DollarSign, Award, Target, HelpCircle, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Opportunity, OpportunityAnalysis } from "../types";

interface ActionProps {
  onAnalyze: (jd: string) => Promise<{ opportunity: Opportunity, analysis: OpportunityAnalysis }>;
  onAddToTracker: (opp: Opportunity) => void;
  onNavigateToTailor: (opp: Opportunity, analysis: OpportunityAnalysis) => void;
}

interface CoTStep {
  id: string;
  label: string;
  status: "idle" | "running" | "done";
  details: string;
}

export default function OpportunityAnalyzer({ onAnalyze, onAddToTracker, onNavigateToTailor }: ActionProps) {
  const [jobText, setJobText] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [expandedCoT, setExpandedCoT] = React.useState<string | null>(null);
  
  // Chain of thought steps state
  const [cotSteps, setCotSteps] = React.useState<CoTStep[]>([
    { id: "1", label: "Extracting Company & Basic Metadata", status: "idle", details: "Violet is reviewing core tags searching for corporate headers, locations, and salary parameters." },
    { id: "2", label: "Parsing Skill & Experience Requirements", status: "idle", details: "Extracting core technology vectors, preferred stack, years of experiences, and degree prerequisites." },
    { id: "3", label: "Matching Candidate Skills", status: "idle", details: "Evaluating your master stack (React, TypeScript, Express, Postgres) against the extracted requirements vector." },
    { id: "4", label: "Evaluating Resume Structural Gaps", status: "idle", details: "Checking timeline records, degree credentials, and potential lack of specified frameworks like Docker or WebGL." },
    { id: "5", label: "Generating Recommendation and CoT Metrics", status: "idle", details: "Formulating a tailored career guide, calculate matching scores, and drafting resume bullet suggestions." }
  ]);

  const [oppResult, setOppResult] = React.useState<Opportunity | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<OpportunityAnalysis | null>(null);
  const [errorText, setErrorText] = React.useState("");

  const handlePastePreset = () => {
    setJobText(`We are looking for a Software Engineer at OpenAI in San Francisco, CA. Salary is $180,000 - $240,000. 
Requirements include:
- Deep React skills with TypeScript
- Strong familiarity with FastAPI or Express REST APIs
- Ability to craft beautiful, lightning-fast interfaces
- Docker containerization and Kubernetes knowledge`);
  };

  const executeAnalysis = async () => {
    if (!jobText.trim()) return;
    setIsAnalyzing(true);
    setOppResult(null);
    setAnalysisResult(null);
    setErrorText("");

    // Initialize CoT steps nicely
    const currentSteps = cotSteps.map(step => ({ ...step, status: "idle" as const }));
    setCotSteps(currentSteps);

    // Simulate Step 1
    updateStepStatus("1", "running");
    await sleep(2000);
    updateStepStatus("1", "done");

    // Simulate Step 2
    updateStepStatus("2", "running");
    await sleep(1800);
    updateStepStatus("2", "done");

    // Simulate Step 3
    updateStepStatus("3", "running");
    await sleep(1500);
    updateStepStatus("3", "done");

    // Simulate Step 4
    updateStepStatus("4", "running");
    await sleep(1200);
    updateStepStatus("4", "done");

    // Simulate Step 5
    updateStepStatus("5", "running");

    try {
      const response = await onAnalyze(jobText);
      updateStepStatus("5", "done");
      await sleep(500);
      setOppResult(response.opportunity);
      setAnalysisResult(response.analysis);
    } catch (err: any) {
      setErrorText("Gemini failed to resolve telemetry constraints. Please check settings or retry.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateStepStatus = (id: string, status: "idle" | "running" | "done") => {
    setCotSteps(prev => 
      prev.map(step => step.id === id ? { ...step, status } : step)
    );
    if (status === "running") {
      setExpandedCoT(id);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <Target className="w-5 h-5 text-violet-600 animate-pulse" /> Advanced Opportunity Analyzer
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Paste raw LinkedIn postings, recruiter correspondence, or notes. Violet extracts core vectors and scores matches.
          </p>
        </div>
        <button 
          onClick={handlePastePreset}
          className="p-2 px-3 border hover:border-violet-100 hover:text-violet-700 text-gray-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 bg-white cursor-pointer"
        >
          📝 Example Paste
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">
                Opportunity Input
              </span>
              <textarea 
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste job descriptions here... Include company profiles, stacks, requirements checklist."
                className="w-full h-80 text-xs p-3.5 border border-gray-200 bg-gray-50/50 rounded-xl focus:border-violet-500 focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 leading-relaxed font-sans"
              />
            </div>
            
            <button 
              onClick={executeAnalysis}
              disabled={isAnalyzing || !jobText.trim()}
              className="mt-4 w-full p-3 bg-violet-600 hover:bg-violet-750 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? "Violet Analyzing..." : "💡 Ingest & Analyze Specifications"}
            </button>
          </div>
        </div>

        {/* Results / Chain of Thought progress check */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2.5 border-b pb-3 border-gray-100">
                  <span className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></span>
                  <h3 className="text-sm font-bold text-gray-800">Chain Of Thought: Analyzing Opportunity</h3>
                </div>

                <div className="space-y-3">
                  {cotSteps.map((step) => (
                    <div 
                      key={step.id} 
                      className="border border-gray-100 rounded-xl overflow-hidden transition-all text-xs"
                    >
                      <button
                        onClick={() => setExpandedCoT(expandedCoT === step.id ? null : step.id)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 text-left font-semibold text-gray-700"
                      >
                        <div className="flex items-center gap-2.5">
                          {step.status === "done" && (
                            <span className="p-0.5 bg-green-100 rounded-full text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
                          {step.status === "running" && (
                            <span className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></span>
                          )}
                          {step.status === "idle" && (
                            <span className="w-4 h-4 border border-gray-300 rounded-full"></span>
                          )}
                          <span className={`${step.status === "running" ? "text-violet-700 font-extrabold" : "text-gray-700"}`}>
                            {step.label}
                          </span>
                        </div>
                        {expandedCoT === step.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedCoT === step.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white p-3 px-4 border-t border-gray-100 text-gray-500 leading-relaxed font-sans text-[11px]"
                          >
                            {step.details}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {errorText && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Telemetry Fault</h4>
                  <p className="text-xs mt-1">{errorText}</p>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && !oppResult && !errorText && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center bg-gray-50 border border-dashed rounded-2xl flex flex-col items-center justify-center h-full min-h-[350px]"
              >
                <Target className="w-12 h-12 text-gray-300 stroke-1" />
                <h3 className="text-sm font-bold text-gray-800 mt-4">Waiting for Target Specs</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Complete the specs paste in the left viewport and click analyze. Violet will run our five-step matching chain immediately.
                </p>
              </motion.div>
            )}

            {oppResult && analysisResult && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-5"
              >
                {/* Header Match dial */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 pb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-indigo-50 text-indigo-700 rounded-md">
                      violet analysis complete
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 mt-1">{oppResult.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{oppResult.company} • {oppResult.location}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center bg-violet-50">
                      <div className="text-center">
                        <span className="text-lg font-black text-violet-700">{analysisResult.matchScore}%</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Match score</h4>
                      <p className="text-[10px] text-gray-400">Excellent compatibility indices</p>
                    </div>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold truncate">{oppResult.location}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold truncate">{oppResult.salary || "TBD"}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold truncate">Deadline: {oppResult.deadline || "TBD"}</span>
                  </div>
                </div>

                {/* Gaps / Strengths */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-green-950 flex items-center gap-1">
                      🟢 Profile Strengths ({analysisResult.strengths.length})
                    </h4>
                    <ul className="space-y-1.5">
                      {analysisResult.strengths.map((str, idx) => (
                        <li key={idx} className="text-[11px] text-green-900 leading-relaxed flex items-start gap-1">
                          <span className="font-extrabold text-green-600 mt-0.5">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      🟡 Detected Gaps ({analysisResult.gaps.length})
                    </h4>
                    <ul className="space-y-1.5">
                      {analysisResult.gaps.map((gap, idx) => (
                        <li key={idx} className="text-[11px] text-amber-900 leading-relaxed flex items-start gap-1">
                          <span className="font-extrabold text-amber-600 mt-0.5">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Violet Recommendation */}
                <div className="p-4.5 bg-violet-50/40 border border-violet-100 rounded-xl">
                  <h4 className="text-xs font-bold text-violet-950 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" /> Violet's Strategy Formulation
                  </h4>
                  <p className="text-[11px] text-violet-900 leading-relaxed whitespace-pre-wrap font-sans">
                    {analysisResult.recommendation}
                  </p>
                </div>

                {/* Standard interactors */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => onAddToTracker(oppResult)}
                    className="flex-1 p-2.5 bg-white border hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    📂 Sync to Tracker
                  </button>
                  <button 
                    onClick={() => onNavigateToTailor(oppResult, analysisResult)}
                    className="flex-1 p-2.5 bg-violet-600 hover:bg-violet-750 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🛠️ Tailor Resume & Cover Let
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
