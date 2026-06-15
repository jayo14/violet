import React from "react";
import { 
  Sparkles, CheckCircle2, ChevronRight, Plus, Eye, 
  MapPin, Calendar, LayoutGrid, Clock, ShieldCheck, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Opportunity, ApplicationStatus } from "../types";

interface TrackerProps {
  applications: Opportunity[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onSelectApplication: (opp: Opportunity) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function ApplicationTracker({ 
  applications, 
  onUpdateStatus, 
  onSelectApplication,
  onNavigateToTab
}: TrackerProps) {
  const columns: { label: string; status: ApplicationStatus; color: string; badgeColor: string }[] = [
    { label: "Saved Listings", status: ApplicationStatus.SAVED, color: "border-zinc-200 bg-zinc-50/50", badgeColor: "bg-zinc-200/60 text-zinc-700" },
    { label: "Ready", status: ApplicationStatus.READY, color: "border-indigo-100 bg-indigo-50/20", badgeColor: "bg-indigo-100 text-indigo-700" },
    { label: "Applied", status: ApplicationStatus.APPLIED, color: "border-blue-100 bg-blue-50/20", badgeColor: "bg-blue-100 text-blue-700" },
    { label: "Interviews", status: ApplicationStatus.INTERVIEW, color: "border-amber-100 bg-amber-50/20", badgeColor: "bg-amber-100 text-amber-900" },
    { label: "Offers", status: ApplicationStatus.OFFER, color: "border-green-100 bg-green-50/20", badgeColor: "bg-green-100 text-green-700" }
  ];

  // Mobile active tab tracking state
  const [mobileActiveStage, setMobileActiveStage] = React.useState<ApplicationStatus>(ApplicationStatus.READY);

  return (
    <div className="space-y-6">
      {/* Header coordinates */}
      <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-1.5">
            <LayoutGrid className="w-5 h-5 text-zinc-800" /> Career Operating Pipeline
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 font-sans">
            Continuous visual monitor of all active opportunities. Violet coordinates updates dynamically as recruiter triggers sync.
          </p>
        </div>
        <button 
          onClick={() => onNavigateToTab("analyzer")}
          className="w-full sm:w-auto h-11 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Analyse New Specification
        </button>
      </div>

      {/* Mobile/Tablet Segmented Control - Sticky & Touch-friendly (at least 44px tap target) */}
      <div className="lg:hidden flex overflow-x-auto bg-zinc-100 p-1 rounded-xl scrollbar-none gap-0.5">
        {columns.map((col) => {
          const count = applications.filter(a => a.status === col.status).length;
          const isSelected = mobileActiveStage === col.status;
          return (
            <button
              key={col.status}
              onClick={() => setMobileActiveStage(col.status)}
              className={`flex-1 min-w-[80px] h-10 px-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                isSelected 
                  ? "bg-white text-zinc-950 shadow-xs" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span>{col.label.split(" ")[0]}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isSelected ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-650"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Grid Layout (lg:grid) and Mobile Selective display */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colApps = applications.filter(a => a.status === col.status);
          const isVisibleOnMobile = mobileActiveStage === col.status;

          return (
            <div 
              key={col.status} 
              className={`p-4 border border-zinc-200/60 rounded-2xl min-h-[460px] flex flex-col space-y-3 ${col.color} ${
                isVisibleOnMobile ? "flex" : "hidden lg:flex"
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                <span className="text-xs font-bold text-zinc-800">{col.label}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${col.badgeColor}`}>
                  {colApps.length}
                </span>
              </div>

              {/* Stack cards inside columns */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {colApps.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-350 hover:shadow-xs transition-all space-y-2.5 relative group text-left text-xs text-zinc-600"
                    >
                      <div>
                        <h4 className="font-bold text-zinc-950 truncate">{app.title}</h4>
                        <span className="font-semibold text-zinc-500 text-[10px] block mt-0.5">{app.company}</span>
                      </div>

                      {app.salary && (
                        <span className="text-[10px] text-zinc-400 font-mono italic block">{app.salary}</span>
                      )}

                      {/* Touch-friendly actions bar (at least 44px tap targets) */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-150">
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="h-9 px-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-[10px] font-semibold text-zinc-800 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>

                        {/* Status advancement toggle list */}
                        <div className="relative">
                          <select
                            value={app.status}
                            onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                            className="h-9 pl-2 pr-6 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-[10px] font-bold text-zinc-700 outline-none rounded-lg cursor-pointer focus:ring-0 max-w-[100px] truncate transition-colors appearance-none"
                          >
                            {Object.values(ApplicationStatus).map((st) => (
                              <option key={st} value={st} className="text-xs text-zinc-800 font-sans">
                                Move: {st}
                              </option>
                            ))}
                          </select>
                          {/* Beautiful customized dropdown triangle chevron indicator */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                            <ChevronRight className="w-3 h-3 transform rotate-90" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {colApps.length === 0 && (
                  <div className="h-24 border border-dashed border-zinc-200 rounded-xl flex items-center justify-center p-4 text-center text-[10.5px] text-zinc-400">
                    No active entries
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
