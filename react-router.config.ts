import type { Config } from "@react-router/dev/config";

export default {
  // React Router rejects UI-route POSTs whose Origin does not match request.url.
  // Shopify Admin embeds the app in an iframe, and Render terminates TLS, so
  // production form posts arrive from these hosts instead of the internal URL.
  allowedActionOrigins: [
    "admin.shopify.com",
    "*.myshopify.com",
    "store-insights-ffzw.onrender.com",
    "*.trycloudflare.com",
    "*.onrender.com",
  ],
} satisfies Config;