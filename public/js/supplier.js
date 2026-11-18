// Steve's Massage Parlor Management System - Supplier Portal Module
// DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025) - Kenya Methodist University
// Supplier Module: View POs, acknowledge, update dispatch status, view GRNs

const SupplierPortal = {
  pos: [],
  notifications: [],
  currentTab: 'orders',

  async init() {
    if (!App.currentUser || App.currentUser.role !== 'supplier') {
      App.showToast('Access Denied: This portal is for authorized suppliers only.', 'danger');
      App.closePortal();
      return;
    }

    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2><i class="fas fa-truck-loading text-gold"></i> Supplier Portal</h2>
          <p class="text-muted">Welcome, ${App.currentUser.name} • Authorized Vendor Partner</p>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline btn-sm" onclick="SupplierPortal.refresh()">
            <i class="fas fa-sync"></i> Refresh
          </button>
          <button class="btn btn-outline btn-sm" onclick="App.logout()">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>

      <div class="portal-nav-tabs">
        <button class="portal-tab active" id="sup-tab-orders" onclick="SupplierPortal.switchTab('orders')">
          <i class="fas fa-file-invoice"></i> My Purchase Orders
        </button>
        <button class="portal-tab" id="sup-tab-notifications" onclick="SupplierPortal.switchTab('notifications')">
          <i class="fas fa-bell"></i> Notifications <span id="sup-notif-badge" class="badge badge-danger" style="margin-left:4px; display:none;"></span>
        </button>
        <button class="portal-tab" id="sup-tab-grns" onclick="SupplierPortal.switchTab('grns')">
          <i class="fas fa-receipt"></i> Goods Received Notes (GRN)
        </button>
        <button class="portal-tab" id="sup-tab-profile" onclick="SupplierPortal.switchTab('profile')">
          <i class="fas fa-id-card"></i> Supplier Profile
        </button>
      </div>

      <div id="supplier-main-view"></div>
    `;

    await this.loadData();
    this.switchTab('orders');
  },

  async loadData() {
    try {
      const [pos, notifs] = await Promise.all([
        App.api('/api/purchase-orders'),
        App.api('/api/notifications')
      ]);
      this.pos           = pos || [];
      this.notifications = notifs || [];

      // Update notification badge
      const unread = this.notifications.filter(n => !n.is_read).length;
      const badge  = document.getElementById('sup-notif-badge');
      if (badge) {
        badge.textContent    = unread;
        badge.style.display  = unread > 0 ? 'inline' : 'none';
      }
    } catch (err) {
      console.warn('Supplier data load error:', err.message);
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    ['orders', 'notifications', 'grns', 'profile'].forEach(t => {
      const btn = document.getElementById(`sup-tab-${t}`);
      if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`sup-tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    if      (tab === 'orders')        this.renderOrders();
    else if (tab === 'notifications') this.renderNotifications();
    else if (tab === 'grns')          this.renderGRNs();
    else if (tab === 'profile')       this.renderProfile();
  },

  async refresh() {
    await this.loadData();
    this.switchTab(this.currentTab);
    App.showToast('Supplier portal refreshed');
  },

  renderOrders() {
    const container = document.getElementById('supplier-main-view');
    const activePOs = this.pos.filter(po => po.status !== 'Received' && po.status !== 'Cancelled' && po.status !== 'Rejected');
    const historyPOs = this.pos.filter(po => po.status === 'Received' || po.status === 'Cancelled' || po.status === 'Rejected');

    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar">
          <div>
            <h3><i class="fas fa-file-invoice text-gold"></i> Active Purchase Orders</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">View orders awaiting your acknowledgement or delivery action</p>
          </div>
          <span class="badge badge-primary">${activePOs.length} Active</span>
        </div>

        ${activePOs.length === 0 ? `
          <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-check-circle" style="font-size:3rem; color:var(--success); margin-bottom:14px;"></i>
            <h3>No Active Orders</h3>
            <p>All orders have been fulfilled. New purchase orders will appear here when issued by Steve's Massage Parlor.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Item Ordered</th>
                  <th>Qty</th>
                  <th>Total (KES)</th>
                  <th>Delivery Method</th>
                  <th>Order Date</th>
                  <th>Finance Status</th>
                  <th>Delivery Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${activePOs.map(po => `
                  <tr>
                    <td><strong>${po.po_number}</strong></td>
                    <td>${po.item_name}</td>
                    <td>${po.quantity} ${po.item_unit || ''}</td>
                    <td><strong>KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                    <td><small>${po.delivery_option || 'Standard Courier'}</small></td>
                    <td>${po.order_date}</td>
                    <td>
                      <span class="badge ${po.finance_status === 'Approved' ? 'badge-success' : (po.finance_status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">
                        ${po.finance_status}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${po.status === 'Delivered' ? 'badge-success' : (po.status === 'In-Transit' ? 'badge-primary' : (po.status === 'Acknowledged' ? 'badge-warning' : 'badge-secondary'))}">
                        ${po.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button class="btn btn-outline btn-sm" onclick="SupplierPortal.viewPO(${po.id})" title="View Details">
                          <i class="fas fa-eye"></i>
                        </button>
                        ${po.finance_status === 'Approved' && po.status === 'Approved' ? `
                          <button class="btn btn-gold btn-sm" onclick="SupplierPortal.updateStatus(${po.id}, '${po.po_number}', 'Acknowledged')" title="Acknowledge Order">
                            <i class="fas fa-check"></i> Acknowledge
                          </button>
                        ` : ''}
                        ${po.status === 'Acknowledged' ? `
                          <button class="btn btn-primary btn-sm" onclick="SupplierPortal.updateStatus(${po.id}, '${po.po_number}', 'In-Transit')" title="Mark In Transit">
                            <i class="fas fa-truck"></i> Dispatch
                          </button>
                        ` : ''}
                        ${po.status === 'In-Transit' ? `
                          <button class="btn btn-success btn-sm" onclick="SupplierPortal.updateStatus(${po.id}, '${po.po_number}', 'Delivered')" title="Mark Delivered">
                            <i class="fas fa-box-open"></i> Delivered
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      ${historyPOs.length > 0 ? `
        <div class="table-card" style="margin-top:20px;">
          <div class="table-header-bar">
            <h3><i class="fas fa-history text-gold"></i> Completed / Closed Orders</h3>
            <span class="badge badge-primary">${historyPOs.length} Records</span>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr><th>PO Number</th><th>Item</th><th>Qty</th><th>Total (KES)</th><th>Order Date</th><th>Final Status</th><th>GRN No.</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${historyPOs.map(po => `
                  <tr>
                    <td><strong>${po.po_number}</strong></td>
                    <td>${po.item_name}</td>
                    <td>${po.quantity}</td>
                    <td>KES ${Number(po.total_cost_kes).toLocaleString()}</td>
                    <td>${po.order_date}</td>
                    <td><span class="badge ${po.status === 'Received' ? 'badge-success' : 'badge-danger'}">${po.status}</span></td>
                    <td>${po.grn_number ? `<code>${po.grn_number}</code>` : '-'}</td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-outline btn-sm" onclick="SupplierPortal.viewPO(${po.id})">
                          <i class="fas fa-eye"></i> View
                        </button>
                        ${po.payment_status === 'Paid' ? `
                          <button class="btn btn-outline btn-sm" style="border-color:#27AE60; color:#27AE60;" onclick="FinanceManager.printSupplierPaymentReceipt(${po.id})">
                            <i class="fas fa-receipt"></i> Receipt
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;
  },

  renderNotifications() {
    const container = document.getElementById('supplier-main-view');
    const notifs    = this.notifications;

    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar">
          <h3><i class="fas fa-bell text-gold"></i> Notifications & Alerts</h3>
          <span class="badge badge-primary">${notifs.length} Total</span>
        </div>
        ${notifs.length === 0 ? `
          <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-bell-slash" style="font-size:3rem; margin-bottom:14px;"></i>
            <p>No notifications yet. New purchase orders and delivery confirmations will appear here.</p>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:12px; padding:16px;">
            ${notifs.map(n => `
              <div style="background:${n.is_read ? '#FAFAF8' : '#E8F5E9'}; border:1px solid ${n.is_read ? 'var(--border)' : '#C8E6C9'}; border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div style="font-weight:700; margin-bottom:4px; color:var(--primary);">${n.title}</div>
                  <div style="font-size:0.88rem; color:var(--text-dark);">${n.message}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;"><i class="fas fa-clock"></i> ${n.created_at}</div>
                </div>
                ${!n.is_read ? `
                  <button class="btn btn-outline btn-sm" onclick="SupplierPortal.markRead(${n.id})" style="white-space:nowrap; margin-left:12px;">
                    <i class="fas fa-check"></i> Mark Read
                  </button>
                ` : `<span class="badge badge-success" style="white-space:nowrap; margin-left:12px;">Read</span>`}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderGRNs() {
    const container = document.getElementById('supplier-main-view');
    const receivedPOs = this.pos.filter(po => po.grn_number);

    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar">
          <div>
            <h3><i class="fas fa-receipt text-gold"></i> Goods Received Notes (GRN)</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Official confirmation records for delivered goods</p>
          </div>
          <span class="badge badge-success">${receivedPOs.length} GRNs</span>
        </div>
        ${receivedPOs.length === 0 ? `
          <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-receipt" style="font-size:3rem; margin-bottom:14px;"></i>
            <p>No goods received notes yet. GRNs are generated when the Inventory Manager confirms receipt of your deliveries.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr><th>GRN Number</th><th>PO Number</th><th>Item Delivered</th><th>Qty</th><th>Total Value (KES)</th><th>Received By</th><th>Received Date</th><th>Print</th></tr>
              </thead>
              <tbody>
                ${receivedPOs.map(po => `
                  <tr>
                    <td><strong style="color:var(--success);"><code>${po.grn_number}</code></strong></td>
                    <td>${po.po_number}</td>
                    <td>${po.item_name}</td>
                    <td>${po.quantity} ${po.item_unit || ''}</td>
                    <td><strong>KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                    <td>${po.received_by || '-'}</td>
                    <td>${po.received_date ? po.received_date.split('T')[0] : '-'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="SupplierPortal.printGRN(${po.id})">
                        <i class="fas fa-print"></i> Print
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  renderProfile() {
    const container = document.getElementById('supplier-main-view');
    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar">
          <h3><i class="fas fa-id-card text-gold"></i> Supplier Profile</h3>
        </div>
        <div style="padding:24px;">
          <div class="kpi-grid" style="grid-template-columns: repeat(2, 1fr); gap:16px; margin-bottom:24px;">
            <div class="kpi-card">
              <div class="kpi-icon success"><i class="fas fa-box-open"></i></div>
              <div class="kpi-info">
                <h4>Total Orders Received</h4>
                <h2>${this.pos.length}</h2>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon gold"><i class="fas fa-receipt"></i></div>
              <div class="kpi-info">
                <h4>GRNs Confirmed</h4>
                <h2>${this.pos.filter(p => p.grn_number).length}</h2>
              </div>
            </div>
          </div>
          <div style="background:var(--sage-light); padding:24px; border-radius:16px;">
            <h4 style="color:var(--primary); margin-bottom:16px;"><i class="fas fa-user-tie text-gold"></i> Account Information</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <label style="font-size:0.8rem; color:var(--text-muted);">Full Name</label>
                <div style="font-weight:600;">${App.currentUser.name}</div>
              </div>
              <div>
                <label style="font-size:0.8rem; color:var(--text-muted);">Email</label>
                <div style="font-weight:600;">${App.currentUser.email}</div>
              </div>
              <div>
                <label style="font-size:0.8rem; color:var(--text-muted);">Phone</label>
                <div style="font-weight:600;">${App.currentUser.phone}</div>
              </div>
              <div>
                <label style="font-size:0.8rem; color:var(--text-muted);">Role</label>
                <div><span class="badge badge-primary">SUPPLIER</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async viewPO(poId) {
    let modal = document.getElementById('sup-po-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sup-po-detail-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="modal-box" style="padding:40px; text-align:center;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading purchase order...</p></div>';
    modal.classList.add('show');

    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header no-print">
            <h3><i class="fas fa-file-invoice text-gold"></i> Purchase Order Detail</h3>
            <button class="modal-close-btn" onclick="App.closeModal('sup-po-detail-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" style="padding:30px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:20px; margin-bottom:24px;">
              <div>
                <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOR</h2>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0;">Valley Arcade, Gitanga Rd, Nairobi | +254 712 345 678</p>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.3rem; font-weight:800; color:var(--accent);">PURCHASE ORDER</div>
                <div style="font-size:1.1rem; font-weight:700;">${po.po_number}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Date: ${po.order_date}</div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
              <div style="background:var(--sage-light); padding:16px; border-radius:12px;">
                <h5 style="color:var(--primary); margin-bottom:10px;">TO (Supplier):</h5>
                <div><strong>${po.supplier_name}</strong></div>
                <div style="color:var(--text-muted); font-size:0.85rem;">${po.supplier_address || ''}</div>
                <div style="color:var(--text-muted); font-size:0.85rem;">${po.supplier_phone || ''}</div>
                <div style="color:var(--text-muted); font-size:0.85rem;">${po.supplier_email || ''}</div>
                ${po.bank_name ? `
                <div style="margin-top:10px; padding:8px 10px; background:#fff; border-radius:6px; border-left:3px solid #27AE60; font-size:0.8rem;">
                  <strong style="color:#27AE60; display:block; margin-bottom:2px;"><i class="fas fa-university"></i> Remittance Account:</strong>
                  <div>${po.bank_name} — Acc: <code>${po.bank_account || '—'}</code></div>
                  ${po.mpesa_paybill ? `<div>M-Pesa Paybill: <strong>${po.mpesa_paybill}</strong></div>` : ''}
                  ${po.mpesa_till ? `<div>Buy Goods Till: <strong>${po.mpesa_till}</strong></div>` : ''}
                </div>` : ''}
              </div>
              <div style="background:var(--sage-light); padding:16px; border-radius:12px;">
                <h5 style="color:var(--primary); margin-bottom:10px;">DELIVERY:</h5>
                <div style="font-size:0.88rem;"><strong>Method:</strong> ${po.delivery_option || 'Standard Courier'}</div>
                <div style="font-size:0.88rem;"><strong>Address:</strong> ${po.delivery_address || "Steve's Massage Parlour, Valley Arcade, Nairobi"}</div>
                <div style="font-size:0.88rem;"><strong>Terms:</strong> ${po.payment_terms || '30 Days Invoice'}</div>
              </div>
            </div>

            <table class="custom-table" style="margin-bottom:20px;">
              <thead><tr><th>Item Description</th><th>SKU</th><th>Category</th><th>Quantity</th><th>Unit Cost (KES)</th><th>Total (KES)</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>${po.item_name}</strong></td>
                  <td>${po.item_sku || '-'}</td>
                  <td>${po.item_category || '-'}</td>
                  <td>${po.quantity} ${po.item_unit || ''}</td>
                  <td>KES ${Number(po.unit_cost_kes || 0).toLocaleString()}</td>
                  <td><strong>KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td colspan="5" style="text-align:right; font-weight:700; font-size:1.1rem;">TOTAL AMOUNT DUE:</td><td style="font-weight:800; font-size:1.1rem; color:var(--primary);">KES ${Number(po.total_cost_kes).toLocaleString()}</td></tr>
              </tfoot>
            </table>

            <div style="display:flex; gap:16px; margin-bottom:16px;">
              <div style="flex:1; background:#F0F4FF; padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.8rem; color:var(--text-muted);">Finance Status</div>
                <span class="badge ${po.finance_status === 'Approved' ? 'badge-success' : (po.finance_status === 'Rejected' ? 'badge-danger' : 'badge-warning')}" style="font-size:0.9rem;">${po.finance_status}</span>
                ${po.finance_feedback ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">"${po.finance_feedback}"</div>` : ''}
              </div>
              <div style="flex:1; background:#F0F4FF; padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.8rem; color:var(--text-muted);">Delivery Status</div>
                <span class="badge badge-primary" style="font-size:0.9rem;">${po.status}</span>
              </div>
              ${po.grn_number ? `
                <div style="flex:1; background:#E8F5E9; padding:12px; border-radius:10px; text-align:center;">
                  <div style="font-size:0.8rem; color:var(--text-muted);">GRN Number</div>
                  <strong style="color:var(--success);">${po.grn_number}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Received: ${po.received_date ? po.received_date.split('T')[0] : '-'}</div>
                </div>
              ` : ''}
            </div>

            ${po.notes ? `<div style="background:var(--sage-light); padding:12px; border-radius:10px; font-size:0.88rem;"><strong>Notes:</strong> ${po.notes}</div>` : ''}
          </div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('sup-po-detail-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print PO</button>
          </div>
        </div>
      `;
    } catch (err) {
      modal.innerHTML = `<div class="modal-box"><div style="padding:40px; text-align:center; color:red;">${err.message}</div><div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="App.closeModal('sup-po-detail-modal')">Close</button></div></div>`;
    }
  },

  async updateStatus(poId, poNumber, newStatus) {
    const confirmMsg = {
      'Acknowledged': `Confirm acknowledgement of Purchase Order ${poNumber}?`,
      'In-Transit':   `Mark ${poNumber} as dispatched and In-Transit?`,
      'Delivered':    `Confirm that goods for ${poNumber} have been delivered to Steve's Massage Parlor?`
    };
    if (!confirm(confirmMsg[newStatus] || `Update status to ${newStatus}?`)) return;

    try {
      const res = await App.api(`/api/purchase-orders/${poId}/supplier-status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      App.showToast(res.message);
      await this.loadData();
      this.renderOrders();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async markRead(notifId) {
    try {
      await App.api(`/api/notifications/${notifId}/read`, { method: 'PUT' });
      await this.loadData();
      this.renderNotifications();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async printGRN(poId) {
    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      let grnModal = document.getElementById('grn-print-modal');
      if (!grnModal) {
        grnModal = document.createElement('div');
        grnModal.id = 'grn-print-modal';
        grnModal.className = 'modal-overlay';
        document.body.appendChild(grnModal);
      }

      grnModal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header no-print">
            <h3><i class="fas fa-receipt text-gold"></i> Goods Received Note</h3>
            <button class="modal-close-btn" onclick="App.closeModal('grn-print-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" style="padding:30px;">
            <div style="text-align:center; border-bottom:2px solid var(--border); padding-bottom:16px; margin-bottom:24px;">
              <h2 style="color:var(--primary);">STEVE'S MASSAGE PARLOR</h2>
              <div style="font-size:1.2rem; font-weight:800; color:var(--accent);">GOODS RECEIVED NOTE (GRN)</div>
              <div style="font-size:1rem; font-weight:700; color:var(--success);">${po.grn_number}</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
              <div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Purchase Order No.</div>
                <div style="font-weight:700;">${po.po_number}</div>
              </div>
              <div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Date Received</div>
                <div style="font-weight:700;">${po.received_date ? po.received_date.split('T')[0] : 'N/A'}</div>
              </div>
              <div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Supplier</div>
                <div style="font-weight:700;">${po.supplier_name}</div>
              </div>
              <div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Received By</div>
                <div style="font-weight:700;">${po.received_by || 'Inventory Manager'}</div>
              </div>
            </div>

            <table class="custom-table" style="margin-bottom:20px;">
              <thead><tr><th>Item Description</th><th>SKU</th><th>Qty Ordered</th><th>Qty Received</th><th>Unit Cost</th><th>Total Value</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>${po.item_name}</strong></td>
                  <td>${po.item_sku || '-'}</td>
                  <td>${po.quantity} ${po.item_unit || ''}</td>
                  <td><strong style="color:var(--success);">${po.quantity} ${po.item_unit || ''}</strong></td>
                  <td>KES ${Number(po.unit_cost_kes || 0).toLocaleString()}</td>
                  <td><strong>KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="background:#E8F5E9; padding:16px; border-radius:12px; text-align:center;">
              <i class="fas fa-check-circle" style="color:var(--success); font-size:1.5rem;"></i>
              <div style="font-weight:700; color:var(--success); margin-top:6px;">GOODS RECEIVED AND VERIFIED</div>
              <div style="font-size:0.85rem; color:var(--text-muted);">Inventory has been updated. This GRN serves as official confirmation of receipt.</div>
            </div>
          </div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('grn-print-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print GRN</button>
          </div>
        </div>
      `;
      grnModal.classList.add('show');
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  }
};
