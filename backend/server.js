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

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    msg: "OLX Clone Project",
  });
});

app.use("/users", userRoutes);
app.use("/category", categoryRoutes);
app.use("/ads", adsRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/chat", chatRoutes);
app.use("/notifications", notificationRoutes);

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultCategories();
    await seedAdmin();
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
  } catch (error) {
    console.error(`MongoDB startup failed: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();
