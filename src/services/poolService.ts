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

  async joinByCode(code: string, _userId: string) {
    const normalized = code.trim().toUpperCase();
    const { data, error } = await supabase.rpc("request_join_pool" as any, { _code: normalized, _message: null });
    if (error) throw error;
    const row: any = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Código inválido. Verifique e tente novamente.");
    return { id: row.pool_id, name: row.pool_name, status: row.status as "pending" | "already_member" };
  },

  async listJoinRequests(poolId: string) {
    const { data: reqs, error } = await supabase
      .from("pool_join_requests" as any)
      .select("id, user_id, status, message, requested_at, decided_at")
      .eq("pool_id", poolId)
      .eq("status", "pending")
      .order("requested_at", { ascending: true });
    if (error) throw error;
    const userIds = (reqs ?? []).map((r: any) => r.user_id);
    let profMap = new Map<string, any>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
      profMap = new Map((profs ?? []).map((p) => [p.id, p]));
    }
    return (reqs ?? []).map((r: any) => ({ ...r, profile: profMap.get(r.user_id) ?? null }));
  },

  async decideJoinRequest(requestId: string, approve: boolean) {
    const { error } = await supabase.rpc("decide_join_request" as any, { _request_id: requestId, _approve: approve });
    if (error) throw error;
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
