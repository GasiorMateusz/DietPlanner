// @ts-check
/* eslint-env node */
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

const _env = globalThis && globalThis.process && globalThis.process.env ? globalThis.process.env : {};
const isCloudflare = _env.TARGET === "cloudflare" || _env.CLOUDFLARE_PAGES === "true";

export default defineConfig({
  output: "server",
  adapter: isCloudflare ? cloudflare() : node({ mode: "standalone" }),
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    envPrefix: "PUBLIC_",
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    resolve: {
      alias: {
        buffer: "buffer/",
      },
    },
    define: {
      global: "globalThis",
    },
  },
});
