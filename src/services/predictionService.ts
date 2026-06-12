import { supabase } from "@/integrations/supabase/client";

export const predictionService = {
  async listForPool(poolId: string) {
    const { data, error } = await supabase
      .from("predictions")
      .select("*, profiles:profiles!predictions_user_id_fkey(display_name, avatar_url)")
      .eq("pool_id", poolId);
    if (error) throw error;
    return data ?? [];
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
