const pool = require("../config/db");

const eventsService = {
  // ================== AUTH ==================
  async login(username, password) {
    const query =
      "SELECT id, username, name, email, phone, address, role, profile_picture FROM users WHERE username = $1 AND password = $2";
    const result = await pool.query(query, [username, password]);
    if (result.rows.length > 0) {
      return { success: true, user: result.rows[0] };
    }
    return { success: false, message: "Username atau password salah" };
  },

  // ================== USERS ==================
  async getAllUsers() {
    const result = await pool.query(
      "SELECT id, username, name, email, phone, address, role, created_at FROM users ORDER BY id ASC"
    );
    return result.rows;
  },

  async createUser(userData) {
    const { username, password, name, email, phone, address, role } = userData;
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
    return result.rows[0];
  },

  async updateUser(id, userData) {
    const {
      username,
      password,
      name,
      email,
      phone,
      address,
      role,
      profile_picture,
    } = userData;

    // Build dynamic query based on what fields are provided
    let query = `UPDATE users SET 
      name = $1, 
      email = $2, 
      phone = $3, 
      address = $4, 
      role = $5,
      updated_at = CURRENT_TIMESTAMP`;

    let params = [name, email, phone, address, role];
    let paramCount = 5;

    // Add username if provided
    if (username) {
      paramCount++;
      query += `, username = $${paramCount}`;
      params.push(username);
    }

    // Add password if provided (optional for updates)
    if (password && password.trim() !== "") {
      paramCount++;
      query += `, password = $${paramCount}`;
      params.push(password);
    }

    // Add profile_picture if provided
    if (profile_picture) {
      paramCount++;
      query += `, profile_picture = $${paramCount}`;
      params.push(profile_picture);
    }

    // Add WHERE clause and RETURNING
    paramCount++;
    query += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    return result.rows[0];
  },

  async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return { success: true, message: "User berhasil dihapus" };
  },

  // ================== PRODUCTS ==================
  async getAllProducts() {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    return result.rows;
  },

  async createProduct(productData) {
    const { name, type, code, stock, price } = productData;

    // Cari atau buat kategori
    let categoryId;
    const checkCategoryQuery = "SELECT id FROM categories WHERE name = $1";
    const checkResult = await pool.query(checkCategoryQuery, [type]);

    if (checkResult.rows.length > 0) {
      categoryId = checkResult.rows[0].id;
    } else {
      const insertCategoryQuery =
        "INSERT INTO categories (name) VALUES ($1) RETURNING id";
      const insertResult = await pool.query(insertCategoryQuery, [type]);
      categoryId = insertResult.rows[0].id;
    }

    const query = `
      INSERT INTO products (name, category_id, code, stock, price) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [
      name,
      categoryId,
      code,
      stock,
      price,
    ]);

    const productWithCategory = await pool.query(
      "SELECT p.*, c.name as type FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1",
      [result.rows[0].id]
    );
    return productWithCategory.rows[0];
  },

  async updateProduct(id, productData) {
    const { name, type, code, stock, price } = productData;

    // Cari atau buat kategori
    let categoryId;
    const checkCategoryQuery = "SELECT id FROM categories WHERE name = $1";
    const checkResult = await pool.query(checkCategoryQuery, [type]);

    if (checkResult.rows.length > 0) {
      categoryId = checkResult.rows[0].id;
    } else {
      const insertCategoryQuery =
        "INSERT INTO categories (name) VALUES ($1) RETURNING id";
      const insertResult = await pool.query(insertCategoryQuery, [type]);
      categoryId = insertResult.rows[0].id;
    }

    const query = `
      UPDATE products SET name = $1, category_id = $2, code = $3, stock = $4, price = $5, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6 RETURNING *`;
    const result = await pool.query(query, [
      name,
      categoryId,
      code,
      stock,
      price,
      id,
    ]);

    const productWithCategory = await pool.query(
      "SELECT p.*, c.name as type FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1",
      [id]
    );
    return productWithCategory.rows[0];
  },

  async deleteProduct(id) {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return { success: true, message: "Produk berhasil dihapus" };
  },

  // ================== TRANSACTIONS ==================
  async createTransaction(transactionData) {
    const { user_id, total_amount, cash_amount, items } = transactionData;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const transQuery = `
        INSERT INTO transactions (user_id, total_amount, cash_amount)
        VALUES ($1, $2, $3) RETURNING id`;
      const transResult = await client.query(transQuery, [
        user_id,
        total_amount,
        cash_amount,
      ]);
      const transactionId = transResult.rows[0].id;

      for (const item of items) {
        const itemQuery = `
          INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_transaction)
          VALUES ($1, $2, $3, $4)`;
        await client.query(itemQuery, [
          transactionId,
          item.id,
          item.quantity,
          item.price,
        ]);
        const stockQuery = `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;
        await client.query(stockQuery, [item.quantity, item.id]);
      }
      await client.query("COMMIT");
      return {
        success: true,
        message: "Transaksi Berhasil!",
        transactionId,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async getAllTransactions() {
    const query = `
      SELECT t.id, t.transaction_date, u.name as kasir_name, t.total_amount 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.transaction_date DESC`;
    const result = await pool.query(query);
    return result.rows;
  },
};

module.exports = eventsService;
