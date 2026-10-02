type TrackingParams = Record<string, string | number | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const metaPixelId = import.meta.env["VITE_META_PIXEL_ID"]?.trim();
const gaMeasurementId = import.meta.env["VITE_GA_MEASUREMENT_ID"]?.trim();
let checkoutStarted = false;

function isAdminPath() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
}

export function trackPageView(url: string) {
  if (isAdminPath()) return;
  const pageUrl = new URL(url, window.location.origin).href;
  try {
    if (metaPixelId) window.fbq?.("track", "PageView");
  } catch {
    // Tracking must never interrupt storefront navigation.
  }
  try {
    if (gaMeasurementId) {
      window.gtag?.("event", "page_view", {
        page_location: pageUrl,
        page_path: new URL(pageUrl).pathname + new URL(pageUrl).search,
      });
    }
  } catch {
    // Tracking must never interrupt storefront navigation.
  }
}

export function trackInitiateCheckout() {
  if (isAdminPath() || checkoutStarted) return;
  checkoutStarted = true;
  const value = 250;
  const currency = "EGP";
  try {
    if (metaPixelId) window.fbq?.("track", "InitiateCheckout", { value, currency });
  } catch {
    // Tracking must never interrupt the checkout flow.
  }
  try {
    if (gaMeasurementId) window.gtag?.("event", "begin_checkout", { value, currency });
  } catch {
    // Tracking must never interrupt the checkout flow.
  }
}

export function trackPurchase(value: number, currency: string) {
  if (isAdminPath()) return;
  const params: TrackingParams = { value, currency };
  try {
    if (metaPixelId) window.fbq?.("track", "Purchase", params);
  } catch {
    // Tracking must never interrupt the checkout flow.
  }
  try {
    if (gaMeasurementId) window.gtag?.("event", "purchase", params);
  } catch {
    // Tracking must never interrupt the checkout flow.
  }
}
