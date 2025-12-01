const cashierService = require("../services/cashierService");

const cashierController = {
  // ================== AUTH ==================
  async login(req, res) {
    const { username, password } = req.body;
    console.log("\n=== LOGIN REQUEST ===");
    console.log("Body:", { username, password: password ? "***" : "empty" });

    try {
      const result = await cashierService.login(username, password);
      console.log("Login result:", {
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        res.json({
          success: true,
          user: result.user,
        });
      } else {
        res.status(401).json(result);
      }
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ================== USERS ==================
  async getAllUsers(req, res) {
    try {
      const users = await cashierService.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createUser(req, res) {
    try {
      const user = await cashierService.createUser(req.body);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateUser(req, res) {
    try {
      const user = await cashierService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const result = await cashierService.deleteUser(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ================== PRODUCTS ==================
  async getAllProducts(req, res) {
    try {
      const products = await cashierService.getAllProducts();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createProduct(req, res) {
    try {
      const product = await cashierService.createProduct(req.body);
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProduct(req, res) {
    try {
      const product = await cashierService.updateProduct(
        req.params.id,
        req.body
      );
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteProduct(req, res) {
    try {
      const result = await cashierService.deleteProduct(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ================== TRANSACTIONS ==================
  async createTransaction(req, res) {
    try {
      const result = await cashierService.createTransaction(req.body);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  async getAllTransactions(req, res) {
    try {
      const transactions = await cashierService.getAllTransactions();
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTransactionById(req, res) {
    try {
      const transaction = await cashierService.getTransactionById(
        req.params.id
      );
      res.json(transaction);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = cashierController;
