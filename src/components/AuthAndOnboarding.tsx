import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Shield, Compass, Briefcase, Mail, Key, User, 
  MapPin, Trophy, Terminal, ArrowRight, ArrowLeft, Check, Laptop,
  Palette, Cpu, Layers, Zap, TrendingUp, Brain, Server, GraduationCap, Award, Globe, HelpCircle, Building2
} from "lucide-react";
import { UserProfile, CareerMemory } from "../types";
import { loginWithGoogle } from "../firebase";

interface AuthAndOnboardingProps {
  onComplete: (profileData: Partial<UserProfile>, memoryData: Partial<CareerMemory>) => void;
  userEmail?: string;
}

export default function AuthAndOnboarding({ onComplete, userEmail }: AuthAndOnboardingProps) {
  const [screen, setScreen] = useState<"auth" | "onboarding">("auth");
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  
  // Auth Form states pre-filled for rapid one-click demo but fully interactive
  const [email, setEmail] = useState(userEmail || "john.doe@uw.edu");
  const [password, setPassword] = useState("violetcore_pwd");
  const [fullName, setFullName] = useState("John Doe");

  const [authError, setAuthError] = useState("");
  const [isSigniningIn, setIsSigningIn] = useState(false);

  // Onboarding phase state (4 phases)
  const [phase, setPhase] = useState(1);
  const totalPhases = 4;

  // Onboarding preferences - quickly selectable
  const [selectedFocus, setSelectedFocus] = useState<string>("");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const handleGoogleSignInClick = async () => {
    setIsSigningIn(true);
    setAuthError("");
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        setFullName(fbUser.displayName || "Google Candidate");
        setEmail(fbUser.email || "sayojami2007@gmail.com");
        setScreen("onboarding");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to authenticate. Please verify popups are allowed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGoogleSignInClick();
  };

  const handleSkipOrDirectComplete = () => {
    // Quick completion with preselected elements if skipped or instantly configured
    const mockProfile: Partial<UserProfile> = {
      fullName: fullName,
      email: email,
      skills: ["React", "TypeScript", "Node.js", "TailwindCSS", "Python", "SQL"],
    };
    const mockMemory: Partial<CareerMemory> = {
      identity: {
        skills: ["React", "TypeScript", "Node.js", "TailwindCSS"],
        education: ["UW Computer Science"],
        projects: ["SummaStudy Summary Agent", "Presently Daily Compass"]
      },
      preference: {
        preferredRoles: ["Software Engineer", "AI Product Engineer"],
        preferredLocations: ["Seattle, WA", "Remote"],
        remotePreference: true
      }
    };
    onComplete(mockProfile, mockMemory);
  };

  const handleFinishOnboarding = () => {
    // Compile choices to update global Master Profile and Career Memory models
    const skillsToAppend: string[] = ["React", "TypeScript", "Node.js", "Express", "TailwindCSS"];
    if (selectedFocus === "AI") skillsToAppend.push("LLMs", "Vector DBs", "Prompt Tuning");
    if (selectedFocus === "Backend") skillsToAppend.push("PostgreSQL", "Docker", "REST APIs");
    if (selectedWeapon === "polish") skillsToAppend.push("CSS Transitions", "Figma", "UI Design");

    const preferredRole = selectedFocus === "AI" ? "AI Product Engineer" 
                        : selectedFocus === "Backend" ? "Backend Core Architect" 
                        : selectedFocus === "Frontend" ? "Frontend Architect" 
                        : "Full Stack Engineer";

    const customProfile: Partial<UserProfile> = {
      fullName: fullName,
      email: email,
      location: selectedLocation || "Seattle, WA",
      skills: skillsToAppend,
    };

    const customMemory: Partial<CareerMemory> = {
      identity: {
        skills: skillsToAppend.slice(0, 5),
        education: [selectedLevel || "University of Washington Junior Explorer"],
        projects: ["SummaStudy Study Hub", "Presently Daily Compass"]
      },
      preference: {
        preferredRoles: [preferredRole],
        preferredLocations: [selectedLocation || "Seattle, WA", "Remote"],
        remotePreference: selectedLocation === "Remote"
      },
      history: {
        applications: ["Stripe", "Anthropic", "Vercel"],
        interviews: [],
        offers: []
      }
    };

    onComplete(customProfile, customMemory);
  };

  // Duolingo-style neutral layout colors (zinc, white, black, gray)
  const isFormValid = email.trim() !== "" && password.trim() !== "";

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-4">
      
      {/* Outer chunky skeuomorphic container */}
      <div className="w-full max-w-md bg-white border-2 border-zinc-350 rounded-3xl shadow-[0_8px_0_0_#e4e4e7] p-8 relative overflow-hidden transition-all">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-zinc-950 text-white rounded-xl flex items-center justify-center text-md font-extrabold shadow-[0_3px_0_0_#52525b]">
            V
          </div>
          <div>
            <h2 className="text-zinc-950 text-base font-extrabold tracking-tight">VIOLET CO-PILOT</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">The Intelligent Chief-of-Staff</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: LOGIN & SIGNUP */}
          {screen === "auth" && (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Speech bubble instruction */}
              <div className="flex gap-3 items-start bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center flex-shrink-0 shadow-[0_2.5px_0_0_#52525b] border border-zinc-800">
                  <Compass className="w-4 h-4 text-zinc-100" />
                </div>
                <div className="text-xs text-zinc-600 font-medium leading-relaxed">
                  Welcome, candidate. Authenticate your secure sandbox profile using Google to calibrate your master resume, tracking boards, and interview preps.
                </div>
              </div>

              {authError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  {authError}
                </div>
              )}

              {/* Secure Google Login Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isSigniningIn}
                  className={`w-full h-14 rounded-2xl font-extrabold text-xs tracking-wider transition-all transform flex items-center justify-center gap-3 cursor-pointer ${
                    isSigniningIn
                      ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                      : "bg-white text-zinc-900 shadow-[0_5px_0_0_#d4d4d8] border-2 border-zinc-200 hover:border-zinc-400 active:translate-y-[4px] active:shadow-none"
                  }`}
                >
                  {isSigniningIn ? (
                    <>
                      <span className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></span>
                      CONNECTING SECURE AUTH...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      SIGN IN WITH GOOGLE
                    </>
                  )}
                </button>
              </div>

              {/* Quick bypass element */}
              <div className="text-center pt-2">
                <button 
                  onClick={handleSkipOrDirectComplete}
                  className="text-[10px] uppercase tracking-wider hover:text-zinc-900 transition-colors cursor-pointer text-zinc-400 font-bold border-b border-dashed border-zinc-200"
                >
                  Skip Auth & Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: SKEUOMORPHIC MULTI-PHASE ONBOARDING FLOW */}
          {screen === "onboarding" && (
            <motion.div
              key="onboarding-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-450 tracking-wider">
                  <span>ONBOARDING CALIBRATION</span>
                  <span className="font-mono">{phase} / {totalPhases}</span>
                </div>
                {/* Chunky Duolingo Progress bar */}
                <div className="w-full h-4 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(phase / totalPhases) * 100}%` }}
                    className="h-full bg-zinc-900 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              {/* Speech bubble avatar conversation dialogue */}
              <div className="flex gap-3 items-start bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center flex-shrink-0 shadow-[0_2.5px_0_0_#52525b] border border-zinc-800">
                  <Compass className="w-4 h-4 text-zinc-100" />
                </div>
                <div className="text-xs text-zinc-600 font-medium leading-relaxed">
                  {phase === 1 && "Hello candidate! First, let me configure my analytical lenses. What is your primary career target?"}
                  {phase === 2 && "Splendid choice! And tell me, what is your premier technical engineering weapon?"}
                  {phase === 3 && "Excellent. And where is your dream geographic workstation or timezone?"}
                  {phase === 4 && "Almost calibrated! Finally, what is your present professional coordinate level?"}
                </div>
              </div>
 
              {/* CARD PHASES (Quick selectable, no keyboard inputs needed!) */}
              <div className="space-y-3 min-h-[190px]">
                
                {/* PHASE 1: Target Focus */}
                {phase === 1 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "Frontend", title: "Frontend Architect", icon: Palette, desc: "Design & speed" },
                      { id: "Backend", title: "Backend Core", icon: Cpu, desc: "APIs & Databases" },
                      { id: "FullStack", title: "Full Stack Engineer", icon: Layers, desc: "Complete spectrum" },
                      { id: "AI", title: "AI Systems Innovator", icon: Zap, desc: "LLMs & Agentics" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedFocus(item.id);
                          // Automatic slide to next phase for rapid smooth completion!
                          setTimeout(() => setPhase(2), 250);
                        }}
                        className={`p-3.5 text-left border-2 rounded-2xl flex flex-col justify-between transition-all cursor-pointer h-24 ${
                          selectedFocus === item.id 
                            ? "bg-zinc-50 border-zinc-950 shadow-[0_4px_0_0_#18181b] translate-y-[2px]" 
                            : "bg-white border-zinc-200 hover:border-zinc-300 shadow-[0_4px_0_0_#e4e4e7] hover:scale-[1.01]"
                        }`}
                      >
                        <div className="text-zinc-700">
                          <item.icon className="w-5 h-5 text-zinc-800" />
                        </div>
                        <div>
                          <div className="text-[11px] font-extrabold text-zinc-900 leading-tight">{item.title}</div>
                          <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
 
                {/* PHASE 2: Technical Weapon */}
                {phase === 2 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "polish", title: "Visual & UX Polish", icon: Sparkles, desc: "Figma and styling" },
                      { id: "db", title: "API and DB Speed", icon: TrendingUp, desc: "SQL structures" },
                      { id: "agentic", title: "LLM Chains & AI", icon: Brain, desc: "Gemini frameworks" },
                      { id: "docker", title: "Deployments", icon: Server, desc: "Container pipeline" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedWeapon(item.id);
                          setTimeout(() => setPhase(3), 250);
                        }}
                        className={`p-3.5 text-left border-2 rounded-2xl flex flex-col justify-between transition-all cursor-pointer h-24 ${
                          selectedWeapon === item.id 
                            ? "bg-zinc-50 border-zinc-950 shadow-[0_4px_0_0_#18181b] translate-y-[2px]" 
                            : "bg-white border-zinc-200 hover:border-zinc-300 shadow-[0_4px_0_0_#e4e4e7] hover:scale-[1.01]"
                        }`}
                      >
                        <div className="text-zinc-700">
                          <item.icon className="w-5 h-5 text-zinc-800" />
                        </div>
                        <div>
                          <div className="text-[11px] font-extrabold text-zinc-900 leading-tight">{item.title}</div>
                          <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
 
                {/* PHASE 3: Location */}
                {phase === 3 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "Seattle, WA", title: "Seattle Workstation", icon: MapPin, desc: "Tech Hybrid Hub" },
                      { id: "San Francisco, CA", title: "San Francisco Hub", icon: Compass, desc: "SOMA Core Center" },
                      { id: "Remote", title: "Remote Anywhere", icon: Globe, desc: "Global telemetry" },
                      { id: "New York, NY", title: "New York Hub", icon: Building2, desc: "Fintech Grid" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedLocation(item.id);
                          setTimeout(() => setPhase(4), 250);
                        }}
                        className={`p-3.5 text-left border-2 rounded-2xl flex flex-col justify-between transition-all cursor-pointer h-24 ${
                          selectedLocation === item.id 
                            ? "bg-zinc-50 border-zinc-950 shadow-[0_4px_0_0_#18181b] translate-y-[2px]" 
                            : "bg-white border-zinc-200 hover:border-zinc-300 shadow-[0_4px_0_0_#e4e4e7] hover:scale-[1.01]"
                        }`}
                      >
                        <div className="text-zinc-700">
                          <item.icon className="w-5 h-5 text-zinc-800" />
                        </div>
                        <div>
                          <div className="text-[11px] font-extrabold text-zinc-900 leading-tight">{item.title}</div>
                          <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
 
                {/* PHASE 4: Level coordinate */}
                {phase === 4 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "Student", title: "UW CS Student", icon: GraduationCap, desc: "Junior Explorer" },
                      { id: "Junior", title: "Junior Engineer", icon: Zap, desc: "0-2 Years exposure" },
                      { id: "Mid", title: "Experienced SWE", icon: Laptop, desc: "Product developer" },
                      { id: "Senior", title: "Principal core", icon: Award, desc: "Systems architect" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedLevel(item.id);
                          // Complete automatically or allow clicking FINISH button
                        }}
                        className={`p-3.5 text-left border-2 rounded-2xl flex flex-col justify-between transition-all cursor-pointer h-24 ${
                          selectedLevel === item.id 
                            ? "bg-zinc-50 border-zinc-950 shadow-[0_4px_0_0_#18181b] translate-y-[2px]" 
                            : "bg-white border-zinc-200 hover:border-zinc-300 shadow-[0_4px_0_0_#e4e4e7] hover:scale-[1.01]"
                        }`}
                      >
                        <div className="text-zinc-700">
                          <item.icon className="w-5 h-5 text-zinc-800" />
                        </div>
                        <div>
                          <div className="text-[11px] font-extrabold text-zinc-900 leading-tight">{item.title}</div>
                          <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer controls inside Onboarding sheet */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 mt-4">
                {phase > 1 ? (
                  <button
                    type="button"
                    onClick={() => setPhase(prev => prev - 1)}
                    className="h-11 px-4 text-xs font-extrabold bg-white border border-zinc-250 text-zinc-700 rounded-xl shadow-[0_3px_0_0_#e4e4e7] active:translate-y-[3px] active:shadow-none cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> BACK
                  </button>
                ) : (
                  <div />
                )}

                {phase < totalPhases ? (
                  <button
                    type="button"
                    onClick={() => setPhase(prev => prev + 1)}
                    className="h-11 px-5 text-xs font-extrabold bg-zinc-900 text-white border border-zinc-800 rounded-xl shadow-[0_3px_0_0_#52525b] active:translate-y-[3px] active:shadow-none cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    CONTINUE <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    className="h-11 px-6 text-xs font-extrabold bg-zinc-950 text-white border border-zinc-800 rounded-xl shadow-[0_4px_0_0_#52525b] active:translate-y-[3px] active:shadow-none cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    FINISH SETUP <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
