<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('supplier');

$supplierId = (int)($_SESSION['supplier_id'] ?? 0);
$poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;

// Strict supplier isolation: only allow access if this PO belongs to this supplier
$stmt = $pdo->prepare("SELECT po.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email, s.address as supplier_address, s.payment_terms,
                              s.bank_name, s.bank_account, s.mpesa_paybill, s.mpesa_till
                       FROM purchase_orders po 
                       JOIN suppliers s ON po.supplier_id = s.supplier_id 
                       WHERE po.po_id = ? AND po.supplier_id = ?");
$stmt->execute([$poId, $supplierId]);
$po = $stmt->fetch();

if (!$po) {
    die("<div style='padding:50px; text-align:center;'><h3>403 Access Denied</h3><p>You can only view purchase orders issued directly to your vendor organization.</p><a href='orders.php'>Back to Orders</a></div>");
}

// Handle Status Updates by Supplier
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $newStatus = $_POST['action'];
    $allowed = ['acknowledged', 'in_transit', 'delivered'];
    
    if (in_array($newStatus, $allowed, true)) {
        $uStmt = $pdo->prepare("UPDATE purchase_orders SET order_status = ? WHERE po_id = ? AND supplier_id = ?");
        $uStmt->execute([$newStatus, $poId, $supplierId]);

        // Notify Inventory and Finance
        try {
            $msg = "Supplier {$po['supplier_name']} marked Purchase Order {$po['po_number']} as " . strtoupper(str_replace('_', ' ', $newStatus)) . ".";
            $pdo->prepare("INSERT INTO notifications (role_target, title, message) VALUES ('inventory_manager', 'PO Status Updated', ?)")->execute([$msg]);
            $pdo->prepare("INSERT INTO notifications (role_target, title, message) VALUES ('finance_officer', 'PO Status Updated', ?)")->execute([$msg]);
        } catch (Exception $e) {}

        header("Location: view_po.php?po_id=$poId&updated=1");
        exit;
    }
}

$page_title = "Purchase Order " . $po['po_number'];
include '../includes/header.php';
?>

<div class="portal-header no-print">
    <div>
        <h2><i class="fas fa-file-invoice text-gold"></i> Purchase Order <?= htmlspecialchars($po['po_number']) ?></h2>
        <p class="text-muted">Issued by Steve's Massage Parlour • <?= htmlspecialchars($po['order_date']) ?></p>
    </div>
    <div class="portal-actions">
        <a href="orders.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to Orders</a>
        <a href="javascript:window.print()" class="btn btn-outline"><i class="fas fa-print"></i> Print PO</a>
    </div>
</div>

<?php if (isset($_GET['updated'])): ?>
    <div class="alert alert-success no-print"><i class="fas fa-check-circle"></i> Order status updated successfully!</div>
<?php endif; ?>

<?php if (($po['payment_status'] ?? 'unpaid') === 'paid'): ?>
    <div class="card no-print" style="max-width:850px; margin:0 auto 20px; background:#E8F8F5; border:1px solid #A3E4D7; padding:18px 24px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
            <h4 style="margin:0 0 4px; color:#117A65;"><i class="fas fa-check-circle"></i> Payment Disbursed by Steve's Massage Parlour</h4>
            <div style="font-size:0.85rem; color:#16A085;">
                Receipt: <strong><?= htmlspecialchars($po['payment_receipt_no']) ?></strong> | 
                Method: <strong><?= htmlspecialchars($po['payment_method'] ?? 'M-Pesa') ?></strong> | 
                Ref: <strong><?= htmlspecialchars($po['payment_reference'] ?? '-') ?></strong> | 
                Date: <strong><?= htmlspecialchars($po['payment_date'] ?? '') ?></strong>
            </div>
        </div>
        <a href="../finance/payment_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold">
            <i class="fas fa-print"></i> View Official Payment Receipt
        </a>
    </div>
<?php endif; ?>

