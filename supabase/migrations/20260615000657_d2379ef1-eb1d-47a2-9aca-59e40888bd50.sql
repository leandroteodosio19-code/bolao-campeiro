
-- 1) Tighten UPDATE policies to require pool membership
DROP POLICY IF EXISTS predictions_update_self ON public.predictions;
CREATE POLICY predictions_update_self ON public.predictions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_pool_member(pool_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_pool_member(pool_id, auth.uid()));

DROP POLICY IF EXISTS bonus_update_self ON public.bonus_predictions;
CREATE POLICY bonus_update_self ON public.bonus_predictions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_pool_member(pool_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_pool_member(pool_id, auth.uid()));

-- 2) Revoke EXECUTE from signed-in users on internal SECURITY DEFINER functions
-- These are only meant to be called by triggers or by service_role.
REVOKE EXECUTE ON FUNCTION public.calculate_match_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_pool_ranking(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_rankings_for_match(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.matches_after_finish() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_after_insert_add_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_prediction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_bonus() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM PUBLIC, anon, authenticated;
