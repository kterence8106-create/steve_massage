<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['inventory_manager', 'admin']);

$page_title = "Shortage Requisition - Steve's Massage Parlour";
$error = "";

$itemId = isset($_GET['item_id']) ? (int)$_GET['item_id'] : 0;
$item = $pdo->prepare("SELECT i.*, s.supplier_name, s.supplier_id as preferred_sup_id FROM inventory i LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id WHERE i.inventory_id = ?");
$item->execute([$itemId]);
$itemRow = $item->fetch();

if (!$itemRow) {
    header("Location: inventory.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $supplierId     = (int)($_POST['supplier_id'] ?? 0);
    $qty            = max(1, (int)($_POST['quantity'] ?? 0));
    $deliveryOption = trim($_POST['delivery_option'] ?? 'Expedited Van (Same-Day Urgent Delivery)');
    $notes          = trim($_POST['notes'] ?? '');

    if (!$supplierId || $qty <= 0) {
        $error = "Please choose a vendor and specify a valid quantity.";
    } else {
        $unitPrice = (float)$itemRow['unit_price'];
        $totalCost = $qty * $unitPrice;
        $poNumber  = "PO-" . date('Y') . "-" . rand(1000, 9999);
        $orderDate = date('Y-m-d');

        $stmt = $pdo->prepare("INSERT INTO purchase_orders (po_number, supplier_id, inventory_id, item_name, quantity, unit_price, total_cost, order_date, delivery_option, delivery_address, finance_status, order_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Steve''s Massage Parlour, Valley Arcade, Nairobi', 'pending', 'pending_approval', ?)");
        $stmt->execute([$poNumber, $supplierId, $itemId, $itemRow['item_name'], $qty, $unitPrice, $totalCost, $orderDate, $deliveryOption, "URGENT SHORTAGE REQUISITION: " . $notes]);

        // Route notification to Finance
        try {
            $pdo->prepare("INSERT INTO notifications (role_target, title, message) VALUES ('finance_officer', 'Urgent Shortage Requisition', ?)")
                ->execute(["Stock shortage for {$itemRow['item_name']} (Current Stock: {$itemRow['quantity']}). Restock PO $poNumber (KES " . number_format($totalCost, 2) . ") requires approval."]);
            
            // Route notification to Supplier
            $supUser = $pdo->prepare("SELECT user_id FROM users WHERE supplier_id = ? AND role = 'supplier' LIMIT 1");
            $supUser->execute([$supplierId]);
            $suId = $supUser->fetchColumn();
            if ($suId) {
                $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'supplier', 'New Shortage Requisition Received', ?)")
                    ->execute([$suId, "Steve's Massage Parlour issued urgent PO $poNumber for {$itemRow['item_name']} (Qty: $qty). Awaiting finance sign-off."]);
            }
        } catch (Exception $e) {}

        header("Location: purchase_orders.php?shortage_sent=" . urlencode($poNumber));
        exit;
    }
}

$suppliers = $pdo->query("SELECT * FROM suppliers ORDER BY supplier_name ASC")->fetchAll();
$suggestedQty = max(5, ($itemRow['min_threshold'] * 2) - $itemRow['quantity']);

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-exclamation-triangle text-danger"></i> Dispatch Shortage Restock Requisition</h2>
        <p class="text-muted">Transmit an urgent restock request simultaneously to the Finance and Supplier modules.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
    </div>
</div>

<?php if ($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div><?php endif; ?>

<div class="card" style="max-width:750px; margin:0 auto;">
    <div class="card-header" style="background:#FFF3CD; border-bottom:1px solid #FFEAA7;">
        <h3 style="color:#856404; margin:0;"><i class="fas fa-bell"></i> Stock Depletion Notice</h3>
    </div>
    <div style="padding:20px; background:#FFFBF0; border-bottom:1px solid #FFEAA7;">
        <h4><?= htmlspecialchars($itemRow['item_name']) ?> (<?= htmlspecialchars($itemRow['sku'] ?? 'SKU') ?>)</h4>
        <div style="font-size:0.9rem; color:#856404; display:flex; gap:20px; flex-wrap:wrap; margin-top:8px;">
            <span>Current Stock: <strong><?= $itemRow['quantity'] ?> <?= htmlspecialchars($itemRow['unit']) ?></strong></span>
            <span>Safety Threshold: <strong><?= $itemRow['min_threshold'] ?> <?= htmlspecialchars($itemRow['unit']) ?></strong></span>
            <span>Unit Price: <strong>KES <?= number_format($itemRow['unit_price'], 2) ?></strong></span>
        </div>
    </div>
    <form method="post" style="padding:24px;">
        <div class="form-group">
            <label>Designated Vendor / Supplier *</label>
            <select name="supplier_id" required>
                <?php foreach ($suppliers as $s): ?>
                    <option value="<?= $s['supplier_id'] ?>" <?= $s['supplier_id'] == $itemRow['preferred_sup_id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($s['supplier_name']) ?> — <?= htmlspecialchars($s['contact_person']) ?> (<?= htmlspecialchars($s['phone']) ?>)
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Requisition Quantity (<?= htmlspecialchars($itemRow['unit']) ?>) *</label>
                <input type="number" name="quantity" value="<?= $suggestedQty ?>" min="1" required>
            </div>
            <div class="form-group">
                <label>Delivery Option *</label>
                <select name="delivery_option" required>
                    <option value="Expedited Van (Same-Day Urgent Delivery)">Expedited Van (Same-Day Urgent Delivery)</option>
                    <option value="Standard Courier (Nairobi Express Delivery - 24 to 48 Hours)">Standard Courier (Nairobi Express Delivery)</option>
                    <option value="Direct Dispatch (Supplier Fleet Vehicle)">Direct Dispatch (Supplier Fleet Vehicle)</option>
                    <option value="Parlour Pickup (Self-Collect at Depot)">Parlour Pickup (Self-Collect at Depot)</option>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label>Shortage Justification Notes</label>
            <textarea name="notes" rows="3" placeholder="e.g. Critical depletion due to high weekend client demand. Expedited restock urgently required."></textarea>
        </div>

        <button type="submit" class="btn btn-danger" style="padding:12px 24px; font-size:1rem;">
            <i class="fas fa-paper-plane"></i> Dispatch Requisition to Finance & Supplier
        </button>
    </form>
</div>

<?php include '../includes/footer.php'; ?>
