<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['finance_officer', 'admin']);

$page_title = "Financial Transactions Ledger - Steve's Massage Parlour";

$stmt = $pdo->query("SELECT * FROM finance_transactions ORDER BY transaction_date DESC, transaction_id DESC");
$transactions = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-receipt text-gold"></i> General Financial Ledger</h2>
        <p class="text-muted">Synchronized audit trail of customer service revenues and purchase order disbursements.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
        <a href="javascript:window.print()" class="btn btn-gold"><i class="fas fa-print"></i> Print Statement</a>
    </div>
</div>

<!-- Business Payment Receiving Information Banner -->
<div style="background:linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%); color:#fff; border-radius:10px; padding:18px 24px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:center;">
    <div>
        <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:4px;"><i class="fas fa-university"></i> Business Receiving Account (Customer Settlements)</div>
        <div style="font-size:1.1rem; font-weight:700;">Steve's Massage Parlour Ltd</div>
        <div style="font-size:0.85rem; opacity:0.9; margin-top:3px;">Equity Bank Kenya — Valley Arcade Branch, Nairobi</div>
        <div style="font-size:0.85rem; opacity:0.9;">Account No: <strong style="font-family:monospace; font-size:1rem; letter-spacing:1px;">0023456789</strong></div>
    </div>
    <div style="border-left:1px solid rgba(255,255,255,0.3); padding-left:20px;">
        <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:4px;"><i class="fas fa-mobile-alt"></i> Official M-Pesa Channels</div>
        <div style="font-size:0.88rem; opacity:0.95; margin-bottom:2px;"><span style="opacity:0.75;">Paybill No:</span> <span style="font-family:monospace; font-size:1.25rem; font-weight:900; color:#A8EDBB;">400200</span></div>
        <div style="font-size:0.85rem; opacity:0.9;"><span style="opacity:0.75;">Account No:</span> <span style="font-family:monospace; font-weight:700;">Customer Booking Reference</span></div>
        <div style="font-size:0.82rem; opacity:0.75; margin-top:3px;">Buy Goods / Merchant Till: <strong style="font-family:monospace; color:#A8EDBB;">5278441</strong></div>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Transaction Ref</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Related PO</th>
                    <th>Amount (KES)</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($transactions)): ?>
                    <tr><td colspan="7" style="text-align:center; padding:30px;" class="text-muted">No transactions recorded.</td></tr>
                <?php else: foreach ($transactions as $t): ?>
                    <tr>
                        <td><code><?= htmlspecialchars($t['reference_no'] ?? 'TXN-' . $t['transaction_id']) ?></code></td>
                        <td><?= $t['transaction_date'] ?></td>
                        <td>
                            <span class="badge badge-<?= $t['type'] === 'income' ? 'success' : 'danger' ?>">
                                <?= strtoupper($t['type']) ?>
                            </span>
                        </td>
                        <td><strong><?= htmlspecialchars($t['category']) ?></strong></td>
                        <td><?= htmlspecialchars($t['description']) ?></td>
                        <td>
                            <?php if ($t['po_id']): ?>
                                <a href="../inventory/grn_receipt.php?po_id=<?= $t['po_id'] ?>" class="btn btn-sm btn-outline"><i class="fas fa-receipt"></i> PO #<?= $t['po_id'] ?></a>
                            <?php else: ?>
                                <span class="text-muted">—</span>
                            <?php endif; ?>
                        </td>
                        <td><strong style="color:<?= $t['type'] === 'income' ? '#27AE60' : '#C0392B' ?>; font-size:1.05rem;">KES <?= number_format($t['amount'], 2) ?></strong></td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
