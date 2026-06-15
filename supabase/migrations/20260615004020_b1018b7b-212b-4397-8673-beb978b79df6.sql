
ALTER FUNCTION public.generate_invite_code() SECURITY DEFINER;
ALTER FUNCTION public.generate_invite_code() SET search_path = public;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated;

-- Also ensure the pool_before_insert trigger function (which calls generate_invite_code) runs with elevated privileges
ALTER FUNCTION public.pool_before_insert() SECURITY DEFINER;
ALTER FUNCTION public.pool_before_insert() SET search_path = public;
