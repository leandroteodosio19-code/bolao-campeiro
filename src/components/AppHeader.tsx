import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut } from "lucide-react";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-secondary to-amber-500 text-secondary-foreground">
            <Trophy className="h-4 w-4" />
          </span>
          <span className="font-display text-xl tracking-wider">BOLÃO DA COPA</span>
        </Link>
        {user && (
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sair
          </Button>
        )}
      </div>
    </header>
  );
}
