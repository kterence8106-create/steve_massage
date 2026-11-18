// Steve's Massage Parlor Management System - Inventory & Supplies Module
// DBIT 226 - Modules 9 & 10: Inventory Manager & Supplier Management
// Terence Mwaaki (BIT-0-8106-3/2025) - Kenya Methodist University

const InventoryManager = {
  activeSubTab: 'stock',
  items: [],
  suppliers: [],
  pos: [],
  movements: [],
  stats: {
    totalItems: 0,
    totalValuation: 0,
    lowStockCount: 0,
    totalSuppliers: 0,
    pendingPOCount: 0
  },

  async init(containerId = 'admin-main-view') {
    if (!App.currentUser || (App.currentUser.role !== 'inventory_manager' && App.currentUser.role !== 'admin')) {
      App.showToast('Access Restricted: The Inventory Module is strictly reserved for the authorized Inventory Manager (Mercy Chebet).', 'danger');
      if (typeof App.closePortal === 'function') App.closePortal();
      return;
    }
    await this.fetchData();
    this.render(containerId);
  },

  async fetchData() {
    try {
      const [items, suppliers, pos, movements, stats] = await Promise.all([
        App.api('/api/inventory'),
        App.api('/api/suppliers'),
        App.api('/api/purchase-orders'),
        App.api('/api/inventory/movements'),
        App.api('/api/inventory/stats')
      ]);
      this.items = items || [];
      this.suppliers = suppliers || [];
      this.pos = pos || [];
      this.movements = movements || [];
      this.stats = stats || {
        totalItems: this.items.length,
        totalValuation: this.items.reduce((acc, i) => acc + (i.quantity * i.cost_per_unit_kes), 0),
        lowStockCount: this.items.filter(i => i.quantity <= i.min_threshold).length,
        totalSuppliers: this.suppliers.length,
        pendingPOCount: this.pos.filter(p => p.status === 'Ordered').length
      };
    } catch (err) {
      console.warn('Using local/cached inventory dataset', err);
    }
  },

  render(containerId = 'admin-main-view') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <!-- INVENTORY EXECUTIVE TELEMETRY -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon primary"><i class="fas fa-boxes"></i></div>
          <div class="kpi-info">
            <h4>Total Catalog Items</h4>
            <h2>${this.stats.totalItems || this.items.length} SKUs</h2>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
          <div class="kpi-info">
            <h4>Stock Valuation (KES)</h4>
            <h2>KES ${Number(this.stats.totalValuation).toLocaleString()}</h2>
          </div>
        </div>
        <div class="kpi-card" style="${this.stats.lowStockCount > 0 ? 'border: 2px solid var(--danger);' : ''}">
          <div class="kpi-icon ${this.stats.lowStockCount > 0 ? 'danger' : 'success'}">
            <i class="fas ${this.stats.lowStockCount > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
          </div>
          <div class="kpi-info">
            <h4>Low Stock Alerts</h4>
            <h2 style="color:${this.stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${this.stats.lowStockCount} Reorders
            </h2>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon primary"><i class="fas fa-truck-loading"></i></div>
          <div class="kpi-info">
            <h4>Active Suppliers</h4>
            <h2>${this.stats.totalSuppliers || this.suppliers.length} Vendors</h2>
          </div>
        </div>
      </div>

      <!-- INVENTORY SUB-NAVIGATION -->
      <div class="inventory-subnav-bar">
        <button class="inv-tab-pill ${this.activeSubTab === 'stock' ? 'active' : ''}" onclick="InventoryManager.switchSubTab('stock')">
          <i class="fas fa-warehouse"></i> Stock Catalog & Levels
        </button>
        <button class="inv-tab-pill ${this.activeSubTab === 'alerts' ? 'active' : ''}" onclick="InventoryManager.switchSubTab('alerts')">
          <i class="fas fa-bell"></i> Reorder Alerts ${this.stats.lowStockCount > 0 ? `<span class="badge badge-danger" style="padding:2px 7px; margin-left:4px;">${this.stats.lowStockCount}</span>` : ''}
        </button>
        <button class="inv-tab-pill ${this.activeSubTab === 'suppliers' ? 'active' : ''}" onclick="InventoryManager.switchSubTab('suppliers')">
          <i class="fas fa-handshake"></i> Vendor Directory (${this.suppliers.length})
        </button>
        <button class="inv-tab-pill ${this.activeSubTab === 'pos' ? 'active' : ''}" onclick="InventoryManager.switchSubTab('pos')">
          <i class="fas fa-file-invoice"></i> Purchase Orders (${this.pos.length})
        </button>
        <button class="inv-tab-pill ${this.activeSubTab === 'movements' ? 'active' : ''}" onclick="InventoryManager.switchSubTab('movements')">
          <i class="fas fa-history"></i> Stock Movements Log
        </button>
      </div>

      <div id="inv-subview-content"></div>
    `;

    this.renderSubTabContent();
  },

  switchSubTab(tabName) {
    this.activeSubTab = tabName;
    document.querySelectorAll('.inv-tab-pill').forEach(el => el.classList.remove('active'));
    this.renderSubTabContent();
  },

  renderSubTabContent() {
    const content = document.getElementById('inv-subview-content');
    if (!content) return;

    if (this.activeSubTab === 'stock') {
      this.renderStockCatalog(content);
    } else if (this.activeSubTab === 'alerts') {
      this.renderReorderAlerts(content);
    } else if (this.activeSubTab === 'suppliers') {
      this.renderSuppliersDirectory(content);
    } else if (this.activeSubTab === 'pos') {
      this.renderPurchaseOrders(content);
    } else if (this.activeSubTab === 'movements') {
      this.renderMovementsLog(content);
    }
  },

  // 1. STOCK CATALOG VIEW
  renderStockCatalog(container) {
    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar" style="flex-wrap:wrap; gap:14px;">
          <div>
            <h3>Consumables & Supplies Catalog</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Real-time stock quantities, safety thresholds, and valuation in Kenyan Shillings</p>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <div style="position:relative;">
              <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.85rem;"></i>
              <input type="text" id="inv-search-box" class="form-control" placeholder="Search by name, SKU..." style="padding-left:34px; padding-top:8px; padding-bottom:8px; width:220px;" oninput="InventoryManager.filterStockTable(this.value)">
            </div>
            <select id="inv-cat-filter" class="form-control" style="width:160px; padding:8px;" onchange="InventoryManager.filterStockByCategory(this.value)">
              <option value="">All Categories</option>
              <option value="Massage Oils">Massage Oils</option>
              <option value="Carrier Oils">Carrier Oils</option>
              <option value="Aromatherapy">Aromatherapy</option>
              <option value="Equipment">Equipment</option>
              <option value="Linens">Linens</option>
              <option value="Sanitation">Sanitation</option>
            </select>
            <button class="btn btn-gold btn-sm" onclick="InventoryManager.openAddItemModal()">
              <i class="fas fa-plus-circle"></i> Add Item
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="custom-table" id="inv-stock-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Description</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Threshold</th>
                <th>Unit Cost</th>
                <th>Total Value (KES)</th>
                <th>Storage Area</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="inv-stock-tbody">
              ${this.items.map(item => this.renderItemRow(item)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderItemRow(item) {
    const isLow = item.quantity <= item.min_threshold;
    const isOut = item.quantity === 0;
    const totalVal = item.quantity * item.cost_per_unit_kes;

    let badgeClass = 'badge-success';
    let statusText = 'In Stock';
    let statusIcon = 'fa-check';

    if (isOut) {
      badgeClass = 'badge-danger';
      statusText = 'Out of Stock';
      statusIcon = 'fa-times-circle';
    } else if (isLow) {
      badgeClass = 'badge-warning';
      statusText = 'Low Stock';
      statusIcon = 'fa-exclamation-triangle';
    }

    return `
      <tr id="inv-row-${item.id}" style="${isLow ? 'background:#FFFDF7;' : ''}">
        <td><code>${item.sku || `SKU-${item.id}`}</code></td>
        <td>
          <strong>${item.name}</strong>
          <div class="text-muted" style="font-size:0.75rem;">Restocked: ${item.last_restocked || 'Recent'}</div>
        </td>
        <td><span class="badge badge-primary">${item.category}</span></td>
        <td>
          <span style="font-size:1.1rem; font-weight:700; color:${isLow ? 'var(--danger)' : 'var(--primary)'};">
            ${item.quantity}
          </span>
          <small class="text-muted">${item.unit}</small>
        </td>
        <td><span class="text-muted">${item.min_threshold} ${item.unit}</span></td>
        <td>KES ${Number(item.cost_per_unit_kes).toLocaleString()}</td>
        <td><strong>KES ${Number(totalVal).toLocaleString()}</strong></td>
        <td><small class="text-muted">${item.location || 'Cabinet A'}</small></td>
        <td>
          <span class="badge ${badgeClass}">
            <i class="fas ${statusIcon}"></i> ${statusText}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" title="Adjust Stock (Dispense / Restock)" onclick="InventoryManager.openAdjustModal(${item.id}, '${item.name}', ${item.quantity}, '${item.unit}')">
              <i class="fas fa-exchange-alt text-gold"></i>
            </button>
            <button class="btn btn-outline btn-sm" title="Edit Item Details" onclick="InventoryManager.openEditById(${item.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger);" title="Delete" onclick="InventoryManager.deleteItem(${item.id}, '${item.name}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  filterStockTable(keyword) {
    const q = (keyword || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#inv-stock-tbody tr');
    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  },

  filterStockByCategory(cat) {
    const rows = document.querySelectorAll('#inv-stock-tbody tr');
    rows.forEach(r => {
      if (!cat) {
        r.style.display = '';
      } else {
        const text = r.innerText;
        r.style.display = text.includes(cat) ? '' : 'none';
      }
    });
  },

  // 2. REORDER ALERTS VIEW
  renderReorderAlerts(container) {
    const lowItems = this.items.filter(i => i.quantity <= i.min_threshold);

    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar" style="background:#FFF4E5;">
          <div>
            <h3 style="color:var(--warning);"><i class="fas fa-exclamation-triangle"></i> Reorder Assistance & Safety Stock Alerts</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Items that have reached or fallen below the minimum safety threshold</p>
          </div>
          <span class="badge badge-danger">${lowItems.length} Urgent Items</span>
        </div>

        ${lowItems.length === 0 ? `
          <div style="padding:50px; text-align:center;">
            <div style="width:64px; height:64px; border-radius:50%; background:var(--success-bg); color:var(--success); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:1.8rem;">
              <i class="fas fa-shield-alt"></i>
            </div>
            <h3>All Supplies Well Stocked!</h3>
            <p class="text-muted">Every item in your inventory catalog is currently above safety threshold levels.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Safety Min</th>
                  <th>Deficit</th>
                  <th>Unit Cost</th>
                  <th>Estimated Restock Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${lowItems.map(item => {
                  const deficit = Math.max(0, (item.min_threshold * 2) - item.quantity);
                  const estCost = deficit * item.cost_per_unit_kes;
                  return `
                    <tr style="background:#FFF9F2;">
                      <td><code>${item.sku || `SKU-${item.id}`}</code></td>
                      <td><strong>${item.name}</strong></td>
                      <td><span class="badge badge-primary">${item.category}</span></td>
                      <td><span style="font-weight:800; color:var(--danger); font-size:1.15rem;">${item.quantity}</span> ${item.unit}</td>
                      <td>${item.min_threshold} ${item.unit}</td>
                      <td><span class="badge badge-danger">+${deficit} ${item.unit} needed</span></td>
                      <td>KES ${Number(item.cost_per_unit_kes).toLocaleString()}</td>
                      <td><strong>KES ${Number(estCost).toLocaleString()}</strong></td>
                      <td>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                          <button class="btn btn-gold btn-sm" onclick="InventoryManager.openCreatePOModal(null, '${item.name.replace(/'/g, "\\'")}', ${deficit}, ${estCost}, ${item.id})">
                            <i class="fas fa-shopping-cart"></i> Generate PO
                          </button>
                          <button class="btn btn-danger btn-sm" onclick="InventoryManager.openShortageRequestModal(${item.id})">
                            <i class="fas fa-exclamation-triangle"></i> Shortage Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  // 3. SUPPLIERS DIRECTORY VIEW
  renderSuppliersDirectory(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h3>Registered Wellness Suppliers</h3>
          <p class="text-muted" style="font-size:0.85rem; margin:0;">Certified local vendors providing oils, basalt stones, linens, and hygiene supplies</p>
        </div>
        <button class="btn btn-gold btn-sm" onclick="InventoryManager.openAddSupplierModal()">
          <i class="fas fa-plus"></i> Add New Vendor
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:24px; margin-bottom:30px;">
        ${this.suppliers.map(s => `
          <div class="service-card" style="padding:26px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <span class="service-category-tag">${s.payment_terms || '30 Days Invoice'}</span>
                <h3 style="margin-top:4px; font-size:1.25rem;">${s.name}</h3>
              </div>
              <span class="badge badge-gold"><i class="fas fa-star"></i> ${s.rating || 4.8}</span>
            </div>

            <div style="margin-bottom:16px; font-size:0.88rem; color:var(--text-dark);">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <i class="fas fa-user-tie text-gold" style="width:16px;"></i>
                <span><strong>Contact Person:</strong> ${s.contact_person}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <i class="fas fa-phone-alt text-gold" style="width:16px;"></i>
                <span>${s.phone}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <i class="fas fa-envelope text-gold" style="width:16px;"></i>
                <span>${s.email}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <i class="fas fa-map-marker-alt text-gold" style="width:16px;"></i>
                <span>${s.address}</span>
              </div>
            </div>

            <div style="background:var(--sage-light); padding:10px 14px; border-radius:8px; margin-bottom:18px; font-size:0.82rem;">
              <strong>Supplied Products:</strong>
              <div style="color:var(--primary); margin-top:2px;">${s.supplied_items}</div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px solid var(--border);">
              <button class="btn btn-gold btn-sm" onclick="InventoryManager.openCreatePOModal(${s.id}, null, 5, 15000)">
                <i class="fas fa-file-invoice"></i> Issue PO
              </button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="InventoryManager.deleteSupplier(${s.id}, '${s.name}')">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 4. PURCHASE ORDERS VIEW
  renderPurchaseOrders(container) {
    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar">
          <div>
            <h3><i class="fas fa-truck-loading text-gold"></i> Procurement & Purchase Orders (POs)</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Track pending deliveries, finance approvals, receive shipments into inventory, and view GRN receipts</p>
          </div>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.openCreatePOModal()">
            <i class="fas fa-plus"></i> Create Purchase Order
          </button>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Item & Quantity</th>
                <th>Delivery Option</th>
                <th>Total Cost (KES)</th>
                <th>Finance Status</th>
                <th>Supplier Status</th>
                <th>GRN / Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.pos.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px;" class="text-muted">No purchase orders found. Click "Create Purchase Order" to issue one.</td></tr>
              ` : this.pos.map(po => {
                const isReceived = po.status === 'Received';
                const isApproved = po.finance_status === 'Approved';
                return `
                  <tr>
                    <td>
                      <strong>${po.po_number}</strong>
                      <div class="text-muted" style="font-size:0.75rem;">${po.order_date}</div>
                    </td>
                    <td>
                      <div><strong>${po.supplier_name}</strong></div>
                      <small class="text-muted">${po.supplier_phone || ''}</small>
                    </td>
                    <td>
                      <strong>${po.item_name}</strong>
                      <div class="text-muted" style="font-size:0.8rem;">Qty: ${po.quantity} units</div>
                    </td>
                    <td>
                      <small class="badge badge-primary">${po.delivery_option || 'Standard Courier'}</small>
                    </td>
                    <td><strong style="color:var(--primary);">KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                    <td>
                      <span class="badge ${isApproved ? 'badge-success' : (po.finance_status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">
                        <i class="fas ${isApproved ? 'fa-check' : (po.finance_status === 'Rejected' ? 'fa-times' : 'fa-hourglass-half')}"></i> ${po.finance_status || 'Pending Approval'}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${isReceived ? 'badge-success' : (po.status === 'In-Transit' ? 'badge-primary' : (po.status === 'Delivered' ? 'badge-gold' : 'badge-warning'))}">
                        ${po.status}
                      </span>
                    </td>
                    <td>
                      ${po.grn_number ? `
                        <strong style="color:var(--success); font-size:0.8rem;"><i class="fas fa-receipt"></i> ${po.grn_number}</strong>
                      ` : '<span class="text-muted">—</span>'}
                    </td>
                    <td>
                      <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${isApproved && !isReceived ? `
                          <button class="btn btn-success btn-sm" title="Confirm physical delivery and receive items into inventory" onclick="InventoryManager.receiveShipment(${po.id}, '${po.po_number}')">
                            <i class="fas fa-box-open"></i> Receive Goods
                          </button>
                        ` : ''}
                        ${!isApproved && !isReceived ? `
                          <small class="text-muted" style="font-size:0.75rem; font-style:italic;">Awaiting Finance</small>
                        ` : ''}
                        ${isReceived ? `
                          <button class="btn btn-gold btn-sm" title="View Goods Received Note Receipt" onclick="InventoryManager.viewGRNReceipt(${po.id})">
                            <i class="fas fa-receipt"></i> GRN
                          </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" title="Print Official PO Voucher" onclick="InventoryManager.printPOVoucher(${po.id})">
                          <i class="fas fa-print"></i> Voucher
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
  },

  // 5. STOCK MOVEMENTS LOG VIEW
  renderMovementsLog(container) {
    container.innerHTML = `
      <div class="table-card">
        <div class="table-header-bar">
          <div>
            <h3>Stock Movement Audit Trail</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Transparent log of all dispensations for therapy sessions, restocks, and adjustments</p>
          </div>
          <span class="badge badge-primary">${this.movements.length} Logged Events</span>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item Name</th>
                <th>Qty Change</th>
                <th>Previous $\rightarrow$ New</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${this.movements.map(m => {
                const isIn = m.movement_type === 'IN';
                return `
                  <tr>
                    <td>
                      <span class="badge ${isIn ? 'badge-success' : 'badge-danger'}">
                        <i class="fas ${isIn ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> ${m.movement_type}
                      </span>
                    </td>
                    <td><strong>${m.item_name}</strong></td>
                    <td>
                      <strong style="color:${isIn ? 'var(--success)' : 'var(--danger)'};">
                        ${isIn ? '+' : '-'}${m.quantity}
                      </strong>
                    </td>
                    <td><span class="text-muted">${m.previous_quantity} $\rightarrow$ <strong>${m.new_quantity}</strong></span></td>
                    <td>
                      <div>${m.reason}</div>
                      ${m.reference_no ? `<small class="text-muted">Ref: ${m.reference_no}</small>` : ''}
                    </td>
                    <td><small class="badge badge-primary">${m.recorded_by || 'Admin'}</small></td>
                    <td>${m.created_at || 'Recent'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // MODAL: ADJUST STOCK (DISPENSE OR RESTOCK)
  openAdjustModal(itemId, itemName, currentQty, unit) {
    let modal = document.getElementById('inv-adjust-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-adjust-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-exchange-alt text-gold"></i> Adjust Stock Level</h3>
          <button class="modal-close-btn" onclick="App.closeModal('inv-adjust-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--sage-light); padding:16px; border-radius:12px; margin-bottom:20px;">
            <div style="font-size:0.85rem; color:var(--text-muted);">Selected Item:</div>
            <h4 style="color:var(--primary); margin:4px 0;">${itemName}</h4>
            <div style="font-weight:700;">Current Stock: <span id="adj-curr-qty">${currentQty}</span> ${unit}</div>
          </div>

          <div class="form-group">
            <label>Adjustment Operation</label>
            <select id="adj-type" class="form-control" onchange="InventoryManager.onAdjustTypeChange()">
              <option value="OUT">Dispense for Session / Usage (Stock Out -)</option>
              <option value="IN">Receive Restock / Addition (Stock In +)</option>
              <option value="ADJUSTMENT">Physical Inventory Recount (Set Exact Qty)</option>
            </select>
          </div>

          <div class="form-group">
            <label id="adj-qty-label">Quantity to Dispense (${unit})</label>
            <input type="number" id="adj-qty" class="form-control" min="1" value="1">
          </div>

          <div class="form-group">
            <label>Reason / Purpose</label>
            <select id="adj-reason" class="form-control">
              <option value="Dispensed for Client Massage Session">Dispensed for Client Massage Session</option>
              <option value="Towel / Linen laundry turnaround">Towel / Linen laundry turnaround</option>
              <option value="Sanitation & Suite hygiene prep">Sanitation & Suite hygiene prep</option>
              <option value="Damaged or expired consumable">Damaged or expired consumable</option>
              <option value="Vendor delivery shipment">Vendor delivery shipment</option>
              <option value="Physical count correction">Physical count correction</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-adjust-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.submitAdjustment(${itemId})">
            Save Adjustment
          </button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  onAdjustTypeChange() {
    const type = document.getElementById('adj-type').value;
    const label = document.getElementById('adj-qty-label');
    if (type === 'OUT') label.innerText = 'Quantity to Dispense (-)';
    else if (type === 'IN') label.innerText = 'Quantity to Restock (+)';
    else label.innerText = 'New Exact Physical Quantity';
  },

  async submitAdjustment(itemId) {
    const type = document.getElementById('adj-type').value;
    const qty = Number(document.getElementById('adj-qty').value);
    const reason = document.getElementById('adj-reason').value;

    if (isNaN(qty) || qty <= 0) return App.showToast('Please enter a valid quantity', 'warning');

    try {
      const res = await App.api(`/api/inventory/${itemId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ type, quantity: qty, reason })
      });
      App.showToast(res.message);
      App.closeModal('inv-adjust-modal');
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // MODAL: ADD INVENTORY ITEM
  openAddItemModal() {
    let modal = document.getElementById('inv-add-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-add-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle text-gold"></i> Register New Stock Item</h3>
          <button class="modal-close-btn" onclick="App.closeModal('inv-add-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>SKU / Item Code</label>
              <input type="text" id="add-item-sku" class="form-control" placeholder="e.g. OIL-JOJ-500">
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="add-item-cat" class="form-control">
                <option value="Massage Oils">Massage Oils</option>
                <option value="Carrier Oils">Carrier Oils</option>
                <option value="Aromatherapy">Aromatherapy</option>
                <option value="Equipment">Equipment</option>
                <option value="Linens">Linens</option>
                <option value="Sanitation">Sanitation</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Item Name</label>
            <input type="text" id="add-item-name" class="form-control" placeholder="e.g. Organic Cold-Pressed Jojoba Oil (500ml)">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Initial Quantity</label>
              <input type="number" id="add-item-qty" class="form-control" value="10">
            </div>
            <div class="form-group">
              <label>Unit of Measure</label>
              <select id="add-item-unit" class="form-control">
                <option value="Bottles">Bottles</option>
                <option value="Pieces">Pieces</option>
                <option value="Jerricans">Jerricans</option>
                <option value="Litres">Litres</option>
                <option value="Millilitres">Millilitres</option>
                <option value="Kilograms">Kilograms</option>
                <option value="Grams">Grams</option>
                <option value="Packs">Packs</option>
                <option value="Rolls">Rolls</option>
                <option value="Sets">Sets</option>
                <option value="Pairs">Pairs</option>
                <option value="Boxes">Boxes</option>
                <option value="Sachets">Sachets</option>
                <option value="Tubes">Tubes</option>
                <option value="Cans">Cans</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Minimum Safety Threshold</label>
              <input type="number" id="add-item-thresh" class="form-control" value="5">
            </div>
            <div class="form-group">
              <label>Cost per Unit (KES)</label>
              <input type="number" id="add-item-cost" class="form-control" placeholder="1500">
            </div>
          </div>
          <div class="form-group">
            <label>Storage Area / Room Location</label>
            <input type="text" id="add-item-loc" class="form-control" placeholder="Main Store / Cabinet A">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-add-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.submitAddItem()">Add to Inventory</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  async submitAddItem() {
    const payload = {
      sku: document.getElementById('add-item-sku').value.trim(),
      category: document.getElementById('add-item-cat').value,
      name: document.getElementById('add-item-name').value.trim(),
      quantity: Number(document.getElementById('add-item-qty').value),
      unit: document.getElementById('add-item-unit').value.trim(),
      min_threshold: Number(document.getElementById('add-item-thresh').value),
      cost_per_unit_kes: Number(document.getElementById('add-item-cost').value),
      location: document.getElementById('add-item-loc').value.trim()
    };

    if (!payload.name || !payload.unit) return App.showToast('Please enter item name and unit', 'warning');

    try {
      await App.api('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast(`Item "${payload.name}" added to inventory!`);
      App.closeModal('inv-add-modal');
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // Lookup by ID from cached array then open edit modal
  openEditById(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return App.showToast('Item not found in cache — please refresh', 'warning');
    this.openEditModal(item);
  },

  // MODAL: EDIT INVENTORY ITEM
  openEditModal(item) {
    // item may arrive as a JSON string (from inline onclick) or already an object
    if (typeof item === 'string') {
      try { item = JSON.parse(item); } catch (e) {
        return App.showToast('Could not parse item data', 'danger');
      }
    }

    let modal = document.getElementById('inv-edit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-edit-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-edit text-gold"></i> Edit Stock Item</h3>
          <button class="modal-close-btn" onclick="App.closeModal('inv-edit-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>SKU / Item Code</label>
              <input type="text" id="edit-item-sku" class="form-control" value="${item.sku || ''}">
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="edit-item-cat" class="form-control">
                ${['Massage Oils','Carrier Oils','Aromatherapy','Equipment','Linens','Sanitation'].map(c =>
                  `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Item Name</label>
            <input type="text" id="edit-item-name" class="form-control" value="${item.name || ''}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Current Quantity (editable)</label>
              <input type="number" id="edit-item-qty" class="form-control" value="${item.quantity || 0}">
            </div>
            <div class="form-group">
              <label>Unit of Measure</label>
              <input type="text" id="edit-item-unit" class="form-control" value="${item.unit || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Min Safety Threshold</label>
              <input type="number" id="edit-item-thresh" class="form-control" value="${item.min_threshold || 5}">
            </div>
            <div class="form-group">
              <label>Cost per Unit (KES)</label>
              <input type="number" id="edit-item-cost" class="form-control" value="${item.cost_per_unit_kes || 0}">
            </div>
          </div>
          <div class="form-group">
            <label>Storage Area / Room Location</label>
            <input type="text" id="edit-item-loc" class="form-control" value="${item.location || ''}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-edit-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.submitEditItem(${item.id})">Save Changes</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  async submitEditItem(itemId) {
    const payload = {
      sku:              document.getElementById('edit-item-sku').value.trim(),
      category:         document.getElementById('edit-item-cat').value,
      name:             document.getElementById('edit-item-name').value.trim(),
      quantity:         Number(document.getElementById('edit-item-qty').value),
      unit:             document.getElementById('edit-item-unit').value.trim(),
      min_threshold:    Number(document.getElementById('edit-item-thresh').value),
      cost_per_unit_kes: Number(document.getElementById('edit-item-cost').value),
      location:         document.getElementById('edit-item-loc').value.trim()
    };

    if (!payload.name || !payload.unit) return App.showToast('Item name and unit are required', 'warning');

    try {
      await App.api(`/api/inventory/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      App.showToast(`"${payload.name}" updated successfully!`);
      App.closeModal('inv-edit-modal');
      await this.init();
    } catch (err) {
      App.showToast(err.message || 'Update failed', 'danger');
    }
  },

  // MODAL: CREATE PURCHASE ORDER
  openCreatePOModal(defaultSupplierId = null, defaultItemName = null, defaultQty = 5, defaultCost = 15000, defaultItemId = null) {
    let modal = document.getElementById('inv-create-po-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-create-po-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    // Determine initial unit cost and item
    let selectedItem = null;
    if (defaultItemId) {
      selectedItem = this.items.find(i => i.id === defaultItemId);
    } else if (defaultItemName) {
      selectedItem = this.items.find(i => i.name === defaultItemName);
    }
    const unitCost = selectedItem ? selectedItem.cost_per_unit_kes : Math.round(defaultCost / (defaultQty || 1));
    const totalCost = unitCost * defaultQty;

    modal.innerHTML = `
      <div class="modal-box modal-lg">
        <div class="modal-header">
          <h3><i class="fas fa-file-invoice text-gold"></i> Issue Purchase Order (PO)</h3>
          <button class="modal-close-btn" onclick="App.closeModal('inv-create-po-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label><strong>Vendor / Certified Supplier</strong></label>
              <select id="po-create-sup" class="form-control" onchange="InventoryManager.updateSupplierCard('po-create-sup','po-sup-card')">
                <option value="">-- Select a Supplier --</option>
                ${this.suppliers.map(s => `
                  <option value="${s.id}"
                    data-contact="${(s.contact_person||'').replace(/"/g,'&quot;')}"
                    data-phone="${s.phone||''}"
                    data-email="${s.email||''}"
                    data-address="${(s.address||'').replace(/"/g,'&quot;')}"
                    data-items="${(s.supplied_items||'').replace(/"/g,'&quot;')}"
                    data-terms="${(s.payment_terms||'').replace(/"/g,'&quot;')}"
                    data-rating="${s.rating||''}"
                    ${defaultSupplierId == s.id ? 'selected' : ''}>
                    ★ ${s.rating || '—'} | ${s.name} — ${s.contact_person} (${s.phone})
                  </option>
                `).join('')}
              </select>
              <!-- Live Supplier Info Card -->
              <div id="po-sup-card" style="display:none; margin-top:10px; background:#F0FAF3; border:1px solid #4A7C59; border-radius:10px; padding:12px 16px; font-size:0.83rem; line-height:1.7;">
              </div>
            </div>
            <div class="form-group">
              <label><strong>Purchase Order Item (Catalog Dropdown)</strong></label>
              <select id="po-create-item-select" class="form-control" onchange="InventoryManager.onPOItemSelectChange(this.value)">
                <option value="">-- Select Item from Inventory Database --</option>
                ${this.items.map(item => `
                  <option value="${item.id}" data-name="${item.name.replace(/"/g, '&quot;')}" data-cost="${item.cost_per_unit_kes}" data-unit="${item.unit}" ${(selectedItem && selectedItem.id === item.id) ? 'selected' : ''}>
                    ${item.sku || 'SKU'} — ${item.name} (KES ${Number(item.cost_per_unit_kes).toLocaleString()} / ${item.unit})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label><strong>Item Description / Specific Specifications</strong></label>
            <select id="po-create-item" class="form-control">
              <option value="">-- Select or type specification below --</option>

              <!-- === MASSAGE & CARRIER OILS === -->
              <optgroup label="🛢 Massage & Carrier Oils">
                <option value="Lavender Essential Oil (500ml Bottle) – Cold-Pressed, Therapeutic Grade">Lavender Essential Oil (500ml) – Cold-Pressed, Therapeutic Grade</option>
                <option value="Jojoba Carrier Oil (1L Bottle) – Organic, Unrefined">Jojoba Carrier Oil (1L) – Organic, Unrefined</option>
                <option value="Sweet Almond Oil (1L Bottle) – Pure, Cold-Pressed">Sweet Almond Oil (1L) – Pure, Cold-Pressed</option>
                <option value="Coconut Oil – Fractionated (500ml Bottle) – Odourless, Non-Greasy">Coconut Oil – Fractionated (500ml) – Odourless, Non-Greasy</option>
                <option value="Eucalyptus Essential Oil (250ml Bottle) – Steam-Distilled, Grade A">Eucalyptus Essential Oil (250ml) – Steam-Distilled, Grade A</option>
                <option value="Peppermint Essential Oil (250ml Bottle) – 100% Pure">Peppermint Essential Oil (250ml) – 100% Pure</option>
                <option value="Rosehip Seed Oil (500ml Bottle) – Unrefined, Cold-Pressed">Rosehip Seed Oil (500ml) – Unrefined, Cold-Pressed</option>
                <option value="Grapeseed Oil (1L Bottle) – Refined, Light Texture">Grapeseed Oil (1L) – Refined, Light Texture</option>
              </optgroup>

              <!-- === AROMATHERAPY === -->
              <optgroup label="🕯 Aromatherapy & Candles">
                <option value="Aromatherapy Diffuser Reeds – Bamboo, 10-Pack (25cm)">Aromatherapy Reed Diffusers – Bamboo, 10-Pack (25cm)</option>
                <option value="Scented Soy Wax Candles – Lavender & Eucalyptus Blend (200g)">Scented Soy Wax Candles – Lavender & Eucalyptus Blend (200g)</option>
                <option value="Incense Sticks – Sandalwood, Box of 100 Sticks">Incense Sticks – Sandalwood, Box of 100</option>
                <option value="Essential Oil Blend – Relaxation Mix (Lavender, Chamomile, Bergamot) 100ml">Essential Oil Blend – Relaxation Mix (100ml)</option>
                <option value="Aromatherapy Nebulizing Diffuser – Ultrasonic, 300ml Capacity">Aromatherapy Ultrasonic Diffuser – 300ml</option>
              </optgroup>

              <!-- === LINENS & TOWELS === -->
              <optgroup label="🛏 Linens, Towels & Draping">
                <option value="Massage Table Sheets – 100% Egyptian Cotton, White, 190×90cm (Pack of 10)">Massage Table Sheets – 100% Cotton, White, 190×90cm (Pack of 10)</option>
                <option value="Microfibre Bath Towels – 70×140cm, 450gsm, White (Pack of 12)">Microfibre Bath Towels – 70×140cm, 450gsm (Pack of 12)</option>
                <option value="Disposable Massage Table Paper Roll – Non-Woven, 60cm×80m">Disposable Massage Table Paper Roll – 60cm×80m</option>
                <option value="Plush Bathrobes – Waffle Weave, 100% Cotton, Sizes M/L (Pack of 6)">Plush Bathrobes – Waffle Weave, Cotton, M/L (Pack of 6)</option>
                <option value="Disposable Non-Woven Face Rest Covers – Oval, Box of 100">Disposable Face Rest Covers – Non-Woven, Box of 100</option>
                <option value="Pillow Cases – White, 100% Cotton, 50×75cm (Pack of 10)">Pillow Cases – White, Cotton, 50×75cm (Pack of 10)</option>
              </optgroup>

              <!-- === SANITATION & HYGIENE === -->
              <optgroup label="🧴 Sanitation & Hygiene Supplies">
                <option value="Antibacterial Hand Soap – Liquid, 5L Refill Jerrican, Lemon Scent">Antibacterial Hand Soap – Liquid, 5L Refill Jerrican</option>
                <option value="Disinfectant Surface Spray – Hospital Grade, 500ml Trigger Bottle">Disinfectant Surface Spray – Hospital Grade, 500ml</option>
                <option value="Disposable Vinyl Gloves – Powder-Free, Box of 100 (Size M)">Disposable Vinyl Gloves – Powder-Free, Box of 100 (Size M)</option>
                <option value="Alcohol Hand Sanitiser – 70% Ethanol, 500ml Pump Dispenser">Alcohol Hand Sanitiser – 70% Ethanol, 500ml Pump</option>
                <option value="Disposable Foot Covers – Non-Woven, Box of 200 Pairs">Disposable Foot Covers – Non-Woven, Box of 200 Pairs</option>
                <option value="Laundry Detergent – Professional Grade, 10kg Bucket">Laundry Detergent – Professional Grade, 10kg Bucket</option>
                <option value="Tissue / Facial Wipes – Soft, 2-Ply, Box of 200 Sheets">Facial Tissue Wipes – Soft, 2-Ply, Box of 200</option>
              </optgroup>

              <!-- === SPA EQUIPMENT === -->
              <optgroup label="⚙ Spa Equipment & Accessories">
                <option value="Portable Massage Table – Aluminium Frame, 185×70cm, Max Load 250kg">Portable Massage Table – Aluminium Frame, 185×70cm</option>
                <option value="Hot Stone Massage Set – 45 Basalt Stones, Carry Bag Included">Hot Stone Massage Set – 45 Basalt Stones + Carry Bag</option>
                <option value="Massage Oil Warmer – Electric, Stainless Steel, 1.5L Capacity">Massage Oil Warmer – Electric, Stainless Steel, 1.5L</option>
                <option value="Body Scrub Exfoliating Mitts – 100% Natural Sisal, Pack of 12">Body Scrub Exfoliating Mitts – Natural Sisal, Pack of 12</option>
                <option value="Neck & Back Massager Cushion – Shiatsu, Heat Function, Portable">Shiatsu Neck & Back Massager Cushion – Heat Function</option>
                <option value="Foot Soak Basin – Stainless Steel, 42cm Diameter">Foot Soak Basin – Stainless Steel, 42cm Diameter</option>
                <option value="Timer / Appointment Clock – Digital, Countdown + Count-Up, Backlit">Digital Appointment Timer – Countdown/Count-Up, Backlit</option>
              </optgroup>

              <!-- === REFRESHMENTS === -->
              <optgroup label="☕ Client Refreshments">
                <option value="Herbal Tea Sachets – Chamomile & Mint Blend, Box of 100">Herbal Tea – Chamomile & Mint Sachets, Box of 100</option>
                <option value="Mineral Water Bottles – 500ml, Still, Carton of 24">Mineral Water – 500ml Still, Carton of 24</option>
                <option value="Infusion Cups & Saucers – Ceramic, White, Set of 12">Infusion Cups & Saucers – Ceramic White, Set of 12</option>
              </optgroup>

              <!-- === STATIONERY & ADMIN === -->
              <optgroup label="📋 Stationery & Administrative">
                <option value="A4 Printing Paper – 80gsm, Ream of 500 Sheets (Box of 5 Reams)">A4 Printing Paper – 80gsm, 5-Ream Box (2,500 Sheets)</option>
                <option value="Receipt/Till Roll – 57mm×40m Thermal, Box of 20 Rolls">Till/Receipt Rolls – 57mm×40m Thermal, Box of 20</option>
                <option value="Ballpoint Pens – Blue Ink, Box of 50">Ballpoint Pens – Blue Ink, Box of 50</option>
              </optgroup>

              <!-- === CUSTOM === -->
              <option value="Other / Custom Specification">Other / Custom Specification (see Requisition Notes)</option>
            </select>
            <small class="text-muted" style="margin-top:4px; display:block;">
              <i class="fas fa-info-circle"></i> Selecting a Catalog Item above auto-fills this field. You may also select directly here.
            </small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Order Quantity</label>
              <input type="number" id="po-create-qty" class="form-control" value="${defaultQty}" min="1" oninput="InventoryManager.calcPOTotal()">
            </div>
            <div class="form-group">
              <label>Agreed Unit Cost (KES)</label>
              <input type="number" id="po-create-unit-cost" class="form-control" value="${unitCost}" oninput="InventoryManager.calcPOTotal()">
            </div>
            <div class="form-group">
              <label>Total Estimated Cost (KES)</label>
              <input type="number" id="po-create-cost" class="form-control" value="${totalCost}" readonly style="background:#F7F8F7; font-weight:700; color:var(--primary);">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label><strong>Delivery Option (Dropdown)</strong></label>
              <select id="po-create-delivery" class="form-control">
                <option value="Standard Courier (Nairobi Express)">Standard Courier (Nairobi Express Delivery - 24 to 48 Hours)</option>
                <option value="Direct Dispatch (Supplier Fleet)">Direct Dispatch (Supplier Fleet Vehicle - Scheduled Run)</option>
                <option value="Expedited Van (Same-Day Emergency)">Expedited Van (Same-Day Urgent Delivery)</option>
                <option value="Parlour Pickup (Self-Collect at Depot)">Parlour Pickup (Self-Collect at Supplier Depot)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Delivery Destination Site</label>
              <input type="text" id="po-create-address" class="form-control" value="Steve's Massage Parlour, 2nd Floor, Valley Arcade, Gitanga Rd, Nairobi">
            </div>
          </div>

          <div class="form-group">
            <label>Delivery Terms & Requisition Notes</label>
            <textarea id="po-create-notes" class="form-control" rows="2" placeholder="e.g. Deliver to 2nd Floor storage bay. Inspect seals on delivery. Payment subject to Finance Director approval."></textarea>
          </div>

          <div style="background:#FFF9E6; border:1px solid #FFE082; padding:12px 16px; border-radius:8px; font-size:0.83rem; color:#5D4037;">
            <i class="fas fa-shield-alt text-gold"></i> <strong>Finance Authorization Workflow:</strong>
            Submitting this purchase order routes it automatically to the Finance Module for review and budget authorization before supplier dispatch.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-create-po-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.submitCreatePO()">Submit Purchase Order</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
    // Auto-show info card for the initially-selected supplier
    setTimeout(() => this.updateSupplierCard('po-create-sup', 'po-sup-card'), 50);
  },

  onPOItemSelectChange(itemId) {
    if (!itemId) return;
    const item = this.items.find(i => i.id == itemId);
    if (item) {
      // Try to match the catalog item name to one of the spec dropdown options
      const specSel = document.getElementById('po-create-item');
      if (specSel) {
        let matched = false;
        for (let i = 0; i < specSel.options.length; i++) {
          if (specSel.options[i].value.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(specSel.options[i].text.split('–')[0].trim().toLowerCase())) {
            specSel.selectedIndex = i;
            matched = true;
            break;
          }
        }
        // If no match found, set the first blank option so user picks manually
        if (!matched) specSel.selectedIndex = 0;
      }
      document.getElementById('po-create-unit-cost').value = item.cost_per_unit_kes;
      this.calcPOTotal();
    }
  },

  calcPOTotal() {
    const qty = Number(document.getElementById('po-create-qty')?.value) || 0;
    const unitCost = Number(document.getElementById('po-create-unit-cost')?.value) || 0;
    const totalEl = document.getElementById('po-create-cost');
    if (totalEl) totalEl.value = Math.round(qty * unitCost);
  },

  // Show supplier info card below the dropdown whenever a supplier is chosen
  updateSupplierCard(selectId, cardId) {
    const sel  = document.getElementById(selectId);
    const card = document.getElementById(cardId);
    if (!sel || !card) return;

    const opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) {
      card.style.display = 'none';
      return;
    }

    const name    = opt.text.replace(/^★[\d.]+ \| /, '').split(' — ')[0].trim();
    const contact = opt.dataset.contact || '—';
    const phone   = opt.dataset.phone   || '—';
    const email   = opt.dataset.email   || '—';
    const address = opt.dataset.address || '—';
    const items   = opt.dataset.items   || '—';
    const terms   = opt.dataset.terms   || '—';
    const rating  = opt.dataset.rating  || '—';

    const stars = rating !== '—' ? '★'.repeat(Math.round(Number(rating))) + ` (${rating}/5)` : '—';

    card.style.display = 'block';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:12px; flex-wrap:wrap;">
        <div>
          <strong style="font-size:0.95rem; color:var(--primary);">
            <i class="fas fa-handshake text-gold"></i> ${name}
          </strong>
          <span style="margin-left:8px; background:#2D5A27; color:#fff; border-radius:4px; padding:1px 8px; font-size:0.72rem; font-weight:600;">VERIFIED VENDOR</span>
        </div>
        <span style="color:#F4A923; font-size:0.85rem; font-weight:700; white-space:nowrap;">${stars}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 16px;">
        <div><i class="fas fa-user-tie" style="color:#4A7C59; width:16px;"></i> <strong>Contact:</strong> ${contact}</div>
        <div><i class="fas fa-phone" style="color:#4A7C59; width:16px;"></i> <strong>Phone:</strong> ${phone}</div>
        <div><i class="fas fa-envelope" style="color:#4A7C59; width:16px;"></i> <strong>Email:</strong> ${email}</div>
        <div><i class="fas fa-file-invoice" style="color:#4A7C59; width:16px;"></i> <strong>Terms:</strong> ${terms}</div>
        <div style="grid-column:1/-1;"><i class="fas fa-map-marker-alt" style="color:#4A7C59; width:16px;"></i> <strong>Address:</strong> ${address}</div>
        <div style="grid-column:1/-1;"><i class="fas fa-boxes" style="color:#4A7C59; width:16px;"></i> <strong>Supplies:</strong> ${items}</div>
      </div>
    `;
  },

  async submitCreatePO() {
    const selectEl = document.getElementById('po-create-item-select');
    const selectedItemId = selectEl ? (Number(selectEl.value) || null) : null;
    const payload = {
      supplier_id: Number(document.getElementById('po-create-sup').value),
      item_id: selectedItemId,
      item_name: document.getElementById('po-create-item').value.trim(),
      quantity: Number(document.getElementById('po-create-qty').value),
      unit_cost_kes: Number(document.getElementById('po-create-unit-cost')?.value || 0),
      total_cost_kes: Number(document.getElementById('po-create-cost').value),
      delivery_option: document.getElementById('po-create-delivery').value,
      delivery_address: document.getElementById('po-create-address').value.trim(),
      notes: document.getElementById('po-create-notes').value.trim(),
      status: 'Pending Approval'
    };

    if (!payload.item_name || !payload.quantity || !payload.total_cost_kes) {
      return App.showToast('Please fill all purchase order fields with valid quantities and items', 'warning');
    }

    try {
      const res = await App.api('/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast(`Purchase order ${res.po_number} created and routed to Finance Director for authorization!`);
      App.closeModal('inv-create-po-modal');
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // MODAL: SHORTAGE REQUEST TO FINANCE & SUPPLIER
  openShortageRequestModal(itemId) {
    let modal = document.getElementById('inv-shortage-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-shortage-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const item = this.items.find(i => i.id === itemId);
    if (!item) return App.showToast('Item not found', 'warning');

    const suggestedQty = Math.max(5, (item.min_threshold * 2) - item.quantity);
    const estCost = suggestedQty * item.cost_per_unit_kes;

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle text-danger"></i> Requisition Shortage Restock</h3>
          <button class="modal-close-btn" onclick="App.closeModal('inv-shortage-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background:#FFF3CD; border:1px solid #FFEAA7; padding:14px; border-radius:8px; margin-bottom:16px;">
            <div style="font-size:0.8rem; text-transform:uppercase; color:#856404; font-weight:700;">Stock Depletion Notice</div>
            <h4 style="margin:4px 0; color:var(--primary);">${item.name} (${item.sku || 'SKU'})</h4>
            <div style="font-size:0.85rem; color:#856404;">
              Current Stock: <strong>${item.quantity} ${item.unit}</strong> • Safety Threshold: <strong>${item.min_threshold} ${item.unit}</strong>
            </div>
          </div>

          <input type="hidden" id="shortage-item-id" value="${item.id}">
          <input type="hidden" id="shortage-unit-cost" value="${item.cost_per_unit_kes}">

          <div class="form-group">
            <label>Designated Vendor / Supplier</label>
            <select id="shortage-sup-id" class="form-control" onchange="InventoryManager.updateSupplierCard('shortage-sup-id','shortage-sup-card')">
              <option value="">-- Select a Supplier --</option>
              ${this.suppliers.map(s => `
                <option value="${s.id}"
                  data-contact="${(s.contact_person||'').replace(/"/g,'&quot;')}"
                  data-phone="${s.phone||''}"
                  data-email="${s.email||''}"
                  data-address="${(s.address||'').replace(/"/g,'&quot;')}"
                  data-items="${(s.supplied_items||'').replace(/"/g,'&quot;')}"
                  data-terms="${(s.payment_terms||'').replace(/"/g,'&quot;')}"
                  data-rating="${s.rating||''}">
                  ★ ${s.rating || '—'} | ${s.name} — ${s.contact_person} (${s.phone})
                </option>
              `).join('')}
            </select>
            <!-- Live Supplier Info Card -->
            <div id="shortage-sup-card" style="display:none; margin-top:10px; background:#F0FAF3; border:1px solid #4A7C59; border-radius:10px; padding:12px 16px; font-size:0.83rem; line-height:1.7;">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Restock Quantity (${item.unit})</label>
              <input type="number" id="shortage-qty" class="form-control" value="${suggestedQty}" min="1" oninput="InventoryManager.calcShortageTotal()">
            </div>
            <div class="form-group">
              <label>Estimated Requisition Value (KES)</label>
              <input type="number" id="shortage-est-total" class="form-control" value="${estCost}" readonly style="background:#F7F8F7; font-weight:700;">
            </div>
          </div>

          <div class="form-group">
            <label>Delivery Option</label>
            <select id="shortage-delivery" class="form-control">
              <option value="Expedited Van (Same-Day Emergency)">Expedited Van (Same-Day Urgent Delivery)</option>
              <option value="Standard Courier (Nairobi Express)">Standard Courier (Nairobi Express Delivery - 24 to 48 Hours)</option>
              <option value="Direct Dispatch (Supplier Fleet)">Direct Dispatch (Supplier Fleet Vehicle)</option>
              <option value="Parlour Pickup (Self-Collect at Depot)">Parlour Pickup (Self-Collect at Depot)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Shortage Justification Notes</label>
            <textarea id="shortage-notes" class="form-control" rows="2" placeholder="Reason for shortage (e.g. High client weekend demand, urgent restock required)..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-shortage-modal')">Cancel</button>
          <button class="btn btn-danger btn-sm" onclick="InventoryManager.submitShortageRequest()">
            <i class="fas fa-paper-plane"></i> Dispatch Restock Request
          </button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  calcShortageTotal() {
    const qty = Number(document.getElementById('shortage-qty')?.value) || 0;
    const unitCost = Number(document.getElementById('shortage-unit-cost')?.value) || 0;
    const totalEl = document.getElementById('shortage-est-total');
    if (totalEl) totalEl.value = Math.round(qty * unitCost);
  },

  async submitShortageRequest() {
    const itemId = Number(document.getElementById('shortage-item-id').value);
    const item = this.items.find(i => i.id === itemId);
    const supplierId = Number(document.getElementById('shortage-sup-id').value);
    const quantity = Number(document.getElementById('shortage-qty').value);
    const delivery_option = document.getElementById('shortage-delivery').value;
    const notes = document.getElementById('shortage-notes').value.trim();

    if (!quantity || quantity <= 0) return App.showToast('Please enter a valid restock quantity', 'warning');

    try {
      const res = await App.api('/api/inventory/shortage-request', {
        method: 'POST',
        body: JSON.stringify({
          item_id: itemId,
          supplier_id: supplierId,
          quantity,
          delivery_option,
          delivery_address: "Steve's Massage Parlour, 2nd Floor, Valley Arcade, Gitanga Rd, Nairobi",
          notes: notes || `Urgent restock shortage for ${item.name}`
        })
      });
      App.showToast(res.message || 'Shortage restock request successfully sent to Finance and Supplier!');
      App.closeModal('inv-shortage-modal');
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // RECEIVE SHIPMENT ACTION (GRN GENERATION & STOCK INCREMENT)
  async receiveShipment(poId, poNumber) {
    if (!confirm(`Confirm physical delivery and receipt of goods for ${poNumber}?\n\nThis action will:\n1. Generate an official Goods Received Note (GRN)\n2. Automatically increment stock quantities in your inventory catalog\n3. Record the disbursement expense in the Finance Module\n4. Notify both the Finance Director and Supplier`)) return;

    try {
      const res = await App.api(`/api/purchase-orders/${poId}/receive`, { method: 'POST' });
      App.showToast(res.message || 'Goods received and catalog stock updated!');
      await this.init();
      this.viewGRNReceipt(poId);
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  // VIEW GOODS RECEIVED NOTE (GRN) RECEIPT
  async viewGRNReceipt(poId) {
    let modal = document.getElementById('inv-grn-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-grn-receipt-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="modal-box" style="padding:40px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading Goods Received Note...</div>';
    modal.classList.add('show');

    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header no-print">
            <h3>Goods Received Note (GRN) Receipt</h3>
            <button class="modal-close-btn" onclick="App.closeModal('inv-grn-receipt-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" style="padding:40px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:20px; margin-bottom:24px;">
              <div>
                <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOR</h2>
                <div style="font-size:0.85rem; color:var(--text-muted);">Inventory & Receiving Division • Valley Arcade, Nairobi</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Email: inventory@stevesmassage.co.ke • Tel: +254 712 345 678</div>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-success" style="font-size:0.9rem; padding:6px 12px;">GOODS RECEIVED NOTE</span>
                <h3 style="color:var(--accent); margin:8px 0 2px;">${po.grn_number || 'GRN-VERIFIED'}</h3>
                <div style="font-size:0.85rem; color:var(--text-muted);">Receipt Date: ${po.received_date || po.order_date}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">PO Number: <strong>${po.po_number}</strong></div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; background:#FAFBF9; padding:18px; border-radius:8px;">
              <div>
                <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Delivering Vendor / Supplier:</strong>
                <h4 style="margin:4px 0; color:var(--primary);">${po.supplier_name}</h4>
                <div style="font-size:0.85rem;">Contact: ${po.contact_person || 'Sales Rep'} • ${po.supplier_phone || ''}</div>
                <div style="font-size:0.85rem;">Delivery Method: <strong>${po.delivery_option || 'Standard Courier'}</strong></div>
              </div>
              <div>
                <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Receiving Destination & Store:</strong>
                <h4 style="margin:4px 0; color:var(--primary);">Steve's Massage Parlour - Consumables Store</h4>
                <div style="font-size:0.85rem;">Received By: <strong>${po.received_by || 'Mercy Chebet (Inventory Controller)'}</strong></div>
                <div style="font-size:0.85rem;">Finance Approval: <strong>${po.finance_status || 'Approved'} (${po.finance_reviewed_at || 'Verified'})</strong></div>
              </div>
            </div>

            <table class="custom-table" style="margin-bottom:24px;">
              <thead>
                <tr>
                  <th>Item Code / Description</th>
                  <th>Quantity Received</th>
                  <th>Unit Price (KES)</th>
                  <th>Total Amount (KES)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${po.item_name}</strong></td>
                  <td><strong>${po.quantity}</strong> units (Stock Credited)</td>
                  <td>KES ${Number(po.total_cost_kes / po.quantity).toLocaleString()}</td>
                  <td><strong style="color:var(--primary); font-size:1.15rem;">KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="background:#E8F5E9; border:1px solid #C8E6C9; padding:14px 18px; border-radius:8px; font-size:0.85rem; color:#2E7D32; margin-bottom:30px;">
              <i class="fas fa-check-circle"></i> <strong>Physical Verification Completed:</strong>
              Goods have been inspected for quality, seals verified, and added to the live stock count. A confirmation record has been posted to both the Finance and Supplier modules.
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:40px; padding-top:20px; border-top:1px dashed var(--border);">
              <div>
                <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
                <div style="font-size:0.82rem; text-align:center;">Store Keeper / Received By: Mercy Chebet</div>
              </div>
              <div>
                <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
                <div style="font-size:0.82rem; text-align:center;">Delivered By / Courier Signature</div>
              </div>
            </div>
          </div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-grn-receipt-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Receipt</button>
          </div>
        </div>
      `;
    } catch (err) {
      modal.innerHTML = `<div class="modal-box" style="padding:30px; color:red;">Failed to load receipt: ${err.message}</div>`;
    }
  },

  // PRINT PURCHASE ORDER VOUCHER
  async printPOVoucher(poId) {
    let modal = document.getElementById('po-voucher-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'po-voucher-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="modal-box" style="padding:40px; text-align:center;">Loading voucher...</div>';
    modal.classList.add('show');

    try {
      const po = await App.api(`/api/purchase-orders/${poId}`);
      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header no-print">
            <h3>Purchase Order Voucher</h3>
            <button class="modal-close-btn" onclick="App.closeModal('po-voucher-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" style="padding:40px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:20px; margin-bottom:24px;">
              <div>
                <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOR</h2>
                <div style="font-size:0.85rem; color:var(--text-muted);">Valley Arcade, Gitanga Road, Nairobi • +254 712 345 678</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Email: procurement@stevesmassage.co.ke</div>
              </div>
              <div style="text-align:right;">
                <h3 style="color:var(--accent); margin:0;">PURCHASE ORDER</h3>
                <div style="font-size:1.1rem; font-weight:700;">${po.po_number}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">Date: ${po.order_date}</div>
                <span class="badge ${po.status === 'Received' ? 'badge-success' : 'badge-warning'}">${po.status}</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:30px; background:#FAFAF8; padding:20px; border-radius:10px;">
              <div>
                <strong style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Vendor / Supplier:</strong>
                <h4 style="margin:4px 0 6px; color:var(--primary);">${po.supplier_name}</h4>
                <div style="font-size:0.88rem;">Attn: ${po.contact_person || 'Sales Manager'}</div>
                <div style="font-size:0.88rem;">Phone: ${po.supplier_phone || 'N/A'}</div>
                <div style="font-size:0.88rem;">Address: ${po.supplier_address || 'Nairobi, Kenya'}</div>
              </div>
              <div>
                <strong style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Delivery Destination:</strong>
                <h4 style="margin:4px 0 6px; color:var(--primary);">Steve's Massage Parlor - Main Suite</h4>
                <div style="font-size:0.88rem;">2nd Floor, Valley Arcade Shopping Centre</div>
                <div style="font-size:0.88rem;">Gitanga Road, Lavington, Nairobi</div>
                <div style="font-size:0.88rem;">Payment Terms: ${po.payment_terms || '30 Days Invoice'}</div>
              </div>
            </div>

            <table class="custom-table" style="margin-bottom:30px;">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Cost (KES)</th>
                  <th>Total Amount (KES)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${po.item_name}</strong></td>
                  <td>${po.quantity} Units</td>
                  <td>KES ${Number(po.total_cost_kes / po.quantity).toLocaleString()}</td>
                  <td><strong>KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                </tr>
                <tr style="border-top:2px solid var(--border); font-size:1.15rem;">
                  <td colspan="3" style="text-align:right;"><strong>Total Payable:</strong></td>
                  <td><strong style="color:var(--primary);">KES ${Number(po.total_cost_kes).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:50px; margin-top:50px; padding-top:30px; border-top:1px dashed var(--border);">
              <div>
                <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
                <div style="font-size:0.85rem; text-align:center;">Authorized Purchasing Officer (Steve Mwangi)</div>
              </div>
              <div>
                <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
                <div style="font-size:0.85rem; text-align:center;">Vendor Acceptance / Signature & Stamp</div>
              </div>
            </div>
          </div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('po-voucher-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Voucher</button>
          </div>
        </div>
      `;
    } catch (err) {
      modal.innerHTML = `<div class="modal-box" style="padding:30px; color:red;">Failed to load PO: ${err.message}</div>`;
    }
  },

  // MODAL: ADD SUPPLIER
  openAddSupplierModal() {
    let modal = document.getElementById('inv-add-sup-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inv-add-sup-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fas fa-truck text-gold"></i> Register Supplier / Vendor</h3>
          <button class="modal-close-btn" onclick="App.closeModal('inv-add-sup-modal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Vendor / Company Name</label>
            <input type="text" id="sup-name" class="form-control" placeholder="e.g. Kenya Spa Organics Ltd">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contact Person</label>
              <input type="text" id="sup-person" class="form-control" placeholder="e.g. Mary Wanjiru">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" id="sup-phone" class="form-control" placeholder="+2547XXXXXXXX">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="sup-email" class="form-control" placeholder="sales@vendor.co.ke">
            </div>
            <div class="form-group">
              <label>Payment Terms</label>
              <select id="sup-terms" class="form-control">
                <option value="30 Days Invoice">30 Days Invoice</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="M-Pesa Till on Delivery">M-Pesa Till on Delivery</option>
                <option value="50% Advance, 50% Delivery">50% Advance, 50% Delivery</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Physical Address</label>
            <input type="text" id="sup-addr" class="form-control" placeholder="e.g. Industrial Area, Enterprise Road, Nairobi">
          </div>
          <div class="form-group">
            <label>Supplied Goods / Product Categories</label>
            <input type="text" id="sup-goods" class="form-control" placeholder="Carrier Oils, Lavender Oil, Volcanic Basalt Stones, Towels">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal('inv-add-sup-modal')">Cancel</button>
          <button class="btn btn-gold btn-sm" onclick="InventoryManager.submitAddSupplier()">Save Supplier</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  async submitAddSupplier() {
    const payload = {
      name: document.getElementById('sup-name').value.trim(),
      contact_person: document.getElementById('sup-person').value.trim(),
      phone: document.getElementById('sup-phone').value.trim(),
      email: document.getElementById('sup-email').value.trim(),
      payment_terms: document.getElementById('sup-terms').value,
      address: document.getElementById('sup-addr').value.trim(),
      supplied_items: document.getElementById('sup-goods').value.trim()
    };

    if (!payload.name || !payload.phone) return App.showToast('Please enter company name and phone', 'warning');

    try {
      await App.api('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      App.showToast(`Supplier ${payload.name} registered!`);
      App.closeModal('inv-add-sup-modal');
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async deleteItem(id, name) {
    if (!confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;
    try {
      await App.api(`/api/inventory/${id}`, { method: 'DELETE' });
      App.showToast(`Item "${name}" removed from inventory`);
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async deleteSupplier(id, name) {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      await App.api(`/api/suppliers/${id}`, { method: 'DELETE' });
      App.showToast(`Supplier "${name}" deleted`);
      await this.init();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  }
};
