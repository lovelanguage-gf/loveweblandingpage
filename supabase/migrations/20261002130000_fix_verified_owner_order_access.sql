-- Supabase access tokens contain the email claim but don't guarantee an
-- email_verified claim. Check the verified Auth user record instead.
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

DROP POLICY IF EXISTS "Verified store owner reads order receipts" ON storage.objects;
CREATE POLICY "Verified store owner reads order receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'order-receipts' AND public.is_verified_store_owner());
