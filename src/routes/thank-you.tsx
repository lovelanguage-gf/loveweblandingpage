import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "شكراً لطلبك! | ذكرياتنا ❤️" },
      {
        name: "description",
        content: "تم استلام طلبك، وجاري مراجعة إيصال التحويل وإرسال موقعكم على الواتساب.",
      },
      { property: "og:title", content: "شكراً لطلبك! | ذكرياتنا ❤️" },
      { property: "og:description", content: "طلبك اتسجل وهنبعتلك لينك موقعكم على الواتساب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYou,
});

const CONFETTI = Array.from({ length: 24 }, (_, i) => i);

function ThankYou() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    // Guard: only reachable right after a successful order submission.
    if (sessionStorage.getItem("orderCompleted") !== "1") {
      navigate({ to: "/", replace: true });
      return;
    }
    const id = sessionStorage.getItem("lastOrderId") ?? "";
    setOrderId(id);
    window.scrollTo(0, 0);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-14 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {CONFETTI.map((i) => (
          <span
            key={i}
            className="confetti-piece absolute top-0 text-lg"
            style={{
              insetInlineStart: `${(i * 4.1) % 100}%`,
              animationDuration: `${2.5 + (i % 5) * 0.5}s`,
              animationDelay: `${(i % 7) * 0.18}s`,
            }}
          >
            {i % 3 === 0 ? "❤️" : i % 3 === 1 ? "🎉" : "✨"}
          </span>
        ))}
      </div>

      <div className="surface-card relative z-10 w-full max-w-xl p-7">
        <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24" role="img" aria-label="تم بنجاح">
          <circle cx="60" cy="60" r="54" fill="#00C9A7" opacity="0.14" />
          <circle cx="60" cy="60" r="44" fill="#00C9A7" />
          <path
            d="M38 62 L54 78 L84 46"
            fill="none"
            stroke="#fff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-draw"
          />
        </svg>

        <h1 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">شكراً لطلبك! 🎉</h1>
        <p className="mt-4 leading-8 text-ink/75">
          جاري مراجعة الإيصال في لحظات، وسيتم إرسال رابط موقعكم الخاص ولوحة التحكم عبر الواتساب
          فوراً. لا تقلق، هديتك في أيدٍ أمينة!
        </p>

        {orderId && (
          <span className="mt-5 inline-block rounded-full bg-brand-purple/25 px-4 py-1.5 font-mono text-sm font-extrabold text-brand-deep">
            رقم طلبك: {orderId}
          </span>
        )}

        <ul className="mt-7 space-y-3 text-start">
          {[
            "🧾 بنراجع إيصال التحويل",
            "📲 بنبعتلك لينك موقعكم + لوحة التحكم على الواتساب",
            "❤️ تضيف صوركم وذكرياتكم وتفاجئ حبيبك",
          ].map((t) => (
            <li
              key={t}
              className="rounded-2xl border border-brand-purple/35 bg-white/75 px-4 py-3 text-sm font-bold text-ink/80"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-bold text-ink/70">
          <span>🔒 بياناتك آمنة</span>
          <span>·</span>
          <span>⚡ رد سريع</span>
          <span>·</span>
          <span>💝 مصنوع بحب</span>
        </div>

        <Link to="/" className="btn-ghost mt-7">
          الرجوع للصفحة الرئيسية
        </Link>
      </div>

      <p className="relative z-10 mt-8 text-sm font-extrabold text-ink/70">{BRAND}</p>
    </div>
  );
}
