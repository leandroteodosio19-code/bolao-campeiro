-- Security hardening for pools, predictions, bonus locks, matches, and ranking.

DROP POLICY IF EXISTS "pool_members_insert_self" ON public.pool_members;

CREATE OR REPLACE FUNCTION public.prevent_pool_without_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  remaining_owners integer;
  pool_still_exists boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS(SELECT 1 FROM public.pools WHERE id = OLD.pool_id) INTO pool_still_exists;
    IF NOT pool_still_exists THEN RETURN OLD; END IF;
    IF OLD.role = 'owner' THEN
      SELECT COUNT(*) INTO remaining_owners FROM public.pool_members
      WHERE pool_id = OLD.pool_id AND role = 'owner' AND id <> OLD.id;
      IF remaining_owners = 0 THEN RAISE EXCEPTION 'O bolão precisa manter ao menos um dono'; END IF;
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.role = 'owner' AND (NEW.role <> 'owner' OR NEW.pool_id <> OLD.pool_id OR NEW.user_id <> OLD.user_id) THEN
    SELECT COUNT(*) INTO remaining_owners FROM public.pool_members
    WHERE pool_id = OLD.pool_id AND role = 'owner' AND id <> OLD.id;
    IF remaining_owners = 0 THEN RAISE EXCEPTION 'O bolão precisa manter ao menos um dono'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pool_members_keep_owner ON public.pool_members;
CREATE TRIGGER pool_members_keep_owner
BEFORE UPDATE OR DELETE ON public.pool_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_pool_without_owner();

CREATE OR REPLACE FUNCTION public.validate_pool_owner_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pool_members
      WHERE pool_id = NEW.id AND user_id = NEW.owner_id AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'owner_id precisa apontar para um membro com papel owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pools_validate_owner_id ON public.pools;
CREATE TRIGGER pools_validate_owner_id
BEFORE UPDATE ON public.pools
FOR EACH ROW EXECUTE FUNCTION public.validate_pool_owner_id();

CREATE OR REPLACE FUNCTION public.pool_members_after_change_recalculate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_pool_ranking(NEW.pool_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.pool_id <> OLD.pool_id THEN
      PERFORM public.recalculate_pool_ranking(OLD.pool_id);
    END IF;
    PERFORM public.recalculate_pool_ranking(NEW.pool_id);
    RETURN NEW;
  ELSE
    PERFORM public.recalculate_pool_ranking(OLD.pool_id);
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS pool_members_after_change_recalculate ON public.pool_members;
CREATE TRIGGER pool_members_after_change_recalculate
AFTER INSERT OR UPDATE OR DELETE ON public.pool_members
FOR EACH ROW EXECUTE FUNCTION public.pool_members_after_change_recalculate();

DROP POLICY IF EXISTS matches_admin_write ON public.matches;
CREATE POLICY matches_admin_write
ON public.matches
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DO $$
BEGIN
  IF EXISTS (
    SELECT external_match_id FROM public.matches
    WHERE external_match_id IS NOT NULL
    GROUP BY external_match_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem external_match_id duplicados em public.matches';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_external_match_id_uniq') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_external_match_id_uniq UNIQUE (external_match_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_locked_prediction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  k timestamptz;
  target_match_id uuid;
BEGIN
  target_match_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.match_id ELSE NEW.match_id END;
  SELECT kickoff_at INTO k FROM public.matches WHERE id = target_match_id;
  IF k IS NULL THEN RAISE EXCEPTION 'Partida inexistente'; END IF;
  IF k <= now() THEN RAISE EXCEPTION 'Palpite bloqueado: partida já iniciou'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS predictions_block_delete_after_kickoff ON public.predictions;
CREATE TRIGGER predictions_block_delete_after_kickoff
BEFORE DELETE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_prediction();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.predictions
    WHERE predicted_home_score < 0 OR predicted_away_score < 0
       OR predicted_home_score > 50 OR predicted_away_score > 50
  ) THEN
    RAISE EXCEPTION 'Existem palpites com placares fora do intervalo 0..50';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'predictions_score_reasonable') THEN
    ALTER TABLE public.predictions
      ADD CONSTRAINT predictions_score_reasonable
      CHECK (predicted_home_score BETWEEN 0 AND 50 AND predicted_away_score BETWEEN 0 AND 50);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_prediction_winner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE m record;
