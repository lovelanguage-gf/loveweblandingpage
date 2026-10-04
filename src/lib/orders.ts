export type OrderStatus = "incomplete" | "pending" | "completed" | "delivered";

export interface Order {
  orderId: string;
  createdAt: string;
  name: string;
  partnerName: string;
  whatsapp: string;
  amount: number;
  status: OrderStatus;
  receipt?: string;
}

export function generateOrderId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ymd}-${rand}`;
}
