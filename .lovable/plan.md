# Bolão da Copa 2026 — Plano Revisado

## 1. Regras de Pontuação (REVISADAS)

| Acerto | Pontos |
|---|---|
| Placar exato | **5** |
| Vencedor ou empate (sem placar exato) | **2** |
| Erro total | **0** |
| Bônus mata-mata: classificado correto | **+3** |

**Exemplos:**
- Real: Brasil 3x1 Japão → 3x1=5, 2x1=2, 1x0=2, 2x2=0
- Real: Brasil 1x1 Argentina, Brasil classificado nos pênaltis →
  - 1x1 + Brasil classificado = 5+3 = **8**
  - 2x2 + Brasil classificado = 0+3 = **3**
  - 1x1 + Argentina classificada = 5+0 = **5** (corrigido: acerto de placar conta mesmo errando classificado)
  - 0x0 + Argentina classificada = **0**

Função `calculate_match_points(prediction, match)` em SQL (security definer) aplicará esta lógica e populará `match_points`.

## 2. Backend — Lovable Cloud

### 2.1. Auth
- Email/senha + Google OAuth ativados.
- `profiles` ligada a `auth.users` via trigger `handle_new_user()`.

### 2.2. Roles & Admin global
- Enum `app_role` (`admin`, `user`).
- `user_roles` + função `has_role()` security definer.

### 2.3. Tabelas

**`pools`** — `name`, `description`, `invite_code` (6 chars), `bonus_lock_at`, `owner_id`, `status`.

**`pool_members`** — `pool_id`, `user_id`, `role` (`owner`|`admin`|`member`), `joined_at`.

**`teams`** — `name`, `code` (3 letras), `group_name`, `flag_emoji`.

**`matches`** (REVISADA)
```
id, external_match_id TEXT NULL,
home_team_id, away_team_id,
home_score INT NULL, away_score INT NULL,
winner_team_id UUID NULL,
kickoff_at TIMESTAMPTZ NOT NULL,
status match_status ENUM('scheduled','live','finished','postponed','cancelled') DEFAULT 'scheduled',
stage match_stage ENUM('group','round_of_16','quarter','semi','third_place','final'),
group_name TEXT NULL,
is_knockout BOOLEAN NOT NULL DEFAULT false,
is_mock BOOLEAN NOT NULL DEFAULT true,
last_synced_at TIMESTAMPTZ NULL,
created_at, updated_at
```

**`predictions`** (REVISADA)
```
id, pool_id, user_id, match_id,
predicted_home_score INT NOT NULL,
predicted_away_score INT NOT NULL,
predicted_winner_team_id UUID NULL,   -- apenas mata-mata
locked_at TIMESTAMPTZ NULL,           -- auditoria
created_at, updated_at,
UNIQUE(pool_id, user_id, match_id)
```

**`bonus_predictions`** — `pool_id`, `user_id`, `champion_team_id`, `top_scorer_player_name`, `best_player_name`, `locked_at`.

**`match_points`** — `pool_id`, `user_id`, `match_id`, `points`, `exact_score BOOLEAN`, `correct_result BOOLEAN`, `knockout_hit BOOLEAN`, `calculated_at`.

**`ranking_snapshots`** (NOVA)
```
id, pool_id, user_id,
total_points INT,
exact_scores INT,
correct_results INT,
knockout_hits INT,
position INT,
calculated_at TIMESTAMPTZ
```
Recalculada por função `recalculate_pool_ranking(pool_id)` chamada após atualização de placar ou job manual no admin.

### 2.4. Lógica de Bloqueio dos Palpites
- **NÃO** depende de `locked_at`.
- Trigger BEFORE INSERT/UPDATE em `predictions` valida:
  ```sql
  IF (SELECT kickoff_at FROM matches WHERE id = NEW.match_id) <= now() THEN
    RAISE EXCEPTION 'Palpite bloqueado: partida já iniciou';
  END IF;
  ```
- `locked_at` permanece apenas como auditoria (preenchido no kickoff por job opcional).
- Frontend também desabilita inputs quando `kickoff_at <= now()`.

### 2.5. Visibilidade Social dos Palpites (RLS)
Política em `predictions`:
- **Antes do kickoff:** usuário vê apenas os próprios palpites no bolão.
- **Após o kickoff:** todos os membros do bolão veem todos os palpites daquele `match_id`.

