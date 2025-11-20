import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
    // Fallback error handler
    console.error(err);
    res.status(500).json({ message: "Server error" });
  });

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
    
    // Zaženi cron job za pošiljanje opomnikov
    startReminderJob();
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});


