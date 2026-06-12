// Edge Function: football-api
// Placeholder para futura integração com API externa de futebol.
// Atualmente apenas retorna um payload de status. Quando implementada,
// deverá:
//   1. Buscar jogos do provedor externo (API-Football, etc.) usando uma
//      chave armazenada em secrets (ex.: FOOTBALL_API_KEY).
//   2. Para cada partida retornada, fazer UPSERT em public.matches usando
//      external_match_id como chave de correlação.
//   3. Definir is_mock = false e last_synced_at = now() nas linhas atualizadas.
//   4. Quando status passa a 'finished', o trigger matches_after_finish_trg
//      recalcula automaticamente match_points e ranking_snapshots — esta
//      Edge Function NÃO precisa calcular pontos manualmente.

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "Stub: integração com API externa ainda não implementada. Os jogos atuais são demonstrativos (is_mock = true).",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
