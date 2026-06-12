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

export const rankingService = {
  async listSnapshots(poolId: string) {
    const { data, error } = await supabase
      .from("ranking_snapshots")
      .select("*")
      .eq("pool_id", poolId)
      .order("position", { ascending: true });
    if (error) throw error;
    const rows = data ?? [];
    const profMap = await fetchProfilesMap([...new Set(rows.map((r) => r.user_id))]);
    return rows.map((r) => ({ ...r, profiles: profMap.get(r.user_id) ?? null }));
  },
};
