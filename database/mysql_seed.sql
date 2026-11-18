-- ============================================================
-- KENYA METHODIST UNIVERSITY
-- SCHOOL OF COMPUTING AND INFORMATICS - DEPARTMENT OF COMPUTER SCIENCE
-- UNIT: DBIT 226 RESEARCH PROJECT
-- TOPIC: STEVE'S MASSAGE PARLOR WEB-BASED SYSTEM
-- STUDENT: TERENCE MWAAKI (BIT-0-8106-3/2025)
-- SUPERVISOR: MR AUSTIN WANJALA
-- MYSQL DATABASE INITIAL SEED DATA
-- ============================================================

USE steves_massage_db;

-- Disable FK checks temporarily for bulk insert
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
TRUNCATE TABLE notifications;
TRUNCATE TABLE inquiries;
TRUNCATE TABLE budgets;
TRUNCATE TABLE finance_transactions;
TRUNCATE TABLE stock_movements;
TRUNCATE TABLE purchase_orders;
TRUNCATE TABLE inventory_items;
TRUNCATE TABLE reviews;
TRUNCATE TABLE payments;
TRUNCATE TABLE appointments;
TRUNCATE TABLE services;
TRUNCATE TABLE service_categories;
TRUNCATE TABLE therapists;
TRUNCATE TABLE users;
TRUNCATE TABLE suppliers;

-- 1. SUPPLIERS
INSERT INTO suppliers (id, name, contact_person, phone, email, address, supplied_items, payment_terms, rating) VALUES
(1, 'Nairobi Herbal & Spa Supplies Ltd', 'Jared Momanyi', '0711889900', 'orders@nairobiherbals.co.ke', 'Industrial Area, Commercial St, Nairobi', 'Organic Carrier Oils, Essential Oils, Diffusers', '30 Days Invoice', 4.90),
(2, 'Kenya Linens & Textile Mills', 'Susan Wambui', '0722556677', 'sales@kenyalinens.co.ke', 'Thika Road Superhighway, Ruaraka', 'Luxury Towels, Bathrobes, Bed Linens, Headrest Covers', 'Net 15 Days', 4.80),
(3, 'Afromed Wellness Equipment', 'Dr. Peter Karanja', '0733990011', 'info@afromedwellness.com', 'Upperhill Medical Plaza, Nairobi', 'Massage Tables, Hot Stone Heaters, Anatomical Models', '30 Days Invoice', 4.75);

-- 2. USERS (Admin, Managers, Therapists, Suppliers, Customers)
-- Password Hashes generated with sha256(password + 'steves_spa_salt_2026')
INSERT INTO users (id, name, email, phone, password_hash, role, gender, supplier_id) VALUES
(1,  'Steve Mwangi (Manager)',                 'admin@stevesmassage.co.ke',    '0712345678', 'cd3798b5a1c62f14a247a871b83e18150dd71eb997d9f0588ff8bee3f621bd98', 'admin',             'Male',   NULL),
(2,  'Patrick Mutua (Finance Director)',       'finance@stevesmassage.co.ke',  '0711334455', '43e530c974d2aa1016653714571377ce945f6de1c40a429c8f17d3885198659c', 'finance_manager',   'Male',   NULL),
(3,  'Mercy Chebet (Inventory Controller)',    'inventory@stevesmassage.co.ke','0722445566', '062c597d161f0485c24811facc55372d262f24aaefd6e6d52a21342a4fa13add', 'inventory_manager', 'Female', NULL),
(4,  'Lucas Ochieng (Spa Services Manager)',   'services@stevesmassage.co.ke', '0733556677', '37f2d2b776cf9fa7251b0d53ac8515218d4f10615a7ffcb5292f624d910e2bdb', 'service_manager',   'Male',   NULL),
(5,  'Grace Muthoni',                          'grace@stevesmassage.co.ke',    '0722112233', '786c057848ce30ed2c2ccc650dce3d46152a7a8316fcbe9d0935d403c4cf58b2', 'therapist',         'Female', NULL),
(6,  'David Otieno',                           'david@stevesmassage.co.ke',    '0733445566', '49990805faf9fb5c547c91c948567ca018d061c2d76775b2921c41ea900e43f6', 'therapist',         'Male',   NULL),
(7,  'Amina Hassan',                           'amina@stevesmassage.co.ke',    '0708778899', 'f852686971c2995bdb2fe0d5e99e455a2df938b3df31300d8948f165937312c4', 'therapist',         'Female', NULL),
(8,  'Brian Kiprop',                           'brian@stevesmassage.co.ke',    '0715667788', '23f5e82a9265b02c25414db6e4f172a4fca0110a69555806f0f1e5b12f498ea8', 'therapist',         'Male',   NULL),
(9,  'Jared Momanyi (Nairobi Herbal)',         'supplier@spasupplies.co.ke',   '0711889900', '1bd59a594f67c6e5a71d0e57f333baa5f5cf1cff31ef8cd54c4f48485dc24ae6', 'supplier',          'Male',   1),
(10, 'Susan Wambui (Kenya Linens)',            'sales@kenyalinens.co.ke',      '0722556677', '1bd59a594f67c6e5a71d0e57f333baa5f5cf1cff31ef8cd54c4f48485dc24ae6', 'supplier',          'Female', 2),
(11, 'Terence Mwaaki',                         'terence@example.com',          '0790123456', 'f53efe559597af8be348718793b0c94ef3f384a15dbe7544eee3d3ea8fa1b89c', 'customer',          'Male',   NULL),
(12, 'Faith Wanjiku',                          'faith@example.com',            '0720987654', 'f53efe559597af8be348718793b0c94ef3f384a15dbe7544eee3d3ea8fa1b89c', 'customer',          'Female', NULL),
(13, 'Kevin Omondi',                           'kevin@example.com',            '0731223344', 'f53efe559597af8be348718793b0c94ef3f384a15dbe7544eee3d3ea8fa1b89c', 'customer',          'Male',   NULL);

