import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trophy } from "lucide-react";

const Login = () => {
  const { user, loading: authLoading, signInWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Bem-vindo!"); navigate("/dashboard"); }
  };

  const onGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setLoading(false); toast.error(error); }
  };

  const onReset = async () => {
    if (!email) return toast.info("Informe seu e-mail acima primeiro.");
    const { error } = await resetPassword(email);
    if (error) toast.error(error);
    else toast.success("Enviamos um link de recuperação para o seu e-mail.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card p-7">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-secondary to-amber-500 text-secondary-foreground">
            <Trophy className="h-6 w-6" />
          </span>
          <h1 className="mt-3 font-display text-3xl tracking-wide">ENTRAR</h1>
          <p className="text-sm text-muted-foreground">Acesse seu bolão da Copa 2026</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button onClick={onGoogle} disabled={loading} variant="outline" className="w-full">
          Entrar com Google
        </Button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button type="button" onClick={onReset} className="text-muted-foreground hover:text-foreground underline">
            Esqueci a senha
          </button>
          <Link to="/register" className="text-secondary hover:underline">Criar conta</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
