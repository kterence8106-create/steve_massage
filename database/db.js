// Steve's Massage Parlor Management System - Database Layer
// Built with native node:sqlite (zero external dependency, high performance)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DB_FILE = path.join(__dirname, 'steves_massage.db');

// Simple secure password hashing using SHA-256 with salt
function hashPassword(password) {
  const salt = 'steves_spa_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function initDatabase() {
  // Delete and recreate the database to apply clean schema
  // (Only on first run; migration alters handle updates after)
  const db = new DatabaseSync(DB_FILE);

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // ============================================================
  // SCHEMA: Create all tables (IF NOT EXISTS for idempotency)
  // ============================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','therapist','customer','finance_manager','inventory_manager','service_manager','supplier')),
      gender TEXT,
      supplier_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS therapists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      bio TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      rating REAL DEFAULT 4.9,
      experience_years INTEGER DEFAULT 4,
      active INTEGER DEFAULT 1,
      working_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
      working_hours TEXT DEFAULT '09:00 - 18:00',
      avatar TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      price_kes REAL NOT NULL,
      benefits TEXT,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      FOREIGN KEY(category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      therapist_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      total_price_kes REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(status IN ('Pending','Confirmed','In-Session','Completed','Cancelled')),
      notes TEXT,
      treatment_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(therapist_id) REFERENCES therapists(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      amount_kes REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('M-Pesa','Credit/Debit Card','Cash')),
      transaction_ref TEXT NOT NULL UNIQUE,
      phone_number TEXT,
      status TEXT NOT NULL DEFAULT 'Completed' CHECK(status IN ('Pending','Completed','Refunded','Disputed')),
      finance_status TEXT NOT NULL DEFAULT 'Approved' CHECK(finance_status IN ('Pending','Approved','Rejected')),
      finance_reviewed_by TEXT,
      finance_reviewed_at DATETIME,
      finance_notes TEXT,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(appointment_id) REFERENCES appointments(id),
      FOREIGN KEY(customer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      therapist_id INTEGER,
      service_name TEXT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(appointment_id) REFERENCES appointments(id),
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(therapist_id) REFERENCES therapists(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      min_threshold INTEGER NOT NULL,
      cost_per_unit_kes REAL NOT NULL,
      location TEXT DEFAULT 'Main Store / Cabinet A',
      last_restocked TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      supplied_items TEXT NOT NULL,
      payment_terms TEXT DEFAULT '30 Days Invoice',
      rating REAL DEFAULT 4.8
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT NOT NULL UNIQUE,
      supplier_id INTEGER NOT NULL,
      item_id INTEGER,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost_kes REAL NOT NULL DEFAULT 0,
      total_cost_kes REAL NOT NULL,
      delivery_option TEXT DEFAULT 'Standard Courier (Nairobi Express Delivery)',
      delivery_address TEXT DEFAULT 'Steve''s Massage Parlour, Valley Arcade, Nairobi',
      order_date TEXT NOT NULL,
      finance_status TEXT NOT NULL DEFAULT 'Pending' CHECK(finance_status IN ('Pending','Approved','Rejected')),
      finance_feedback TEXT,
      finance_reviewed_at DATETIME,
      finance_reviewed_by TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Approval' CHECK(status IN ('Pending Approval','Approved','Acknowledged','In-Transit','Delivered','Received','Rejected','Cancelled')),
      grn_number TEXT,
      received_date DATETIME,
      received_by TEXT,
      notes TEXT,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      item_name TEXT NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('IN','OUT','ADJUSTMENT')),
      quantity INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_no TEXT,
      recorded_by TEXT DEFAULT 'Inventory Manager',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('Income','Expense')),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_kes REAL NOT NULL,
      transaction_date TEXT NOT NULL,
      reference_no TEXT,
      po_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      category TEXT NOT NULL,
      allocated_kes REAL NOT NULL,
      spent_kes REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      target_email TEXT DEFAULT 'admin@stevesmassage.co.ke',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Replied','Archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role_target TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'In-App' CHECK(channel IN ('SMS','Email','In-App')),
      recipient_phone TEXT,
      recipient_email TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ============================================================
  // SCHEMA MIGRATIONS: Add new columns if upgrading existing DB
  // ============================================================
  const migrations = [
    "ALTER TABLE users ADD COLUMN supplier_id INTEGER",
    "ALTER TABLE inventory_items ADD COLUMN sku TEXT",
    "ALTER TABLE inventory_items ADD COLUMN location TEXT DEFAULT 'Main Store / Cabinet A'",
    "ALTER TABLE suppliers ADD COLUMN payment_terms TEXT DEFAULT '30 Days Invoice'",
    "ALTER TABLE suppliers ADD COLUMN rating REAL DEFAULT 4.8",
    "ALTER TABLE purchase_orders ADD COLUMN item_id INTEGER",
    "ALTER TABLE purchase_orders ADD COLUMN unit_cost_kes REAL NOT NULL DEFAULT 0",
    "ALTER TABLE purchase_orders ADD COLUMN delivery_option TEXT DEFAULT 'Standard Courier (Nairobi Express Delivery)'",
    "ALTER TABLE purchase_orders ADD COLUMN delivery_address TEXT DEFAULT 'Steve''s Massage Parlour, Valley Arcade, Nairobi'",
    "ALTER TABLE purchase_orders ADD COLUMN finance_status TEXT NOT NULL DEFAULT 'Pending'",
    "ALTER TABLE purchase_orders ADD COLUMN finance_feedback TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN finance_reviewed_at DATETIME",
    "ALTER TABLE purchase_orders ADD COLUMN finance_reviewed_by TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN grn_number TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN received_date DATETIME",
    "ALTER TABLE purchase_orders ADD COLUMN received_by TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN notes TEXT",
    "ALTER TABLE finance_transactions ADD COLUMN po_id INTEGER",
    "ALTER TABLE notifications ADD COLUMN role_target TEXT",
    "ALTER TABLE notifications ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE purchase_orders ADD COLUMN payment_status TEXT DEFAULT 'Unpaid'",
    "ALTER TABLE purchase_orders ADD COLUMN payment_receipt_no TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN payment_date TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN payment_method TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN payment_reference TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN paid_by TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN payment_notes TEXT",
    "CREATE TABLE IF NOT EXISTS supplier_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, payment_receipt_no TEXT NOT NULL UNIQUE, po_id INTEGER NOT NULL, supplier_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_method TEXT NOT NULL, reference_no TEXT NOT NULL, payment_date TEXT NOT NULL, paid_by TEXT NOT NULL, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    "ALTER TABLE suppliers ADD COLUMN bank_name TEXT DEFAULT NULL",
    "ALTER TABLE suppliers ADD COLUMN bank_account TEXT DEFAULT NULL",
    "ALTER TABLE suppliers ADD COLUMN mpesa_paybill TEXT DEFAULT NULL",
    "ALTER TABLE suppliers ADD COLUMN mpesa_till TEXT DEFAULT NULL",
    "ALTER TABLE inquiries ADD COLUMN target_email TEXT DEFAULT 'admin@stevesmassage.co.ke'",
    "ALTER TABLE payments ADD COLUMN finance_status TEXT DEFAULT 'Approved'",
    "ALTER TABLE payments ADD COLUMN finance_reviewed_by TEXT DEFAULT 'Patrick Mutua (Finance Officer)'",
    "ALTER TABLE payments ADD COLUMN finance_reviewed_at DATETIME",
    "ALTER TABLE payments ADD COLUMN finance_notes TEXT"
  ];
  for (const m of migrations) {
    try { db.exec(m); } catch (_) {}
  }

  // Seed default supplier payment for PO-2026-1001 if unpaid
  try {
    const po1 = db.prepare("SELECT id, payment_status FROM purchase_orders WHERE po_number = 'PO-2026-1001'").get();
    if (po1 && (!po1.payment_status || po1.payment_status === 'Unpaid')) {
      db.prepare(`
        UPDATE purchase_orders SET 
          payment_status = 'Paid',
          payment_receipt_no = 'SPR-2026-1001',
          payment_date = '2026-10-22',
          payment_method = 'M-Pesa Business Till',
          payment_reference = 'MPESA-QRT8921B',
          paid_by = 'Patrick Mutua (Finance Officer)',
          payment_notes = 'Full settlement for Pure Sweet Almond Base Oil shipment'
        WHERE id = ?
      `).run(po1.id);

      db.prepare(`
        INSERT OR IGNORE INTO supplier_payments 
          (payment_receipt_no, po_id, supplier_id, amount_paid, payment_method, reference_no, payment_date, paid_by, notes)
        VALUES (?, ?, 1, 18000, 'M-Pesa Business Till', 'MPESA-QRT8921B', '2026-10-22', 'Patrick Mutua (Finance Officer)', 'Full settlement for Pure Sweet Almond Base Oil shipment')
      `).run('SPR-2026-1001', po1.id);
    }
  } catch (_) {}

  // Update SKUs for seeded items if missing
  try {
    db.exec(`
      UPDATE inventory_items SET sku = 'OIL-LAV-500' WHERE id = 1 AND (sku IS NULL OR sku = '');
      UPDATE inventory_items SET sku = 'OIL-ALM-5L'  WHERE id = 2 AND (sku IS NULL OR sku = '');
      UPDATE inventory_items SET sku = 'OIL-EUC-100' WHERE id = 3 AND (sku IS NULL OR sku = '');
      UPDATE inventory_items SET sku = 'EQP-STN-36'  WHERE id = 4 AND (sku IS NULL OR sku = '');
      UPDATE inventory_items SET sku = 'LIN-EGY-TOW' WHERE id = 5 AND (sku IS NULL OR sku = '');
      UPDATE inventory_items SET sku = 'SAN-DSP-HDR' WHERE id = 6 AND (sku IS NULL OR sku = '');
      UPDATE inventory_items SET sku = 'SAN-SPR-5L'  WHERE id = 7 AND (sku IS NULL OR sku = '');
    `);
  } catch (_) {}

  // Update supplier payment details for SQLite if missing
  try {
    db.prepare("UPDATE suppliers SET bank_name='Equity Bank Kenya', bank_account='0023456789', mpesa_paybill='247247', mpesa_till='5278441' WHERE id=1 AND (bank_name IS NULL OR bank_name='')").run();
    db.prepare("UPDATE suppliers SET bank_name='KCB Bank Kenya', bank_account='1234567890', mpesa_paybill='522533', mpesa_till='5567823' WHERE id=2 AND (bank_name IS NULL OR bank_name='')").run();
    db.prepare("UPDATE suppliers SET bank_name='Co-operative Bank', bank_account='9876543210', mpesa_paybill='400200', mpesa_till='5891234' WHERE id=3 AND (bank_name IS NULL OR bank_name='')").run();
  } catch (_) {}

  // Seed default stock movements if empty
  try {
    const movCount = db.prepare('SELECT COUNT(*) as cnt FROM stock_movements').get().cnt;
    if (movCount === 0) {
      const movStmt = db.prepare(`
        INSERT INTO stock_movements (item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, reason, reference_no, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      movStmt.run(2, 'Pure Sweet Almond Base Oil (5L)', 'IN', 4, 2, 6, 'Vendor Delivery received via PO-2026-1001', 'PO-2026-1001', 'Mercy Chebet');
      movStmt.run(5, 'Egyptian Cotton Bath Sheets & Towels', 'IN', 25, 20, 45, 'Restock delivery via PO-2026-1002', 'PO-2026-1002', 'Mercy Chebet');
      movStmt.run(1, 'Organic Cold-Pressed Lavender Oil (500ml)', 'OUT', 2, 20, 18, 'Dispensed for weekend aromatherapy and deep tissue sessions', 'DISP-2026-1029', 'Grace Muthoni');
      movStmt.run(6, 'Disposable Headrest Paper Rolls', 'OUT', 3, 6, 3, 'High client volume in massage treatment rooms', 'DISP-2026-1102', 'David Otieno');
    }
  } catch (_) {}

  // Seed default data if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    seedDatabase(db);
  } else {
    ensureDemoAccounts(db);
  }

  return db;
}

// Ensure all required demo accounts exist in existing databases
function ensureDemoAccounts(db) {
  // Remove unnecessary test accounts and their dependent records so only required demo roles exist
  try {
    const extraUsers = db.prepare(`
      SELECT id FROM users WHERE email NOT IN (
        'admin@stevesmassage.co.ke',
        'finance@stevesmassage.co.ke',
        'inventory@stevesmassage.co.ke',
        'services@stevesmassage.co.ke',
        'grace@stevesmassage.co.ke',
        'david@stevesmassage.co.ke',
        'amina@stevesmassage.co.ke',
        'brian@stevesmassage.co.ke',
        'supplier@spasupplies.co.ke',
        'sales@kenyalinens.co.ke',
        'info@afromedwellness.com',
        'peter@afromedwellness.com',
        'terence@example.com',
        'faith@example.com'
      )
    `).all();

    for (const u of extraUsers) {
      db.prepare('DELETE FROM payments WHERE customer_id = ?').run(u.id);
      db.prepare('DELETE FROM appointments WHERE customer_id = ?').run(u.id);
      db.prepare('DELETE FROM reviews WHERE customer_id = ?').run(u.id);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
    }
  } catch (_) {}

  const checkUser  = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)');
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, phone, password_hash, role, gender, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const updatePass = db.prepare('UPDATE users SET password_hash = ?, phone = ?, role = ? WHERE LOWER(email) = LOWER(?)');

  // Core staff
  if (!checkUser.get('admin@stevesmassage.co.ke')) {
    insertUser.run('Steve Mwangi (Manager)', 'admin@stevesmassage.co.ke', '0712345678', hashPassword('Admin@123'), 'admin', 'Male', null);
  } else {
    updatePass.run(hashPassword('Admin@123'), '0712345678', 'admin', 'admin@stevesmassage.co.ke');
  }

  if (!checkUser.get('finance@stevesmassage.co.ke')) {
    insertUser.run('Patrick Mutua (Finance Director)', 'finance@stevesmassage.co.ke', '0711334455', hashPassword('Finance@123'), 'finance_manager', 'Male', null);
  } else {
    updatePass.run(hashPassword('Finance@123'), '0711334455', 'finance_manager', 'finance@stevesmassage.co.ke');
  }

  if (!checkUser.get('inventory@stevesmassage.co.ke')) {
    insertUser.run('Mercy Chebet (Inventory Controller)', 'inventory@stevesmassage.co.ke', '0722445566', hashPassword('Inventory@123'), 'inventory_manager', 'Female', null);
  } else {
    updatePass.run(hashPassword('Inventory@123'), '0722445566', 'inventory_manager', 'inventory@stevesmassage.co.ke');
  }

  if (!checkUser.get('services@stevesmassage.co.ke')) {
    insertUser.run('Lucas Ochieng (Spa Services Manager)', 'services@stevesmassage.co.ke', '0733556677', hashPassword('Services@123'), 'service_manager', 'Male', null);
  } else {
    updatePass.run(hashPassword('Services@123'), '0733556677', 'service_manager', 'services@stevesmassage.co.ke');
  }

  // Therapists
  const therapistData = [
    ['Grace Muthoni',  'grace@stevesmassage.co.ke',  '0722112233', 'Grace@123',  'Female'],
    ['David Otieno',   'david@stevesmassage.co.ke',   '0733445566', 'David@123',  'Male'],
    ['Amina Hassan',   'amina@stevesmassage.co.ke',   '0708778899', 'Amina@123',  'Female'],
    ['Brian Kiprop',   'brian@stevesmassage.co.ke',   '0715667788', 'Brian@123',  'Male'],
  ];
  for (const [name, email, phone, pass, gender] of therapistData) {
    if (!checkUser.get(email)) {
      const r = db.prepare('INSERT INTO users (name, email, phone, password_hash, role, gender) VALUES (?, ?, ?, ?, ?, ?)').run(name, email, phone, hashPassword(pass), 'therapist', gender);
      const newUid = Number(r.lastInsertRowid);
      const existingTh = db.prepare('SELECT id FROM therapists WHERE LOWER(email) = LOWER(?)').get(email);
      if (existingTh) {
        db.prepare('UPDATE therapists SET user_id = ? WHERE id = ?').run(newUid, existingTh.id);
      }
    } else {
      updatePass.run(hashPassword(pass), phone, 'therapist', email);
    }
  }

  // Fix therapist user_id mappings for existing therapist profiles
  for (const [name, email] of therapistData) {
    const u = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    const t = db.prepare('SELECT id FROM therapists WHERE LOWER(email) = LOWER(?)').get(email);
    if (u && t) {
      db.prepare('UPDATE therapists SET user_id = ? WHERE id = ?').run(u.id, t.id);
    }
  }

  // Suppliers
  const suppliersResult = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get();
  let sup1Id = 1, sup2Id = 2;
  if (suppliersResult.cnt > 0) {
    const s1 = db.prepare('SELECT id FROM suppliers ORDER BY id LIMIT 1').get();
    const s2 = db.prepare('SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 1').get();
    if (s1) sup1Id = s1.id;
    if (s2) sup2Id = s2.id;
  }

  if (!checkUser.get('supplier@spasupplies.co.ke')) {
    insertUser.run('Jared Momanyi (Nairobi Herbal)', 'supplier@spasupplies.co.ke', '0711889900', hashPassword('Supplier@123'), 'supplier', 'Male', sup1Id);
  } else {
    updatePass.run(hashPassword('Supplier@123'), '0711889900', 'supplier', 'supplier@spasupplies.co.ke');
    db.prepare('UPDATE users SET supplier_id = ? WHERE LOWER(email) = ?').run(sup1Id, 'supplier@spasupplies.co.ke');
  }

  if (!checkUser.get('sales@kenyalinens.co.ke')) {
    insertUser.run('Susan Wambui (Kenya Linens)', 'sales@kenyalinens.co.ke', '0722556677', hashPassword('Supplier@123'), 'supplier', 'Female', sup2Id);
  } else {
    updatePass.run(hashPassword('Supplier@123'), '0722556677', 'supplier', 'sales@kenyalinens.co.ke');
    db.prepare('UPDATE users SET supplier_id = ? WHERE LOWER(email) = ?').run(sup2Id, 'sales@kenyalinens.co.ke');
  }

  let sup3Id = 3;
  if (suppliersResult.cnt > 2) {
    const s3 = db.prepare('SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 2').get();
    if (s3) sup3Id = s3.id;
  }

  if (!checkUser.get('info@afromedwellness.com')) {
    insertUser.run('Dr. Peter Karanja (Afromed Wellness)', 'info@afromedwellness.com', '0733990011', hashPassword('Supplier@123'), 'supplier', 'Male', sup3Id);
  } else {
    updatePass.run(hashPassword('Supplier@123'), '0733990011', 'supplier', 'info@afromedwellness.com');
    db.prepare('UPDATE users SET supplier_id = ? WHERE LOWER(email) = ?').run(sup3Id, 'info@afromedwellness.com');
  }

  if (!checkUser.get('peter@afromedwellness.com')) {
    insertUser.run('Dr. Peter Karanja (Afromed Wellness)', 'peter@afromedwellness.com', '0733990011', hashPassword('Supplier@123'), 'supplier', 'Male', sup3Id);
  } else {
    updatePass.run(hashPassword('Supplier@123'), '0733990011', 'supplier', 'peter@afromedwellness.com');
    db.prepare('UPDATE users SET supplier_id = ? WHERE LOWER(email) = ?').run(sup3Id, 'peter@afromedwellness.com');
  }

  // Customers
  if (!checkUser.get('terence@example.com')) {
    insertUser.run('Terence Mwaaki', 'terence@example.com', '0790123456', hashPassword('Client@123'), 'customer', 'Male', null);
  } else {
    updatePass.run(hashPassword('Client@123'), '0790123456', 'customer', 'terence@example.com');
  }

  if (!checkUser.get('faith@example.com')) {
    insertUser.run('Faith Wanjiku', 'faith@example.com', '0720987654', hashPassword('Client@123'), 'customer', 'Female', null);
  } else {
    updatePass.run(hashPassword('Client@123'), '0720987654', 'customer', 'faith@example.com');
  }

  // Ensure bank/M-Pesa payment details are seeded for existing suppliers
  try {
    const s1 = db.prepare('SELECT id FROM suppliers ORDER BY id LIMIT 1').get();
    const s2 = db.prepare('SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 1').get();
    const s3 = db.prepare('SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 2').get();
    const updSup = db.prepare("UPDATE suppliers SET bank_name=?, bank_account=?, mpesa_paybill=?, mpesa_till=? WHERE id=? AND (bank_name IS NULL OR bank_name = '')");
    if (s1) updSup.run('Equity Bank Kenya', '0023456789', '247247', '5278441', s1.id);
    if (s2) updSup.run('KCB Bank Kenya', '1234567890', '522533', '5567823', s2.id);
    if (s3) updSup.run('Co-operative Bank', '9876543210', '400200', '5891234', s3.id);
  } catch (_) {}
}

function seedDatabase(db) {
  console.log("Seeding Steve's Massage Parlor database...");

  // ---- 1. USERS ----
  // Insert in explicit order so IDs are deterministic
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, gender, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // id=1 Admin
  insertUser.run('Steve Mwangi (Manager)', 'admin@stevesmassage.co.ke', '0712345678', hashPassword('Admin@123'), 'admin', 'Male', null);
  // id=2 Finance
  insertUser.run('Patrick Mutua (Finance Director)', 'finance@stevesmassage.co.ke', '0711334455', hashPassword('Finance@123'), 'finance_manager', 'Male', null);
  // id=3 Inventory
  insertUser.run('Mercy Chebet (Inventory Controller)', 'inventory@stevesmassage.co.ke', '0722445566', hashPassword('Inventory@123'), 'inventory_manager', 'Female', null);
  // id=4 Services
  insertUser.run('Lucas Ochieng (Spa Services Manager)', 'services@stevesmassage.co.ke', '0733556677', hashPassword('Services@123'), 'service_manager', 'Male', null);
  // id=5 Grace (Therapist)
  insertUser.run('Grace Muthoni', 'grace@stevesmassage.co.ke', '0722112233', hashPassword('Grace@123'), 'therapist', 'Female', null);
  // id=6 David (Therapist)
  insertUser.run('David Otieno', 'david@stevesmassage.co.ke', '0733445566', hashPassword('David@123'), 'therapist', 'Male', null);
  // id=7 Amina (Therapist)
  insertUser.run('Amina Hassan', 'amina@stevesmassage.co.ke', '0708778899', hashPassword('Amina@123'), 'therapist', 'Female', null);
  // id=8 Brian (Therapist)
  insertUser.run('Brian Kiprop', 'brian@stevesmassage.co.ke', '0715667788', hashPassword('Brian@123'), 'therapist', 'Male', null);
  // id=9 Supplier 1 (linked to supplier id=1, set after suppliers seeded)
  insertUser.run('Jared Momanyi (Nairobi Herbal)', 'supplier@spasupplies.co.ke', '0711889900', hashPassword('Supplier@123'), 'supplier', 'Male', 1);
  // id=10 Supplier 2 (linked to supplier id=2)
  insertUser.run('Susan Wambui (Kenya Linens)', 'sales@kenyalinens.co.ke', '0722556677', hashPassword('Supplier@123'), 'supplier', 'Female', 2);
  // id=11 Customer 1
  insertUser.run('Terence Mwaaki', 'terence@example.com', '0790123456', hashPassword('Client@123'), 'customer', 'Male', null);
  // id=12 Customer 2
  insertUser.run('Faith Wanjiku', 'faith@example.com', '0720987654', hashPassword('Client@123'), 'customer', 'Female', null);
  // id=13 Customer 3
  insertUser.run('Kevin Omondi', 'kevin@example.com', '0731223344', hashPassword('Client@123'), 'customer', 'Male', null);

  // ---- 2. THERAPIST PROFILES (user_id matches users inserted above) ----
  const therapistStmt = db.prepare(`
    INSERT INTO therapists (user_id, name, specialization, bio, phone, email, rating, experience_years, active, working_days, working_hours, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // therapist id=1 -> user_id=5 (Grace)
  therapistStmt.run(5, 'Grace Muthoni', 'Deep Tissue & Swedish Therapy', 'Certified wellness therapist with 6 years experience in chronic muscle tension release and deep tissue rehabilitation.', '0722112233', 'grace@stevesmassage.co.ke', 4.95, 6, 1, 'Mon,Tue,Wed,Thu,Fri,Sat', '09:00 - 18:00', 'assets/therapist_grace.png');
  // therapist id=2 -> user_id=6 (David)
  therapistStmt.run(6, 'David Otieno', 'Sports Massage & Trigger Point', 'Sports recovery specialist focused on athletic conditioning, joint mobility, and targeted trigger point relief.', '0733445566', 'david@stevesmassage.co.ke', 4.88, 5, 1, 'Tue,Wed,Thu,Fri,Sat,Sun', '10:00 - 19:00', 'assets/therapist_david.png');
  // therapist id=3 -> user_id=7 (Amina)
  therapistStmt.run(7, 'Amina Hassan', 'Aromatherapy & Hot Stone Therapy', 'Master aromatherapist specializing in organic herbal essential oil infusions and volcanic basalt hot stone treatments.', '0708778899', 'amina@stevesmassage.co.ke', 4.98, 7, 1, 'Mon,Wed,Thu,Fri,Sat', '09:00 - 17:00', 'assets/therapist_amina.png');
  // therapist id=4 -> user_id=8 (Brian)
  therapistStmt.run(8, 'Brian Kiprop', 'Reflexology & Holistic Relaxation', 'Expert in foot & hand reflexology and stress management techniques, helping clients restore natural energy balance.', '0715667788', 'brian@stevesmassage.co.ke', 4.85, 4, 1, 'Mon,Tue,Thu,Fri,Sat,Sun', '11:00 - 20:00', 'assets/therapist_brian.png');

  // ---- 3. SERVICE CATEGORIES ----
  const catStmt = db.prepare('INSERT INTO service_categories (name, description, icon) VALUES (?, ?, ?)');
  catStmt.run('Full Body Therapeutic', 'Comprehensive full-body muscle rejuvenation and stress elimination treatments.', 'fa-spa');
  catStmt.run('Targeted & Sports Recovery', 'Focused therapy on specific problem zones, injury recovery, and athletic performance.', 'fa-running');
  catStmt.run('Sensory & Holistic Wellness', 'Aromatic oils, heated volcanic stones, and deep holistic mental calm.', 'fa-fire-alt');
  catStmt.run('Express & Reflexology', 'Quick re-energizing sessions targeting acupressure points and stress centers.', 'fa-shoe-prints');

  // ---- 4. SERVICES ----
  const srvStmt = db.prepare(`INSERT INTO services (category_id, name, description, duration_mins, price_kes, benefits, image_url, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  srvStmt.run(1, 'Signature Deep Tissue Massage', 'Intense firm pressure targeting the deepest layers of muscle tissue, tendons, and fascia to alleviate chronic tightness and postural pain.', 60, 3500, 'Relieves chronic lower back pain; Breaks down scar tissue; Enhances range of motion', 'assets/service_deeptissue.png', 1);
  srvStmt.run(1, 'Swedish Gentle Relaxation Massage', 'Classic European technique featuring long gliding strokes, kneading, and rhythmic tapping to melt away tension and boost circulation.', 60, 3000, 'Decreases cortisol stress hormones; Enhances blood oxygenation; Promotes deep restful sleep', 'assets/service_swedish.png', 1);
  srvStmt.run(1, 'Deluxe Full Body Ritual (90 Mins)', 'An extensive 90-minute treatment blending Swedish strokes, hot towels, and customized pressure for complete body bliss.', 90, 4800, 'Total physical detente; Rebalances entire nervous system; Deep lymphatic drainage', 'assets/service_deluxe.png', 1);
  srvStmt.run(2, 'Athletic Sports Recovery Therapy', 'Dynamic therapy incorporating assisted stretching, myofascial release, and friction work to expedite recovery and prevent muscle injuries.', 60, 4000, 'Reduces lactic acid buildup; Improves athletic flexibility; Speeds up recovery time', 'assets/service_sports.png', 1);
  srvStmt.run(2, 'Upper Back, Neck & Shoulder De-Stresser', 'Targeted ergonomic relief focused entirely on tension hotspots caused by computer desks and driving posture.', 45, 2500, 'Eliminates tension headaches; Frees stiff neck rotation; Relaxes shoulder knots', 'assets/service_neckback.png', 1);
  srvStmt.run(3, 'Volcanic Basalt Hot Stone Therapy', 'Smooth, heated volcanic basalt stones placed along energy meridian points paired with warm oil massage to relax muscles effortlessly.', 75, 4500, 'Penetrates deep into tight muscles without pain; Induces meditative state; Improves circulation', 'assets/service_hotstone.png', 1);
  srvStmt.run(3, 'Organic Herbal Aromatherapy', 'Custom blend of cold-pressed lavender, eucalyptus, and ylang-ylang therapeutic essential oils tailored to soothe your emotional and physical state.', 60, 3800, 'Alleviates anxiety; Clears respiratory pathways; Hydrates dry skin with botanical nutrients', 'assets/service_aroma.png', 1);
  srvStmt.run(4, 'Ancient Chinese Foot Reflexology', 'Focused acupressure stimulation on the soles and pressure points of the feet, corresponding to internal organ systems.', 45, 2200, 'Stimulates internal vitality; Relieves tired aching feet; Promotes bodily homeostasis', 'assets/service_reflex.png', 1);

  // ---- 5. APPOINTMENTS & PAYMENTS ----
  const apptStmt = db.prepare(`
    INSERT INTO appointments (reference_no, customer_id, therapist_id, service_id, appointment_date, appointment_time, duration_mins, total_price_kes, status, notes, treatment_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const today     = new Date().toISOString().split('T')[0];
  const tomorrow  = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  apptStmt.run('SMP-2026-0001', 11, 1, 1, yesterday, '10:00', 60, 3500, 'Completed', 'Desk worker, stiffness in upper shoulder and lumbar.', 'Applied deep friction to rhomboids and piriformis. Recommended daily hamstring stretches.');
  apptStmt.run('SMP-2026-0002', 12, 3, 6, yesterday, '14:30', 75, 4500, 'Completed', 'Requested medium-high heat on basalt stones.', 'Therapy successful. Client noted instant relief in lower back.');
  apptStmt.run('SMP-2026-0003', 13, 2, 4, today, '11:00', 60, 4000, 'In-Session', 'Preparing for Nairobi City Marathon training.', 'Focus on calves, IT bands, and gluteus medius.');
  apptStmt.run('SMP-2026-0004', 11, 4, 8, today, '16:00', 45, 2200, 'Confirmed', 'First time reflexology session.', null);
  apptStmt.run('SMP-2026-0005', 12, 1, 2, tomorrow, '11:30', 60, 3000, 'Confirmed', 'Prefer calming lavender scent and quiet ambience.', null);

  const payStmt = db.prepare(`INSERT INTO payments (appointment_id, customer_id, amount_kes, payment_method, transaction_ref, phone_number, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  payStmt.run(1, 11, 3500, 'M-Pesa',           'QHK76TR49X',   '0790123456', 'Completed');
  payStmt.run(2, 12, 4500, 'M-Pesa',           'QHK889KL12',   '0720987654', 'Completed');
  payStmt.run(3, 13, 4000, 'Credit/Debit Card','CARD-8849-01',  '0731223344', 'Completed');
  payStmt.run(4, 11, 2200, 'M-Pesa',           'QHL120MN34',   '0790123456', 'Completed');
  payStmt.run(5, 12, 3000, 'Cash',             'CASH-REC-005', '0720987654', 'Pending');

  // ---- 6. REVIEWS ----
  const revStmt = db.prepare(`INSERT INTO reviews (appointment_id, customer_id, customer_name, therapist_id, service_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  revStmt.run(1, 11, 'Terence Mwaaki', 1, 'Signature Deep Tissue Massage', 5, 'Grace is exceptional! My shoulder stiffness had bothered me for weeks and she pinpointed the knot immediately. Clean, calm parlor!');
  revStmt.run(2, 12, 'Faith Wanjiku', 3, 'Volcanic Basalt Hot Stone Therapy', 5, 'Amina has magic hands. The hot stones paired with aromatherapy put me to sleep in minutes. Booking my next appointment already!');

  // ---- 7. INVENTORY ITEMS ----
  const invStmt = db.prepare(`INSERT INTO inventory_items (sku, name, category, quantity, unit, min_threshold, cost_per_unit_kes, location, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  invStmt.run('OIL-LAV-500', 'Organic Cold-Pressed Lavender Oil (500ml)', 'Massage Oils',  18, 'Bottles',  5,  1200, 'Main Store / Cabinet A', '2026-10-25');
  invStmt.run('OIL-ALM-5L',  'Pure Sweet Almond Base Oil (5L)',            'Carrier Oils',   6, 'Jerricans', 3, 4500, 'Main Store / Cabinet B', '2026-10-20');
  invStmt.run('OIL-EUC-100', 'Eucalyptus Radiata Essential Oil (100ml)',   'Aromatherapy',  12, 'Bottles',  4,   850, 'Aromatherapy Cabinet',   '2026-10-28');
  invStmt.run('EQP-STN-36',  'Basalt Volcanic Stones Set (36 Pcs)',        'Equipment',      4, 'Sets',     2,  8500, 'Treatment Room 1',       '2026-09-15');
  invStmt.run('LIN-EGY-TOW', 'Egyptian Cotton Bath Sheets & Towels',       'Linens',        45, 'Pieces',  20,   950, 'Linen Closet',           '2026-10-10');
  invStmt.run('SAN-DSP-HDR', 'Disposable Headrest Paper Rolls',            'Sanitation',     3, 'Rolls',    5,   450, 'Sanitation Shelf',       '2026-10-02');
  invStmt.run('SAN-SPR-5L',  'Hospital-Grade Bed Sanitizing Spray (5L)',   'Sanitation',     8, 'Canisters',3,  1600, 'Sanitation Shelf',       '2026-10-18');

  // ---- 8. SUPPLIERS ----
  const supStmt = db.prepare(`INSERT INTO suppliers (name, contact_person, phone, email, address, supplied_items, payment_terms, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  supStmt.run('Nairobi Herbal & Spa Supplies Ltd', 'Jared Momanyi', '0711889900', 'orders@nairobiherbals.co.ke', 'Industrial Area, Commercial St, Nairobi', 'Organic Carrier Oils, Essential Oils, Diffusers', '30 Days Invoice', 4.9);
  supStmt.run('Kenya Linens & Textile Mills',       'Susan Wambui',  '0722556677', 'sales@kenyalinens.co.ke',    'Thika Road Superhighway, Ruaraka',           'Luxury Towels, Bathrobes, Bed Linens, Headrest Covers', 'Net 15 Days', 4.8);
  supStmt.run('Afromed Wellness Equipment',         'Dr. Peter Karanja', '0733990011', 'info@afromedwellness.com', 'Upperhill Medical Plaza, Nairobi', 'Massage Tables, Hot Stone Heaters, Anatomical Models', '30 Days Invoice', 4.7);

  // Update supplier_id for supplier users now that suppliers are inserted
  db.exec("UPDATE users SET supplier_id = 1 WHERE email = 'supplier@spasupplies.co.ke'");
  db.exec("UPDATE users SET supplier_id = 2 WHERE email = 'sales@kenyalinens.co.ke'");

  // Seed bank/M-Pesa payment details for suppliers
  try {
    const updateSupPayment = db.prepare("UPDATE suppliers SET bank_name=?, bank_account=?, mpesa_paybill=?, mpesa_till=? WHERE id=?");
    updateSupPayment.run('Equity Bank Kenya', '0023456789', '247247', '5278441', 1);
    updateSupPayment.run('KCB Bank Kenya', '1234567890', '522533', '5567823', 2);
    updateSupPayment.run('Co-operative Bank', '9876543210', '400200', '5891234', 3);
  } catch (_) {}

  // ---- 9. PURCHASE ORDERS ----
  const poStmt = db.prepare(`
    INSERT INTO purchase_orders (po_number, supplier_id, item_id, item_name, quantity, unit_cost_kes, total_cost_kes, delivery_option, delivery_address, order_date, finance_status, status, grn_number, received_date, received_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const parlourAddr = "Steve's Massage Parlour, Valley Arcade, Nairobi";
  poStmt.run('PO-2026-1001', 1, 2, 'Pure Sweet Almond Base Oil (5L)',    4, 4500, 18000, 'Standard Courier (Nairobi Express Delivery)', parlourAddr, '2026-10-19', 'Approved', 'Received', 'GRN-2026-1001', '2026-10-21 14:00', 'Mercy Chebet', 'Urgently needed for aromatherapy sessions');
  poStmt.run('PO-2026-1002', 2, 5, 'Egyptian Cotton Bath Sheets & Towels', 25, 950, 23750, 'Direct Dispatch (Supplier Vehicle)', parlourAddr, '2026-10-08', 'Approved', 'Received', 'GRN-2026-1002', '2026-10-10 10:00', 'Mercy Chebet', '');
  poStmt.run('PO-2026-1003', 1, 6, 'Disposable Headrest Paper Rolls',    10, 450, 4500,  'Standard Courier (Nairobi Express Delivery)', parlourAddr, '2026-11-01', 'Pending',  'Pending Approval', null, null, null, 'Low stock reorder request');

  // ---- 10. STOCK MOVEMENTS ----
  const movStmt = db.prepare(`INSERT INTO stock_movements (item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, reason, reference_no, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  movStmt.run(2, 'Pure Sweet Almond Base Oil (5L)', 'IN', 4, 2, 6, 'Vendor Delivery received via PO-2026-1001', 'PO-2026-1001', 'Mercy Chebet');
  movStmt.run(5, 'Egyptian Cotton Bath Sheets & Towels', 'IN', 25, 20, 45, 'Restock delivery via PO-2026-1002', 'PO-2026-1002', 'Mercy Chebet');
  movStmt.run(1, 'Organic Cold-Pressed Lavender Oil (500ml)', 'OUT', 2, 20, 18, 'Dispensed for weekend aromatherapy and deep tissue sessions', 'DISP-2026-1029', 'Grace Muthoni');
  movStmt.run(6, 'Disposable Headrest Paper Rolls', 'OUT', 3, 6, 3, 'High client volume in massage treatment rooms', 'DISP-2026-1102', 'David Otieno');

  // ---- 11. FINANCE TRANSACTIONS ----
  const finStmt = db.prepare(`INSERT INTO finance_transactions (type, category, description, amount_kes, transaction_date, reference_no, po_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  finStmt.run('Income',  'Service Revenue',   'Daily customer massage appointments receipts (M-Pesa/Card)', 14200, yesterday, 'REV-2026-YEST',  null);
  finStmt.run('Income',  'Service Revenue',   'Morning massage appointments (SMP-0003 & SMP-0004)',          6200, today,     'REV-2026-TODAY', null);
  finStmt.run('Expense', 'Supplies Restock',  'PO-2026-1001: Pure Sweet Almond Base Oil x4 (Received)',     18000, '2026-10-21', 'PO-2026-1001',  1);
  finStmt.run('Expense', 'Supplies Restock',  'PO-2026-1002: Egyptian Cotton Towels x25 (Received)',        23750, '2026-10-10', 'PO-2026-1002',  2);
  finStmt.run('Expense', 'Utilities & Laundry','Industrial towel washing & electricity',                     8500, '2026-10-31', 'EXP-UTIL-1031', null);
  finStmt.run('Expense', 'Therapist Commission','Weekly professional therapist commission payout',           35000, '2026-10-31', 'EXP-COMM-1031', null);

  // ---- 12. BUDGETS ----
  const bgStmt = db.prepare('INSERT INTO budgets (month, category, allocated_kes, spent_kes) VALUES (?, ?, ?, ?)');
  bgStmt.run('2026-11', 'Oils & Spa Consumables',      45000, 4500);
  bgStmt.run('2026-11', 'Linen & Sanitation',           25000, 3200);
  bgStmt.run('2026-11', 'Utilities & Marketing',        35000, 8500);
  bgStmt.run('2026-11', 'Staff Commission & Training', 150000, 35000);

  // ---- 13. INQUIRIES ----
  const inqStmt = db.prepare(`INSERT INTO inquiries (name, email, phone, target_email, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  inqStmt.run('Wanjiru Mwangi', 'wanjiru.m@gmail.com', '0710123456', 'services@stevesmassage.co.ke', 'Couple Massage Packages', 'Do you offer tandem couple massage rooms with customized aromatherapy on weekends?', 'New');
  inqStmt.run('Captain George Omondi', 'captain.omondi@kenyaairways.com', '0722887766', 'admin@stevesmassage.co.ke', 'Corporate Wellness Vouchers', 'We would like to purchase quarterly wellness massage gift vouchers for our cabin crew.', 'Replied');

  // ---- 14. NOTIFICATIONS ----
  const notifStmt = db.prepare(`INSERT INTO notifications (user_id, role_target, title, message, channel, recipient_phone, recipient_email) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  notifStmt.run(11, null, 'Appointment Confirmed', 'Your Signature Deep Tissue Massage with Grace Muthoni has been confirmed for 10:00 AM.', 'SMS', '0790123456', 'terence@example.com');
  notifStmt.run(12, null, 'Payment Received', 'We received KES 4,500 via M-Pesa (Ref: QHK889KL12) for your Hot Stone Therapy session. Thank you!', 'SMS', '0720987654', 'faith@example.com');
  notifStmt.run(3,  null, 'Low Stock Alert', 'Inventory item "Disposable Headrest Paper Rolls" has reached 3 rolls (minimum threshold: 5).', 'In-App', '0712345678', 'admin@stevesmassage.co.ke');
  notifStmt.run(null, 'finance_manager', 'PO Approval Required', 'Purchase Order PO-2026-1003 for Disposable Headrest Paper Rolls (KES 4,500) requires your approval.', 'In-App', null, 'finance@stevesmassage.co.ke');
  notifStmt.run(9, null, 'New Purchase Order Received', 'You have a new purchase order PO-2026-1003 awaiting your acknowledgement.', 'In-App', null, 'supplier@spasupplies.co.ke');

  console.log('Database seeded successfully!');
}

module.exports = { initDatabase, hashPassword, DB_FILE };
