import { pool } from "../config/database.js";

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const [sales] = await pool.query(
      "SELECT * FROM view_daily_sales WHERE tanggal = ?",
      [date || new Date().toISOString().split("T")[0]]
    );
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlySales = async (req, res) => {
  // TODO: Implement monthly sales report
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

export const getTopProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      "SELECT * FROM view_top_products LIMIT 10"
    );
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesByKasir = async (req, res) => {
  // TODO: Implement sales by kasir report
  res.status(501).json({ success: false, message: "Not implemented yet" });
};
