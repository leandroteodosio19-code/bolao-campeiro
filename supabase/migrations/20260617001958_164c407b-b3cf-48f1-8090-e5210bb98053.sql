DROP POLICY IF EXISTS pool_join_requests_delete_own ON public.pool_join_requests;
CREATE POLICY pool_join_requests_delete_own
ON public.pool_join_requests
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending')
  OR public.is_pool_admin(pool_id, auth.uid())
);