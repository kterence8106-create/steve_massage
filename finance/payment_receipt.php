<?php
/**
 * Steve's Massage Parlour - Official Supplier Payment Receipt & Voucher
 * Finance Module (DBIT 226 Research Project)
 */
require '../config/database.php';
require '../includes/auth.php';
require_login();

$poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
$stmt = $pdo->prepare("SELECT po.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email, s.address as supplier_address, s.payment_terms,
                               s.bank_name, s.bank_account, s.mpesa_paybill, s.mpesa_till
                       FROM purchase_orders po 
                       JOIN suppliers s ON po.supplier_id = s.supplier_id 
                       WHERE po.po_id = ?");
$stmt->execute([$poId]);
$po = $stmt->fetch();

if (!$po || empty($po['payment_receipt_no'])) {
    die("<div style='font-family:sans-serif; max-width:600px; margin:50px auto; padding:25px; border:2px solid #E74C3C; border-radius:10px; background:#FDF2E9;'>
        <h2 style='color:#C0392B; margin-top:0;'>⚠️ Payment Receipt Not Found</h2>
        <p>No supplier payment receipt has been issued for this purchase order yet.</p>
        <p>Supplier payments can only be processed after inventory confirms goods receipt.</p>
        <hr style='border:none; border-top:1px solid #E0B4B4; margin:15px 0;'>
        <a href='supplier_payments.php' style='display:inline-block; padding:10px 18px; background:#1C2E26; color:#fff; text-decoration:none; border-radius:6px;'>Go to Supplier Payments</a>
    </div>");
}

// Fetch record from supplier_payments table if available
$spStmt = $pdo->prepare("SELECT * FROM supplier_payments WHERE po_id = ? ORDER BY payment_id DESC LIMIT 1");
$spStmt->execute([$poId]);
$payment = $spStmt->fetch();

$receiptNo   = $po['payment_receipt_no'];
$paymentDate = $po['payment_date'] ?? date('Y-m-d');
$method      = $po['payment_method'] ?? 'M-Pesa Business Till';
$reference   = $po['payment_reference'] ?? ($payment['reference_no'] ?? '-');
$paidBy      = $po['paid_by'] ?? ($payment['paid_by'] ?? 'Patrick Mutua (Finance Officer)');
$notes       = $po['payment_notes'] ?? ($payment['notes'] ?? '');
$amountPaid  = (float)($payment['amount_paid'] ?? $po['total_cost']);

$page_title = "Supplier Payment Receipt - " . $receiptNo;
include '../includes/header.php';
?>

<div class="portal-header no-print">
    <div>
        <h2><i class="fas fa-file-invoice-dollar text-gold"></i> Supplier Payment Voucher & Receipt</h2>
        <p class="text-muted">Official vendor remittance confirmation and audit voucher.</p>
    </div>
    <div class="portal-actions">
        <a href="javascript:window.print()" class="btn btn-gold"><i class="fas fa-print"></i> Print Official Receipt</a>
        <?php if ($_SESSION['role'] === 'supplier'): ?>
            <a href="../supplier/orders.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to Orders</a>
        <?php else: ?>
            <a href="supplier_payments.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Supplier Payments</a>
            <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-wallet"></i> Finance Suite</a>
        <?php endif; ?>
    </div>
</div>

<?php if (isset($_GET['paid'])): ?>
    <div class="alert alert-success no-print">
        <i class="fas fa-check-double"></i> <strong>Disbursement Executed!</strong> Payment of <strong>KES <?= number_format($amountPaid, 2) ?></strong> has been recorded in the Finance General Ledger and remittance notification dispatched to <strong><?= htmlspecialchars($po['supplier_name']) ?></strong>.
    </div>
<?php endif; ?>

<!-- PRINTABLE VOUCHER CARD -->
<div class="card print-area" style="max-width:880px; margin:0 auto; padding:45px; background:#FFF; border:1px solid var(--border); box-shadow:0 6px 20px rgba(0,0,0,0.06); border-radius:10px;">
    
    <!-- Top Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--primary); padding-bottom:20px; margin-bottom:24px;">
        <div>
            <h2 style="color:var(--primary); margin:0; font-family:'Playfair Display', serif; font-size:1.8rem;">
                <i class="fas fa-spa text-gold"></i> STEVE'S MASSAGE PARLOUR
            </h2>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Finance & Treasury Department • Valley Arcade, Gitanga Road, Nairobi</div>
            <div style="font-size:0.85rem; color:var(--text-muted);">KRA PIN: P051239840Z • Tel: +254 712 345 678 • Email: finance@stevesmassage.co.ke</div>
        </div>
        <div style="text-align:right;">
            <span class="badge badge-success" style="font-size:0.85rem; padding:6px 14px; text-transform:uppercase; letter-spacing:0.5px;">
                <i class="fas fa-check-circle"></i> PAYMENT DISBURSED
            </span>
            <h3 style="color:var(--accent); margin:10px 0 2px; font-size:1.4rem; font-family:monospace;"><?= htmlspecialchars($receiptNo) ?></h3>
            <div style="font-size:0.85rem; color:var(--text-muted);">Payment Date: <strong><?= htmlspecialchars($paymentDate) ?></strong></div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Posting Ref: <strong><?= htmlspecialchars($reference) ?></strong></div>
        </div>
    </div>

    <!-- Beneficiary and Receiving Details -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; background:#FAFBF9; padding:20px; border-radius:8px; border:1px solid #EAECE8;">
        <div>
            <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; display:block; margin-bottom:6px;">
                <i class="fas fa-building text-gold"></i> Payee / Beneficiary:
            </strong>
            <h4 style="margin:0 0 6px; color:var(--primary); font-size:1.15rem;"><?= htmlspecialchars($po['supplier_name']) ?></h4>
            <div style="font-size:0.85rem; color:#444; margin-bottom:3px;">Attn: <?= htmlspecialchars($po['contact_person']) ?></div>
            <div style="font-size:0.85rem; color:#444; margin-bottom:3px;">Phone: <?= htmlspecialchars($po['supplier_phone']) ?></div>
            <div style="font-size:0.85rem; color:#444; margin-bottom:3px;">Email: <?= htmlspecialchars($po['supplier_email']) ?></div>
            <div style="font-size:0.85rem; color:#444;">Physical Address: <?= htmlspecialchars($po['supplier_address']) ?></div>
            <?php if (!empty($po['bank_name'])): ?>
            <div style="margin-top:12px; padding:10px 12px; background:#F0FFF4; border-radius:6px; border-left:3px solid #27AE60;">
                <div style="font-size:0.68rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:5px;"><i class="fas fa-university"></i> Paid to Account</div>
                <div style="font-size:0.85rem; margin-bottom:2px;"><strong><?= htmlspecialchars($po['bank_name']) ?></strong> — Acc: <code style="font-weight:700;"><?= htmlspecialchars($po['bank_account']) ?></code></div>
                <?php if (!empty($po['mpesa_paybill'])): ?>
                <div style="font-size:0.85rem; margin-bottom:2px;">M-Pesa Paybill: <strong style="color:#1a5c38;"><?= htmlspecialchars($po['mpesa_paybill']) ?></strong></div>
                <?php endif; ?>
                <?php if (!empty($po['mpesa_till'])): ?>
                <div style="font-size:0.85rem;">Buy Goods Till: <strong style="color:#1a5c38;"><?= htmlspecialchars($po['mpesa_till']) ?></strong></div>
                <?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
        <div>
            <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; display:block; margin-bottom:6px;">
                <i class="fas fa-file-contract text-gold"></i> Underlying Documentation:
            </strong>
            <div style="font-size:0.88rem; margin-bottom:6px;">
                Purchase Order No: <strong><?= htmlspecialchars($po['po_number']) ?></strong> 
                <span class="text-muted">(Dated <?= $po['order_date'] ?>)</span>
            </div>
            <div style="font-size:0.88rem; margin-bottom:6px;">
                Goods Received Note: 
                <a href="../inventory/grn_receipt.php?po_id=<?= $po['po_id'] ?>" style="color:var(--success); font-weight:700; text-decoration:none;">
                    <?= htmlspecialchars($po['grn_number']) ?>
                </a>
                <span class="text-muted">(Received <?= $po['received_date'] ?>)</span>
            </div>
            <div style="font-size:0.88rem; margin-bottom:6px;">
                Store Verification: <strong><?= htmlspecialchars($po['received_by'] ?? 'Mercy Chebet') ?></strong>
            </div>
            <div style="font-size:0.88rem; margin-bottom:6px;">
                Payment Terms: <strong><?= htmlspecialchars($po['payment_terms']) ?></strong>
            </div>
        </div>
    </div>

    <!-- Payment Instrument Breakdown -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:24px; padding:14px 18px; background:#FFFBF2; border:1px solid #F5CBA7; border-radius:8px;">
        <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Payment Method</div>
            <div style="font-weight:700; color:var(--primary); margin-top:2px; font-size:0.95rem;"><?= htmlspecialchars($method) ?></div>
        </div>
        <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Transaction Reference</div>
            <code style="font-size:0.95rem; font-weight:700; color:#B9770E; margin-top:2px; display:inline-block;"><?= htmlspecialchars($reference) ?></code>
        </div>
        <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Disbursing Officer</div>
            <div style="font-weight:600; color:var(--primary); margin-top:2px; font-size:0.95rem;"><?= htmlspecialchars($paidBy) ?></div>
        </div>
    </div>

    <!-- Items Table -->
    <table class="table" style="margin-bottom:24px; width:100%;">
        <thead>
            <tr style="background:#FAFBF9;">
                <th style="padding:12px; border-bottom:2px solid var(--border);">Item / Consumable Description</th>
                <th style="padding:12px; border-bottom:2px solid var(--border); text-align:center;">Qty Received & Certified</th>
                <th style="padding:12px; border-bottom:2px solid var(--border); text-align:right;">Agreed Unit Cost</th>
                <th style="padding:12px; border-bottom:2px solid var(--border); text-align:right;">Total Disbursed (KES)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding:14px 12px; border-bottom:1px solid #EEE;">
                    <strong><?= htmlspecialchars($po['item_name']) ?></strong>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Stock SKU item confirmed in inventory catalog</div>
                </td>
                <td style="padding:14px 12px; border-bottom:1px solid #EEE; text-align:center;">
                    <span class="badge badge-success"><?= $po['quantity'] ?> units</span>
                </td>
                <td style="padding:14px 12px; border-bottom:1px solid #EEE; text-align:right;">
                    KES <?= number_format($po['unit_price'], 2) ?>
                </td>
                <td style="padding:14px 12px; border-bottom:1px solid #EEE; text-align:right; font-weight:700; color:var(--primary); font-size:1.1rem;">
                    KES <?= number_format($amountPaid, 2) ?>
                </td>
            </tr>
            <tr style="background:#FAFBF9;">
                <td colspan="3" style="padding:14px 12px; text-align:right; font-weight:700; font-size:1.05rem;">
                    Total Net Remittance Paid:
                </td>
                <td style="padding:14px 12px; text-align:right; font-weight:800; font-size:1.35rem; color:var(--primary);">
                    KES <?= number_format($amountPaid, 2) ?>
                </td>
            </tr>
        </tbody>
    </table>

    <?php if ($notes): ?>
        <div style="margin-bottom:24px; padding:12px 16px; background:#F8F9F9; border-radius:6px; font-size:0.85rem;">
            <strong>Remittance Advice / Notes:</strong> <?= htmlspecialchars($notes) ?>
        </div>
    <?php endif; ?>

    <!-- Audit & Compliance Notice -->
    <div style="background:#E8F8F5; border:1px solid #A3E4D7; padding:14px 18px; border-radius:8px; font-size:0.85rem; color:#117A65; margin-bottom:30px;">
        <i class="fas fa-check-double"></i> <strong>Audit Compliance Verified:</strong>
        This payment voucher confirms that the purchased consumables were physically received and booked into the inventory ledger under <?= htmlspecialchars($po['grn_number']) ?> before the disbursement was authorized.
    </div>

    <!-- Signatures -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:35px; padding-top:20px; border-top:1px dashed var(--border);">
        <div>
            <div style="height:45px; border-bottom:1px solid #333; margin-bottom:8px; display:flex; align-items:flex-end;">
                <span style="font-family:'Playfair Display', serif; font-style:italic; font-size:1.1rem; color:var(--primary);"><?= htmlspecialchars($paidBy) ?></span>
            </div>
            <div style="font-size:0.82rem; text-align:center; color:var(--text-muted); font-weight:600;">Authorized by: Finance Officer</div>
            <div style="font-size:0.75rem; text-align:center; color:var(--text-muted);">Date: <?= htmlspecialchars($paymentDate) ?></div>
        </div>
        <div>
            <div style="height:45px; border-bottom:1px solid #333; margin-bottom:8px; display:flex; align-items:flex-end; justify-content:center;">
                <span style="font-family:'Playfair Display', serif; font-style:italic; font-size:1.1rem; color:var(--primary);">Steve Mwangi</span>
            </div>
            <div style="font-size:0.82rem; text-align:center; color:var(--text-muted); font-weight:600;">Managing Director & System Administrator</div>
            <div style="font-size:0.75rem; text-align:center; color:var(--text-muted);">Steve's Massage Parlour - Valley Arcade</div>
        </div>
    </div>
</div>

<style>
@media print {
    .topbar, .portal-header, .alert, footer, .no-print, .nav-links {
        display: none !important;
    }
    body {
        background: #FFF !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    .container {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    .print-area {
        border: none !important;
        box-shadow: none !important;
        padding: 20px !important;
        max-width: 100% !important;
    }
}
</style>

<?php include '../includes/footer.php'; ?>
