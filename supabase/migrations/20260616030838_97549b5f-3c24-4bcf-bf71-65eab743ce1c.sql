
-- 1) Bonus predictions: enforce bonus_lock_at in UPDATE/DELETE policies
DROP POLICY IF EXISTS "Users can update their own bonus" ON public.bonus_predictions;
DROP POLICY IF EXISTS "Users can delete their own bonus" ON public.bonus_predictions;
DROP POLICY IF EXISTS "bonus_update_own" ON public.bonus_predictions;
DROP POLICY IF EXISTS "bonus_delete_own" ON public.bonus_predictions;

CREATE POLICY "bonus_update_own_before_lock"
ON public.bonus_predictions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND public.is_pool_member(pool_id, auth.uid())
  AND COALESCE((SELECT bonus_lock_at FROM public.pools WHERE id = pool_id), 'infinity'::timestamptz) > now()
)
WITH CHECK (
  user_id = auth.uid()
  AND public.is_pool_member(pool_id, auth.uid())
  AND COALESCE((SELECT bonus_lock_at FROM public.pools WHERE id = pool_id), 'infinity'::timestamptz) > now()
);

CREATE POLICY "bonus_delete_own_before_lock"
ON public.bonus_predictions
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE((SELECT bonus_lock_at FROM public.pools WHERE id = pool_id), 'infinity'::timestamptz) > now()
);

-- 2) user_roles: explicit admin-only write policies
DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;

CREATE POLICY "user_roles_admin_insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_admin_update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_admin_delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Lock down SECURITY DEFINER function EXECUTE privileges.
-- Revoke from PUBLIC on all; grant authenticated only on functions intended as RPCs.

REVOKE EXECUTE ON FUNCTION public.recalculate_pool_ranking(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_rankings_for_match(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_match_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.matches_after_finish() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_after_insert_add_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_prediction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_bonus() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_pool_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_pool_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pool_by_invite_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_recalculate_pool_ranking(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pool_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pool_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pool_by_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recalculate_pool_ranking(uuid) TO authenticated;
