-- Restore the manual subscription
UPDATE public.subscriptions 
SET 
  plan_id = 'enterprise',
  status = 'active',
  stripe_customer_id = NULL,
  stripe_subscription_id = NULL,
  stripe_price_id = NULL,
  current_period_end = NOW() + INTERVAL '1 year'
WHERE user_id = '0624d22b-3657-4083-bead-f076ddc348b2';