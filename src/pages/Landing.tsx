import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Users, Zap, Target } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

const Landing = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container flex-1">
        <section className="py-12 md:py-20 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            <Zap className="h-3.5 w-3.5" /> Combine as regras do bolão com seu grupo antes do início dos jogos
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-none tracking-wide">
            BOLÃO DA <span className="bg-gradient-to-br from-secondary to-amber-400 bg-clip-text text-transparent">COPA 2026</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-muted-foreground">
            Crie bolões privados, convide a turma por código, palpite todos os jogos e
            acompanhe o ranking ao vivo durante a Copa do Mundo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
              <Link to="/register">Criar conta grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 pb-16">
          {[
            { icon: Users, title: "Bolões privados", desc: "Convide só quem você quiser, com código de 6 dígitos." },
            { icon: Target, title: "Palpites + bônus", desc: "Placar exato, vencedor e bônus de campeão, artilheiro e craque." },
            { icon: Trophy, title: "Ranking ao vivo", desc: "Atualizado em tempo real a cada resultado, com medalhas no Top 3." },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6">
              <f.icon className="h-8 w-8 text-secondary" />
              <h3 className="mt-3 font-display text-2xl">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Landing;
