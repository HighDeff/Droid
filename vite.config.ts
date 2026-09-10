// Prevent Node 22 Windows EPIPE / EOF socket crashes on closed pipes
process.on("uncaughtException", (err: any) => {
  if (err?.code === "EOF" || err?.code === "EPIPE" || err?.errno === -4095) {
    return; // Safely ignore closed pipe events
  }
  console.error("Uncaught server exception:", err);
});
process.stdout?.on?.("error", (err: any) => {
  if (err?.code === "EOF" || err?.code === "EPIPE" || err?.errno === -4095)
    return;
});

import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: process.env.DEV_HOST || "127.0.0.1",
    port: 5173,
    fs: {
      allow: ["./client", "./shared", "."],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    strictPort: false,
    open: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
