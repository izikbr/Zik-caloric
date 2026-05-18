export interface UserProfile {
  userId: string;
  fullName: string;
  age: number;
  gender: "זכר" | "נקבה";
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: "לא פעיל" | "פעיל מעט" | "פעיל בינוני" | "פעיל מאוד" | "פעיל בצורה קיצונית";
  goal: "ירידה במשקל" | "עלייה במסת שריר" | "שמירה על המשקל";
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  createdAt: string;
  updatedAt: string;
}

export type MealType = "בוקר" | "צהריים" | "ערב" | "נשנושים";

export interface Meal {
  id?: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  type: MealType;
  timestamp: string;
  imageUrl?: string;
}

export interface WeightLog {
  id?: string;
  userId: string;
  weight: number;
  timestamp: string;
}

export interface WaterIntake {
  id?: string;
  userId: string;
  amount: number;
  timestamp: string;
}

export type FastingMode = "16:8" | "18:6" | "20:4" | "OMAD";

export interface FastingSession {
  id?: string;
  userId: string;
  startTime: string;
  endTime?: string;
  mode: FastingMode;
  status: "active" | "completed";
}
