// Steve's Massage Parlor Management System - Backend Server
// Developed for Terence Mwaaki (BIT-0-8106-3/2025) - Kenya Methodist University
// Built using Node.js standard HTTP and SQLite (node:sqlite) - Zero external dependencies

const http   = require('node:http');
const url    = require('node:url');
const fs     = require('node:fs');
const path   = require('node:path');
const crypto = require('node:crypto');
const { initDatabase, hashPassword } = require('./database/db.js');

const PORT = process.env.PORT || 3000;
const db   = initDatabase();

// ============================================================
// SESSION MANAGEMENT (In-memory + HMAC persistent recovery)
// ============================================================
const SESSION_SECRET = 'smp_kemu_dbit226_secret_key_2026';
const sessions = new Map();

function generateToken(user) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = `${user.id}:${user.role}:${expiresAt}`;
  const sig  = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  const token = `smp_${user.id}_${expiresAt}_${sig}`;
  sessions.set(token, {
    userId: user.id, name: user.name, email: user.email,
    role: user.role, supplierId: user.supplier_id || null, expiresAt
  });
  return token;
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  // 1. In-memory session lookup
  const session = sessions.get(token);
  if (session) {
    if (session.expiresAt < Date.now()) { sessions.delete(token); return null; }
    return session;
  }

  // 2. HMAC persistent recovery (survives server restarts)
  if (token.startsWith('smp_')) {
    const parts = token.split('_');
    if (parts.length === 4) {
      const uid       = parseInt(parts[1], 10);
      const expiresAt = parseInt(parts[2], 10);
      const sig       = parts[3];
      if (expiresAt > Date.now()) {
        const userRow = db.prepare('SELECT id, name, email, role, supplier_id FROM users WHERE id = ?').get(uid);
        if (userRow) {
          const expectedData = `${userRow.id}:${userRow.role}:${expiresAt}`;
          const expectedSig  = crypto.createHmac('sha256', SESSION_SECRET).update(expectedData).digest('hex');
          if (sig === expectedSig) {
            const restored = {
              userId: userRow.id, name: userRow.name, email: userRow.email,
              role: userRow.role, supplierId: userRow.supplier_id || null, expiresAt
            };
            sessions.set(token, restored);
            return restored;
          }
        }
      }
    }
  }

  return null;
}

// ============================================================
// HELPERS
// ============================================================
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}
function sendError(res, statusCode, message) { sendJSON(res, statusCode, { error: message }); }

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large')); });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON format')); }
    });
    req.on('error', reject);
  });
}

// Phone normalization & validation: accepts 07XXXXXXXX or 01XXXXXXXX (10 digits), or +254... normalized
function normalizePhone(phone) {
  if (!phone) return '';
  let p = String(phone).trim().replace(/\s+/g, '');
  if (p.startsWith('+254')) p = '0' + p.slice(4);
  if (p.startsWith('254') && p.length === 12) p = '0' + p.slice(3);
  return p;
}

function validatePhone(phone) {
  if (!phone) return false;
  const p = normalizePhone(phone);
  return /^0[71]\d{8}$/.test(p);
}

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf'
};

