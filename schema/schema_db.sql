BEGIN;

DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 1. TABEL USERS (Kasir & Admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    profile_picture TEXT, 
    role VARCHAR(20) NOT NULL DEFAULT 'Kasir' CHECK (role IN ('Admin', 'Kasir')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL PRODUCTS (Barang)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL TRANSACTIONS (Header Struk)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    cash_amount NUMERIC(15, 2) NOT NULL,
    change_amount NUMERIC(15, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL TRANSACTION ITEMS (Detail Belanja)
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_transaction NUMERIC(15, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 5. SEEDING DATA (Data Dummy Awal) --

-- Data User
INSERT INTO users (username, password, name, email, phone, address, role, profile_picture) VALUES 
('admin', 'admin123', 'Administrator', 'admin@cashierhub.com', '08123456789', 'Kantor Pusat', 'Admin', NULL),
('ahmad', 'ahmad123', 'Ahmad Fadli', 'ahmad@cashierhub.com', '081234567890', 'Jl. Merdeka No. 123, Jakarta', 'Kasir', NULL),
('siti', 'siti123', 'Siti Nurhaliza', 'siti@cashierhub.com', '082345678901', 'Jl. Sudirman No. 45, Bandung', 'Kasir', NULL),
('budi', 'budi123', 'Budi Santoso', 'budi@cashierhub.com', '083456789012', 'Jl. Gatot Subroto No. 67, Surabaya', 'Admin', NULL);

-- Data Produk
INSERT INTO products (name, type, code, stock, price) VALUES 
('Indomie Goreng', 'Mie Instan', '123123', 50, 3000),
('Chitato Sapi Panggang 55g', 'Snack', '213874', 60, 10000),
('Chiki Balls 30g', 'Snack', '213477', 60, 5000),
('Qtela Singkong Original 55g', 'Snack', '123276', 60, 8000),
('Lay''s Rumput Laut 68g', 'Snack', '126163', 60, 12000),
('Taro Snack 40g', 'Snack', '937842', 60, 6000),
('Richeese Nabati 110g', 'Wafer', '353454', 60, 12500),
('Piattos Keju 50g', 'Snack', '12312312', 60, 7500);

COMMIT;