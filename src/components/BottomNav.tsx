import { NavLink, useLocation } from "react-router-dom";
import { Home, Plus, LogIn, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/login") || loc.pathname.startsWith("/register") || loc.pathname === "/") return null;

  const items = [
    { to: "/dashboard", icon: Home, label: "Bolões" },
    { to: "/pools/new", icon: Plus, label: "Criar" },
    { to: "/pools/join", icon: LogIn, label: "Entrar" },
    { to: "/account", icon: User2, label: "Conta" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/90 backdrop-blur-md md:hidden">
      <ul className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "text-secondary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
