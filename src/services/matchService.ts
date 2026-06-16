import { supabase } from "@/integrations/supabase/client";

export const matchService = {
  async listAll() {
    const { data, error } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .order("kickoff_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async updateResult(matchId: string, payload: {
    home_score: number;
    away_score: number;
    winner_team_id?: string | null;
    status?: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  }) {
    console.log("[finalizeMatch] matchId", matchId);
    console.log("[finalizeMatch] payload", payload);
    const { data, error } = await supabase
      .from("matches")
      .update({
        home_score: payload.home_score,
        away_score: payload.away_score,
        winner_team_id: payload.winner_team_id ?? null,
        status: payload.status ?? "finished",
      })
      .eq("id", matchId)
      .select()
      .maybeSingle();
    console.log("[finalizeMatch] queryResult", data);
    if (error) {
      console.error("[finalizeMatch] error", error);
      throw error;
    }
    if (!data) {
      const msg = "Sem permissão para atualizar este jogo (ou jogo inexistente).";
      console.error("[finalizeMatch] error", msg);
      throw new Error(msg);
    }
    return data;
  },
};
