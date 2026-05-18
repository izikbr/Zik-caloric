import { useState, useEffect } from "react";
import { UserProfile, FastingSession, FastingMode } from "../types";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy, limit } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Timer, Play, Square, Info, History, Flame, Droplets, Zap } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

export default function Fasting({ profile }: { profile: UserProfile }) {
  const [activeSession, setActiveSession] = useState<FastingSession | null>(null);
  const [mode, setMode] = useState<FastingMode>("16:8");
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const modes: Record<FastingMode, number> = {
    "16:8": 16 * 3600,
    "18:6": 18 * 3600,
    "20:4": 20 * 3600,
    "OMAD": 23 * 3600,
  };

  useEffect(() => {
    const q = query(
      collection(db, "users", profile.userId, "fasts"),
      where("status", "==", "active"),
      orderBy("startTime", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const session = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FastingSession;
        setActiveSession(session);
        setMode(session.mode);
      } else {
        setActiveSession(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [profile.userId]);

  useEffect(() => {
    let interval: any;
    if (activeSession) {
      interval = setInterval(() => {
        const diff = differenceInSeconds(new Date(), new Date(activeSession.startTime));
        setElapsed(diff);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const startFast = async () => {
    try {
      await addDoc(collection(db, "users", profile.userId, "fasts"), {
        userId: profile.userId,
        startTime: new Date().toISOString(),
        mode: mode,
        status: "active"
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "fasts");
    }
  };

  const endFast = async () => {
    if (!activeSession) return;
    try {
      await updateDoc(doc(db, "users", profile.userId, "fasts", activeSession.id!), {
        endTime: new Date().toISOString(),
        status: "completed"
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `fasts/${activeSession.id}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetSeconds = modes[mode];
  const progress = Math.min((elapsed / targetSeconds) * 100, 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-12 flex flex-col items-center text-slate-800">
      <header className="w-full mb-12 text-center">
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">צום לסירוגין</h1>
        <p className="text-slate-400 font-bold tracking-tight uppercase text-xs">שפר את הבריאות שלך עם מעקב צום חכם</p>
      </header>

      <main className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Timer Circle */}
        <div className="relative w-72 h-72">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="130"
              stroke="currentColor"
              strokeWidth="20"
              fill="transparent"
              className="text-slate-50 shadow-inner"
            />
            <circle
              cx="144"
              cy="144"
              r="130"
              stroke="currentColor"
              strokeWidth="20"
              fill="transparent"
              strokeDasharray={816}
              strokeDashoffset={816 - (816 * progress) / 100}
              strokeLinecap="round"
              className="text-indigo-500 transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Timer className="text-slate-200 mb-2" size={32} />
            <span className="text-5xl font-black text-slate-800 font-mono tracking-tighter">
              {activeSession ? formatDuration(elapsed) : "00:00:00"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-none font-sans">
              {activeSession ? `יעד: ${mode}` : "מוכן להתחלה"}
            </span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 w-full">
           <div className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <Flame size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">מצב</span>
                <span className="text-sm font-bold text-slate-800">{elapsed > modes[mode] ? "חלון אכילה" : "צום פעיל"}</span>
              </div>
           </div>
           <div className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Zap size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">רצף</span>
                <span className="text-sm font-bold text-slate-800 font-mono">3 ימים</span>
              </div>
           </div>
        </div>

        {/* Controls */}
        <div className="w-full space-y-6">
          {!activeSession ? (
            <div className="space-y-4">
              <div className="bg-white p-2 rounded-2xl flex gap-1 border border-slate-100 shadow-sm">
                {(Object.keys(modes) as FastingMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                      mode === m ? "bg-slate-900 text-white shadow-sm scale-[1.05]" : "text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={startFast}
                className="w-full bg-green-600 text-white py-5 rounded-[28px] font-bold text-xl shadow-2xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                id="start-fast-btn"
              >
                <Play size={24} fill="currentColor" /> התחל צום
              </button>
            </div>
          ) : (
            <button
              onClick={endFast}
              className="w-full bg-[#0F172A] text-white py-5 rounded-[28px] font-bold text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              id="stop-fast-btn"
            >
              <Square size={24} fill="currentColor" /> סיים צום
            </button>
          )}
        </div>

        <div className="bg-indigo-50/50 p-6 rounded-[32px] w-full border border-indigo-100/50 flex gap-4">
           <Info className="text-indigo-600 shrink-0" />
           <div>
              <h4 className="text-sm font-bold text-indigo-900 mb-1">הידעת?</h4>
              <p className="text-xs font-medium text-indigo-700 leading-relaxed">
                צום של 16 שעות עוזר לגוף להיכנס למצב של אוטופגיה - תהליך של ניקוי תאים עצמי ושיפור המטבוליזם.
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}
