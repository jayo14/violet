import React from "react";
import { 
  Sparkles, Shield, Bookmark, ToggleLeft, ToggleRight, 
  MapPin, Command, BookOpen, Clock, Lightbulb, Compass, Award
} from "lucide-react";
import { motion } from "motion/react";
import { CareerMemory } from "../types";

interface MemoryProps {
  memory: CareerMemory;
  onUpdateMemory: (newMemory: CareerMemory) => void;
}

export default function MemoryVault({ memory, onUpdateMemory }: MemoryProps) {
  const [prefRoles, setPrefRoles] = React.useState(memory.preference.preferredRoles.join(", "));
  const [prefLocs, setPrefLocs] = React.useState(memory.preference.preferredLocations.join(", "));
  const [remote, setRemote] = React.useState(memory.preference.remotePreference);

  const handleSavePreferences = () => {
    const updated = {
      ...memory,
      preference: {
        preferredRoles: prefRoles.split(",").map(s => s.trim()).filter(Boolean),
        preferredLocations: prefLocs.split(",").map(s => s.trim()).filter(Boolean),
        remotePreference: remote
      }
    };
    onUpdateMemory(updated);
  };

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-200 fill-violet-700" /> Career Soul Memory Vault
          </h2>
          <p className="text-sm text-violet-100 mt-1 max-w-xl">
            This represents Violet’s long-term memory about your identities, preference thresholds, historical milestones, and learnings parsed from prior application cycles.
          </p>
        </div>
        <div className="text-right text-xs bg-white/10 p-3 rounded-2xl border border-white/10 font-mono">
          <span>Telemetry Status: SECURE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Identity & Preferences */}
        <div className="lg:col-span-6 space-y-6">
          {/* Identity Memory card */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              <Bookmark className="w-4.5 h-4.5 text-violet-600" /> Identity Memory Logs
            </h3>

            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Master Skills Vector</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {memory.identity.skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-1 bg-violet-50 text-violet-750 font-semibold rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Degree & Credentials Logs</span>
                <ul className="mt-1.5 space-y-1 text-gray-600 font-sans leading-relaxed">
                  {memory.identity.education.map((e, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">• <span>{e}</span></li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Permanent Projects Inventory</span>
                <ul className="mt-1.5 space-y-1 text-gray-600 font-sans leading-relaxed">
                  {memory.identity.projects.map((p, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">• <span>{p}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Preference Memory Card with Inputs */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              <Command className="w-4.5 h-4.5 text-indigo-600" /> Preferences Memory Configuration
            </h3>

            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Preferred Job Roles (comma list)</label>
                <input 
                  type="text" 
                  value={prefRoles}
                  onChange={(e) => setPrefRoles(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Preferred Locations (comma list)</label>
                <input 
                  type="text" 
                  value={prefLocs}
                  onChange={(e) => setPrefLocs(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs text-gray-800"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 border rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Remote Workspace preference</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Filter matching specifications for remote jobs</p>
                </div>
                <button 
                  onClick={() => setRemote(!remote)} 
                  className="text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none"
                >
                  {remote ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-gray-300" />}
                </button>
              </div>

              <button
                onClick={handleSavePreferences}
                className="w-full p-2.5 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                💾 Update Preference Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Career & Learning history */}
        <div className="lg:col-span-6 space-y-6">
          {/* Career Memory block */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              <Award className="w-4.5 h-4.5 text-indigo-500" /> Career Milestone Memory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
              <div className="p-3 bg-gray-50 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Applications</span>
                <span className="text-xl font-extrabold text-gray-800 block mt-1">28</span>
              </div>
              <div className="p-3 bg-indigo-50/50 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Interviews</span>
                <span className="text-xl font-extrabold text-indigo-800 block mt-1">4</span>
              </div>
              <div className="p-3 bg-green-50/50 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Active Offers</span>
                <span className="text-xl font-extrabold text-green-800 block mt-1">1</span>
              </div>
            </div>
          </div>

          {/* Learning Memory block */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              <Lightbulb className="w-4.5 h-4.5 text-pink-500" /> Violet's Career Learning Logs
            </h3>

            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Parsed Observations</span>
                <div className="space-y-2 mt-1">
                  {memory.learning.observations.map((obs, idx) => (
                    <div key={idx} className="p-3 bg-pink-50/30 border border-pink-100 rounded-xl leading-relaxed text-gray-700">
                      {obs}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Strategic Recommendations</span>
                <div className="space-y-2 mt-1">
                  {memory.learning.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-violet-50/30 border border-violet-100 rounded-xl leading-relaxed text-gray-700">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
