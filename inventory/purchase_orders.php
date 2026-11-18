<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['inventory_manager', 'admin']);

$page_title = "Purchase Orders - Steve's Massage Parlour";

$pos = $pdo->query("SELECT po.*, s.supplier_name, s.phone as supplier_phone FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id ORDER BY po.po_id DESC")->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-file-invoice text-gold"></i> Purchase Order Management</h2>
        <p class="text-muted">Track order authorization, supplier acknowledgments, dispatches, and receive shipments.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
        <a href="create_po.php" class="btn btn-gold"><i class="fas fa-plus"></i> Issue New PO</a>
    </div>
</div>

<?php if (isset($_GET['issued'])): ?>
    <div class="alert alert-success"><i class="fas fa-check-circle"></i> Purchase Order <strong><?= htmlspecialchars($_GET['issued']) ?></strong> successfully issued and routed to Finance Director!</div>
<?php endif; ?>

<?php if (isset($_GET['shortage_sent'])): ?>
    <div class="alert alert-success"><i class="fas fa-check-circle"></i> Shortage Requisition <strong><?= htmlspecialchars($_GET['shortage_sent']) ?></strong> transmitted to Finance and Supplier modules!</div>
<?php endif; ?>

<?php if (isset($_GET['received'])): ?>
    <div class="alert alert-success"><i class="fas fa-check-circle"></i> Shipment received! Goods Received Note (GRN) generated and stock quantities automatically updated in inventory catalog!</div>
<?php endif; ?>

<div class="card">
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Supplier / Vendor</th>
                    <th>Item Ordered</th>
                    <th>Qty</th>
                    <th>Total (KES)</th>
                    <th>Delivery Option</th>
                    <th>Finance Status</th>
                    <th>Delivery Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($pos)): ?>
                    <tr><td colspan="10" style="text-align:center; padding:30px;" class="text-muted">No purchase orders found.</td></tr>
                <?php else: foreach ($pos as $po): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($po['po_number']) ?></strong></td>
                        <td><?= $po['order_date'] ?></td>
                        <td>
                            <strong><?= htmlspecialchars($po['supplier_name']) ?></strong>
                            <div class="text-muted" style="font-size:0.75rem;"><?= htmlspecialchars($po['supplier_phone']) ?></div>
                        </td>
                        <td><?= htmlspecialchars($po['item_name']) ?></td>
                        <td><strong><?= $po['quantity'] ?></strong></td>
                        <td><strong>KES <?= number_format($po['total_cost'], 2) ?></strong></td>
                        <td><small><?= htmlspecialchars($po['delivery_option']) ?></small></td>
                        <td>
                            <span class="badge badge-<?= $po['finance_status'] === 'approved' ? 'success' : ($po['finance_status'] === 'rejected' ? 'danger' : 'warning') ?>">
                                <?= strtoupper($po['finance_status']) ?>
                            </span>
                            <?php if ($po['finance_feedback']): ?>
                                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">"<?= htmlspecialchars($po['finance_feedback']) ?>"</div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="badge badge-<?= $po['order_status'] === 'received' ? 'success' : ($po['order_status'] === 'in_transit' ? 'primary' : ($po['order_status'] === 'delivered' ? 'gold' : 'secondary')) ?>">
                                <?= strtoupper(str_replace('_', ' ', $po['order_status'])) ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($po['order_status'] === 'received'): ?>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <a href="grn_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold">
                                        <i class="fas fa-receipt"></i> View GRN
                                    </a>
                                    <?php if (($po['payment_status'] ?? 'unpaid') === 'paid'): ?>
                                        <a href="../finance/payment_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-outline" style="border-color:#27AE60; color:#27AE60;">
                                            <i class="fas fa-file-invoice-dollar"></i> Payment Receipt
                                        </a>
                                    <?php endif; ?>
                                </div>
                            <?php elseif ($po['finance_status'] === 'approved'): ?>
                                <a href="receive_po.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-success" onclick="return confirm('Confirm receipt of shipment for <?= $po['po_number'] ?>? This will increment stock and generate official GRN receipt.');">
                                    <i class="fas fa-box-open"></i> Receive Shipment
                                </a>
                            <?php else: ?>
                                <span class="text-muted" style="font-size:0.8rem;">Awaiting Review</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