```sql
CREATE POLICY "predictions_visibility" ON public.predictions FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pool_members pm
          WHERE pm.pool_id = predictions.pool_id AND pm.user_id = auth.uid())
  AND (
    predictions.user_id = auth.uid()
    OR (SELECT kickoff_at FROM public.matches WHERE id = predictions.match_id) <= now()
  )
);
```

### 2.6. Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_snapshots;
```

### 2.7. Funções & Triggers
- `handle_new_user()` → cria profile.
- `generate_invite_code()` → 6 chars únicos em pools.
- `prevent_locked_prediction()` → trigger de bloqueio por kickoff.
- `calculate_match_points(match_id)` → calcula pontos para todos os palpites do jogo aplicando a tabela revisada.
- `recalculate_pool_ranking(pool_id)` → atualiza `ranking_snapshots`.
- Trigger AFTER UPDATE em `matches` (quando `status` muda para `finished`) → chama `calculate_match_points` + `recalculate_pool_ranking`.

### 2.8. Edge Function stub
`supabase/functions/football-api/` — placeholder para futura sincronização com API externa de futebol. Comentários explicando o fluxo de atualizar `matches` por `external_match_id` e setar `is_mock=false`, `last_synced_at`.

## 3. Frontend

### 3.1. Rotas
```
/                       Landing / Login
/login, /register       Auth
/dashboard              Meus Bolões
/pools/new              Criar bolão
/pools/join             Entrar com código
/pools/:id              Detalhe (tabs: Jogos, Ranking, Bônus, Membros)
/pools/:id/matches      Palpites
/pools/:id/ranking      Ranking em tempo real
/pools/:id/bonus        Palpites bônus
/pools/:id/admin        Painel admin (owner/admin)
```

### 3.2. Design System
- Paleta: verde campo `#1B5E20`, dourado `#FFD700`, azul escuro `#0A1628`, off-white `#F5F5F0`.
- Display: Bebas Neue. Body: Inter.
- Cards com gradiente sutil, medalhas no Top 3, bottom tabs mobile.
- Tokens semânticos em `index.css` e `tailwind.config.ts` — sem cores hardcoded.

### 3.3. Componentes-chave
`AuthLayout`, `AppLayout`, `BottomNav`, `PoolCard`, `MatchCard` (com inputs desabilitados após kickoff e exibição de todos os palpites pós-kickoff), `RankingTable` (medalhas), `BonusForm`, `PoolAdminPanel` (definir resultado + classificado + recalcular), `InviteCodeInput`, `MockMatchesBanner` (banner amarelo no admin: "Jogos demonstrativos — serão substituídos por partidas reais via integração externa").

### 3.4. Hooks
- `useAuth()`
- `usePool(poolId)`, `useMatches(poolId)`, `usePredictions(poolId)`
- `useBonusPredictions(poolId)`
- `useRealtimeRanking(poolId)` — subscription em `match_points` + `ranking_snapshots`, invalidando React Query.

### 3.5. Ranking em Tempo Real
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`ranking:${poolId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'match_points', filter: `pool_id=eq.${poolId}` },
      () => queryClient.invalidateQueries({ queryKey: ['ranking', poolId] }))
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'ranking_snapshots', filter: `pool_id=eq.${poolId}` },
      () => queryClient.invalidateQueries({ queryKey: ['ranking', poolId] }))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [poolId]);
```

## 4. Seed Data
- ~12 jogos representativos da Copa 2026 com 8–12 seleções (Brasil, Argentina, França, Alemanha, Espanha, Inglaterra, Portugal, Itália, Países Baixos, Croácia…).
- Fase de grupos + mata-mata fictício.
- **Todos com `is_mock = true`**.
- Banner persistente no painel admin avisando que são jogos demonstrativos.

## 5. Entregáveis
- App full-stack pt-BR funcional: auth, bolões, palpites com bloqueio por kickoff, visibilidade social pós-kickoff, ranking em tempo real, bônus, admin manual com aviso de mock.
- Código organizado em componentes/hooks/services.
- Estados de loading/erro/vazio.
- Edge Function stub `football-api` pronta para expansão.
