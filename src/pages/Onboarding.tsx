import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { UserProfile } from "../types";

export default function Onboarding({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    fullName: "",
    age: 25,
    gender: "זכר",
    height: 175,
    currentWeight: 70,
    targetWeight: 65,
    activityLevel: "פעיל מעט",
    goal: "ירידה במשקל",
  });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const calculateTargets = () => {
    const { age, height, currentWeight, gender, activityLevel, goal } = data;
    if (!age || !height || !currentWeight || !gender || !activityLevel || !goal) return;

    let bmr = 0;
    if (gender === "זכר") {
      bmr = 88.362 + (13.397 * currentWeight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * currentWeight) + (3.098 * height) - (4.330 * age);
    }

    const activityMultipliers: Record<string, number> = {
      "לא פעיל": 1.2,
      "פעיל מעט": 1.375,
      "פעיל בינוני": 1.55,
      "פעיל מאוד": 1.725,
      "פעיל בצורה קיצונית": 1.9,
    };

    const tdee = bmr * activityMultipliers[activityLevel];
    let calorieTarget = tdee;
    if (goal === "ירידה במשקל") calorieTarget -= 500;
    if (goal === "עלייה במסת שריר") calorieTarget += 500;

    const bmi = currentWeight / (Math.pow(height / 100, 2));

    // Protein target: 1.6g to 2.2g per kg (or around 25-30% of calories)
    const proteinTarget = currentWeight * (goal === "עלייה במסת שריר" ? 2 : 1.8);

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      dailyCalorieTarget: Math.round(calorieTarget),
      dailyProteinTarget: Math.round(proteinTarget),
    };
  };

  const finish = async () => {
    const targets = calculateTargets();
    if (!targets || !auth.currentUser) return;

    const profile: UserProfile = {
      ...(data as UserProfile),
      userId: auth.currentUser.uid,
      ...targets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profile);
      onComplete(profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-bold mb-2">איך קוראים לך?</h2>
            <p className="text-gray-500 mb-8">נשמח להכיר אותך טוב יותר</p>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
              className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="ישראל ישראלי"
              dir="rtl"
              id="input-fullname"
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-bold mb-2">פרטים פיזיולוגיים</h2>
            <p className="text-gray-500 mb-8">זה יעזור לנו לחשב את הקלוריות שלך</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-400">גיל</label>
                <input
                  type="number"
                  value={data.age}
                  onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                  className="bg-white border border-gray-200 p-4 rounded-2xl text-xl outline-none"
                  id="input-age"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-400">מין</label>
                <select
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value as any })}
                  className="bg-white border border-gray-200 p-4 rounded-2xl text-xl outline-none"
                  id="input-gender"
                >
                  <option value="זכר">זכר</option>
                  <option value="נקבה">נקבה</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm font-semibold text-gray-400">גובה (ס"מ)</label>
                <input
                  type="number"
                  value={data.height}
                  onChange={(e) => setData({ ...data, height: Number(e.target.value) })}
                  className="bg-white border border-gray-200 p-4 rounded-2xl text-xl outline-none"
                  id="input-height"
                />
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-bold mb-2">משקל ומטרות</h2>
            <p className="text-gray-500 mb-8">לאן אנחנו שואפים להגיע?</p>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-400">משקל נוכחי (ק"ג)</label>
                <input
                  type="number"
                  value={data.currentWeight}
                  onChange={(e) => setData({ ...data, currentWeight: Number(e.target.value) })}
                  className="bg-white border border-gray-200 p-4 rounded-2xl text-xl outline-none"
                  id="input-weight"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-400">משקל יעד (ק"ג)</label>
                <input
                  type="number"
                  value={data.targetWeight}
                  onChange={(e) => setData({ ...data, targetWeight: Number(e.target.value) })}
                  className="bg-white border border-gray-200 p-4 rounded-2xl text-xl outline-none"
                  id="input-target-weight"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-400">המטרה שלך</label>
                <div className="grid grid-cols-1 gap-3">
                  {["ירידה במשקל", "עלייה במסת שריר", "שמירה על המשקל"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setData({ ...data, goal: g as any })}
                      className={`p-4 rounded-2xl border text-right font-bold transition-all ${
                        data.goal === g ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" : "bg-white border-slate-100 text-slate-600"
                      }`}
                      id={`btn-goal-${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-bold mb-2">רמת פעילות</h2>
            <p className="text-gray-500 mb-8">איך נראה היום יום שלך?</p>
            <div className="space-y-3">
              {["לא פעיל", "פעיל מעט", "פעיל בינוני", "פעיל מאוד", "פעיל בצורה קיצונית"].map((level) => (
                <button
                  key={level}
                  onClick={() => setData({ ...data, activityLevel: level as any })}
                  className={`w-full p-4 rounded-2xl border text-right font-bold transition-all ${
                    data.activityLevel === level ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" : "bg-white border-slate-100 text-slate-600"
                  }`}
                  id={`btn-activity-${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-12 flex flex-col max-w-lg mx-auto">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-green-500" : "bg-slate-200"}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-slate-400 font-mono">שלב {step} מתוך 4</span>
        </div>

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 mt-8">
        {step > 1 && (
          <button
            onClick={prev}
            className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-gray-900 transition-all shadow-sm"
          >
            <ChevronRight className="rotate-180" />
          </button>
        )}
        <button
          onClick={step === 4 ? finish : next}
          disabled={step === 1 && !data.fullName}
          className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50"
          id="btn-next"
        >
          {step === 4 ? "בוא נתחיל!" : "המשך"}
          {step === 4 ? <Check /> : <ChevronLeft className="rotate-180" />}
        </button>
      </div>
    </div>
  );
}
