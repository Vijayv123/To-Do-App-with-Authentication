import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/To-Do-App-with-Authentication/",
  plugins: [react()],
  server: {
    port: 5173
  }
});
