import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const workerUrl = (env.VITE_PUTER_WORKER_URL || "").replace(/\/+$/, "");

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    server: workerUrl
      ? {
          proxy: {
            "/api": {
              target: workerUrl,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  };
});