<div class="card" style="max-width:850px; margin:0 auto; padding:30px;">
    <!-- PO Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:16px; margin-bottom:20px;">
        <div>
            <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOUR</h2>
            <div style="font-size:0.85rem; color:var(--text-muted);">Valley Arcade, Gitanga Rd, Nairobi | Tel: +254 712 345 678</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:1.3rem; font-weight:800; color:var(--accent);">OFFICIAL PURCHASE ORDER</div>
            <div style="font-size:1.1rem; font-weight:700;"><?= htmlspecialchars($po['po_number']) ?></div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Date: <?= $po['order_date'] ?></div>
        </div>
    </div>

    <!-- Vendor and Delivery Details -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
        <div style="background:#FAFBF9; padding:16px; border-radius:8px;">
            <h4 style="margin:0 0 8px; color:var(--primary);"><i class="fas fa-building"></i> TO (Supplier):</h4>
            <strong><?= htmlspecialchars($po['supplier_name']) ?></strong>
            <div style="font-size:0.85rem; margin-top:4px;">Contact: <?= htmlspecialchars($po['contact_person']) ?></div>
            <div style="font-size:0.85rem;">Phone: <?= htmlspecialchars($po['supplier_phone']) ?></div>
            <div style="font-size:0.85rem;">Address: <?= htmlspecialchars($po['supplier_address']) ?></div>
            <div style="font-size:0.85rem;">Terms: <?= htmlspecialchars($po['payment_terms']) ?></div>
            <?php if (!empty($po['bank_name'])): ?>
            <div style="margin-top:8px; padding:6px 10px; background:#F0FFF4; border-radius:4px; font-size:0.8rem; border-left:3px solid #27AE60;">
                <div style="color:#27AE60; font-weight:700;">Remittance Account on File:</div>
                <div><?= htmlspecialchars($po['bank_name']) ?> — Acc: <?= htmlspecialchars($po['bank_account']) ?></div>
                <?php if (!empty($po['mpesa_paybill'])): ?><div>M-Pesa Paybill: <?= htmlspecialchars($po['mpesa_paybill']) ?></div><?php endif; ?>
                <?php if (!empty($po['mpesa_till'])): ?><div>Buy Goods Till: <?= htmlspecialchars($po['mpesa_till']) ?></div><?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
        <div style="background:#FAFBF9; padding:16px; border-radius:8px;">
            <h4 style="margin:0 0 8px; color:var(--primary);"><i class="fas fa-map-marker-alt"></i> DELIVERY INSTRUCTIONS:</h4>
            <div style="font-size:0.85rem;"><strong>Option:</strong> <?= htmlspecialchars($po['delivery_option']) ?></div>
            <div style="font-size:0.85rem; margin-top:4px;"><strong>Address:</strong> <?= htmlspecialchars($po['delivery_address']) ?></div>
            <div style="font-size:0.85rem; margin-top:4px;"><strong>Finance Authorization:</strong> 
                <span class="badge badge-<?= $po['finance_status'] === 'approved' ? 'success' : 'warning' ?>">
                    <?= strtoupper($po['finance_status']) ?>
                </span>
            </div>
            <div style="font-size:0.85rem; margin-top:4px;"><strong>Current Status:</strong> 
                <span class="badge badge-primary"><?= strtoupper(str_replace('_', ' ', $po['order_status'])) ?></span>
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <table class="table" style="margin-bottom:20px;">
        <thead>
            <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Agreed Unit Price (KES)</th>
                <th>Total Value (KES)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong><?= htmlspecialchars($po['item_name']) ?></strong></td>
                <td><strong><?= $po['quantity'] ?></strong></td>
                <td>KES <?= number_format($po['unit_price'], 2) ?></td>
                <td><strong style="color:var(--primary); font-size:1.1rem;">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" style="text-align:right; font-weight:700;">TOTAL PAYABLE:</td>
                <td style="font-size:1.2rem; font-weight:800; color:var(--primary);">KES <?= number_format($po['total_cost'], 2) ?></td>
            </tr>
        </tfoot>
    </table>

    <?php if ($po['notes']): ?>
        <div style="background:#FAFBF9; padding:12px; border-radius:6px; font-size:0.85rem; margin-bottom:24px;">
            <strong>Requisition Notes:</strong> <?= htmlspecialchars($po['notes']) ?>
        </div>
    <?php endif; ?>

    <!-- Supplier Action Workflow Controls -->
    <div class="no-print" style="background:#F0F7F4; border:1px solid #C8E6C9; padding:20px; border-radius:8px; margin-top:20px;">
        <h4 style="margin:0 0 12px; color:var(--primary);"><i class="fas fa-tasks"></i> Vendor Fulfillment Actions</h4>
        
        <?php if ($po['order_status'] === 'received'): ?>
            <div style="color:var(--success); font-weight:700;">
                <i class="fas fa-check-circle"></i> Goods Received & Verified by Inventory Manager.
                <a href="../inventory/grn_receipt.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold" style="margin-left:12px;"><i class="fas fa-receipt"></i> View Official GRN Note</a>
            </div>
        <?php elseif ($po['finance_status'] !== 'approved'): ?>
            <p class="text-muted" style="margin:0;"><i class="fas fa-clock"></i> This purchase order is currently pending Financial authorization by the Finance Director.</p>
        <?php else: ?>
            <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
                <?php if ($po['order_status'] === 'approved'): ?>
                    <form method="post" style="display:inline;">
                        <input type="hidden" name="action" value="acknowledged">
                        <button type="submit" class="btn btn-gold"><i class="fas fa-check"></i> Acknowledge Purchase Order</button>
                    </form>
                <?php endif; ?>

                <?php if ($po['order_status'] === 'acknowledged'): ?>
                    <form method="post" style="display:inline;">
                        <input type="hidden" name="action" value="in_transit">
                        <button type="submit" class="btn btn-primary"><i class="fas fa-truck"></i> Mark Dispatched / In-Transit</button>
                    </form>
                <?php endif; ?>

                <?php if ($po['order_status'] === 'in_transit'): ?>
                    <form method="post" style="display:inline;">
                        <input type="hidden" name="action" value="delivered">
                        <button type="submit" class="btn btn-success"><i class="fas fa-box-open"></i> Confirm Delivered to Parlour</button>
                    </form>
                <?php endif; ?>

                <?php if ($po['order_status'] === 'delivered'): ?>
                    <span class="badge badge-success"><i class="fas fa-check"></i> Delivered — Awaiting Inventory Manager Physical Verification & GRN</span>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
