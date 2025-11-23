/**
 * Product Controller
 * Handles product-related HTTP requests
 */

import productService from "../services/product.service.js";
import { asyncHandler } from "../middleware/error.middleware.js";

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Private
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, kategori_id, is_active } = req.query;

  const result = await productService.getAllProducts(
    parseInt(page),
    parseInt(limit),
    search,
    kategori_id ? parseInt(kategori_id) : null,
    is_active
  );

  res.json({
    success: true,
    message: "Produk berhasil diambil",
    data: result.products,
    pagination: result.pagination,
  });
});

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.json({
    success: true,
    data: { product },
  });
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private (Manager/Admin)
 */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    message: "Produk berhasil ditambahkan",
    data: { product },
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Manager/Admin)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.json({
    success: true,
    message: "Produk berhasil diupdate",
    data: { product },
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin only)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Private
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await productService.getLowStockProducts();

  res.json({
    success: true,
    data: { products },
  });
});

/**
 * @desc    Adjust product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Private (Manager/Admin)
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const { jumlah, keterangan } = req.body;

  const result = await productService.adjustStock(
    req.params.id,
    parseInt(jumlah),
    keterangan,
    req.user.id
  );

  res.json({
    success: true,
    message: result.message,
    data: {
      stok_sebelum: result.stok_sebelum,
      stok_sesudah: result.stok_sesudah,
    },
  });
});
