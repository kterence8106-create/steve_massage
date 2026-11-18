<?php
/**
 * Steve's Massage Parlour - Process Supplier Payment
 * Finance Module (DBIT 226 Research Project)
 */
require '../config/database.php';
require '../includes/auth.php';
require_role(['finance_officer', 'admin']);

$poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
$stmt = $pdo->prepare("SELECT po.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email, s.address as supplier_address, s.payment_terms,
                               s.bank_name, s.bank_account, s.mpesa_paybill, s.mpesa_till
                       FROM purchase_orders po 
                       JOIN suppliers s ON po.supplier_id = s.supplier_id 
                       WHERE po.po_id = ?");
$stmt->execute([$poId]);
$po = $stmt->fetch();

if (!$po) {
    header("Location: supplier_payments.php");
    exit;
}

// Enforce rule: Payment ONLY after receiving goods!
if ($po['order_status'] !== 'received') {
    die("<div style='font-family:sans-serif; max-width:650px; margin:50px auto; padding:25px; border:2px solid #E74C3C; border-radius:10px; background:#FDF2E9;'>
        <h2 style='color:#C0392B; margin-top:0;'><i class='fas fa-exclamation-triangle'></i> Goods Not Yet Received</h2>
        <p><strong>PO Number:</strong> " . htmlspecialchars($po['po_number']) . "</p>
        <p>Payment to the supplier can only be processed <strong>after</strong> the Inventory Manager has confirmed physical delivery and issued a <strong>Goods Received Note (GRN)</strong>.</p>
        <p>Current Order Status: <span style='background:#E67E22; color:#fff; padding:4px 8px; border-radius:4px; font-weight:bold;'>" . strtoupper($po['order_status']) . "</span></p>
        <hr style='border:none; border-top:1px solid #E0B4B4; margin:15px 0;'>
        <a href='po_approvals.php' style='display:inline-block; padding:10px 18px; background:#1C2E26; color:#fff; text-decoration:none; border-radius:6px;'>Return to PO Approvals</a>
    </div>");
}

// If already paid, redirect to receipt
if (($po['payment_status'] ?? 'unpaid') === 'paid') {
    header("Location: payment_receipt.php?po_id=" . $poId);
    exit;
}

$error = "";
$defaultRef = "MPESA-" . strtoupper(substr(md5(uniqid((string)rand(), true)), 0, 10));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $paymentMethod = trim($_POST['payment_method'] ?? 'M-Pesa Business Till');
    $referenceNo   = trim($_POST['reference_no'] ?? $defaultRef);
    $amountPaid    = (float)($_POST['amount_paid'] ?? $po['total_cost']);
    $paymentDate   = trim($_POST['payment_date'] ?? date('Y-m-d'));
    $notes         = trim($_POST['notes'] ?? '');
    $paidBy        = $_SESSION['full_name'] . " (Finance Officer)";

    if ($amountPaid <= 0) {
        $error = "Amount paid must be greater than zero.";
    } elseif (empty($referenceNo)) {
        $error = "Please provide an official transaction reference or cheque number.";
    } else {
        try {
            $pdo->beginTransaction();

            $receiptNo = "SPR-" . date('Y') . "-" . rand(1000, 9999);

            // 1. Update Purchase Order
            $uPO = $pdo->prepare("UPDATE purchase_orders SET 
                                  payment_status = 'paid', 
                                  payment_receipt_no = ?, 
                                  payment_date = ?, 
                                  payment_method = ?, 
                                  payment_reference = ?, 
                                  paid_by = ?, 
                                  payment_notes = ? 
                                  WHERE po_id = ?");
            $uPO->execute([$receiptNo, $paymentDate, $paymentMethod, $referenceNo, $paidBy, $notes, $poId]);

            // 2. Insert record in supplier_payments audit table
            $spStmt = $pdo->prepare("INSERT INTO supplier_payments 
                                     (payment_receipt_no, po_id, supplier_id, amount_paid, payment_method, reference_no, payment_date, paid_by, notes) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $spStmt->execute([$receiptNo, $poId, $po['supplier_id'], $amountPaid, $paymentMethod, $referenceNo, $paymentDate, $paidBy, $notes]);

            // 3. Record in General Finance Ledger as Disbursement
            $fStmt = $pdo->prepare("INSERT INTO finance_transactions 
                                    (type, category, description, amount, transaction_date, reference_no, po_id) 
                                    VALUES ('expense', 'Supplier Disbursement', ?, ?, ?, ?, ?)");
            $fStmt->execute([
                "Disbursement: {$po['supplier_name']} for PO {$po['po_number']} (GRN: {$po['grn_number']}) via {$paymentMethod}", 
                $amountPaid, 
                $paymentDate, 
                $receiptNo, 
                $poId
            ]);

            // 4. Send Notification to the Supplier
            $supUser = $pdo->prepare("SELECT user_id FROM users WHERE supplier_id = ? AND role = 'supplier' LIMIT 1");
            $supUser->execute([$po['supplier_id']]);
            $suId = $supUser->fetchColumn();
            if ($suId) {
                $nStmt = $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'supplier', 'Payment Remittance Received', ?)");
                $nStmt->execute([
                    $suId, 
                    "Steve's Massage Parlour has disbursed payment of KES " . number_format($amountPaid, 2) . " for PO {$po['po_number']}. Receipt: {$receiptNo}. Ref: {$referenceNo}."
                ]);
            }

            $pdo->commit();
            header("Location: payment_receipt.php?po_id=" . $poId . "&paid=1");
            exit;

        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $error = "Payment execution failed: " . $e->getMessage();
        }
    }
}

$page_title = "Disburse Supplier Payment - " . $po['po_number'];
include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-hand-holding-usd text-gold"></i> Authorize & Disburse Supplier Payment</h2>
        <p class="text-muted">Execute vendor remittance for physically verified stock shipment.</p>
    </div>
    <div class="portal-actions">
        <a href="supplier_payments.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to Supplier Payments</a>
    </div>
</div>

<?php if ($error): ?>
    <div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<div style="display:grid; grid-template-columns:1fr 1.2fr; gap:24px; align-items:flex-start;">
    
    <!-- LEFT: Order & Verification Details -->
    <div>
        <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
                <h3><i class="fas fa-receipt text-gold"></i> Shipment & GRN Verification</h3>
            </div>
            <div style="padding:10px 0;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #EEE; padding-bottom:6px;">
                    <span class="text-muted">PO Number:</span>
                    <strong><?= htmlspecialchars($po['po_number']) ?></strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #EEE; padding-bottom:6px;">
                    <span class="text-muted">Order Date:</span>
                    <span><?= $po['order_date'] ?></span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #EEE; padding-bottom:6px;">
                    <span class="text-muted">Goods Received Note:</span>
                    <strong style="color:var(--success);"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($po['grn_number']) ?></strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #EEE; padding-bottom:6px;">
                    <span class="text-muted">Date Received:</span>
                    <span><?= $po['received_date'] ?></span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #EEE; padding-bottom:6px;">
                    <span class="text-muted">Received By:</span>
                    <span><?= htmlspecialchars($po['received_by'] ?? 'Mercy Chebet') ?></span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #EEE; padding-bottom:6px;">
                    <span class="text-muted">Delivery Option:</span>
                    <span><?= htmlspecialchars($po['delivery_option']) ?></span>
                </div>
                <div style="margin-top:12px; background:#E8F8F5; border:1px solid #A3E4D7; border-radius:6px; padding:10px 14px; font-size:0.85rem; color:#117A65;">
                    <i class="fas fa-check-double"></i> <strong>Physical Delivery Verified:</strong>
                    Inventory confirmed all <?= $po['quantity'] ?> units received in pristine condition.
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-building text-gold"></i> Beneficiary / Vendor Information</h3>
            </div>
            <div style="padding:10px 0;">
                <h4 style="margin:0 0 6px; color:var(--primary);"><?= htmlspecialchars($po['supplier_name']) ?></h4>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">
                    <i class="fas fa-user"></i> Contact: <?= htmlspecialchars($po['contact_person']) ?>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">
                    <i class="fas fa-phone"></i> Tel: <?= htmlspecialchars($po['supplier_phone']) ?>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">
                    <i class="fas fa-envelope"></i> Email: <?= htmlspecialchars($po['supplier_email']) ?>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">
                    <i class="fas fa-map-marker-alt"></i> Address: <?= htmlspecialchars($po['supplier_address']) ?>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted);">
                    <i class="fas fa-calendar-alt"></i> Standard Terms: <strong><?= htmlspecialchars($po['payment_terms']) ?></strong>
                </div>

                <?php if (!empty($po['bank_name'])): ?>
                <hr style="border:none; border-top:1px solid #DDD; margin:12px 0;">
                <div style="background:#F0FFF4; border:1px solid #A9DFBF; border-radius:7px; padding:12px 14px;">
                    <div style="font-size:0.72rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:6px;">
                        <i class="fas fa-university"></i> Supplier Receiving Account — Remit Payment Here
                    </div>
                    <div style="font-size:0.88rem; margin-bottom:3px;"><strong>Bank:</strong> <?= htmlspecialchars($po['bank_name']) ?></div>
                    <div style="font-size:0.88rem; margin-bottom:3px;"><strong>Account No:</strong> <code style="font-weight:700; font-size:0.95rem;"><?= htmlspecialchars($po['bank_account']) ?></code></div>
                    <?php if (!empty($po['mpesa_paybill'])): ?>
                    <div style="font-size:0.88rem; margin-bottom:3px;"><strong>M-Pesa Paybill:</strong> <code style="color:#1a5c38; font-weight:800; font-size:1rem;"><?= htmlspecialchars($po['mpesa_paybill']) ?></code></div>
                    <?php endif; ?>
                    <?php if (!empty($po['mpesa_till'])): ?>
                    <div style="font-size:0.88rem;"><strong>Buy Goods Till No:</strong> <code style="color:#1a5c38; font-weight:800; font-size:1rem;"><?= htmlspecialchars($po['mpesa_till']) ?></code></div>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- RIGHT: Payment Authorization Form -->
    <div class="card" style="box-shadow:0 8px 24px rgba(0,0,0,0.08);">
        <div class="card-header" style="background:#FAFBF9; border-bottom:2px solid var(--border); padding:16px 20px;">
            <h3 style="margin:0; color:var(--primary);"><i class="fas fa-credit-card text-gold"></i> Payment Voucher Details</h3>
            <span class="badge badge-warning">Awaiting Finance Sign-Off</span>
        </div>

        <form method="POST" style="padding:20px;">
            <div style="background:#FFFBF2; border:1px solid #F5CBA7; border-radius:8px; padding:16px; margin-bottom:20px;">
                <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Supplied Item Description</div>
                <h4 style="margin:4px 0 10px; color:var(--primary);"><?= htmlspecialchars($po['item_name']) ?></h4>
                <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                    <span>Quantity: <strong><?= $po['quantity'] ?> units</strong></span>
                    <span>Agreed Unit Price: <strong>KES <?= number_format($po['unit_price'], 2) ?></strong></span>
                </div>
                <hr style="border:none; border-top:1px solid #E5C39E; margin:12px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; font-size:1.05rem;">Total Net Payable:</span>
                    <strong style="color:var(--primary); font-size:1.45rem;">KES <?= number_format($po['total_cost'], 2) ?></strong>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label for="payment_method" style="display:block; font-weight:600; margin-bottom:6px;">Payment Method <span style="color:red;">*</span></label>
                <select name="payment_method" id="payment_method" class="form-control" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:0.95rem;">
                    <option value="M-Pesa Business Till">Safaricom M-Pesa Business Till / Buy Goods (Instant B2B)</option>
                    <option value="Bank Wire Transfer (EFT/RTGS)">Bank Wire Transfer / EFT / RTGS (Corporate Account)</option>
                    <option value="Cheque / Banker's Draft">Corporate Cheque / Banker's Draft</option>
                    <option value="Corporate Debit/Credit Card">Corporate Visa / Mastercard</option>
                    <option value="Petty Cash Voucher">Authorized Petty Cash Voucher</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label for="reference_no" style="display:block; font-weight:600; margin-bottom:6px;">Transaction / Cheque / M-Pesa Reference <span style="color:red;">*</span></label>
                <input type="text" name="reference_no" id="reference_no" class="form-control" value="<?= htmlspecialchars($defaultRef) ?>" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:0.95rem; font-family:monospace; font-weight:700;">
                <small class="text-muted">Unique payment tracking reference or cheque leaf number.</small>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                <div class="form-group">
                    <label for="amount_paid" style="display:block; font-weight:600; margin-bottom:6px;">Disbursed Amount (KES) <span style="color:red;">*</span></label>
                    <input type="number" step="0.01" name="amount_paid" id="amount_paid" class="form-control" value="<?= $po['total_cost'] ?>" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:1.1rem; font-weight:700; color:var(--primary);">
                </div>
                <div class="form-group">
                    <label for="payment_date" style="display:block; font-weight:600; margin-bottom:6px;">Payment Date <span style="color:red;">*</span></label>
                    <input type="date" name="payment_date" id="payment_date" class="form-control" value="<?= date('Y-m-d') ?>" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:0.95rem;">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label for="notes" style="display:block; font-weight:600; margin-bottom:6px;">Remittance Notes / Remarks (Optional)</label>
                <textarea name="notes" id="notes" class="form-control" rows="2" placeholder="e.g. Full invoice settlement per agreed 30-day payment terms" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;"></textarea>
            </div>

            <div style="background:#FAFBF9; border:1px solid var(--border); border-radius:6px; padding:12px 16px; margin-bottom:20px; font-size:0.85rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Disbursing Officer:</span>
                    <strong><?= htmlspecialchars($_SESSION['full_name']) ?> (<?= strtoupper($_SESSION['role']) ?>)</strong>
                </div>
            </div>

            <button type="submit" class="btn btn-gold" style="width:100%; padding:14px; font-size:1.05rem; font-weight:700; display:flex; justify-content:center; align-items:center; gap:8px;">
                <i class="fas fa-check-circle"></i> Confirm & Authorize Supplier Disbursement
            </button>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
