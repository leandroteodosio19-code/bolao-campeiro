import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <AppLayout>
      <h1 className="font-display text-4xl tracking-wide">CONTA</h1>
      <div className="glass-card p-6 mt-4 max-w-md">
        <p className="text-sm text-muted-foreground">E-mail</p>
        <p className="font-medium">{user?.email}</p>
        <Button variant="outline" className="mt-5" onClick={async () => { await signOut(); nav("/login"); }}>Sair</Button>
      </div>
    </AppLayout>
  );
};

export default Account;
