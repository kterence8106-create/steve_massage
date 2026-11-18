<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['finance_officer', 'admin']);

$poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
$stmt = $pdo->prepare("SELECT po.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email, s.payment_terms FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.po_id = ?");
$stmt->execute([$poId]);
$po = $stmt->fetch();

if (!$po) {
    header("Location: po_approvals.php");
    exit;
}

$error = "";

// Process Decision
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $decision = $_POST['decision'] ?? '';
    $feedback = trim($_POST['feedback'] ?? '');

    if (!in_array($decision, ['approved', 'rejected'], true)) {
        $error = "Please specify a valid decision (Approve or Reject).";
    } elseif ($decision === 'rejected' && empty($feedback)) {
        $error = "Please provide feedback explaining the reason for rejection.";
    } else {
        $now = date('Y-m-d H:i:s');
        $orderStatus = $decision === 'approved' ? 'approved' : 'rejected';

        $uStmt = $pdo->prepare("UPDATE purchase_orders SET finance_status = ?, finance_feedback = ?, finance_reviewed_at = ?, order_status = ? WHERE po_id = ?");
        $uStmt->execute([$decision, $feedback, $now, $orderStatus, $poId]);

        // Notifications
        try {
            // Notify Inventory Manager
            $pdo->prepare("INSERT INTO notifications (role_target, title, message) VALUES ('inventory_manager', ?, ?)")
                ->execute(["PO {$po['po_number']} " . ucfirst($decision), "Finance Director $decision PO {$po['po_number']} for {$po['item_name']}. Feedback: $feedback"]);

            // If approved, notify Supplier
            if ($decision === 'approved') {
                $supUser = $pdo->prepare("SELECT user_id FROM users WHERE supplier_id = ? AND role = 'supplier' LIMIT 1");
                $supUser->execute([$po['supplier_id']]);
                $suId = $supUser->fetchColumn();
                if ($suId) {
                    $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'supplier', 'PO Approved for Dispatch', ?)")
                        ->execute([$suId, "PO {$po['po_number']} for {$po['item_name']} (KES " . number_format($po['total_cost'], 2) . ") was approved by Finance. Please acknowledge and dispatch."]);
                }
            }
        } catch (Exception $e) {}

        header("Location: po_approvals.php?reviewed=1");
        exit;
    }
}

$page_title = "Review PO " . $po['po_number'];
include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-clipboard-check text-gold"></i> Review Purchase Order <?= htmlspecialchars($po['po_number']) ?></h2>
        <p class="text-muted">Perform financial review, verify budget allocations, and authorize vendor disbursement.</p>
    </div>
    <div class="portal-actions">
        <a href="po_approvals.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to Approvals</a>
    </div>
</div>

<?php if ($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div><?php endif; ?>

<div class="card" style="max-width:850px; margin:0 auto; padding:30px;">
    <div style="background:#FAFBF9; border:1px solid var(--border); border-radius:10px; padding:20px; margin-bottom:20px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div>
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Purchase Order Number</div>
                <h3 style="margin:2px 0 10px; color:var(--primary);"><?= htmlspecialchars($po['po_number']) ?></h3>
                <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Order Date:</strong> <?= $po['order_date'] ?></div>
                <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Requested By:</strong> Inventory Controller (Mercy Chebet)</div>
                <div style="font-size:0.85rem;"><strong>Current Status:</strong> <span class="badge badge-warning"><?= strtoupper($po['finance_status']) ?></span></div>
            </div>
            <div>
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Supplier / Vendor Information</div>
                <h4 style="margin:2px 0 6px; color:var(--text-dark);"><?= htmlspecialchars($po['supplier_name']) ?></h4>
                <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Contact Person:</strong> <?= htmlspecialchars($po['contact_person']) ?></div>
                <div style="font-size:0.85rem; margin-bottom:4px;"><strong>Phone:</strong> <?= htmlspecialchars($po['supplier_phone']) ?></div>
                <div style="font-size:0.85rem;"><strong>Payment Terms:</strong> <?= htmlspecialchars($po['payment_terms']) ?></div>
            </div>
        </div>
    </div>

    <table class="table" style="margin-bottom:24px;">
        <thead>
            <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit Cost (KES)</th>
                <th>Total Value (KES)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong><?= htmlspecialchars($po['item_name']) ?></strong></td>
                <td><strong><?= $po['quantity'] ?> units</strong></td>
                <td>KES <?= number_format($po['unit_price'], 2) ?></td>
                <td><strong style="color:var(--primary); font-size:1.15rem;">KES <?= number_format($po['total_cost'], 2) ?></strong></td>
            </tr>
        </tbody>
    </table>

    <div style="background:#FAFBF9; padding:12px; border-radius:6px; font-size:0.85rem; margin-bottom:24px;">
        <strong>Delivery Terms & Method:</strong> <?= htmlspecialchars($po['delivery_option']) ?>
        <?php if ($po['notes']): ?>
            <div style="margin-top:6px;"><strong>Requisition Notes:</strong> <?= htmlspecialchars($po['notes']) ?></div>
        <?php endif; ?>
    </div>

    <!-- Review Form -->
    <form method="post" style="background:#F9FBF9; border:1px solid #D5E5DA; padding:20px; border-radius:8px;">
        <h4 style="margin:0 0 12px; color:var(--primary);"><i class="fas fa-stamp"></i> Financial Authorization Decision</h4>
        
        <div class="form-group">
            <label>Review Feedback / Budget Allocation Notes *</label>
            <textarea name="feedback" rows="3" required placeholder="e.g. Budget authorized from November Spa Consumables allocation. Order approved for vendor fulfillment."></textarea>
            <small class="text-muted">Mandatory feedback explaining your approval or rejection reason.</small>
        </div>

        <div style="display:flex; gap:12px;">
            <button type="submit" name="decision" value="approved" class="btn btn-gold" style="padding:12px 24px;">
                <i class="fas fa-check-circle"></i> Authorize & Approve Purchase Order
            </button>
            <button type="submit" name="decision" value="rejected" class="btn btn-danger" style="padding:12px 24px;" onclick="return confirm('Are you sure you want to REJECT this purchase order?');">
                <i class="fas fa-times-circle"></i> Reject Requisition
            </button>
        </div>
    </form>
</div>

<?php include '../includes/footer.php'; ?>
