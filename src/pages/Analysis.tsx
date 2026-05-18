import { useState, useRef } from "react";
import { UserProfile, Meal } from "../types";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Image, Check, X, Sparkles, Loader2, Info } from "lucide-react";

export default function Analysis({ profile }: { profile: UserProfile }) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [type, setType] = useState<Meal["type"]>("בוקר");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);

    try {
      const base64Image = image.split(",")[1];
      const res = await fetch("/api/nutrition/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
      alert("שגיאה בניתוח התמונה. נסה שוב.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result) return;
    try {
      const meal: Meal = {
        userId: profile.userId,
        name: result.foodName,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber || 0,
        type: type,
        timestamp: new Date().toISOString(),
        imageUrl: image || undefined
      };
      await addDoc(collection(db, "users", profile.userId, "meals"), meal);
      reset();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "meals");
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setAnalyzing(false);
    setText("");
  };

  const [text, setText] = useState("");
  const parseText = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/nutrition/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("שגיאה בניתוח הטקסט.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      <header className="w-full mb-8 text-center px-4 pt-12">
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">הוספת מזון</h1>
        <p className="text-slate-400 font-bold tracking-tight uppercase text-xs">השתמש ב-AI לזיהוי מהיר של המנה שלך</p>
      </header>

      <main className="w-full max-w-md mx-auto px-6">
        <AnimatePresence mode="wait">
          {!image && !analyzing && !result ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div
                className="aspect-[16/9] w-full rounded-[40px] border-4 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-green-400 transition-colors shadow-sm"
                onClick={() => fileInputRef.current?.click()}
                id="upload-area"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-800">נתח תמונה</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">צלם או בחר גלריה</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">הוספה בטקסט חופשי</h3>
                 <div className="flex flex-col gap-3">
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder='למשל: "2 פרוסות פיצה ופחית קולה"'
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none resize-none h-24 transition-all"
                      dir="rtl"
                      id="manual-text-input"
                    />
                    <button 
                      onClick={parseText}
                      disabled={!text.trim()}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-100"
                    >
                      <Sparkles size={18} className="text-green-500" /> נתח טקסט
                    </button>
                 </div>
              </div>
            </motion.div>
          ) : analyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-8"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto text-green-600 animate-pulse" size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800">מפענח את הארוחה...</h3>
                <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">ה-AI שלנו סופק קלוריות בשבילך</p>
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
            >
              <div className="relative h-48">
                <img src={image!} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                <div className="absolute bottom-6 right-6">
                  <h3 className="text-2xl font-black text-white tracking-tight">{result.foodName}</h3>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "קלוריות", val: result.calories, color: "bg-orange-50 text-orange-600 border-orange-100/50" },
                    { label: "חלבון", val: result.protein, color: "bg-emerald-50 text-emerald-600 border-emerald-100/50" },
                    { label: "פחמימות", val: result.carbs, color: "bg-indigo-50 text-indigo-600 border-indigo-100/50" },
                    { label: "שומן", val: result.fat, color: "bg-amber-50 text-amber-600 border-amber-100/50" },
                  ].map((stat) => (
                    <div key={stat.label} className={`${stat.color} p-2 rounded-2xl text-center border`}>
                       <span className="block text-[8px] font-bold uppercase tracking-widest opacity-60 mb-1">{stat.label}</span>
                       <span className="font-black text-lg font-mono">{stat.val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100">
                  <Info className="text-slate-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">{result.description}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">סוג ארוחה</label>
                  <div className="flex gap-2">
                    {["בוקר", "צהריים", "ערב", "נשנושים"].map(t => (
                      <button
                        key={t}
                        onClick={() => setType(t as any)}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                          type === t ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={reset}
                    className="flex-1 bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                    <X size={20} /> ביטול
                  </button>
                  <button
                    onClick={saveMeal}
                    className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    id="save-meal-btn"
                  >
                    <Check size={20} /> שמירה ביומן
                  </button>
                </div>
              </div>
            </motion.div>
          ) : image && (
             <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square relative rounded-[40px] overflow-hidden shadow-2xl group"
            >
              <img src={image} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-8 flex gap-4">
                 <button
                  onClick={reset}
                  className="flex-1 bg-white/20 backdrop-blur-md text-white border border-white/30 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all"
                >
                  החלף תמונה
                </button>
                <button
                  onClick={analyze}
                  className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-green-200 flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                >
                  <Sparkles size={20} /> נתח עם AI
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <section className="mt-12 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4 text-orange-600">
           <Sparkles size={18} />
           <h4 className="text-sm font-black uppercase tracking-tight">טיפים לניתוח מדויק</h4>
        </div>
        <ul className="space-y-3">
          {[
             "צלם באור יום מחמיא",
             "וודא שהצלחת במרכז המצלמה",
             "נסה להימנע מצילום מחוץ לצלחת",
             "ה-AI מזהה אפילו שווארמה בלאפה!"
          ].map((tip, i) => (
             <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-500">
                <div className="w-1 h-1 bg-orange-400 rounded-full" />
                {tip}
             </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
