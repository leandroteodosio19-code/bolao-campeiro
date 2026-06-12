
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.pool_member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.pool_status AS ENUM ('active', 'finished');
CREATE TYPE public.match_status AS ENUM ('scheduled','live','finished','postponed','cancelled');
CREATE TYPE public.match_stage AS ENUM ('group','round_of_16','quarter','semi','third_place','final');

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ USER ROLES (global) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ TEAMS ============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  group_name TEXT,
  flag_emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO authenticated, anon;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_admin_write" ON public.teams FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MATCHES ============
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_match_id TEXT,
  home_team_id UUID NOT NULL REFERENCES public.teams(id),
  away_team_id UUID NOT NULL REFERENCES public.teams(id),
  home_score INT,
  away_score INT,
  winner_team_id UUID REFERENCES public.teams(id),
  kickoff_at TIMESTAMPTZ NOT NULL,
  status public.match_status NOT NULL DEFAULT 'scheduled',
  stage public.match_stage NOT NULL DEFAULT 'group',
  group_name TEXT,
  is_knockout BOOLEAN NOT NULL DEFAULT false,
  is_mock BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_public_read" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_admin_write" ON public.matches FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POOLS ============
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE code TEXT; tries INT := 0;
BEGIN
  LOOP
    code := upper(substr(replace(encode(gen_random_bytes(6), 'base64'), '/', ''), 1, 6));
    code := regexp_replace(code, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.pools WHERE invite_code = code);
    tries := tries + 1; IF tries > 20 THEN RAISE EXCEPTION 'Could not generate invite code'; END IF;
  END LOOP;
  RETURN code;
END; $$;

CREATE TABLE public.pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  bonus_lock_at TIMESTAMPTZ,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.pool_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pools TO authenticated;
GRANT ALL ON public.pools TO service_role;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER pools_updated_at BEFORE UPDATE ON public.pools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto invite_code + auto bonus_lock_at
CREATE OR REPLACE FUNCTION public.pool_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  IF NEW.bonus_lock_at IS NULL THEN
    SELECT MIN(kickoff_at) INTO NEW.bonus_lock_at FROM public.matches WHERE is_mock = true;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER pools_before_insert BEFORE INSERT ON public.pools FOR EACH ROW EXECUTE FUNCTION public.pool_before_insert();

-- ============ POOL MEMBERS ============
CREATE TABLE public.pool_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.pool_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pool_members TO authenticated;
GRANT ALL ON public.pool_members TO service_role;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid recursion)
CREATE OR REPLACE FUNCTION public.is_pool_member(_pool_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.pool_members WHERE pool_id = _pool_id AND user_id = _user_id)
$$;
CREATE OR REPLACE FUNCTION public.is_pool_admin(_pool_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.pool_members WHERE pool_id = _pool_id AND user_id = _user_id AND role IN ('owner','admin'))
$$;

-- Pools policies
CREATE POLICY "pools_select_members_or_by_code" ON public.pools FOR SELECT TO authenticated
USING (public.is_pool_member(id, auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "pools_insert_owner" ON public.pools FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());
CREATE POLICY "pools_update_admin" ON public.pools FOR UPDATE TO authenticated
USING (public.is_pool_admin(id, auth.uid())) WITH CHECK (public.is_pool_admin(id, auth.uid()));
CREATE POLICY "pools_delete_owner" ON public.pools FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- Pool members policies
CREATE POLICY "pool_members_select_members" ON public.pool_members FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));
CREATE POLICY "pool_members_insert_self" ON public.pool_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "pool_members_update_admin" ON public.pool_members FOR UPDATE TO authenticated
USING (public.is_pool_admin(pool_id, auth.uid())) WITH CHECK (public.is_pool_admin(pool_id, auth.uid()));
CREATE POLICY "pool_members_delete_self_or_admin" ON public.pool_members FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_pool_admin(pool_id, auth.uid()));

