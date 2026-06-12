import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { poolService } from "@/services/poolService";
import { Button } from "@/components/ui/button";
import { Plus, LogIn, Trophy, Users, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-pools", user?.id],
    queryFn: () => poolService.listMyPools(user!.id),
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl tracking-wide">MEUS BOLÕES</h1>
          <p className="text-sm text-muted-foreground">Gerencie e acompanhe seus bolões da Copa 2026</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button asChild variant="outline"><Link to="/pools/join"><LogIn className="mr-2 h-4 w-4" />Entrar</Link></Button>
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link to="/pools/new"><Plus className="mr-2 h-4 w-4" />Criar bolão</Link></Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>
      )}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="glass-card p-10 text-center">
          <Trophy className="mx-auto h-12 w-12 text-secondary" />
          <h2 className="font-display text-2xl mt-3">Você ainda não tem nenhum bolão</h2>
          <p className="text-sm text-muted-foreground mt-1">Crie um agora ou entre em um com o código de convite.</p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link to="/pools/new"><Plus className="mr-2 h-4 w-4" />Criar bolão</Link></Button>
            <Button asChild variant="outline"><Link to="/pools/join"><LogIn className="mr-2 h-4 w-4" />Entrar com código</Link></Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((p: any) => (
          <Link key={p.id} to={`/pools/${p.id}`} className="glass-card p-5 group hover:border-secondary/60 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-2xl tracking-wide">{p.name}</h3>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
              </div>
              <span className="gold-chip rounded-md px-2 py-1 text-[10px] font-bold tracking-wider">{p.invite_code}</span>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Bolão {p.my_role === "owner" ? "(você é o dono)" : p.my_role === "admin" ? "(admin)" : ""}
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
