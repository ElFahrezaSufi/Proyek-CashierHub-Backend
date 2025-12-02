const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// Deteksi apakah menggunakan database lokal atau cloud
const isLocalDatabase =
  process.env.PGHOST === "localhost" || process.env.PGHOST === "127.0.0.1";

const poolConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
};

// Hanya gunakan SSL untuk database cloud (seperti Neon)
if (!isLocalDatabase && process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

// Test koneksi database
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error koneksi database:", err.stack);
  } else {
    console.log(
      "✅ Database terhubung:",
      process.env.PGDATABASE,
      "di",
      process.env.PGHOST
    );
    release();
  }
});

module.exports = pool;
