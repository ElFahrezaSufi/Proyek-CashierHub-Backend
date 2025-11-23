/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

import authService from "../services/auth.service.js";
import { asyncHandler } from "../middleware/error.middleware.js";

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("user-agent");

  const result = await authService.login(
    username,
    password,
    ipAddress,
    userAgent
  );

  res.json({
    success: true,
    message: "Login berhasil",
    data: result,
  });
});

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "Registrasi berhasil",
    data: { user },
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);

  res.json({
    success: true,
    message: "Profile berhasil diupdate",
    data: { user },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;

  const result = await authService.changePassword(
    req.user.id,
    old_password,
    new_password
  );

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // With JWT, logout is handled on client side by removing token
  // But we can log the activity

  res.json({
    success: true,
    message: "Logout berhasil",
  });
});
