-- 1. Buat Tabel Kategori Baru
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Masukkan data kategori unik dari tabel products yang ada
INSERT INTO categories (name)
SELECT DISTINCT type FROM products;

-- 2. Modifikasi Tabel Products
-- Tambah kolom category_id
ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Update isi category_id berdasarkan nama type yang lama
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.type = c.name;

-- Hapus kolom type lama (karena sudah diganti category_id)
ALTER TABLE products DROP COLUMN type;

-- 3. Hapus Kolom Kalkulasi (Transitive Dependency)
ALTER TABLE transactions DROP COLUMN change_amount;
ALTER TABLE transaction_items DROP COLUMN subtotal;

-- Contoh cara mengambil data setelah 3NF (menggunakan rumus)
SELECT 
    product_id, 
    quantity, 
    price_at_transaction, 
    (quantity * price_at_transaction) AS subtotal -- Dihitung saat dipanggil
FROM transaction_items;