-- 3. THERAPISTS
INSERT INTO therapists (id, user_id, name, specialization, bio, phone, email, rating, experience_years, active, working_days, working_hours, avatar) VALUES
(1, 5, 'Grace Muthoni', 'Deep Tissue & Swedish Therapy', 'Certified wellness therapist with 6 years experience in chronic muscle tension release and deep tissue rehabilitation.', '0722112233', 'grace@stevesmassage.co.ke', 4.95, 6, 1, 'Mon,Tue,Wed,Thu,Fri,Sat', '09:00 - 18:00', 'assets/therapist_grace.png'),
(2, 6, 'David Otieno', 'Sports Massage & Trigger Point', 'Sports recovery specialist focused on athletic conditioning, joint mobility, and targeted trigger point relief.', '0733445566', 'david@stevesmassage.co.ke', 4.88, 5, 1, 'Tue,Wed,Thu,Fri,Sat,Sun', '10:00 - 19:00', 'assets/therapist_david.png'),
(3, 7, 'Amina Hassan', 'Aromatherapy & Hot Stone Therapy', 'Master aromatherapist specializing in organic herbal essential oil infusions and volcanic basalt hot stone treatments.', '0708778899', 'amina@stevesmassage.co.ke', 4.98, 7, 1, 'Mon,Wed,Thu,Fri,Sat', '09:00 - 17:00', 'assets/therapist_amina.png'),
(4, 8, 'Brian Kiprop', 'Reflexology & Holistic Relaxation', 'Expert in foot & hand reflexology and stress management techniques, helping clients restore natural energy balance.', '0715667788', 'brian@stevesmassage.co.ke', 4.85, 4, 1, 'Mon,Tue,Thu,Fri,Sat,Sun', '11:00 - 20:00', 'assets/therapist_brian.png');

-- 4. SERVICE CATEGORIES
INSERT INTO service_categories (id, name, description, icon) VALUES
(1, 'Full Body Therapeutic', 'Comprehensive full-body muscle rejuvenation and stress elimination treatments.', 'fa-spa'),
(2, 'Targeted & Sports Recovery', 'Focused therapy on specific problem zones, injury recovery, and athletic performance.', 'fa-running'),
(3, 'Sensory & Holistic Wellness', 'Aromatic oils, heated volcanic stones, and deep holistic mental calm.', 'fa-fire-alt'),
(4, 'Express & Reflexology', 'Quick re-energizing sessions targeting acupressure points and stress centers.', 'fa-shoe-prints');

