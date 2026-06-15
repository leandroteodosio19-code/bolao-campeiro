// Edge Function: sync-worldcup-matches
// Sincroniza jogos reais da Copa do Mundo 2026 a partir de uma API externa configurável.
//
// Variáveis de ambiente esperadas (configuráveis via secrets):
//   FOOTBALL_API_BASE_URL  - URL base do provedor (ex.: https://api-football-v1.p.rapidapi.com/v3)
//   FOOTBALL_API_KEY       - chave do provedor
//   FOOTBALL_API_PROVIDER  - identificador textual ('api-football', 'football-data', ...)
//
// Enquanto a chave não estiver configurada, a função registra o evento em
// external_api_logs (status='not_configured') e retorna 200 — o admin manual
// permanece como fallback.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Authn: exige usuário logado
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return json({ error: "Não autenticado" }, 401);
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "Não autenticado" }, 401);

  // Authz: só admins globais podem disparar sincronização manual
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: userRes.user.id,
    _role: "admin",
  });
  if (!isAdmin) return json({ error: "Apenas administradores podem sincronizar" }, 403);

  const provider = Deno.env.get("FOOTBALL_API_PROVIDER") ?? "unconfigured";
  const baseUrl = Deno.env.get("FOOTBALL_API_BASE_URL");
  const apiKey = Deno.env.get("FOOTBALL_API_KEY");

  if (!baseUrl || !apiKey) {
    await admin.from("external_api_logs").insert({
      provider,
      endpoint: null,
      status: "not_configured",
      response_summary: "FOOTBALL_API_KEY/BASE_URL ausentes. Sync ignorado.",
    });
    return json(
      {
        ok: false,
        configured: false,
        message:
          "Integração externa não configurada. Defina FOOTBALL_API_KEY e FOOTBALL_API_BASE_URL para sincronizar automaticamente. Resultados continuam editáveis manualmente no painel admin.",
      },
      200,
    );
  }

  // TODO (próxima fase): chamada real ao provedor + UPSERT em matches por external_match_id.
  // Estrutura preparada — mantida como placeholder para evitar custos sem configuração validada.
  await admin.from("external_api_logs").insert({
    provider,
    endpoint: baseUrl,
    status: "stub_invoked",
    response_summary:
      "Stub de sincronização chamado. Implementação real do provedor pendente.",
  });

  return json(
    {
      ok: true,
      configured: true,
      provider,
      message:
        "Sincronização estrutural executada. A integração real com o provedor será ativada na próxima fase.",
    },
    200,
  );
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
