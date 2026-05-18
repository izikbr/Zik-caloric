import { useState, useEffect } from "react";
import { UserProfile, WeightLog } from "../types";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, onSnapshot, addDoc, orderBy, limit } from "firebase/firestore";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Scale, TrendingDown, Target, BarChart3, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function Stats({ profile }: { profile: UserProfile }) {
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users", profile.userId, "weights"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setWeights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightLog)));
      setLoading(false);
    });

    return () => unsub();
  }, [profile.userId]);

  const addWeight = async () => {
    if (!newWeight || isNaN(Number(newWeight))) return;
    try {
      await addDoc(collection(db, "users", profile.userId, "weights"), {
        userId: profile.userId,
        weight: Number(newWeight),
        timestamp: new Date().toISOString()
      });
      setNewWeight("");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "weights");
    }
  };

  const chartData = weights.map(w => ({
    date: format(new Date(w.timestamp), 'dd/MM'),
    weight: w.weight
  }));

  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : profile.currentWeight;
  const initialWeight = weights.length > 0 ? weights[0].weight : profile.currentWeight;
  const weightDiff = currentWeight - initialWeight;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      <header className="px-6 pt-12 pb-8 bg-white rounded-b-[40px] shadow-sm mb-6 border-b border-slate-100">
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">גרפים ומדדים</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">עקוב אחר ההתקדמות שלך לאורך זמן</p>
      </header>

      <main className="px-6 space-y-6">
        {/* Weight Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <Scale size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">משקל נוכחי</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{currentWeight} <span className="text-sm font-bold text-slate-400 font-sans tracking-tighter">ק"ג</span></span>
          </div>
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-2">
            <div className={`w-10 h-10 ${weightDiff <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"} rounded-xl flex items-center justify-center`}>
               <TrendingDown size={20} className={weightDiff > 0 ? "rotate-180" : ""} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">שינוי סה"כ</span>
            <span className={`text-2xl font-black font-mono ${weightDiff <= 0 ? "text-emerald-600" : "text-rose-500"}`}>
               {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} <span className="text-sm font-bold font-sans tracking-tighter">ק"ג</span>
            </span>
          </div>
        </div>

        {/* Goal Progress Card */}
        <div className="bg-secondary p-6 rounded-[32px] text-white shadow-xl shadow-slate-200 flex items-center justify-between">
           <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">יעד נכסף</span>
              <h3 className="text-3xl font-black font-mono">{profile.targetWeight} ק"ג</h3>
           </div>
           <div className="text-right">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">נותר להוריד</span>
              <h3 className="text-3xl font-black font-mono">{Math.max(0, currentWeight - profile.targetWeight).toFixed(1)} ק"ג</h3>
           </div>
        </div>

        {/* Weight Chart */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2 tracking-tight">
                 <BarChart3 size={20} className="text-green-500" />
                 מגמת משקל
              </h2>
              <div className="flex gap-2">
                 <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase">30 יום</span>
              </div>
           </div>

           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} 
                    />
                    <YAxis 
                       hide 
                       domain={['dataMin - 2', 'dataMax + 2']} 
                    />
                    <Tooltip 
                       content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                                <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                                   {payload[0].value} ק"ג
                                </div>
                             );
                          }
                          return null;
                       }}
                    />
                    <Area 
                       type="monotone" 
                       dataKey="weight" 
                       stroke="#10B981" 
                       strokeWidth={3} 
                       fillOpacity={1} 
                       fill="url(#colorWeight)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* Update Weight Card */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
           <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-green-500" />
              עדכן משקל יומי
           </h2>
           <div className="flex gap-3">
              <input 
                 type="number"
                 step="0.1"
                 value={newWeight}
                 onChange={(e) => setNewWeight(e.target.value)}
                 placeholder="הכנס משקל חדש..."
                 className="flex-1 bg-slate-50 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-green-500 transition-all outline-none"
                 dir="rtl"
                 id="weight-input"
              />
              <button 
                 onClick={addWeight}
                 className="bg-green-600 text-white px-6 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98]"
                 id="add-weight-btn"
              >
                 שמור
              </button>
           </div>
        </section>
      </main>
    </div>
  );
}
