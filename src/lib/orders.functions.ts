import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_EMAIL = "hadesarchie@gmail.com";
const receiptBucket = "order-receipts";
const orderInput = z.object({
  orderId: z.string().regex(/^ORD-\d{8}-[A-Z0-9]{4}$/),
  name: z.string().trim().min(1).max(100),
  partnerName: z.string().trim().min(1).max(100),
  whatsapp: z.string().regex(/^01[0125][0-9]{8}$/),
  receipt: z.string().startsWith("data:image/jpeg;base64,").max(1_500_000),
});

export const submitOrder = createServerFn({ method: "POST" })
  .validator((data) => orderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const image = Buffer.from(data.receipt.split(",")[1]!, "base64");
    const path = `${data.orderId}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(receiptBucket)
      .upload(path, image, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (uploadError) throw new Error("Unable to upload receipt");

    const { error } = await supabaseAdmin.from("gift_orders").insert({
      order_id: data.orderId,
      name: data.name,
      partner_name: data.partnerName,
      whatsapp: data.whatsapp,
      amount: 250,
      status: "pending",
      receipt_path: path,
    });
    if (error) {
      await supabaseAdmin.storage.from(receiptBucket).remove([path]);
      throw new Error("Unable to save order");
    }
    return { orderId: data.orderId };
  });

export const getOwnerOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: user, error: authError } = await context.supabase.auth.getUser(
      context.accessToken,
    );
    if (
      authError ||
      user.user?.email?.toLowerCase() !== OWNER_EMAIL ||
      !user.user.email_confirmed_at
    )
      throw new Error("Not authorized");
    const { data, error } = await context.supabase
      .from("gift_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return Promise.all(
      (data ?? []).map(async (row) => {
        let receipt: string | undefined;
        if (row.receipt_path) {
          const { data: signed, error: signedError } = await supabaseAdmin.storage
            .from(receiptBucket)
            .createSignedUrl(row.receipt_path, 300);
          if (!signedError) receipt = signed.signedUrl;
        } else if (row.receipt?.startsWith("data:image/")) {
          receipt = row.receipt;
        }
        return {
          orderId: row.order_id,
          createdAt: row.created_at,
          name: row.name,
          partnerName: row.partner_name,
          whatsapp: row.whatsapp,
          amount: row.amount,
          status: row.status as "pending" | "completed" | "delivered",
          ...(receipt ? { receipt } : {}),
        };
      }),
    );
  });

export const setOwnerOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({ orderId: z.string(), status: z.enum(["pending", "completed", "delivered"]) })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: user, error: authError } = await context.supabase.auth.getUser(
      context.accessToken,
    );
    if (
      authError ||
      user.user?.email?.toLowerCase() !== OWNER_EMAIL ||
      !user.user.email_confirmed_at
    )
      throw new Error("Not authorized");
    const { error } = await context.supabase
      .from("gift_orders")
      .update({ status: data.status })
      .eq("order_id", data.orderId);
    if (error) throw error;
    return { ok: true };
  });
