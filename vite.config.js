cat > vite.config.js <<'JS'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Local dev only: proxy /api -> Render
  server: {
    proxy: {
      "/api": {
        target: "https://elite24-api.onrender.com",
        changeOrigin: true,
        secure: true
      }
    }
  }
});
JS
