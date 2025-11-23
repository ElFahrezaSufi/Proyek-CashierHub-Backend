# CashierHub Backend API

Backend REST API untuk sistem manajemen kasir internal retail (CashierHub) menggunakan Express.js dan PostgreSQL.

## 🚀 Teknologi

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (JSON Web Token)
- **Validation**: express-validator
- **Security**: helmet, rate-limiting, bcryptjs
- **Logging**: morgan

## 📁 Struktur Proyek

```
server/
├── config/
│   └── database.js          # PostgreSQL connection pool
├── controllers/
│   ├── auth.controller.js   # Authentication endpoints
│   ├── product.controller.js # Product CRUD
│   └── transaction.controller.js # Transaction management
├── services/
│   ├── auth.service.js      # Authentication business logic
│   ├── product.service.js   # Product business logic
│   └── transaction.service.js # Transaction business logic
├── middleware/
│   ├── auth.middleware.js   # JWT verification & RBAC
│   └── error.middleware.js  # Error handling & validation
├── validators/
│   └── index.js            # Input validation schemas
├── routes/
│   ├── auth.routes.js
│   ├── product.routes.js
│   └── transaction.routes.js
├── database/
│   ├── schema.sql          # PostgreSQL database schema
│   └── init.js             # Database initialization script
├── .env.example
├── server.js
└── README.md
```

## 🛠️ Setup & Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup PostgreSQL

Buat database baru:

```sql
CREATE DATABASE cashierhub_db;
```

### 3. Configure Environment

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi PostgreSQL Anda.

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Run Server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server: `http://localhost:5000`

## 🔐 Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Using Token

```http
GET /api/products
Authorization: Bearer YOUR_JWT_TOKEN
```

## 👥 Roles

- **Admin**: Full access
- **Manager**: Kelola produk, transaksi, laporan, user
- **Supervisor**: Kelola produk, lihat transaksi & laporan
- **Kasir**: Buat transaksi, lihat produk

## 📡 API Endpoints

### Auth (`/api/auth`)

- `POST /login` - Login
- `POST /register` - Register
- `GET /profile` - Get profile (Auth)
- `PUT /profile` - Update profile (Auth)
- `PUT /change-password` - Change password (Auth)

### Products (`/api/products`)

- `GET /` - Get all (pagination, search, filter)
- `GET /:id` - Get by ID
- `GET /low-stock` - Low stock alert
- `POST /` - Create (Manager+)
- `PUT /:id` - Update (Manager+)
- `PATCH /:id/stock` - Adjust stock (Manager+)
- `DELETE /:id` - Delete (Admin)

### Transactions (`/api/transactions`)

- `POST /` - Create transaction
- `GET /` - Get all (pagination, filter)
- `GET /:id` - Get detail
- `PATCH /:id/cancel` - Cancel (Manager+)
- `GET /reports/daily/:date` - Daily report
- `GET /reports/range` - Date range report

## 📊 Response Format

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {}
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": []
  }
}
```

## 🔒 Security

- JWT Authentication
- bcrypt Password Hashing
- Helmet Security Headers
- Rate Limiting (100 req/15min)
- CORS Configuration
- Input Validation
- Parameterized Queries (SQL Injection Prevention)
- Role-Based Access Control

## 📝 Default Users

| Username | Password | Role    | Email                  |
| -------- | -------- | ------- | ---------------------- |
| admin    | admin123 | Admin   | admin@cashierhub.com   |
| manager1 | admin123 | Manager | manager@cashierhub.com |
| kasir1   | admin123 | Kasir   | kasir1@cashierhub.com  |

## 🐛 Troubleshooting

**Database Connection Failed:**

- Check PostgreSQL service running
- Verify `.env` credentials
- Ensure database created

**JWT Invalid:**

- Include token in `Authorization: Bearer TOKEN`
- Token might be expired (7 days)
- Verify JWT_SECRET in `.env`

**Port In Use:**

- Change PORT in `.env`
- Or: `npx kill-port 5000`

---

**CashierHub API v1.0.0** - PostgreSQL Edition
