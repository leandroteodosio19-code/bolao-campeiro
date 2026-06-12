import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscreve em Realtime para o ranking de um bolão e invalida as
 * queries do React Query sempre que match_points ou ranking_snapshots
 * mudam para aquele pool_id.
 */
export function useRealtimeRanking(poolId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!poolId) return;
    const channel = supabase
      .channel(`ranking:${poolId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_points", filter: `pool_id=eq.${poolId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["ranking", poolId] });
          qc.invalidateQueries({ queryKey: ["match-points", poolId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranking_snapshots", filter: `pool_id=eq.${poolId}` },
        () => qc.invalidateQueries({ queryKey: ["ranking", poolId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => qc.invalidateQueries({ queryKey: ["matches"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId, qc]);
}
