
-- Pool join requests with admin approval flow
CREATE TABLE IF NOT EXISTS public.pool_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS pool_join_requests_unique_pending
  ON public.pool_join_requests(pool_id, user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS pool_join_requests_pool_idx ON public.pool_join_requests(pool_id, status);

GRANT SELECT, INSERT, UPDATE ON public.pool_join_requests TO authenticated;
GRANT ALL ON public.pool_join_requests TO service_role;

ALTER TABLE public.pool_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "users_select_own_requests"
  ON public.pool_join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Pool admins can see all requests for their pools
CREATE POLICY "admins_select_pool_requests"
  ON public.pool_join_requests FOR SELECT TO authenticated
  USING (public.is_pool_admin(pool_id, auth.uid()));

-- Users can create their own pending requests
CREATE POLICY "users_insert_own_request"
  ON public.pool_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Pool admins can update (approve/reject)
CREATE POLICY "admins_update_pool_request"
  ON public.pool_join_requests FOR UPDATE TO authenticated
  USING (public.is_pool_admin(pool_id, auth.uid()))
  WITH CHECK (public.is_pool_admin(pool_id, auth.uid()));

-- RPC: request to join by invite code (creates a pending request)
CREATE OR REPLACE FUNCTION public.request_join_pool(_code text, _message text DEFAULT NULL)
RETURNS TABLE(request_id uuid, pool_id uuid, pool_name text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pool RECORD;
  _existing_member BOOLEAN;
  _existing_req RECORD;
  _new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  SELECT id, name INTO _pool FROM public.pools WHERE invite_code = upper(_code) LIMIT 1;
  IF _pool.id IS NULL THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.pool_members WHERE pool_members.pool_id = _pool.id AND user_id = auth.uid())
    INTO _existing_member;
  IF _existing_member THEN
    RETURN QUERY SELECT NULL::uuid, _pool.id, _pool.name, 'already_member'::text;
    RETURN;
  END IF;

  SELECT * INTO _existing_req
    FROM public.pool_join_requests
    WHERE pool_join_requests.pool_id = _pool.id
      AND user_id = auth.uid()
      AND status = 'pending'
    LIMIT 1;

  IF _existing_req.id IS NOT NULL THEN
    RETURN QUERY SELECT _existing_req.id, _pool.id, _pool.name, 'pending'::text;
    RETURN;
  END IF;

  INSERT INTO public.pool_join_requests (pool_id, user_id, message)
  VALUES (_pool.id, auth.uid(), _message)
  RETURNING id INTO _new_id;

  RETURN QUERY SELECT _new_id, _pool.id, _pool.name, 'pending'::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_join_pool(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_join_pool(text, text) TO authenticated;

-- RPC: admin decides on a request (approve or reject)
CREATE OR REPLACE FUNCTION public.decide_join_request(_request_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  SELECT * INTO _req FROM public.pool_join_requests WHERE id = _request_id;
  IF _req.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação inexistente';
  END IF;
  IF _req.status <> 'pending' THEN
    RAISE EXCEPTION 'Solicitação já decidida';
  END IF;

  IF NOT public.is_pool_admin(_req.pool_id, auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores do bolão podem decidir';
  END IF;

  IF _approve THEN
    INSERT INTO public.pool_members (pool_id, user_id, role)
    VALUES (_req.pool_id, _req.user_id, 'member')
    ON CONFLICT (pool_id, user_id) DO NOTHING;

    UPDATE public.pool_join_requests
      SET status = 'approved', decided_at = now(), decided_by = auth.uid()
      WHERE id = _request_id;
  ELSE
    UPDATE public.pool_join_requests
      SET status = 'rejected', decided_at = now(), decided_by = auth.uid()
      WHERE id = _request_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decide_join_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_join_request(uuid, boolean) TO authenticated;

-- Allow admins to look up profiles of requesters for display
-- (profiles already has a public read policy in most setups; if not, this is harmless)
