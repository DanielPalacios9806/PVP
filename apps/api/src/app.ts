import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { createRateLimiter } from "./middlewares/rate-limit.js";
import { apiRouter } from "./routes/index.js";

const apiRateLimiter = createRateLimiter({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX,
  keyPrefix: "api",
  message: "Demasiadas solicitudes. Intenta nuevamente en unos minutos."
});

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  if (env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

  app.use("/api", apiRateLimiter, apiRouter);
  app.use("/api", (_request, response) => {
    response.status(404).json({ message: "Ruta no encontrada." });
  });
  app.use(errorHandler);

  return app;
}
