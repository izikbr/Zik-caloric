import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion } from "motion/react";
import { Coffee, Flame, Heart, Sparkles } from "lucide-react";

export default function Landing() {
  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50 blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-50 blur-3xl opacity-50"></div>

      <main className="relative z-10 max-w-lg mx-auto px-6 pt-20 pb-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-200 mb-6 mx-auto rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold text-slate-800 mb-4 tracking-tight">קלוריה AI</h1>
          <p className="text-xl text-slate-500 font-medium">המהפכה הישראלית בתזונה חכמה</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-2 gap-4 mb-12 w-full"
        >
          {[
            { icon: Coffee, text: "מעקב ארוחות", color: "bg-emerald-50 text-emerald-600" },
            { icon: Flame, text: "חישוב קלוריות", color: "bg-orange-50 text-orange-600" },
            { icon: Sparkles, text: "ניתוח תמונות", color: "bg-indigo-50 text-indigo-600" },
            { icon: Heart, text: "מאמן אישי", color: "bg-rose-50 text-rose-600" },
          ].map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
              <div className={`p-3 rounded-xl ${item.color}`}>
                <item.icon size={24} />
              </div>
              <span className="text-sm font-semibold">{item.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full flex flex-col gap-4"
        >
          <button
            onClick={login}
            className="w-full bg-green-600 text-white py-4 rounded-2xl text-lg font-bold shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98]"
            id="login-button"
          >
            התחל עכשיו בחינם
          </button>
          <p className="text-xs text-gray-400">בהרשמה אתה מאשר את תנאי השימוש ומדיניות הפרטיות</p>
        </motion.div>
      </main>

      <footer className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-sm text-gray-400 font-medium">פותח באהבה עבור הקהילה הישראלית 🇮🇱</p>
      </footer>
    </div>
  );
}
