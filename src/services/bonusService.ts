import { supabase } from "@/integrations/supabase/client";

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
      .select("*, profiles:profiles!bonus_predictions_user_id_fkey(display_name, avatar_url), team:teams!bonus_predictions_champion_team_id_fkey(name, flag_emoji, code)")
      .eq("pool_id", poolId);
    if (error) throw error;
    return data ?? [];
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