BEGIN
  SELECT home_team_id, away_team_id, is_knockout INTO m FROM public.matches WHERE id = NEW.match_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Partida inexistente'; END IF;
  IF m.is_knockout THEN
    IF NEW.predicted_winner_team_id IS NULL THEN
      RAISE EXCEPTION 'Palpite de mata-mata precisa informar o classificado';
    END IF;
  ELSIF NEW.predicted_winner_team_id IS NOT NULL THEN
    RAISE EXCEPTION 'Classificado só deve ser informado em partidas mata-mata';
  END IF;
  IF NEW.predicted_winner_team_id IS NOT NULL
     AND NEW.predicted_winner_team_id NOT IN (m.home_team_id, m.away_team_id) THEN
    RAISE EXCEPTION 'Classificado precisa ser um dos times da partida';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS predictions_validate_winner ON public.predictions;
CREATE TRIGGER predictions_validate_winner
BEFORE INSERT OR UPDATE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.validate_prediction_winner();

CREATE OR REPLACE FUNCTION public.prevent_locked_bonus()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  lock_at timestamptz;
  target_pool_id uuid;
BEGIN
  target_pool_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.pool_id ELSE NEW.pool_id END;
  SELECT bonus_lock_at INTO lock_at FROM public.pools WHERE id = target_pool_id;
  IF lock_at IS NOT NULL AND lock_at <= now() THEN
    RAISE EXCEPTION 'Palpite bônus bloqueado: período encerrado';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "bonus_delete_own_before_lock" ON public.bonus_predictions;
DROP POLICY IF EXISTS "bonus_delete_self" ON public.bonus_predictions;
CREATE POLICY "bonus_delete_own_before_lock"
ON public.bonus_predictions
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND public.is_pool_member(pool_id, auth.uid())
  AND COALESCE((SELECT bonus_lock_at FROM public.pools WHERE id = pool_id), 'infinity'::timestamptz) > now()
);

CREATE OR REPLACE FUNCTION public.matches_after_finish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  points_deleted boolean := false;
BEGIN
  IF NEW.status = 'finished' THEN
    IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
      RAISE EXCEPTION 'Partida finalizada precisa de placar';
    END IF;
    IF NEW.home_score < 0 OR NEW.away_score < 0 THEN
      RAISE EXCEPTION 'Placar não pode ser negativo';
    END IF;
    IF NEW.is_knockout THEN
      IF NEW.winner_team_id IS NULL THEN
        RAISE EXCEPTION 'Partida mata-mata finalizada precisa de classificado';
      END IF;
      IF NEW.winner_team_id NOT IN (NEW.home_team_id, NEW.away_team_id) THEN
        RAISE EXCEPTION 'Classificado precisa ser um dos times da partida';
      END IF;
    END IF;
    PERFORM public.calculate_match_points(NEW.id);
    PERFORM public.recalculate_rankings_for_match(NEW.id);
    RETURN NEW;
  END IF;
  FOR r IN
    SELECT DISTINCT pool_id FROM public.match_points WHERE match_id = NEW.id
    UNION
    SELECT DISTINCT pool_id FROM public.predictions WHERE match_id = NEW.id
  LOOP
    IF NOT points_deleted THEN
      DELETE FROM public.match_points WHERE match_id = NEW.id;
      points_deleted := true;
    END IF;
    PERFORM public.recalculate_pool_ranking(r.pool_id);
  END LOOP;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_pool_without_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pool_owner_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_members_after_change_recalculate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_prediction_winner() FROM PUBLIC, anon, authenticated;