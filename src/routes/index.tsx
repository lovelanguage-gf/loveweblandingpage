import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CONFIG, BRAND } from "@/lib/config";
import { compressImage, generateOrderId, type Order } from "@/lib/orders";
import { submitOrder } from "@/lib/orders.functions";
import { useReveal } from "@/hooks/use-reveal";
import { trackInitiateCheckout, trackPurchase } from "@/lib/tracking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ذكرياتنا ❤️ | موقع هدية مخصوص لحبيبك بـ 250 جنيه" },
      {
        name: "description",
        content:
          "موقع هدية رومانسي مخصوص باسمكم: صوركم ورسايلكم وأغنيتكم وعداد قصتكم في مكان واحد، مع لوحة تحكم خاصة بيك.",
      },
      { property: "og:title", content: "ذكرياتنا ❤️ | هدية مش زي أي هدية" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content: "اطلب موقع هدية مخصوص لحبيبك بـ 250 جنيه واستلمه على الواتساب.",
      },
      {
        name: "twitter:description",
        content: "اطلب موقع هدية مخصوص لحبيبك بـ 250 جنيه واستلمه على الواتساب.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  ["💌", "ظرف ورسالة باسمه", "أول ما يفتح الموقع، يلاقي ظرف متكتب عليه اسمه، ورسالة من قلبك."],
  ["🔐", "كلمة سر خاصة بيكم", "موقعكم محمي بكلمة سر بتفكركم بحاجة تخصكم إنتو بس."],
  ["⏳", "عداد من بداية قصتكم", "عداد حي بيحسب كام يوم وساعة ودقيقة عدّوا من أول يوم ليكم."],
  ["📅", "أهم التواريخ واللحظات", "رحلة زمنية بأجمل لحظاتكم وتواريخكم اللي ما بتتنسيش."],
  ["✍️", "رسائل تكتبوها لبعض", "مساحة خاصة تكتبوا فيها لبعض كلام يفضل معاكم على طول."],
  ["📸", "صوركم وذكرياتكم", "معرض صور بيجمع أحلى لقطاتكم في مكان واحد."],
  ["🎵", "أغنيتكم المفضلة", "أغنيتكم بتشتغل في الخلفية وتخلي كل لحظة أحلى."],
  ["🎁", "Surprise Box", "صندوق مفاجأة بصورة ورسالة خاصة، يتفتح في اللحظة اللي إنت تختارها."],
] as const;

const STEPS = [
  ["املا بياناتك", "اكتب اسمك واسم الشخص اللي هتهديله، ورقم الواتساب بتاعك."],
  ["حوّل 250 جنيه", "حوّل المبلغ بإنستاباي أو فودافون كاش، وصوّر إيصال التحويل."],
  ["استلم موقعكم على الواتساب", "بعد مراجعة الإيصال بنبعتلك لينك موقعكم ولوحة التحكم الخاصة بيك."],
  [
    "أضف لمستك واهدي",
    "من الداشبورد ضيف بنفسك الصور والكلام والتواريخ والأغنية، وابعت اللينك لحبيبك.",
  ],
] as const;

const REVIEWS = [
  [
    "منة الله، القاهرة",
    "عملته لخطيبي في عيد ميلاده، وأول ما فتح الموقع ولقى الظرف باسمه فضل ساكت شوية وبعدين عيّط! قالي دي أحلى هدية جاتله في حياته 😭❤️",
  ],
  [
    "أحمد سمير، الإسكندرية",
    "كنت محتار أجيب لمراتي إيه في ذكرى جوازنا. عملت الموقع وحطيت صورنا وأغنيتنا، وهي لسه بتفتحه كل يوم! والداشبورد سهلة جدًا وبتتحكم فيها بسهولة 👌",
  ],
  [
    "سلمى محمود، المنصورة",
    "فكرة تجنن! وصلني اللينك على الواتساب بعد دقايق من التحويل، وضفت الصور والرسايل بنفسي. حبيبي قالي إنه بيقرا رسايلنا كل ليلة قبل ما ينام 🥹",
  ],
] as const;

