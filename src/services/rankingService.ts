import { supabase } from "@/integrations/supabase/client";

export const rankingService = {
  async listSnapshots(poolId: string) {
    const { data, error } = await supabase
      .from("ranking_snapshots")
      .select("*, profiles:profiles!ranking_snapshots_user_id_fkey(display_name, avatar_url)")
      .eq("pool_id", poolId)
      .order("position", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async recalc(poolId: string) {
    const { error } = await supabase.rpc("recalculate_pool_ranking" as any, { _pool_id: poolId });
    if (error) throw error;
  },
};