-- 5. SERVICES
INSERT INTO services (id, category_id, name, description, duration_mins, price_kes, benefits, image_url, active) VALUES
(1, 1, 'Signature Deep Tissue Massage', 'Intense firm pressure targeting the deepest layers of muscle tissue, tendons, and fascia to alleviate chronic tightness and postural pain.', 60, 3500.00, 'Relieves chronic lower back pain; Breaks down scar tissue; Enhances range of motion', 'assets/service_deeptissue.png', 1),
(2, 1, 'Swedish Gentle Relaxation Massage', 'Classic European technique featuring long gliding strokes, kneading, and rhythmic tapping to melt away tension and boost circulation.', 60, 3000.00, 'Decreases cortisol stress hormones; Enhances blood oxygenation; Promotes deep restful sleep', 'assets/service_swedish.png', 1),
(3, 1, 'Deluxe Full Body Ritual (90 Mins)', 'An extensive 90-minute treatment blending Swedish strokes, hot towels, and customized pressure for complete body bliss.', 90, 4800.00, 'Total physical detente; Rebalances entire nervous system; Deep lymphatic drainage', 'assets/service_deluxe.png', 1),
(4, 2, 'Athletic Sports Recovery Therapy', 'Dynamic therapy incorporating assisted stretching, myofascial release, and friction work to expedite recovery and prevent muscle injuries.', 60, 4000.00, 'Reduces lactic acid buildup; Improves athletic flexibility; Speeds up recovery time', 'assets/service_sports.png', 1),
(5, 2, 'Upper Back, Neck & Shoulder De-Stresser', 'Targeted ergonomic relief focused entirely on tension hotspots caused by computer desks and driving posture.', 45, 2500.00, 'Eliminates tension headaches; Frees stiff neck rotation; Relaxes shoulder knots', 'assets/service_neckback.png', 1),
(6, 3, 'Volcanic Basalt Hot Stone Therapy', 'Smooth, heated volcanic basalt stones placed along energy meridian points paired with warm oil massage to relax muscles effortlessly.', 75, 4500.00, 'Penetrates deep into tight muscles without pain; Induces meditative state; Improves circulation', 'assets/service_hotstone.png', 1),
(7, 3, 'Organic Herbal Aromatherapy', 'Custom blend of cold-pressed lavender, eucalyptus, and ylang-ylang therapeutic essential oils tailored to soothe your emotional and physical state.', 60, 3800.00, 'Alleviates anxiety; Clears respiratory pathways; Hydrates dry skin with botanical nutrients', 'assets/service_aroma.png', 1),
(8, 4, 'Ancient Chinese Foot Reflexology', 'Focused acupressure stimulation on the soles and pressure points of the feet, corresponding to internal organ systems.', 45, 2200.00, 'Stimulates internal vitality; Relieves tired aching feet; Promotes bodily homeostasis', 'assets/service_reflex.png', 1);

-- 6. APPOINTMENTS
INSERT INTO appointments (id, reference_no, customer_id, therapist_id, service_id, appointment_date, appointment_time, duration_mins, total_price_kes, status, notes, treatment_notes) VALUES
(1, 'SMP-2026-0001', 11, 1, 1, CURDATE() - INTERVAL 1 DAY, '10:00', 60, 3500.00, 'Completed', 'Desk worker, stiffness in upper shoulder and lumbar.', 'Applied deep friction to rhomboids and piriformis. Recommended daily hamstring stretches.'),
(2, 'SMP-2026-0002', 12, 3, 6, CURDATE() - INTERVAL 1 DAY, '14:30', 75, 4500.00, 'Completed', 'Requested medium-high heat on basalt stones.', 'Therapy successful. Client noted instant relief in lower back.'),
(3, 'SMP-2026-0003', 13, 2, 4, CURDATE(), '11:00', 60, 4000.00, 'In-Session', 'Preparing for Nairobi City Marathon training.', 'Focus on calves, IT bands, and gluteus medius.'),
(4, 'SMP-2026-0004', 11, 4, 8, CURDATE(), '16:00', 45, 2200.00, 'Confirmed', 'First time reflexology session.', NULL),
(5, 'SMP-2026-0005', 12, 1, 2, CURDATE() + INTERVAL 1 DAY, '11:30', 60, 3000.00, 'Confirmed', 'Prefer calming lavender scent and quiet ambience.', NULL);

-- 7. PAYMENTS (M-Pesa, Card, Cash)
INSERT INTO payments (id, appointment_id, customer_id, amount_kes, payment_method, transaction_ref, phone_number, status) VALUES
(1, 1, 11, 3500.00, 'M-Pesa', 'QHK76TR49X', '0790123456', 'Completed'),
(2, 2, 12, 4500.00, 'M-Pesa', 'QHK889KL12', '0720987654', 'Completed'),
(3, 3, 13, 4000.00, 'Credit/Debit Card', 'CARD-8849-01', '0731223344', 'Completed'),
(4, 4, 11, 2200.00, 'M-Pesa', 'QHL120MN34', '0790123456', 'Completed'),
(5, 5, 12, 3000.00, 'Cash', 'CASH-REC-005', '0720987654', 'Pending');

