-- Apply in the Supabase SQL Editor for a new project, or as a migration for an
-- existing project. Receipt images live in private Storage and are referenced here.
CREATE TABLE IF NOT EXISTS public.gift_orders (
  order_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  partner_name text NOT NULL,
  whatsapp text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'delivered')),
  receipt text,
  receipt_path text
);
ALTER TABLE public.gift_orders ADD COLUMN IF NOT EXISTS receipt_path text;

ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_verified_store_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = (SELECT auth.uid())
      AND lower(email) = 'hadesarchie@gmail.com'
      AND email_confirmed_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.is_verified_store_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_store_owner() TO authenticated;

DROP POLICY IF EXISTS "Store owner reads orders" ON public.gift_orders;
DROP POLICY IF EXISTS "Store owner updates orders" ON public.gift_orders;
DROP POLICY IF EXISTS "Verified store owner reads orders" ON public.gift_orders;
DROP POLICY IF EXISTS "Verified store owner updates orders" ON public.gift_orders;
CREATE POLICY "Verified store owner reads orders" ON public.gift_orders
  FOR SELECT TO authenticated
  USING (public.is_verified_store_owner());
CREATE POLICY "Verified store owner updates orders" ON public.gift_orders
  FOR UPDATE TO authenticated
  USING (public.is_verified_store_owner())
  WITH CHECK (public.is_verified_store_owner());
REVOKE ALL ON public.gift_orders FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.gift_orders TO authenticated;
GRANT ALL ON public.gift_orders TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-receipts', 'order-receipts', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg'];

DROP POLICY IF EXISTS "Verified store owner reads order receipts" ON storage.objects;
CREATE POLICY "Verified store owner reads order receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'order-receipts' AND public.is_verified_store_owner());

-- Enable instant dashboard refreshes. The dashboard also polls as a fallback.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_orders;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
