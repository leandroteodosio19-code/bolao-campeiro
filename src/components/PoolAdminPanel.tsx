import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchService } from "@/services/matchService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MockMatchesBanner } from "./MockMatchesBanner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PoolAdminPanel({ poolId: _poolId }: { poolId: string }) {
  const qc = useQueryClient();
  const { data: matches, isLoading } = useQuery({ queryKey: ["matches"], queryFn: matchService.listAll });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>;

  return (
    <div className="space-y-4">
      <MockMatchesBanner />
      <div className="glass-card p-5">
        <h2 className="font-display text-2xl tracking-wide mb-1">ADMINISTRAÇÃO DOS JOGOS</h2>
        <p className="text-xs text-muted-foreground mb-4">Defina o placar final de cada partida. Ao marcar como finalizada, os pontos são calculados e o ranking é atualizado automaticamente em tempo real.</p>
        <ul className="space-y-3">
          {matches!.map((m: any) => (
            <AdminMatchRow key={m.id} match={m} onSaved={() => qc.invalidateQueries({ queryKey: ["matches"] })} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdminMatchRow({ match, onSaved }: any) {
  const [home, setHome] = useState<string>(match.home_score?.toString() ?? "");
  const [away, setAway] = useState<string>(match.away_score?.toString() ?? "");
  const [winner, setWinner] = useState<string | null>(match.winner_team_id ?? null);

  const save = useMutation({
    mutationFn: () => matchService.updateResult(match.id, {
      home_score: parseInt(home),
      away_score: parseInt(away),
      winner_team_id: match.is_knockout ? winner : null,
      status: "finished",
    }),
    onSuccess: () => { toast.success("Resultado registrado. Ranking atualizado em tempo real."); onSaved?.(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/60 p-3 sm:flex-row sm:items-center">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{format(new Date(match.kickoff_at), "dd MMM · HH:mm", { locale: ptBR })} · {match.stage}{match.group_name ? ` ${match.group_name}` : ""}</p>
        <p className="font-medium truncate">{match.home_team?.flag_emoji} {match.home_team?.name} <span className="text-muted-foreground">×</span> {match.away_team?.flag_emoji} {match.away_team?.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input className="w-14 h-10 text-center font-display text-xl" type="number" min="0" value={home} onChange={(e) => setHome(e.target.value)} />
        <span className="text-muted-foreground">×</span>
        <Input className="w-14 h-10 text-center font-display text-xl" type="number" min="0" value={away} onChange={(e) => setAway(e.target.value)} />
      </div>
      {match.is_knockout && (
        <select
          className="rounded-md border border-input bg-background h-10 px-2 text-sm"
          value={winner ?? ""}
          onChange={(e) => setWinner(e.target.value || null)}
        >
          <option value="">Classificado…</option>
          <option value={match.home_team_id}>{match.home_team?.code}</option>
          <option value={match.away_team_id}>{match.away_team?.code}</option>
        </select>
      )}
      <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !home || !away} className="bg-primary hover:bg-primary/90">
        {save.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        {match.status === "finished" ? "Atualizar" : "Finalizar"}
      </Button>
    </li>
  );
}
