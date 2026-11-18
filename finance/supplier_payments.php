<?php
/**
 * Steve's Massage Parlour - Supplier Payments Ledger
 * Finance Module (DBIT 226 Research Project)
 */
require '../config/database.php';
require '../includes/auth.php';
require_role(['finance_officer', 'admin']);

$page_title = "Supplier Payments - Finance Module";

// Fetch received POs eligible for supplier disbursement
$stmt = $pdo->query("SELECT po.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.payment_terms 
                     FROM purchase_orders po 
                     JOIN suppliers s ON po.supplier_id = s.supplier_id 
                     WHERE po.order_status = 'received' 
                     ORDER BY po.po_id DESC");
$receivedPOs = $stmt->fetchAll();

// Telemetry
$unpaidCount = 0;
$totalUnpaidAmount = 0;
$totalDisbursedAmount = 0;

foreach ($receivedPOs as $r) {
    if (($r['payment_status'] ?? 'unpaid') === 'paid') {
        $totalDisbursedAmount += (float)$r['total_cost'];
    } else {
        $unpaidCount++;
        $totalUnpaidAmount += (float)$r['total_cost'];
    }
}

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-money-check-alt text-gold"></i> Supplier Payments & Disbursements</h2>
        <p class="text-muted">Process vendor settlements for orders after physical receipt of goods (GRN issued).</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
        <a href="po_approvals.php" class="btn btn-outline"><i class="fas fa-clipboard-check"></i> PO Approvals</a>
    </div>
</div>

<?php if (isset($_GET['success'])): ?>
    <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> <strong>Payment Successful!</strong> Supplier disbursement has been executed, ledger updated, and official payment receipt generated.
    </div>
<?php endif; ?>

<div class="kpi-grid">
    <div class="kpi-card <?= $unpaidCount > 0 ? 'kpi-card-danger' : '' ?>">
        <div class="kpi-icon <?= $unpaidCount > 0 ? 'danger' : 'success' ?>"><i class="fas fa-file-invoice-dollar"></i></div>
        <div class="kpi-info">
            <h4>Pending Supplier Invoices</h4>
            <h2 style="color:<?= $unpaidCount > 0 ? '#C0392B' : '#27AE60' ?>;"><?= $unpaidCount ?> Invoices</h2>
            <small class="text-muted">KES <?= number_format($totalUnpaidAmount, 2) ?> awaiting payment</small>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon success"><i class="fas fa-hand-holding-usd"></i></div>
        <div class="kpi-info">
            <h4>Total Settled to Suppliers</h4>
            <h2 style="color:#27AE60;">KES <?= number_format($totalDisbursedAmount, 2) ?></h2>
            <small class="text-muted">Fully verified & receipted</small>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon primary"><i class="fas fa-boxes"></i></div>
        <div class="kpi-info">
            <h4>Total Received Shipments</h4>
            <h2><?= count($receivedPOs) ?> Orders</h2>
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
        <table class="table">
            <thead>
                <tr>
                    <th>PO Number</th>
                    <th>Supplier / Vendor</th>
                    <th>Item Description</th>
                    <th>Qty Received</th>
                    <th>Total (KES)</th>
                    <th>GRN Reference</th>
                    <th>Payment Status</th>
                    <th>Receipt No</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($receivedPOs)): ?>
                    <tr>
                        <td colspan="9" style="text-align:center; padding:35px;" class="text-muted">
                            <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px; display:block; color:#BDC3C7;"></i>
                            No received purchase orders found. Orders must first be confirmed as received in the Inventory Module before payments can be processed.
                        </td>
                    </tr>
                <?php else: foreach ($receivedPOs as $po): 
                    $isPaid = ($po['payment_status'] ?? 'unpaid') === 'paid';
                ?>
                    <tr style="<?= !$isPaid ? 'background:#FFFBF2;' : '' ?>">
                        <td><strong><?= htmlspecialchars($po['po_number']) ?></strong></td>
                        <td>
                            <strong><?= htmlspecialchars($po['supplier_name']) ?></strong>
                            <div style="font-size:0.75rem; color:var(--text-muted);"><?= htmlspecialchars($po['supplier_phone']) ?></div>
                        </td>
                        <td><?= htmlspecialchars($po['item_name']) ?></td>
                        <td><?= (int)$po['quantity'] ?> units</td>
                        <td><strong style="color:var(--primary); font-size:1.05rem;">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
                        <td>
                            <a href="../inventory/grn_receipt.php?po_id=<?= $po['po_id'] ?>" class="badge badge-success" style="text-decoration:none;" title="View Goods Received Note">
                                <i class="fas fa-receipt"></i> <?= htmlspecialchars($po['grn_number']) ?>
                            </a>
                            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Rcvd: <?= $po['received_date'] ?></div>
                        </td>
                        <td>
                            <?php if ($isPaid): ?>
                                <span class="badge badge-success"><i class="fas fa-check-circle"></i> PAID</span>
                                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;"><?= $po['payment_date'] ?></div>
                            <?php else: ?>
                                <span class="badge badge-warning"><i class="fas fa-clock"></i> PENDING PAYMENT</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if ($isPaid && !empty($po['payment_receipt_no'])): ?>
                                <code style="font-weight:700; color:var(--primary);"><?= htmlspecialchars($po['payment_receipt_no']) ?></code>
                                <div style="font-size:0.72rem; color:var(--text-muted);"><?= htmlspecialchars($po['payment_method'] ?? 'M-Pesa') ?></div>
                            <?php else: ?>
                                <span class="text-muted">-</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if (!$isPaid): ?>
                                <a href="pay_supplier.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold">
                                    <i class="fas fa-hand-holding-usd"></i> Pay Supplier
                                </a>
                            <?php else: ?>
                                <a href="payment_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-outline">
                                    <i class="fas fa-print"></i> Print Receipt
                                </a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<div class="card" style="margin-top:24px; background:#FAFBF9; border-left:4px solid var(--accent);">
    <h4><i class="fas fa-info-circle text-gold"></i> Standard Operating Procedure: Supplier Payments</h4>
    <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.6; margin:0;">
        Under Kenya Methodist University DBIT 226 operational governance guidelines, disbursements are strictly authorized <strong>only after</strong> physical delivery has been inspected, accepted, and booked into stock with a registered Goods Received Note (GRN) by the Inventory Manager. This ensures three-way matching between the Purchase Order, Receiving Inspection, and Financial Disbursement Voucher.
    </p>
</div>

<?php include '../includes/footer.php'; ?>
