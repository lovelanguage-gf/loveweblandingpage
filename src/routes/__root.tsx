import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { trackPageView } from "@/lib/tracking";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "ذكرياتنا" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      // Preload the hashed Vite stylesheet without blocking first paint. The head
      // bootstrap below promotes it to a stylesheet after the preload completes.
      { rel: "preload", as: "style", href: appCss, className: "deferred-stylesheet" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // The landing page's above-the-fold image is the current LCP candidate.
      { rel: "preload", as: "image", href: "/uploads/product-mockup.webp", fetchPriority: "high" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;700;800&display=swap",
        className: "deferred-stylesheet",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const metaPixelId = import.meta.env["VITE_META_PIXEL_ID"]?.trim();
  const gaMeasurementId = import.meta.env["VITE_GA_MEASUREMENT_ID"]?.trim();
  const clarityProjectId = import.meta.env["VITE_CLARITY_PROJECT_ID"]?.trim();
  const isAdmin = pathname.startsWith("/admin");
  const shouldLoadMetaPixel = !!metaPixelId && /^\d+$/.test(metaPixelId) && !isAdmin;
  const shouldLoadGa = !!gaMeasurementId && /^G-[A-Z\d]+$/i.test(gaMeasurementId) && !isAdmin;
  const shouldLoadClarity = !!clarityProjectId && /^[a-z\d]+$/i.test(clarityProjectId) && !isAdmin;
  const metaPixelBootstrap = shouldLoadMetaPixel
    ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!1;n.version="2.0";n.queue=[];n.load=function(){if(n.loaded)return;n.loaded=!0;t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",${JSON.stringify(metaPixelId)});`
    : undefined;
  const gaSnippet = shouldLoadGa
    ? `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config",${JSON.stringify(gaMeasurementId)},{send_page_view:false});`
    : undefined;
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        {/* Critical hero styles reserve the final first-screen geometry before deferred CSS arrives. */}
        <style>{`*{box-sizing:border-box}html{font-family:"Cairo","Tajawal",system-ui,sans-serif;scroll-behavior:smooth;overflow-x:hidden}body{margin:0;min-height:100vh;background:linear-gradient(180deg,#eceaf4 0%,#fff 45%);color:#1e1b33;overflow-x:hidden}.relative{position:relative}.mx-auto{margin-inline:auto}.flex{display:flex}.grid{display:grid}.w-full{width:100%}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-10{gap:2.5rem}.px-5{padding-inline:1.25rem}.py-5{padding-block:1.25rem}.pt-6{padding-top:1.5rem}.pb-16{padding-bottom:4rem}.text-center{text-align:center}.text-ink{color:#1e1b33}.font-extrabold{font-weight:800}header{max-width:1200px;min-height:72px}.relative.mx-auto.grid{max-width:1200px;align-items:center}.relative.mx-auto.grid>.reveal{position:relative;z-index:10;opacity:1;transform:none}.relative.mx-auto.grid>.flex{justify-content:center}.relative.mx-auto.grid h1{margin-top:1.25rem;font-size:1.875rem;font-weight:800;line-height:1.35;color:#1e1b33}.relative.mx-auto.grid p{margin-top:1.25rem;font-size:1rem;line-height:2;color:#1e1b33}.relative.mx-auto.grid img{display:block;width:260px;height:auto;max-width:100%}.relative.mx-auto.grid>.flex>div{border:10px solid #1e1b33;border-radius:2.5rem;padding:4px;background:#1e1b33}.relative.mx-auto.grid button{display:inline-flex;align-items:center;justify-content:center;min-height:52px;width:100%;padding:0 1.75rem;border:0;border-radius:9999px;background:linear-gradient(135deg,#1a68d9 0%,#6e64a1 100%);color:#fff;font-weight:800}.relative.mx-auto.grid>div[aria-hidden]{position:absolute;inset:0;overflow:hidden;pointer-events:none}@media(min-width:640px){.relative.mx-auto.grid h1{font-size:2.25rem}.relative.mx-auto.grid p{font-size:1.125rem}.relative.mx-auto.grid img{width:300px}.relative.mx-auto.grid button{width:auto}}@media(min-width:768px){.relative.mx-auto.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.relative.mx-auto.grid>.reveal:nth-of-type(2){text-align:start}.relative.mx-auto.grid h1{font-size:3rem}}`}</style>
        {/* Promote preloaded stylesheets on their load event; keep a no-JS fallback. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.querySelectorAll('link.deferred-stylesheet').forEach(l=>{const apply=()=>{l.onload=null;l.rel='stylesheet'};l.onload=apply;if(l.sheet)apply()});`,
          }}
        />
        <noscript><link rel="stylesheet" href={appCss} /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;700;800&display=swap" /></noscript>
        {metaPixelBootstrap && <script dangerouslySetInnerHTML={{ __html: metaPixelBootstrap }} />}
        {gaSnippet && <script dangerouslySetInnerHTML={{ __html: gaSnippet }} />}
        {/* Third-party downloads wait for interaction or a 3-second fallback. */}
        {(shouldLoadMetaPixel || shouldLoadGa || shouldLoadClarity) && (
          <script
            dangerouslySetInnerHTML={{
              __html: `${shouldLoadClarity ? `window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};` : ""}(()=>{let loaded=false;let timer;const load=()=>{if(loaded)return;loaded=true;clearTimeout(timer);${shouldLoadMetaPixel ? "window.fbq&&window.fbq.load();" : ""}${shouldLoadGa ? `const g=document.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id='+${JSON.stringify(gaMeasurementId)};document.head.appendChild(g);` : ""}${shouldLoadClarity ? `const s=document.createElement('script');s.async=true;s.src='https://www.clarity.ms/tag/'+${JSON.stringify(clarityProjectId)};document.head.appendChild(s);` : ""}for(const e of ['mouseover','scroll','touchstart','keydown','pointerdown'])window.removeEventListener(e,load)};for(const e of ['mouseover','scroll','touchstart','keydown','pointerdown'])window.addEventListener(e,load,{once:true,passive:true});timer=setTimeout(load,3000)})();`,
            }}
          />
        )}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const currentUrl = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    if (!currentUrl.startsWith("/admin")) trackPageView(currentUrl);
  }, [currentUrl]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
