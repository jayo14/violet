import React, { useState, useEffect } from "react";
import { 
  Sparkles, Compass, ShieldAlert, Target, Award, LayoutGrid, 
  Mail, Calendar, Briefcase, BookOpen, Settings, User, Terminal, Check, Menu, X, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Sub-component Imports
import DashboardOverview from "./components/DashboardOverview";
import VioletChat from "./components/VioletChat";
import OpportunityAnalyzer from "./components/OpportunityAnalyzer";
import ResumeTailor from "./components/ResumeTailor";
import EmailIntelligence from "./components/EmailIntelligence";
import ApplicationTracker from "./components/ApplicationTracker";
import InterviewPrepComp from "./components/InterviewPrepComp";
import MemoryVault from "./components/MemoryVault";
import ProfileManager from "./components/ProfileManager";
import IntegrationsManager from "./components/IntegrationsManager";
import AuthAndOnboarding from "./components/AuthAndOnboarding";
import CherryBlossomBackground from "./components/CherryBlossomBackground";

import { 
  UserProfile, Opportunity, EmailIntel, Achievement, 
  ApprovalRequest, CareerMemory, ApplicationStatus 
} from "./types";

// Supabase Import
import { supabase } from "./utils/supabase";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);

  // Authentication and Duolingo onboarding screen indicators
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Unified global state variables
  const [profile, setProfile] = useState<UserProfile>({
    id: "default-profile",
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
    skills: ["TypeScript", "React", "Node.js", "Express", "TailwindCSS", "Python", "Docker", "SQL", "Git"],
    experience: [
      {
        company: "TechCorp Labs",
        role: "Software Engineering Intern",
        location: "Seattle (Remote)",
        startDate: "2025-06-01",
        endDate: "2025-09-01",
        description: "Implemented a rich web application dashboard using React and Recharts. Improved initial page loading speed by 35% through image rendering optimizations."
      }
    ]
  });

  const [applications, setApplications] = useState<Opportunity[]>([]);
  const [emails, setEmails] = useState<EmailIntel[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [memory, setMemory] = useState<CareerMemory>({
    identity: {
      skills: ["React", "TypeScript", "Node.js", "TailwindCSS"],
      education: ["B.S. CS @ University of Washington (GPA: 3.85)"],
      projects: ["SummaStudy Summarizer", "Presently weather tracker"]
    },
    preference: {
      preferredRoles: ["Frontend Developer", "AI Product Engineer"],
      preferredLocations: ["Seattle, WA", "Remote"],
      remotePreference: true
    },
    history: {
      applications: [],
      interviews: [],
      offers: []
    },
    learning: {
      observations: ["Tech platform recruiters respond positively to modular, styled GitHub repositories."],
      recommendations: ["Directly detail custom CSS animations and responsive builds on resume bullets."]
    }
  });

  // Active items selected for secondary modules
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [analysisContext, setAnalysisContext] = useState<any>(null);


  // Supabase Auth + Data Sync
  useEffect(() => {
    setIsLoading(true);
    
    const initializeApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const userId = session.user.id;
        setUserId(userId);
        setIsLoggedIn(true);

        // Fetch User Data
        const [profileRes, appsRes, emailsRes, achRes, apprRes] = await Promise.all([
          supabase.from('users').select().eq('userId', userId).single(),
          supabase.from('applications').select().eq('userId', userId),
          supabase.from('emails').select().eq('userId', userId),
          supabase.from('achievements').select().eq('userId', userId),
          supabase.from('approvals').select().eq('userId', userId),
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data as UserProfile);
          setIsOnboarded(true);
        }
        
        if (appsRes.data) setApplications(appsRes.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        if (emailsRes.data) setEmails(emailsRes.data.sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()));
        if (achRes.data) setAchievements(achRes.data.sort((a: any, b: any) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()));
        if (apprRes.data) setApprovals(apprRes.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
      setIsLoading(false);
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // API Callbacks for subcomponents
  const handleSendMessage = async (msg: string): Promise<{ reply: string; styleProfile?: any }> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, chatHistory: [], userId })
      });
      if (res.ok) {
        const data = await res.json();
        return { reply: data.reply, styleProfile: data.styleProfile };
      }
    } catch (err) {
      console.error(err);
    }
    return { reply: "Violet Core AI: Failed to coordinate. Falling back to emergency guidelines." };
  };

  const handleAnalyzeOpportunity = async (jd: string) => {
    const res = await fetch("/api/analyze-opportunity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jd, userId })
    });
    if (!res.ok) throw new Error("Failed opportunity audit specifications.");
    const data = await res.json();
    return { opportunity: data.opportunity, analysis: data.analysis };
  };

  const handleGenerateTailored = async (opp: Opportunity) => {
    const res = await fetch("/api/tailor-materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id, jobTitle: opp.title, company: opp.company, jobRequirements: opp.requirements, resumeSnapshot: profile.experience, userId })
    });
    if (!res.ok) throw new Error("Tailoring error logs parsed.");
    return await res.json();
  };

  const handleGeneratePrep = async (opp: Opportunity) => {
    const res = await fetch("/api/interview-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: opp.title, company: opp.company, requirements: opp.requirements, userId })
    });
    if (!res.ok) throw new Error("Interview generation sync error.");
    const data = await res.json();
    return { id: "prep-" + opp.id, opportunityId: opp.id, company: opp.company, role: opp.title, research: data.prep?.research || {}, technicalQuestions: data.prep?.technicalQuestions || [], hrQuestions: data.prep?.hrQuestions || [] };
  };

  const handleMineGithub = async (repo: string) => {
    try {
      await fetch("/api/mine-github", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ githubRepoUrl: repo, userId }) });
    } catch (err) { console.error(err); }
  };

  const handleTriggerEmailScan = async () => {
    try {
      await fetch("/api/scan-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    } catch (err) { console.error("Ad-hoc recruiter scan coordination failed:", err); }
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ ...updatedProfile, userId });
      if (error) throw error;
      
      await fetch("/api/update-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: updatedProfile, userId }) });
      setProfile(updatedProfile);
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  const handleApprove = async (id: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('approvals')
        .update({ status: "approved" })
        .eq('id', id);
      if (error) throw error;
      
      const approvedItem = approvals.find((a) => a.id === id);
      if (!approvedItem) return;
      
      if (approvedItem.type === "resume-variant") {
        const newDesc = `${profile.experience[0]?.description || ""} Approved Tailored Component: ${approvedItem.payload.tailoredBullet}`;
        const updatedExp = [...profile.experience];
        if (updatedExp[0]) updatedExp[0].description = newDesc;
        await handleUpdateProfile({ ...profile, experience: updatedExp });
      } else if (approvedItem.type === "add-achievement") {
        await supabase
          .from('achievements')
          .update({ isAppliedToResume: true })
          .eq('id', approvedItem.payload.id);
      }
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a));
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  const handleReject = async (id: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('approvals')
        .update({ status: "rejected" })
        .eq('id', id);
      if (error) throw error;
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" } : a));
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: ApplicationStatus) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error("Update status failed:", err);
    }
  };

  const handleMarkEmailProcessed = async (id: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('emails')
        .update({ processed: true })
        .eq('id', id);
      if (error) throw error;
      setEmails(prev => prev.map(e => e.id === id ? { ...e, processed: true } : e));
    } catch (err) {
      console.error("Mark email processed failed:", err);
    }
  };

  const handleCreateApprovalRequest = async (type: "resume-variant" | "cover-letter" | "cover-email", title: string, description: string, payload: any) => {
    if (!userId) return;
    const newId = crypto.randomUUID();
    const newAppr = { id: newId, type, title, description, payload, status: "pending", createdAt: new Date().toISOString(), userId };
    try {
      const { error } = await supabase
        .from('approvals')
        .insert([newAppr]);
      if (error) throw error;
      setApprovals(prev => [newAppr as any, ...prev]);
    } catch (err) {
      console.error("Create approval failed:", err);
    }
  };

  // Navigation callbacks
  const handleNavToTailor = (opp: Opportunity, analysis: any) => {
    setSelectedOpportunity(opp);
    setAnalysisContext(analysis);
    setActiveTab("tailor");
  };

  const handleOnboardingComplete = async (completedProfile: Partial<UserProfile>, completedMemory: Partial<CareerMemory>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    const profileData = {
      id: uid, userId: uid,
      fullName: completedProfile.fullName || "Candidate",
      email: completedProfile.email || profile.email,
      phone: profile.phone, github: profile.github, linkedin: profile.linkedin,
      portfolio: profile.portfolio, location: completedProfile.location || "Seattle, WA",
      education: profile.education, skills: completedProfile.skills || profile.skills,
      experience: profile.experience
    };
    
    // ... (memory data logic)

    try {
      const { error } = await supabase
        .from('users')
        .upsert(profileData);
      if (error) throw error;
      
      await fetch("/api/init-user", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, profile: profileData, memory: completedMemory })
      });
      setUserId(uid);
      setIsLoggedIn(true);
      setIsOnboarded(true);
    } catch (err) {
      console.error("Onboarding failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 font-sans">
        <span className="text-4xl sakura-spin">🌸</span>
        <h2 className="text-sm font-semibold text-gray-800 mt-4 animate-pulse">Synchronizing Violet Telemetry...</h2>
      </div>
    );
  }

  if (!isLoggedIn || !isOnboarded) {
    return <AuthAndOnboarding onComplete={handleOnboardingComplete} userEmail={profile.email} />;
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard Hub", icon: LayoutGrid },
    { id: "copilot", label: "Speak to Violet", icon: Compass },
    { id: "analyzer", label: "Specs Analyzer", icon: Target },
    { id: "tailor", label: "Tailored Materials", icon: Sparkles },
    { id: "tracker", label: "Career Tracker", icon: Briefcase },
    { id: "email-intel", label: "Email Intel", icon: Mail },
    { id: "interview-prep", label: "Interview Preps", icon: Calendar },
    { id: "memory-vault", label: "Memory Vault", icon: BookOpen },
    { id: "profile", label: "Master Profile", icon: User },
    { id: "integrations", label: "Integrations", icon: Zap }
  ];

  const isSecondaryTab = ["analyzer", "email-intel", "interview-prep", "memory-vault", "profile", "integrations"].includes(activeTab);

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#18181b] flex flex-col font-sans transition-all selection:bg-zinc-200 selection:text-zinc-900">
      <CherryBlossomBackground />
      {/* Outer master top bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs relative overflow-hidden">
            🌸
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 flex items-center gap-1.5">
              Violet <span className="text-[9px] uppercase tracking-widest font-semibold text-zinc-700 px-1.5 py-0.5 bg-zinc-100 rounded">Career OS</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium">Approval-driven Career Assistant Engine</p>
          </div>
        </div>

        {/* Global Live status */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full animate-pulse"></span>
            <span className="font-medium text-zinc-650">Violet Agent Layer: Ready</span>
          </div>
          <span className="hidden md:inline px-2 py-0.5 bg-zinc-50 text-zinc-500 text-[10px] font-mono rounded border border-zinc-200">
            STABLE_PRO_V35
          </span>
          <button 
            type="button"
            onClick={async () => await supabase.auth.signOut()}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 border border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50 rounded transition-all cursor-pointer shadow-[0_1.5px_0_0_#e4e4e7] active:translate-y-[1px] active:shadow-none"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main body viewport */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar/Rail - Desktop Only (hidden on mobile) */}
        <nav className="hidden md:flex md:w-60 flex-col md:space-y-0.5 bg-transparent flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer w-full ${
                  isActive 
                    ? "bg-zinc-900 text-white shadow-xs" 
                    : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic active tab page renderer */}
        <main className="flex-1 overflow-x-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === "dashboard" && (
                <DashboardOverview 
                  applications={applications} 
                  emails={emails}
                  achievements={achievements}
                  approvals={approvals}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onTriggerMine={handleMineGithub}
                  onNavigate={setActiveTab}
                  onSelectOpportunity={(opp) => {
                    setSelectedOpportunity(opp);
                    setActiveTab("tailor");
                  }}
                />
              )}

              {activeTab === "copilot" && (
                <VioletChat 
                  onSendMessage={handleSendMessage} 
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === "analyzer" && (
                <OpportunityAnalyzer 
                  onAnalyze={handleAnalyzeOpportunity}
                  onAddToTracker={(opp) => {
                    setApplications(prev => [opp, ...prev]);
                    setActiveTab("tracker");
                  }}
                  onNavigateToTailor={handleNavToTailor}
                />
              )}

              {activeTab === "tailor" && (
                <ResumeTailor 
                  selectedOpportunity={selectedOpportunity}
                  analysisContext={analysisContext}
                  onGenerateTailored={handleGenerateTailored}
                  onCreateApproval={handleCreateApprovalRequest}
                  applications={applications}
                />
              )}

              {activeTab === "email-intel" && (
                <EmailIntelligence 
                  emails={emails}
                  onMarkProcessed={handleMarkEmailProcessed}
                  onTriggerScan={handleTriggerEmailScan}
                  onComposeResponse={(mail) => {
                    // Create pending approval request matching compiled outreach
                    const responseTitle = `Suggested Outreach for ${mail.sender.split("@")[0]}`;
                    const customOutreachPayload = {
                      to: mail.sender,
                      subject: `Re: ${mail.subject}`,
                      body: `Hi Team,\n\nThank you for reaching out! I would love to connect further. I can coordinate with schedules next Tuesday if needed.\n\nBest regards,\nJohn Doe`
                    };
                    handleCreateApprovalRequest("cover-email", responseTitle, "Suggested prompt outreach response", customOutreachPayload);
                    setActiveTab("dashboard");
                  }}
                  onNavigateToPrep={(company, role) => {
                    // Seed opportunity mock for instant interview prep pages
                    const oppObj: Opportunity = {
                      id: "opp-emailint",
                      title: role,
                      company: company,
                      location: "Remote",
                      requirements: ["React", "Express", "Type Architectures"],
                      status: "INTERVIEW" as any,
                      createdAt: new Date().toISOString()
                    };
                    setApplications(prev => [oppObj, ...prev]);
                    setSelectedOpportunity(oppObj);
                    setActiveTab("interview-prep");
                  }}
                />
              )}

              {activeTab === "tracker" && (
                <ApplicationTracker 
                  applications={applications}
                  onUpdateStatus={handleUpdateStatus}
                  onSelectApplication={(opp) => {
                    setSelectedOpportunity(opp);
                    setActiveTab("tailor");
                  }}
                  onNavigateToTab={setActiveTab}
                />
              )}

              {activeTab === "interview-prep" && (
                <InterviewPrepComp 
                  onGeneratePrep={handleGeneratePrep}
                  applications={applications}
                />
              )}

              {activeTab === "memory-vault" && (
                <MemoryVault 
                  memory={memory}
                  onUpdateMemory={setMemory}
                />
              )}

              {activeTab === "profile" && (
                <ProfileManager 
                  profile={profile}
                  onUpdateProfile={(p) => {
                    setProfile(p);
                    // Also trigger Express update if live
                    fetch("/api/update-profile", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ profile: p })
                    }).catch(() => {});
                  }}
                />
              )}

              {activeTab === "integrations" && (
                <IntegrationsManager />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Decorative footer */}
      <footer className="bg-white border-t border-gray-150 p-4 px-6 text-center text-[10px] text-gray-400">
        <p>© 2026 Violet operating platform. All rights reserved. Highly styled typography by Inter and Space Grotesk. Crafted with Gemini 3.5 Flash.</p>
      </footer>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-2 py-1.5 shadow-lg flex items-center justify-around">
        <button 
          onClick={() => { setActiveTab("dashboard"); setIsMobileMoreOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "dashboard" ? "text-zinc-900 font-semibold" : "text-zinc-500"
          }`}
          style={{ minWidth: "64px" }}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>
        <button 
          onClick={() => { setActiveTab("copilot"); setIsMobileMoreOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === "copilot" ? "text-zinc-900 font-semibold" : "text-zinc-500"
          }`}
          style={{ minWidth: "64px" }}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Speak</span>
        </button>
        <button 
          onClick={() => { setActiveTab("tailor"); setIsMobileMoreOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "tailor" ? "text-zinc-900 font-semibold" : "text-zinc-500"
          }`}
          style={{ minWidth: "64px" }}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tailor</span>
        </button>
        <button 
          onClick={() => { setActiveTab("tracker"); setIsMobileMoreOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "tracker" ? "text-zinc-900 font-semibold" : "text-zinc-500"
          }`}
          style={{ minWidth: "64px" }}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tracker</span>
        </button>
        <button 
          onClick={() => { setIsMobileMoreOpen(true); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isSecondaryTab || isMobileMoreOpen ? "text-zinc-900 font-semibold" : "text-zinc-500"
          }`}
          style={{ minWidth: "64px" }}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* Mobile-Only Drawer sliding backdrop and panel */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-45"
            />
            
            {/* Smooth Spring Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl border-t border-zinc-200/80 p-6 pb-24 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-md font-bold text-zinc-900">Career OS Suite</h3>
                  <p className="text-[11px] text-zinc-500">Access all of Violet's intelligence modules</p>
                </div>
                <button 
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid with 44px+ tap actions */}
              <div className="grid grid-cols-2 gap-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMoreOpen(false);
                      }}
                      className={`flex flex-col items-start gap-2.5 p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive 
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" 
                          : "bg-zinc-50 hover:bg-zinc-100/60 border-zinc-200 text-zinc-800"
                      }`}
                      style={{ minHeight: "84px" }}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? "bg-zinc-800/80 text-white" : "bg-white/80 text-zinc-500 border border-zinc-200"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold leading-tight">{tab.label}</div>
                        <div className={`text-[9px] mt-0.5 ${isActive ? "text-zinc-300" : "text-zinc-400"}`}>
                          {tab.id === "dashboard" && "Central center"}
                          {tab.id === "copilot" && "Live chat"}
                          {tab.id === "analyzer" && "Job specifications"}
                          {tab.id === "tailor" && "Engine materials"}
                          {tab.id === "tracker" && "Funnel manager"}
                          {tab.id === "email-intel" && "Recruiter filters"}
                          {tab.id === "interview-prep" && "AI mock guidelines"}
                          {tab.id === "memory-vault" && "Experience logs"}
                          {tab.id === "profile" && "Resume profiles"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
