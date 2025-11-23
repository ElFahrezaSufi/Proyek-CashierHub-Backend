/**
 * Transaction Service
 * Business logic for transaction operations
 */

import pool from "../config/database.js";

class TransactionService {
  /**
   * Create new transaction
   */
  async createTransaction(transactionData) {
    const { kasir_id, items, uang_diterima, metode_pembayaran, catatan } =
      transactionData;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Calculate totals
      let total_item = 0;
      let subtotal = 0;

      for (const item of items) {
        total_item += item.jumlah;
        subtotal += item.subtotal;
      }

      const total_bayar = subtotal;
      const kembalian = uang_diterima - total_bayar;

      if (kembalian < 0) {
        throw new Error(
          `Uang tidak cukup. Kurang: Rp ${Math.abs(kembalian).toLocaleString(
            "id-ID"
          )}`
        );
      }

      // Generate transaction code
      const codeQuery = `SELECT generate_transaction_code() AS code`;
      const codeResult = await client.query(codeQuery);
      const kode_transaksi = codeResult.rows[0].code;

      // Create transaction
      const transQuery = `
        INSERT INTO transactions (
          kode_transaksi, kasir_id, total_item, subtotal, total_bayar,
          uang_diterima, kembalian, metode_pembayaran, status, catatan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const transResult = await client.query(transQuery, [
        kode_transaksi,
        kasir_id,
        total_item,
        subtotal,
        total_bayar,
        uang_diterima,
        kembalian,
        metode_pembayaran || "cash",
        "completed",
        catatan,
      ]);

      const transaction = transResult.rows[0];

      // Process each item
      for (const item of items) {
        // Get product
        const productQuery = "SELECT * FROM products WHERE id = $1 FOR UPDATE";
        const productResult = await client.query(productQuery, [
          item.produk_id,
        ]);

        if (productResult.rows.length === 0) {
          throw new Error(`Produk dengan ID ${item.produk_id} tidak ditemukan`);
        }

        const product = productResult.rows[0];

        // Check stock
        if (product.stok < item.jumlah) {
          throw new Error(
            `Stok tidak cukup untuk produk: ${product.nama_barang}`
          );
        }

        // Insert transaction item
        const itemQuery = `
          INSERT INTO transaction_items (
            transaksi_id, produk_id, kode_barang, nama_barang,
            harga_satuan, jumlah, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await client.query(itemQuery, [
          transaction.id,
          product.id,
          product.kode_barang,
          product.nama_barang,
          item.harga_satuan,
          item.jumlah,
          item.subtotal,
        ]);

        // Update stock
        const newStock = product.stok - item.jumlah;
        await client.query("UPDATE products SET stok = $1 WHERE id = $2", [
          newStock,
          product.id,
        ]);

        // Log stock movement
        const logQuery = `
          INSERT INTO stock_movements (
            produk_id, jenis_pergerakan, jumlah, stok_sebelum, stok_sesudah,
            referensi, keterangan, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await client.query(logQuery, [
          product.id,
          "out",
          item.jumlah,
          product.stok,
          newStock,
          kode_transaksi,
          "Transaction sale",
          kasir_id,
        ]);
      }

      await client.query("COMMIT");

      // Get complete transaction with items
      return await this.getTransactionById(transaction.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all transactions with pagination
   */
  async getAllTransactions(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, u.nama_lengkap AS kasir_nama
      FROM transactions t
      LEFT JOIN users u ON t.kasir_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.kasir_id) {
      query += ` AND t.kasir_id = $${paramIndex}`;
      params.push(filters.kasir_id);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND DATE(t.tanggal) >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND DATE(t.tanggal) <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace(
      "SELECT t.*, u.nama_lengkap AS kasir_nama",
      "SELECT COUNT(t.id)"
    );
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY t.tanggal DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      transactions: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get transaction by ID with items
   */
  async getTransactionById(id) {
    const transQuery = `
      SELECT t.*, u.nama_lengkap AS kasir_nama, u.alamat AS kasir_alamat
      FROM transactions t
      LEFT JOIN users u ON t.kasir_id = u.id
      WHERE t.id = $1
    `;

    const transResult = await pool.query(transQuery, [id]);

    if (transResult.rows.length === 0) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const transaction = transResult.rows[0];

    // Get transaction items
    const itemsQuery = `
      SELECT ti.*, p.gambar
      FROM transaction_items ti
      LEFT JOIN products p ON ti.produk_id = p.id
      WHERE ti.transaksi_id = $1
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);
    transaction.items = itemsResult.rows;

    return transaction;
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(id, userId, reason) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get transaction
      const transQuery = "SELECT * FROM transactions WHERE id = $1 FOR UPDATE";
      const transResult = await client.query(transQuery, [id]);

      if (transResult.rows.length === 0) {
        throw new Error("Transaksi tidak ditemukan");
      }

      const transaction = transResult.rows[0];

      if (transaction.status !== "completed") {
        throw new Error("Hanya transaksi completed yang bisa dibatalkan");
      }

      // Get transaction items
      const itemsQuery =
        "SELECT * FROM transaction_items WHERE transaksi_id = $1";
      const itemsResult = await client.query(itemsQuery, [id]);

      // Restore stock for each item
      for (const item of itemsResult.rows) {
        const productQuery =
          "SELECT stok FROM products WHERE id = $1 FOR UPDATE";
        const productResult = await client.query(productQuery, [
          item.produk_id,
        ]);

        if (productResult.rows.length > 0) {
          const currentStock = productResult.rows[0].stok;
          const newStock = currentStock + item.jumlah;

          await client.query("UPDATE products SET stok = $1 WHERE id = $2", [
            newStock,
            item.produk_id,
          ]);

          // Log stock movement
          const logQuery = `
            INSERT INTO stock_movements (
              produk_id, jenis_pergerakan, jumlah, stok_sebelum, stok_sesudah,
              referensi, keterangan, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          await client.query(logQuery, [
            item.produk_id,
            "in",
            item.jumlah,
            currentStock,
            newStock,
            transaction.kode_transaksi,
            `Cancelled: ${reason}`,
            userId,
          ]);
        }
      }

      // Update transaction status
      await client.query(
        "UPDATE transactions SET status = $1, catatan = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        ["cancelled", reason, id]
      );

      await client.query("COMMIT");

      return { message: "Transaksi berhasil dibatalkan" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get daily sales report
   */
  async getDailySales(date) {
    const query = `
      SELECT * FROM view_daily_sales
      WHERE tanggal = $1
    `;

    const result = await pool.query(query, [date]);
    return result.rows[0] || null;
  }

  /**
   * Get sales by date range
   */
  async getSalesByDateRange(startDate, endDate) {
    const query = `
      SELECT 
        DATE(tanggal) AS tanggal,
        COUNT(*) AS total_transaksi,
        SUM(total_item) AS total_item,
        SUM(total_bayar) AS total_pendapatan
      FROM transactions
      WHERE status = 'completed'
        AND DATE(tanggal) BETWEEN $1 AND $2
      GROUP BY DATE(tanggal)
      ORDER BY tanggal DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}

export default new TransactionService();
