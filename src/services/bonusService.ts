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

export const bonusService = {
  async getMine(poolId: string, userId: string) {
    const { data, error } = await supabase
      .from("bonus_predictions")
      .select("*")
      .eq("pool_id", poolId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async listAll(poolId: string) {
    const { data, error } = await supabase
      .from("bonus_predictions")
      .select("*, team:teams!bonus_predictions_champion_team_id_fkey(name, flag_emoji, code)")
      .eq("pool_id", poolId);
    if (error) throw error;
    const rows = (data ?? []) as any[];
    const profMap = await fetchProfilesMap([...new Set(rows.map((r) => r.user_id))]);
    return rows.map((r) => ({ ...r, profiles: profMap.get(r.user_id) ?? null }));
  },

  async upsert(input: {
    poolId: string;
    userId: string;
    championTeamId?: string | null;
    topScorerPlayerName?: string;
    bestPlayerName?: string;
  }) {
    const { data, error } = await supabase
      .from("bonus_predictions")
      .upsert(
        {
          pool_id: input.poolId,
          user_id: input.userId,
          champion_team_id: input.championTeamId ?? null,
          top_scorer_player_name: input.topScorerPlayerName ?? null,
          best_player_name: input.bestPlayerName ?? null,
        },
        { onConflict: "pool_id,user_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
