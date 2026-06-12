
-- Revoke EXECUTE from anon on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_after_insert_add_owner() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_match_points(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_pool_ranking(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_rankings_for_match(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.matches_after_finish() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_prediction() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_bonus() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pool_before_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pool_by_invite_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_pool_by_invite_code(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_pool_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_pool_admin(uuid, uuid) FROM anon;
