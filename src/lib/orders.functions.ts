import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_EMAIL = "hadesarchie@gmail.com";
const phone = z.string().trim().regex(/^01[0125][0-9]{8}$/);
const orderId = z.string().regex(/^ORD-\d{8}-[A-Z0-9]{4}$/);
const draftInput = z.object({
  orderId,
  name: z.string().trim().max(100),
  partnerName: z.string().trim().max(100),
  whatsapp: z.string().trim().max(20),
});
const checkoutInput = z.object({
  orderId,
  name: z.string().trim().min(1).max(100),
  partnerName: z.string().trim().min(1).max(100),
  whatsapp: phone,
});

function orderRow(data: { orderId: string; name: string; partnerName: string; whatsapp: string }, status: "incomplete" | "pending") {
  return {
    order_id: data.orderId,
    name: data.name,
    partner_name: data.partnerName,
    whatsapp: data.whatsapp,
    amount: 250,
    status,
    receipt: null,
    receipt_path: null,
  };
}

// Public endpoint accepts only bounded, validated contact fields; it never returns customer data.
export const saveOrderDraft = createServerFn({ method: "POST" })
  .validator((data) => draftInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insertError } = await supabaseAdmin.from("gift_orders").upsert(orderRow(data, "incomplete"), {
      onConflict: "order_id",
      ignoreDuplicates: true,
    });
    if (insertError) throw new Error("Unable to save draft");
    const { error } = await supabaseAdmin.from("gift_orders").update({
      name: data.name, partner_name: data.partnerName, whatsapp: data.whatsapp,
    }).eq("order_id", data.orderId).eq("status", "incomplete");
    if (error) throw new Error("Unable to update draft");
    return { ok: true };
  });

export const submitOrder = createServerFn({ method: "POST" })
  .validator((data) => checkoutInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("gift_orders").upsert(orderRow(data, "pending"), {
      onConflict: "order_id",
      ignoreDuplicates: false,
    });
    if (error) throw new Error("Unable to save order");
    return { orderId: data.orderId };
  });

export const getOwnerOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: user, error: authError } = await context.supabase.auth.getUser(context.accessToken);
    if (authError || user.user?.email?.toLowerCase() !== OWNER_EMAIL || !user.user.email_confirmed_at)
      throw new Error("Not authorized");
    const { data, error } = await context.supabase.from("gift_orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      orderId: row.order_id,
      createdAt: row.created_at,
      name: row.name,
      partnerName: row.partner_name,
      whatsapp: row.whatsapp,
      amount: row.amount,
      status: row.status as "incomplete" | "pending" | "completed" | "delivered",
    }));
  });

export const setOwnerOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ orderId, status: z.enum(["pending", "completed", "delivered"]) }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: user, error: authError } = await context.supabase.auth.getUser(context.accessToken);
    if (authError || user.user?.email?.toLowerCase() !== OWNER_EMAIL || !user.user.email_confirmed_at)
      throw new Error("Not authorized");
    const { error } = await context.supabase.from("gift_orders").update({ status: data.status }).eq("order_id", data.orderId);
    if (error) throw error;
    return { ok: true };
  });
