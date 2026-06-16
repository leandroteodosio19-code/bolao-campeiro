-- Allow pool owners/admins to manage matches (in addition to global admins).
-- Root cause of "Cannot coerce the result to a single JSON object": the UPDATE on
-- public.matches returned 0 rows because RLS only allowed users with the global
-- 'admin' role, while the PoolAdminPanel is shown to pool owners/admins.

DROP POLICY IF EXISTS matches_admin_write ON public.matches;

CREATE POLICY matches_admin_write
ON public.matches
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.pool_members pm
    WHERE pm.user_id = auth.uid() AND pm.role IN ('owner','admin')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.pool_members pm
    WHERE pm.user_id = auth.uid() AND pm.role IN ('owner','admin')
  )
);

-- Defensive UNIQUE constraints (the existing schema already enforces these via
-- existing indexes/PKs, but make them explicit and idempotent).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'predictions_pool_user_match_uniq') THEN
    ALTER TABLE public.predictions ADD CONSTRAINT predictions_pool_user_match_uniq UNIQUE (pool_id, user_id, match_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_points_pool_user_match_uniq') THEN
    ALTER TABLE public.match_points ADD CONSTRAINT match_points_pool_user_match_uniq UNIQUE (pool_id, user_id, match_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ranking_snapshots_pool_user_uniq') THEN
    ALTER TABLE public.ranking_snapshots ADD CONSTRAINT ranking_snapshots_pool_user_uniq UNIQUE (pool_id, user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pool_members_pool_user_uniq') THEN
    ALTER TABLE public.pool_members ADD CONSTRAINT pool_members_pool_user_uniq UNIQUE (pool_id, user_id);
  END IF;
END $$;