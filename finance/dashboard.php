<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['finance_officer', 'admin']);

$page_title = "Finance Executive Suite - Steve's Massage Parlour";

// Financial Telemetry
$totalIncome = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM finance_transactions WHERE type = 'income'")->fetchColumn();
$totalExpense = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM finance_transactions WHERE type = 'expense'")->fetchColumn();
$netProfit = $totalIncome - $totalExpense;

$pendingApprovals = $pdo->query("SELECT COUNT(*) FROM purchase_orders WHERE finance_status = 'pending'")->fetchColumn();
$pendingPayments  = $pdo->query("SELECT COUNT(*) FROM purchase_orders WHERE order_status = 'received' AND (payment_status IS NULL OR payment_status = 'unpaid')")->fetchColumn();

// Pending POs awaiting finance decision
$pendingPOs = $pdo->query("SELECT po.*, s.supplier_name, s.phone as supplier_phone FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.finance_status = 'pending' ORDER BY po.po_id DESC")->fetchAll();

// Received orders awaiting supplier payment
$unpaidReceivedPOs = $pdo->query("SELECT po.*, s.supplier_name, s.phone as supplier_phone FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.order_status = 'received' AND (po.payment_status IS NULL OR po.payment_status = 'unpaid') ORDER BY po.po_id DESC")->fetchAll();

// Recent transactions
$transactions = $pdo->query("SELECT * FROM finance_transactions ORDER BY transaction_id DESC LIMIT 6")->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-wallet text-gold"></i> Financial Management & Accounts Suite</h2>
        <p class="text-muted">Welcome, <?= htmlspecialchars($_SESSION['full_name']) ?> • Certified Finance Officer (DBIT 226)</p>
    </div>
    <div class="portal-actions">
        <a href="po_approvals.php" class="btn btn-outline"><i class="fas fa-clipboard-check"></i> PO Approvals (<?= $pendingApprovals ?>)</a>
        <a href="supplier_payments.php" class="btn <?= $pendingPayments > 0 ? 'btn-gold' : 'btn-outline' ?>"><i class="fas fa-money-check-alt"></i> Pay Suppliers (<?= $pendingPayments ?>)</a>
        <a href="transactions.php" class="btn btn-outline"><i class="fas fa-receipt"></i> General Ledger</a>
    </div>
</div>

<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-icon success"><i class="fas fa-arrow-down"></i></div>
        <div class="kpi-info">
            <h4>Total Service Revenue</h4>
            <h2 style="color:#27AE60;">KES <?= number_format($totalIncome, 2) ?></h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon danger"><i class="fas fa-arrow-up"></i></div>
        <div class="kpi-info">
            <h4>Total PO Disbursements</h4>
            <h2 style="color:#C0392B;">KES <?= number_format($totalExpense, 2) ?></h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon gold"><i class="fas fa-balance-scale"></i></div>
        <div class="kpi-info">
            <h4>Net Operating Profit</h4>
            <h2>KES <?= number_format($netProfit, 2) ?></h2>
        </div>
    </div>
    <div class="kpi-card <?= $pendingApprovals > 0 ? 'kpi-card-danger' : '' ?>">
        <div class="kpi-icon <?= $pendingApprovals > 0 ? 'danger' : 'primary' ?>"><i class="fas fa-clock"></i></div>
        <div class="kpi-info">
            <h4>Pending Authorizations</h4>
            <h2 style="color:<?= $pendingApprovals > 0 ? '#C0392B' : '#1C2E26' ?>;"><?= $pendingApprovals ?> Orders</h2>
        </div>
    </div>
</div>

<?php if ($pendingApprovals > 0): ?>
    <div class="card" style="margin-bottom:24px; border-left:4px solid #E67E22;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="color:#D35400; margin:0;"><i class="fas fa-exclamation-triangle"></i> Requisitions Requiring Financial Sign-Off</h3>
            <span class="badge badge-warning"><?= $pendingApprovals ?> Pending</span>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>PO Number</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th>Total (KES)</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($pendingPOs as $po): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($po['po_number']) ?></strong></td>
                        <td><?= $po['order_date'] ?></td>
                        <td><?= htmlspecialchars($po['supplier_name']) ?></td>
                        <td><?= htmlspecialchars($po['item_name']) ?></td>
                        <td><?= $po['quantity'] ?></td>
                        <td><strong style="color:var(--primary); font-size:1.05rem;">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
                        <td>
                            <a href="review_po.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold">
                                <i class="fas fa-clipboard-check"></i> Review & Decide
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
<?php endif; ?>

<?php if ($pendingPayments > 0): ?>
    <div class="card" style="margin-bottom:24px; border-left:4px solid #27AE60;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="color:#27AE60; margin:0;"><i class="fas fa-hand-holding-usd"></i> Goods Received Awaiting Supplier Payment (GRN Verified)</h3>
            <a href="supplier_payments.php" class="btn btn-sm btn-gold">View Payment Schedule</a>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>PO Number</th>
                        <th>Supplier</th>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th>Total Cost</th>
                        <th>GRN Reference</th>
                        <th>Date Received</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($unpaidReceivedPOs as $po): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($po['po_number']) ?></strong></td>
                        <td><?= htmlspecialchars($po['supplier_name']) ?></td>
                        <td><?= htmlspecialchars($po['item_name']) ?></td>
                        <td><?= $po['quantity'] ?></td>
                        <td><strong style="color:var(--primary);">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
                        <td>
                            <a href="../inventory/grn_receipt.php?po_id=<?= $po['po_id'] ?>" class="badge badge-success" style="text-decoration:none;">
                                <i class="fas fa-receipt"></i> <?= htmlspecialchars($po['grn_number']) ?>
                            </a>
                        </td>
                        <td><?= $po['received_date'] ?></td>
                        <td>
                            <a href="pay_supplier.php?po_id=<?= $po['po_id'] ?>" class="btn btn-sm btn-gold">
                                <i class="fas fa-money-check-alt"></i> Pay Supplier
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
<?php endif; ?>

<div class="card">
    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3><i class="fas fa-receipt text-gold"></i> Recent Transactions Ledger</h3>
        <a href="transactions.php" class="btn btn-sm btn-outline">View All Transactions</a>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Amount (KES)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($transactions as $t): ?>
                <tr>
                    <td><?= $t['transaction_date'] ?></td>
                    <td><span class="badge badge-<?= $t['type'] === 'income' ? 'success' : 'danger' ?>"><?= strtoupper($t['type']) ?></span></td>
                    <td><?= htmlspecialchars($t['category']) ?></td>
                    <td><?= htmlspecialchars($t['description']) ?></td>
                    <td><code><?= htmlspecialchars($t['reference_no'] ?? '-') ?></code></td>
                    <td><strong style="color:<?= $t['type'] === 'income' ? '#27AE60' : '#C0392B' ?>;">KES <?= number_format($t['amount'], 2) ?></strong></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
