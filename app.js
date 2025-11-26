const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const apiRoutes = require("./routes/api");

const app = express();

// Security: Helmet untuk set HTTP headers yang aman
app.use(helmet());

// Security: Rate limiting untuk mencegah brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan login
  message: {
    error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: General rate limiter untuk semua endpoint
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 100, // Maksimal 100 request per menit
  message: { error: "Terlalu banyak request. Coba lagi nanti." },
});

// Middleware logging
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS configuration - hanya izinkan domain tertentu
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://proyek-cashier-hub-backend.vercel.app",
  "https://cashierhub-frontend.vercel.app", // Ganti dengan domain frontend Anda
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.get("/", (req, res) => {
  res.send("Backend CashierHub Complete API is Running!");
});

// API Routes dengan rate limiter khusus untuk login
app.use("/api/login", loginLimiter);
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: err.message });
});

module.exports = app;
