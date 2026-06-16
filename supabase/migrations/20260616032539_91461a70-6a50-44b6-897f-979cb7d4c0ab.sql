DROP POLICY IF EXISTS "bonus_delete_self" ON public.bonus_predictions;
DROP POLICY IF EXISTS "Users can delete their own bonus" ON public.bonus_predictions;
DROP POLICY IF EXISTS "bonus_delete_own" ON public.bonus_predictions;

DROP TRIGGER IF EXISTS bonus_block_delete_after_lock ON public.bonus_predictions;
CREATE TRIGGER bonus_block_delete_after_lock
BEFORE DELETE ON public.bonus_predictions
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_bonus();