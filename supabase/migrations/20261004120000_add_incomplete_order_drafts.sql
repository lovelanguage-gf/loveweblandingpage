-- Store live checkout drafts centrally; owner access remains protected by the
-- existing verified-owner RLS policies on gift_orders.
ALTER TABLE public.gift_orders
  DROP CONSTRAINT IF EXISTS gift_orders_status_check;

ALTER TABLE public.gift_orders
  ADD CONSTRAINT gift_orders_status_check
  CHECK (status IN ('incomplete', 'pending', 'completed', 'delivered'));

-- The public validated server functions write drafts with service_role. No
-- anonymous table grants or direct client insert policy are added.
