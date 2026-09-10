const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./db");
const seedDefaultCategories = require("./seedCategories");
const seedAdmin = require("./seedAdmin");

const userRoutes = require("./routes/userRoutes.js");
const categoryRoutes = require("./routes/categoryRoutes.js");
const adsRoutes = require("./routes/adsRoutes.js");
const favoritesRoutes = require("./routes/favoritesRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");


const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://re-market-bano-qabil-5-0-spring-pro.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());

// Database connection helper for serverless & cold starts
let dbPromise = null;
const ensureDB = async (req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB()
        .then(async () => {
          await seedDefaultCategories().catch((err) =>
            console.error("Seeding categories failed:", err.message)
          );
          await seedAdmin().catch((err) =>
            console.error("Seeding admin failed:", err.message)
          );
        })
        .catch((err) => {
          dbPromise = null;
          throw err;
        });
    }
    await dbPromise;
    next();
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

app.use(ensureDB);

app.get(["/", "/api", "/api/"], (req, res) => {
  res.json({
    msg: "OLX Clone Project API",
    status: "ok",
  });
});

// Mount routes for both root and /api prefixes so Vercel rewrites work seamlessly
const routeList = [
  { path: "/users", handler: userRoutes },
  { path: "/category", handler: categoryRoutes },
  { path: "/ads", handler: adsRoutes },
  { path: "/favorites", handler: favoritesRoutes },
  { path: "/chat", handler: chatRoutes },
  { path: "/notifications", handler: notificationRoutes },
];

routeList.forEach(({ path, handler }) => {
  app.use(path, handler);
  app.use(`/api${path}`, handler);
});

const PORT = process.env.PORT || 8080;

// In standalone/local mode, listen on PORT. In Vercel serverless mode, Vercel invokes app directly.
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log("Server is running on " + PORT);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(async () => {
      await require("mongoose").connection.close();
      process.exit(0);
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = app;
