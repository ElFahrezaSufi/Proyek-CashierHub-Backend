const response = {
  success(res, data, message = "Success") {
    return res.json({
      success: true,
      message,
      data,
    });
  },

  error(res, message = "Error", statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  },
};

module.exports = response;
