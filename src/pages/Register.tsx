import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trophy } from "lucide-react";

const Register = () => {
  const { user, loading: authLoading, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha precisa ter ao menos 6 caracteres.");
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Cadastro realizado! Você já pode entrar."); navigate("/dashboard"); }
  };

  const onGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card p-7">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-secondary to-amber-500 text-secondary-foreground">
            <Trophy className="h-6 w-6" />
          </span>
          <h1 className="mt-3 font-display text-3xl tracking-wide">CRIAR CONTA</h1>
          <p className="text-sm text-muted-foreground">Comece seu bolão em segundos</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <Label htmlFor="name">Como devemos te chamar?</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha (mín. 6)</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button onClick={onGoogle} variant="outline" className="w-full">
          Continuar com Google
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-secondary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
