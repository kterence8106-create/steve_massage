<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('supplier');

$supplierId = (int)($_SESSION['supplier_id'] ?? 0);
$page_title = "My Purchase Orders - Supplier Portal";

// Strictly isolated query
$stmt = $pdo->prepare("SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY po_id DESC");
$stmt->execute([$supplierId]);
$orders = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-file-invoice text-gold"></i> My Purchase Orders</h2>
        <p class="text-muted">Acknowledge incoming purchase orders, update dispatch statuses, and track delivered goods.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
    </div>
</div>

<?php if (isset($_GET['status_updated'])): ?>
    <div class="alert alert-success"><i class="fas fa-check-circle"></i> Order status updated to <strong><?= htmlspecialchars(strtoupper($_GET['status_updated'])) ?></strong>!</div>
<?php endif; ?>

<div class="card">
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Order Date</th>
                    <th>Item Description</th>
                    <th>Quantity</th>
                    <th>Total (KES)</th>
                    <th>Delivery Option</th>
                    <th>Finance Status</th>
                    <th>Order Status</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($orders)): ?>
                    <tr><td colspan="10" style="text-align:center; padding:30px;" class="text-muted">No purchase orders assigned to your supplier account.</td></tr>
                <?php else: foreach ($orders as $o): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($o['po_number']) ?></strong></td>
                        <td><?= $o['order_date'] ?></td>
                        <td><?= htmlspecialchars($o['item_name']) ?></td>
                        <td><strong><?= $o['quantity'] ?></strong></td>
                        <td><strong>KES <?= number_format($o['total_cost'], 2) ?></strong></td>
                        <td><small><?= htmlspecialchars($o['delivery_option']) ?></small></td>
                        <td>
                            <span class="badge badge-<?= $o['finance_status'] === 'approved' ? 'success' : ($o['finance_status'] === 'rejected' ? 'danger' : 'warning') ?>">
                                <?= strtoupper($o['finance_status']) ?>
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-<?= $o['order_status'] === 'received' ? 'success' : ($o['order_status'] === 'in_transit' ? 'primary' : ($o['order_status'] === 'delivered' ? 'gold' : 'secondary')) ?>">
                                <?= strtoupper(str_replace('_', ' ', $o['order_status'])) ?>
                            </span>
                        </td>
                        <td>
                            <?php if (($o['payment_status'] ?? 'unpaid') === 'paid'): ?>
                                <span class="badge badge-success"><i class="fas fa-check-circle"></i> PAID</span>
                                <?php if (!empty($o['payment_receipt_no'])): ?>
                                    <div style="margin-top:3px;">
                                        <a href="../finance/payment_receipt.php?po_id=<?= $o['po_id'] ?>" class="btn btn-sm btn-outline" style="font-size:0.7rem; padding:2px 6px;">
                                            <i class="fas fa-receipt"></i> <?= htmlspecialchars($o['payment_receipt_no']) ?>
                                        </a>
                                    </div>
                                <?php endif; ?>
                            <?php else: ?>
                                <span class="badge badge-warning" style="font-size:0.7rem;"><i class="fas fa-clock"></i> UNPAID</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <a href="view_po.php?po_id=<?= $o['po_id'] ?>" class="btn btn-sm btn-gold">
                                <i class="fas fa-eye"></i> Details
                            </a>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
