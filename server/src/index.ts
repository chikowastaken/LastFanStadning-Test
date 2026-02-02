import "dotenv/config";

import express from "express";
import cors from "cors";
import tournamentRoutes from "./routes/tournament";
import quizRoutes from './routes/quiz';
import adminRoutes from './routes/admin';


const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Request logging (development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
  });
}

// ============ Routes ============

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/tournament", tournamentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ============ Error Handler ============

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    // Don't expose internal errors in production
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error";

    res.status(err.status || 500).json({ error: message });
  }
);

// ============ Start Server ============

app.listen(PORT, () => {
  console.log("");
  console.log("🚀 LastFansStanding Backend Server");
  console.log("============================");
  console.log(`📡 Server:     http://localhost:${PORT}`);
  console.log(
    `🌐 CORS:       ${process.env.CLIENT_URL || "http://localhost:5173"}`
  );
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");
  console.log("Available routes:");
  console.log("  GET  /health                  - Health check");
  console.log("  GET  /api/quiz/:id            - Get quiz info");
  console.log("  GET  /api/quiz/:id/questions  - Get questions (secure)");
  console.log("  POST /api/quiz/:id/start      - Start quiz");
  console.log(
    "  POST /api/quiz/:id/submit     - Submit answers (graded server-side)"
  );
  console.log(
    "  GET  /api/quiz/:id/results    - Get results (after submission)"
  );
  console.log("");
});

export default app;
