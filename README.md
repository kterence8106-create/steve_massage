# 🌿 Steve's Massage Parlour — How to Access the Website

**Academic Institution:** Kenya Methodist University (KEMU)
**Unit:** Research Project Proposal (DBIT 226)
**Researcher:** Terence Mwaaki — `BIT-0-8106-3/2025`
**Supervisor:** Mr. Austin Wanjala

---

## 🌐 Option A — Access the Live Website (Online)

The system is hosted online and can be accessed from any device with a browser.

### Step 1 — Open the Website
Go to your browser (Chrome, Edge, Firefox) and type the URL:

```
https://steves-massage-parlour.onrender.com
```

> ⏳ **First load may take up to 30 seconds** — the free server wakes up on first visit. After that it runs normally.

---

### Step 2 — Choose Your Login

You will see the login page. Use any of the accounts below depending on the role you want to explore:

| Role | Email | Password | What You Can Do |
|---|---|---|---|
| 👑 **Admin** | `admin@stevesmassage.co.ke` | `Admin@123` | Manage staff, roles, full system overview |
| 💰 **Finance Officer** | `finance@stevesmassage.co.ke` | `Finance@123` | View payments, pay suppliers, expenses, billing |
| 📦 **Inventory Manager** | `inventory@stevesmassage.co.ke` | `Inventory@123` | Manage stock, purchase orders, suppliers |
| 🗂️ **Service Manager** | `services@stevesmassage.co.ke` | `Services@123` | Manage services, therapist assignments, pricing |
| 💆 **Therapist (Grace)** | `grace@stevesmassage.co.ke` | `Grace@123` | View appointments, session records, schedule |
| 💆 **Therapist (David)** | `david@stevesmassage.co.ke` | `David@123` | View appointments, session records, schedule |
| 💆 **Therapist (Amina)** | `amina@stevesmassage.co.ke` | `Amina@123` | View appointments, session records, schedule |
| 💆 **Therapist (Brian)** | `brian@stevesmassage.co.ke` | `Brian@123` | View appointments, session records, schedule |
| 🏢 **Supplier 1 (Nairobi Herbal)** | `supplier@spasupplies.co.ke` | `Supplier@123` | View purchase orders from the parlour |
| 🏢 **Supplier 2 (Kenya Linens)** | `sales@kenyalinens.co.ke` | `Supplier@123` | View purchase orders from the parlour |
| 🏢 **Supplier 3 (Dr. Peter Karanja)** | `info@afromedwellness.com` | `Supplier@123` | Afromed Wellness Equipment POs & invoices |
| 👤 **Customer 1** | `terence@example.com` | `Client@123` | Book appointments, make payments, view history |
| 👤 **Customer 2** | `faith@example.com` | `Client@123` | Book appointments, make payments, view history |

---

### Step 3 — Explore the Dashboard

After logging in, each role sees its own dashboard:

- **Admin** → Full system: staff, reports, finances, inventory, bookings
- **Finance** → Payments received, supplier payments, expense tracking
- **Inventory** → Stock levels, purchase orders, supplier management
- **Therapist** → Today's appointments, session notes, shift roster
- **Supplier** → Purchase orders raised by the parlour
- **Customer** → Book a massage, pay via M-Pesa, view booking history

---

### Step 4 — Log Out

Click your **name or avatar** in the top-right corner → click **"Logout"**

---

---

## 💻 Option B — Run Locally on Your Computer (Offline)

Use this if you want to run the system on your own machine without internet.

### Requirements
- [Node.js v22+](https://nodejs.org) installed on your PC
- The project files from GitHub: `https://github.com/kterence8106-create/steve_massage`

---

### Step 1 — Download the Project

**Option 1 — Using Git:**
```bash
git clone https://github.com/kterence8106-create/steve_massage.git
cd steve_massage
```

**Option 2 — Download ZIP:**
1. Go to `https://github.com/kterence8106-create/steve_massage`
2. Click the green **"Code"** button → **"Download ZIP"**
3. Extract the ZIP folder anywhere on your computer (e.g. `C:\Users\YourName\steve_massage`)

---

### Step 2 — Start the Server

Open **PowerShell** or **Command Prompt** inside the project folder and run:

```bash
node server.js
```

You should see:
```
✅  Steve's Massage Parlour server running
   Local:   http://localhost:3000
```

---

### Step 3 — Open the Website

Open your browser and go to:

```
http://localhost:3000
```

The login page will appear. Use any of the credentials from the table above.

---

### Step 4 — Stop the Server

When you are done, go back to PowerShell and press:

```
Ctrl + C
```

---

---

## 🛠️ Option C — PHP/MySQL Version (XAMPP)

If you want to run the PHP version of the system:

### Requirements
- [XAMPP](https://www.apachefriends.org) installed

### Steps

1. Copy the project folder into:
   ```
   C:\xampp\htdocs\steve_massage\
   ```

2. Open **XAMPP Control Panel** → Start **Apache** and **MySQL**

3. Go to `http://localhost/phpmyadmin/` → click **Import** → select:
   ```
   database\steve_massage.sql
   ```
   Click **Go**

4. Open your browser and go to:
   ```
   http://localhost/steve_massage/
   ```

5. Log in using the same credentials in the table above.

---

## ❓ Common Issues

| Problem | Solution |
|---|---|
| Live site takes long to load | Wait 30 seconds — the free server is waking up |
| "Cannot connect" on localhost | Make sure `node server.js` is running in PowerShell |
| Wrong password error | Check you are using the right email/password pair from the table |
| XAMPP database error | Make sure you imported `steve_massage.sql` in phpMyAdmin |
| Port 3000 already in use | Run `node server.js` only once, or change PORT in server.js |

---

## 📞 Contact

**Researcher:** Terence Mwaaki
**Email:** `terencemwaaki@gmail.com`
**Institution:** Kenya Methodist University — DBIT 226
