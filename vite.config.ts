import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
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
  let expressApp: any;

  return {
    name: "express",
    apply: "serve",
    configureServer(server) {
      // Register the Express middleware to handle API routes BEFORE Vite's default middleware
      // Use unshift to add it at the beginning of the middleware stack
      const expressMiddleware = async (req: any, res: any, next: any) => {
        // Only handle API routes with Express
        if (req.url?.startsWith("/api/")) {
          // Lazy-load the server on first request
          if (!expressApp) {
            try {
              const { createServer } = await import("./server/index.js");
              expressApp = createServer();
            } catch (error) {
              console.error("Failed to load Express server:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                error: "Server initialization failed",
                details: error instanceof Error ? error.message : String(error),
              }));
              return;
            }
          }

          // Delegate to Express server
          expressApp(req, res, next);
        } else {
          // Let other requests pass through to Vite's default middleware
          next();
        }
      };

      // Unshift to add at the beginning of the middleware stack
      server.middlewares.stack.unshift({
        route: "",
        handle: expressMiddleware,
      });
    },
  };
}
