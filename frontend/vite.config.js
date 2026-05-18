import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["leaflet"],
  },
  resolve: {
    alias: {
      leaflet: path.resolve(__dirname, "node_modules/leaflet/dist/leaflet.js"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
