import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/api/routes.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes mounted FIRST
  app.use('/api', apiRouter);

  // Health check alias at root
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'DeployMate AI',
      version: '1.0.0',
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DeployMate AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
