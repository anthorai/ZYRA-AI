import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { log as logUtil } from "./lib/logger";

const viteLogger = createLogger();

// Re-export log from logger utility for backward compatibility
export const log = logUtil;

export async function setupVite(app: Express, server: Server) {
  // Configure HMR for Replit environment
  const hmrConfig: any = { server };
  
  // For Replit, use the dev domain if available, otherwise let Vite auto-detect
  if (process.env.REPLIT_DEV_DOMAIN) {
    hmrConfig.host = process.env.REPLIT_DEV_DOMAIN;
    hmrConfig.protocol = 'wss';
    hmrConfig.port = 443;
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: hmrConfig,
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets with aggressive caching
  app.use(express.static(distPath, {
    maxAge: '1y', // Cache static assets for 1 year
    immutable: true, // Assets are immutable (versioned filenames)
    setHeaders: (res, path) => {
      // HTML files should always revalidate
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    // HTML should always revalidate for latest content
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
