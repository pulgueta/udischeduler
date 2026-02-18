import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const tunnelHost = process.env.VITE_TUNNEL_HOST;

/**
 * Vite plugin that injects a postMessage bridge into the HTML so the parent
 * Converge app can communicate with this preview iframe (screenshots, pings,
 * location tracking). The bridge lazily imports the worker module from the
 * Converge host on first screenshot request.
 */
function convergePreviewBridge() {
  return {
    name: "converge-preview-bridge",
    transformIndexHtml(html: string) {
      const script = `
<script>
(function() {
  var workerModule = null;
  window.addEventListener("message", function(event) {
    if (event.source !== window.parent) return;
    if (!event.data || event.data.type !== "chefPreviewRequest") return;
    var request = event.data.request;
    if (request === "ping") {
      event.source.postMessage({ type: "pong" }, event.origin);
    } else if (request === "location") {
      event.source.postMessage({
        type: "chefPreviewLocation",
        href: window.location.href,
        path: window.location.pathname + window.location.search + window.location.hash
      }, event.origin);
    } else if (request === "screenshot") {
      var url = event.origin + "/scripts/worker.bundled.mjs";
      (workerModule || (workerModule = import(url))).then(function(mod) {
        return mod.respondToMessage(event);
      }).catch(function(err) {
        event.source.postMessage(
          { type: "screenshot-error", error: String(err) },
          event.origin
        );
      });
    }
  });
})();
</script>`;
      return html.replace("</head>", script + "\n</head>");
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [convergePreviewBridge(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    origin: tunnelHost ? `https://${tunnelHost}` : undefined,
    hmr: tunnelHost
      ? { host: tunnelHost, protocol: "wss", clientPort: 443 }
      : true,
    headers: {
      // Allow embedding in iframes from any origin
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy":
        "frame-ancestors 'self' http://127.0.0.1:* http://localhost:* https://*.modal.host https://*.convex.dev https://*.converge.run https://converge.run",
      // Disable COEP to allow cross-origin embedding
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
});
