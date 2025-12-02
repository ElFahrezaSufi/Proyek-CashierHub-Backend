-- ========================================
-- UPDATE DATABASE UNTUK MENAMBAH SUPER ADMIN
-- ========================================
-- Jalankan script ini di pgAdmin untuk menambahkan role Super Admin
-- Pastikan database cashierhub sudah aktif

BEGIN;

-- 1. Drop existing constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Tambahkan constraint baru dengan Super Admin
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('Super Admin', 'Admin', 'Kasir'));

-- 3. Tambahkan user Super Admin (jika belum ada)
-- Cek dulu apakah sudah ada superadmin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin') THEN
        INSERT INTO users (username, password, name, email, phone, address, role, profile_picture) 
        VALUES ('superadmin', 'super123', 'Super Administrator', 'superadmin@cashierhub.com', '08111111111', 'Kantor Pusat - HQ', 'Super Admin', NULL);
        RAISE NOTICE 'Super Admin user berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Super Admin user sudah ada';
    END IF;
END $$;

-- 4. Tampilkan semua users untuk verifikasi
SELECT id, username, name, role, email FROM users ORDER BY id;

COMMIT;

-- ========================================
-- INFORMASI LOGIN SUPER ADMIN
-- ========================================
-- Username: superadmin
-- Password: super123
-- ========================================
