<?php
require '../config/database.php';
require '../includes/auth.php';
require_login();

$poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
$stmt = $pdo->prepare("SELECT po.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email, s.address as supplier_address, s.payment_terms FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.po_id = ?");
$stmt->execute([$poId]);
$po = $stmt->fetch();

if (!$po || empty($po['grn_number'])) {
    die("Goods Received Note not found or not yet generated for this purchase order.");
}

$page_title = "GRN Receipt - " . $po['grn_number'];
include '../includes/header.php';
?>

<div class="portal-header no-print">
    <div>
        <h2><i class="fas fa-receipt text-gold"></i> Goods Received Note (GRN)</h2>
        <p class="text-muted">Official Goods Received Confirmation & Finance Receipt</p>
    </div>
    <div class="portal-actions">
        <a href="javascript:window.print()" class="btn btn-gold"><i class="fas fa-print"></i> Print Official GRN</a>
        <a href="purchase_orders.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to Orders</a>
    </div>
</div>

<?php if (isset($_GET['received'])): ?>
    <div class="alert alert-success no-print">
        <i class="fas fa-check-double"></i> <strong>Shipment Confirmed!</strong> Inventory records have been incremented by <?= $po['quantity'] ?> units, and the expense has been recorded in the Finance ledger.
    </div>
<?php endif; ?>

<div class="card print-area" style="max-width:850px; margin:0 auto; padding:40px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:20px; margin-bottom:24px;">
        <div>
            <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOUR</h2>
            <div style="font-size:0.85rem; color:var(--text-muted);">Finance & Inventory Accounts • Valley Arcade, Gitanga Rd, Nairobi</div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Email: inventory@stevesmassage.co.ke • Tel: +254 712 345 678</div>
        </div>
        <div style="text-align:right;">
            <span class="badge badge-success" style="font-size:0.85rem; padding:6px 12px;">GOODS RECEIVED NOTE</span>
            <h3 style="color:var(--accent); margin:8px 0 2px; font-size:1.4rem;"><?= htmlspecialchars($po['grn_number']) ?></h3>
            <div style="font-size:0.85rem; color:var(--text-muted);">Date Received: <strong><?= $po['received_date'] ?></strong></div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Related PO: <strong><?= htmlspecialchars($po['po_number']) ?></strong></div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; background:#FAFBF9; padding:18px; border-radius:8px;">
        <div>
            <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Vendor / Supplier Details:</strong>
            <h4 style="margin:4px 0; color:var(--primary);"><?= htmlspecialchars($po['supplier_name']) ?></h4>
            <div style="font-size:0.85rem;">Contact: <?= htmlspecialchars($po['contact_person']) ?> • <?= htmlspecialchars($po['supplier_phone']) ?></div>
            <div style="font-size:0.85rem;">Payment Terms: <?= htmlspecialchars($po['payment_terms']) ?></div>
        </div>
        <div>
            <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Receiving Department:</strong>
            <h4 style="margin:4px 0; color:var(--primary);">Steve's Massage Parlour - Main Consumables Store</h4>
            <div style="font-size:0.85rem;">Received By: <strong><?= htmlspecialchars($po['received_by'] ?? 'Inventory Manager') ?></strong></div>
            <div style="font-size:0.85rem;">Delivery Method: <strong><?= htmlspecialchars($po['delivery_option']) ?></strong></div>
        </div>
    </div>

    <table class="table" style="margin-bottom:24px;">
        <thead>
            <tr>
                <th>Item Description</th>
                <th>Quantity Received</th>
                <th>Agreed Unit Cost</th>
                <th>Total Capitalized (KES)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong><?= htmlspecialchars($po['item_name']) ?></strong></td>
                <td><strong style="color:var(--success);"><?= $po['quantity'] ?> units (Credited to Stock)</strong></td>
                <td>KES <?= number_format($po['unit_price'], 2) ?></td>
                <td><strong style="color:var(--primary); font-size:1.15rem;">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
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
            <div style="font-size:0.82rem; text-align:center;">Store Keeper / Received By: <?= htmlspecialchars($po['received_by'] ?? 'Mercy Chebet') ?></div>
        </div>
        <div>
            <div style="height:40px; border-bottom:1px solid #000; margin-bottom:6px;"></div>
            <div style="font-size:0.82rem; text-align:center;">Finance Authorization Sign-Off: Patrick Mutua</div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
