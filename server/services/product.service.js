/**
 * Product Service
 * Business logic for product operations
 */

import pool from "../config/database.js";

class ProductService {
  /**
   * Get all products with pagination and filters
   */
  async getAllProducts(
    page = 1,
    limit = 10,
    search = "",
    kategoriId = null,
    isActive = null
  ) {
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.nama_kategori
      FROM products p
      LEFT JOIN categories c ON p.kategori_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.nama_barang ILIKE $${paramIndex} OR p.kode_barang ILIKE $${paramIndex} OR p.merek ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (kategoriId) {
      query += ` AND p.kategori_id = $${paramIndex}`;
      params.push(kategoriId);
      paramIndex++;
    }

    if (isActive !== null) {
      query += ` AND p.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace(
      "SELECT p.*, c.nama_kategori",
      "SELECT COUNT(p.id)"
    );
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      products: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const query = `
      SELECT p.*, c.nama_kategori
      FROM products p
      LEFT JOIN categories c ON p.kategori_id = c.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("Produk tidak ditemukan");
    }

    return result.rows[0];
  }

  /**
   * Create new product
   */
  async createProduct(productData) {
    const {
      kode_barang,
      nama_barang,
      kategori_id,
      merek,
      harga_beli,
      harga_jual,
      stok,
      stok_minimum,
      satuan,
      deskripsi,
      gambar,
      barcode,
    } = productData;

    // Check if product code already exists
    const checkQuery = "SELECT id FROM products WHERE kode_barang = $1";
    const checkResult = await pool.query(checkQuery, [kode_barang]);

    if (checkResult.rows.length > 0) {
      throw new Error("Kode barang sudah terdaftar");
    }

    const query = `
      INSERT INTO products (
        kode_barang, nama_barang, kategori_id, merek, harga_beli, harga_jual,
        stok, stok_minimum, satuan, deskripsi, gambar, barcode, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await pool.query(query, [
      kode_barang,
      nama_barang,
      kategori_id,
      merek,
      harga_beli,
      harga_jual,
      stok || 0,
      stok_minimum || 5,
      satuan || "pcs",
      deskripsi,
      gambar,
      barcode,
      "active",
    ]);

    return result.rows[0];
  }

  /**
   * Update product
   */
  async updateProduct(id, productData) {
    const {
      kode_barang,
      nama_barang,
      kategori_id,
      merek,
      harga_beli,
      harga_jual,
      stok,
      stok_minimum,
      satuan,
      deskripsi,
      gambar,
      barcode,
      is_active,
    } = productData;

    // Check if product exists
    const existingProduct = await this.getProductById(id);

    // If kode_barang changed, check if new code is available
    if (kode_barang && kode_barang !== existingProduct.kode_barang) {
      const checkQuery =
        "SELECT id FROM products WHERE kode_barang = $1 AND id != $2";
      const checkResult = await pool.query(checkQuery, [kode_barang, id]);

      if (checkResult.rows.length > 0) {
        throw new Error("Kode barang sudah digunakan produk lain");
      }
    }

    const query = `
      UPDATE products 
      SET kode_barang = COALESCE($1, kode_barang),
          nama_barang = COALESCE($2, nama_barang),
          kategori_id = COALESCE($3, kategori_id),
          merek = COALESCE($4, merek),
          harga_beli = COALESCE($5, harga_beli),
          harga_jual = COALESCE($6, harga_jual),
          stok = COALESCE($7, stok),
          stok_minimum = COALESCE($8, stok_minimum),
          satuan = COALESCE($9, satuan),
          deskripsi = COALESCE($10, deskripsi),
          gambar = COALESCE($11, gambar),
          barcode = COALESCE($12, barcode),
          is_active = COALESCE($13, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;

    const result = await pool.query(query, [
      kode_barang,
      nama_barang,
      kategori_id,
      merek,
      harga_beli,
      harga_jual,
      stok,
      stok_minimum,
      satuan,
      deskripsi,
      gambar,
      barcode,
      is_active,
      id,
    ]);

    return result.rows[0];
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    const query = `
      UPDATE products 
      SET is_active = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error("Produk tidak ditemukan");
    }

    return { message: "Produk berhasil dihapus", product: result.rows[0] };
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts() {
    const query = `
      SELECT p.*, c.nama_kategori,
             (p.stok_minimum - p.stok) AS kekurangan
      FROM products p
      LEFT JOIN categories c ON p.kategori_id = c.id
      WHERE p.stok <= p.stok_minimum AND p.is_active = 'active'
      ORDER BY p.stok ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Adjust stock
   */
  async adjustStock(id, jumlah, keterangan, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get current product
      const productQuery = "SELECT * FROM products WHERE id = $1 FOR UPDATE";
      const productResult = await client.query(productQuery, [id]);

      if (productResult.rows.length === 0) {
        throw new Error("Produk tidak ditemukan");
      }

      const product = productResult.rows[0];
      const stokBaru = product.stok + jumlah;

      if (stokBaru < 0) {
        throw new Error("Stok tidak boleh negatif");
      }

      // Update stock
      const updateQuery =
        "UPDATE products SET stok = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2";
      await client.query(updateQuery, [stokBaru, id]);

      // Log stock movement
      const logQuery = `
        INSERT INTO stock_movements (
          produk_id, jenis_pergerakan, jumlah, stok_sebelum, stok_sesudah, keterangan, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const jenisPergerakan = jumlah > 0 ? "in" : "out";
      await client.query(logQuery, [
        id,
        jenisPergerakan,
        Math.abs(jumlah),
        product.stok,
        stokBaru,
        keterangan,
        userId,
      ]);

      await client.query("COMMIT");

      return {
        message: "Stok berhasil disesuaikan",
        stok_sebelum: product.stok,
        stok_sesudah: stokBaru,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new ProductService();
