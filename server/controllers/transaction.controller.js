/**
 * Transaction Controller
 * Handles transaction-related HTTP requests
 */

import transactionService from "../services/transaction.service.js";
import { asyncHandler } from "../middleware/error.middleware.js";

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.body);

  res.status(201).json({
    success: true,
    message: "Transaksi berhasil dibuat",
    data: { transaction },
  });
});

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private
 */
export const getAllTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    kasir_id,
    status,
    start_date,
    end_date,
  } = req.query;

  const filters = {
    kasir_id: kasir_id ? parseInt(kasir_id) : null,
    status,
    start_date,
    end_date,
  };

  const result = await transactionService.getAllTransactions(
    parseInt(page),
    parseInt(limit),
    filters
  );

  res.json({
    success: true,
    message: "Transaksi berhasil diambil",
    data: result.transactions,
    pagination: result.pagination,
  });
});

/**
 * @desc    Get transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.id
  );

  res.json({
    success: true,
    data: { transaction },
  });
});

/**
 * @desc    Cancel transaction
 * @route   PATCH /api/transactions/:id/cancel
 * @access  Private (Manager/Admin)
 */
export const cancelTransaction = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const result = await transactionService.cancelTransaction(
    req.params.id,
    req.user.id,
    reason
  );

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Get daily sales
 * @route   GET /api/transactions/reports/daily/:date
 * @access  Private
 */
export const getDailySales = asyncHandler(async (req, res) => {
  const report = await transactionService.getDailySales(req.params.date);

  res.json({
    success: true,
    data: { report },
  });
});

/**
 * @desc    Get sales by date range
 * @route   GET /api/transactions/reports/range
 * @access  Private
 */
export const getSalesByDateRange = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const report = await transactionService.getSalesByDateRange(
    start_date,
    end_date
  );

  res.json({
    success: true,
    data: { report },
  });
});
