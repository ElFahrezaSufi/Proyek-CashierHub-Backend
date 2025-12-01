const pool = require("../config/db");
const bcrypt = require("bcrypt");

const cashierService = {
  // ================== AUTH ==================
  async login(username, password) {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Username:", username);

    // Check if user exists
    const checkUserQuery =
      "SELECT id, username, password FROM users WHERE username = $1";
    const checkResult = await pool.query(checkUserQuery, [username]);

    if (checkResult.rows.length === 0) {
      console.log("User tidak ditemukan");
      return { success: false, message: "Username tidak ditemukan" };
    }

    const user = checkResult.rows[0];
    console.log("User ditemukan, ID:", user.id);

    // Check if password is hashed (starts with $2b$ for bcrypt)
    const isPasswordHashed = user.password.startsWith("$2b$");
    let passwordMatch = false;

    if (isPasswordHashed) {
      // Use bcrypt compare for hashed passwords
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password hash comparison:", passwordMatch);
    } else {
      // Fallback untuk password plaintext (untuk backward compatibility)
      passwordMatch = user.password === password;
      console.log("Plaintext password comparison:", passwordMatch);
      console.log("WARNING: User masih menggunakan plaintext password!");
    }

    if (!passwordMatch) {
      console.log("Password tidak cocok");
      return { success: false, message: "Password salah" };
    }

    // Get full user data
    const query =
      "SELECT id, username, name, email, phone, address, role, profile_picture FROM users WHERE id = $1";
    const result = await pool.query(query, [user.id]);

    console.log("Login berhasil untuk user:", result.rows[0].username);
    return { success: true, user: result.rows[0] };
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

    try {
      // Hash password sebelum disimpan
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (username, password, name, email, phone, address, role) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      const result = await pool.query(query, [
        username,
        hashedPassword, // Simpan password yang sudah di-hash
        name,
        email,
        phone,
        address,
        role,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("=== CREATE USER ERROR ===");
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      console.error("Error Detail:", error.detail);

      // Handle specific PostgreSQL errors
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.detail.includes("username")) {
          throw new Error("Username sudah digunakan");
        } else if (error.detail.includes("email")) {
          throw new Error("Email sudah digunakan");
        }
      }

      throw new Error(`Gagal menambah karyawan: ${error.message}`);
    }
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

    console.log("=== UPDATE USER SERVICE ===");
    console.log("ID:", id);
    console.log("UserData received:", userData);

    // Build update query dynamically
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Always update these core fields
    fields.push(`name = $${paramIndex++}`);
    values.push(name);

    fields.push(`email = $${paramIndex++}`);
    values.push(email);

    fields.push(`phone = $${paramIndex++}`);
    values.push(phone);

    fields.push(`address = $${paramIndex++}`);
    values.push(address);

    fields.push(`role = $${paramIndex++}`);
    values.push(role);

    // Update username if provided
    if (username && username.trim() !== "") {
      fields.push(`username = $${paramIndex++}`);
      values.push(username);
      console.log("Username akan diupdate ke:", username);
    }

    // Update password if provided
    if (password && password.trim() !== "") {
      // Hash password sebelum disimpan
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      fields.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
      console.log("Password akan diupdate (hashed)");
    }

    // Update profile_picture (always update, including null to delete)
    if (profile_picture !== undefined) {
      fields.push(`profile_picture = $${paramIndex++}`);
      values.push(profile_picture);
      console.log(
        "Profile picture akan diupdate:",
        profile_picture ? "Ada foto" : "Dihapus (null)"
      );
    }

    // Always update timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add ID as last parameter
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING id, username, name, email, phone, address, role, profile_picture, created_at, updated_at
    `;

    console.log("Query:", query);
    console.log("Values:", values);

    const result = await pool.query(query, values);

    console.log("Update berhasil, data baru:", result.rows[0]);

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
    const query = `
      INSERT INTO products (name, type, code, stock, price) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [name, type, code, stock, price]);
    return result.rows[0];
  },

  async updateProduct(id, productData) {
    const { name, type, code, stock, price } = productData;
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
    return result.rows[0];
  },

  async deleteProduct(id) {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return { success: true, message: "Produk berhasil dihapus" };
  },

  // ================== TRANSACTIONS ==================
  async createTransaction(transactionData) {
    const { user_id, total_price, cash_amount, change_amount, items } =
      transactionData;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Use values from frontend
      const total_amount = total_price;
      const cash = cash_amount || total_price;
      const change = change_amount || 0;

      const transQuery = `
        INSERT INTO transactions (user_id, total_amount, cash_amount, change_amount)
        VALUES ($1, $2, $3, $4) RETURNING id`;
      const transResult = await client.query(transQuery, [
        user_id,
        total_amount,
        cash,
        change,
      ]);
      const transactionId = transResult.rows[0].id;

      for (const item of items) {
        const itemQuery = `
          INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_transaction, subtotal)
          VALUES ($1, $2, $3, $4, $5)`;
        await client.query(itemQuery, [
          transactionId,
          item.product_id,
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]);
        const stockQuery = `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;
        await client.query(stockQuery, [item.quantity, item.product_id]);
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
      SELECT t.id, t.transaction_date, t.user_id, u.name as kasir_name, t.total_amount 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.transaction_date DESC`;
    const result = await pool.query(query);
    return result.rows;
  },

  async getTransactionById(id) {
    // Get transaction header
    const transQuery = `
      SELECT t.id, t.transaction_date, t.total_amount, t.cash_amount, t.change_amount,
             u.name as kasir_name, u.username as kasir_username
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1`;
    const transResult = await pool.query(transQuery, [id]);

    if (transResult.rows.length === 0) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const transaction = transResult.rows[0];

    // Get transaction items
    const itemsQuery = `
      SELECT ti.quantity, ti.price_at_transaction, ti.subtotal,
             p.name as product_name, p.code as product_code, p.type as product_type
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = $1`;
    const itemsResult = await pool.query(itemsQuery, [id]);

    return {
      ...transaction,
      items: itemsResult.rows,
    };
  },
};

module.exports = cashierService;
