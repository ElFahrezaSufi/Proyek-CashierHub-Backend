import { pool } from "../config/database.js";

export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, nama, username, email, telepon, alamat, jabatan, status, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, nama, username, email, telepon, alamat, jabatan, status, created_at FROM users WHERE id = ?",
      [req.params.id]
    );
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  // TODO: Implement user creation
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

export const updateUser = async (req, res) => {
  // TODO: Implement user update
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

export const deleteUser = async (req, res) => {
  // TODO: Implement user deletion
  res.status(501).json({ success: false, message: "Not implemented yet" });
};
