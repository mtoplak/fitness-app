import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { doubleCsrf } from "csrf-csrf";
import { env } from "./config/env.js";
import { connectToDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import classesRoutes from "./routes/classes.js";
import profileRoutes from "./routes/profile.js";
import membershipsRoutes from "./routes/memberships.js";
import trainersRoutes from "./routes/trainers.js";
import adminRoutes from "./routes/admin.js";
import reportsRoutes from "./routes/reports.js";
import { startReminderJob } from "./jobs/reminderJob.js";

async function bootstrap() {
  await connectToDatabase();

  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
  });
  app.use(limiter);

  // CSRF Protection (skip in test environment)
  if (env.nodeEnv !== "test") {
    const { doubleCsrfProtection } = doubleCsrf({
      getSecret: () => env.jwtSecret,
      getSessionIdentifier: (req) => req.headers['user-agent'] || 'unknown',
      cookieName: "x-csrf-token",
      cookieOptions: {
        httpOnly: true,
        sameSite: "strict",
        secure: env.nodeEnv === "production"
      },
      size: 64,
      ignoredMethods: ["GET", "HEAD", "OPTIONS"]
    });
    app.use(doubleCsrfProtection);
  }

  app.get("/", (_req, res) => res.send("Hello from Fitness App API"));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRoutes);
  app.use("/user", meRoutes);
  app.use("/classes", classesRoutes);
  app.use("/user", profileRoutes);
  app.use("/memberships", membershipsRoutes);
  app.use("/trainers", trainersRoutes);
  app.use("/admin", adminRoutes);
  app.use("/reports", reportsRoutes);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  });

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
    
    startReminderJob();
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

