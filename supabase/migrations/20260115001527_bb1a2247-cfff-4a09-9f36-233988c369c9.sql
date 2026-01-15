-- Update user subscription to Enterprise plan
UPDATE public.subscriptions 
SET 
  plan_id = 'enterprise',
  status = 'active',
  current_period_end = NOW() + INTERVAL '1 year'
WHERE user_id = '0624d22b-3657-4083-bead-f076ddc348b2';

-- If no subscription exists, insert one
INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_end)
SELECT '0624d22b-3657-4083-bead-f076ddc348b2', 'enterprise', 'active', NOW() + INTERVAL '1 year'
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions WHERE user_id = '0624d22b-3657-4083-bead-f076ddc348b2'
);