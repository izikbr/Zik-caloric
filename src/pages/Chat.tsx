import { useState, useRef, useEffect } from "react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Loader2, Sparkles, Apple, Beef, Flame, TrendingDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat({ profile }: { profile: UserProfile }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `היי ${profile.fullName.split(' ')[0]}! אני המאמן האישי שלך. איך אני יכול לעזור לך היום בדרך ל${profile.goal}?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/nutrition/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "מצטער, חלה שגיאה בחיבור למאמן. נסה שוב מאוחר יותר." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { text: "הצע לי ארוחה עתירת חלבון", icon: Beef },
    { text: "איך לרדת במשקל מהר?", icon: TrendingDown },
    { text: "כמה קלוריות יש בחומוס?", icon: Apple },
    { text: "תפריט לחיטוב", icon: Flame }
  ];

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col pt-12">
      <header className="px-6 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">מאמן תזונה AI</h1>
          <div className="flex items-center gap-1">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">מחובר וזמין</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-t-[40px] shadow-2xl border-t border-slate-100">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
            >
              <div className={`max-w-[85%] p-4 rounded-3xl ${
                m.role === "user" 
                  ? "bg-slate-50 text-slate-800 rounded-tr-none" 
                  : "bg-green-600 text-white rounded-tl-none shadow-xl shadow-green-100"
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-green-600/10 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                <Loader2 size={16} className="text-green-600 animate-spin" />
                <span className="text-sm font-bold text-green-600">המאמן חושב...</span>
              </div>
            </div>
          )}
        </div>

        {messages.length < 3 && !loading && (
          <div className="px-6 pb-4 overflow-x-auto">
            <div className="flex gap-2 whitespace-nowrap">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-400 flex items-center gap-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <s.icon size={14} />
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 pt-2 bg-white border-t border-slate-50">
          <div className="relative flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="w-full bg-slate-50 border-none p-4 pr-6 pl-14 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-green-500 transition-all outline-none"
              placeholder="שאל אותי הכל..."
              dir="rtl"
              id="chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="absolute left-2 p-2.5 bg-green-600 text-white rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50"
              id="chat-send-btn"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 font-bold text-center mt-3 uppercase tracking-widest">
             מופעל ע"י בינה מלאכולתית • קלוריה AI
          </p>
        </div>
      </div>
    </div>
  );
}
