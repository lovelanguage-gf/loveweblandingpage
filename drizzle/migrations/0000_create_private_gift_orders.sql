CREATE TABLE public.gift_orders (
  order_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  partner_name text NOT NULL,
  whatsapp text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'delivered')),
  receipt text
);
GRANT ALL ON public.gift_orders TO service_role;
GRANT SELECT, UPDATE ON public.gift_orders TO authenticated;
ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owner reads orders" ON public.gift_orders FOR SELECT TO authenticated USING ((auth.jwt() ->> 'email') = 'hadesarchie@gmail.com');
CREATE POLICY "Store owner updates orders" ON public.gift_orders FOR UPDATE TO authenticated USING ((auth.jwt() ->> 'email') = 'hadesarchie@gmail.com') WITH CHECK ((auth.jwt() ->> 'email') = 'hadesarchie@gmail.com');