function LiveDemoPrompt({ className = "" }: { className?: string }) {
  return (
    <p
      className={`inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-full border border-brand-purple/35 bg-white/75 px-4 py-2 text-sm font-semibold text-brand-deep shadow-sm ${className}`}
    >
      <span>✨ عايز تعيش التجربة؟</span>
      <a
        href="https://love-oyjn.onrender.com/gift/ahmed"
        target="_blank"
        rel="noopener noreferrer"
        className="font-extrabold text-brand-blue underline decoration-brand-blue/40 underline-offset-4 transition-colors hover:text-brand-deep"
      >
        اضغط هنا وشوف مثال حي للهدية
      </a>
      <span className="text-xs font-bold text-ink/65">(كلمة السر: 123)</span>
    </p>
  );
}

function scrollToForm() {
  document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" });
}

function FloatingHearts() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {["10%", "30%", "55%", "78%", "92%"].map((left, i) => (
        <span
          key={left}
          className="float-soft absolute text-2xl opacity-30"
          style={{ insetInlineStart: left, top: `${12 + i * 16}%`, animationDelay: `${i * 0.7}s` }}
        >
          {i % 2 === 0 ? "❤️" : "✨"}
        </span>
      ))}
    </div>
  );
}

function Landing() {
  useReveal();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [hideSticky, setHideSticky] = useState(false);
  const formSectionRef = useRef<HTMLElement | null>(null);

  // Sticky bar politely hides while the order form is on screen.
  useEffect(() => {
    const el = formSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setHideSticky(!!entries[0]?.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="relative pb-28">
      {/* ---------- Header ---------- */}
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-5">
        <span className="text-xl font-extrabold text-ink">{BRAND}</span>
        <button onClick={scrollToForm} className="text-sm font-bold text-brand-blue">
          اطلب الآن
        </button>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-2">
        <FloatingHearts />
        <div className="reveal relative z-10 text-center md:text-start">
          <span className="inline-flex rounded-full border border-brand-purple/50 bg-white/70 px-4 py-1.5 text-sm font-bold text-brand-deep">
            🎁 هدية مش زي أي هدية
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-[1.35] text-ink sm:text-4xl lg:text-5xl">
            مش مجرد هدية ❤️ ده عالم صغير بإسمكم إنتو الاتنين
          </h1>
          <p className="mt-5 text-base leading-8 text-ink/75 sm:text-lg">
            موقع معمول مخصوص ليكم، بيجمع صوركم ورسايلكم وأغنيتكم وذكرياتكم كلها في مكان واحد. عشان
            الشخص اللي بتحبه يحس إنك فاكر كل تفصيلة بينكم، وإن الهدية دي معمولة له هو بالذات.
          </p>
          <LiveDemoPrompt className="mt-4" />
          <button onClick={scrollToForm} className="btn-primary glow-cta mt-7 w-full sm:w-auto">
            اطلب هديتك دلوقتي – 250 جنيه بس
          </button>
          <p className="mt-4 text-sm font-semibold text-ink/70">
            ✅ بتستلم لينك موقعكم + لوحة تحكم خاصة بيك على الواتساب
          </p>
        </div>

        <div className="reveal relative z-10 flex justify-center">
          {/* REPLACE IMAGE: hero-mockup.png — phone mockup of the gift website */}
          <div className="float-soft rounded-[2.5rem] border-[10px] border-ink/85 bg-ink/85 p-1 shadow-[var(--shadow-lift)]">
            <img
              src="/uploads/product-mockup.webp"
              alt="معاينة موقع الهدية المخصص على شاشة الموبايل"
              loading="eager"
              fetchPriority="high"
              width={300}
              height={373}
              className="h-auto w-[260px] rounded-[2rem] sm:w-[300px]"
            />
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16">
        <div className="reveal text-center">
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
            إيه اللي هتلاقيه جوه موقعكم؟ 💌
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink/70">
            كل حاجة بتحبوها، متجمعة في مكان واحد وبشكل يخطف القلب
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([icon, title, desc], i) => (
            <article
              key={title}
              className="reveal surface-card p-5 transition-transform duration-300 hover:-translate-y-1.5"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 text-lg font-extrabold text-brand-deep">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/70">{desc}</p>
            </article>
          ))}
        </div>

        <div className="reveal mt-10 grid gap-5 sm:grid-cols-2">
          {/* REPLACE IMAGE: feature-mockup-1.png */}
          <img
            src="/uploads/feature-mockup1111.webp"
            sizes="(max-width: 640px) 100vw, (max-width: 1240px) 50vw, 600px"
            alt="معرض الصور والرسائل داخل موقع الهدية"
            loading="lazy"
            width={650}
            height={431}
            className="w-full rounded-3xl shadow-[var(--shadow-soft)]"
          />
          {/* REPLACE IMAGE: feature-mockup-2.png */}
          <img
            src="/uploads/feature-mockup2222.webp"
            sizes="(max-width: 640px) 100vw, (max-width: 1240px) 50vw, 600px"
            alt="عداد بداية القصة وصندوق المفاجأة داخل الموقع"
            loading="lazy"
            width={650}
            height={431}
            className="w-full rounded-3xl shadow-[var(--shadow-soft)]"
          />
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16">
        <h2 className="reveal text-center text-2xl font-extrabold text-ink sm:text-3xl">
          إزاي هتستلم هديتك؟ في 4 خطوات بسيطة 👇
        </h2>

        <ol className="relative mt-10 grid gap-6 md:grid-cols-4">
          <span
            aria-hidden
            className="absolute inset-x-6 top-7 hidden h-0.5 bg-gradient-to-l from-brand-blue to-brand-deep md:block"
          />
          {STEPS.map(([title, desc], i) => (
            <li key={title} className="reveal surface-card relative z-10 p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gradient-brand)] text-lg font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-extrabold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/70">{desc}</p>
            </li>
          ))}
        </ol>

        <div className="reveal surface-card mt-10 grid items-center gap-6 p-6 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-extrabold text-brand-deep">
              إنت اللي بتتحكم في كل حاجة 🎛️
            </h3>
            <p className="mt-3 leading-8 text-ink/75">
              هتاخد Dashboard خاصة بيك تضيف منها بنفسك الصور، والكلام، والتواريخ، والأغنية. وتعدّل
              في أي وقت تحب.
            </p>
          </div>
          {/* REPLACE IMAGE: dashboard-mockup.png */}
          <img
            src="/uploads/dashboard-mockup.webp"
            alt="لوحة التحكم الخاصة بالعميل لإضافة الصور والرسائل"
            loading="lazy"
            width={650}
            height={430}
            className="w-full rounded-2xl shadow-[var(--shadow-soft)]"
          />
        </div>
      </section>

      {/* ---------- EMOTIONAL ---------- */}
      <section className="relative overflow-hidden bg-brand-deep py-16 text-white">
        <FloatingHearts />
        <div className="reveal relative z-10 mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            الهدية الحقيقية مش في تمنها… هي في إحساسها 🤍
          </h2>
          <p className="mt-5 leading-9 text-white/90">
            الورد بيدبل، والهدايا بتتنسي في الدرج. لكن ذكرى متحفوظة باسمكم إنتو الاتنين؟ دي بتفضل.
            تخيّل وشه وهو بيفتح الموقع، ويلاقي صوركم، وأول رسالة كتبتهالُه، وأغنيتكم بتشتغل… ويحس
            إنك فاكر كل تفصيلة بينكم. الإحساس ده ملوش تمن، ومش بيتشرى من أي محل.
          </p>
          <blockquote className="mx-auto mt-7 max-w-xl rounded-3xl border border-white/30 bg-white/10 p-5 text-lg font-bold backdrop-blur">
            "مش بس هدية… ده دليل إنك شايفه ومهتم بكل لحظة عدّت."
          </blockquote>
          <button onClick={scrollToForm} className="btn-teal mt-7">
            أنا عايز أفاجئه ❤️
          </button>
        </div>
      </section>

      {/* ---------- REVIEWS ---------- */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16">
        <h2 className="reveal text-center text-2xl font-extrabold text-ink sm:text-3xl">
          ناس جربت وعيّطت من الفرحة 🥹
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {REVIEWS.map(([name, text]) => (
            <article key={name} className="reveal surface-card p-6">
              <div className="text-lg">⭐⭐⭐⭐⭐</div>
              <p className="mt-3 text-sm leading-8 text-ink/80">{text}</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple/40 font-extrabold text-brand-deep">
                  {name.slice(0, 1)}
                </span>
                <div>
                  <div className="text-sm font-extrabold text-ink">{name}</div>
                  <span className="text-xs font-bold text-brand-teal">✔ عميل موثّق</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- ORDER FORM ---------- */}
      <section
        id="order-form"
        ref={formSectionRef}
        className="mx-auto w-full max-w-[720px] scroll-mt-6 px-5 py-16"
      >
        <div className="reveal text-center">
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
            جاهز تفرّح حبيبك؟ املا بياناتك دلوقتي 🎁
          </h2>
          <p className="mt-3 text-ink/70">
            خطوة واحدة بس وتبدأ رحلة هديتك. السعر 250 جنيه مصري بس.
          </p>
        </div>
        <div className="reveal mt-5 text-center">
          <LiveDemoPrompt />
        </div>
        <OrderForm
          onToast={showToast}
          onSuccess={(order) => {
            sessionStorage.setItem("orderCompleted", "1");
            sessionStorage.setItem("lastOrderId", order.orderId);
            navigate({ to: "/thank-you" });
          }}
        />
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-brand-purple/30 py-10 text-center text-sm text-ink/70">
        <div className="text-lg font-extrabold text-ink">{BRAND}</div>
        <p className="mt-2">صُنع بحب 🤍</p>
        <p className="mt-1">© 2025 جميع الحقوق محفوظة</p>
        {/* WHATSAPP SUPPORT: add CONFIG.WHATSAPP_SUPPORT link here later */}
      </footer>

      {/* ---------- STICKY BOTTOM CTA ---------- */}
      <div
        className="fixed inset-x-0 bottom-0 z-[1000] transition-transform duration-300"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          transform: hideSticky ? "translateY(120%)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 border-t border-white/40 bg-white/85 px-4 py-3 backdrop-blur-lg sm:m-3 sm:rounded-full sm:border sm:shadow-[var(--shadow-soft)]">
          <span className="text-sm font-extrabold text-ink sm:text-base">
            هديتك بـ 250 جنيه بس ❤️
          </span>
          <button
            onClick={() => {
              trackInitiateCheckout();
              scrollToForm();
            }}
            className="btn-primary !min-h-[48px] !px-6 text-sm"
          >
            اطلب دلوقتي
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[1100] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Order form
// =====================================================================
type FormErrors = {
  name?: string;
  partnerName?: string;
  whatsapp?: string;
  receipt?: string;
};

function OrderForm({
  onSuccess,
  onToast,
}: {
  onSuccess: (order: Order) => void;
  onToast: (m: string) => void;
}) {
  const [values, setValues] = useState({ name: "", partnerName: "", whatsapp: "" });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    const e: FormErrors = {};
    if (!values.name.trim()) e["name"] = "من فضلك اكتب اسمك";
    if (!values.partnerName.trim()) e["partnerName"] = "من فضلك اكتب اسم الشخص اللي هتهديله";
    if (!/^01[0125][0-9]{8}$/.test(values.whatsapp.trim()))
      e["whatsapp"] = "اكتب رقم واتساب مصري صحيح زي 01XXXXXXXXX";
    if (!file) e["receipt"] = "لازم ترفع صورة إيصال التحويل";
    else if (!file.type.startsWith("image/")) e["receipt"] = "الملف لازم يكون صورة";
    else if (file.size > 5 * 1024 * 1024) e["receipt"] = "حجم الصورة لازم يكون أقل من 5 ميجا";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onPickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);

    const order: Order = {
      orderId: generateOrderId(),
      createdAt: new Date().toISOString(),
      name: values.name.trim(),
      partnerName: values.partnerName.trim(),
      whatsapp: values.whatsapp.trim(),
      amount: CONFIG.PRICE_EGP,
      status: "pending",
    };

    try {
      if (!file) return;
      const receipt = await compressImage(file);
      await submitOrder({
        data: {
          orderId: order.orderId,
          name: order.name,
          partnerName: order.partnerName,
          whatsapp: order.whatsapp,
          receipt,
        },
      });
      trackPurchase(CONFIG.PRICE_EGP, CONFIG.CURRENCY);
      onSuccess(order);
    } catch {
      setFormError("حصلت مشكلة، جرب تاني من فضلك 🙏");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocus={trackInitiateCheckout}
      noValidate
      className="reveal surface-card mt-8 overflow-hidden"
    >
      <div className="bg-brand-blue px-5 py-3 text-center text-sm font-extrabold text-white">
        🎁 موقع هدية مخصوص | 💰 250 جنيه
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        <Field
          id="name"
          label="اسمك"
          placeholder="اكتب اسمك هنا"
          value={values.name}
          error={errors["name"]}
          onChange={(v) => setValues({ ...values, name: v })}
        />
        <Field
          id="partnerName"
          label="اسم الشخص اللي هتهديله"
          placeholder="اسم حبيبك / حبيبتك"
          value={values.partnerName}
          error={errors["partnerName"]}
          onChange={(v) => setValues({ ...values, partnerName: v })}
        />
        <Field
          id="whatsapp"
          type="tel"
          label="رقم الواتساب بتاعك"
          placeholder="01XXXXXXXXX"
          helper="هنبعتلك عليه لينك موقعكم ولوحة التحكم"
          value={values.whatsapp}
          error={errors["whatsapp"]}
          onChange={(v) => setValues({ ...values, whatsapp: v })}
        />

        {/* Payment instructions */}
        <div className="rounded-2xl border-2 border-brand-teal/60 bg-brand-teal/5 p-5">
          <h3 className="text-base font-extrabold text-ink">💳 تعليمات الدفع</h3>
          <p className="mt-2 text-sm leading-7 text-ink/75">حوّل مبلغ 250 جنيه مصري باستخدام:</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-ink">
            <span className="inline-flex items-center gap-2">
              <img
                src="/uploads/Instapay.webp"
                alt="InstaPay"
                width={28}
                height={28}
                className="h-7 w-7 rounded-md object-contain"
              />
              <span>إنستاباي (InstaPay)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <img
                src="/uploads/vodafone-cash.png"
                alt="Vodafone Cash"
                width={28}
                height={28}
                className="h-7 w-7 rounded-md object-contain"
              />
              <span>فودافون كاش (Vodafone Cash)</span>
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-ink/75">على الرقم التالي:</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-white px-4 py-2 font-mono text-lg font-extrabold tracking-wider text-brand-blue">
              {CONFIG.PAYMENT_NUMBER}
            </span>
            <button
              type="button"
              className="btn-teal !min-h-[44px] text-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(CONFIG.PAYMENT_NUMBER);
                  onToast("تم النسخ ✅");
                } catch {
                  onToast("تم النسخ ✅");
                }
              }}
            >
              نسخ الرقم
            </button>
          </div>
          <p className="mt-3 text-xs leading-6 text-ink/70">
            بعد التحويل، صوّر إيصال العملية وارفعه في الخانة اللي تحت عشان نأكد طلبك.
          </p>
        </div>

        {/* Receipt upload */}
        <div>
          <label htmlFor="receipt" className="mb-2 block text-sm font-extrabold text-ink">
            ارفع صورة إيصال التحويل
          </label>
          {!preview ? (
            <label
              htmlFor="receipt"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-purple/60 bg-white/70 p-7 text-center transition-colors hover:border-brand-blue"
            >
              <span className="text-3xl">⬆️</span>
              <span className="text-sm font-bold text-ink/75">
                اضغط هنا لرفع صورة الإيصال (Screenshot)
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-brand-purple/40 bg-white p-3">
              <img
                src={preview}
                alt="معاينة إيصال التحويل"
                width={80}
                height={80}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{file?.name}</p>
                <button
                  type="button"
                  onClick={() => onPickFile(null)}
                  className="mt-1 text-sm font-bold text-brand-blue underline"
                >
                  تغيير / إزالة
                </button>
              </div>
            </div>
          )}
          <input
            id="receipt"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {errors["receipt"] && (
            <p className="mt-2 text-sm font-bold text-red-600">{errors["receipt"]}</p>
          )}
        </div>

        {formError && (
          <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">
            {formError}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "جاري الإرسال..." : "تأكيد الطلب 🎁"}
        </button>
        <p className="text-center text-xs text-ink/65">
          🔒 بياناتك في أمان وبتتستخدم بس لتجهيز هديتك.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  helper,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  helper?: string | undefined;
  type?: string | undefined;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-extrabold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={type === "tel" ? "numeric" : undefined}
        className="field-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {helper && !error && <p className="mt-1.5 text-xs text-ink/60">{helper}</p>}
      {error && <p className="mt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