-- 8. REVIEWS & FEEDBACK
INSERT INTO reviews (id, appointment_id, customer_id, customer_name, therapist_id, service_name, rating, comment) VALUES
(1, 1, 11, 'Terence Mwaaki', 1, 'Signature Deep Tissue Massage', 5, 'Grace is exceptional! My shoulder stiffness had bothered me for weeks and she pinpointed the knot immediately. Clean, calm parlor!'),
(2, 2, 12, 'Faith Wanjiku', 3, 'Volcanic Basalt Hot Stone Therapy', 5, 'Amina has magic hands. The hot stones paired with aromatherapy put me to sleep in minutes. Booking my next appointment already!');

-- 9. INVENTORY ITEMS (with SKU and Room Location)
INSERT INTO inventory_items (id, sku, name, category, quantity, unit, min_threshold, cost_per_unit_kes, location, last_restocked) VALUES
(1, 'OIL-LAV-500', 'Organic Cold-Pressed Lavender Oil (500ml)', 'Massage Oils', 18, 'Bottles', 5, 1200.00, 'Main Store / Cabinet A', '2026-10-25'),
(2, 'OIL-ALM-5L', 'Pure Sweet Almond Base Oil (5L)', 'Carrier Oils', 6, 'Jerricans', 3, 4500.00, 'Main Store / Cabinet B', '2026-10-20'),
(3, 'OIL-EUC-100', 'Eucalyptus Radiata Essential Oil (100ml)', 'Aromatherapy', 12, 'Bottles', 4, 850.00, 'Aromatherapy Cabinet', '2026-10-28'),
(4, 'EQP-STN-36', 'Basalt Volcanic Stones Set (36 Pcs)', 'Equipment', 4, 'Sets', 2, 8500.00, 'Treatment Room 1', '2026-09-15'),
(5, 'LIN-EGY-TOW', 'Egyptian Cotton Bath Sheets & Towels', 'Linens', 45, 'Pieces', 20, 950.00, 'Linen Closet', '2026-10-10'),
(6, 'SAN-DSP-HDR', 'Disposable Headrest Paper Rolls', 'Sanitation', 3, 'Rolls', 5, 450.00, 'Sanitation Shelf', '2026-10-02'),
(7, 'SAN-SPR-5L', 'Hospital-Grade Bed Sanitizing Spray (5L)', 'Sanitation', 8, 'Canisters', 3, 1600.00, 'Sanitation Shelf', '2026-10-18');

-- 10. PURCHASE ORDERS
INSERT INTO purchase_orders (id, po_number, supplier_id, item_id, item_name, quantity, unit_cost_kes, total_cost_kes, delivery_option, delivery_address, order_date, finance_status, status, grn_number, received_date, received_by, notes) VALUES
(1, 'PO-2026-1001', 1, 2, 'Pure Sweet Almond Base Oil (5L)', 4, 4500.00, 18000.00, 'Standard Courier (Nairobi Express Delivery)', 'Steve''s Massage Parlour, Valley Arcade, Nairobi', '2026-10-19', 'Approved', 'Received', 'GRN-2026-1001', '2026-10-21', 'Mercy Chebet', 'Urgently needed for aromatherapy sessions'),
(2, 'PO-2026-1002', 2, 5, 'Egyptian Cotton Bath Sheets & Towels', 25, 950.00, 23750.00, 'Direct Dispatch (Supplier Vehicle)', 'Steve''s Massage Parlour, Valley Arcade, Nairobi', '2026-10-08', 'Approved', 'Received', 'GRN-2026-1002', '2026-10-10', 'Mercy Chebet', 'Restock premium Egyptian bath sheets'),
(3, 'PO-2026-1003', 1, 6, 'Disposable Headrest Paper Rolls', 10, 450.00, 4500.00, 'Standard Courier (Nairobi Express Delivery)', 'Steve''s Massage Parlour, Valley Arcade, Nairobi', '2026-11-01', 'Pending Approval', 'Pending Approval', NULL, NULL, NULL, 'Low stock reorder request');

