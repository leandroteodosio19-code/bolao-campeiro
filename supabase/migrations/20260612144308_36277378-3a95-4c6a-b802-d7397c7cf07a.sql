
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pool_after_insert_add_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_match_points(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_pool_ranking(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_rankings_for_match(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.matches_after_finish() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_prediction() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_bonus() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pool_before_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pool_by_invite_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_pool_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_pool_admin(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_pool_by_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pool_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pool_admin(uuid, uuid) TO authenticated;
