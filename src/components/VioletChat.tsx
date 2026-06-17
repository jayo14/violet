import React from "react";
import { 
  Send, Bot, CornerDownLeft, Sparkles, Check, Phone, Mail, 
  HelpCircle, Clock, Plus, UploadCloud, ChevronRight, AlertCircle, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FormattedText from "./FormattedText";

interface Message {
  id: string;
  sender: "user" | "violet";
  text: string;
  timestamp: string;
  cotSteps?: string[];
}

interface ScribeProfile {
  averageSentenceLength: string;
  formalityLevel: string;
  keyPhrases: string[];
  decisionStyle: string;
  emotionalTone: string;
  adaptationLevel: number;
}

interface VioletChatProps {
  onSendMessage: (msg: string) => Promise<{ reply: string; styleProfile?: ScribeProfile }>;
  onNavigate: (tab: string) => void;
}

export default function VioletChat({ onSendMessage, onNavigate }: VioletChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "msg-123",
      sender: "violet",
      text: "Hey John. I'm Violet.\n\nI check your resumes, track job posts, and keep eye on recruiters' emails.\n\nHow is your day going? Scribe personality calibration is active. Let's chat and I will adapt to your style.",
      timestamp: "10:42 AM"
    }
  ]);
  const [inputText, setInputText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Calibration Memory Profile state
  const [scribeProfile, setScribeProfile] = React.useState<ScribeProfile>(() => {
    const cached = localStorage.getItem("violet_scribe_profile");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {}
    }
    return {
      averageSentenceLength: "medium",
      formalityLevel: "casual",
      keyPhrases: ["it makes sense"],
      decisionStyle: "balanced",
      emotionalTone: "neutral",
      adaptationLevel: 65
    };
  });

  const botCommands = [
    { label: "/digest", tooltip: "Get daily digest summary", text: "Give me my daily digest summary" },
    { label: "/profile", tooltip: "Show current resume/profile", text: "Show my master profile details" },
    { label: "/upload_resume", tooltip: "Guide to parsing resumes", text: "How do I upload and parse a new resume?" },
    { label: "/analyze", tooltip: "Opportunity analysis guide", text: "How do I analyze a job opportunity?" },
    { label: "/applications", tooltip: "Show tracking dashboard", text: "Let's review my application tracking dashboard" },
    { label: "/interviews", tooltip: "Show preparation study guide", text: "Show my interview prep sheets" },
    { label: "/help", tooltip: "Get available commands list", text: "/help" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Call parent / API endpoint to execute live Gemini API queries with style profile tracker
      const resData = await onSendMessage(textToSend);
      
      const replyText = resData.reply;
      if (resData.styleProfile) {
        setScribeProfile(resData.styleProfile);
        localStorage.setItem("violet_scribe_profile", JSON.stringify(resData.styleProfile));
      }

      const violetMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "violet",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, violetMsg]);
    } catch (err) {
      const violetMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "violet",
        text: "Had a small issue coordinating telemetry. I'm keeping your local data safe anyway.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, violetMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[580px]">
      {/* Sidebar: Command Guides / Preset Telegram Controls */}
      <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <span className="p-1 px-2 bg-violet-100 text-violet-700 rounded-md text-xs">TG</span> Telegram Bot CLI
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Simulate interactive chat executions. Violet intercepts these commands on your Telegram feed.
          </p>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-500 block mb-1">Click to trigger:</span>
          {botCommands.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => handleSend(cmd.text)}
              className="w-full text-left p-2.5 hover:bg-violet-50 text-gray-700 hover:text-violet-950 rounded-xl transition-all border border-transparent hover:border-violet-100 flex items-center justify-between text-xs font-semibold group cursor-pointer"
              title={cmd.tooltip}
            >
              <span className="font-mono text-violet-600">{cmd.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-600 transition-colors" />
            </button>
          ))}
        </div>

        <div className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-[11px] text-violet-950 space-y-2.5">
          <p className="font-bold flex items-center gap-1.5 text-xs text-violet-900">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Quiet Adaptive Scribe
          </p>
          
          <div className="space-y-2 text-zinc-600 bg-white/80 p-2.5 rounded-lg border border-violet-100/40">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-zinc-500">Tone Mirroring Sync</span>
              <span className="font-mono font-bold text-violet-700">{scribeProfile.adaptationLevel}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-violet-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${scribeProfile.adaptationLevel}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-600">
            <div className="bg-zinc-50 p-1.5 rounded-md border border-zinc-100/70">
              <span className="text-zinc-400 block text-[8px] uppercase font-bold">Formality</span>
              <span className="font-medium text-zinc-800 capitalize">{scribeProfile.formalityLevel}</span>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded-md border border-zinc-100/70">
              <span className="text-zinc-400 block text-[8px] uppercase font-bold">Vocabulary</span>
              <span className="font-medium text-zinc-800 capitalize">{scribeProfile.averageSentenceLength} flow</span>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded-md border border-zinc-100/70">
              <span className="text-zinc-400 block text-[8px] uppercase font-bold">Emotional Tone</span>
              <span className="font-medium text-zinc-800 capitalize">{scribeProfile.emotionalTone}</span>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded-md border border-zinc-100/70">
              <span className="text-zinc-400 block text-[8px] uppercase font-bold">Mindset Mode</span>
              <span className="font-medium text-zinc-800 capitalize">{scribeProfile.decisionStyle}</span>
            </div>
          </div>

          {scribeProfile.keyPhrases && scribeProfile.keyPhrases.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Learned Slang & Key Phrases</span>
              <div className="flex flex-wrap gap-1">
                {scribeProfile.keyPhrases.map((phrase, idx) => (
                  <span key={phrase + idx} className="bg-violet-100/60 text-violet-800 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md">
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-[11px] text-indigo-950 space-y-2">
          <p className="font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Human Approval Rule
          </p>
          <p className="text-indigo-900 leading-normal">
            Violet can prepare resumes and letters, but lacks clearance to submit applications or transit emails autonomously without explicit Dashboard approvals.
          </p>
        </div>
      </div>

      {/* Main chat viewport */}
      <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-xs">
        {/* Chat header */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 text-white rounded-full flex items-center justify-center relative border border-violet-700 font-extrabold text-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)]">
              V
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                Violet <span className="text-[10px] bg-violet-50 text-violet-600 font-extrabold px-1.5 py-0.5 rounded-sm">Chief of Staff</span>
              </h4>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-300" /> Active • Highly Tuned 
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-gray-500 font-mono bg-white px-2.5 py-1 border rounded-lg">
            gemini-3.5-flash
          </span>
        </div>

        {/* Messages list */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[440px] flex-1">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {msg.sender === "violet" && (
                  <div className="w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border border-violet-500 shadow-sm">
                    V
                  </div>
                )}
                
                <div className={`space-y-1`}>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-violet-600 text-white rounded-br-none font-medium" 
                      : "bg-gray-50 border border-gray-150 text-gray-800 rounded-bl-none"
                  }`}>
                    {msg.sender === "user" ? (
                      msg.text
                    ) : (
                      <FormattedText text={msg.text} />
                    )}
                  </div>
                  <span className={`text-[9px] text-gray-400 block px-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-3 items-center mr-auto max-w-[85%]">
              <div className="w-7 h-7 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 border border-zinc-700">
                <span className="sakura-spin">🌸</span>
              </div>
              <div className="p-3 bg-gray-50 border rounded-2xl rounded-bl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-violet-800 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }} 
            className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1.5 border border-gray-200"
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak to Violet / type telegram command..."
              className="flex-1 text-xs bg-transparent border-none outline-none focus:ring-0 p-2 text-gray-800"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="p-2.5 bg-violet-600 hover:bg-violet-750 disabled:bg-gray-200 text-white rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 flex justify-between items-center px-1">
            <span className="text-[10px] text-gray-400">
              Violet accepts natural english queries. Try typing: <strong>"Tailor my resume for stripe"</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
