// src/app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const { sequelize } = require("./models");
const adminRoutes = require("./routes/adminRoutes");
const app = express();
const ownerRoutes = require("./routes/ownerRoutes");
const userStoreRoutes = require("./routes/userStoreRoutes");
// Middlewares
app.use(cors({
  origin: "http://localhost:5173", // allow your frontend
  credentials: true                // allow cookies if needed
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userStoreRoutes);
app.use("/api/owner", ownerRoutes);
// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Ratings Platform API is running 🚀" });
});

// DB connect & server start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // VERY IMPORTANT:
    // We already created tables via SQL. So avoid force sync.
    // If schemas match, this will just work.
    // await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
