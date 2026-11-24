-- ============================================================
-- STEVE'S MASSAGE PARLOUR WEB-BASED MANAGEMENT SYSTEM
-- DBIT 226 RESEARCH PROJECT - KENYA METHODIST UNIVERSITY
-- STUDENT: TERENCE MWAAKI (BIT-0-8106-3/2025)
-- MYSQL DATABASE SCHEMA & DEMO SEED DATA
-- ============================================================

CREATE DATABASE IF NOT EXISTS steve_massage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE steve_massage;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS feedback, notifications, finance_transactions, inventory_transactions, purchase_orders, inventory, suppliers, inquiries, payments, appointment_services, appointments, schedules, therapists, services, users;
SET FOREIGN_KEY_CHECKS=1;

-- 1. SUPPLIERS TABLE
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    payment_terms VARCHAR(100) DEFAULT '30 Days Invoice',
    rating DECIMAL(3,2) DEFAULT 4.80,
    bank_name VARCHAR(100) DEFAULT NULL,
    bank_account VARCHAR(50) DEFAULT NULL,
    mpesa_paybill VARCHAR(20) DEFAULT NULL,
    mpesa_till VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS TABLE
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','customer','therapist','inventory_manager','supplier','finance_officer') NOT NULL DEFAULT 'customer',
    supplier_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. THERAPISTS TABLE
