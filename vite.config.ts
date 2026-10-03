import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // Served from https://azpha.github.io/flashcards/ on GitHub Pages.
  base: "/flashcards/",
  plugins: [react(), tailwindcss()],
});
