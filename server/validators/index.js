/**
 * Input Validation Schemas
 * Using express-validator
 */

import { body, param, query } from "express-validator";

export const authValidators = {
  register: [
    body("username")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username harus 3-50 karakter")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username hanya boleh huruf, angka, dan underscore"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Email tidak valid")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password minimal 6 karakter"),

    body("nama_lengkap")
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Nama lengkap harus 3-100 karakter"),

    body("role")
      .optional()
      .isIn(["Admin", "Manager", "Supervisor", "Kasir"])
      .withMessage("Role tidak valid"),

    body("no_telepon")
      .optional()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("Nomor telepon tidak valid"),

    body("jenis_kelamin")
      .optional()
      .isIn(["L", "P"])
      .withMessage("Jenis kelamin harus L atau P"),
  ],

  login: [
    body("username").trim().notEmpty().withMessage("Username wajib diisi"),

    body("password").notEmpty().withMessage("Password wajib diisi"),
  ],

  changePassword: [
    body("old_password").notEmpty().withMessage("Password lama wajib diisi"),

    body("new_password")
      .isLength({ min: 6 })
      .withMessage("Password baru minimal 6 karakter"),

    body("confirm_password")
      .custom((value, { req }) => value === req.body.new_password)
      .withMessage("Konfirmasi password tidak cocok"),
  ],
};

export const productValidators = {
  create: [
    body("kode_barang")
      .trim()
      .notEmpty()
      .withMessage("Kode barang wajib diisi")
      .isLength({ max: 50 })
      .withMessage("Kode barang maksimal 50 karakter"),

    body("nama_barang")
      .trim()
      .notEmpty()
      .withMessage("Nama barang wajib diisi")
      .isLength({ max: 200 })
      .withMessage("Nama barang maksimal 200 karakter"),

    body("kategori_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Kategori ID tidak valid"),

    body("harga_beli")
      .isFloat({ min: 0 })
      .withMessage("Harga beli harus angka positif"),

    body("harga_jual")
      .isFloat({ min: 0 })
      .withMessage("Harga jual harus angka positif")
      .custom((value, { req }) => value >= req.body.harga_beli)
      .withMessage("Harga jual harus lebih besar atau sama dengan harga beli"),

    body("stok")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stok harus angka positif"),

    body("stok_minimum")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stok minimum harus angka positif"),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("Product ID tidak valid"),

    body("kode_barang")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Kode barang maksimal 50 karakter"),

    body("nama_barang")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Nama barang maksimal 200 karakter"),

    body("harga_beli")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Harga beli harus angka positif"),

    body("harga_jual")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Harga jual harus angka positif"),

    body("stok")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stok harus angka positif"),
  ],

  adjustStock: [
    param("id").isInt({ min: 1 }).withMessage("Product ID tidak valid"),

    body("jumlah").isInt().withMessage("Jumlah harus berupa angka"),

    body("keterangan")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Keterangan maksimal 500 karakter"),
  ],
};

export const transactionValidators = {
  create: [
    body("kasir_id").isInt({ min: 1 }).withMessage("Kasir ID tidak valid"),

    body("items")
      .isArray({ min: 1 })
      .withMessage("Items harus array minimal 1 item"),

    body("items.*.produk_id")
      .isInt({ min: 1 })
      .withMessage("Produk ID tidak valid"),

    body("items.*.harga_satuan")
      .isFloat({ min: 0 })
      .withMessage("Harga satuan harus angka positif"),

    body("items.*.jumlah")
      .isInt({ min: 1 })
      .withMessage("Jumlah harus minimal 1"),

    body("items.*.subtotal")
      .isFloat({ min: 0 })
      .withMessage("Subtotal harus angka positif"),

    body("uang_diterima")
      .isFloat({ min: 0 })
      .withMessage("Uang diterima harus angka positif"),

    body("metode_pembayaran")
      .optional()
      .isIn(["cash", "debit", "credit", "e-wallet"])
      .withMessage("Metode pembayaran tidak valid"),
  ],

  cancel: [
    param("id").isInt({ min: 1 }).withMessage("Transaction ID tidak valid"),

    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Alasan pembatalan wajib diisi")
      .isLength({ max: 500 })
      .withMessage("Alasan maksimal 500 karakter"),
  ],
};

export const categoryValidators = {
  create: [
    body("nama_kategori")
      .trim()
      .notEmpty()
      .withMessage("Nama kategori wajib diisi")
      .isLength({ max: 100 })
      .withMessage("Nama kategori maksimal 100 karakter"),

    body("deskripsi")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Deskripsi maksimal 500 karakter"),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("Category ID tidak valid"),

    body("nama_kategori")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Nama kategori maksimal 100 karakter"),
  ],
};

export const paginationValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page harus angka positif")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit harus 1-100")
    .toInt(),
];

export const idParamValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID tidak valid").toInt(),
];
