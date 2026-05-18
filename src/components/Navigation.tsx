import { Link, useLocation } from "react-router-dom";
import { Home, Camera, MessageSquare, Timer, BarChart3, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "בית" },
    { href: "/analysis", icon: Camera, label: "ניתוח" },
    { href: "/chat", icon: MessageSquare, label: "צ'אט" },
    { href: "/fasting", icon: Timer, label: "צום" },
    { href: "/stats", icon: BarChart3, label: "גרפים" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:w-20 md:h-screen md:border-t-0 md:border-l flex md:flex-col justify-around md:justify-center items-center py-2 md:py-8">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 scale-100 hover:scale-110",
              isActive ? "text-green-600 bg-green-50/50" : "text-slate-400 hover:text-slate-900"
            )}
            id={`nav-${item.label}`}
          >
            <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
