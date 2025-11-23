import { pool } from "../config/database.js";

export const getAllSettings = async (req, res) => {
  try {
    const [settings] = await pool.query("SELECT * FROM settings");
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSetting = async (req, res) => {
  // TODO: Implement setting update
  res.status(501).json({ success: false, message: "Not implemented yet" });
};
