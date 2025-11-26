const app = require("./app");

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
  console.log(`🔗 API endpoints tersedia di http://localhost:${port}/api`);
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${port} sudah digunakan!`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", err);
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
