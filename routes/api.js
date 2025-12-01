const express = require("express");
const router = express.Router();
const cashierController = require("../controllers/cashierController");

// Auth Routes
router.post("/login", cashierController.login);

// User Routes
router.get("/users", cashierController.getAllUsers);
router.post("/users", cashierController.createUser);
router.put("/users/:id", cashierController.updateUser);
router.delete("/users/:id", cashierController.deleteUser);

// Product Routes
router.get("/products", cashierController.getAllProducts);
router.post("/products", cashierController.createProduct);
router.put("/products/:id", cashierController.updateProduct);
router.delete("/products/:id", cashierController.deleteProduct);

// Transaction Routes
router.post("/transactions", cashierController.createTransaction);
router.get("/transactions", cashierController.getAllTransactions);
router.get("/transactions/:id", cashierController.getTransactionById);

module.exports = router;
