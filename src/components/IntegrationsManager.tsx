import React, { useState, useEffect } from "react";
import { 
  Send, Link, CheckCircle2, AlertCircle, ExternalLink, 
  Mail, Calendar, Github, ShieldCheck, Zap
} from "lucide-react";
import { motion } from "motion/react";

export default function IntegrationsManager() {
  const [status, setStatus] = useState<any>({
    telegram: { connected: false, botName: "@VioletCareerBot" },
    composio: { connected: false, apps: [] },
    google: { connected: false },
    github: { connected: false, username: null }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const [oauthRes, composioRes] = await Promise.all([
        fetch("/api/oauth/status"),
        fetch("/api/composio/status")
      ]);
      
      const oauthData = await oauthRes.json();
      const composioData = await composioRes.json();
      
      setStatus({
        telegram: { connected: !!localStorage.getItem("telegram_connected"), botName: "@VioletCareerBot" },
        composio: { 
          connected: composioData.configured && composioData.connections.length > 0, 
          apps: composioData.connections.map((c: any) => c.toolName) 
        },
        google: oauthData.google,
        github: oauthData.github
      });
    } catch (err) {
      console.error("Failed to fetch integration status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (provider: string) => {
    if (provider === "google") {
      // Direct to Composio Google OAuth for GMAIL/CALENDAR integration
      window.location.href = "/api/composio/connect/GMAIL";
      return;
    }
    if (provider === "github") {
      // Direct to service-specific mining or Appwrite account linking
      alert("GitHub integration is currently managed via master profile linking.");
      return;
    }
    if (provider === "composio_gmail") window.location.href = "/api/composio/connect/GMAIL";
    if (provider === "composio_calendar") window.location.href = "/api/composio/connect/GOOGLE_CALENDAR";
    if (provider === "telegram") {
      window.open(`https://t.me/VioletCareerBot`, "_blank");
      localStorage.setItem("telegram_connected", "true");
      setStatus((prev: any) => ({ ...prev, telegram: { ...prev.telegram, connected: true } }));
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      if (provider === "google" || provider === "github") {
        // Appwrite logout handles this
        console.log("Use master sign-out to disconnect auth providers.");
        return;
      }
      if (provider === "telegram") localStorage.removeItem("telegram_connected");
      fetchStatus();
    } catch (err) {
      console.error(`Failed to disconnect ${provider}:`, err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white border border-gray-150 rounded-2xl">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
          <Zap className="w-5 h-5 text-violet-500" /> Integration Control Center
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Connect your external career tools to Violet. This enables live email scanning, calendar synchronization, and mobile access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Telegram Bot */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Telegram Bot</h3>
                <p className="text-[10px] text-gray-500 font-medium">Mobile Career Assistant</p>
              </div>
            </div>
            {status.telegram.connected ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-100">
                DISCONNECTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Chat with Violet on the go. Get job alerts, review resume drafts, and prep for interviews directly from Telegram.
          </p>
          <div className="pt-2">
            {status.telegram.connected ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => handleConnect("telegram")}
                  className="flex-1 p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[11px] font-bold rounded-xl border border-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> OPEN BOT
                </button>
                <button 
                  onClick={() => handleDisconnect("telegram")}
                  className="p-2.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleConnect("telegram")}
                className="w-full p-2.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                CONNECT TELEGRAM
              </button>
            )}
          </div>
        </div>

        {/* Composio / Gmail */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Gmail via Composio</h3>
                <p className="text-[10px] text-gray-500 font-medium">Recruiter Email Intel</p>
              </div>
            </div>
            {status.google.connected || status.composio.apps.includes("GMAIL") ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> CONNECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-100">
                DISCONNECTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Allow Violet to scan your Gmail for recruiter messages. Uses Composio for secure, managed tool connections.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => handleConnect("composio_gmail")}
              className="w-full p-2.5 bg-white hover:bg-gray-50 text-gray-900 text-[11px] font-bold rounded-xl border-2 border-zinc-200 shadow-[0_2px_0_0_#e4e4e7] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Link className="w-3.5 h-3.5" /> AUTHORIZE GMAIL
            </button>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Google Calendar</h3>
                <p className="text-[10px] text-gray-500 font-medium">Interview Scheduling</p>
              </div>
            </div>
            {status.google.connected || status.composio.apps.includes("GOOGLE_CALENDAR") ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SYNCED
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-100">
                INACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sync your interviews and deadlines to your Google Calendar. Violet will automatically add events for approved schedules.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => handleConnect("composio_calendar")}
              className="w-full p-2.5 bg-white hover:bg-gray-50 text-gray-900 text-[11px] font-bold rounded-xl border-2 border-zinc-200 shadow-[0_2px_0_0_#e4e4e7] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Link className="w-3.5 h-3.5" /> LINK CALENDAR
            </button>
          </div>
        </div>

        {/* GitHub */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">GitHub</h3>
                <p className="text-[10px] text-gray-500 font-medium">Project Achievement Mining</p>
              </div>
            </div>
            {status.github.connected ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> @{status.github.username}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-100">
                DISCONNECTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Connect GitHub to allow Violet to automatically detect new project achievements and suggest resume bullet points.
          </p>
          <div className="pt-2">
            {status.github.connected ? (
              <button 
                onClick={() => handleDisconnect("github")}
                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-bold rounded-xl border border-gray-200 transition-all cursor-pointer"
              >
                DISCONNECT GITHUB
              </button>
            ) : (
              <button 
                onClick={() => handleConnect("github")}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                CONNECT GITHUB
              </button>
            )}
          </div>
        </div>

      </div>

      <div className="p-5 bg-violet-50 border border-violet-100 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-violet-900">Privacy & Security Guarantee</h4>
          <p className="text-[10px] text-violet-700 mt-1 leading-relaxed">
            Violet uses scoped OAuth2 permissions and managed tool connections via Composio. We only request read access to relevant data and never store your credentials directly on our servers. You can revoke access at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