function serveStatic(req, res, pathname) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, 'public', safePath);
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403); return res.end('Access Denied');
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(safePath)) return serveStatic(req, res, '/index.html');
      res.writeHead(404); return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;
  const query     = parsedUrl.query;
  const method    = req.method;

  if (!pathname.startsWith('/api/')) {
    return serveStatic(req, res, pathname);
  }

  try {
    const user = getAuthUser(req);

    // ========================================================
    // AUTH MODULE
    // ========================================================
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = await parseBody(req);
      if (!email || !password) return sendError(res, 400, 'Email and password are required');

      const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (!userRow || userRow.password_hash !== hashPassword(password)) {
        return sendError(res, 401, 'Invalid email or password. Please check your credentials.');
      }

      const token = generateToken(userRow);
      return sendJSON(res, 200, {
        message: 'Login successful',
        token,
        user: {
          id: userRow.id, name: userRow.name, email: userRow.email,
          phone: userRow.phone, role: userRow.role, gender: userRow.gender,
          supplier_id: userRow.supplier_id || null
        }
      });
    }

    if (pathname === '/api/auth/register' && method === 'POST') {
      const { name, email, phone, password, gender } = await parseBody(req);
      if (!name || !email || !phone || !password) {
        return sendError(res, 400, 'Name, email, phone, and password are required');
      }

      // Phone validation & normalization
      const cleanPhone = normalizePhone(phone);
      if (!validatePhone(cleanPhone)) {
        return sendError(res, 400, 'Please enter a valid 10-digit Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)');
      }

      if (password.length < 6) {
        return sendError(res, 400, 'Password must be at least 6 characters long');
      }

      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (existing) return sendError(res, 400, 'An account with this email already exists. Please log in instead.');

      const result = db.prepare(`INSERT INTO users (name, email, phone, password_hash, role, gender) VALUES (?, ?, ?, ?, 'customer', ?)`).run(
        name.trim(), email.trim().toLowerCase(), cleanPhone, hashPassword(password), gender || 'Not Specified'
      );
      const newUserId = Number(result.lastInsertRowid);
      const newUser   = db.prepare('SELECT id, name, email, phone, role, gender, supplier_id FROM users WHERE id = ?').get(newUserId);

      // Welcome notification
      db.prepare(`INSERT INTO notifications (user_id, title, message, channel, recipient_phone, recipient_email) VALUES (?, ?, ?, 'In-App', ?, ?)`).run(
        newUserId, "Welcome to Steve's Massage Parlor!", "Your account is active. Book your first relaxation session online anytime.", newUser.phone, newUser.email
      );

      const token = generateToken(newUser);
      return sendJSON(res, 201, { message: 'Registration successful! Welcome!', token, user: newUser });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!user) return sendError(res, 401, 'Not authenticated');
      const userRow = db.prepare('SELECT id, name, email, phone, role, gender, supplier_id, created_at FROM users WHERE id = ?').get(user.userId);
      if (!userRow) return sendError(res, 404, 'User not found');
      return sendJSON(res, 200, { user: userRow });
    }

    // ========================================================
    // USERS MODULE (Admin)
    // ========================================================
    if (pathname === '/api/users' && method === 'GET') {
      if (!user || user.role !== 'admin') return sendError(res, 403, 'Admin access required');
      const roleFilter = query.role;
      let sql = 'SELECT id, name, email, phone, role, gender, supplier_id, created_at FROM users';
      let list;
      if (roleFilter) {
        sql += ' WHERE role = ? ORDER BY created_at DESC';
        list = db.prepare(sql).all(roleFilter);
      } else {
        sql += ' ORDER BY created_at DESC';
        list = db.prepare(sql).all();
      }
      return sendJSON(res, 200, list);
    }

    if (pathname === '/api/users' && method === 'POST') {
      if (!user || user.role !== 'admin') return sendError(res, 403, 'Admin access required');
      const { name, email, phone, password, gender, role } = await parseBody(req);
      if (!name || !email || !phone) return sendError(res, 400, 'Name, email, and phone are required');
      const cleanPhone = normalizePhone(phone);
      if (!validatePhone(cleanPhone)) return sendError(res, 400, 'Please enter a valid 10-digit Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)');

      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (existing) return sendError(res, 400, 'A user with this email already exists');

      const userRole = role || 'customer';
      const userPass = password || (userRole === 'therapist' ? 'Therapist@123' : (userRole === 'supplier' ? 'Supplier@123' : 'Client@123'));
      const r = db.prepare(`INSERT INTO users (name, email, phone, password_hash, role, gender) VALUES (?, ?, ?, ?, ?, ?)`).run(
        name.trim(), email.trim().toLowerCase(), cleanPhone, hashPassword(userPass), userRole, gender || 'Not Specified'
      );
      const newUid = Number(r.lastInsertRowid);

      // If registered as therapist, ensure therapist profile exists so they can log in independently
      if (userRole === 'therapist') {
        const existingTh = db.prepare('SELECT id FROM therapists WHERE LOWER(email) = LOWER(?)').get(email.trim());
        if (!existingTh) {
          db.prepare(`
            INSERT INTO therapists (user_id, name, specialization, bio, phone, email, rating, experience_years, active, working_days, working_hours, avatar)
            VALUES (?, ?, 'Certified Wellness Specialist', 'Professional licensed massage therapist.', ?, ?, 5.0, 3, 1, 'Mon,Tue,Wed,Thu,Fri,Sat', '09:00 - 18:00', 'assets/default_avatar.png')
          `).run(newUid, name.trim(), cleanPhone, email.trim().toLowerCase());
        } else {
          db.prepare('UPDATE therapists SET user_id = ?, phone = ? WHERE id = ?').run(newUid, cleanPhone, existingTh.id);
        }
      }

      const createdUser = db.prepare('SELECT id, name, email, phone, role, gender, created_at FROM users WHERE id = ?').get(newUid);
      return sendJSON(res, 201, { message: 'User account created successfully', user: createdUser });
    }

    if (pathname.match(/^\/api\/users\/(\d+)$/) && method === 'DELETE') {
      if (!user || user.role !== 'admin') return sendError(res, 403, 'Admin access required');
      const uid = parseInt(pathname.split('/')[3]);
      const target = db.prepare('SELECT role FROM users WHERE id = ?').get(uid);
      if (!target) return sendError(res, 404, 'User not found');
      if (target.role === 'admin') return sendError(res, 403, 'Cannot delete administrator accounts');
      db.prepare('DELETE FROM users WHERE id = ?').run(uid);
      return sendJSON(res, 200, { message: 'User account removed successfully' });
    }

    // ========================================================
    // SERVICES & CATEGORIES
    // ========================================================
    if (pathname === '/api/categories' && method === 'GET') {
      return sendJSON(res, 200, db.prepare('SELECT * FROM service_categories ORDER BY id ASC').all());
    }

    if (pathname === '/api/services' && method === 'GET') {
      let sql = `SELECT s.*, c.name as category_name, c.icon as category_icon FROM services s JOIN service_categories c ON s.category_id = c.id WHERE 1=1`;
      const params = [];
      if (query.active !== undefined) {
        sql += ' AND s.active = ?'; params.push(Number(query.active));
      } else if (!user || (user.role !== 'admin' && user.role !== 'service_manager')) {
        sql += ' AND s.active = 1';
      }
      if (query.category_id) { sql += ' AND s.category_id = ?'; params.push(Number(query.category_id)); }
      if (query.q) { sql += ' AND (s.name LIKE ? OR s.description LIKE ?)'; params.push(`%${query.q}%`, `%${query.q}%`); }
      sql += ' ORDER BY s.id ASC';
      return sendJSON(res, 200, db.prepare(sql).all(...params));
    }

    if (pathname === '/api/services' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'service_manager')) return sendError(res, 403, 'Admin or Service Manager access required');
      const { category_id, name, description, duration_mins, price_kes, benefits, image_url } = await parseBody(req);
      if (!category_id || !name || !description || !duration_mins || !price_kes) return sendError(res, 400, 'All fields required');
      const r = db.prepare(`INSERT INTO services (category_id, name, description, duration_mins, price_kes, benefits, image_url, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`).run(category_id, name, description, duration_mins, price_kes, benefits || '', image_url || 'assets/default_service.png');
      return sendJSON(res, 201, { message: 'Service created successfully', id: Number(r.lastInsertRowid) });
    }

    if (pathname.match(/^\/api\/services\/(\d+)$/) && method === 'PUT') {
      if (!user || (user.role !== 'admin' && user.role !== 'service_manager')) return sendError(res, 403, 'Unauthorized');
      const id = pathname.split('/')[3];
      const { category_id, name, description, duration_mins, price_kes, benefits, image_url, active } = await parseBody(req);
      db.prepare(`UPDATE services SET category_id=COALESCE(?,category_id), name=COALESCE(?,name), description=COALESCE(?,description), duration_mins=COALESCE(?,duration_mins), price_kes=COALESCE(?,price_kes), benefits=COALESCE(?,benefits), image_url=COALESCE(?,image_url), active=COALESCE(?,active) WHERE id=?`).run(category_id, name, description, duration_mins, price_kes, benefits, image_url, active, id);
      return sendJSON(res, 200, { message: 'Service updated' });
    }

    if (pathname.match(/^\/api\/services\/(\d+)$/) && method === 'DELETE') {
      if (!user || (user.role !== 'admin' && user.role !== 'service_manager')) return sendError(res, 403, 'Unauthorized');
      db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(pathname.split('/')[3]);
      return sendJSON(res, 200, { message: 'Service deactivated' });
    }

    // ========================================================
    // THERAPISTS
    // ========================================================
    if (pathname === '/api/therapists' && method === 'GET') {
      return sendJSON(res, 200, db.prepare(`SELECT t.*, u.email as user_email FROM therapists t LEFT JOIN users u ON t.user_id = u.id WHERE t.active = 1 ORDER BY t.rating DESC`).all());
    }

    if (pathname === '/api/therapists' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'service_manager')) return sendError(res, 403, 'Admin or Service Manager access required');
      const { name, specialization, bio, phone, email, password, experience_years, working_days, working_hours, avatar } = await parseBody(req);
      if (!name || !specialization || !phone || !email) return sendError(res, 400, 'Name, specialization, phone, and email required');
      const cleanPhone = normalizePhone(phone);
      if (!validatePhone(cleanPhone)) return sendError(res, 400, 'Invalid phone number: Please enter a 10-digit number (07XXXXXXXX or 01XXXXXXXX)');

      const thPass = password || 'Therapist@123';
      let userRow = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      let userId;
      if (!userRow) {
        const ur = db.prepare(`INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'therapist')`).run(
          name.trim(), email.trim().toLowerCase(), cleanPhone, hashPassword(thPass)
        );
        userId = Number(ur.lastInsertRowid);
      } else {
        userId = userRow.id;
        db.prepare(`UPDATE users SET role = 'therapist', phone = ?, password_hash = ? WHERE id = ?`).run(cleanPhone, hashPassword(thPass), userId);
      }

      const r = db.prepare(`
        INSERT INTO therapists (user_id, name, specialization, bio, phone, email, rating, experience_years, active, working_days, working_hours, avatar)
        VALUES (?, ?, ?, ?, ?, ?, 5.0, ?, 1, ?, ?, ?)
      `).run(userId, name.trim(), specialization, bio || '', cleanPhone, email.trim().toLowerCase(), experience_years || 2, working_days || 'Mon,Tue,Wed,Thu,Fri,Sat', working_hours || '09:00 - 18:00', avatar || 'assets/default_avatar.png');
      return sendJSON(res, 201, { message: 'Therapist registered successfully with independent login credentials', id: Number(r.lastInsertRowid), user_id: userId });
    }

    if (pathname.match(/^\/api\/therapists\/(\d+)$/) && method === 'PUT') {
      if (!user || (user.role !== 'admin' && user.role !== 'therapist' && user.role !== 'service_manager')) return sendError(res, 403, 'Unauthorized');
      const id = pathname.split('/')[3];
      const { specialization, bio, phone, experience_years, working_days, working_hours, active } = await parseBody(req);
      db.prepare(`UPDATE therapists SET specialization=COALESCE(?,specialization), bio=COALESCE(?,bio), phone=COALESCE(?,phone), experience_years=COALESCE(?,experience_years), working_days=COALESCE(?,working_days), working_hours=COALESCE(?,working_hours), active=COALESCE(?,active) WHERE id=?`).run(specialization, bio, phone, experience_years, working_days, working_hours, active, id);
      return sendJSON(res, 200, { message: 'Therapist profile updated' });
    }

    // ========================================================
    // SCHEDULING AVAILABILITY
    // ========================================================
    if (pathname === '/api/scheduling/availability' && method === 'GET') {
      const { therapist_id, date } = query;
      if (!date) return sendError(res, 400, 'Date is required');
      const allSlots = ['09:00','10:00','11:00','12:00','13:30','14:30','15:30','16:30','17:30'];
      let bookedSlots = [];
      if (therapist_id && therapist_id !== 'any') {
        const bookings = db.prepare(`SELECT appointment_time FROM appointments WHERE therapist_id = ? AND appointment_date = ? AND status NOT IN ('Cancelled')`).all(Number(therapist_id), date);
        bookedSlots = bookings.map(b => b.appointment_time);
      }
      const availableSlots = allSlots.map(time => ({ time, isAvailable: !bookedSlots.includes(time) }));
      return sendJSON(res, 200, { date, availableSlots });
    }

    // ========================================================
    // APPOINTMENTS
    // ========================================================
    if (pathname === '/api/appointments' && method === 'GET') {
      if (!user) return sendError(res, 401, 'Please log in to view appointments');

      let sql = `
        SELECT a.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
               t.name as therapist_name, t.phone as therapist_phone,
               s.name as service_name, s.price_kes as service_price,
               p.payment_method, p.status as payment_status, p.transaction_ref
        FROM appointments a
        JOIN users u ON a.customer_id = u.id
        JOIN therapists t ON a.therapist_id = t.id
        JOIN services s ON a.service_id = s.id
        LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE 1=1
      `;
      const params = [];

      if (user.role === 'customer') {
        sql += ' AND a.customer_id = ?'; params.push(user.userId);
      } else if (user.role === 'therapist') {
        let th = db.prepare('SELECT id FROM therapists WHERE user_id = ?').get(user.userId);
        if (!th && user.email) {
          th = db.prepare('SELECT id FROM therapists WHERE LOWER(email) = LOWER(?)').get(user.email);
        }
        if (th) { sql += ' AND a.therapist_id = ?'; params.push(th.id); }
        else return sendJSON(res, 200, []);
      }
      // admin, service_manager, finance_manager see all; can filter by therapist_id
      if (query.therapist_id && (user.role === 'admin' || user.role === 'service_manager')) {
        sql += ' AND a.therapist_id = ?'; params.push(query.therapist_id);
      }

      if (query.status) { sql += ' AND a.status = ?'; params.push(query.status); }
      if (query.date)   { sql += ' AND a.appointment_date = ?'; params.push(query.date); }
      sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
      return sendJSON(res, 200, db.prepare(sql).all(...params));
    }

    if (pathname === '/api/appointments' && method === 'POST') {
      const body = await parseBody(req);
      let customerId;

      if (user) {
        if ((user.role === 'admin' || user.role === 'service_manager') && body.customer_id) {
          customerId = Number(body.customer_id);
        } else if (user.role === 'customer') {
          customerId = user.userId;
        } else if (user.role === 'therapist' || user.role === 'admin' || user.role === 'service_manager') {
          if (!body.customer_id) return sendError(res, 400, 'customer_id is required when booking on behalf of a client');
          customerId = Number(body.customer_id);
        } else {
          customerId = user.userId;
        }
      } else {
        // Guest booking: auto-create or find account
        const { customer_name, customer_email, customer_phone, customer_password } = body;
        if (!customer_name || !customer_email || !customer_phone) return sendError(res, 400, 'Customer name, email, and phone are required for guest booking');
        const cleanCustPhone = normalizePhone(customer_phone);
        if (!validatePhone(cleanCustPhone)) return sendError(res, 400, 'Please enter a valid 10-digit Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)');

        let existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(customer_email.trim());
        if (existingUser) {
          customerId = existingUser.id;
          db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(cleanCustPhone, customerId);
        } else {
          const passToUse = customer_password || 'Client@123';
          const resUser = db.prepare(`INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'customer')`).run(
            customer_name.trim(), customer_email.trim().toLowerCase(), cleanCustPhone, hashPassword(passToUse)
          );
          customerId = Number(resUser.lastInsertRowid);
        }
      }

      let { service_id, therapist_id, appointment_date, appointment_time, notes, payment_method, mpesa_phone } = body;
      if (!service_id || !appointment_date || !appointment_time) return sendError(res, 400, 'Service, date, and time are required');

      const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(service_id);
      if (!service) return sendError(res, 404, 'Service not found or no longer available');

      // Assign or verify therapist
      if (!therapist_id || therapist_id === 'any') {
        const availableTherapist = db.prepare(`
          SELECT id FROM therapists WHERE active = 1 AND id NOT IN (
            SELECT therapist_id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status NOT IN ('Cancelled')
          ) ORDER BY rating DESC LIMIT 1
        `).get(appointment_date, appointment_time);
        if (!availableTherapist) return sendError(res, 409, 'All therapists are fully booked for this time slot. Please choose another time.');
        therapist_id = availableTherapist.id;
      } else {
        const conflict = db.prepare(`SELECT id FROM appointments WHERE therapist_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('Cancelled')`).get(therapist_id, appointment_date, appointment_time);
        if (conflict) return sendError(res, 409, 'This therapist is already booked at that time. Please pick another slot.');
      }

      const refNo = `SMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const apptResult = db.prepare(`INSERT INTO appointments (reference_no, customer_id, therapist_id, service_id, appointment_date, appointment_time, duration_mins, total_price_kes, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)`).run(refNo, customerId, therapist_id, service_id, appointment_date, appointment_time, service.duration_mins, service.price_kes, notes || '');
      const appointmentId = Number(apptResult.lastInsertRowid);

      const customer = db.prepare('SELECT id, name, email, phone, role, gender, supplier_id FROM users WHERE id = ?').get(customerId);
      const chosenMethod = payment_method || 'M-Pesa';
      const transRef     = chosenMethod === 'M-Pesa' ? `MPESA-${crypto.randomBytes(4).toString('hex').toUpperCase()}` :
                           chosenMethod === 'Credit/Debit Card' ? `CARD-${crypto.randomBytes(4).toString('hex').toUpperCase()}` :
                           `CASH-${refNo}`;
      const payStatus = chosenMethod === 'Cash' ? 'Pending' : 'Completed';
      const cleanMpesa = normalizePhone(mpesa_phone) || (customer ? customer.phone : '');

      db.prepare(`INSERT INTO payments (appointment_id, customer_id, amount_kes, payment_method, transaction_ref, phone_number, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(appointmentId, customerId, service.price_kes, chosenMethod, transRef, cleanMpesa, payStatus);

      // Auto-record finance income
      db.prepare(`INSERT INTO finance_transactions (type, category, description, amount_kes, transaction_date, reference_no) VALUES (?, 'Service Revenue', ?, ?, ?, ?)`).run(
        'Income', `Appointment ${refNo} - ${service.name}`, service.price_kes, appointment_date, transRef
      );

      // Service module notification
      db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('service_manager', ?, ?, 'In-App')`).run(
        'New Appointment Booked', `Appointment ${refNo} for ${service.name} on ${appointment_date} at ${appointment_time} has been confirmed.`
      );

      const therapist = db.prepare('SELECT id, user_id, name, email, phone FROM therapists WHERE id = ?').get(therapist_id);

      // Notification to Assigned Therapist
      if (therapist && therapist.user_id) {
        const thMsg = `Client ${customer.name} (${customer.phone}) booked "${service.name}" with you on ${appointment_date} at ${appointment_time}. Booking Ref: ${refNo}. Notes: ${notes || 'None'}.`;
        db.prepare(`INSERT INTO notifications (user_id, role_target, title, message, channel, recipient_phone, recipient_email) VALUES (?, 'therapist', 'New Client Appointment Booked', ?, 'In-App', ?, ?)`).run(
          therapist.user_id, thMsg, therapist.phone || '', therapist.email || ''
        );
      }

      // SMS notification to Customer
      const smsMsg = `Dear ${customer.name}, your appointment for ${service.name} with ${therapist.name} on ${appointment_date} at ${appointment_time} is CONFIRMED. Ref: ${refNo}. Steve's Massage Parlor.`;
      db.prepare(`INSERT INTO notifications (user_id, title, message, channel, recipient_phone, recipient_email) VALUES (?, 'Booking Confirmed', ?, 'SMS', ?, ?)`).run(customerId, smsMsg, customer.phone, customer.email);

      // Session token for guest (auto-login after booking)
      let sessionToken = null;
      if (!user && customer) sessionToken = generateToken(customer);

      return sendJSON(res, 201, {
        message: 'Appointment booked successfully!',
        token: sessionToken,
        user: customer,
        appointment: {
          id: appointmentId, reference_no: refNo,
          appointment_date, appointment_time,
          service_name: service.name, therapist_name: therapist.name,
          price_kes: service.price_kes, status: 'Confirmed',
          transaction_ref: transRef, payment_status: payStatus
        }
      });
    }

    if (pathname.match(/^\/api\/appointments\/(\d+)$/) && method === 'PUT') {
      if (!user) return sendError(res, 401, 'Unauthorized');
      const apptId = pathname.split('/')[3];
      const { status, treatment_notes, appointment_date, appointment_time, therapist_id } = await parseBody(req);
      const currentAppt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
      if (!currentAppt) return sendError(res, 404, 'Appointment not found');
      if (user.role === 'customer' && currentAppt.customer_id !== user.userId) return sendError(res, 403, 'You can only modify your own appointments');

      db.prepare(`UPDATE appointments SET status=COALESCE(?,status), treatment_notes=COALESCE(?,treatment_notes), appointment_date=COALESCE(?,appointment_date), appointment_time=COALESCE(?,appointment_time), therapist_id=COALESCE(?,therapist_id) WHERE id=?`).run(status, treatment_notes, appointment_date, appointment_time, therapist_id, apptId);

      // Notify therapist if status changed
      if (status && status !== currentAppt.status && user.role !== 'therapist') {
        const thRow = db.prepare('SELECT user_id, phone, email FROM therapists WHERE id = ?').get(currentAppt.therapist_id);
        if (thRow && thRow.user_id) {
          db.prepare(`INSERT INTO notifications (user_id, role_target, title, message, channel, recipient_phone, recipient_email) VALUES (?, 'therapist', ?, ?, 'In-App', ?, ?)`).run(
            thRow.user_id, `Appointment ${status}`, `Appointment ${currentAppt.reference_no} status changed to "${status}".`, thRow.phone || '', thRow.email || ''
          );
        }
      }

      if (status === 'Completed') {
        db.prepare(`UPDATE payments SET status='Completed' WHERE appointment_id=? AND status='Pending'`).run(apptId);
        db.prepare(`INSERT INTO notifications (user_id, title, message, channel) VALUES (?, 'Session Completed', 'Thank you for visiting Steve''s Massage Parlor! Please rate your experience.', 'In-App')`).run(currentAppt.customer_id);
      }
      return sendJSON(res, 200, { message: 'Appointment updated' });
    }

    // ========================================================
    // PAYMENTS
    // ========================================================
    if (pathname === '/api/payments' && method === 'GET') {
      if (!user) return sendError(res, 401, 'Unauthorized');
      let sql = `
        SELECT p.*,
               COALESCE(a.reference_no, 'REF-' || p.id) as reference_no,
               COALESCE(u.name, 'Unknown Customer')       as customer_name,
               COALESCE(sv.name, 'Wellness Therapy')      as service_name
        FROM payments p
        LEFT JOIN appointments a  ON p.appointment_id = a.id
        LEFT JOIN users u         ON p.customer_id    = u.id
        LEFT JOIN services sv     ON a.service_id     = sv.id
        WHERE 1=1`;
      const params = [];
      if (user.role === 'customer') { sql += ' AND p.customer_id = ?'; params.push(user.userId); }
      sql += ' ORDER BY p.id DESC';
      return sendJSON(res, 200, db.prepare(sql).all(...params));
    }

    if (pathname === '/api/payments/mpesa-simulate' && method === 'POST') {
      const { phone_number, amount_kes } = await parseBody(req);
      if (!phone_number || !amount_kes) return sendError(res, 400, 'Phone number and amount required');
      const mpesaRef = `MP${Math.floor(10000000 + Math.random() * 90000000)}KES`;
      return sendJSON(res, 200, { success: true, message: `M-Pesa STK push sent to ${phone_number}.`, transaction_ref: mpesaRef, amount_kes, status: 'Completed' });
    }

    if (pathname.match(/^\/api\/payments\/(\d+)\/confirm$/) && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'finance_manager')) return sendError(res, 403, 'Finance access required');
      const payId  = pathname.split('/')[3];
      const payment = db.prepare('SELECT p.*, a.reference_no, s.name as service_name FROM payments p JOIN appointments a ON p.appointment_id = a.id JOIN services s ON a.service_id = s.id WHERE p.id = ?').get(payId);
      if (!payment) return sendError(res, 404, 'Payment not found');
      db.prepare("UPDATE payments SET status='Completed' WHERE id=?").run(payId);
      db.prepare(`INSERT INTO finance_transactions (type, category, description, amount_kes, transaction_date, reference_no) VALUES ('Income','Service Revenue',?,DATE('now'),?)`).run(`Payment confirmed for ${payment.reference_no} (${payment.service_name})`, payment.amount_kes, payment.transaction_ref);
      return sendJSON(res, 200, { message: 'Payment confirmed and recorded in finance ledger' });
    }

    // ========================================================
    // REVIEWS
    // ========================================================
    if (pathname === '/api/reviews' && method === 'GET') {
      return sendJSON(res, 200, db.prepare(`SELECT r.*, t.name as therapist_name FROM reviews r LEFT JOIN therapists t ON r.therapist_id = t.id ORDER BY r.created_at DESC`).all());
    }

    if (pathname === '/api/reviews' && method === 'POST') {
      if (!user) return sendError(res, 401, 'Please log in to submit a review');
      const { appointment_id, therapist_id, service_name, rating, comment } = await parseBody(req);
      if (!rating || !comment) return sendError(res, 400, 'Rating and comment are required');
      db.prepare(`INSERT INTO reviews (appointment_id, customer_id, customer_name, therapist_id, service_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(appointment_id || null, user.userId, user.name, therapist_id || null, service_name || 'Wellness Therapy', rating, comment);
      return sendJSON(res, 201, { message: 'Thank you for your feedback!' });
    }

    // ========================================================
    // INVENTORY MODULE (Inventory Manager + Admin only)
    // ========================================================
    if (pathname === '/api/inventory/stats' && method === 'GET') {
      const totalItems    = db.prepare('SELECT COUNT(*) as cnt FROM inventory_items').get().cnt;
      const totalValuation = db.prepare('SELECT COALESCE(SUM(quantity * cost_per_unit_kes), 0) as val FROM inventory_items').get().val;
      const lowStockCount = db.prepare('SELECT COUNT(*) as cnt FROM inventory_items WHERE quantity <= min_threshold').get().cnt;
      const totalSuppliers = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get().cnt;
      const pendingPOCount = db.prepare("SELECT COUNT(*) as cnt FROM purchase_orders WHERE finance_status='Pending'").get().cnt;
      return sendJSON(res, 200, { totalItems, totalValuation, lowStockCount, totalSuppliers, pendingPOCount });
    }

    if (pathname === '/api/inventory/movements' && method === 'GET') {
      return sendJSON(res, 200, db.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 60').all());
    }

    if (pathname === '/api/inventory' && method === 'GET') {
      let sql = 'SELECT *, (quantity * cost_per_unit_kes) as total_value_kes FROM inventory_items WHERE 1=1';
      const params = [];
      if (query.category) { sql += ' AND category = ?'; params.push(query.category); }
      if (query.q) { sql += ' AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)'; params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`); }
      if (query.status === 'low') { sql += ' AND quantity <= min_threshold'; }
      sql += ' ORDER BY category, name';
      return sendJSON(res, 200, db.prepare(sql).all(...params));
    }

    if (pathname === '/api/inventory' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Inventory Manager access required');
      const { sku, name, category, quantity, unit, min_threshold, cost_per_unit_kes, location } = await parseBody(req);
      if (!name || !category || quantity === undefined || !unit || min_threshold === undefined) return sendError(res, 400, 'Name, category, quantity, unit, and threshold required');
      const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
      const todayStr     = new Date().toISOString().split('T')[0];
      const r = db.prepare(`INSERT INTO inventory_items (sku, name, category, quantity, unit, min_threshold, cost_per_unit_kes, location, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(generatedSku, name, category, quantity, unit, min_threshold, cost_per_unit_kes || 0, location || 'Main Store / Cabinet A', todayStr);
      const newItemId = Number(r.lastInsertRowid);
      db.prepare(`INSERT INTO stock_movements (item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, reason, reference_no, recorded_by) VALUES (?, ?, 'IN', ?, 0, ?, 'Initial catalog entry', ?, ?)`).run(newItemId, name, quantity, quantity, generatedSku, user.name);
      return sendJSON(res, 201, { message: 'Inventory item added', id: newItemId, sku: generatedSku });
    }

    if (pathname.match(/^\/api\/inventory\/(\d+)\/adjust$/) && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Inventory Manager access required');
      const id  = pathname.split('/')[3];
      const { type, quantity, reason, reference_no } = await parseBody(req);
      const qtyNum = Number(quantity);
      if (!type || isNaN(qtyNum) || qtyNum <= 0) return sendError(res, 400, 'Valid movement type and positive quantity required');
      const currentItem = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
      if (!currentItem) return sendError(res, 404, 'Item not found');

      let newQty = currentItem.quantity;
      if (type === 'IN') newQty = currentItem.quantity + qtyNum;
      else if (type === 'OUT') newQty = Math.max(0, currentItem.quantity - qtyNum);
      else if (type === 'ADJUSTMENT') newQty = qtyNum;

      const todayStr = new Date().toISOString().split('T')[0];
      db.prepare('UPDATE inventory_items SET quantity = ?, last_restocked = ? WHERE id = ?').run(newQty, todayStr, id);
      db.prepare(`INSERT INTO stock_movements (item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, reason, reference_no, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, currentItem.name, type, qtyNum, currentItem.quantity, newQty, reason || 'Stock adjustment', reference_no || `ADJ-${Date.now()}`, user.name);

      if (newQty <= currentItem.min_threshold) {
        db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('inventory_manager', ?, ?, 'In-App')`).run(`Low Stock Alert: ${currentItem.name}`, `"${currentItem.name}" has reached ${newQty} ${currentItem.unit} (threshold: ${currentItem.min_threshold}).`);
      }
      return sendJSON(res, 200, { message: `Stock adjusted for ${currentItem.name}`, previous_quantity: currentItem.quantity, new_quantity: newQty });
    }

    if (pathname.match(/^\/api\/inventory\/(\d+)$/) && method === 'PUT') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Inventory Manager access required');
      const id = pathname.split('/')[3];
      const { sku, name, category, quantity, unit, min_threshold, cost_per_unit_kes, location } = await parseBody(req);
      db.prepare(`UPDATE inventory_items SET sku=COALESCE(?,sku), name=COALESCE(?,name), category=COALESCE(?,category), quantity=COALESCE(?,quantity), unit=COALESCE(?,unit), min_threshold=COALESCE(?,min_threshold), cost_per_unit_kes=COALESCE(?,cost_per_unit_kes), location=COALESCE(?,location), last_restocked=? WHERE id=?`).run(sku, name, category, quantity, unit, min_threshold, cost_per_unit_kes, location, new Date().toISOString().split('T')[0], id);
      return sendJSON(res, 200, { message: 'Inventory updated' });
    }

    if (pathname.match(/^\/api\/inventory\/(\d+)$/) && method === 'DELETE') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Inventory Manager access required');
      db.prepare('DELETE FROM inventory_items WHERE id = ?').run(pathname.split('/')[3]);
      return sendJSON(res, 200, { message: 'Item deleted' });
    }

    // ========================================================
    // INVENTORY SHORTAGE REQUEST (sends PO to Finance + Supplier)
    // ========================================================
    if (pathname === '/api/inventory/shortage-request' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Inventory Manager access required');
      const { item_id, supplier_id, quantity, delivery_option, notes } = await parseBody(req);
      if (!item_id || !supplier_id || !quantity) return sendError(res, 400, 'Item, supplier, and quantity are required');

      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(item_id);
      if (!item) return sendError(res, 404, 'Item not found');

      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplier_id);
      if (!supplier) return sendError(res, 404, 'Supplier not found');

      const totalCost = item.cost_per_unit_kes * quantity;
      const poNumber  = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderDate = new Date().toISOString().split('T')[0];
      const parlourAddr = "Steve's Massage Parlour, Valley Arcade, Nairobi";
      const chosenDelivery = delivery_option || 'Standard Courier (Nairobi Express Delivery)';

      const r = db.prepare(`
        INSERT INTO purchase_orders (po_number, supplier_id, item_id, item_name, quantity, unit_cost_kes, total_cost_kes, delivery_option, delivery_address, order_date, finance_status, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending Approval', ?)
      `).run(poNumber, supplier_id, item_id, item.name, quantity, item.cost_per_unit_kes, totalCost, chosenDelivery, parlourAddr, orderDate, notes || `Shortage reorder for ${item.name}`);
      const newPoId = Number(r.lastInsertRowid);

      // Notify Finance for approval
      db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('finance_manager', ?, ?, 'In-App')`).run(
        'PO Approval Required',
        `Purchase Order ${poNumber} for ${item.name} (Qty: ${quantity}, KES ${totalCost.toLocaleString()}) requires your Finance approval.`
      );

      // Notify Supplier user(s) linked to this supplier_id
      const supplierUsers = db.prepare('SELECT id FROM users WHERE supplier_id = ? AND role = ?').all(supplier_id, 'supplier');
      for (const su of supplierUsers) {
        db.prepare(`INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'In-App')`).run(su.id, 'New Purchase Order', `You have a new purchase order ${poNumber} for ${item.name} (Qty: ${quantity}) awaiting acknowledgement.`);
      }

      return sendJSON(res, 201, { message: `Shortage request ${poNumber} submitted for Finance approval`, po_number: poNumber, id: newPoId, po_id: newPoId });
    }

    // ========================================================
    // SUPPLIERS
    // ========================================================
    if (pathname === '/api/suppliers' && method === 'GET') {
      return sendJSON(res, 200, db.prepare('SELECT * FROM suppliers ORDER BY name').all());
    }

    if (pathname === '/api/suppliers' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager' && user.role !== 'finance_manager')) return sendError(res, 403, 'Staff access required');
      const { name, contact_person, phone, email, address, supplied_items, payment_terms } = await parseBody(req);
      if (!name || !contact_person || !phone || !email) return sendError(res, 400, 'Name, contact person, phone, and email required');
      const r = db.prepare(`INSERT INTO suppliers (name, contact_person, phone, email, address, supplied_items, payment_terms) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(name, contact_person, phone, email, address || '', supplied_items || '', payment_terms || '30 Days Invoice');
      return sendJSON(res, 201, { message: 'Supplier registered', id: Number(r.lastInsertRowid) });
    }

    if (pathname.match(/^\/api\/suppliers\/(\d+)$/) && method === 'DELETE') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Admin or Inventory Manager access required');
      db.prepare('DELETE FROM suppliers WHERE id = ?').run(pathname.split('/')[3]);
      return sendJSON(res, 200, { message: 'Supplier removed' });
    }

    // ========================================================
    // PURCHASE ORDERS
    // ========================================================
    if (pathname === '/api/purchase-orders' && method === 'GET') {
      let sql = `
        SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.email as supplier_email,
               s.address as supplier_address, s.payment_terms,
               s.bank_name, s.bank_account, s.mpesa_paybill, s.mpesa_till,
               i.sku as item_sku, i.unit as item_unit
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN inventory_items i ON po.item_id = i.id
        WHERE 1=1
      `;
      const params = [];

      // Supplier users only see their own POs
      if (user && user.role === 'supplier') {
        let supId = user.supplierId;
        if (!supId) {
          const uRow = db.prepare('SELECT supplier_id FROM users WHERE id = ?').get(user.userId);
          supId = uRow ? uRow.supplier_id : 1;
        }
        sql += ' AND po.supplier_id = ?'; params.push(supId);
      }

      if (query.status) { sql += ' AND po.status = ?'; params.push(query.status); }
      if (query.finance_status) { sql += ' AND po.finance_status = ?'; params.push(query.finance_status); }
      sql += ' ORDER BY po.order_date DESC';
      return sendJSON(res, 200, db.prepare(sql).all(...params));
    }

    if (pathname.match(/^\/api\/purchase-orders\/(\d+)$/) && method === 'GET') {
      const id = pathname.split('/')[3];
      const po = db.prepare(`
        SELECT po.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email,
               s.address as supplier_address, s.payment_terms,
               s.bank_name, s.bank_account, s.mpesa_paybill, s.mpesa_till,
               i.sku as item_sku, i.unit as item_unit, i.category as item_category
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN inventory_items i ON po.item_id = i.id
        WHERE po.id = ?
      `).get(id);
      if (!po) return sendError(res, 404, 'Purchase order not found');
      // Supplier can only view their own PO
      if (user && user.role === 'supplier') {
        let supId = user.supplierId;
        if (!supId) {
          const uRow = db.prepare('SELECT supplier_id FROM users WHERE id = ?').get(user.userId);
          supId = uRow ? uRow.supplier_id : 1;
        }
        if (po.supplier_id !== supId) {
          return sendError(res, 403, 'Access denied: You can only view your own purchase orders');
        }
      }
      return sendJSON(res, 200, po);
    }

    if (pathname === '/api/purchase-orders' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager' && user.role !== 'finance_manager')) return sendError(res, 403, 'Staff access required');
      const { supplier_id, item_id, item_name, quantity, unit_cost_kes, total_cost_kes, delivery_option, delivery_address, notes } = await parseBody(req);
      if (!supplier_id || !quantity) return sendError(res, 400, 'Supplier and quantity are required');

      let finalItemName = item_name;
      let finalItemId   = item_id || null;
      let unitCost      = unit_cost_kes || 0;
      let totalCost     = total_cost_kes;

      if (item_id) {
        const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(item_id);
        if (item) {
          finalItemName = item.name;
          finalItemId   = item.id;
          unitCost      = item.cost_per_unit_kes;
          totalCost     = totalCost || (unitCost * quantity);
        }
      }

      if (!finalItemName) return sendError(res, 400, 'Item name or item_id is required');
      if (!totalCost) totalCost = unitCost * quantity;

      const poNumber  = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderDate = new Date().toISOString().split('T')[0];
      const parlourAddr = delivery_address || "Steve's Massage Parlour, Valley Arcade, Nairobi";
      const chosenDelivery = delivery_option || 'Standard Courier (Nairobi Express Delivery)';

      const r = db.prepare(`
        INSERT INTO purchase_orders (po_number, supplier_id, item_id, item_name, quantity, unit_cost_kes, total_cost_kes, delivery_option, delivery_address, order_date, finance_status, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending Approval', ?)
      `).run(poNumber, supplier_id, finalItemId, finalItemName, quantity, unitCost, totalCost, chosenDelivery, parlourAddr, orderDate, notes || '');
      const newPoId = Number(r.lastInsertRowid);

      // Notify Finance for approval
      db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('finance_manager', ?, ?, 'In-App')`).run('PO Approval Required', `Purchase Order ${poNumber} for ${finalItemName} (Qty: ${quantity}, KES ${Number(totalCost).toLocaleString()}) requires your approval.`);

      // Notify Supplier users
      const supplierUsers = db.prepare('SELECT id FROM users WHERE supplier_id = ? AND role = ?').all(supplier_id, 'supplier');
      for (const su of supplierUsers) {
        db.prepare(`INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'In-App')`).run(su.id, 'New Purchase Order', `New PO ${poNumber} for ${finalItemName} (Qty: ${quantity}) is awaiting your acknowledgement.`);
      }

      return sendJSON(res, 201, { message: `Purchase order ${poNumber} submitted for Finance approval`, po_number: poNumber, id: newPoId, po_id: newPoId });
    }

    // Finance Review: Approve or Reject PO
    if (pathname.match(/^\/api\/purchase-orders\/(\d+)\/finance-review$/) && method === 'PUT') {
      if (!user || (user.role !== 'admin' && user.role !== 'finance_manager')) return sendError(res, 403, 'Finance Manager access required');
      const poId = pathname.split('/')[3];
      const { decision, feedback } = await parseBody(req);
      if (!decision || !['Approved', 'Rejected'].includes(decision)) return sendError(res, 400, 'Decision must be "Approved" or "Rejected"');

      const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
      if (!po) return sendError(res, 404, 'Purchase order not found');
      if (po.finance_status !== 'Pending') return sendError(res, 400, 'This PO has already been reviewed');

      const newStatus = decision === 'Approved' ? 'Approved' : 'Rejected';
      const now = new Date().toISOString();

      db.prepare(`UPDATE purchase_orders SET finance_status=?, finance_feedback=?, finance_reviewed_at=?, finance_reviewed_by=?, status=? WHERE id=?`).run(
        decision, feedback || '', now, user.name, newStatus, poId
      );

      // Notify Inventory Manager
      db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('inventory_manager', ?, ?, 'In-App')`).run(
        `PO ${po.po_number} ${decision}`,
        `Finance ${decision} Purchase Order ${po.po_number} for ${po.item_name}. ${feedback ? 'Feedback: ' + feedback : ''}`
      );

      // Notify Supplier users if approved
      if (decision === 'Approved') {
        const supplierUsers = db.prepare('SELECT id FROM users WHERE supplier_id = ? AND role = ?').all(po.supplier_id, 'supplier');
        for (const su of supplierUsers) {
          db.prepare(`INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'In-App')`).run(su.id, `PO ${po.po_number} Approved`, `Purchase Order ${po.po_number} for ${po.item_name} has been approved by Finance. Please acknowledge and prepare for delivery.`);
        }
      }

      return sendJSON(res, 200, { message: `Purchase order ${po.po_number} has been ${decision} by Finance` });
    }

    // Supplier Update PO Status (Acknowledge / In-Transit / Delivered)
    if (pathname.match(/^\/api\/purchase-orders\/(\d+)\/supplier-status$/) && method === 'PUT') {
      if (!user || (user.role !== 'supplier' && user.role !== 'admin')) return sendError(res, 403, 'Supplier access required');
      const poId = pathname.split('/')[3];
      const { status } = await parseBody(req);
      const validStatuses = ['Acknowledged', 'In-Transit', 'Delivered'];
      if (!status || !validStatuses.includes(status)) return sendError(res, 400, 'Status must be Acknowledged, In-Transit, or Delivered');

      const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
      if (!po) return sendError(res, 404, 'Purchase order not found');
      if (user.role === 'supplier') {
        let supId = user.supplierId;
        if (!supId) {
          const uRow = db.prepare('SELECT supplier_id FROM users WHERE id = ?').get(user.userId);
          supId = uRow ? uRow.supplier_id : 1;
        }
        if (po.supplier_id !== supId) return sendError(res, 403, 'Access denied: You can only update your own purchase orders');
      }
      if (po.finance_status !== 'Approved') return sendError(res, 400, 'Cannot update status: PO not approved by Finance yet');

      db.prepare('UPDATE purchase_orders SET status = ? WHERE id = ?').run(status, poId);

      // Notify Inventory Manager
      db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('inventory_manager', ?, ?, 'In-App')`).run(
        `PO ${po.po_number}: ${status}`, `Supplier updated Purchase Order ${po.po_number} status to "${status}".`
      );

      return sendJSON(res, 200, { message: `Purchase order ${po.po_number} status updated to ${status}` });
    }

    // Inventory Manager: Confirm Goods Received - generates GRN, increments stock
    if (pathname.match(/^\/api\/purchase-orders\/(\d+)\/receive$/) && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'inventory_manager')) return sendError(res, 403, 'Inventory Manager access required');
      const poId = pathname.split('/')[3];
      const po   = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
      if (!po) return sendError(res, 404, 'Purchase order not found');
      if (po.status === 'Received') return sendError(res, 400, 'This PO has already been received');
      if (po.finance_status !== 'Approved') return sendError(res, 400, 'PO must be approved by Finance before goods can be received');

      const grnNumber  = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const receivedAt = new Date().toISOString();
      db.prepare(`UPDATE purchase_orders SET status='Received', grn_number=?, received_date=?, received_by=? WHERE id=?`).run(grnNumber, receivedAt, user.name, poId);

      // Increment inventory stock
      let newQty = po.quantity, prevQty = 0, itemId = po.item_id;
      if (itemId) {
        const matchingItem = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(itemId);
        if (matchingItem) {
          prevQty = matchingItem.quantity;
          newQty  = matchingItem.quantity + po.quantity;
          db.prepare('UPDATE inventory_items SET quantity = ?, last_restocked = ? WHERE id = ?').run(newQty, new Date().toISOString().split('T')[0], itemId);
        }
      } else {
        // Fuzzy name match fallback
        const matchingItem = db.prepare('SELECT * FROM inventory_items WHERE LOWER(name) LIKE LOWER(?)').get(`%${po.item_name}%`);
        if (matchingItem) {
          itemId  = matchingItem.id;
          prevQty = matchingItem.quantity;
          newQty  = matchingItem.quantity + po.quantity;
          db.prepare('UPDATE inventory_items SET quantity = ?, last_restocked = ? WHERE id = ?').run(newQty, new Date().toISOString().split('T')[0], itemId);
        }
      }

      // Record stock movement IN
      db.prepare(`INSERT INTO stock_movements (item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, reason, reference_no, recorded_by) VALUES (?, ?, 'IN', ?, ?, ?, ?, ?, ?)`).run(
        itemId, po.item_name, po.quantity, prevQty, newQty, `Goods received via PO ${po.po_number} (GRN: ${grnNumber})`, po.po_number, user.name
      );

      // Record finance expense
      db.prepare(`INSERT INTO finance_transactions (type, category, description, amount_kes, transaction_date, reference_no, po_id) VALUES ('Expense', 'Supplies Restock', ?, ?, ?, ?, ?)`).run(
        `GRN ${grnNumber}: ${po.item_name} x${po.quantity} from PO ${po.po_number}`, po.total_cost_kes, new Date().toISOString().split('T')[0], po.po_number, poId
      );

      // Notify Finance
      db.prepare(`INSERT INTO notifications (role_target, title, message, channel) VALUES ('finance_manager', ?, ?, 'In-App')`).run(
        `GRN ${grnNumber} Generated`, `Inventory received goods for PO ${po.po_number}. GRN: ${grnNumber}. KES ${Number(po.total_cost_kes).toLocaleString()} expense recorded.`
      );

      // Notify Supplier
      const supplierUsers = db.prepare('SELECT id FROM users WHERE supplier_id = ? AND role = ?').all(po.supplier_id, 'supplier');
      for (const su of supplierUsers) {
        db.prepare(`INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'In-App')`).run(su.id, `Goods Received - GRN ${grnNumber}`, `Your delivery for PO ${po.po_number} has been confirmed received. GRN: ${grnNumber}`);
      }

      return sendJSON(res, 200, {
        message: `Goods received! GRN ${grnNumber} generated. Stock incremented by ${po.quantity} units.`,
        grn_number: grnNumber, po_number: po.po_number, new_stock_quantity: newQty
      });
    }

    // Finance Manager: Pay Supplier (Only after Goods Received / GRN generated!)
    if (pathname.match(/^\/api\/purchase-orders\/(\d+)\/pay-supplier$/) && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'finance_manager')) return sendError(res, 403, 'Finance access required');
      const poId = pathname.split('/')[3];
      const po   = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
      if (!po) return sendError(res, 404, 'Purchase order not found');

      // CRITICAL CHECK: Payment only AFTER receiving goods!
      if (po.status !== 'Received') {
        return sendError(res, 400, 'Supplier payment can only be disbursed after goods are physically received and GRN generated');
      }
      if (po.payment_status === 'Paid') {
        return sendError(res, 400, 'This purchase order has already been paid');
      }

      const { payment_method, reference_no, amount_paid, payment_date, notes } = await parseBody(req);
      const receiptNo   = `SPR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const pMethod     = payment_method || 'M-Pesa Business Till';
      const refNo       = reference_no || `MPESA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const pDate       = payment_date || new Date().toISOString().split('T')[0];
      const amount      = Number(amount_paid || po.total_cost_kes);
      const paidBy      = (user.name || 'Patrick Mutua') + ' (Finance Officer)';
      const pNotes      = notes || '';

      // 1. Update Purchase Order
      db.prepare(`
        UPDATE purchase_orders 
        SET payment_status = 'Paid',
            payment_receipt_no = ?,
            payment_date = ?,
            payment_method = ?,
            payment_reference = ?,
            paid_by = ?,
            payment_notes = ?
        WHERE id = ?
      `).run(receiptNo, pDate, pMethod, refNo, paidBy, pNotes, poId);

      // 2. Insert into supplier_payments audit table
      try {
        db.prepare(`
          INSERT INTO supplier_payments (payment_receipt_no, po_id, supplier_id, amount_paid, payment_method, reference_no, payment_date, paid_by, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(receiptNo, poId, po.supplier_id, amount, pMethod, refNo, pDate, paidBy, pNotes);
      } catch (_) {}

      // 3. Record in finance_transactions
      db.prepare(`
        INSERT INTO finance_transactions (type, category, description, amount_kes, transaction_date, reference_no, po_id)
        VALUES ('Expense', 'Supplier Disbursement', ?, ?, ?, ?, ?)
      `).run(`Supplier Disbursement: ${po.item_name} via ${pMethod} (GRN: ${po.grn_number})`, amount, pDate, receiptNo, poId);

      // 4. Notify Supplier
      const supplierUsers = db.prepare('SELECT id FROM users WHERE supplier_id = ? AND role = ?').all(po.supplier_id, 'supplier');
      for (const su of supplierUsers) {
        db.prepare(`INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'In-App')`).run(
          su.id, 
          `Payment Remittance Disbursed - ${receiptNo}`,
          `Steve's Massage Parlour processed payment of KES ${amount.toLocaleString()} for PO ${po.po_number}. Receipt: ${receiptNo}. Ref: ${refNo}.`
        );
      }

      return sendJSON(res, 200, {
        message: `Payment authorized! Official Receipt ${receiptNo} generated.`,
        receipt_no: receiptNo,
        po_id: poId
      });
    }

    // Get Payment Receipt Details
    if (pathname.match(/^\/api\/purchase-orders\/(\d+)\/payment-receipt$/) && method === 'GET') {
      const poId = pathname.split('/')[3];
      const sql = `
        SELECT po.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone,
               s.email as supplier_email, s.address as supplier_address, s.payment_terms,
               s.bank_name, s.bank_account, s.mpesa_paybill, s.mpesa_till
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `;
      const po = db.prepare(sql).get(poId);
      if (!po) return sendError(res, 404, 'Purchase order not found');
      if (po.payment_status !== 'Paid' && !po.payment_receipt_no) return sendError(res, 404, 'Payment receipt not yet issued for this PO');
      return sendJSON(res, 200, po);
    }

    // ========================================================
    // FINANCE MODULE
    // ========================================================
    if (pathname === '/api/finance/overview' && method === 'GET') {
      if (!user || (user.role !== 'admin' && user.role !== 'finance_manager')) return sendError(res, 403, 'Finance Manager access required');
      const totalIncome  = db.prepare("SELECT COALESCE(SUM(amount_kes), 0) as total FROM finance_transactions WHERE type='Income'").get().total;
      const totalExpense = db.prepare("SELECT COALESCE(SUM(amount_kes), 0) as total FROM finance_transactions WHERE type='Expense'").get().total;
      const netProfit    = totalIncome - totalExpense;
      const transactions = db.prepare('SELECT * FROM finance_transactions ORDER BY transaction_date DESC, id DESC LIMIT 30').all();
      const budgets      = db.prepare('SELECT * FROM budgets ORDER BY month DESC').all();
      const pendingPOs   = db.prepare(`
        SELECT po.*, s.name as supplier_name FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.finance_status = 'Pending' ORDER BY po.order_date DESC
      `).all();
      return sendJSON(res, 200, { totalIncome, totalExpense, netProfit, transactions, budgets, pendingPOs });
    }

    if (pathname === '/api/finance/transactions' && method === 'POST') {
      if (!user || (user.role !== 'admin' && user.role !== 'finance_manager')) return sendError(res, 403, 'Finance Manager access required');
      const { type, category, description, amount_kes, transaction_date, reference_no } = await parseBody(req);
      if (!type || !category || !description || !amount_kes) return sendError(res, 400, 'Type, category, description, and amount required');
      const date = transaction_date || new Date().toISOString().split('T')[0];
      const ref  = reference_no || `TXN-${Date.now()}`;
      db.prepare(`INSERT INTO finance_transactions (type, category, description, amount_kes, transaction_date, reference_no) VALUES (?, ?, ?, ?, ?, ?)`).run(type, category, description, amount_kes, date, ref);
      return sendJSON(res, 201, { message: 'Transaction recorded' });
    }

    // ========================================================
    // INQUIRIES
    // ========================================================
    if (pathname === '/api/inquiries' && method === 'POST') {
      const { name, email, phone, subject, message } = await parseBody(req);
      if (!name || !email || !subject || !message) return sendError(res, 400, 'Name, email, subject, and message required');
      db.prepare(`INSERT INTO inquiries (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, 'New')`).run(name, email, phone || '', subject, message);
      return sendJSON(res, 201, { message: "Thank you! Your message has been sent to Steve's Massage Parlor management." });
    }

    if (pathname === '/api/inquiries' && method === 'GET') {
      if (!user || user.role !== 'admin') return sendError(res, 403, 'Admin access required');
      return sendJSON(res, 200, db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all());
    }

    if (pathname.match(/^\/api\/inquiries\/(\d+)\/status$/) && method === 'PUT') {
      if (!user || user.role !== 'admin') return sendError(res, 403, 'Admin access required');
      const { status } = await parseBody(req);
      db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, pathname.split('/')[3]);
      return sendJSON(res, 200, { message: 'Inquiry status updated' });
    }

    // ========================================================
    // NOTIFICATIONS
    // ========================================================
    if (pathname === '/api/notifications' && method === 'GET') {
      if (!user) return sendError(res, 401, 'Unauthorized');
      let notifications;
      if (user.role === 'admin') {
        notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
      } else if (user.role === 'therapist') {
        // Therapists only see notifications addressed specifically to their user_id
        // (not all role_target='therapist' notifications which would leak cross-therapist data)
        notifications = db.prepare(`
          SELECT * FROM notifications
          WHERE user_id = ?
          ORDER BY created_at DESC LIMIT 30
        `).all(user.userId);
      } else {
        // Finance, Inventory, Service, Supplier — user-specific + role-targeted notifications
        notifications = db.prepare(`
          SELECT * FROM notifications
          WHERE user_id = ? OR role_target = ?
          ORDER BY created_at DESC LIMIT 30
        `).all(user.userId, user.role);
      }
      return sendJSON(res, 200, notifications);
    }

    if (pathname.match(/^\/api\/notifications\/(\d+)\/read$/) && method === 'PUT') {
      if (!user) return sendError(res, 401, 'Unauthorized');
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(pathname.split('/')[3]);
      return sendJSON(res, 200, { message: 'Notification marked as read' });
    }

    if (pathname === '/api/notifications/read-all' && method === 'POST') {
      if (!user) return sendError(res, 401, 'Unauthorized');
      if (user.role === 'admin') {
        db.prepare('UPDATE notifications SET is_read = 1').run();
      } else if (user.role === 'therapist') {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.userId);
      } else {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR role_target = ?').run(user.userId, user.role);
      }
      return sendJSON(res, 200, { message: 'All notifications marked as read' });
    }

    // ========================================================
    // REPORTS & DASHBOARD
    // ========================================================
    if (pathname === '/api/reports/dashboard' && method === 'GET') {
      if (!user || (user.role !== 'admin' && user.role !== 'finance_manager' && user.role !== 'service_manager' && user.role !== 'inventory_manager')) {
        return sendError(res, 403, 'Staff access required');
      }
      const totalAppointments   = db.prepare('SELECT COUNT(*) as cnt FROM appointments').get().cnt;
      const completedAppointments = db.prepare("SELECT COUNT(*) as cnt FROM appointments WHERE status='Completed'").get().cnt;
      const pendingAppointments  = db.prepare("SELECT COUNT(*) as cnt FROM appointments WHERE status IN ('Pending','Confirmed')").get().cnt;
      const totalRevenue         = db.prepare("SELECT COALESCE(SUM(amount_kes),0) as rev FROM payments WHERE status='Completed'").get().rev;
      const totalCustomers       = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='customer'").get().cnt;
      const activeTherapists     = db.prepare('SELECT COUNT(*) as cnt FROM therapists WHERE active=1').get().cnt;
      const lowStockItems        = db.prepare('SELECT COUNT(*) as cnt FROM inventory_items WHERE quantity <= min_threshold').get().cnt;

      const popularServices = db.prepare(`
        SELECT s.name, COUNT(a.id) as booking_count, COALESCE(SUM(a.total_price_kes),0) as total_earned
        FROM services s LEFT JOIN appointments a ON a.service_id = s.id
        GROUP BY s.id ORDER BY booking_count DESC LIMIT 5
      `).all();

      const therapistPerformance = db.prepare(`
        SELECT t.name, t.specialization, t.rating, COUNT(a.id) as total_sessions
        FROM therapists t LEFT JOIN appointments a ON a.therapist_id = t.id AND a.status='Completed'
        GROUP BY t.id ORDER BY total_sessions DESC
      `).all();

      return sendJSON(res, 200, { totalAppointments, completedAppointments, pendingAppointments, totalRevenue, totalCustomers, activeTherapists, lowStockItems, popularServices, therapistPerformance });
    }

    return sendError(res, 404, 'API endpoint not found');

  } catch (err) {
    console.error('Server Error:', err.message, err.stack);
    return sendError(res, 500, 'Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  STEVE'S MASSAGE PARLOR MANAGEMENT SYSTEM`);
  console.log(`  Kenya Methodist University - DBIT 226`);
  console.log(`  Terence Mwaaki (BIT-0-8106-3/2025)`);
  console.log(`=======================================================`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`=======================================================`);
  console.log(`  DEMO LOGIN CREDENTIALS:`);
  console.log(`  Administrator:      admin@stevesmassage.co.ke      / Admin@123`);
  console.log(`  Finance Officer:    finance@stevesmassage.co.ke    / Finance@123`);
  console.log(`  Inventory Manager:  inventory@stevesmassage.co.ke  / Inventory@123`);
  console.log(`  Services Manager:   services@stevesmassage.co.ke   / Services@123`);
  console.log(`  Therapist (Grace):  grace@stevesmassage.co.ke      / Grace@123`);
  console.log(`  Therapist (David):  david@stevesmassage.co.ke      / David@123`);
  console.log(`  Therapist (Amina):  amina@stevesmassage.co.ke      / Amina@123`);
  console.log(`  Therapist (Brian):  brian@stevesmassage.co.ke      / Brian@123`);
  console.log(`  Supplier (Jared):   supplier@spasupplies.co.ke     / Supplier@123`);
  console.log(`  Supplier (Susan):   sales@kenyalinens.co.ke        / Supplier@123`);
  console.log(`  Customer (Terence): terence@example.com            / Client@123`);
  console.log(`  Customer (Faith):   faith@example.com              / Client@123`);
  console.log(`=======================================================`);
});
