<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('supplier');

$supplierId = (int)($_SESSION['supplier_id'] ?? 0);
$page_title = "Supplier Partner Portal - Steve's Massage Parlour";

// Strict supplier isolation: Get supplier details
$sStmt = $pdo->prepare("SELECT * FROM suppliers WHERE supplier_id = ?");
$sStmt->execute([$supplierId]);
$supplier = $sStmt->fetch();

// Statistics strictly for this supplier
$totalPOs = $pdo->prepare("SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = ?");
$totalPOs->execute([$supplierId]);
$countTotal = $totalPOs->fetchColumn();

$activePOs = $pdo->prepare("SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = ? AND order_status IN ('approved', 'acknowledged', 'in_transit')");
$activePOs->execute([$supplierId]);
$countActive = $activePOs->fetchColumn();

$completedPOs = $pdo->prepare("SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = ? AND order_status = 'received'");
$completedPOs->execute([$supplierId]);
$countCompleted = $completedPOs->fetchColumn();

$unreadNotifs = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE (user_id = ? OR role_target = 'supplier') AND is_read = 0");
$unreadNotifs->execute([$_SESSION['user_id']]);
$countUnread = $unreadNotifs->fetchColumn();

// Recent POs for this supplier
$recentOrders = $pdo->prepare("SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY po_id DESC LIMIT 5");
$recentOrders->execute([$supplierId]);
$orders = $recentOrders->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-truck-loading text-gold"></i> Supplier Partner Portal</h2>
        <p class="text-muted">Welcome, <?= htmlspecialchars($_SESSION['full_name']) ?> • <?= htmlspecialchars($supplier['supplier_name'] ?? 'Authorized Vendor') ?></p>
    </div>
    <div class="portal-actions">
        <a href="orders.php" class="btn btn-gold"><i class="fas fa-file-invoice"></i> My Purchase Orders</a>
        <a href="notifications.php" class="btn btn-outline"><i class="fas fa-bell"></i> Alerts (<?= $countUnread ?>)</a>
    </div>
</div>

<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-icon primary"><i class="fas fa-clipboard-list"></i></div>
        <div class="kpi-info">
            <h4>Total Orders Received</h4>
            <h2><?= $countTotal ?> Orders</h2>
        </div>
    </div>
    <div class="kpi-card <?= $countActive > 0 ? 'kpi-card-warning' : '' ?>">
        <div class="kpi-icon warning"><i class="fas fa-truck"></i></div>
        <div class="kpi-info">
            <h4>Action Required / Active</h4>
            <h2><?= $countActive ?> Orders</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon success"><i class="fas fa-check-circle"></i></div>
        <div class="kpi-info">
            <h4>Fulfilled & GRN Confirmed</h4>
            <h2><?= $countCompleted ?> Orders</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon gold"><i class="fas fa-bell"></i></div>
        <div class="kpi-info">
            <h4>Unread Notifications</h4>
            <h2><?= $countUnread ?> Alerts</h2>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3><i class="fas fa-file-invoice text-gold"></i> Recent Purchase Orders</h3>
        <a href="orders.php" class="btn btn-sm btn-outline">View All Orders</a>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Item Ordered</th>
                    <th>Quantity</th>
                    <th>Total Value</th>
                    <th>Delivery Option</th>
                    <th>Order Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($orders)): ?>
                    <tr><td colspan="8" style="text-align:center; padding:30px;" class="text-muted">No purchase orders found for your vendor account.</td></tr>
                <?php else: foreach ($orders as $o): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($o['po_number']) ?></strong></td>
                        <td><?= $o['order_date'] ?></td>
                        <td><?= htmlspecialchars($o['item_name']) ?></td>
                        <td><?= $o['quantity'] ?></td>
                        <td><strong>KES <?= number_format($o['total_cost'], 2) ?></strong></td>
                        <td><small><?= htmlspecialchars($o['delivery_option']) ?></small></td>
                        <td>
                            <span class="badge badge-<?= $o['order_status'] === 'received' ? 'success' : ($o['order_status'] === 'in_transit' ? 'primary' : 'warning') ?>">
                                <?= strtoupper(str_replace('_', ' ', $o['order_status'])) ?>
                            </span>
                        </td>
                        <td>
                            <a href="view_po.php?po_id=<?= $o['po_id'] ?>" class="btn btn-sm btn-gold">
                                <i class="fas fa-eye"></i> View Order
                            </a>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