CREATE TABLE therapists (
    therapist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    availability VARCHAR(100) DEFAULT 'Mon - Sat: 09:00 - 18:00',
    experience_years INT DEFAULT 5,
    rating DECIMAL(3,2) DEFAULT 4.90,
    status ENUM('available','unavailable') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_therapist_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. SERVICES TABLE
CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'Full Body Therapeutic',
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INT NOT NULL,
    benefits TEXT,
    status ENUM('available','unavailable') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. SCHEDULES TABLE
CREATE TABLE schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    therapist_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('available','booked','unavailable') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. APPOINTMENTS TABLE
CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    reference_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    therapist_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending','confirmed','in_session','completed','cancelled') DEFAULT 'confirmed',
    notes TEXT,
    treatment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. PAYMENTS TABLE
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','mpesa','card') NOT NULL DEFAULT 'mpesa',
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    payment_status ENUM('pending','completed','failed','refunded','disputed') NOT NULL DEFAULT 'completed',
    finance_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
    finance_reviewed_by VARCHAR(100) DEFAULT 'Patrick Mutua (Finance Officer)',
    finance_reviewed_at DATETIME,
    finance_notes TEXT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. INVENTORY ITEMS TABLE
CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'Pieces',
    min_threshold INT NOT NULL DEFAULT 5,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    supplier_id INT NULL,
    supplier_name VARCHAR(150),
    status ENUM('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. PURCHASE ORDERS TABLE (PO Approval & Delivery Workflow)
CREATE TABLE purchase_orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    inventory_id INT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL,
    delivery_option VARCHAR(100) DEFAULT 'Standard Courier (Nairobi Express Delivery - 24 to 48 Hours)',
    delivery_address TEXT,
    finance_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    finance_feedback TEXT,
    finance_reviewed_at DATETIME NULL,
    order_status ENUM('pending_approval','approved','acknowledged','in_transit','delivered','received','rejected') DEFAULT 'pending_approval',
    grn_number VARCHAR(50) NULL,
    received_date DATE NULL,
    received_by VARCHAR(100) NULL,
    payment_status ENUM('unpaid','paid') DEFAULT 'unpaid',
    payment_receipt_no VARCHAR(50) NULL,
    payment_date DATE NULL,
    payment_method VARCHAR(50) NULL,
    payment_reference VARCHAR(100) NULL,
    paid_by VARCHAR(100) NULL,
    payment_notes TEXT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    CONSTRAINT fk_po_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. INVENTORY TRANSACTIONS / AUDIT LOG
CREATE TABLE inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    user_id INT NULL,
    transaction_type ENUM('stock_in','stock_out','adjustment') NOT NULL,
    quantity INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference VARCHAR(100),
    reason TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_it_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. FINANCE TRANSACTIONS TABLE
CREATE TABLE finance_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('income','expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    reference_no VARCHAR(100),
    po_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ft_po FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. SUPPLIER PAYMENTS TABLE (After Goods Received)
CREATE TABLE IF NOT EXISTS supplier_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_receipt_no VARCHAR(50) NOT NULL UNIQUE,
    po_id INT NOT NULL,
    supplier_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    paid_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sp_po FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    role_target VARCHAR(50) NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. INQUIRIES TABLE
CREATE TABLE inquiries (
    inquiry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    target_email VARCHAR(100) DEFAULT 'admin@stevesmassage.co.ke',
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    admin_reply TEXT,
    replied_by INT,
    replied_at DATETIME,
    status ENUM('new','read','in_progress','resolved','replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 14. FEEDBACK & REVIEWS TABLE
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- SEED DATA: SUPPLIERS
-- ============================================================
INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, payment_terms, rating, bank_name, bank_account, mpesa_paybill, mpesa_till) VALUES
(1, 'Nairobi Herbal & Spa Supplies Ltd', 'Jared Momanyi', '0711889900', 'supplier@spasupplies.co.ke', 'Industrial Area, Commercial St, Nairobi', '30 Days Invoice', 4.90, 'Equity Bank Kenya', '0023456789', '247247', '5278441'),
(2, 'Kenya Linens & Textile Mills', 'Susan Wambui', '0722556677', 'sales@kenyalinens.co.ke', 'Thika Road Superhighway, Ruaraka', 'Net 15 Days', 4.80, 'KCB Bank Kenya', '1234567890', '522533', '5567823'),
(3, 'Afromed Wellness Equipment', 'Dr. Peter Karanja', '0733990011', 'info@afromedwellness.com', 'Upperhill Medical Plaza, Nairobi', '30 Days Invoice', 4.75, 'Co-operative Bank', '9876543210', '400200', '5891234');

-- ============================================================
-- SEED DATA: DEMONSTRATION USERS (All Roles)
-- Password Hashes generated with password_hash(PASSWORD_DEFAULT)
-- ============================================================
INSERT INTO users (user_id, full_name, email, phone, password, role, supplier_id) VALUES
-- Administrator (Admin@123)
(1, 'Steve Mwangi (Manager)', 'admin@stevesmassage.co.ke', '0712345678', '$2y$10$peyGjZIFzdLNm5iFmnFft.XkBaHnwfjLjWzo6przI6izWn/eJGPWC', 'admin', NULL),
-- Finance Officer (Finance@123)
(2, 'Patrick Mutua (Finance Officer)', 'finance@stevesmassage.co.ke', '0711334455', '$2y$10$xO1a6TKN3zBwzOrY5f/x6OA8R0kwKshgld498c0q10fCDra07L0o6', 'finance_officer', NULL),
-- Inventory Manager (Inventory@123)
(3, 'Mercy Chebet (Inventory Manager)', 'inventory@stevesmassage.co.ke', '0722445566', '$2y$10$avygdjFpIjywZE4j5v9lD.rmBta20MWXNyM7hEncnkmUDaojyq5oa', 'inventory_manager', NULL),
-- Therapists (Grace@123, David@123, Amina@123, Brian@123)
(4, 'Grace Muthoni', 'grace@stevesmassage.co.ke', '0722112233', '$2y$10$MQVVEkyouI5I0f.VdalJE.dVn6fLnZCfJnRU846WZYAUSpBrmEm2K', 'therapist', NULL),
(5, 'David Otieno', 'david@stevesmassage.co.ke', '0733445566', '$2y$10$qCgccx5JUZvlnXmKWPjOQOoYgPvqynSGGJgOZgU2VHPGObmA/FLlW', 'therapist', NULL),
(6, 'Amina Hassan', 'amina@stevesmassage.co.ke', '0708778899', '$2y$10$mRgsPpkKNHPZ6vyn0uD5xez0N.qB3kZB5.V5bj7knznLjJf6yRMQq', 'therapist', NULL),
(7, 'Brian Kiprop', 'brian@stevesmassage.co.ke', '0715667788', '$2y$10$jwi.WDqk8TBO/WYNlk/Rr.GEBzy2BBCYKMEp8bLrN3SC8GlYClNby', 'therapist', NULL),
-- Suppliers (Supplier@123)
(8, 'Jared Momanyi (Nairobi Herbal)', 'supplier@spasupplies.co.ke', '0711889900', '$2y$10$Kx4AnQb03EzqBmfsWa/DMOvpODxSxm.SrLBDXrkaxXVNg36cgLknS', 'supplier', 1),
(9, 'Susan Wambui (Kenya Linens)', 'sales@kenyalinens.co.ke', '0722556677', '$2y$10$Kx4AnQb03EzqBmfsWa/DMOvpODxSxm.SrLBDXrkaxXVNg36cgLknS', 'supplier', 2),
-- Customers (Client@123)
(10, 'Terence Mwaaki', 'terence@example.com', '0790123456', '$2y$10$Hp7Y7.DqFBOziWXkMky5xeYbt2xgrDJTW5s1uElWboaHoOvNDyXlG', 'customer', NULL),
(11, 'Faith Wanjiku', 'faith@example.com', '0720987654', '$2y$10$Hp7Y7.DqFBOziWXkMky5xeYbt2xgrDJTW5s1uElWboaHoOvNDyXlG', 'customer', NULL);

-- ============================================================
-- SEED DATA: THERAPISTS PROFILE
-- ============================================================
INSERT INTO therapists (therapist_id, user_id, specialization, availability, experience_years, rating, status) VALUES
(1, 4, 'Deep Tissue & Swedish Therapy', 'Mon - Sat: 09:00 - 18:00', 6, 4.95, 'available'),
(2, 5, 'Sports Massage & Trigger Point', 'Tue - Sun: 10:00 - 19:00', 5, 4.88, 'available'),
(3, 6, 'Aromatherapy & Hot Stone Therapy', 'Mon - Fri: 09:00 - 17:00', 7, 4.98, 'available'),
(4, 7, 'Reflexology & Holistic Relaxation', 'Wed - Mon: 11:00 - 20:00', 4, 4.85, 'available');

-- ============================================================
-- SEED DATA: SERVICES
-- ============================================================
INSERT INTO services (service_id, service_name, category, description, price, duration, benefits, status) VALUES
(1, 'Signature Deep Tissue Massage', 'Full Body Therapeutic', 'Intense firm pressure targeting the deepest layers of muscle tissue, tendons, and fascia to alleviate chronic tightness.', 3500.00, 60, 'Relieves lower back pain; Breaks scar tissue; Enhances mobility', 'available'),
(2, 'Swedish Gentle Relaxation Massage', 'Full Body Therapeutic', 'Classic European rhythmic gliding strokes to melt away tension, boost circulation, and calm nerves.', 3000.00, 60, 'Decreases stress cortisol; Promotes restful sleep; Improves blood circulation', 'available'),
(3, 'Athletic Sports Recovery Therapy', 'Targeted Recovery', 'Dynamic therapy incorporating assisted stretching, myofascial release, and friction work to expedite muscle recovery.', 4000.00, 60, 'Flushes lactic acid; Improves flexibility; Reduces post-workout soreness', 'available'),
(4, 'Volcanic Basalt Hot Stone Therapy', 'Holistic Wellness', 'Heated volcanic basalt stones placed along energy meridian points paired with warm essential oils.', 4500.00, 75, 'Deep muscle relaxation; Soothes nervous system; Stimulates healing', 'available'),
(5, 'Organic Herbal Aromatherapy', 'Sensory Wellness', 'Custom blend of therapeutic cold-pressed essential oils formulated to balance emotional and physical well-being.', 3800.00, 60, 'Eases tension headaches; Uplifts mood; Hydrates skin naturally', 'available'),
(6, 'Ancient Chinese Foot Reflexology', 'Express Relief', 'Focused acupressure stimulation on foot meridian zones corresponding to bodily organ systems.', 2200.00, 45, 'Stimulates vitality; Relieves tired feet; Promotes homeostasis', 'available');

-- ============================================================
-- SEED DATA: INVENTORY ITEMS
-- ============================================================
INSERT INTO inventory (inventory_id, sku, item_name, category, description, quantity, unit, min_threshold, unit_price, supplier_id, supplier_name, status) VALUES
(1, 'OIL-LAV-500', 'Organic Cold-Pressed Lavender Oil (500ml)', 'Massage Oils', 'Pure therapeutic grade lavender essential oil', 25, 'Bottles', 5, 1200.00, 1, 'Nairobi Herbal & Spa Supplies Ltd', 'in_stock'),
(2, 'OIL-ALM-5L', 'Pure Sweet Almond Base Carrier Oil (5L)', 'Carrier Oils', 'Cold pressed almond moisturizing carrier oil', 8, 'Jerricans', 3, 4500.00, 1, 'Nairobi Herbal & Spa Supplies Ltd', 'in_stock'),
(3, 'LIN-EGY-TOW', 'Egyptian Cotton Bath Sheets & Towels', 'Linens', 'Extra-large plush white spa bath sheets (700 GSM)', 45, 'Pieces', 15, 950.00, 2, 'Kenya Linens & Textile Mills', 'in_stock'),
(4, 'SAN-DSP-HDR', 'Disposable Headrest Sanitization Rolls', 'Sanitation', 'Hygienic perforated medical-grade paper rolls', 4, 'Rolls', 6, 450.00, 1, 'Nairobi Herbal & Spa Supplies Ltd', 'low_stock'),
(5, 'EQP-STN-36', 'Basalt Volcanic Massage Stones Set (36 Pcs)', 'Equipment', 'Hand-crafted smooth volcanic stones set', 5, 'Sets', 2, 8500.00, 3, 'Afromed Wellness Equipment', 'in_stock'),
(6, 'SAN-SPR-5L', 'Hospital-Grade Bed Sanitizing Spray (5L)', 'Sanitation', 'Anti-microbial surface sanitizing fluid', 7, 'Canisters', 3, 1600.00, 1, 'Nairobi Herbal & Spa Supplies Ltd', 'in_stock');

-- ============================================================
-- SEED DATA: PURCHASE ORDERS (Workflow Demonstrated)
-- ============================================================
INSERT INTO purchase_orders (po_id, po_number, supplier_id, inventory_id, item_name, quantity, unit_price, total_cost, order_date, delivery_option, delivery_address, finance_status, finance_feedback, finance_reviewed_at, order_status, grn_number, received_date, received_by, payment_status, payment_receipt_no, payment_date, payment_method, payment_reference, paid_by, payment_notes, notes) VALUES
(1, 'PO-2026-1001', 1, 2, 'Pure Sweet Almond Base Carrier Oil (5L)', 4, 4500.00, 18000.00, '2026-10-19', 'Standard Courier (Nairobi Express Delivery)', 'Steve''s Massage Parlour, Valley Arcade, Gitanga Rd, Nairobi', 'approved', 'Budget authorized from Spa Consumables allocation.', '2026-10-19 14:00:00', 'received', 'GRN-2026-1001', '2026-10-21', 'Mercy Chebet (Inventory Manager)', 'paid', 'SPR-2026-1001', '2026-10-22', 'M-Pesa Business Till', 'MPESA-QRT8921B', 'Patrick Mutua (Finance Officer)', 'Full settlement for carrier oils', 'Restock carrier base oils'),
(2, 'PO-2026-1002', 2, 3, 'Egyptian Cotton Bath Sheets & Towels', 20, 950.00, 19000.00, '2026-10-25', 'Direct Dispatch (Supplier Fleet Vehicle)', 'Steve''s Massage Parlour, Valley Arcade, Gitanga Rd, Nairobi', 'approved', 'Approved for linen inventory replenishment.', '2026-10-25 10:00:00', 'received', 'GRN-2026-1002', '2026-10-27', 'Mercy Chebet (Inventory Manager)', 'unpaid', NULL, NULL, NULL, NULL, NULL, NULL, 'Linen closet replenishment'),
(3, 'PO-2026-1003', 1, 4, 'Disposable Headrest Sanitization Rolls', 10, 450.00, 4500.00, CURDATE(), 'Expedited Van (Same-Day Urgent Delivery)', 'Steve''s Massage Parlour, Valley Arcade, Gitanga Rd, Nairobi', 'pending', NULL, NULL, 'pending_approval', NULL, NULL, NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, NULL, 'Urgent low stock reorder request awaiting finance approval');

-- ============================================================
-- SEED DATA: SUPPLIER PAYMENTS (After Goods Receipt)
-- ============================================================
INSERT INTO supplier_payments (payment_id, payment_receipt_no, po_id, supplier_id, amount_paid, payment_method, reference_no, payment_date, paid_by, notes) VALUES
(1, 'SPR-2026-1001', 1, 1, 18000.00, 'M-Pesa Business Till', 'MPESA-QRT8921B', '2026-10-22', 'Patrick Mutua (Finance Officer)', 'Full settlement for carrier oils');

-- ============================================================
-- SEED DATA: APPOINTMENTS
-- ============================================================
INSERT INTO appointments (appointment_id, reference_no, customer_id, therapist_id, service_id, appointment_date, appointment_time, total_price, status, notes, treatment_notes) VALUES
(1, 'SMP-2026-0001', 10, 1, 1, CURDATE(), '10:00', 3500.00, 'confirmed', 'Desk worker posture relief; focus on upper back and shoulders.', NULL),
(2, 'SMP-2026-0002', 11, 3, 4, CURDATE(), '14:30', 4500.00, 'confirmed', 'Prefers medium heat on basalt stones.', NULL);

-- ============================================================
-- SEED DATA: PAYMENTS
-- ============================================================
INSERT INTO payments (payment_id, appointment_id, customer_id, amount, payment_method, transaction_ref, phone_number, payment_status) VALUES
(1, 1, 10, 3500.00, 'mpesa', 'MPESA-QHK76TR49X', '0790123456', 'completed'),
(2, 2, 11, 4500.00, 'mpesa', 'MPESA-QHK889KL12', '0720987654', 'completed');

-- ============================================================
-- SEED DATA: FINANCE TRANSACTIONS
-- ============================================================
INSERT INTO finance_transactions (transaction_id, type, category, description, amount, transaction_date, reference_no, po_id) VALUES
(1, 'income', 'Service Revenue', 'Appointment SMP-2026-0001 (Signature Deep Tissue)', 3500.00, CURDATE(), 'MPESA-QHK76TR49X', NULL),
(2, 'income', 'Service Revenue', 'Appointment SMP-2026-0002 (Volcanic Hot Stone)', 4500.00, CURDATE(), 'MPESA-QHK889KL12', NULL),
(3, 'expense', 'Supplies Restock', 'PO-2026-1001: Pure Sweet Almond Base Carrier Oil x4', 18000.00, '2026-10-21', 'GRN-2026-1001', 1),
(4, 'expense', 'Supplies Restock', 'PO-2026-1002: Egyptian Cotton Bath Sheets x20', 19000.00, '2026-10-27', 'GRN-2026-1002', 2);

-- ============================================================
-- SEED DATA: NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (notification_id, user_id, role_target, title, message) VALUES
(1, NULL, 'finance_officer', 'New Purchase Order Approval Required', 'PO-2026-1003 for Disposable Headrest Sanitization Rolls (KES 4,500) requires your authorization.'),
(2, 8, 'supplier', 'PO Dispatched for Fulfillment', 'PO-2026-1001 has been approved and confirmed received. GRN: GRN-2026-1001.'),
(3, 10, 'customer', 'Appointment Confirmed', 'Your Signature Deep Tissue Massage with Grace Muthoni has been confirmed. Ref: SMP-2026-0001.');
