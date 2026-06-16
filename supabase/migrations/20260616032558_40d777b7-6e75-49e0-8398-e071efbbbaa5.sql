DROP POLICY IF EXISTS "bonus_update_self" ON public.bonus_predictions;
DROP POLICY IF EXISTS "Users can update their own bonus" ON public.bonus_predictions;
DROP POLICY IF EXISTS "bonus_update_own" ON public.bonus_predictions;

DROP TRIGGER IF EXISTS bonus_block_update_after_lock ON public.bonus_predictions;
CREATE TRIGGER bonus_block_update_after_lock
BEFORE UPDATE ON public.bonus_predictions
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_bonus();