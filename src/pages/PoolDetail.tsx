import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { poolService } from "@/services/poolService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Users } from "lucide-react";
import { MatchesList } from "@/components/MatchesList";
import { RankingTable } from "@/components/RankingTable";
import { BonusForm } from "@/components/BonusForm";
import { PoolAdminPanel } from "@/components/PoolAdminPanel";
import { InvitePanel } from "@/components/InvitePanel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const PoolDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: pool, isLoading } = useQuery({ queryKey: ["pool", id], queryFn: () => poolService.getById(id!), enabled: !!id });
  const { data: members } = useQuery({ queryKey: ["members", id], queryFn: () => poolService.listMembers(id!), enabled: !!id });
  const { data: isGlobalAdmin = false } = useQuery({
    queryKey: ["global-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role" as any, { _user_id: user!.id, _role: "admin" });
      if (error) return false;
      return Boolean(data);
    },
    enabled: !!user,
  });

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div></AppLayout>;
  if (!pool) return <AppLayout><div className="text-center py-20">Bolão não encontrado. <Link to="/dashboard" className="text-secondary underline">Voltar</Link></div></AppLayout>;

  const me = members?.find((m: any) => m.user_id === user?.id);
  const isPoolAdmin = me?.role === "owner" || me?.role === "admin";
  const isAdmin = isPoolAdmin || isGlobalAdmin;

  const copyCode = () => {
    navigator.clipboard.writeText(pool.invite_code);
    toast.success("Código copiado!");
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">{pool.name}</h1>
          {pool.description && <p className="text-sm text-muted-foreground">{pool.description}</p>}
        </div>
        <Button onClick={copyCode} variant="outline" size="sm" className="border-secondary/40 text-secondary hover:bg-secondary/10">
          <Copy className="mr-1.5 h-3.5 w-3.5" /> {pool.invite_code}
        </Button>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid">
          <TabsTrigger value="matches">Jogos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="bonus">Bônus</TabsTrigger>
          <TabsTrigger value="more">{isAdmin ? "Admin" : "Membros"}</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <MatchesList poolId={pool.id} />
        </TabsContent>
        <TabsContent value="ranking" className="mt-4">
          <RankingTable poolId={pool.id} />
        </TabsContent>
        <TabsContent value="bonus" className="mt-4">
          <BonusForm poolId={pool.id} />
        </TabsContent>
        <TabsContent value="more" className="mt-4 space-y-4">
          {isPoolAdmin && <InvitePanel poolId={pool.id} poolName={pool.name} inviteCode={pool.invite_code} />}
          {isAdmin && <PoolAdminPanel poolId={pool.id} />}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3"><Users className="h-5 w-5 text-secondary" /><h2 className="font-display text-xl tracking-wide">MEMBROS</h2></div>
            <ul className="divide-y divide-border/30">
              {(members ?? []).map((m: any) => (
                <li key={m.user_id} className="flex items-center justify-between py-2">
                  <span>{m.profiles?.display_name ?? "Sem nome"}</span>
                  <span className="text-xs text-muted-foreground capitalize">{m.role === "owner" ? "dono" : m.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default PoolDetail;
