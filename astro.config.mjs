// @ts-check
/* eslint-env node */
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// --- ADAPTER IMPORTS ---
// Import both adapters
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
// Support two modes:
// - Default (server) uses the Node adapter
// - Cloudflare mode (set TARGET=cloudflare or CLOUDFLARE_PAGES=true)
//   will use the Cloudflare adapter.
const _env = globalThis && globalThis.process && globalThis.process.env ? globalThis.process.env : {};
const isCloudflare = _env.TARGET === "cloudflare" || _env.CLOUDFLARE_PAGES === "true";

export default defineConfig({
  // --- UPDATED LOGIC ---
  // We always want server output, the adapter just changes.
  output: "server", 
  
  // Use the correct adapter based on the environment
  adapter: isCloudflare 
    ? cloudflare() 
    : node({ mode: "standalone" }),
  
  // --- Your other settings ---
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    envPrefix: "PUBLIC_",
  },
});