// Steve's Massage Parlor Management System - Administrator Suite
// DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025)

const Admin = {
  currentTab: 'overview',

  async init() {
    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2>Executive Management Portal</h2>
          <p class="text-muted">Steve's Massage Parlor • Administrator Suite (DBIT 226)</p>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline btn-sm" onclick="App.closePortal()">
            <i class="fas fa-eye"></i> View Public Site
          </button>
          <button class="btn btn-gold btn-sm" onclick="Reports.printBusinessSummary()">
            <i class="fas fa-print"></i> Print Executive Summary
          </button>
        </div>
      </div>

      <div class="portal-nav-tabs">
        <button class="portal-tab active" id="tab-btn-overview" onclick="Admin.switchTab('overview')"><i class="fas fa-chart-line"></i> Dashboard</button>
        <button class="portal-tab" id="tab-btn-appointments" onclick="Admin.switchTab('appointments')"><i class="fas fa-calendar-check"></i> Bookings Manager</button>
        <button class="portal-tab" id="tab-btn-services" onclick="Admin.switchTab('services')"><i class="fas fa-spa"></i> Services & Pricing</button>
        <button class="portal-tab" id="tab-btn-therapists" onclick="Admin.switchTab('therapists')"><i class="fas fa-user-md"></i> Therapists</button>
        <button class="portal-tab" id="tab-btn-inventory" onclick="Admin.switchTab('inventory')"><i class="fas fa-boxes"></i> Inventory Manager</button>
        <button class="portal-tab" id="tab-btn-suppliers" onclick="Admin.switchTab('suppliers')"><i class="fas fa-truck-loading"></i> Suppliers & POs</button>
        <button class="portal-tab" id="tab-btn-finance" onclick="Admin.switchTab('finance')"><i class="fas fa-wallet"></i> Finance & Budgets</button>
        <button class="portal-tab" id="tab-btn-inquiries" onclick="Admin.switchTab('inquiries')"><i class="fas fa-envelope-open-text"></i> Client Inquiries</button>
        <button class="portal-tab" id="tab-btn-notifications" onclick="Admin.switchTab('notifications')"><i class="fas fa-bell"></i> Notification Logs</button>
        <button class="portal-tab" id="tab-btn-users" onclick="Admin.switchTab('users')"><i class="fas fa-users-cog"></i> User Accounts</button>
        <button class="portal-tab" id="tab-btn-reports" onclick="Admin.switchTab('reports')"><i class="fas fa-file-invoice-dollar"></i> Reports Module</button>
      </div>

      <div id="admin-main-view"></div>
    `;

    this.switchTab('overview');
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.portal-tab').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-btn-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (tab === 'overview') this.renderOverview();
    else if (tab === 'appointments') this.renderAppointments();
    else if (tab === 'services') this.renderServices();
    else if (tab === 'therapists') this.renderTherapists();
    else if (tab === 'inventory') InventoryManager.init('admin-main-view');
    else if (tab === 'suppliers') {
      InventoryManager.activeSubTab = 'suppliers';
      InventoryManager.init('admin-main-view');
    }
    else if (tab === 'finance') this.renderFinance();
    else if (tab === 'inquiries') this.renderInquiries();
    else if (tab === 'notifications') this.renderNotifications();
    else if (tab === 'users') this.renderUsers();
    else if (tab === 'reports') Reports.render();
  },

  // 1. DASHBOARD OVERVIEW
  async renderOverview() {
    const container = document.getElementById('admin-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;">Generating real-time business telemetry...</div>';

    try {
      const data = await App.api('/api/reports/dashboard');
      container.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="fas fa-calendar-alt"></i></div>
            <div class="kpi-info">
              <h4>Total Bookings</h4>
              <h2>${data.totalAppointments}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="fas fa-check-double"></i></div>
            <div class="kpi-info">
              <h4>Completed Sessions</h4>
              <h2>${data.completedAppointments}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
            <div class="kpi-info">
              <h4>Revenue (KES)</h4>
              <h2>KES ${Number(data.totalRevenue).toLocaleString()}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon ${data.lowStockItems > 0 ? 'danger' : 'primary'}">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="kpi-info">
              <h4>Stock Alerts</h4>
              <h2>${data.lowStockItems} Items</h2>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px;">
          <!-- Popular Services -->
          <div class="table-card">
            <div class="table-header-bar">
              <h3>Top Massage Services by Revenue</h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Bookings</th>
                    <th>Total Earned (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.popularServices.map(s => `
                    <tr>
                      <td><strong>${s.name}</strong></td>
                      <td><span class="badge badge-primary">${s.booking_count} Sessions</span></td>
                      <td><strong>KES ${Number(s.total_earned).toLocaleString()}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Therapist Performance -->
          <div class="table-card">
            <div class="table-header-bar">
              <h3>Therapist Performance</h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Therapist</th>
                    <th>Sessions</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.therapistPerformance.map(t => `
                    <tr>
                      <td><strong>${t.name}</strong></td>
                      <td>${t.total_sessions} completed</td>
                      <td><span class="text-gold"><i class="fas fa-star"></i> ${t.rating}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error loading overview: ${err.message}</div>`;
    }
  },

  // 2. APPOINTMENTS MANAGER
  async renderAppointments(statusFilter = '') {
    const container = document.getElementById('admin-main-view');
    container.innerHTML = '<div style="text-align:center; padding:30px;">Loading bookings...</div>';

    try {
      const appointments = await App.api(`/api/appointments${statusFilter ? `?status=${statusFilter}` : ''}`);
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>All Parlor Bookings</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Filter, assign therapists, update session states, and print receipts</p>
            </div>
            <div style="display:flex; gap:10px;">
              <select class="form-control" style="width:180px; padding:8px 12px;" onchange="Admin.renderAppointments(this.value)">
                <option value="">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In-Session">In-Session</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Ref No</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Therapist</th>
                  <th>Date & Time</th>
                  <th>Price (KES)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${appointments.map(a => `
                  <tr>
                    <td><strong>${a.reference_no}</strong></td>
                    <td>
                      <div>${a.customer_name}</div>
                      <small class="text-muted">${a.customer_phone}</small>
                    </td>
                    <td>${a.service_name}</td>
                    <td>${a.therapist_name}</td>
                    <td>${a.appointment_date} @ ${a.appointment_time}</td>
                    <td>KES ${Number(a.total_price_kes).toLocaleString()}</td>
                    <td>
                      <select class="form-control" style="padding:4px 8px; font-size:0.8rem; width:125px;" onchange="Admin.updateApptStatus(${a.id}, this.value)">
                        <option value="Confirmed" ${a.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="In-Session" ${a.status === 'In-Session' ? 'selected' : ''}>In-Session</option>
                        <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${a.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="Booking.viewReceipt('${a.reference_no}', '${a.service_name}', '${a.therapist_name}', '${a.appointment_date}', '${a.appointment_time}', ${a.total_price_kes}, '${a.payment_method || 'M-Pesa'}')">
                        <i class="fas fa-print"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  async updateApptStatus(id, newStatus) {
    try {
      await App.api(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      App.showToast(`Appointment status updated to ${newStatus}`);
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 3. SERVICES MANAGER
  async renderServices() {
    const container = document.getElementById('admin-main-view');
    try {
      const services = await App.api('/api/services');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Massage Services & Price List (KES)</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Configure treatment offerings, durations, pricing, and health benefits</p>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Admin.openAddServiceModal()">
              <i class="fas fa-plus"></i> Add New Service
            </button>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price (KES)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${services.map(s => `
                  <tr>
                    <td>#${s.id}</td>
                    <td>
                      <strong>${s.name}</strong>
                      <div class="text-muted" style="font-size:0.8rem;">${s.description.substring(0, 75)}...</div>
                    </td>
                    <td><span class="badge badge-primary">${s.category_name}</span></td>
                    <td>${s.duration_mins} mins</td>
                    <td><strong>KES ${Number(s.price_kes).toLocaleString()}</strong></td>
                    <td>
                      <span class="badge ${s.active ? 'badge-success' : 'badge-danger'}">
                        ${s.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="Admin.openEditServiceModal(${JSON.stringify(s).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="Admin.deactivateService(${s.id})">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  openAddServiceModal() {
    let modal = document.getElementById('add-service-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-service-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Add New Massage Service</h3>
            <button class="modal-close-btn" onclick="App.closeModal('add-service-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Service Name</label>
              <input type="text" id="srv-add-name" class="form-control" placeholder="e.g. Prenatal Rejuvenation Massage">
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="srv-add-cat" class="form-control">
                ${App.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Duration (Minutes)</label>
                <input type="number" id="srv-add-dur" class="form-control" value="60">
              </div>
              <div class="form-group">
                <label>Price (KES)</label>
                <input type="number" id="srv-add-price" class="form-control" placeholder="3500">
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="srv-add-desc" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Key Health Benefits (Semicolon separated)</label>
              <input type="text" id="srv-add-benefits" class="form-control" placeholder="Relieves lumbar stress; Improves circulation; Non-invasive">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('add-service-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Admin.submitAddService()">Save Service</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitAddService() {
    const payload = {
      name: document.getElementById('srv-add-name').value.trim(),
      category_id: Number(document.getElementById('srv-add-cat').value),
      duration_mins: Number(document.getElementById('srv-add-dur').value),
      price_kes: Number(document.getElementById('srv-add-price').value),
      description: document.getElementById('srv-add-desc').value.trim(),
      benefits: document.getElementById('srv-add-benefits').value.trim()
    };

    try {
      await App.api('/api/services', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast('Service created successfully!');
      App.closeModal('add-service-modal');
      await App.loadInitialData();
      this.renderServices();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async deactivateService(id) {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await App.api(`/api/services/${id}`, { method: 'DELETE' });
      App.showToast('Service deactivated');
      this.renderServices();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 4. THERAPISTS MANAGER
  async renderTherapists() {
    const container = document.getElementById('admin-main-view');
    try {
      const therapists = await App.api('/api/therapists');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Parlor Therapists & Rosters</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Manage certified therapists, specialties, and working shifts</p>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Admin.openAddTherapistModal()">
              <i class="fas fa-plus"></i> Add New Therapist
            </button>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Therapist Name</th>
                  <th>Specialization</th>
                  <th>Phone / Email</th>
                  <th>Experience</th>
                  <th>Rating</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${therapists.map(t => `
                  <tr>
                    <td><strong>${t.name}</strong></td>
                    <td>${t.specialization}</td>
                    <td>
                      <div>${t.phone}</div>
                      <small class="text-muted">${t.email}</small>
                    </td>
                    <td>${t.experience_years} years</td>
                    <td><span class="text-gold"><i class="fas fa-star"></i> ${t.rating}</span></td>
                    <td><span class="badge badge-primary">${t.working_hours}</span></td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  openAddTherapistModal() {
    let modal = document.getElementById('add-therapist-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-therapist-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Register New Wellness Therapist</h3>
            <button class="modal-close-btn" onclick="App.closeModal('add-therapist-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="th-add-name" class="form-control" placeholder="e.g. Mercy Chebet">
              </div>
              <div class="form-group">
                <label>Specialization</label>
                <input type="text" id="th-add-spec" class="form-control" placeholder="e.g. Aromatherapy & Reflexology">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" id="th-add-phone" class="form-control" placeholder="+2547XXXXXXXX">
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="th-add-email" class="form-control" placeholder="mercy@stevesmassage.co.ke">
              </div>
            </div>
            <div class="form-group">
              <label>Years of Experience</label>
              <input type="number" id="th-add-exp" class="form-control" value="3">
            </div>
            <div class="form-group">
              <label>Therapist Professional Bio</label>
              <textarea id="th-add-bio" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('add-therapist-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Admin.submitAddTherapist()">Register Specialist</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitAddTherapist() {
    const payload = {
      name: document.getElementById('th-add-name').value.trim(),
      specialization: document.getElementById('th-add-spec').value.trim(),
      phone: document.getElementById('th-add-phone').value.trim(),
      email: document.getElementById('th-add-email').value.trim(),
      experience_years: Number(document.getElementById('th-add-exp').value),
      bio: document.getElementById('th-add-bio').value.trim()
    };

    try {
      await App.api('/api/therapists', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast('Therapist registered successfully!');
      App.closeModal('add-therapist-modal');
      await App.loadInitialData();
      this.renderTherapists();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 5. INVENTORY MANAGER (Module 9)
  async renderInventory() {
    const container = document.getElementById('admin-main-view');
    try {
      const items = await App.api('/api/inventory');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Spa Consumables & Inventory Management</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Tracks massage oils, linens, basalt stones, sanitizers, and reorder thresholds</p>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Admin.openAddInventoryModal()">
              <i class="fas fa-plus"></i> New Stock Item
            </button>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Stock Level</th>
                  <th>Unit</th>
                  <th>Reorder Threshold</th>
                  <th>Cost / Unit (KES)</th>
                  <th>Status</th>
                  <th>Restock Action</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr style="${item.quantity <= item.min_threshold ? 'background:#FFF8F6;' : ''}">
                    <td><strong>${item.name}</strong></td>
                    <td><span class="badge badge-primary">${item.category}</span></td>
                    <td><strong style="font-size:1.05rem;">${item.quantity}</strong></td>
                    <td>${item.unit}</td>
                    <td>${item.min_threshold}</td>
                    <td>KES ${Number(item.cost_per_unit_kes).toLocaleString()}</td>
                    <td>
                      ${item.quantity <= item.min_threshold ? `
                        <span class="badge badge-danger"><i class="fas fa-exclamation-circle"></i> Low Stock</span>
                      ` : `
                        <span class="badge badge-success"><i class="fas fa-check"></i> Sufficient</span>
                      `}
                    </td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="Admin.promptRestock(${item.id}, '${item.name}', ${item.quantity})">
                        <i class="fas fa-plus-circle"></i> Restock
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  openAddInventoryModal() {
    let modal = document.getElementById('add-inv-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-inv-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Add Inventory Consumable</h3>
            <button class="modal-close-btn" onclick="App.closeModal('add-inv-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Item Name</label>
              <input type="text" id="inv-add-name" class="form-control" placeholder="e.g. Organic Eucalyptus Oil (500ml)">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select id="inv-add-cat" class="form-control">
                  <option value="Massage Oils">Massage Oils</option>
                  <option value="Carrier Oils">Carrier Oils</option>
                  <option value="Aromatherapy">Aromatherapy</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Linens">Linens</option>
                  <option value="Sanitation">Sanitation</option>
                </select>
              </div>
              <div class="form-group">
                <label>Unit of Measure</label>
                <input type="text" id="inv-add-unit" class="form-control" placeholder="Bottles, Jerricans, Rolls">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Initial Quantity</label>
                <input type="number" id="inv-add-qty" class="form-control" value="10">
              </div>
              <div class="form-group">
                <label>Min Reorder Threshold</label>
                <input type="number" id="inv-add-thresh" class="form-control" value="4">
              </div>
            </div>
            <div class="form-group">
              <label>Cost per Unit (KES)</label>
              <input type="number" id="inv-add-cost" class="form-control" placeholder="1200">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('add-inv-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Admin.submitAddInventory()">Add to Stock</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitAddInventory() {
    const payload = {
      name: document.getElementById('inv-add-name').value.trim(),
      category: document.getElementById('inv-add-cat').value,
      unit: document.getElementById('inv-add-unit').value.trim(),
      quantity: Number(document.getElementById('inv-add-qty').value),
      min_threshold: Number(document.getElementById('inv-add-thresh').value),
      cost_per_unit_kes: Number(document.getElementById('inv-add-cost').value)
    };

    try {
      await App.api('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast('Inventory item registered');
      App.closeModal('add-inv-modal');
      this.renderInventory();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async promptRestock(id, name, currentQty) {
    const addQty = prompt(`Restock ${name}\nCurrent Stock: ${currentQty}\nEnter quantity to add:`, "5");
    if (!addQty || isNaN(addQty)) return;

    try {
      await App.api(`/api/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: currentQty + Number(addQty) })
      });
      App.showToast(`Restocked ${name} with ${addQty} additional units.`);
      this.renderInventory();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 6. SUPPLIERS & PURCHASE ORDERS (Module 10)
  async renderSuppliers() {
    const container = document.getElementById('admin-main-view');
    try {
      const [suppliers, pos] = await Promise.all([
        App.api('/api/suppliers'),
        App.api('/api/purchase-orders')
      ]);

      container.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:24px;">
          <!-- Suppliers Directory -->
          <div class="table-card">
            <div class="table-header-bar">
              <div>
                <h3>Registered Suppliers</h3>
                <p class="text-muted" style="font-size:0.8rem; margin:0;">Spa oils, equipment, and linen vendors</p>
              </div>
              <button class="btn btn-gold btn-sm" onclick="Admin.openAddSupplierModal()"><i class="fas fa-plus"></i> Add Vendor</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Contact</th>
                    <th>Supplied Goods</th>
                  </tr>
                </thead>
                <tbody>
                  ${suppliers.map(s => `
                    <tr>
                      <td>
                        <strong>${s.name}</strong>
                        <div class="text-muted" style="font-size:0.8rem;">${s.contact_person}</div>
                      </td>
                      <td>
                        <div>${s.phone}</div>
                        <small class="text-muted">${s.email}</small>
                      </td>
                      <td><span class="badge badge-primary">${s.supplied_items}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Purchase Orders -->
          <div class="table-card">
            <div class="table-header-bar">
              <div>
                <h3>Purchase Orders (POs)</h3>
                <p class="text-muted" style="font-size:0.8rem; margin:0;">Track vendor orders & procurement</p>
              </div>
              <button class="btn btn-gold btn-sm" onclick="Admin.openAddPOModal(${JSON.stringify(suppliers).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice"></i> Issue PO</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Item & Qty</th>
                    <th>Cost (KES)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${pos.map(p => `
                    <tr>
                      <td><strong>${p.po_number}</strong></td>
                      <td>${p.supplier_name}</td>
                      <td>${p.item_name} (${p.quantity} units)</td>
                      <td><strong>KES ${Number(p.total_cost_kes).toLocaleString()}</strong></td>
                      <td><span class="badge ${p.status === 'Received' ? 'badge-success' : 'badge-warning'}">${p.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  openAddSupplierModal() {
    let modal = document.getElementById('add-sup-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-sup-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Register Vendor / Supplier</h3>
            <button class="modal-close-btn" onclick="App.closeModal('add-sup-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Company / Supplier Name</label>
              <input type="text" id="sup-add-name" class="form-control" placeholder="e.g. Kenya Spa Organics">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Contact Person</label>
                <input type="text" id="sup-add-person" class="form-control">
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" id="sup-add-phone" class="form-control" placeholder="+2547XXXXXXXX">
              </div>
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="sup-add-email" class="form-control">
            </div>
            <div class="form-group">
              <label>Physical Address</label>
              <input type="text" id="sup-add-address" class="form-control" placeholder="Mombasa Road, Nairobi">
            </div>
            <div class="form-group">
              <label>Items Supplied</label>
              <input type="text" id="sup-add-items" class="form-control" placeholder="Lavender oil, Almond oil, Bath salts">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('add-sup-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Admin.submitAddSupplier()">Save Supplier</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitAddSupplier() {
    const payload = {
      name: document.getElementById('sup-add-name').value.trim(),
      contact_person: document.getElementById('sup-add-person').value.trim(),
      phone: document.getElementById('sup-add-phone').value.trim(),
      email: document.getElementById('sup-add-email').value.trim(),
      address: document.getElementById('sup-add-address').value.trim(),
      supplied_items: document.getElementById('sup-add-items').value.trim()
    };
    try {
      await App.api('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast('Supplier registered');
      App.closeModal('add-sup-modal');
      this.renderSuppliers();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  openAddPOModal(suppliers) {
    let modal = document.getElementById('add-po-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-po-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Issue New Purchase Order</h3>
            <button class="modal-close-btn" onclick="App.closeModal('add-po-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Supplier</label>
              <select id="po-add-sup" class="form-control">
                ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Item Name / Description</label>
              <input type="text" id="po-add-item" class="form-control" placeholder="e.g. Pure Sweet Almond Base Oil (5L)">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="po-add-qty" class="form-control" value="5">
              </div>
              <div class="form-group">
                <label>Total Cost (KES)</label>
                <input type="number" id="po-add-cost" class="form-control" placeholder="22500">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('add-po-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Admin.submitAddPO()">Create PO & Record Expense</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitAddPO() {
    const payload = {
      supplier_id: Number(document.getElementById('po-add-sup').value),
      item_name: document.getElementById('po-add-item').value.trim(),
      quantity: Number(document.getElementById('po-add-qty').value),
      total_cost_kes: Number(document.getElementById('po-add-cost').value)
    };
    try {
      await App.api('/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast('Purchase Order generated and logged into Finance expenses!');
      App.closeModal('add-po-modal');
      this.renderSuppliers();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 7. FINANCE & BUDGET MANAGER (Module 11)
  async renderFinance() {
    const container = document.getElementById('admin-main-view');
    try {
      const data = await App.api('/api/finance/overview');
      container.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="fas fa-arrow-down"></i></div>
            <div class="kpi-info">
              <h4>Total Income</h4>
              <h2 style="color:var(--success);">KES ${Number(data.totalIncome).toLocaleString()}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon danger"><i class="fas fa-arrow-up"></i></div>
            <div class="kpi-info">
              <h4>Total Expenses</h4>
              <h2 style="color:var(--danger);">KES ${Number(data.totalExpense).toLocaleString()}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon gold"><i class="fas fa-balance-scale"></i></div>
            <div class="kpi-info">
              <h4>Net Profit / Cash Flow</h4>
              <h2 style="color:var(--primary);">KES ${Number(data.netProfit).toLocaleString()}</h2>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.3fr 0.7fr; gap:24px;">
          <!-- Transactions Ledger -->
          <div class="table-card">
            <div class="table-header-bar">
              <div>
                <h3>Recent Financial Transactions</h3>
                <p class="text-muted" style="font-size:0.8rem; margin:0;">Income from customer bookings & operational expenses</p>
              </div>
              <button class="btn btn-gold btn-sm" onclick="Admin.openAddExpenseModal()"><i class="fas fa-plus"></i> Record Expense</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount (KES)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.transactions.map(t => `
                    <tr>
                      <td>
                        <span class="badge ${t.type === 'Income' ? 'badge-success' : 'badge-danger'}">
                          ${t.type}
                        </span>
                      </td>
                      <td>${t.category}</td>
                      <td>
                        <div>${t.description}</div>
                        <small class="text-muted">${t.reference_no || ''}</small>
                      </td>
                      <td>
                        <strong style="color:${t.type === 'Income' ? 'var(--success)' : 'var(--danger)'};">
                          ${t.type === 'Income' ? '+' : '-'} KES ${Number(t.amount_kes).toLocaleString()}
                        </strong>
                      </td>
                      <td>${t.transaction_date}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Monthly Budgets -->
          <div class="table-card">
            <div class="table-header-bar">
              <h3>Monthly Operational Budgets</h3>
            </div>
            <div style="padding:24px;">
              ${data.budgets.map(b => {
                const pct = Math.min(100, Math.round((b.spent_kes / b.allocated_kes) * 100));
                return `
                  <div style="margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.88rem;">
                      <strong>${b.category}</strong>
                      <span class="text-muted">${pct}% (KES ${Number(b.spent_kes).toLocaleString()} / ${Number(b.allocated_kes).toLocaleString()})</span>
                    </div>
                    <div style="height:10px; background:#ECEEEB; border-radius:10px; overflow:hidden;">
                      <div style="height:100%; width:${pct}%; background:${pct > 80 ? 'var(--danger)' : 'var(--accent)'}; border-radius:10px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  openAddExpenseModal() {
    let modal = document.getElementById('add-exp-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-exp-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>Record Operational Expense</h3>
            <button class="modal-close-btn" onclick="App.closeModal('add-exp-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Expense Category</label>
              <select id="exp-add-cat" class="form-control">
                <option value="Supplies Restock">Supplies Restock</option>
                <option value="Utilities & Laundry">Utilities & Laundry</option>
                <option value="Therapist Commission">Therapist Commission</option>
                <option value="Rent & Facilities">Rent & Facilities</option>
                <option value="Marketing & Software">Marketing & Software</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" id="exp-add-desc" class="form-control" placeholder="e.g. Electricity and water bill for October">
            </div>
            <div class="form-group">
              <label>Amount in KES</label>
              <input type="number" id="exp-add-amt" class="form-control" placeholder="8500">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('add-exp-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Admin.submitAddExpense()">Record Expense</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitAddExpense() {
    const payload = {
      type: 'Expense',
      category: document.getElementById('exp-add-cat').value,
      description: document.getElementById('exp-add-desc').value.trim(),
      amount_kes: Number(document.getElementById('exp-add-amt').value)
    };
    try {
      await App.api('/api/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast('Expense recorded successfully');
      App.closeModal('add-exp-modal');
      this.renderFinance();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 8. CLIENT INQUIRIES (Module 14 Contact Us)
  async renderInquiries() {
    const container = document.getElementById('admin-main-view');
    try {
      const inquiries = await App.api('/api/inquiries');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Customer Contact Inquiries</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Incoming inquiries submitted via website Contact Us form</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Directed To (Management)</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Received At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${inquiries.map(inq => `
                  <tr>
                    <td>
                      <strong>${inq.name}</strong>
                      <div class="text-muted" style="font-size:0.8rem;">${inq.email} • ${inq.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <span class="badge" style="background:#e8f5e9; color:#1b5e20; border:1px solid #c8e6c9; font-weight:600; font-size:0.8rem;">
                        <i class="fas fa-envelope-open-text"></i> ${inq.target_email || 'admin@stevesmassage.co.ke'}
                      </span>
                    </td>
                    <td><strong>${inq.subject}</strong></td>
                    <td style="max-width:320px;">
                      <div style="font-size:0.86rem; color:#333; line-height:1.4;">${inq.message}</div>
                      ${inq.reply_message ? `
                        <div style="margin-top:6px; padding:6px 10px; background:#ecfdf5; border-left:3px solid #10b981; border-radius:4px; font-size:0.78rem; color:#065f46;">
                          <strong><i class="fas fa-check-circle"></i> Replied by ${inq.replied_by || 'Management'}:</strong>
                          <div style="margin-top:2px; font-style:italic;">"${inq.reply_message.substring(0, 90)}${inq.reply_message.length > 90 ? '...' : ''}"</div>
                        </div>
                      ` : ''}
                    </td>
                    <td style="font-size:0.8rem; color:#666;">${inq.created_at}</td>
                    <td>
                      <span class="badge ${inq.status === 'New' ? 'badge-warning' : 'badge-success'}" style="font-size:0.78rem;">${inq.status}</span>
                    </td>
                    <td>
                      <div style="display:flex; flex-direction:column; gap:6px;">
                        <button class="btn btn-gold btn-sm" onclick="App.openInquiryReplyModal(${inq.id})" style="display:inline-flex; align-items:center; gap:5px; font-size:0.78rem; padding:4px 8px; justify-content:center;">
                          <i class="fas fa-reply"></i> ${inq.status === 'Replied' ? 'View / Edit Reply' : 'Reply to Client'}
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="Admin.toggleInquiryStatus(${inq.id}, '${inq.status === 'New' ? 'Replied' : 'New'}')" style="font-size:0.7rem; padding:2px 6px;">
                          Mark ${inq.status === 'New' ? 'Replied' : 'New'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  async toggleInquiryStatus(id, newStatus) {
    try {
      await App.api(`/api/inquiries/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      App.showToast('Inquiry status updated');
      this.renderInquiries();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // 9. NOTIFICATION LOGS (Module 12)
  async renderNotifications() {
    const container = document.getElementById('admin-main-view');
    try {
      const notifs = await App.api('/api/notifications');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>System Notification Telemetry</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Automated SMS reminders, booking confirmations, and stock alerts</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Title</th>
                  <th>Message Body</th>
                  <th>Recipient</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${notifs.map(n => `
                  <tr>
                    <td>
                      <span class="badge ${n.channel === 'SMS' ? 'badge-primary' : 'badge-gold'}">
                        <i class="fas ${n.channel === 'SMS' ? 'fa-sms' : 'fa-bell'}"></i> ${n.channel}
                      </span>
                    </td>
                    <td><strong>${n.title}</strong></td>
                    <td style="max-width:350px;">${n.message}</td>
                    <td>${n.recipient_phone || n.recipient_email || 'In-App User'}</td>
                    <td>${n.created_at}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  },

  // 10. SYSTEM USER ACCOUNTS
  async renderUsers() {
    const container = document.getElementById('admin-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading system user accounts...</div>';
    try {
      const users = await App.api('/api/users');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-users-cog text-gold"></i> System User Accounts</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">All registered accounts across Administrator, Therapist, and Customer roles</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <span class="badge badge-primary">${users.length} Total Accounts</span>
              <button class="btn btn-gold btn-sm" onclick="Admin.openAddCustomerModal()">
                <i class="fas fa-user-plus"></i> Register Customer
              </button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>System Role</th>
                  <th>Registered</th>
                  <th>Account Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.map((u, i) => {
                  const roleBadge = u.role === 'admin' ? 'badge-primary' : u.role === 'therapist' ? 'badge-gold' : 'badge-success';
                  const roleIcon = u.role === 'admin' ? 'fa-user-shield' : u.role === 'therapist' ? 'fa-user-md' : 'fa-user';
                  return `
                    <tr>
                      <td><strong>${i + 1}</strong></td>
                      <td><strong>${u.name}</strong></td>
                      <td>${u.email}</td>
                      <td>${u.phone || '—'}</td>
                      <td>
                        <span class="badge ${roleBadge}">
                          <i class="fas ${roleIcon}"></i> ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td><small class="text-muted">${u.created_at ? u.created_at.substring(0, 10) : 'N/A'}</small></td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          ${u.role === 'customer' ? `
                            <button class="btn btn-outline btn-sm" title="Schedule appointment for this client" onclick="Admin.bookForCustomer('${u.id}', '${u.name.replace(/'/g, "\\'")}', '${u.email}', '${u.phone || ''}')">
                              <i class="fas fa-calendar-plus text-gold"></i> Book
                            </button>
                          ` : ''}
                          <button class="btn btn-outline btn-sm" style="color:var(--danger);" 
                            title="Remove user account" 
                            onclick="Admin.deleteUser(${u.id}, '${u.name.replace(/'/g, "\\'")}', '${u.role}')"
                            ${u.role === 'admin' ? 'disabled title="Cannot remove primary admin accounts"' : ''}>
                            <i class="fas fa-user-times"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:20px;">Error loading users: ${err.message}</div>`;
    }
  },

  openAddCustomerModal() {
    let modal = document.getElementById('admin-add-cust-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-add-cust-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-user-plus text-gold"></i> Register New Customer Account</h3>
          <button class="modal-close-btn" onclick="App.closeModal('admin-add-cust-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Customer Full Name</label>
            <input type="text" id="adm-cust-name" class="form-control" placeholder="e.g. Joy Wangari">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="adm-cust-email" class="form-control" placeholder="joy@example.com">
          </div>
          <div class="form-group">
            <label>Phone Number (M-Pesa)</label>
            <input type="text" id="adm-cust-phone" class="form-control" placeholder="+2547XXXXXXXX">
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select id="adm-cust-gender" class="form-control">
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Prefer Not to Say">Prefer Not to Say</option>
            </select>
          </div>
          <div class="form-group">
            <label>Password (Default: Client@123)</label>
            <input type="password" id="adm-cust-pass" class="form-control" value="Client@123">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('admin-add-cust-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="Admin.submitAddCustomer()">Create Customer Account</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  async submitAddCustomer() {
    const name = document.getElementById('adm-cust-name').value.trim();
    const email = document.getElementById('adm-cust-email').value.trim();
    const phone = document.getElementById('adm-cust-phone').value.trim();
    const gender = document.getElementById('adm-cust-gender').value;
    const password = document.getElementById('adm-cust-pass').value;

    if (!name || !email || !phone) return App.showToast('Please fill in name, email, and phone', 'warning');

    try {
      const res = await App.api('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, gender, password, role: 'customer' })
      });
      App.showToast(`Customer account for "${name}" registered successfully!`);
      App.closeModal('admin-add-cust-modal');
      this.renderUsers();

      if (confirm(`Account created for ${name}!\nWould you like to schedule an appointment for this customer right now?`)) {
        this.bookForCustomer(res.user.id, res.user.name, res.user.email, res.user.phone);
      }
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  bookForCustomer(custId, name, email, phone) {
    if (typeof Booking !== 'undefined') {
      Booking.openBookingModal();
      setTimeout(() => {
        const nameEl = document.getElementById('book-cust-name');
        const emailEl = document.getElementById('book-cust-email');
        const phoneEl = document.getElementById('book-cust-phone');
        const mpesaEl = document.getElementById('book-mpesa-number');
        if (nameEl) nameEl.value = name;
        if (emailEl) emailEl.value = email;
        if (phoneEl) phoneEl.value = phone;
        if (mpesaEl) mpesaEl.value = phone;
      }, 100);
    }
  },

  async deleteUser(id, name, role) {
    if (role === 'admin') return App.showToast('Admin accounts cannot be deleted', 'warning');
    if (!confirm(`Are you sure you want to remove the user account for "${name}"? This cannot be undone.`)) return;
    try {
      await App.api(`/api/users/${id}`, { method: 'DELETE' });
      App.showToast(`User account "${name}" removed successfully.`);
      this.renderUsers();
    } catch (err) {
      App.showToast(err.message || 'Failed to delete user', 'danger');
    }
  }
};