-- Auto-add owner as member
CREATE OR REPLACE FUNCTION public.pool_after_insert_add_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.pool_members (pool_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (pool_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER pools_after_insert_owner AFTER INSERT ON public.pools FOR EACH ROW EXECUTE FUNCTION public.pool_after_insert_add_owner();

-- Helper to look up pool by invite_code, security definer (so non-members can find pool to join)
CREATE OR REPLACE FUNCTION public.get_pool_by_invite_code(_code TEXT)
RETURNS TABLE (id uuid, name text, description text, owner_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, description, owner_id FROM public.pools WHERE invite_code = upper(_code) LIMIT 1
$$;

-- ============ PREDICTIONS ============
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score INT NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score INT NOT NULL CHECK (predicted_away_score >= 0),
  predicted_winner_team_id UUID REFERENCES public.teams(id),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id, match_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER predictions_updated_at BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Block predictions after kickoff
CREATE OR REPLACE FUNCTION public.prevent_locked_prediction()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE k TIMESTAMPTZ;
BEGIN
  SELECT kickoff_at INTO k FROM public.matches WHERE id = NEW.match_id;
  IF k IS NULL THEN RAISE EXCEPTION 'Partida inexistente'; END IF;
  IF k <= now() THEN RAISE EXCEPTION 'Palpite bloqueado: partida já iniciou'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER predictions_block_after_kickoff
BEFORE INSERT OR UPDATE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_prediction();

-- Visibility policy: own predictions any time, others only after kickoff
CREATE POLICY "predictions_select_social" ON public.predictions FOR SELECT TO authenticated
USING (
  public.is_pool_member(pool_id, auth.uid())
  AND (
    user_id = auth.uid()
    OR (SELECT kickoff_at FROM public.matches WHERE id = predictions.match_id) <= now()
  )
);
CREATE POLICY "predictions_insert_self_member" ON public.predictions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_pool_member(pool_id, auth.uid()));
CREATE POLICY "predictions_update_self" ON public.predictions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "predictions_delete_self" ON public.predictions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============ BONUS PREDICTIONS ============
CREATE TABLE public.bonus_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  champion_team_id UUID REFERENCES public.teams(id),
  top_scorer_player_name TEXT,
  best_player_name TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_predictions TO authenticated;
GRANT ALL ON public.bonus_predictions TO service_role;
ALTER TABLE public.bonus_predictions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER bonus_predictions_updated_at BEFORE UPDATE ON public.bonus_predictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.prevent_locked_bonus()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE lock_at TIMESTAMPTZ;
BEGIN
  SELECT bonus_lock_at INTO lock_at FROM public.pools WHERE id = NEW.pool_id;
  IF lock_at IS NOT NULL AND lock_at <= now() THEN
    RAISE EXCEPTION 'Palpite bônus bloqueado: período encerrado';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bonus_block_after_lock
BEFORE INSERT OR UPDATE ON public.bonus_predictions
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_bonus();

CREATE POLICY "bonus_select_members" ON public.bonus_predictions FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));
CREATE POLICY "bonus_insert_self_member" ON public.bonus_predictions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_pool_member(pool_id, auth.uid()));
CREATE POLICY "bonus_update_self" ON public.bonus_predictions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "bonus_delete_self" ON public.bonus_predictions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============ MATCH POINTS ============
CREATE TABLE public.match_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  exact_score BOOLEAN NOT NULL DEFAULT false,
  correct_result BOOLEAN NOT NULL DEFAULT false,
  knockout_hit BOOLEAN NOT NULL DEFAULT false,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id, match_id)
);
GRANT SELECT ON public.match_points TO authenticated;
GRANT ALL ON public.match_points TO service_role;
ALTER TABLE public.match_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_points_select_members" ON public.match_points FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- ============ RANKING SNAPSHOTS ============
CREATE TABLE public.ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INT NOT NULL DEFAULT 0,
  exact_scores INT NOT NULL DEFAULT 0,
  correct_results INT NOT NULL DEFAULT 0,
  knockout_hits INT NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);
