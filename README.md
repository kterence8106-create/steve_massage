# Steve's Massage Parlor Web-Based Management System

**Academic Institution:** Kenya Methodist University (KEMU)  
**School:** School of Computing and Informatics  
**Department:** Department of Computer Science  
**Unit Title:** Research Project Proposal (DBIT 226)  
**Researcher / Candidate:** Terence Mwaaki (Registration No: `BIT-0-8106-3/2025`)  
**Supervisor:** Mr. Austin Wanjala  

---

## 🌿 Project Overview

**Steve's Massage Parlor Management System** is a full-stack, enterprise-grade web application engineered to modernize and automate daily operations at Steve's Massage Parlor in Valley Arcade, Nairobi, Kenya. The system replaces manual paper booking ledgers, physical treatment logs, and disjointed inventory tracking with a centralized, role-based digital platform. 

The application provides:
- Client self-service online booking with real-time therapist scheduling conflict prevention
- Safaricom **M-Pesa STK Push** simulation with verifiable transaction references in Kenyan Shillings (KES)
- Comprehensive **Inventory & Supplies Management** with SKU tracking, stock movement audit trails, and Purchase Order vouchers
- Therapist Clinical Portal for session status tracking, daily schedules, shift rosters, and clinical treatment records
- Executive Management Portal with real-time business telemetry, finance and budget ledgers, and user account administration
- Full compliance with the **Kenya Data Protection Act (2019)** regarding client health notes and personal contact records

---

## 🛠️ Architecture & Tech Stack

