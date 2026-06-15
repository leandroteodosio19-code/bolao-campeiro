
-- 1) external_api_logs
CREATE TABLE IF NOT EXISTS public.external_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  endpoint TEXT,
  status TEXT NOT NULL,
  response_summary TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.external_api_logs TO authenticated;
GRANT ALL ON public.external_api_logs TO service_role;
ALTER TABLE public.external_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external_api_logs_admin_read" ON public.external_api_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2) match_sync_status
CREATE TABLE IF NOT EXISTS public.match_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  external_match_id TEXT,
  last_synced_at TIMESTAMPTZ,
  last_status TEXT,
  sync_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id)
);
GRANT SELECT ON public.match_sync_status TO authenticated;
GRANT ALL ON public.match_sync_status TO service_role;
ALTER TABLE public.match_sync_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_sync_status_admin_read" ON public.match_sync_status
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) Ranking com critérios de desempate (inclui joined_at)
CREATE OR REPLACE FUNCTION public.recalculate_pool_ranking(_pool_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ranking_snapshots WHERE pool_id = _pool_id;
  INSERT INTO public.ranking_snapshots (pool_id, user_id, total_points, exact_scores, correct_results, knockout_hits, position, calculated_at)
  SELECT
    pm.pool_id,
    pm.user_id,
    COALESCE(SUM(mp.points), 0) AS total_points,
    COALESCE(SUM(CASE WHEN mp.exact_score THEN 1 ELSE 0 END), 0) AS exact_scores,
    COALESCE(SUM(CASE WHEN mp.correct_result THEN 1 ELSE 0 END), 0) AS correct_results,
    COALESCE(SUM(CASE WHEN mp.knockout_hit THEN 1 ELSE 0 END), 0) AS knockout_hits,
    RANK() OVER (
      ORDER BY
        COALESCE(SUM(mp.points),0) DESC,
        COALESCE(SUM(CASE WHEN mp.exact_score THEN 1 ELSE 0 END),0) DESC,
        COALESCE(SUM(CASE WHEN mp.correct_result THEN 1 ELSE 0 END),0) DESC,
        COALESCE(SUM(CASE WHEN mp.knockout_hit THEN 1 ELSE 0 END),0) DESC,
        MIN(pm.joined_at) ASC
    ) AS position,
    now()
  FROM public.pool_members pm
  LEFT JOIN public.match_points mp ON mp.pool_id = pm.pool_id AND mp.user_id = pm.user_id
  WHERE pm.pool_id = _pool_id
  GROUP BY pm.pool_id, pm.user_id;
END; $$;

-- 4) Wrapper público para admins recalcularem ranking
CREATE OR REPLACE FUNCTION public.admin_recalculate_pool_ranking(_pool_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_pool_admin(_pool_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Apenas administradores podem recalcular o ranking';
  END IF;
  PERFORM public.recalculate_pool_ranking(_pool_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_recalculate_pool_ranking(uuid) TO authenticated;

-- 5) Garantir publicação realtime (idempotente)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.match_points; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_snapshots; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.match_points REPLICA IDENTITY FULL;
ALTER TABLE public.ranking_snapshots REPLICA IDENTITY FULL;
ALTER TABLE public.predictions REPLICA IDENTITY FULL;
