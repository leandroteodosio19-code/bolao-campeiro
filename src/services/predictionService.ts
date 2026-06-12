import { supabase } from "@/integrations/supabase/client";

async function fetchProfilesMap(userIds: string[]) {
  if (!userIds.length) return new Map<string, any>();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id, p]));
}

export const predictionService = {
  async listForPool(poolId: string) {
    const { data, error } = await supabase.from("predictions").select("*").eq("pool_id", poolId);
    if (error) throw error;
    const rows = data ?? [];
    const profMap = await fetchProfilesMap([...new Set(rows.map((r) => r.user_id))]);
    return rows.map((r) => ({ ...r, profiles: profMap.get(r.user_id) ?? null }));
  },

  async upsert(input: {
    poolId: string;
    userId: string;
    matchId: string;
    homeScore: number;
    awayScore: number;
    winnerTeamId?: string | null;
  }) {
    const { data, error } = await supabase
      .from("predictions")
      .upsert(
        {
          pool_id: input.poolId,
          user_id: input.userId,
          match_id: input.matchId,
          predicted_home_score: input.homeScore,
          predicted_away_score: input.awayScore,
          predicted_winner_team_id: input.winnerTeamId ?? null,
        },
        { onConflict: "pool_id,user_id,match_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
