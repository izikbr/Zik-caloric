import { useState, useEffect } from "react";
import { UserProfile, Meal, WaterIntake, WeightLog } from "../types";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs } from "firebase/firestore";
import { motion } from "motion/react";
import { Plus, Droplets, Flame, Beef, Scale, Footprints, ChevronLeft, Apple, Utensils, Moon, Coffee, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function Dashboard({ profile }: { profile: UserProfile }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [water, setWater] = useState<number>(0);
  const [weight, setWeight] = useState<number>(profile.currentWeight);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mealsQuery = query(
      collection(db, "users", profile.userId, "meals"),
      where("timestamp", ">=", today.toISOString()),
      orderBy("timestamp", "desc")
    );

    const waterQuery = query(
      collection(db, "users", profile.userId, "water"),
      where("timestamp", ">=", today.toISOString())
    );

    const weightQuery = query(
      collection(db, "users", profile.userId, "weights"),
      orderBy("timestamp", "desc")
    );

    const unsubMeals = onSnapshot(mealsQuery, (snapshot) => {
      setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "meals"));

    const unsubWater = onSnapshot(waterQuery, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      setWater(total);
    });

    const unsubWeight = onSnapshot(weightQuery, (snapshot) => {
      if (!snapshot.empty) {
        setWeight(snapshot.docs[0].data().weight);
      }
    });

    return () => {
      unsubMeals();
      unsubWater();
      unsubWeight();
    };
  }, [profile.userId]);

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);

  const calorieProgress = Math.min((totalCalories / profile.dailyCalorieTarget) * 100, 100);
  const proteinProgress = Math.min((totalProtein / profile.dailyProteinTarget) * 100, 100);

  const addWater = async () => {
    try {
      await addDoc(collection(db, "users", profile.userId, "water"), {
        userId: profile.userId,
        amount: 250,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "water");
    }
  };

  const mealTypes = [
    { label: "ארוחת בוקר", icon: Coffee, type: "בוקר", color: "bg-orange-50 text-orange-600 border-orange-100/50" },
    { label: "ארוחת צהריים", icon: Utensils, type: "צהריים", color: "bg-emerald-50 text-emerald-600 border-emerald-100/50" },
    { label: "ארוחת ערב", icon: Moon, type: "ערב", color: "bg-indigo-50 text-indigo-600 border-indigo-100/50" },
    { label: "נשנושים", icon: Apple, type: "נשנושים", color: "bg-amber-50 text-amber-600 border-amber-100/50" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">שלום, {profile.fullName.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">יום {format(new Date(), 'EEEE', { locale: he })}</p>
          </div>
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-100">
            {profile.fullName[0]}
          </div>
        </div>

        {/* Calorie Ring and Stats */}
        <div className="grid grid-cols-2 gap-8 items-center">
          <div className="relative w-44 h-44 mx-auto">
             <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-50"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={490}
                  strokeDashoffset={490 - (490 * calorieProgress) / 100}
                  strokeLinecap="round"
                  className="text-green-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-slate-800">{profile.dailyCalorieTarget - totalCalories}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">קלוריות נותרו</span>
              </div>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400">חלבון</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{totalProtein}/{profile.dailyProteinTarget}g</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${proteinProgress}%` }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 p-2 rounded-xl text-center border border-emerald-100/50">
                <span className="block text-[8px] font-bold text-emerald-400 uppercase">פחמימות</span>
                <span className="text-sm font-black text-emerald-700 font-mono">{totalCarbs}g</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl text-center border border-amber-100/50">
                <span className="block text-[8px] font-bold text-amber-400 uppercase">שומן</span>
                <span className="text-sm font-black text-amber-700 font-mono">{totalFat}g</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 mt-6 space-y-6">
        {/* AI Insight Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary p-6 rounded-[32px] text-white flex flex-col gap-4 shadow-xl shadow-slate-200"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-green-500" />
              עוזר תזונה AI
            </h3>
            <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">חכם</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            "{profile.fullName.split(' ')[0]}, נראה שחסר לך קצת חלבון היום למטרה של {profile.goal}. נסה להוסיף {Math.max(0, profile.dailyProteinTarget - totalProtein)} גרם חלבון בארוחת הערב."
          </p>
          <div className="flex gap-2">
             <button className="flex-1 bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-xs font-bold transition-all">מה לאכול?</button>
             <button className="flex-1 bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-xs font-bold transition-all">נתח ארוחה</button>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={addWater}
            className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Droplets size={20} />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-800 font-mono">{water} <span className="text-xs font-bold text-slate-400">מ"ל</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">שתיית מים</span>
            </div>
            <div className="flex gap-1">
               {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-full rounded-full ${i < water/250 ? 'bg-blue-500' : 'bg-slate-100'}`} />
               ))}
            </div>
          </motion.div>

          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Scale size={20} />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-800 font-mono">{weight} <span className="text-xs font-bold text-slate-400">ק"ג</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">משקל נוכחי</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-500">
               ↓ 1.2 ק"ג מההתחלה
            </div>
          </div>
        </div>

        {/* High Protein Suggestions section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-black text-slate-800">המלצות עשירות בחלבון</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
            {[
              { name: "קוטג' 1%", protein: "11g", cal: "100", icon: "🥛", color: "bg-blue-50" },
              { name: "חזה עוף", protein: "31g", cal: "165", icon: "🍗", color: "bg-orange-50" },
              { name: "טונה במים", protein: "25g", cal: "110", icon: "🐟", color: "bg-slate-50" },
              { name: "יוגורט חלבון", protein: "20g", cal: "120", icon: "🍦", color: "bg-purple-50" },
              { name: "אדממה", protein: "11g", cal: "120", icon: "🫛", color: "bg-green-50" },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.95 }}
                className="bg-white p-4 rounded-[28px] min-w-[140px] shadow-sm border border-slate-100 flex flex-col gap-2"
              >
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-xl`}>{item.icon}</div>
                <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-600">{item.protein} חלבון</span>
                  <span className="text-[10px] font-bold text-slate-400">{item.cal} קלוריות</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Meal Logs Sections */}
        <section className="space-y-4 pb-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-black text-slate-800">יומן ארוחות היום</h2>
            <span className="text-sm font-bold text-green-600">+ הוספה</span>
          </div>

          <div className="space-y-3">
            {mealTypes.map((mt) => {
              const mealForType = meals.filter(m => m.type === mt.type);
              const typeCalories = mealForType.reduce((acc, m) => acc + m.calories, 0);

              return (
                <div key={mt.type} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${mt.color} rounded-2xl flex items-center justify-center text-2xl`}>
                        <mt.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{mt.label}</h3>
                        <p className="text-xs text-slate-400 font-medium">
                           {mealForType.length > 0 
                             ? mealForType.map(m => m.name).join(', ') 
                             : "אין נתונים עדיין"}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                       <p className="font-black text-slate-700 text-lg">{typeCalories}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">קלוריות</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
