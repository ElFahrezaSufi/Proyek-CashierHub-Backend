import { pool } from "../config/database.js";

export const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      "SELECT * FROM categories ORDER BY nama"
    );
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

export const createCategory = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

export const updateCategory = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

export const deleteCategory = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: "Not implemented yet" });
};
