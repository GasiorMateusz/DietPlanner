// @ts-check
/* eslint-env node */
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
// Support two modes:
// - Default (server) uses the Node adapter (existing behavior)
// - Cloudflare / Pages mode (set TARGET=cloudflare or CLOUDFLARE_PAGES=true)
//   will produce a static build (output: 'static') which is suitable for
//   Cloudflare Pages static deployments.
const _env = globalThis && globalThis.process && globalThis.process.env ? globalThis.process.env : {};
const isCloudflare = _env.TARGET === "cloudflare" || _env.CLOUDFLARE_PAGES === "true";

export default defineConfig({
  output: isCloudflare ? "static" : "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    envPrefix: "PUBLIC_",
  },
  // Only attach the Node adapter for non-cloudflare builds
  ...(isCloudflare ? {} : { adapter: node({ mode: "standalone" }) }),
});
