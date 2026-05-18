import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, OperationType, handleFirestoreError } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile } from "./types";

// Pages
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Landing from "./pages/Landing";
import Analysis from "./pages/Analysis";
import Chat from "./pages/Chat";
import Fasting from "./pages/Fasting";
import Stats from "./pages/Stats";
import Navigation from "./components/Navigation";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0 md:pt-0">
        <Routes>
          <Route path="/" element={user ? (profile ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <Landing />} />
          <Route path="/onboarding" element={user ? <Onboarding onComplete={(p) => setProfile(p)} /> : <Navigate to="/" />} />
          <Route path="/dashboard" element={user && profile ? <Dashboard profile={profile} /> : <Navigate to="/" />} />
          <Route path="/analysis" element={user && profile ? <Analysis profile={profile} /> : <Navigate to="/" />} />
          <Route path="/chat" element={user && profile ? <Chat profile={profile} /> : <Navigate to="/" />} />
          <Route path="/fasting" element={user && profile ? <Fasting profile={profile} /> : <Navigate to="/" />} />
          <Route path="/stats" element={user && profile ? <Stats profile={profile} /> : <Navigate to="/" />} />
        </Routes>
        {user && profile && <Navigation />}
      </div>
    </Router>
  );
}