GRANT SELECT ON public.ranking_snapshots TO authenticated;
GRANT ALL ON public.ranking_snapshots TO service_role;
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranking_select_members" ON public.ranking_snapshots FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- ============ SCORING FUNCTIONS ============
-- Calculates and upserts match_points for ALL predictions of a match across all pools
CREATE OR REPLACE FUNCTION public.calculate_match_points(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  p RECORD;
  pts INT;
  exact BOOLEAN;
  correct BOOLEAN;
  ko_hit BOOLEAN;
  real_winner UUID;
BEGIN
  SELECT * INTO m FROM public.matches WHERE id = _match_id;
  IF m IS NULL OR m.status <> 'finished' OR m.home_score IS NULL OR m.away_score IS NULL THEN
    RETURN;
  END IF;

  -- Determine real winner (NULL = draw in groups)
  IF m.home_score > m.away_score THEN real_winner := m.home_team_id;
  ELSIF m.away_score > m.home_score THEN real_winner := m.away_team_id;
  ELSE real_winner := NULL; END IF;

  FOR p IN SELECT * FROM public.predictions WHERE match_id = _match_id LOOP
    exact := (p.predicted_home_score = m.home_score AND p.predicted_away_score = m.away_score);
    -- correct result: same winner or both draws
    IF p.predicted_home_score = p.predicted_away_score AND m.home_score = m.away_score THEN
      correct := true;
    ELSIF p.predicted_home_score > p.predicted_away_score AND m.home_score > m.away_score THEN
      correct := true;
    ELSIF p.predicted_home_score < p.predicted_away_score AND m.home_score < m.away_score THEN
      correct := true;
    ELSE correct := false; END IF;

    IF exact THEN pts := 5;
    ELSIF correct THEN pts := 2;
    ELSE pts := 0; END IF;

    ko_hit := false;
    IF m.is_knockout AND m.winner_team_id IS NOT NULL AND p.predicted_winner_team_id = m.winner_team_id THEN
      ko_hit := true;
      pts := pts + 3;
    END IF;

    INSERT INTO public.match_points (pool_id, user_id, match_id, points, exact_score, correct_result, knockout_hit, calculated_at)
    VALUES (p.pool_id, p.user_id, _match_id, pts, exact, correct, ko_hit, now())
    ON CONFLICT (pool_id, user_id, match_id) DO UPDATE
      SET points = EXCLUDED.points,
          exact_score = EXCLUDED.exact_score,
          correct_result = EXCLUDED.correct_result,
          knockout_hit = EXCLUDED.knockout_hit,
          calculated_at = now();
  END LOOP;
END; $$;

-- Recalculate ranking snapshots for one pool
CREATE OR REPLACE FUNCTION public.recalculate_pool_ranking(_pool_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.ranking_snapshots WHERE pool_id = _pool_id;
  INSERT INTO public.ranking_snapshots (pool_id, user_id, total_points, exact_scores, correct_results, knockout_hits, position, calculated_at)
  SELECT
    pm.pool_id,
    pm.user_id,
    COALESCE(SUM(mp.points), 0) AS total_points,
    COALESCE(SUM(CASE WHEN mp.exact_score THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN mp.correct_result THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN mp.knockout_hit THEN 1 ELSE 0 END), 0),
    RANK() OVER (ORDER BY COALESCE(SUM(mp.points),0) DESC, COALESCE(SUM(CASE WHEN mp.exact_score THEN 1 ELSE 0 END),0) DESC),
    now()
  FROM public.pool_members pm
  LEFT JOIN public.match_points mp ON mp.pool_id = pm.pool_id AND mp.user_id = pm.user_id
  WHERE pm.pool_id = _pool_id
  GROUP BY pm.pool_id, pm.user_id;
END; $$;

-- Recalculate all pools that have predictions for this match
CREATE OR REPLACE FUNCTION public.recalculate_rankings_for_match(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT pool_id FROM public.predictions WHERE match_id = _match_id LOOP
    PERFORM public.recalculate_pool_ranking(r.pool_id);
  END LOOP;
END; $$;

-- Trigger on matches: when status becomes finished, calculate points & rankings
CREATE OR REPLACE FUNCTION public.matches_after_finish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    PERFORM public.calculate_match_points(NEW.id);
    PERFORM public.recalculate_rankings_for_match(NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER matches_after_finish_trg AFTER INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.matches_after_finish();

-- ============ REALTIME ============
ALTER TABLE public.match_points REPLICA IDENTITY FULL;
ALTER TABLE public.ranking_snapshots REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.predictions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
