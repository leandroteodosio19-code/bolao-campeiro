import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchService } from "@/services/matchService";
import { predictionService } from "@/services/predictionService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = { poolId: string };

export function MatchesList({ poolId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: matchService.listAll,
  });
  const { data: preds } = useQuery({
    queryKey: ["predictions", poolId],
    queryFn: () => predictionService.listForPool(poolId),
    enabled: !!poolId,
  });

  const predsByMatch = useMemo(() => {
    const map = new Map<string, any[]>();
    (preds ?? []).forEach((p: any) => {
      if (!map.has(p.match_id)) map.set(p.match_id, []);
      map.get(p.match_id)!.push(p);
    });
    return map;
  }, [preds]);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>;
  if (!matches?.length) return <div className="text-center text-muted-foreground py-10">Nenhum jogo cadastrado.</div>;

  return (
    <div className="space-y-3">
      {matches.map((m: any) => (
        <MatchCard
          key={m.id}
          match={m}
          poolId={poolId}
          userId={user!.id}
          myPrediction={(predsByMatch.get(m.id) ?? []).find((p: any) => p.user_id === user!.id)}
          allPredictions={predsByMatch.get(m.id) ?? []}
          onSaved={() => qc.invalidateQueries({ queryKey: ["predictions", poolId] })}
        />
      ))}
    </div>
  );
}

function MatchCard({ match, poolId, userId, myPrediction, allPredictions, onSaved }: any) {
  const isLocked = new Date(match.kickoff_at) <= new Date();
  const isFinished = match.status === "finished";
  const [home, setHome] = useState<string>(myPrediction?.predicted_home_score?.toString() ?? "");
  const [away, setAway] = useState<string>(myPrediction?.predicted_away_score?.toString() ?? "");
  const [winner, setWinner] = useState<string | null>(myPrediction?.predicted_winner_team_id ?? null);

  const save = useMutation({
    mutationFn: () => predictionService.upsert({
      poolId, userId, matchId: match.id,
      homeScore: parseInt(home), awayScore: parseInt(away),
      winnerTeamId: match.is_knockout ? winner : null,
    }),
    onSuccess: () => { toast.success("Palpite salvo!"); onSaved?.(); },
    onError: (e: any) => toast.error(e.message),
  });

  const stageLabel: Record<string, string> = {
    group: `Grupo ${match.group_name ?? ""}`,
    round_of_16: "Oitavas",
    quarter: "Quartas",
    semi: "Semifinal",
    third_place: "3º lugar",
    final: "Final",
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-medium text-foreground">{stageLabel[match.stage] ?? match.stage}</span>
          <span>·</span>
          <span>{format(new Date(match.kickoff_at), "dd MMM · HH:mm", { locale: ptBR })}</span>
        </div>
        {isFinished ? (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30"><CheckCircle2 className="mr-1 h-3 w-3" />Finalizado</Badge>
        ) : isLocked ? (
          <Badge variant="secondary" className="bg-muted text-muted-foreground"><Lock className="mr-1 h-3 w-3" />Bloqueado</Badge>
        ) : (
          <Badge variant="outline">Aberto</Badge>
        )}
      </div>

      <div className="p-4 flex items-center gap-3">
        <TeamSide team={match.home_team} align="right" />
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-2 font-display text-4xl tracking-wider">
              <span className="w-10 text-center">{isFinished ? match.home_score : (myPrediction?.predicted_home_score ?? "–")}</span>
              <span className="text-muted-foreground">×</span>
              <span className="w-10 text-center">{isFinished ? match.away_score : (myPrediction?.predicted_away_score ?? "–")}</span>
            </div>
          ) : (
            <>
              <Input className="w-14 h-12 text-center text-2xl font-display" type="number" min="0" max="20" value={home} onChange={(e) => setHome(e.target.value)} />
              <span className="text-muted-foreground">×</span>
              <Input className="w-14 h-12 text-center text-2xl font-display" type="number" min="0" max="20" value={away} onChange={(e) => setAway(e.target.value)} />
            </>
          )}
        </div>
        <TeamSide team={match.away_team} align="left" />
      </div>

      {match.is_knockout && !isLocked && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Classificado (mata-mata · +3 pts):</p>
          <div className="flex gap-2">
            {[match.home_team, match.away_team].map((t: any) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setWinner(t.id)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${winner === t.id ? "border-secondary bg-secondary/10 text-secondary" : "border-border hover:border-secondary/50"}`}
              >
                <Trophy className="inline mr-1 h-3.5 w-3.5" />{t.flag_emoji} {t.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLocked && (
        <div className="px-4 pb-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending || !home || !away} size="sm" className="w-full bg-primary hover:bg-primary/90">
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {myPrediction ? "Atualizar palpite" : "Salvar palpite"}
          </Button>
        </div>
      )}

      {isLocked && allPredictions.length > 0 && (
        <div className="border-t border-border/40 bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Palpites do bolão</p>
          <div className="flex flex-wrap gap-2">
            {allPredictions.map((p: any) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-2.5 py-1 text-xs">
                <span className="text-muted-foreground">{p.profiles?.display_name ?? "?"}:</span>
                <span className="font-display tracking-wider">{p.predicted_home_score}×{p.predicted_away_score}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSide({ team, align }: { team: any; align: "left" | "right" }) {
  return (
    <div className={`flex-1 flex items-center gap-2 ${align === "right" ? "justify-end text-right" : "justify-start"}`}>
      {align === "left" && <span className="text-2xl">{team?.flag_emoji}</span>}
      <div>
        <p className="font-display text-xl leading-none tracking-wide">{team?.code}</p>
        <p className="text-[10px] text-muted-foreground">{team?.name}</p>
      </div>
      {align === "right" && <span className="text-2xl">{team?.flag_emoji}</span>}
    </div>
  );
}