- **Backend:** Native **Node.js** HTTP server (`node:http`, `node:crypto`, `node:url`, `node:fs`, `node:path`) — **zero external npm dependencies required**.
- **Runtime Database:** Native **`node:sqlite`** embedded database (`database/steves_massage.db`) with automatic schema initialization and initial seeding upon first launch.
- **Academic MySQL Submission:** Complete MySQL 8.0 DDL ([`database/mysql_schema.sql`](file:///c:/Users/HomePC/Downloads/steves_massage/database/mysql_schema.sql)) and DML seed data ([`database/mysql_seed.sql`](file:///c:/Users/HomePC/Downloads/steves_massage/database/mysql_seed.sql)) for academic defense and XAMPP/phpMyAdmin grading.
- **Frontend:** Responsive Single-Page Application (SPA) built with **Semantic HTML5**, **Modern CSS3**, and **Vanilla JavaScript (ES6+)**.
- **Aesthetic:** Luxury wellness spa design featuring Forest Emerald (`#1C2E26`) and Champagne Gold (`#C5A059`), with typography powered by *Playfair Display* and *Plus Jakarta Sans* via Google Fonts CDN.
- **Icons & Media:** Font Awesome 6 CDN and custom SVG branding assets.

---

## 📦 Scope of Modules (18 Modules Implemented)

| # | Module | Description & Key Capabilities |
|---|---|---|
| **1** | **Database Module** | Relational schemas across 15 entities (users, therapists, services, appointments, payments, inventory, suppliers, POs, stock movements, finance, inquiries, notifications). |
| **2** | **Administrator Module** | Executive KPI telemetry, bookings control, service pricing, therapist management, user account control, and system administration. |
| **3** | **Customer Module** | Account profile management, appointment history, printable payment receipts, and review submission. |
| **4** | **Therapist Module** | Daily assigned client schedule, session status tracking (`In-Session`, `Completed`), clinical notes recording, and weekly shift roster configuration. |
| **5** | **Appointment Booking Module** | 4-step wizard: Service selection, real-time date/slot availability, client medical/health preferences, and instant confirmation. |
| **6** | **Payment Module** | Multi-method payments in KES (M-Pesa STK push simulation, Credit/Debit Card, Cash) with transaction references and printable receipts. |
| **7** | **Scheduling Module** | Conflict-free slot booking algorithm with 15-minute room turnaround buffers and therapist working hours enforcement. |
| **8** | **Service Management Module** | CRUD operations for treatments across 4 categories, customizable duration (mins), prices in KES, and health benefits. |
| **9** | **Inventory Manager Module** | 5-part stock suite: Catalog with SKU and storage location, real-time valuation, low-stock threshold alerts, stock adjustment (Dispense/Restock/Recount), and stock movement audit log. |
| **10** | **Supplier & PO Module** | Vendor directory, payment terms, vendor ratings, official Purchase Order generation, and goods receipt with automated stock and finance expense updates. |
| **11** | **Finance Manager Module** | Income vs. Expenses tracking, net cashflow, operational department budgets, and financial transaction ledger. |
| **12** | **Notification Module** | Automated SMS and In-App notification simulation for booking confirmations, M-Pesa receipts, and low-stock alerts. |
| **13** | **Search Module** | Real-time client search for treatments by keywords, name, duration, and category filters. |
| **14** | **Contact Us Module** | Valley Arcade location details, operating hours, and interactive inquiry form linked directly to Admin inbox. |
| **15** | **Feedback Module** | 5-star verified customer ratings, testimonials carousel, and direct review submission. |
| **16** | **About Us Module** | Company background, mission, vision, 4 core wellness pillars, and Kenya Data Protection Act compliance statement. |
| **17** | **Reports Module** | Executive analytics, service revenue contribution, therapist productivity ratings, printable A4 business reports, and CSV export. |
| **18** | **Help Module** | Interactive FAQ accordion providing guidance on session preparation, payments, and cancellations. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js v22 or higher** (uses native `node:sqlite`). No external `npm install` packages are required.

### 2. Launch the Application
Run the following command from the project root directory:

```bash
node server.js
```

Then open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔑 Demonstration User Credentials

The database comes pre-seeded with functional demonstration accounts for every role across the system. You can log in using their credentials or click the **"Demo Portals"** pills in the top bar:

| System User Role | Representative Name | Email Address | Password | Dedicated Portal & Scope |
|---|---|---|---|---|
| **Administrator** | Steve Mwangi | `admin@stevesmassage.co.ke` | `Admin@123` | Master Executive Suite, System Config & Full Oversight |
| **Finance Director** | Patrick Mutua | `finance@stevesmassage.co.ke` | `Finance@123` | PO Approvals Workflow, M-Pesa Revenues, Ledgers, Budgets |
| **Inventory Manager** | Mercy Chebet | `inventory@stevesmassage.co.ke` | `Inventory@123` | Consumables Catalog, Shortage Requests, Receiving & GRNs |
| **Service Manager** | Lucas Ochieng | `services@stevesmassage.co.ke` | `Services@123` | Service Appointments, Treatment Catalog & Staff Rosters |
| **Therapist (Grace)** | Grace Muthoni | `grace@stevesmassage.co.ke` | `Grace@123` | Grace's Clinical Schedule, Patient Notes & Session Status |
| **Therapist (David)** | David Otieno | `david@stevesmassage.co.ke` | `David@123` | David's Clinical Schedule, Patient Notes & Session Status |
| **Therapist (Amina)** | Amina Hassan | `amina@stevesmassage.co.ke` | `Amina@123` | Amina's Clinical Schedule, Patient Notes & Session Status |
| **Therapist (Brian)** | Brian Kiprop | `brian@stevesmassage.co.ke` | `Brian@123` | Brian's Clinical Schedule, Patient Notes & Session Status |
| **Supplier (Vendor 1)** | Jared Momanyi (Nairobi Herbal Ltd) | `supplier@spasupplies.co.ke` | `Supplier@123` | Supplier Orders Dashboard, Order Acknowledgment, Transit Tracking |
| **Supplier (Vendor 2)** | Susan Wambui (Kenya Linens Mills) | `sales@kenyalinens.co.ke` | `Supplier@123` | Dedicated Supplier Dashboard for Linens & Textile Orders |
| **Customer (Client 1)** | Terence Mwaaki | `terence@example.com` | `Client@123` | Customer Booking, M-Pesa Confirmation, Appointment History |
| **Customer (Client 2)** | Faith Wanjiku | `faith@example.com` | `Client@123` | Customer Booking, Appointment History & Feedback |

---

## 🗄️ Database Import Instructions for MySQL / XAMPP

If presenting your proposal or project defense with XAMPP / phpMyAdmin:
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin/`.
3. Create a new database named `steves_massage_db`.
4. Go to the **Import** tab and select [`database/mysql_schema.sql`](file:///c:/Users/HomePC/Downloads/steves_massage/database/mysql_schema.sql).
5. Next, import [`database/mysql_seed.sql`](file:///c:/Users/HomePC/Downloads/steves_massage/database/mysql_seed.sql) to populate initial demonstration records.

---

## 📄 Unit & Candidate Reference

- **University:** Kenya Methodist University (KEMU)
- **School:** School of Computing and Informatics
- **Department:** Department of Computer Science
- **Unit Code:** DBIT 226 Research Project
- **Candidate:** Terence Mwaaki (`BIT-0-8106-3/2025`)
- **Supervisor:** Mr. Austin Wanjala
