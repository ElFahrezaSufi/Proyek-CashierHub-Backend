const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // Import koneksi database

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Limit besar untuk upload foto base64

// Test Route (Untuk cek server nyala/ngga di browser)
app.get("/", (req, res) => {
  res.send("Backend CashierHub is Running on Vercel!");
});

// ================= ROUTES =================

// 1. GET ALL PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. ADD PRODUCT
app.post("/api/products", async (req, res) => {
  const { name, type, code, stock, price } = req.body;
  try {
    const query = `
      INSERT INTO products (name, type, code, stock, price) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [name, type, code, stock, price]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. LOGIN
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Note: Di production gunakan bcrypt untuk hash password
    const query = "SELECT * FROM users WHERE username = $1 AND password = $2";
    const result = await pool.query(query, [username, password]);

    if (result.rows.length > 0) {
      res.json({
        success: true,
        user: result.rows[0],
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. TRANSAKSI (Complex Logic)
app.post("/api/transactions", async (req, res) => {
  const { user_id, total_amount, cash_amount, change_amount, items } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Mulai Transaksi

    // A. Simpan Header Transaksi
    const transQuery = `
      INSERT INTO transactions (user_id, total_amount, cash_amount, change_amount)
      VALUES ($1, $2, $3, $4) RETURNING id`;
    const transResult = await client.query(transQuery, [
      user_id,
      total_amount,
      cash_amount,
      change_amount,
    ]);
    const transactionId = transResult.rows[0].id;

    // B. Loop Simpan Detail & Update Stok
    for (const item of items) {
      const itemQuery = `
        INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_transaction, subtotal)
        VALUES ($1, $2, $3, $4, $5)`;

      // Pastikan item.price dan item.quantity ada
      const subtotal = item.price * item.quantity;

      await client.query(itemQuery, [
        transactionId,
        item.id,
        item.quantity,
        item.price,
        subtotal,
      ]);

      // Update Stok
      const stockQuery = `UPDATE products SET stock = stock - $1 WHERE id = $2`;
      await client.query(stockQuery, [item.quantity, item.id]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Transaksi Berhasil!", transactionId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Transaksi Gagal: " + err.message });
  } finally {
    client.release();
  }
});

// 5. UPDATE USER PROFILE
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, profile_picture } = req.body;

  try {
    const query = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3, address = $4, profile_picture = $5
      WHERE id = $6 RETURNING *`;

    const result = await pool.query(query, [
      name,
      email,
      phone,
      address,
      profile_picture,
      id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export app untuk Vercel Serverless
module.exports = app;

// Opsional: Tetap bisa jalan di localhost
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
  });
}