-- 11. STOCK MOVEMENTS AUDIT LOG
INSERT INTO stock_movements (id, item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, reason, reference_no, recorded_by) VALUES
(1, 2, 'Pure Sweet Almond Base Oil (5L)', 'IN', 4, 2, 6, 'Vendor Delivery received via PO-2026-1001', 'PO-2026-1001', 'Mercy Chebet'),
(2, 5, 'Egyptian Cotton Bath Sheets & Towels', 'IN', 25, 20, 45, 'Restock delivery via PO-2026-1002', 'PO-2026-1002', 'Mercy Chebet'),
(3, 1, 'Organic Cold-Pressed Lavender Oil (500ml)', 'OUT', 2, 20, 18, 'Dispensed for weekend aromatherapy and deep tissue sessions', 'DISP-2026-1029', 'Grace Muthoni'),
(4, 6, 'Disposable Headrest Paper Rolls', 'OUT', 3, 6, 3, 'High client volume in massage treatment rooms', 'DISP-2026-1102', 'David Otieno');

-- 12. FINANCE TRANSACTIONS
INSERT INTO finance_transactions (id, type, category, description, amount_kes, transaction_date, reference_no, po_id) VALUES
(1, 'Income', 'Service Revenue', 'Daily customer massage appointments receipts (M-Pesa/Card)', 14200.00, CURDATE() - INTERVAL 1 DAY, 'REV-2026-YEST', NULL),
(2, 'Income', 'Service Revenue', 'Morning massage appointments (SMP-0003 & SMP-0004)', 6200.00, CURDATE(), 'REV-2026-TODAY', NULL),
(3, 'Expense', 'Supplies Restock', 'PO-2026-1001: Pure Sweet Almond Base Oil x4 (Received)', 18000.00, '2026-10-21', 'PO-2026-1001', 1),
(4, 'Expense', 'Supplies Restock', 'PO-2026-1002: Egyptian Cotton Towels x25 (Received)', 23750.00, '2026-10-10', 'PO-2026-1002', 2),
(5, 'Expense', 'Utilities & Laundry', 'Industrial towel washing & electricity', 8500.00, '2026-10-31', 'EXP-UTIL-1031', NULL),
(6, 'Expense', 'Therapist Commission', 'Weekly professional therapist commission payout', 35000.00, '2026-10-31', 'EXP-COMM-1031', NULL);

-- 13. BUDGETS
INSERT INTO budgets (id, month, category, allocated_kes, spent_kes) VALUES
(1, '2026-11', 'Oils & Spa Consumables', 45000.00, 4500.00),
(2, '2026-11', 'Linen & Sanitation', 25000.00, 3200.00),
(3, '2026-11', 'Utilities & Marketing', 35000.00, 8500.00),
(4, '2026-11', 'Staff Commission & Training', 150000.00, 35000.00);

-- 14. INQUIRIES
INSERT INTO inquiries (id, name, email, phone, subject, message, status) VALUES
(1, 'Wanjiru Mwangi', 'wanjiru.m@gmail.com', '0710123456', 'Couple Massage Packages', 'Do you offer tandem couple massage rooms with customized aromatherapy on weekends?', 'New'),
(2, 'Captain George Omondi', 'captain.omondi@kenyaairways.com', '0722887766', 'Corporate Wellness Vouchers', 'We would like to purchase quarterly wellness massage gift vouchers for our cabin crew.', 'Replied');

-- 15. NOTIFICATIONS
INSERT INTO notifications (id, user_id, role_target, title, message, channel, recipient_phone, recipient_email) VALUES
(1, 11, NULL, 'Appointment Confirmed', 'Your Signature Deep Tissue Massage with Grace Muthoni has been confirmed for 10:00 AM.', 'SMS', '0790123456', 'terence@example.com'),
(2, 12, NULL, 'Payment Received', 'We received KES 4,500 via M-Pesa (Ref: QHK889KL12) for your Hot Stone Therapy session. Thank you!', 'SMS', '0720987654', 'faith@example.com'),
(3, 3,  NULL, 'Low Stock Alert', 'Inventory item "Disposable Headrest Paper Rolls" has reached 3 rolls (minimum threshold: 5).', 'In-App', '0712345678', 'admin@stevesmassage.co.ke'),
(4, NULL, 'finance_manager', 'PO Approval Required', 'Purchase Order PO-2026-1003 for Disposable Headrest Paper Rolls (KES 4,500) requires your approval.', 'In-App', NULL, 'finance@stevesmassage.co.ke'),
(5, 9,  NULL, 'New Purchase Order Received', 'You have a new purchase order PO-2026-1003 awaiting your acknowledgement.', 'In-App', NULL, 'supplier@spasupplies.co.ke');

SET FOREIGN_KEY_CHECKS = 1;
