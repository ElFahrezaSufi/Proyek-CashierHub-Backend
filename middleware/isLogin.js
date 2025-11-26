// Middleware untuk validasi login (opsional, bisa dikembangkan lebih lanjut)
const isLogin = (req, res, next) => {
  // Untuk saat ini, hanya pass through
  // Bisa ditambahkan JWT validation di masa depan
  next();
};

module.exports = isLogin;
