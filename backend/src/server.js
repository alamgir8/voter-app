require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const centerRoutes = require("./routes/center.routes");
const voterRoutes = require("./routes/voter.routes");
const searchRoutes = require("./routes/search.routes");
const importRoutes = require("./routes/import.routes");
const exportRoutes = require("./routes/export.routes");
const locationRoutes = require("./routes/location.routes");

const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "অনেক বেশি অনুরোধ, পরে আবার চেষ্টা করুন।",
  },
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/centers", centerRoutes);
app.use("/api/voters", voterRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/import", importRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/locations", locationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ভোটার সার্চ API সচল আছে",
    timestamp: new Date(),
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB সংযোগ সফল হয়েছে");
    app.listen(PORT, () => {
      console.log(`🚀 সার্ভার পোর্ট ${PORT} এ চালু আছে`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB সংযোগ ব্যর্থ:", err.message);
    process.exit(1);
  });

module.exports = app;
