/**
 * footballApiService — stub para futura integração com API externa de futebol
 * (ex.: API-Football, Football-Data.org) via Edge Function `football-api`.
 *
 * Fluxo planejado:
 *   1. Edge Function `football-api` consulta o provedor externo usando
 *      external_match_id e atualiza `matches.home_score`, `away_score`,
 *      `winner_team_id`, `status`, `last_synced_at`, `is_mock = false`.
 *   2. O trigger `matches_after_finish_trg` recalcula automaticamente
 *      `match_points` e `ranking_snapshots`.
 *   3. O frontend recebe os updates via Realtime e atualiza o ranking
 *      em tempo real, sem ações manuais do usuário.
 *
 * Por enquanto, este arquivo expõe apenas a forma esperada do serviço.
 */

import { supabase } from "@/integrations/supabase/client";

export const footballApiService = {
  /** Aciona sincronização manual via Edge Function (não implementada ainda). */
  async sync(): Promise<{ ok: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke("football-api", {
        body: { action: "sync" },
      });
      if (error) throw error;
      return { ok: true, message: data?.message ?? "Sincronização disparada." };
    } catch (e: any) {
      return { ok: false, message: e?.message ?? "Edge Function ainda não disponível." };
    }
  },
};
