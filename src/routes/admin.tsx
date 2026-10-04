import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Order, type OrderStatus } from "@/lib/orders";
import { getOwnerOrders, setOwnerOrderStatus } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة إدارة الطلبات | ذكرياتنا ❤️" },
      { name: "description", content: "لوحة إدارة طلبات هدايا ذكرياتنا الخاصة بصاحب المتجر." },
      { property: "og:title", content: "لوحة إدارة الطلبات | ذكرياتنا ❤️" },
      {
        property: "og:description",
        content: "لوحة إدارة طلبات هدايا ذكرياتنا الخاصة بصاحب المتجر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  incomplete: { label: "غير مكتمل", bg: "rgb(239 68 68 / 0.12)", color: "#B91C1C" },
  pending: { label: "قيد المراجعة / Pending", bg: "rgb(245 158 11 / 0.15)", color: "#B45309" },
  completed: { label: "تم التأكيد / Completed", bg: "rgb(0 201 167 / 0.18)", color: "#047a66" },
  delivered: { label: "تم التسليم / Delivered", bg: "rgb(26 104 217 / 0.14)", color: "#1A68D9" },
};

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("hadesarchie@gmail.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setAuthed(
        data.user?.email?.toLowerCase() === "hadesarchie@gmail.com" &&
          !!data.user.email_confirmed_at,
      );
      setChecking(false);
    });
  }, []);
  if (checking) return <div className="min-h-screen bg-surface" />;
  if (!authed)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setLoginError("");
            const { error } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            const { data } = await supabase.auth.getUser();
            if (
              !error &&
              data.user?.email?.toLowerCase() === "hadesarchie@gmail.com" &&
              data.user.email_confirmed_at
            )
              setAuthed(true);
            else {
              await supabase.auth.signOut();
              setLoginError("تعذّر الدخول. استخدم حساب المالك المفعّل وتأكد من كلمة المرور.");
            }
          }}
          className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[var(--shadow-soft)]"
        >
          <h1 className="text-xl font-extrabold text-ink">دخول لوحة التحكم</h1>
          <label htmlFor="email" className="mt-5 block text-sm font-bold text-ink">
            البريد الإلكتروني للمالك
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            className="field-input mt-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="pw" className="mt-5 block text-sm font-bold text-ink">
            كلمة المرور
          </label>
          <input
            id="pw"
            type="password"
            required
            autoComplete="current-password"
            className="field-input mt-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {loginError && (
            <p role="alert" className="mt-2 text-sm font-bold text-red-600">
              {loginError}
            </p>
          )}
          <Button type="submit" className="btn-primary mt-5 w-full">
            دخول
          </Button>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            يُنشأ حساب المالك ويُفعّل من لوحة Supabase Auth.
          </p>
        </form>
      </div>
    );
  return (
    <Dashboard
      onLogout={() => {
        void supabase.auth.signOut();
        setAuthed(false);
      }}
    />
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [newestFirst, setNewestFirst] = useState(true);
  const [visible, setVisible] = useState(10);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setOrders(await getOwnerOrders());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("owner-gift-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_orders" },
        () => void refresh(),
      )
      .subscribe();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 1600);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => o.status !== "incomplete")
      .filter((o) => (statusFilter === "all" ? true : o.status === statusFilter))
      .filter((o) =>
        !q
          ? true
          : [o.orderId, o.name, o.partnerName, o.whatsapp].join(" ").toLowerCase().includes(q),
      )
      .sort((a, b) =>
        newestFirst
          ? +new Date(b.createdAt) - +new Date(a.createdAt)
          : +new Date(a.createdAt) - +new Date(b.createdAt),
      );
  }, [orders, query, statusFilter, newestFirst]);

  const kpi = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending");
    const completed = orders.filter((o) => o.status === "completed");
    const delivered = orders.filter((o) => o.status === "delivered");
    const revenue = [...completed, ...delivered].reduce((s, o) => s + o.amount, 0);
    const pendingAmount = pending.reduce((s, o) => s + o.amount, 0);
    const today = new Date().toDateString();
    const todayCount = orders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
    return {
      total: orders.length,
      pending: pending.length,
      completed: completed.length,
      delivered: delivered.length,
      revenue,
      pendingAmount,
      todayCount,
      avgDaily: orders.length ? (orders.length / range).toFixed(1) : "0",
    };
  }, [orders, range]);

  const chartData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toDateString();
      days.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        count: orders.filter((o) => new Date(o.createdAt).toDateString() === key).length,
      });
    }
    return days;
  }, [orders, range]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    try {
      await setOwnerOrderStatus({ data: { orderId, status } });
      await refresh();
      showToast("تم تحديث الحالة ✅");
    } catch {
      showToast("تعذّر تحديث الحالة");
    }
  }

  function waLink(phone: string) {
    return `https://wa.me/20${phone.replace(/^0/, "")}`;
  }

  function exportCsv() {
    const rows = [
      ["orderId", "createdAt", "name", "partnerName", "whatsapp", "amount", "status"],
      ...filtered.map((o) => [
        o.orderId,
        o.createdAt,
        o.name,
        o.partnerName,
        o.whatsapp,
        String(o.amount),
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <h1 className="text-lg font-extrabold text-brand-deep">لوحة التحكم</h1>
        <div className="flex gap-2">
          <button onClick={() => void refresh()} className="btn-ghost !min-h-[40px] text-sm">
            تحديث
          </button>
          <button onClick={onLogout} className="btn-ghost !min-h-[40px] text-sm">
            تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6">
        {loadError && (
          <p className="text-center font-bold text-destructive">
            تعذّر تحميل الطلبات. حاول التحديث.
          </p>
        )}
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="إجمالي المبيعات (Total Sales)" value={`${kpi.total}`}>
            <span className="text-xs text-slate-500">
              قيد المراجعة {kpi.pending} · تم التأكيد {kpi.completed} · تم التسليم {kpi.delivered}
            </span>
          </Card>
          <Card
            title="إجمالي الأرباح (Total Revenue)"
            value={`${kpi.revenue.toLocaleString("ar-EG")} ج.م`}
          >
            <span className="text-xs text-slate-500">
              مبالغ قيد المراجعة: {kpi.pendingAmount.toLocaleString("ar-EG")} ج.م
            </span>
          </Card>
          <Card title="طلبات جديدة النهارده" value={`${kpi.todayCount}`} />
          <Card title="متوسط الطلبات اليومي" value={`${kpi.avgDaily}`} />
        </div>

        {/* Chart */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold text-ink">الطلبات على مدار الوقت</h2>
            <div className="flex gap-2">
              {([7, 14, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    range === r ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r === 7 ? "7 أيام" : r === 14 ? "14 يوم" : "30 يوم"}
                </button>
              ))}
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm font-bold text-slate-500">لسه مفيش طلبات</p>
          ) : (
            <BarChart data={chartData} />
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-ink">الطلبات الغير مكتملة</h2>
          <p className="mt-1 text-sm text-slate-500">بيانات العملاء الذين بدأوا إدخال بياناتهم ولم يؤكدوا الطلب بعد.</p>
          {orders.filter((o) => o.status === "incomplete").length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">لا توجد مسودات حالياً</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[650px] text-start text-sm">
                <thead className="text-xs text-slate-500"><tr className="border-b"><th className="p-3 text-start">التاريخ</th><th className="p-3 text-start">اسم العميل</th><th className="p-3 text-start">اسم المستلم</th><th className="p-3 text-start">واتساب</th></tr></thead>
                <tbody>{orders.filter((o) => o.status === "incomplete").map((o) => <tr key={o.orderId} className="border-b border-slate-100"><td className="p-3">{fmtDate(o.createdAt)}</td><td className="p-3">{o.name || "—"}</td><td className="p-3">{o.partnerName || "—"}</td><td className="p-3"><a className="font-bold text-brand-teal" href={waLink(o.whatsapp)} target="_blank" rel="noreferrer">{o.whatsapp || "واتساب"}</a></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>

        {/* Orders */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold text-ink">إدارة الطلبات (Orders)</h2>
            <div className="flex flex-wrap gap-2">
              <input
                className="field-input !min-h-[42px] !w-auto text-sm"
                placeholder="ابحث برقم الطلب أو الاسم أو الرقم"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="field-input !min-h-[42px] !w-auto text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">الكل</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
              </select>
              <button onClick={exportCsv} className="btn-ghost !min-h-[42px] text-sm">
                تصدير CSV
              </button>
              <button
                onClick={() => setNewestFirst((v) => !v)}
                className="btn-ghost !min-h-[42px] text-sm"
              >
                التاريخ {newestFirst ? "↓" : "↑"}
              </button>
            </div>
          </div>

          {orders.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-slate-500">مفيش طلبات لسه 💌</p>
            </div>
          )}

          {orders.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-start text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="p-3 text-start">معرف الطلب (Order ID) / التاريخ</th>
                      <th className="p-3 text-start">اسم العميل</th>
                      <th className="p-3 text-start">اسم الشريك</th>
                      <th className="p-3 text-start">الواتساب</th>
                      <th className="p-3 text-start">إثبات الدفع</th>
                      <th className="p-3 text-start">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, visible).map((o) => (
                      <tr key={o.orderId} className="border-b border-slate-100 align-middle">
                        <td className="p-3">
                          <div className="font-mono font-extrabold text-ink">{o.orderId}</div>
                          <div className="text-xs text-slate-500">{fmtDate(o.createdAt)}</div>
                        </td>
                        <td className="p-3">{o.name}</td>
                        <td className="p-3">{o.partnerName}</td>
                        <td className="p-3">
                          <div className="font-mono">{o.whatsapp}</div>
                          <div className="mt-1 flex gap-2 text-xs">
                            <button
                              className="font-bold text-brand-blue"
                              onClick={async () => {
                                await navigator.clipboard.writeText(o.whatsapp).catch(() => {});
                                showToast("تم النسخ ✅");
                              }}
                            >
                              نسخ
                            </button>
                            <a
                              className="font-bold text-brand-teal"
                              href={waLink(o.whatsapp)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              واتساب
                            </a>
                          </div>
                        </td>
                        <td className="p-3">
                          {o.receipt ? (
                            <button onClick={() => setLightbox(o.receipt!)}>
                              <img
                                src={o.receipt}
                                alt={`إيصال الطلب ${o.orderId}`}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <StatusSelect order={o} onChange={changeStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.slice(0, visible).map((o) => (
                  <article key={o.orderId} className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-mono text-sm font-extrabold text-ink">{o.orderId}</div>
                    <div className="text-xs text-slate-500">{fmtDate(o.createdAt)}</div>
                    <p className="mt-2 text-sm">
                      {o.name} ← {o.partnerName}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="font-mono">{o.whatsapp}</span>
                      <button
                        className="text-xs font-bold text-brand-blue"
                        onClick={async () => {
                          await navigator.clipboard.writeText(o.whatsapp).catch(() => {});
                          showToast("تم النسخ ✅");
                        }}
                      >
                        نسخ
                      </button>
                      <a
                        className="text-xs font-bold text-brand-teal"
                        href={waLink(o.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        واتساب
                      </a>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {o.receipt ? (
                        <button onClick={() => setLightbox(o.receipt!)}>
                          <img
                            src={o.receipt}
                            alt={`إيصال الطلب ${o.orderId}`}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">لا يوجد إيصال</span>
                      )}
                      <StatusSelect order={o} onChange={changeStatus} />
                    </div>
                  </article>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm font-bold text-slate-500">مفيش نتائج</p>
              )}
              {visible < filtered.length && (
                <div className="mt-4 text-center">
                  <button onClick={() => setVisible((v) => v + 10)} className="btn-ghost text-sm">
                    عرض المزيد
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-full w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox}
              alt="إيصال التحويل"
              width={650}
              height={430}
              className="max-h-[75vh] w-full rounded-2xl object-contain"
            />
            <div className="mt-3 flex justify-between">
              <a
                href={lightbox}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-white underline"
              >
                فتح في تبويب جديد
              </a>
              <button onClick={() => setLightbox(null)} className="text-sm font-bold text-white">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">
          {toast}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-brand-deep">{value}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

function StatusSelect({
  order,
  onChange,
}: {
  order: Order;
  onChange: (id: string, s: OrderStatus) => void;
}) {
  const meta = STATUS_META[order.status];
  return (
    <select
      value={order.status}
      onChange={(e) => onChange(order.orderId, e.target.value as OrderStatus)}
      className="rounded-full px-3 py-2 text-xs font-extrabold"
      style={{ background: meta.bg, color: meta.color }}
      aria-label={`حالة الطلب ${order.orderId}`}
    >
      {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 700;
  const h = 220;
  const pad = 28;
  const bw = (w - pad * 2) / data.length;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full"
      role="img"
      aria-label="عدد الطلبات يوميًا"
    >
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
      {data.map((d, i) => {
        const bh = ((h - pad * 2) * d.count) / max;
        return (
          <g key={d.label}>
            <rect
              x={pad + i * bw + bw * 0.18}
              y={h - pad - bh}
              width={bw * 0.64}
              height={bh}
              rx={5}
              fill="#1A68D9"
              opacity={0.85}
            >
              <title>{`${d.label}: ${d.count} طلب`}</title>
            </rect>
            {i % Math.ceil(data.length / 7) === 0 && (
              <text
                x={pad + i * bw + bw / 2}
                y={h - pad + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
