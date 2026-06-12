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
        invite_code: "", // gerado por trigger
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
      .rpc("get_pool_by_invite_code", { _code: normalized })
      .maybeSingle();
    if (rpcErr) throw rpcErr;
    if (!pool) throw new Error("Código inválido. Verifique e tente novamente.");
    const { error: insErr } = await supabase
      .from("pool_members")
      .insert({ pool_id: pool.id, user_id: userId, role: "member" });
    if (insErr && !insErr.message.includes("duplicate")) throw insErr;
    return pool;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from("pools").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async listMembers(poolId: string) {
    const { data, error } = await supabase
      .from("pool_members")
      .select("user_id, role, joined_at, profiles(display_name, avatar_url)")
      .eq("pool_id", poolId);
    if (error) throw error;
    return data ?? [];
  },
};
