<?php
require '../config/database.php';
require '../includes/auth.php';
// Restrict strictly to Inventory Manager (or Admin)
require_role(['inventory_manager', 'admin']);

$page_title = "Inventory Control Dashboard - Steve's Massage Parlour";

// Fetch Telemetry & Statistics
$totalItems = $pdo->query("SELECT COUNT(*) FROM inventory")->fetchColumn();
$lowStockCount = $pdo->query("SELECT COUNT(*) FROM inventory WHERE quantity <= min_threshold")->fetchColumn();
$totalValuation = $pdo->query("SELECT COALESCE(SUM(quantity * unit_price), 0) FROM inventory")->fetchColumn();
$pendingPOs = $pdo->query("SELECT COUNT(*) FROM purchase_orders WHERE order_status = 'pending_approval' OR finance_status = 'pending'")->fetchColumn();

// Low stock items
$lowStockItems = $pdo->query("SELECT i.*, s.supplier_name FROM inventory i LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id WHERE i.quantity <= i.min_threshold ORDER BY i.quantity ASC")->fetchAll();

// Recent POs
$recentPOs = $pdo->query("SELECT po.*, s.supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id ORDER BY po.po_id DESC LIMIT 5")->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-boxes text-gold"></i> Inventory & Supplies Control Module</h2>
        <p class="text-muted">Welcome, <?= htmlspecialchars($_SESSION['full_name']) ?> • Authorized Inventory Controller</p>
    </div>
    <div class="portal-actions">
        <a href="create_po.php" class="btn btn-gold"><i class="fas fa-file-invoice"></i> Issue Purchase Order</a>
        <a href="inventory.php" class="btn btn-outline"><i class="fas fa-warehouse"></i> Stock Catalog</a>
    </div>
</div>

<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-icon primary"><i class="fas fa-boxes"></i></div>
        <div class="kpi-info">
            <h4>Total Catalog Items</h4>
            <h2><?= $totalItems ?> SKUs</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon gold"><i class="fas fa-coins"></i></div>
        <div class="kpi-info">
            <h4>Stock Valuation</h4>
            <h2>KES <?= number_format($totalValuation, 2) ?></h2>
        </div>
    </div>
    <div class="kpi-card <?= $lowStockCount > 0 ? 'kpi-card-danger' : '' ?>">
        <div class="kpi-icon <?= $lowStockCount > 0 ? 'danger' : 'success' ?>">
            <i class="fas <?= $lowStockCount > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle' ?>"></i>
        </div>
        <div class="kpi-info">
            <h4>Low Stock Depletions</h4>
            <h2 style="color:<?= $lowStockCount > 0 ? '#C0392B' : '#27AE60' ?>;"><?= $lowStockCount ?> Reorders Needed</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon warning"><i class="fas fa-hourglass-half"></i></div>
        <div class="kpi-info">
            <h4>Pending Approvals</h4>
            <h2><?= $pendingPOs ?> Orders</h2>
        </div>
    </div>
</div>

<?php if ($lowStockCount > 0): ?>
    <div class="card" style="margin-bottom:24px; border-left:4px solid #C0392B;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="color:#C0392B; margin:0;"><i class="fas fa-exclamation-circle"></i> Urgent Stock Depletion Alerts</h3>
            <span class="badge badge-danger"><?= $lowStockCount ?> Critical Items</span>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Current Quantity</th>
                        <th>Min Safety Threshold</th>
                        <th>Designated Vendor</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($lowStockItems as $item): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($item['item_name']) ?></strong></td>
                        <td><?= htmlspecialchars($item['category']) ?></td>
                        <td><strong style="color:#C0392B;"><?= $item['quantity'] ?> <?= htmlspecialchars($item['unit']) ?></strong></td>
                        <td><?= $item['min_threshold'] ?> <?= htmlspecialchars($item['unit']) ?></td>
                        <td><?= htmlspecialchars($item['supplier_name'] ?? 'General Vendor') ?></td>
                        <td>
                            <a href="shortage_request.php?item_id=<?= $item['inventory_id'] ?>" class="btn btn-sm btn-danger">
                                <i class="fas fa-paper-plane"></i> Request Shortage Restock
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
<?php endif; ?>

<div class="card">
    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3><i class="fas fa-file-invoice text-gold"></i> Recent Purchase Orders & Goods Received Status</h3>
        <a href="purchase_orders.php" class="btn btn-sm btn-outline">View All POs</a>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Order Date</th>
                    <th>Supplier</th>
                    <th>Item Description</th>
                    <th>Quantity</th>
                    <th>Total (KES)</th>
                    <th>Finance Approval</th>
                    <th>Delivery Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($recentPOs)): ?>
                    <tr><td colspan="9" style="text-align:center; padding:20px;" class="text-muted">No purchase orders found.</td></tr>
                <?php else: foreach ($recentPOs as $po): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($po['po_number']) ?></strong></td>
                        <td><?= $po['order_date'] ?></td>
                        <td><?= htmlspecialchars($po['supplier_name']) ?></td>
                        <td><?= htmlspecialchars($po['item_name']) ?></td>
                        <td><?= $po['quantity'] ?></td>
                        <td><strong>KES <?= number_format($po['total_cost'], 2) ?></strong></td>
                        <td>
                            <span class="badge badge-<?= $po['finance_status'] === 'approved' ? 'success' : ($po['finance_status'] === 'rejected' ? 'danger' : 'warning') ?>">
                                <?= strtoupper($po['finance_status']) ?>
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-<?= $po['order_status'] === 'received' ? 'success' : ($po['order_status'] === 'in_transit' ? 'primary' : 'secondary') ?>">
                                <?= strtoupper(str_replace('_', ' ', $po['order_status'])) ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($po['order_status'] === 'received'): ?>
                                <a href="grn_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-outline"><i class="fas fa-receipt"></i> View GRN</a>
                            <?php elseif ($po['finance_status'] === 'approved'): ?>
                                <a href="receive_po.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-success"><i class="fas fa-box-open"></i> Receive Shipment</a>
                            <?php else: ?>
                                <span class="text-muted">Awaiting Finance</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
