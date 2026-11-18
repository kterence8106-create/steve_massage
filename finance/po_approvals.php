<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['finance_officer', 'admin']);

$page_title = "Purchase Order Approvals - Finance Suite";

$pos = $pdo->query("SELECT po.*, s.supplier_name, s.phone as supplier_phone FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id ORDER BY po.po_id DESC")->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-clipboard-check text-gold"></i> Purchase Order Authorization & Approvals</h2>
        <p class="text-muted">Review requisitions from the Inventory Module and authorize supplier disbursements.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
    </div>
</div>

<?php if (isset($_GET['reviewed'])): ?>
    <div class="alert alert-success"><i class="fas fa-check-circle"></i> Purchase order decision recorded and synchronized across modules!</div>
<?php endif; ?>

<div class="card">
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Supplier / Vendor</th>
                    <th>Item Description</th>
                    <th>Quantity</th>
                    <th>Total Value (KES)</th>
                    <th>Finance Decision</th>
                    <th>Delivery Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($pos)): ?>
                    <tr><td colspan="9" style="text-align:center; padding:30px;" class="text-muted">No purchase orders found.</td></tr>
                <?php else: foreach ($pos as $po): ?>
                    <tr style="<?= $po['finance_status'] === 'pending' ? 'background:#FFFBF2;' : '' ?>">
                        <td><strong><?= htmlspecialchars($po['po_number']) ?></strong></td>
                        <td><?= $po['order_date'] ?></td>
                        <td><strong><?= htmlspecialchars($po['supplier_name']) ?></strong></td>
                        <td><?= htmlspecialchars($po['item_name']) ?></td>
                        <td><?= $po['quantity'] ?></td>
                        <td><strong style="color:var(--primary); font-size:1.05rem;">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
                        <td>
                            <span class="badge badge-<?= $po['finance_status'] === 'approved' ? 'success' : ($po['finance_status'] === 'rejected' ? 'danger' : 'warning') ?>">
                                <?= strtoupper($po['finance_status']) ?>
                            </span>
                            <?php if ($po['finance_feedback']): ?>
                                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">"<?= htmlspecialchars($po['finance_feedback']) ?>"</div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="badge badge-<?= $po['order_status'] === 'received' ? 'success' : ($po['order_status'] === 'in_transit' ? 'primary' : 'secondary') ?>">
                                <?= strtoupper(str_replace('_', ' ', $po['order_status'])) ?>
                            </span>
                            <?php if ($po['grn_number']): ?>
                                <div style="font-size:0.75rem; color:var(--success); margin-top:2px;"><strong><?= htmlspecialchars($po['grn_number']) ?></strong></div>
                            <?php endif; ?>
                            <?php if ($po['order_status'] === 'received'): ?>
                                <div style="margin-top:4px;">
                                    <?php if (($po['payment_status'] ?? 'unpaid') === 'paid'): ?>
                                        <span class="badge badge-success" style="font-size:0.7rem;"><i class="fas fa-check"></i> PAID (<?= htmlspecialchars($po['payment_receipt_no'] ?? '') ?>)</span>
                                    <?php else: ?>
                                        <span class="badge badge-warning" style="font-size:0.7rem;"><i class="fas fa-clock"></i> UNPAID</span>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if ($po['finance_status'] === 'pending'): ?>
                                <a href="review_po.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold">
                                    <i class="fas fa-clipboard-check"></i> Review & Decide
                                </a>
                            <?php else: ?>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <?php if ($po['grn_number']): ?>
                                        <a href="../inventory/grn_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-outline"><i class="fas fa-receipt"></i> View GRN</a>
                                        <?php if (($po['payment_status'] ?? 'unpaid') === 'paid'): ?>
                                            <a href="payment_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-outline" style="border-color:#27AE60; color:#27AE60;"><i class="fas fa-file-invoice-dollar"></i> Payment Receipt</a>
                                        <?php else: ?>
                                            <a href="pay_supplier.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold"><i class="fas fa-hand-holding-usd"></i> Pay Supplier</a>
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <span class="text-muted" style="font-size:0.8rem;">Reviewed</span>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
