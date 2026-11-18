-- ============================================================
-- KENYA METHODIST UNIVERSITY
-- SCHOOL OF COMPUTING AND INFORMATICS - DEPARTMENT OF COMPUTER SCIENCE
-- UNIT: DBIT 226 RESEARCH PROJECT
-- TOPIC: STEVE'S MASSAGE PARLOR WEB-BASED SYSTEM
-- STUDENT: TERENCE MWAAKI (BIT-0-8106-3/2025)
-- SUPERVISOR: MR AUSTIN WANJALA
-- MYSQL DATABASE SCHEMA DEFINITION (DDL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS steves_massage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE steves_massage_db;

-- 1. SUPPLIERS TABLE (Declared first so users & purchase_orders can reference it)
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    supplied_items TEXT NOT NULL,
    payment_terms VARCHAR(100) DEFAULT '30 Days Invoice',
    rating DECIMAL(3,2) DEFAULT 4.80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS TABLE (Admin, Finance, Inventory, Services, Therapists, Suppliers, Customers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'therapist', 'customer', 'finance_manager', 'inventory_manager', 'service_manager', 'supplier') NOT NULL DEFAULT 'customer',
    gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    supplier_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. THERAPISTS TABLE
CREATE TABLE IF NOT EXISTS therapists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(120) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    bio TEXT,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 4.90,
    experience_years INT DEFAULT 3,
    active TINYINT(1) DEFAULT 1,
    working_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
    working_hours VARCHAR(100) DEFAULT '09:00 - 18:00',
    avatar VARCHAR(255) DEFAULT 'assets/default_avatar.png',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. SERVICE CATEGORIES
CREATE TABLE IF NOT EXISTS service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-spa'
) ENGINE=InnoDB;

-- 5. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    duration_mins INT NOT NULL,
    price_kes DECIMAL(10,2) NOT NULL,
    benefits TEXT,
    image_url VARCHAR(255),
    active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    therapist_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    duration_mins INT NOT NULL,
    total_price_kes DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'In-Session', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
    notes TEXT,
    treatment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. PAYMENTS TABLE (M-Pesa, Card, Cash in KES)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount_kes DECIMAL(10,2) NOT NULL,
    payment_method ENUM('M-Pesa', 'Credit/Debit Card', 'Cash') NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(30),
    status ENUM('Pending', 'Completed', 'Refunded') NOT NULL DEFAULT 'Completed',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. REVIEWS & FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NULL,
    customer_id INT NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    therapist_id INT NULL,
    service_name VARCHAR(150),
    rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    min_threshold INT NOT NULL DEFAULT 5,
    cost_per_unit_kes DECIMAL(10,2) NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Store / Cabinet A',
    last_restocked DATE
) ENGINE=InnoDB;

-- 10. PURCHASE ORDERS TABLE (Full Finance & Supplier Approval Workflow)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    item_id INT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_cost_kes DECIMAL(10,2) DEFAULT 0.00,
    total_cost_kes DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL,
    delivery_option VARCHAR(100) DEFAULT 'Standard Courier',
    delivery_address TEXT,
    finance_status ENUM('Pending Approval', 'Approved', 'Rejected') DEFAULT 'Pending Approval',
    finance_feedback TEXT,
    finance_reviewed_at DATETIME NULL,
    finance_reviewed_by INT NULL,
    status ENUM('Pending Approval', 'Approved', 'Acknowledged', 'In-Transit', 'Delivered', 'Received', 'Rejected', 'Cancelled') DEFAULT 'Pending Approval',
    grn_number VARCHAR(50) NULL,
    received_date DATE NULL,
    received_by VARCHAR(120) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
    FOREIGN KEY (finance_reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. STOCK MOVEMENTS AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NULL,
    item_name VARCHAR(150) NOT NULL,
    movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100) NULL,
    recorded_by VARCHAR(100) DEFAULT 'Inventory Manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. FINANCE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS finance_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('Income', 'Expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount_kes DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    reference_no VARCHAR(100),
    po_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    allocated_kes DECIMAL(10,2) NOT NULL,
    spent_kes DECIMAL(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB;

-- 14. INQUIRIES & CONTACT US TABLE
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('New', 'Replied', 'Archived') DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 15. NOTIFICATIONS TABLE (SMS / Email / Role Alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    role_target VARCHAR(50) NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    channel ENUM('SMS', 'Email', 'In-App') DEFAULT 'In-App',
    recipient_phone VARCHAR(30),
    recipient_email VARCHAR(150),
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
