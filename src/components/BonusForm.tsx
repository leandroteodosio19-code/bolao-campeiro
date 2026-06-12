import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { bonusService } from "@/services/bonusService";
import { teamService } from "@/services/teamService";
import { poolService } from "@/services/poolService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Lock, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function BonusForm({ poolId }: { poolId: string }) {
  const { user } = useAuth();
  const { data: pool } = useQuery({ queryKey: ["pool", poolId], queryFn: () => poolService.getById(poolId) });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: teamService.listAll });
  const { data: mine, refetch } = useQuery({
    queryKey: ["bonus-mine", poolId, user?.id],
    queryFn: () => bonusService.getMine(poolId, user!.id),
    enabled: !!user,
  });
  const { data: all } = useQuery({ queryKey: ["bonus-all", poolId], queryFn: () => bonusService.listAll(poolId) });

  const [champion, setChampion] = useState<string>("");
  const [scorer, setScorer] = useState("");
  const [best, setBest] = useState("");

  useEffect(() => {
    if (mine) {
      setChampion(mine.champion_team_id ?? "");
      setScorer(mine.top_scorer_player_name ?? "");
      setBest(mine.best_player_name ?? "");
    }
  }, [mine]);

  const locked = pool?.bonus_lock_at ? new Date(pool.bonus_lock_at) <= new Date() : false;

  const m = useMutation({
    mutationFn: () => bonusService.upsert({
      poolId, userId: user!.id,
      championTeamId: champion || null,
      topScorerPlayerName: scorer,
      bestPlayerName: best,
    }),
    onSuccess: () => { toast.success("Palpite bônus salvo!"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-2xl tracking-wide">PALPITES BÔNUS</h2>
        </div>
        {pool?.bonus_lock_at && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
            {locked ? <Lock className="h-3.5 w-3.5" /> : null}
            {locked ? "Encerrado em " : "Aberto até "}
            {format(new Date(pool.bonus_lock_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <Label>Campeão da Copa</Label>
            <Select value={champion} onValueChange={setChampion} disabled={locked}>
              <SelectTrigger><SelectValue placeholder="Selecione a seleção" /></SelectTrigger>
              <SelectContent>
                {(teams ?? []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.flag_emoji} {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Artilheiro</Label>
            <Input value={scorer} onChange={(e) => setScorer(e.target.value)} placeholder="Nome do jogador" disabled={locked} />
          </div>
          <div>
            <Label>Melhor jogador da Copa</Label>
            <Input value={best} onChange={(e) => setBest(e.target.value)} placeholder="Nome do jogador" disabled={locked} />
          </div>
        </div>

        {!locked && (
          <Button onClick={() => m.mutate()} disabled={m.isPending} className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
            {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar palpites bônus
          </Button>
        )}
      </div>

      {(all?.length ?? 0) > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-display text-lg tracking-wide mb-3">PALPITES DOS PARTICIPANTES</h3>
          <ul className="space-y-2 text-sm">
            {all!.map((b: any) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 border-b border-border/30 pb-2 last:border-0 last:pb-0">
                <span className="font-medium">{b.profiles?.display_name ?? "?"}:</span>
                <span className="text-muted-foreground">campeão</span>
                <span>{b.team?.flag_emoji} {b.team?.code ?? "—"}</span>
                {b.top_scorer_player_name && <><span className="text-muted-foreground">· artilheiro</span><span>{b.top_scorer_player_name}</span></>}
                {b.best_player_name && <><span className="text-muted-foreground">· craque</span><span>{b.best_player_name}</span></>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
