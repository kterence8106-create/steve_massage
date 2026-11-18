// Steve's Massage Parlor Management System - Specialized Management Portals
// Modules for: Finance Manager, Inventory Manager, and Service Manager
// DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025) - Kenya Methodist University

// ============================================================================
// 1. FINANCE MANAGER PORTAL
// Monitors financial performance, revenues, expenses, budgets,
// AND explicitly monitors inventory stock valuation & customer supplies
// ============================================================================
const FinanceManager = {
  currentTab: 'overview',

  async init() {
    if (!App.currentUser || (App.currentUser.role !== 'finance_manager' && App.currentUser.role !== 'admin')) {
      App.showToast('Access Restricted: The Finance Module is strictly reserved for the Finance Director (Patrick Mutua).', 'danger');
      App.closePortal();
      return;
    }

    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2><i class="fas fa-wallet text-gold"></i> Financial Management & Accounts Suite</h2>
          <p class="text-muted">Welcome, ${App.currentUser.name} • Certified Finance Director (DBIT 226)</p>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline btn-sm" onclick="App.closePortal()">
            <i class="fas fa-eye"></i> View Public Site
          </button>
          <button class="btn btn-gold btn-sm" onclick="FinanceManager.printStatement()">
            <i class="fas fa-print"></i> Print Financial Statement
          </button>
        </div>
      </div>

      <div class="portal-nav-tabs">
        <button class="portal-tab active" id="fin-tab-overview" onclick="FinanceManager.switchTab('overview')"><i class="fas fa-chart-line"></i> Financial Telemetry</button>
        <button class="portal-tab" id="fin-tab-po-approvals" onclick="FinanceManager.switchTab('po-approvals')"><i class="fas fa-clipboard-check"></i> PO Approvals <span id="fin-po-pending-badge" class="badge badge-danger" style="display:none; margin-left:6px;">0</span></button>
        <button class="portal-tab" id="fin-tab-supplier-payments" onclick="FinanceManager.switchTab('supplier-payments')"><i class="fas fa-money-check-alt"></i> Supplier Disbursements <span id="fin-unpaid-badge" class="badge badge-warning" style="display:none; margin-left:6px;">0</span></button>
        <button class="portal-tab" id="fin-tab-supplies" onclick="FinanceManager.switchTab('supplies')"><i class="fas fa-boxes"></i> Inventory & Supplies Valuation</button>
        <button class="portal-tab" id="fin-tab-payments" onclick="FinanceManager.switchTab('payments')"><i class="fas fa-receipt"></i> Customer Billings (M-Pesa)</button>
        <button class="portal-tab" id="fin-tab-expenses" onclick="FinanceManager.switchTab('expenses')"><i class="fas fa-file-invoice-dollar"></i> Expense & PO Disbursements</button>
        <button class="portal-tab" id="fin-tab-budgets" onclick="FinanceManager.switchTab('budgets')"><i class="fas fa-balance-scale"></i> Department Budgets</button>
      </div>

      <div id="finance-main-view"></div>
    `;

    this.switchTab('overview');
  },

  switchTab(tab) {
    this.currentTab = tab;
    ['overview', 'po-approvals', 'supplier-payments', 'supplies', 'payments', 'expenses', 'budgets'].forEach(t => {
      const btn = document.getElementById(`fin-tab-${t}`);
      if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`fin-tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (tab === 'overview') this.renderOverview();
    else if (tab === 'po-approvals') this.renderPOApprovals();
    else if (tab === 'supplier-payments') this.renderSupplierPayments();
    else if (tab === 'supplies') this.renderSuppliesValuation();
    else if (tab === 'payments') this.renderCustomerPayments();
    else if (tab === 'expenses') this.renderExpenses();
    else if (tab === 'budgets') this.renderBudgets();
  },

  // Overview Tab
  async renderOverview() {
    const container = document.getElementById('finance-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Calculating financial positions...</div>';

    try {
      const [fin, invStats, dash] = await Promise.all([
        App.api('/api/finance/overview'),
        App.api('/api/inventory/stats'),
        App.api('/api/reports/dashboard')
      ]);

      const badge = document.getElementById('fin-po-pending-badge');
      const pendingCount = (fin.pendingPOs || []).length;
      if (badge) {
        badge.innerText = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
      }

      container.innerHTML = `
        ${pendingCount > 0 ? `
          <div style="background:#FFF3CD; border:1px solid #FFEAA7; border-left:4px solid #FFA000; padding:14px 18px; border-radius:8px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#856404;"><i class="fas fa-exclamation-triangle"></i> Pending Procurement Authorization:</strong>
              <span style="color:#856404; margin-left:8px;">${pendingCount} purchase order(s) require Finance Director review and approval before dispatch to suppliers.</span>
            </div>
            <button class="btn btn-gold btn-sm" onclick="FinanceManager.switchTab('po-approvals')">
              <i class="fas fa-clipboard-check"></i> Review POs (${pendingCount})
            </button>
          </div>
        ` : ''}

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="fas fa-arrow-down"></i></div>
            <div class="kpi-info">
              <h4>Total Gross Revenue</h4>
              <h2 style="color:var(--success);">KES ${Number(fin.totalIncome).toLocaleString()}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon danger"><i class="fas fa-arrow-up"></i></div>
            <div class="kpi-info">
              <h4>Operating Expenses</h4>
              <h2 style="color:var(--danger);">KES ${Number(fin.totalExpense).toLocaleString()}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
            <div class="kpi-info">
              <h4>Net Profit / Cashflow</h4>
              <h2 style="color:var(--primary);">KES ${Number(fin.netProfit).toLocaleString()}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="fas fa-warehouse"></i></div>
            <div class="kpi-info">
              <h4>Supplies Asset Value</h4>
              <h2 style="color:var(--accent);">KES ${Number(invStats.totalValuation).toLocaleString()}</h2>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px;">
          <!-- Recent Income & Expenses -->
          <div class="table-card">
            <div class="table-header-bar">
              <div>
                <h3>Recent Financial Ledger</h3>
                <p class="text-muted" style="font-size:0.8rem; margin:0;">M-Pesa revenue receipts and vendor expense disbursements</p>
              </div>
              <button class="btn btn-gold btn-sm" onclick="FinanceManager.openAddExpenseModal()">
                <i class="fas fa-plus"></i> Record Expense
              </button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount (KES)</th>
                    <th>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  ${fin.transactions.slice(0, 7).map(t => `
                    <tr>
                      <td><small>${t.transaction_date}</small></td>
                      <td>
                        <span class="badge ${t.type === 'Income' ? 'badge-success' : 'badge-danger'}">
                          ${t.type}
                        </span>
                      </td>
                      <td><strong>${t.category}</strong></td>
                      <td><strong>KES ${Number(t.amount_kes).toLocaleString()}</strong></td>
                      <td><small class="text-muted">${t.reference_no}</small></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Customer Supplies Summary -->
          <div class="table-card">
            <div class="table-header-bar">
              <div>
                <h3>Customer Supplies Summary</h3>
                <p class="text-muted" style="font-size:0.8rem; margin:0;">Stock asset allocation for client sessions</p>
              </div>
              <button class="btn btn-outline btn-sm" onclick="FinanceManager.switchTab('supplies')">Details</button>
            </div>
            <div style="padding:20px;">
              <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
                  <span>Massage & Carrier Oils:</span>
                  <strong>Active Stock</strong>
                </div>
                <div style="height:8px; background:#EEE; border-radius:4px; overflow:hidden;">
                  <div style="width:75%; height:100%; background:var(--accent);"></div>
                </div>
              </div>

              <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
                  <span>Linen & Headrest Sanitation:</span>
                  <strong style="color:${invStats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)'};">${invStats.lowStockCount} Reorders Pending</strong>
                </div>
                <div style="height:8px; background:#EEE; border-radius:4px; overflow:hidden;">
                  <div style="width:${invStats.lowStockCount > 0 ? '30%' : '90%'}; height:100%; background:${invStats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)'};"></div>
                </div>
              </div>

              <div style="padding:14px; background:#F8F9F8; border-radius:8px; border:1px solid var(--border); font-size:0.83rem; margin-top:20px;">
                <i class="fas fa-info-circle text-gold"></i> <strong>Audit Compliance:</strong>
                All massage oils, volcanic stones, and disposable supplies are audited per customer treatment session in compliance with spa cost accounting.
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading financial overview: ${err.message}</div>`;
    }
  },

  // Customer Supplies & Inventory Valuation Tab
  async renderSuppliesValuation() {
    const container = document.getElementById('finance-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Auditing stock valuation...</div>';

    try {
      const [items, stats] = await Promise.all([
        App.api('/api/inventory'),
        App.api('/api/inventory/stats')
      ]);

      const categories = {};
      items.forEach(item => {
        if (!categories[item.category]) categories[item.category] = { count: 0, value: 0 };
        categories[item.category].count += item.quantity;
        categories[item.category].value += (item.quantity * item.cost_per_unit_kes);
      });

      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-boxes text-gold"></i> Customer Supplies & Inventory Asset Valuation</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Real-time balance sheet audit of treatment consumables and parlor supplies</p>
            </div>
            <span class="badge badge-primary">Total Assets: KES ${Number(stats.totalValuation).toLocaleString()}</span>
          </div>

          <!-- Category Valuation breakdown -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; padding:20px 24px; background:#FAFBF9; border-bottom:1px solid var(--border);">
            ${Object.entries(categories).map(([cat, data]) => `
              <div style="background:#FFF; padding:14px; border-radius:8px; border:1px solid var(--border);">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">${cat}</div>
                <div style="font-size:1.25rem; font-weight:800; color:var(--primary); margin:4px 0;">KES ${Number(data.value).toLocaleString()}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">${data.count} units in stock</div>
              </div>
            `).join('')}
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Consumable / Supply Name</th>
                  <th>Category</th>
                  <th>Current Qty</th>
                  <th>Safety Min</th>
                  <th>Unit Cost (KES)</th>
                  <th>Total Asset Value (KES)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const val = item.quantity * item.cost_per_unit_kes;
                  const isLow = item.quantity <= item.min_threshold;
                  return `
                    <tr>
                      <td><code>${item.sku || 'SKU-SMP'}</code></td>
                      <td><strong>${item.name}</strong></td>
                      <td><span class="badge badge-primary">${item.category}</span></td>
                      <td><strong>${item.quantity}</strong> <small class="text-muted">${item.unit}</small></td>
                      <td>${item.min_threshold} ${item.unit}</td>
                      <td>KES ${Number(item.cost_per_unit_kes).toLocaleString()}</td>
                      <td><strong>KES ${Number(val).toLocaleString()}</strong></td>
                      <td>
                        <span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">
                          ${isLow ? 'Low Stock Reorder' : 'Well Stocked'}
                        </span>
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
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading supplies valuation: ${err.message}</div>`;
    }
  },

  // Customer Billings & Payments Tab
  async renderCustomerPayments() {
    const container = document.getElementById('finance-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Retrieving client billing ledger...</div>';

    try {
      const payments = await App.api('/api/payments');
      const totalCollected = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount_kes, 0);

      container.innerHTML = `
        <!-- Business Payment Info Banner -->
        <div style="background:linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%); color:#fff; border-radius:10px; padding:18px 24px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:center;">
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:4px;"><i class="fas fa-university"></i> Business Receiving Account (Customers Pay Here)</div>
            <div style="font-size:1.05rem; font-weight:700;">Steve's Massage Parlour Ltd</div>
            <div style="font-size:0.85rem; opacity:0.9; margin-top:3px;">Equity Bank Kenya — Valley Arcade Branch</div>
            <div style="font-size:0.85rem; opacity:0.9;">Account No: <strong style="font-family:monospace; font-size:1rem; letter-spacing:1px;">0023456789</strong></div>
          </div>
          <div style="border-left:1px solid rgba(255,255,255,0.3); padding-left:18px;">
            <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:4px;"><i class="fas fa-mobile-alt"></i> M-Pesa Details</div>
            <div style="font-size:0.88rem; opacity:0.95; margin-bottom:2px;"><span style="opacity:0.75;">Paybill:</span> <span style="font-family:monospace; font-size:1.2rem; font-weight:900; color:#A8EDBB;">400200</span></div>
            <div style="font-size:0.85rem; opacity:0.9;"><span style="opacity:0.75;">Account No:</span> <span style="font-family:monospace; font-weight:700;">Your Booking Reference</span></div>
            <div style="font-size:0.82rem; opacity:0.75; margin-top:3px;">Buy Goods Till No: <strong style="font-family:monospace; color:#A8EDBB;">5278441</strong></div>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-receipt text-gold"></i> Client Billings & M-Pesa Receipts</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Verified transactions from customer massage therapy sessions</p>
            </div>
            <span class="badge badge-success">Total Collected: KES ${Number(totalCollected).toLocaleString()}</span>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Client Name</th>
                  <th>Service Treatment</th>
                  <th>Amount (KES)</th>
                  <th>Payment Method</th>
                  <th>Transaction Reference</th>
                  <th>Phone Number</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(p => `
                  <tr>
                    <td><strong>${p.reference_no}</strong></td>
                    <td>${p.customer_name}</td>
                    <td>${p.service_name}</td>
                    <td><strong>KES ${Number(p.amount_kes).toLocaleString()}</strong></td>
                    <td>
                      <span class="badge ${p.payment_method === 'M-Pesa' ? 'badge-success' : (p.payment_method === 'Cash' ? 'badge-gold' : 'badge-primary')}">
                        ${p.payment_method}
                      </span>
                    </td>
                    <td><code>${p.transaction_ref}</code></td>
                    <td>${p.phone_number || '—'}</td>
                    <td><small>${p.paid_at ? p.paid_at.substring(0, 16) : 'N/A'}</small></td>
                    <td><span class="badge ${p.status === 'Completed' ? 'badge-success' : 'badge-gold'}">${p.status}</span></td>
                    <td>
                      ${p.status === 'Pending' ? `
                        <button class="btn btn-gold btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="FinanceManager.markPaymentReceived(${p.id})">
                          <i class="fas fa-check"></i> Collect Cash
                        </button>
                      ` : '<span class="text-muted"><i class="fas fa-check-circle text-success"></i> Settled</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading client billings: ${err.message}</div>`;
    }
  },

  async markPaymentReceived(paymentId) {
    try {
      await App.api(`/api/payments/${paymentId}/confirm`, { method: 'POST' });
      App.showToast('Payment confirmed and recorded in financial ledger!');
      this.renderCustomerPayments();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // Expenses Tab
  async renderExpenses() {
    const container = document.getElementById('finance-main-view');
    try {
      const fin = await App.api('/api/finance/overview');
      const expenses = fin.transactions.filter(t => t.type === 'Expense').sort((a,b) => (b.id||0)-(a.id||0));

      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-file-invoice-dollar text-gold"></i> Operating Expense Ledger & Disbursements</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Supplies restocking, therapist commissions, and operational disbursements</p>
            </div>
            <button class="btn btn-gold btn-sm" onclick="FinanceManager.openAddExpenseModal()">
              <i class="fas fa-plus"></i> Record New Expense
            </button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount (KES)</th>
                  <th>Voucher Ref</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(e => `
                  <tr>
                    <td>${e.transaction_date}</td>
                    <td><span class="badge badge-danger">${e.category}</span></td>
                    <td><strong>${e.description}</strong></td>
                    <td><strong style="color:var(--danger);">KES ${Number(e.amount_kes).toLocaleString()}</strong></td>
                    <td><code>${e.reference_no}</code></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:30px;">Error: ${err.message}</div>`;
    }
  },

  // Budgets Tab
  async renderBudgets() {
    const container = document.getElementById('finance-main-view');
    try {
      const fin = await App.api('/api/finance/overview');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-balance-scale text-gold"></i> Departmental Operating Budgets (KES)</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Monthly financial allocations vs actual burn</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Department / Category</th>
                  <th>Allocated (KES)</th>
                  <th>Spent (KES)</th>
                  <th>Remaining (KES)</th>
                  <th>Burn %</th>
                </tr>
              </thead>
              <tbody>
                ${fin.budgets.map(b => {
                  const rem = b.allocated_kes - b.spent_kes;
                  const pct = Math.min(100, Math.round((b.spent_kes / b.allocated_kes) * 100));
                  return `
                    <tr>
                      <td><strong>${b.month}</strong></td>
                      <td><strong>${b.category}</strong></td>
                      <td>KES ${Number(b.allocated_kes).toLocaleString()}</td>
                      <td>KES ${Number(b.spent_kes).toLocaleString()}</td>
                      <td style="color:${rem < 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">
                        KES ${Number(rem).toLocaleString()}
                      </td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                          <div style="flex:1; height:8px; background:#EEE; border-radius:4px; overflow:hidden;">
                            <div style="width:${pct}%; height:100%; background:${pct > 85 ? 'var(--danger)' : 'var(--primary)'};"></div>
                          </div>
                          <span>${pct}%</span>
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
      container.innerHTML = `<div style="color:red; padding:30px;">Error: ${err.message}</div>`;
    }
  },

  openAddExpenseModal() {
    let modal = document.getElementById('finance-add-expense-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'finance-add-expense-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3><i class="fas fa-file-invoice-dollar text-gold"></i> Record Expense Disbursement</h3>
            <button class="modal-close-btn" onclick="App.closeModal('finance-add-expense-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Expense Category</label>
              <select id="fin-exp-cat" class="form-control">
                <option value="Supplies Restock">Supplies Restock (Oils, Linens, Creams)</option>
                <option value="Therapist Commission">Therapist Commission & Payroll</option>
                <option value="Utilities & Laundry">Utilities, Electricity & Towel Laundry</option>
                <option value="Equipment Maintenance">Equipment & Bed Sanitization Maintenance</option>
                <option value="Marketing & Vouchers">Marketing & Promo Vouchers</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description / Vendor Reference</label>
              <input type="text" id="fin-exp-desc" class="form-control" placeholder="e.g. Lavender oil restock via Nairobi Herbal Ltd">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Amount (KES)</label>
                <input type="number" id="fin-exp-amt" class="form-control" placeholder="15000">
              </div>
              <div class="form-group">
                <label>Disbursement Date</label>
                <input type="date" id="fin-exp-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('finance-add-expense-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="FinanceManager.submitExpense()">Record Disbursement</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitExpense() {
    const category = document.getElementById('fin-exp-cat').value;
    const description = document.getElementById('fin-exp-desc').value.trim();
    const amount_kes = Number(document.getElementById('fin-exp-amt').value);
    const transaction_date = document.getElementById('fin-exp-date').value;

    if (!description || !amount_kes || amount_kes <= 0) {
      return App.showToast('Please provide valid description and amount', 'warning');
    }

    try {
      await App.api('/api/finance/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'Expense',
          category,
          description,
          amount_kes,
          transaction_date
        })
      });
      App.showToast(`Expense of KES ${amount_kes.toLocaleString()} recorded.`);
      App.closeModal('finance-add-expense-modal');
      this.switchTab(this.currentTab);
    } catch (err) {
      App.showToast(err.message || 'Failed to record expense', 'danger');
    }
  },

  // Purchase Order Approvals & Workflow Tab
  async renderPOApprovals() {
    const container = document.getElementById('finance-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading purchase orders for finance authorization...</div>';

    try {
      const pos = await App.api('/api/purchase-orders');
      const pending = (pos || []).filter(p => (p.finance_status || 'Pending Approval') === 'Pending Approval' || p.finance_status === 'Pending');
      const processed = (pos || []).filter(p => p.finance_status === 'Approved' || p.finance_status === 'Rejected');

      // Update badge
      const badge = document.getElementById('fin-po-pending-badge');
      if (badge) {
        badge.innerText = pending.length;
        badge.style.display = pending.length > 0 ? 'inline-block' : 'none';
      }

      container.innerHTML = `
        <!-- Pending Approval Section -->
        <div class="table-card" style="margin-bottom:26px;">
          <div class="table-header-bar" style="background:#FFF9E6;">
            <div>
              <h3 style="color:var(--text-dark);"><i class="fas fa-clipboard-check text-gold"></i> Purchase Orders Awaiting Finance Authorization</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Review supplier requisitions, inspect delivery terms, verify budget availability, and approve or reject</p>
            </div>
            <span class="badge ${pending.length > 0 ? 'badge-danger' : 'badge-success'}">${pending.length} Pending Approval</span>
          </div>

          ${pending.length === 0 ? `
            <div style="padding:40px; text-align:center;">
              <i class="fas fa-check-circle text-success" style="font-size:2.5rem; margin-bottom:10px;"></i>
              <h4 style="margin:0 0 6px;">All Purchase Orders Cleared!</h4>
              <p class="text-muted" style="font-size:0.85rem; margin:0;">No pending restock requisitions currently require financial authorization.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Supplier / Vendor</th>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Total Cost (KES)</th>
                    <th>Delivery Option</th>
                    <th>Finance Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pending.map(p => `
                    <tr style="background:#FFFBF2;">
                      <td><strong>${p.po_number}</strong></td>
                      <td><small>${p.order_date}</small></td>
                      <td>
                        <strong>${p.supplier_name}</strong>
                        <div class="text-muted" style="font-size:0.75rem;">${p.supplier_phone || ''}</div>
                      </td>
                      <td><strong>${p.item_name}</strong></td>
                      <td>${p.quantity}</td>
                      <td><strong style="color:var(--primary); font-size:1.05rem;">KES ${Number(p.total_cost_kes).toLocaleString()}</strong></td>
                      <td><span class="badge badge-primary">${p.delivery_option || 'Standard Courier'}</span></td>
                      <td><span class="badge badge-warning"><i class="fas fa-hourglass-half"></i> Pending Review</span></td>
                      <td>
                        <button class="btn btn-gold btn-sm" onclick="FinanceManager.openPOReviewModal(${p.id})">
                          <i class="fas fa-clipboard-check"></i> Review & Decide
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Approved & Processed Section -->
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-history text-gold"></i> Processed Purchase Orders & Goods Received (GRN) Ledgers</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Audit trail of approved vendor expenditures, deliveries, and confirmed inventory receipts</p>
            </div>
            <span class="badge badge-primary">${processed.length} Processed Orders</span>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Item & Qty</th>
                  <th>Amount (KES)</th>
                  <th>Finance Decision</th>
                  <th>Order/Delivery Status</th>
                  <th>GRN / Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${processed.length === 0 ? `
                  <tr><td colspan="8" style="text-align:center; padding:30px;" class="text-muted">No processed purchase orders yet.</td></tr>
                ` : processed.map(p => `
                  <tr>
                    <td><strong>${p.po_number}</strong><br><small class="text-muted">${p.order_date}</small></td>
                    <td><strong>${p.supplier_name}</strong></td>
                    <td>${p.item_name} (${p.quantity} units)</td>
                    <td><strong>KES ${Number(p.total_cost_kes).toLocaleString()}</strong></td>
                    <td>
                      <span class="badge ${p.finance_status === 'Approved' ? 'badge-success' : 'badge-danger'}">
                        <i class="fas ${p.finance_status === 'Approved' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${p.finance_status}
                      </span>
                      ${p.finance_feedback ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">"${p.finance_feedback}"</div>` : ''}
                    </td>
                    <td>
                      <span class="badge ${p.status === 'Received' ? 'badge-success' : (p.status === 'In-Transit' ? 'badge-primary' : 'badge-gold')}">
                        ${p.status}
                      </span>
                    </td>
                    <td>
                      ${p.grn_number ? `
                        <strong style="color:var(--success); font-size:0.82rem;"><i class="fas fa-receipt"></i> ${p.grn_number}</strong>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${p.received_date || ''}</div>
                      ` : '<span class="text-muted">—</span>'}
                    </td>
                    <td>
                      <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        <button class="btn btn-outline btn-sm" onclick="InventoryManager.printPOVoucher(${p.id})">
                          <i class="fas fa-file-invoice"></i> Voucher
                        </button>
                        ${p.grn_number ? `
                          <button class="btn btn-outline btn-sm" onclick="FinanceManager.printGRNReceipt(${p.id})">
                            <i class="fas fa-receipt"></i> GRN Receipt
                          </button>
                          ${p.payment_status === 'Paid' ? `
                            <button class="btn btn-outline btn-sm" style="border-color:#27AE60; color:#27AE60;" onclick="FinanceManager.printSupplierPaymentReceipt(${p.id})">
                              <i class="fas fa-check-circle"></i> Paid Receipt
                            </button>
                          ` : `
                            <button class="btn btn-gold btn-sm" onclick="FinanceManager.openPaySupplierModal(${p.id})">
                              <i class="fas fa-hand-holding-usd"></i> Pay Supplier
                            </button>
                          `}
                        ` : ''}
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
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading purchase orders: ${err.message}</div>`;
    }
  },

  async openPOReviewModal(poId) {
    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      let modal = document.getElementById('finance-po-review-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'finance-po-review-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h3><i class="fas fa-clipboard-check text-gold"></i> Financial Authorization & PO Review</h3>
            <button class="modal-close-btn" onclick="App.closeModal('finance-po-review-modal')">&times;</button>
          </div>
          <div class="modal-body" style="padding:24px;">
            <div style="background:#FAFBF9; border:1px solid var(--border); border-radius:10px; padding:20px; margin-bottom:20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                  <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Purchase Order Number</div>
                  <h3 style="margin:2px 0 10px; color:var(--primary);">${po.po_number}</h3>
                  <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Order Date:</strong> ${po.order_date}</div>
                  <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Requested By:</strong> Inventory Controller (Mercy Chebet)</div>
                  <div style="font-size:0.85rem;"><strong>Current Status:</strong> <span class="badge badge-warning">${po.status}</span></div>
                </div>
                <div>
                  <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Supplier / Vendor Information</div>
                  <h4 style="margin:2px 0 6px; color:var(--text-dark);">${po.supplier_name}</h4>
                  <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Contact Person:</strong> ${po.contact_person || 'N/A'}</div>
                  <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Phone / Email:</strong> ${po.supplier_phone || ''} • ${po.supplier_email || ''}</div>
                  <div style="font-size:0.85rem;"><strong>Payment Terms:</strong> ${po.payment_terms || '30 Days Invoice'}</div>
                </div>
              </div>
            </div>

            <div class="table-responsive" style="margin-bottom:20px;">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Quantity</th>
                    <th>Estimated Unit Cost (KES)</th>
                    <th>Total Commitment (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${po.item_name}</strong></td>
                    <td><strong>${po.quantity}</strong> units</td>
                    <td>KES ${Number(po.total_cost_kes / po.quantity).toLocaleString()}</td>
                    <td><strong style="color:var(--primary); font-size:1.15rem;">KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="background:#FFFDF6; border:1px solid #FFE082; padding:16px; border-radius:8px; margin-bottom:20px; font-size:0.85rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span><strong>Delivery Option:</strong> ${po.delivery_option || 'Standard Courier (Nairobi Express)'}</span>
                <span><strong>Destination:</strong> ${po.delivery_address || 'Steve\'s Massage Parlor Main Suite'}</span>
              </div>
              <div><strong>Delivery Notes / Requisition Memo:</strong> ${po.notes || 'Routine restock requisition for wellness treatments.'}</div>
            </div>

            <div class="form-group">
              <label><strong>Finance Director Feedback / Review Comments</strong></label>
              <textarea id="fin-review-feedback" class="form-control" rows="3" placeholder="Enter comments, budget justification, or reasons for approval / rejection (e.g. 'Approved under Q4 Supplies Restock budget allocation')..."></textarea>
            </div>
          </div>
          <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('finance-po-review-modal')">Cancel</button>
            <div style="display:flex; gap:12px;">
              <button class="btn btn-danger btn-sm" onclick="FinanceManager.submitPOReview(${po.id}, 'Rejected')">
                <i class="fas fa-times-circle"></i> Reject Purchase Order
              </button>
              <button class="btn btn-success btn-sm" onclick="FinanceManager.submitPOReview(${po.id}, 'Approved')">
                <i class="fas fa-check-circle"></i> Approve Purchase Order
              </button>
            </div>
          </div>
        </div>
      `;

      modal.classList.add('show');
    } catch (err) {
      App.showToast(`Failed to load PO details: ${err.message}`, 'danger');
    }
  },

  async submitPOReview(poId, decision) {
    const feedback = (document.getElementById('fin-review-feedback')?.value || '').trim();
    if (decision === 'Rejected' && !feedback) {
      return App.showToast('Please provide feedback explaining the rejection reason.', 'warning');
    }

    try {
      const res = await App.api(`/api/purchase-orders/${poId}/finance-review`, {
        method: 'PUT',
        body: JSON.stringify({ decision, feedback })
      });
      App.showToast(res.message || `Purchase order ${decision.toLowerCase()}!`);
      App.closeModal('finance-po-review-modal');
      this.renderPOApprovals();
    } catch (err) {
      App.showToast(err.message || 'Failed to submit review', 'danger');
    }
  },

  async printGRNReceipt(poId) {
    let modal = document.getElementById('finance-grn-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'finance-grn-receipt-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="modal-box" style="padding:40px; text-align:center;">Loading GRN receipt...</div>';
    modal.classList.add('show');

    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header no-print">
            <h3>Goods Received Note (GRN) & Finance Receipt</h3>
            <button class="modal-close-btn" onclick="App.closeModal('finance-grn-receipt-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" style="padding:40px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:20px; margin-bottom:24px;">
              <div>
                <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOR</h2>
                <div style="font-size:0.85rem; color:var(--text-muted);">Finance & Inventory Accounts • Valley Arcade, Nairobi</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Email: finance@stevesmassage.co.ke • Tel: +254 712 345 678</div>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-success" style="font-size:0.9rem; padding:6px 12px;">GOODS RECEIVED NOTE</span>
                <h3 style="color:var(--accent); margin:8px 0 2px;">${po.grn_number || 'GRN-VERIFIED'}</h3>
                <div style="font-size:0.85rem; color:var(--text-muted);">Receipt Date: ${po.received_date || po.order_date}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Related PO: <strong>${po.po_number}</strong></div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; background:#FAFBF9; padding:18px; border-radius:8px;">
              <div>
                <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Vendor / Supplier:</strong>
                <h4 style="margin:4px 0; color:var(--primary);">${po.supplier_name}</h4>
                <div style="font-size:0.85rem;">Contact: ${po.contact_person || 'Sales Rep'} • ${po.supplier_phone || ''}</div>
                <div style="font-size:0.85rem;">Terms: ${po.payment_terms || '30 Days Invoice'}</div>
              </div>
              <div>
                <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Receiving Department:</strong>
                <h4 style="margin:4px 0; color:var(--primary);">Steve's Massage Parlor - Main Store</h4>
                <div style="font-size:0.85rem;">Received By: <strong>${po.received_by || 'Mercy Chebet (Inventory Controller)'}</strong></div>
                <div style="font-size:0.85rem;">Finance Approval: <strong>${po.finance_status || 'Approved'} (${po.finance_reviewed_at || 'Verified'})</strong></div>
              </div>
            </div>

            <table class="custom-table" style="margin-bottom:24px;">
              <thead>
                <tr>
                  <th>Item Code / Name</th>
                  <th>Quantity Received</th>
                  <th>Unit Cost (KES)</th>
                  <th>Total Capitalized (KES)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${po.item_name}</strong></td>
                  <td><strong>${po.quantity}</strong> units (Added to Stock)</td>
                  <td>KES ${Number(po.total_cost_kes / po.quantity).toLocaleString()}</td>
                  <td><strong style="color:var(--primary); font-size:1.15rem;">KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="background:#E8F5E9; border:1px solid #C8E6C9; padding:14px 18px; border-radius:8px; font-size:0.85rem; color:#2E7D32; margin-bottom:30px;">
              <i class="fas fa-check-double"></i> <strong>Inventory & General Ledger Synchronized:</strong>
              Stock quantities have been automatically credited to the consumables database, and the expense has been recorded in the Finance Director ledger under PO disbursement vouchers.
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:40px; padding-top:20px; border-top:1px dashed var(--border);">
              <div>
                <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
                <div style="font-size:0.82rem; text-align:center;">Store Keeper / Received By: Mercy Chebet</div>
              </div>
              <div>
                <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
                <div style="font-size:0.82rem; text-align:center;">Finance Director Authorization: Patrick Mutua</div>
              </div>
            </div>
          </div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('finance-grn-receipt-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Official Receipt</button>
          </div>
        </div>
      `;
    } catch (err) {
      modal.innerHTML = `<div class="modal-box" style="padding:30px; color:red;">Failed to load receipt: ${err.message}</div>`;
    }
  },

  printStatement() {
    Reports.render().then(() => {
      setTimeout(() => window.print(), 500);
    });
  },

  // Supplier Payments & Disbursements Tab
  async renderSupplierPayments() {
    const container = document.getElementById('finance-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading supplier payment ledgers...</div>';

    try {
      const orders = await App.api('/api/purchase-orders');
      // Sort newest first (highest id = most recent)
      const received = orders.filter(o => o.status === 'Received').sort((a,b) => b.id - a.id);
      const unpaid = received.filter(o => o.payment_status !== 'Paid');
      const paid = received.filter(o => o.payment_status === 'Paid');

      const unpaidBadge = document.getElementById('fin-unpaid-badge');
      if (unpaidBadge) {
        unpaidBadge.innerText = unpaid.length;
        unpaidBadge.style.display = unpaid.length > 0 ? 'inline-block' : 'none';
      }

      const totalUnpaid = unpaid.reduce((sum, o) => sum + Number(o.total_cost_kes || 0), 0);
      const totalPaid = paid.reduce((sum, o) => sum + Number(o.total_cost_kes || 0), 0);

      container.innerHTML = `
        <div class="kpi-grid" style="margin-bottom:24px;">
          <div class="kpi-card ${unpaid.length > 0 ? 'kpi-card-danger' : ''}">
            <div class="kpi-icon ${unpaid.length > 0 ? 'danger' : 'success'}"><i class="fas fa-file-invoice-dollar"></i></div>
            <div class="kpi-info">
              <h4>Pending Supplier Invoices</h4>
              <h2 style="color:${unpaid.length > 0 ? '#C0392B' : '#27AE60'};">${unpaid.length} Invoices</h2>
              <small class="text-muted">KES ${totalUnpaid.toLocaleString()} awaiting remittance</small>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="kpi-info">
              <h4>Total Settled to Suppliers</h4>
              <h2 style="color:#27AE60;">KES ${totalPaid.toLocaleString()}</h2>
              <small class="text-muted">Fully verified & receipted</small>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="fas fa-boxes"></i></div>
            <div class="kpi-info">
              <h4>Received Stock Deliveries</h4>
              <h2>${received.length} Shipments</h2>
              <small class="text-muted">Supported by verified GRNs</small>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h3><i class="fas fa-list text-gold"></i> Received Goods Invoices & Payment Schedule</h3>
            <span class="badge badge-info"><i class="fas fa-shield-alt"></i> Payments restricted to verified GRNs</span>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier / Vendor</th>
                  <th>Item & Qty Received</th>
                  <th>Total Due (KES)</th>
                  <th>GRN Reference</th>
                  <th>Payment Status</th>
                  <th>Receipt No</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${received.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align:center; padding:35px;" class="text-muted">
                      <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px; display:block; color:#BDC3C7;"></i>
                      No received purchase orders found. Orders must first be confirmed received in the Inventory Module before payments can be processed.
                    </td>
                  </tr>
                ` : received.map(p => {
                  const isPaid = p.payment_status === 'Paid';
                  return `
                    <tr style="${!isPaid ? 'background:#FFFBF2;' : ''}">
                      <td><strong>${p.po_number}</strong><br><small class="text-muted">${p.order_date}</small></td>
                      <td>
                        <strong>${p.supplier_name}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${p.supplier_phone || ''}</div>
                      </td>
                      <td>${p.item_name} (<strong>${p.quantity}</strong> units)</td>
                      <td><strong style="color:var(--primary); font-size:1.05rem;">KES ${Number(p.total_cost_kes).toLocaleString()}</strong></td>
                      <td>
                        <button class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.75rem;" onclick="FinanceManager.printGRNReceipt(${p.id})">
                          <i class="fas fa-receipt"></i> ${p.grn_number || 'GRN-VERIFIED'}
                        </button>
                        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Rcvd: ${p.received_date || ''}</div>
                      </td>
                      <td>
                        ${isPaid ? `
                          <span class="badge badge-success"><i class="fas fa-check-circle"></i> PAID</span>
                          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${p.payment_date || ''}</div>
                        ` : `
                          <span class="badge badge-warning"><i class="fas fa-clock"></i> PENDING PAYMENT</span>
                        `}
                      </td>
                      <td>
                        ${isPaid && p.payment_receipt_no ? `
                          <code style="font-weight:700; color:var(--primary);">${p.payment_receipt_no}</code>
                          <div style="font-size:0.72rem; color:var(--text-muted);">${p.payment_method || 'M-Pesa'}</div>
                        ` : '<span class="text-muted">—</span>'}
                      </td>
                      <td>
                        ${!isPaid ? `
                          <button class="btn btn-gold btn-sm" onclick="FinanceManager.openPaySupplierModal(${p.id})">
                            <i class="fas fa-hand-holding-usd"></i> Pay Supplier
                          </button>
                        ` : `
                          <button class="btn btn-outline btn-sm" onclick="FinanceManager.printSupplierPaymentReceipt(${p.id})">
                            <i class="fas fa-print"></i> Print Receipt
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" style="margin-top:24px; background:#FAFBF9; border-left:4px solid var(--accent);">
          <h4><i class="fas fa-info-circle text-gold"></i> Standard Operating Procedure: Supplier Disbursements</h4>
          <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.6; margin:0;">
            Disbursements to vendors are strictly authorized <strong>only after</strong> physical shipment inspection has been confirmed and booked into stock with a Goods Received Note (GRN) by the Inventory Manager. This maintains strict three-way matching audit compliance between the Purchase Order, Receiving Inspection, and Financial Disbursement Voucher.
          </p>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading supplier payments: ${err.message}</div>`;
    }
  },

  async openPaySupplierModal(poId) {
    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      if (po.status !== 'Received') {
        return App.showToast('Payment can only be disbursed after goods are physically received and GRN generated.', 'warning');
      }
      if (po.payment_status === 'Paid') {
        return this.printSupplierPaymentReceipt(poId);
      }

      let modal = document.getElementById('finance-pay-supplier-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'finance-pay-supplier-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      const defaultRef = 'MPESA-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h3><i class="fas fa-hand-holding-usd text-gold"></i> Authorize & Disburse Supplier Payment</h3>
            <button class="modal-close-btn" onclick="App.closeModal('finance-pay-supplier-modal')">&times;</button>
          </div>
          <div class="modal-body" style="padding:24px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div style="background:#FAFBF9; border:1px solid var(--border); border-radius:8px; padding:16px;">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Beneficiary / Vendor</div>
                <h4 style="margin:4px 0 6px; color:var(--primary);">${po.supplier_name}</h4>
                <div style="font-size:0.85rem; color:var(--text-muted);">Attn: ${po.contact_person || 'Sales Rep'} • ${po.supplier_phone || ''}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Terms: ${po.payment_terms || '30 Days Invoice'}</div>
                ${po.bank_name ? `
                <hr style="margin:10px 0 8px; border:none; border-top:1px solid #DDE; opacity:0.5;">
                <div style="font-size:0.72rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:5px;"><i class="fas fa-university"></i> Supplier Receiving Account</div>
                <div style="font-size:0.83rem;"><strong>Bank:</strong> ${po.bank_name}</div>
                <div style="font-size:0.83rem;"><strong>Account No:</strong> <code style="font-weight:700; font-size:0.88rem;">${po.bank_account || '—'}</code></div>
                ${po.mpesa_paybill ? `<div style="font-size:0.83rem;"><strong>M-Pesa Paybill:</strong> <code style="color:#27AE60; font-weight:800; font-size:0.95rem;">${po.mpesa_paybill}</code></div>` : ''}
                ${po.mpesa_till ? `<div style="font-size:0.83rem;"><strong>M-Pesa Buy Goods Till:</strong> <code style="color:#27AE60; font-weight:800; font-size:0.95rem;">${po.mpesa_till}</code></div>` : ''}
                ` : ''}
              </div>
              <div style="background:#FAFBF9; border:1px solid var(--border); border-radius:8px; padding:16px;">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Underlying Verification</div>
                <div style="font-size:0.85rem; margin-top:4px;">PO Number: <strong>${po.po_number}</strong></div>
                <div style="font-size:0.85rem; margin-top:2px;">GRN Note: <strong style="color:var(--success);">${po.grn_number || 'GRN-VERIFIED'}</strong></div>
                <div style="font-size:0.85rem; margin-top:2px;">Received Date: <strong>${po.received_date || po.order_date}</strong></div>
              </div>
            </div>

            <div style="background:#FFFBF2; border:1px solid #F5CBA7; border-radius:8px; padding:16px; margin-bottom:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Item Supplied</div>
                  <h4 style="margin:2px 0; color:var(--primary);">${po.item_name} x ${po.quantity} units</h4>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Total Net Payable</div>
                  <strong style="color:var(--primary); font-size:1.4rem;">KES ${Number(po.total_cost_kes).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
              <label style="display:block; font-weight:600; margin-bottom:6px;">Payment Method</label>
              <select id="fin-pay-method" class="form-control" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px;">
                <option value="M-Pesa Business Till">Safaricom M-Pesa Business Till / Buy Goods (Instant B2B)</option>
                <option value="Bank Wire Transfer (EFT/RTGS)">Bank Wire Transfer / EFT / RTGS (Corporate Account)</option>
                <option value="Cheque / Banker's Draft">Corporate Cheque / Banker's Draft</option>
                <option value="Corporate Debit/Credit Card">Corporate Visa / Mastercard</option>
                <option value="Petty Cash Voucher">Authorized Petty Cash Voucher</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
              <label style="display:block; font-weight:600; margin-bottom:6px;">Transaction / M-Pesa / Cheque Reference</label>
              <input type="text" id="fin-pay-ref" class="form-control" value="${defaultRef}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-family:monospace; font-weight:700;">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
              <div class="form-group">
                <label style="display:block; font-weight:600; margin-bottom:6px;">Amount (KES)</label>
                <input type="number" id="fin-pay-amount" class="form-control" value="${po.total_cost_kes}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:1.1rem; font-weight:700; color:var(--primary);">
              </div>
              <div class="form-group">
                <label style="display:block; font-weight:600; margin-bottom:6px;">Payment Date</label>
                <input type="date" id="fin-pay-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px;">
              </div>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
              <label style="display:block; font-weight:600; margin-bottom:6px;">Remittance Notes (Optional)</label>
              <textarea id="fin-pay-notes" class="form-control" rows="2" placeholder="e.g. Full settlement per agreed vendor payment terms" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px;"></textarea>
            </div>

            <div style="background:#FAFBF9; border:1px solid var(--border); border-radius:6px; padding:12px 16px; margin-bottom:20px; font-size:0.85rem;">
              <div style="display:flex; justify-content:space-between;">
                <span>Disbursing Officer:</span>
                <strong>Patrick Mutua (Finance Officer)</strong>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('finance-pay-supplier-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="FinanceManager.submitSupplierPayment(${po.id})">
              <i class="fas fa-check-circle"></i> Confirm & Disburse Payment
            </button>
          </div>
        </div>
      `;

      modal.classList.add('show');
    } catch (err) {
      App.showToast(`Failed to load payment details: ${err.message}`, 'danger');
    }
  },

  async submitSupplierPayment(poId) {
    const payment_method = document.getElementById('fin-pay-method')?.value || 'M-Pesa Business Till';
    const reference_no   = document.getElementById('fin-pay-ref')?.value?.trim();
    const amount_paid    = Number(document.getElementById('fin-pay-amount')?.value || 0);
    const payment_date   = document.getElementById('fin-pay-date')?.value;
    const notes          = document.getElementById('fin-pay-notes')?.value?.trim();

    if (!reference_no) return App.showToast('Please provide a transaction reference number', 'warning');
    if (!amount_paid || amount_paid <= 0) return App.showToast('Please provide a valid payment amount', 'warning');

    try {
      const res = await App.api(`/api/purchase-orders/${poId}/pay-supplier`, {
        method: 'POST',
        body: JSON.stringify({ payment_method, reference_no, amount_paid, payment_date, notes })
      });

      App.showToast(res.message || 'Payment disbursed successfully!');
      App.closeModal('finance-pay-supplier-modal');

      if (this.currentTab === 'supplier-payments') {
        this.renderSupplierPayments();
      } else if (this.currentTab === 'po-approvals') {
        this.renderPOApprovals();
      }

      // Immediately offer printable receipt
      this.printSupplierPaymentReceipt(poId);
    } catch (err) {
      App.showToast(err.message || 'Failed to process supplier payment', 'danger');
    }
  },

  async printSupplierPaymentReceipt(poId) {
    let modal = document.getElementById('finance-payment-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'finance-payment-receipt-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="modal-box" style="padding:40px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Generating official payment receipt...</div>';
    modal.classList.add('show');

    try {
      const po = await App.api(`/api/purchase-orders/${poId}/payment-receipt`);

      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header no-print">
            <h3><i class="fas fa-file-invoice-dollar text-gold"></i> Official Supplier Payment Voucher</h3>
            <button class="modal-close-btn" onclick="App.closeModal('finance-payment-receipt-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" style="padding:40px; background:#FFF;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--primary); padding-bottom:20px; margin-bottom:24px;">
              <div>
                <h2 style="color:var(--primary); margin:0; font-family:'Playfair Display', serif;">
                  <i class="fas fa-spa text-gold"></i> STEVE'S MASSAGE PARLOUR
                </h2>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Finance & Treasury Department • Valley Arcade, Gitanga Rd, Nairobi</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">KRA PIN: P051239840Z • Tel: +254 712 345 678 • Email: finance@stevesmassage.co.ke</div>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-success" style="font-size:0.85rem; padding:6px 14px; text-transform:uppercase;">
                  <i class="fas fa-check-circle"></i> PAYMENT DISBURSED
                </span>
                <h3 style="color:var(--accent); margin:8px 0 2px; font-family:monospace; font-size:1.35rem;">${po.payment_receipt_no || 'SPR-2026-VERIFIED'}</h3>
                <div style="font-size:0.85rem; color:var(--text-muted);">Date: <strong>${po.payment_date || new Date().toISOString().split('T')[0]}</strong></div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Ref: <strong>${po.payment_reference || '-'}</strong></div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; background:#FAFBF9; padding:18px; border-radius:8px; border:1px solid #EAECE8;">
              <div>
                <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; display:block; margin-bottom:6px;">
                  <i class="fas fa-building text-gold"></i> Payee / Beneficiary:
                </strong>
                <h4 style="margin:0 0 6px; color:var(--primary);">${po.supplier_name}</h4>
                <div style="font-size:0.85rem;">Attn: ${po.contact_person || 'Sales Rep'}</div>
                <div style="font-size:0.85rem;">Phone: ${po.supplier_phone || ''}</div>
                <div style="font-size:0.85rem;">Email: ${po.supplier_email || ''}</div>
                <div style="font-size:0.85rem;">Address: ${po.supplier_address || ''}</div>
                ${po.bank_name ? `
                <div style="margin-top:10px; padding:8px 10px; background:#F0FFF4; border-radius:5px; border-left:3px solid #27AE60;">
                  <div style="font-size:0.72rem; color:#27AE60; font-weight:700; text-transform:uppercase; margin-bottom:4px;"><i class="fas fa-university"></i> Paid to Account</div>
                  <div style="font-size:0.83rem;"><strong>${po.bank_name}</strong> — Acc: <code style="font-weight:700;">${po.bank_account || '—'}</code></div>
                  ${po.mpesa_paybill ? `<div style="font-size:0.83rem;">M-Pesa Paybill: <strong style="color:#27AE60;">${po.mpesa_paybill}</strong></div>` : ''}
                  ${po.mpesa_till ? `<div style="font-size:0.83rem;">Buy Goods Till: <strong style="color:#27AE60;">${po.mpesa_till}</strong></div>` : ''}
                </div>` : ''}
              </div>
              <div>
                <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; display:block; margin-bottom:6px;">
                  <i class="fas fa-file-contract text-gold"></i> Underlying Documents:
                </strong>
                <div style="font-size:0.88rem; margin-bottom:4px;">PO Number: <strong>${po.po_number}</strong> (${po.order_date})</div>
                <div style="font-size:0.88rem; margin-bottom:4px;">GRN Note: <strong style="color:var(--success);">${po.grn_number || 'GRN-VERIFIED'}</strong></div>
                <div style="font-size:0.88rem; margin-bottom:4px;">Received Date: <strong>${po.received_date || po.order_date}</strong></div>
                <div style="font-size:0.88rem;">Received By: <strong>${po.received_by || 'Mercy Chebet'}</strong></div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:24px; padding:12px 18px; background:#FFFBF2; border:1px solid #F5CBA7; border-radius:8px;">
              <div>
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Payment Method</div>
                <div style="font-weight:700; color:var(--primary); margin-top:2px;">${po.payment_method || 'M-Pesa Business Till'}</div>
              </div>
              <div>
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Transaction Ref</div>
                <code style="font-size:0.9rem; font-weight:700; color:#B9770E; margin-top:2px; display:inline-block;">${po.payment_reference || '-'}</code>
              </div>
              <div>
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Disbursing Officer</div>
                <div style="font-weight:600; color:var(--primary); margin-top:2px;">${po.paid_by || 'Patrick Mutua (Finance Officer)'}</div>
              </div>
            </div>

            <table class="custom-table" style="margin-bottom:24px; width:100%;">
              <thead>
                <tr>
                  <th>Item / Consumable Description</th>
                  <th style="text-align:center;">Qty Received</th>
                  <th style="text-align:right;">Agreed Unit Price</th>
                  <th style="text-align:right;">Total Disbursed (KES)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${po.item_name}</strong><br><small class="text-muted">Stock item verified and credited into catalog</small></td>
                  <td style="text-align:center;"><span class="badge badge-success">${po.quantity} units</span></td>
                  <td style="text-align:right;">KES ${Number(po.total_cost_kes / po.quantity).toLocaleString()}</td>
                  <td style="text-align:right; font-weight:700; color:var(--primary); font-size:1.15rem;">KES ${Number(po.total_cost_kes).toLocaleString()}</td>
                </tr>
                <tr style="background:#FAFBF9;">
                  <td colspan="3" style="text-align:right; font-weight:700; font-size:1.05rem;">Total Net Remittance Paid:</td>
                  <td style="text-align:right; font-weight:800; font-size:1.35rem; color:var(--primary);">KES ${Number(po.total_cost_kes).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style="background:#E8F8F5; border:1px solid #A3E4D7; padding:12px 18px; border-radius:8px; font-size:0.85rem; color:#117A65; margin-bottom:30px;">
              <i class="fas fa-check-double"></i> <strong>Audit Compliance Verified:</strong>
              This payment voucher confirms that the purchased consumables were physically received and booked into the inventory ledger under ${po.grn_number || 'GRN'} before payment was authorized.
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:35px; padding-top:20px; border-top:1px dashed var(--border);">
              <div>
                <div style="height:40px; border-bottom:1px solid #333; margin-bottom:6px; display:flex; align-items:flex-end;">
                  <span style="font-family:'Playfair Display', serif; font-style:italic; font-size:1.05rem; color:var(--primary);">${po.paid_by || 'Patrick Mutua'}</span>
                </div>
                <div style="font-size:0.82rem; text-align:center; color:var(--text-muted); font-weight:600;">Authorized by: Finance Officer</div>
                <div style="font-size:0.75rem; text-align:center; color:var(--text-muted);">Date: ${po.payment_date || ''}</div>
              </div>
              <div>
                <div style="height:40px; border-bottom:1px solid #333; margin-bottom:6px; display:flex; align-items:flex-end; justify-content:center;">
                  <span style="font-family:'Playfair Display', serif; font-style:italic; font-size:1.05rem; color:var(--primary);">Steve Mwangi</span>
                </div>
                <div style="font-size:0.82rem; text-align:center; color:var(--text-muted); font-weight:600;">Managing Director & Administrator</div>
                <div style="font-size:0.75rem; text-align:center; color:var(--text-muted);">Steve's Massage Parlour - Valley Arcade</div>
              </div>
            </div>
          </div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('finance-payment-receipt-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Official Receipt</button>
          </div>
        </div>
      `;
    } catch (err) {
      modal.innerHTML = `<div class="modal-box" style="padding:30px; color:red;">Failed to load payment receipt: ${err.message}</div>`;
    }
  },
};

// ============================================================================
// 2. INVENTORY MANAGER PORTAL
// Dedicated inventory portal for Mercy Chebet (Inventory Controller)
// Embeds full 5-part inventory catalog, reorders, suppliers, POs, and movements
// ============================================================================
const InventoryPortal = {
  async init() {
    if (!App.currentUser || (App.currentUser.role !== 'inventory_manager' && App.currentUser.role !== 'admin')) {
      App.showToast('Access Restricted: The Inventory & Supplies suite is strictly reserved for the Inventory Manager (Mercy Chebet).', 'danger');
      App.closePortal();
      return;
    }

    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2><i class="fas fa-boxes text-gold"></i> Inventory & Supplies Control Suite</h2>
          <p class="text-muted">Welcome, ${App.currentUser.name} • Certified Inventory Controller (DBIT 226)</p>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline btn-sm" onclick="App.closePortal()">
            <i class="fas fa-eye"></i> View Public Site
          </button>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.openAddItemModal()">
            <i class="fas fa-plus"></i> New Stock Item
          </button>
        </div>
      </div>

      <div id="inventory-manager-host"></div>
    `;

    // Initialize full inventory manager into our host div
    await InventoryManager.init('inventory-manager-host');
  }
};

// ============================================================================
// 3. SERVICE MANAGER PORTAL & SERVICE MANAGEMENT MODULE
// Dedicated service management suite for Lucas Ochieng (Spa Services Manager)
// ============================================================================
const ServiceManager = {
  currentTab: 'appointments',

  async init() {
    if (!App.currentUser || (App.currentUser.role !== 'service_manager' && App.currentUser.role !== 'admin')) {
      App.showToast('Access Restricted: The Service Module is strictly reserved for the Spa Services Manager (Lucas Ochieng).', 'danger');
      App.closePortal();
      return;
    }

    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2><i class="fas fa-spa text-gold"></i> Spa Service Management Module</h2>
          <p class="text-muted">Welcome, ${App.currentUser.name} • Spa Services & Treatments Director (DBIT 226)</p>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline btn-sm" onclick="App.closePortal()">
            <i class="fas fa-eye"></i> View Public Site
          </button>
          <button class="btn btn-gold btn-sm" onclick="ServiceManager.openAddModal()">
            <i class="fas fa-plus-circle"></i> Add New Treatment
          </button>
        </div>
      </div>

      <div class="portal-nav-tabs">
        <button class="portal-tab active" id="srv-tab-appts" onclick="ServiceManager.switchTab('appointments')"><i class="fas fa-calendar-check text-gold"></i> Booked Service Appointments</button>
        <button class="portal-tab" id="srv-tab-list" onclick="ServiceManager.switchTab('services')"><i class="fas fa-spa"></i> Treatment Catalog & Pricing</button>
        <button class="portal-tab" id="srv-tab-cats" onclick="ServiceManager.switchTab('categories')"><i class="fas fa-th-large"></i> Wellness Categories</button>
        <button class="portal-tab" id="srv-tab-staff" onclick="ServiceManager.switchTab('staff')"><i class="fas fa-user-md"></i> Therapist Assignments</button>
        <button class="portal-tab" id="srv-tab-analytics" onclick="ServiceManager.switchTab('analytics')"><i class="fas fa-chart-pie"></i> Service Popularity Telemetry</button>
      </div>

      <div id="service-manager-main-view"></div>
    `;

    this.switchTab('appointments');
  },

  switchTab(tab) {
    this.currentTab = tab;
    ['appointments', 'services', 'categories', 'staff', 'analytics'].forEach(t => {
      const btn = document.getElementById(`srv-tab-${t}`);
      if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`srv-tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (tab === 'appointments') this.renderAppointments();
    else if (tab === 'services') this.renderServicesCatalog();
    else if (tab === 'categories') this.renderCategories();
    else if (tab === 'staff') this.renderStaffAssignments();
    else if (tab === 'analytics') this.renderAnalytics();
  },

  // Booked Service Appointments View - Reflects all client bookings
  async renderAppointments(statusFilter = '') {
    const container = document.getElementById('service-manager-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading booked service sessions...</div>';

    try {
      const appointments = await App.api('/api/appointments');
      const filtered = statusFilter ? appointments.filter(a => a.status === statusFilter) : appointments;

      const totalBookings = appointments.length;
      const inSession = appointments.filter(a => a.status === 'In-Session').length;
      const completed = appointments.filter(a => a.status === 'Completed').length;
      const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
      const totalRevenue = appointments.reduce((sum, a) => sum + (Number(a.total_price_kes) || 0), 0);

      container.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="fas fa-calendar-check"></i></div>
            <div class="kpi-info">
              <h4>Total Service Bookings</h4>
              <h2>${totalBookings}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon gold"><i class="fas fa-hourglass-half"></i></div>
            <div class="kpi-info">
              <h4>Confirmed / In-Session</h4>
              <h2 style="color:var(--primary);">${confirmed + inSession}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="fas fa-check-circle"></i></div>
            <div class="kpi-info">
              <h4>Completed Sessions</h4>
              <h2 style="color:var(--success);">${completed}</h2>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
            <div class="kpi-info">
              <h4>Total Booked Value</h4>
              <h2 style="color:var(--accent);">KES ${Number(totalRevenue).toLocaleString()}</h2>
            </div>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-calendar-alt text-gold"></i> Live Service Bookings & Treatment Sessions</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Real-time appointment schedule, customer requests, and therapist assignments</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <select id="sm-status-filter" class="form-control" style="width:160px; padding:6px 10px;" onchange="ServiceManager.renderAppointments(this.value)">
                <option value="" ${statusFilter === '' ? 'selected' : ''}>All Statuses (${appointments.length})</option>
                <option value="Confirmed" ${statusFilter === 'Confirmed' ? 'selected' : ''}>Confirmed (${confirmed})</option>
                <option value="In-Session" ${statusFilter === 'In-Session' ? 'selected' : ''}>In-Session (${inSession})</option>
                <option value="Completed" ${statusFilter === 'Completed' ? 'selected' : ''}>Completed (${completed})</option>
                <option value="Cancelled" ${statusFilter === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
              <button class="btn btn-gold btn-sm" onclick="Booking.openBookingModal()">
                <i class="fas fa-calendar-plus"></i> New Booking
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Ref No</th>
                  <th>Treatment / Service</th>
                  <th>Customer</th>
                  <th>Specialist</th>
                  <th>Date & Slot</th>
                  <th>Price (KES)</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Session Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? '<tr><td colspan="9" style="text-align:center; padding:30px;" class="text-muted">No appointments found matching this filter.</td></tr>' : ''}
                ${filtered.map(a => {
                  const statusBadge = a.status === 'Completed' ? 'badge-success' : (a.status === 'In-Session' ? 'badge-gold' : (a.status === 'Cancelled' ? 'badge-danger' : 'badge-primary'));
                  return `
                    <tr>
                      <td><strong>${a.reference_no}</strong></td>
                      <td>
                        <strong>${a.service_name}</strong>
                        ${a.notes ? `<div style="font-size:0.75rem; color:var(--text-muted);"><i class="fas fa-notes-medical"></i> ${a.notes}</div>` : ''}
                      </td>
                      <td>
                        <div><strong>${a.customer_name}</strong></div>
                        <small class="text-muted">${a.customer_phone || ''}</small>
                      </td>
                      <td>
                        <span class="badge badge-primary"><i class="fas fa-user-md"></i> ${a.therapist_name}</span>
                      </td>
                      <td>
                        <div><i class="far fa-calendar"></i> ${a.appointment_date}</div>
                        <small class="text-muted"><i class="far fa-clock"></i> ${a.appointment_time}</small>
                      </td>
                      <td><strong>KES ${Number(a.total_price_kes).toLocaleString()}</strong></td>
                      <td>
                        <span class="badge ${a.payment_status === 'Completed' ? 'badge-success' : 'badge-danger'}">
                          ${a.payment_method || 'M-Pesa'} (${a.payment_status || 'Pending'})
                        </span>
                      </td>
                      <td>
                        <span class="badge ${statusBadge}">${a.status}</span>
                      </td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          ${a.status === 'Confirmed' ? `
                            <button class="btn btn-outline btn-sm" title="Start Session" onclick="ServiceManager.updateApptStatus(${a.id}, 'In-Session')">
                              <i class="fas fa-play text-gold"></i> Start
                            </button>
                          ` : ''}
                          ${a.status === 'In-Session' ? `
                            <button class="btn btn-gold btn-sm" title="Mark Completed" onclick="ServiceManager.updateApptStatus(${a.id}, 'Completed')">
                              <i class="fas fa-check"></i> Complete
                            </button>
                          ` : ''}
                          ${a.status !== 'Completed' && a.status !== 'Cancelled' ? `
                            <button class="btn btn-outline btn-sm" style="color:var(--danger);" title="Cancel Appointment" onclick="ServiceManager.updateApptStatus(${a.id}, 'Cancelled')">
                              <i class="fas fa-times"></i>
                            </button>
                          ` : ''}
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
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading service appointments: ${err.message}</div>`;
    }
  },

  async updateApptStatus(apptId, newStatus) {
    try {
      await App.api(`/api/appointments/${apptId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      App.showToast(`Session updated to ${newStatus}`);
      this.renderAppointments();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // Services Catalog
  async renderServicesCatalog() {
    const container = document.getElementById('service-manager-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading treatment offerings...</div>';

    try {
      const services = await App.api('/api/services');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Spa Treatment Catalog & Pricing (KES)</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Configure treatment offerings, durations, pricing in KES, and health benefits</p>
            </div>
            <button class="btn btn-gold btn-sm" onclick="ServiceManager.openAddModal()">
              <i class="fas fa-plus"></i> Add New Treatment
            </button>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Treatment Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price (KES)</th>
                  <th>Health Benefits</th>
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
                      <div class="text-muted" style="font-size:0.8rem;">${s.description.substring(0, 65)}...</div>
                    </td>
                    <td><span class="badge badge-primary">${s.category_name}</span></td>
                    <td>${s.duration_mins} mins</td>
                    <td><strong>KES ${Number(s.price_kes).toLocaleString()}</strong></td>
                    <td style="max-width:240px;"><small class="text-muted">${s.benefits || 'Therapeutic relaxation'}</small></td>
                    <td>
                      <span class="badge ${s.active ? 'badge-success' : 'badge-danger'}">
                        ${s.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-outline btn-sm" title="Edit Treatment" onclick="ServiceManager.openEditModal(${s.id})">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--danger);" title="Toggle Active/Deactivate" onclick="ServiceManager.toggleService(${s.id}, ${s.active})">
                          <i class="fas ${s.active ? 'fa-toggle-on text-gold' : 'fa-toggle-off text-muted'}"></i>
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
      container.innerHTML = `<div style="color:red; padding:30px;">Error loading treatments: ${err.message}</div>`;
    }
  },

  // Categories View
  async renderCategories() {
    const container = document.getElementById('service-manager-main-view');
    try {
      const cats = await App.api('/api/categories');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Wellness Service Pillars & Categories</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Standardized treatment groupings per spa clinical standards</p>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; padding:24px;">
            ${cats.map(c => `
              <div style="border:1px solid var(--border); border-radius:10px; padding:20px; background:#FAFBF9;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                  <div style="width:42px; height:42px; border-radius:50%; background:var(--primary); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                    <i class="fas ${c.icon || 'fa-spa'}"></i>
                  </div>
                  <div>
                    <h4 style="margin:0; color:var(--primary);">${c.name}</h4>
                    <small class="text-muted">Category #${c.id}</small>
                  </div>
                </div>
                <p class="text-muted" style="font-size:0.85rem; margin:0;">${c.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:30px;">Error: ${err.message}</div>`;
    }
  },

  // Staff Assignments View
  async renderStaffAssignments() {
    const container = document.getElementById('service-manager-main-view');
    try {
      const therapists = await App.api('/api/therapists');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3>Therapist Treatment Specializations</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Certified wellness staff assignments and working rosters</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Therapist Name</th>
                  <th>Clinical Specialization</th>
                  <th>Experience</th>
                  <th>Working Days</th>
                  <th>Shift Hours</th>
                  <th>Client Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${therapists.map(t => `
                  <tr>
                    <td><strong>${t.name}</strong></td>
                    <td><span class="badge badge-primary">${t.specialization}</span></td>
                    <td>${t.experience_years} years</td>
                    <td><small>${t.working_days}</small></td>
                    <td><small>${t.working_hours}</small></td>
                    <td><strong class="text-gold">★ ${t.rating}</strong> / 5.0</td>
                    <td><span class="badge badge-success">Active Specialist</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red; padding:30px;">Error: ${err.message}</div>`;
    }
  },

  // Utilization & Analytics
  async renderAnalytics() {
    const container = document.getElementById('service-manager-main-view');
    try {
      const dash = await App.api('/api/reports/dashboard');
      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-chart-pie text-gold"></i> Service Utilization & Popularity Breakdown</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:0;">Booking volume and revenue contribution per treatment</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Treatment Offering</th>
                  <th>Completed Bookings</th>
                  <th>Total Earned (KES)</th>
                  <th>Revenue Share</th>
                </tr>
              </thead>
              <tbody>
                ${dash.popularServices.map(s => {
                  const pct = Math.round((s.total_earned / (dash.totalRevenue || 1)) * 100);
                  return `
                    <tr>
                      <td><strong>${s.name}</strong></td>
                      <td><strong>${s.booking_count} sessions</strong></td>
                      <td>KES ${Number(s.total_earned).toLocaleString()}</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                          <div style="flex:1; height:8px; background:#EEE; border-radius:4px; overflow:hidden;">
                            <div style="width:${pct}%; height:100%; background:var(--accent);"></div>
                          </div>
                          <span>${pct}%</span>
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
      container.innerHTML = `<div style="color:red; padding:30px;">Error: ${err.message}</div>`;
    }
  },

  // Add Treatment Modal
  openAddModal() {
    let modal = document.getElementById('sm-add-service-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sm-add-service-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-spa text-gold"></i> Register New Massage Treatment</h3>
          <button class="modal-close-btn" onclick="App.closeModal('sm-add-service-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Treatment Name</label>
            <input type="text" id="sm-add-name" class="form-control" placeholder="e.g. Prenatal Organic Relief Massage">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="sm-add-cat" class="form-control">
              ${App.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Duration (Minutes)</label>
              <input type="number" id="sm-add-dur" class="form-control" value="60">
            </div>
            <div class="form-group">
              <label>Price in KES</label>
              <input type="number" id="sm-add-price" class="form-control" placeholder="3800">
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="sm-add-desc" class="form-control" rows="3" placeholder="Clinical description of strokes, pressure levels, and targeted muscle zones..."></textarea>
          </div>
          <div class="form-group">
            <label>Health Benefits (Semicolon separated)</label>
            <input type="text" id="sm-add-benefits" class="form-control" placeholder="Relieves lumbar stress; Improves circulation; Safe for expectant mothers">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('sm-add-service-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="ServiceManager.submitAdd()">Save Treatment</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  async submitAdd() {
    const payload = {
      name: document.getElementById('sm-add-name').value.trim(),
      category_id: Number(document.getElementById('sm-add-cat').value),
      duration_mins: Number(document.getElementById('sm-add-dur').value),
      price_kes: Number(document.getElementById('sm-add-price').value),
      description: document.getElementById('sm-add-desc').value.trim(),
      benefits: document.getElementById('sm-add-benefits').value.trim()
    };

    if (!payload.name || !payload.price_kes || !payload.description) {
      return App.showToast('Name, price, and description are required', 'warning');
    }

    try {
      await App.api('/api/services', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast(`Treatment "${payload.name}" published!`);
      App.closeModal('sm-add-service-modal');
      await App.loadInitialData();
      this.renderServicesCatalog();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async openEditModal(serviceId) {
    const services = await App.api('/api/services');
    const s = services.find(item => item.id === serviceId);
    if (!s) return App.showToast('Treatment not found', 'danger');

    let modal = document.getElementById('sm-edit-service-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sm-edit-service-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-edit text-gold"></i> Edit Massage Treatment</h3>
          <button class="modal-close-btn" onclick="App.closeModal('sm-edit-service-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Treatment Name</label>
            <input type="text" id="sm-edit-name" class="form-control" value="${s.name}">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="sm-edit-cat" class="form-control">
              ${App.categories.map(c => `<option value="${c.id}" ${s.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Duration (Minutes)</label>
              <input type="number" id="sm-edit-dur" class="form-control" value="${s.duration_mins}">
            </div>
            <div class="form-group">
              <label>Price in KES</label>
              <input type="number" id="sm-edit-price" class="form-control" value="${s.price_kes}">
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="sm-edit-desc" class="form-control" rows="3">${s.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Health Benefits</label>
            <input type="text" id="sm-edit-benefits" class="form-control" value="${s.benefits || ''}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('sm-edit-service-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="ServiceManager.submitEdit(${s.id})">Save Changes</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  async submitEdit(id) {
    const payload = {
      name: document.getElementById('sm-edit-name').value.trim(),
      category_id: Number(document.getElementById('sm-edit-cat').value),
      duration_mins: Number(document.getElementById('sm-edit-dur').value),
      price_kes: Number(document.getElementById('sm-edit-price').value),
      description: document.getElementById('sm-edit-desc').value.trim(),
      benefits: document.getElementById('sm-edit-benefits').value.trim()
    };

    try {
      await App.api(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      App.showToast('Treatment details updated successfully.');
      App.closeModal('sm-edit-service-modal');
      await App.loadInitialData();
      this.renderServicesCatalog();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async toggleService(id, currentActive) {
    const newStatus = currentActive ? 0 : 1;
    try {
      await App.api(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: newStatus })
      });
      App.showToast(`Treatment ${newStatus ? 'activated' : 'disabled'}.`);
      await App.loadInitialData();
      this.renderServicesCatalog();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  }
};
