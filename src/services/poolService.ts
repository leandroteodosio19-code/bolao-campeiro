import { supabase } from "@/integrations/supabase/client";

export const poolService = {
  async listMyPools(userId: string) {
    const { data, error } = await supabase
      .from("pool_members")
      .select("pool_id, role, pools(id, name, description, invite_code, status, owner_id, bonus_lock_at, created_at)")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ ...row.pools, my_role: row.role }));
  },

  async create(input: { name: string; description?: string; ownerId: string; bonusLockAt?: string }) {
    const { data, error } = await supabase
      .from("pools")
      .insert({
        name: input.name,
        description: input.description ?? null,
        owner_id: input.ownerId,
        invite_code: "",
        bonus_lock_at: input.bonusLockAt ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async joinByCode(code: string, userId: string) {
    const normalized = code.trim().toUpperCase();
    const { data: pool, error: rpcErr } = await supabase
      .rpc("get_pool_by_invite_code" as any, { _code: normalized });
    if (rpcErr) throw rpcErr;
    const found = Array.isArray(pool) ? pool[0] : pool;
    if (!found) throw new Error("Código inválido. Verifique e tente novamente.");
    const { error: insErr } = await supabase
      .from("pool_members")
      .insert({ pool_id: found.id, user_id: userId, role: "member" });
    if (insErr && !insErr.message.includes("duplicate")) throw insErr;
    return found;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from("pools").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async listMembers(poolId: string) {
    const { data: members, error } = await supabase
      .from("pool_members")
      .select("user_id, role, joined_at")
      .eq("pool_id", poolId);
    if (error) throw error;
    const userIds = (members ?? []).map((m) => m.user_id);
    let profMap = new Map<string, any>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
      profMap = new Map((profs ?? []).map((p) => [p.id, p]));
    }
    return (members ?? []).map((m) => ({ ...m, profiles: profMap.get(m.user_id) ?? null }));
  },
};
