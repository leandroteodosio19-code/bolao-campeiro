import { useQuery } from "@tanstack/react-query";
import { rankingService } from "@/services/rankingService";
import { useRealtimeRanking } from "@/hooks/useRealtimeRanking";
import { Loader2, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function RankingTable({ poolId }: { poolId: string }) {
  useRealtimeRanking(poolId);
  const { data, isLoading } = useQuery({
    queryKey: ["ranking", poolId],
    queryFn: () => rankingService.listSnapshots(poolId),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>;
  if (!data?.length) return (
    <div className="glass-card p-8 text-center">
      <Trophy className="mx-auto h-10 w-10 text-secondary opacity-70" />
      <p className="mt-3 font-display text-xl">RANKING AINDA VAZIO</p>
      <p className="text-sm text-muted-foreground">Os pontos aparecem aqui assim que jogos forem finalizados.</p>
    </div>
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <h2 className="font-display text-xl tracking-wide">RANKING AO VIVO</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-success animate-pulse-gold rounded-full bg-success/10 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> tempo real
        </span>
      </div>
      <ul>
        {data.map((row: any) => {
          const pos = row.position;
          const medalColor = pos === 1 ? "text-gold" : pos === 2 ? "text-silver" : pos === 3 ? "text-bronze" : "text-muted-foreground";
          return (
            <li key={row.user_id} className={cn("flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0", pos <= 3 && "bg-gradient-to-r from-secondary/5 to-transparent")}>
              <div className="w-8 text-center font-display text-2xl tracking-wider">
                {pos <= 3 ? <Medal className={cn("inline h-6 w-6", medalColor)} /> : pos}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold">{row.profiles?.display_name ?? "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.exact_scores} placar(es) exato(s) · {row.correct_results} acerto(s) · {row.knockout_hits} classificado(s)
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl leading-none tracking-wider text-secondary">{row.total_points}</div>
                <div className="text-[10px] uppercase text-muted-foreground">pontos</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
