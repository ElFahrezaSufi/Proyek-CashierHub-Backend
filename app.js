const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Backend CashierHub Complete API is Running!");
});

// ================== 1. AUTH & USERS ==================

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const query = "SELECT * FROM users WHERE username = $1 AND password = $2";
    const result = await pool.query(query, [username, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Users (Untuk Halaman Kelola Karyawan)
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, name, email, phone, address, role, created_at FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add User (Tambah Karyawan Baru)
app.post("/api/users", async (req, res) => {
  const { username, password, name, email, phone, address, role } = req.body;
  try {
    const query = `
      INSERT INTO users (username, password, name, email, phone, address, role) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const result = await pool.query(query, [
      username,
      password,
      name,
      email,
      phone,
      address,
      role,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User (Edit Karyawan / Profil)
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, profile_picture } = req.body;
  try {
    const query = `
      UPDATE users SET name = $1, email = $2, phone = $3, address = $4, profile_picture = COALESCE($5, profile_picture), created_at = created_at, role = role, updated_at = CURRENT_TIMESTAMP
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

// Delete User (Hapus Karyawan)
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== 2. PRODUCTS (BARANG) ==================

// Get All Products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Product
app.post("/api/products", async (req, res) => {
  const { name, type, code, stock, price } = req.body;
  try {
    const query = `
      INSERT INTO products (name, type, code, stock, price) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [name, type, code, stock, price]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Product (Edit Barang)
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type, code, stock, price } = req.body;
  try {
    const query = `
      UPDATE products SET name = $1, type = $2, code = $3, stock = $4, price = $5, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6 RETURNING *`;
    const result = await pool.query(query, [
      name,
      type,
      code,
      stock,
      price,
      id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product (Hapus Barang)
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== 3. TRANSACTIONS (TRANSAKSI) ==================

// Create Transaction (Bayar)
app.post("/api/transactions", async (req, res) => {
  const { user_id, total_amount, cash_amount, change_amount, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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

    for (const item of items) {
      const itemQuery = `
        INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_transaction, subtotal)
        VALUES ($1, $2, $3, $4, $5)`;
      await client.query(itemQuery, [
        transactionId,
        item.id,
        item.quantity,
        item.price,
        item.price * item.quantity,
      ]);
      const stockQuery = `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;
      await client.query(stockQuery, [item.quantity, item.id]);
    }
    await client.query("COMMIT");
    res.json({ success: true, message: "Transaksi Berhasil!", transactionId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get All Transactions (Riwayat Laporan)
app.get("/api/transactions", async (req, res) => {
  // TODO: Nanti bisa ditambah filter query di sini
  try {
    const query = `
      SELECT t.id, t.transaction_date, u.name as kasir_name, t.total_amount 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.transaction_date DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
  });
}