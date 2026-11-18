<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['inventory_manager', 'admin']);

$poId = isset($_GET['po_id']) ? (int)$_GET['po_id'] : 0;
$stmt = $pdo->prepare("SELECT po.*, s.supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.po_id = ?");
$stmt->execute([$poId]);
$po = $stmt->fetch();

if (!$po) {
    header("Location: purchase_orders.php");
    exit;
}

if ($po['order_status'] === 'received') {
    header("Location: grn_receipt.php?po_id=" . $poId);
    exit;
}

if ($po['finance_status'] !== 'approved') {
    die("This purchase order cannot be received until it is approved by the Finance Module.");
}

// Perform synchronized receipt transaction
try {
    $pdo->beginTransaction();

    $grnNumber = "GRN-" . date('Y') . "-" . rand(1000, 9999);
    $receiveDate = date('Y-m-d');
    $receivedBy = $_SESSION['full_name'] . " (Inventory Manager)";

    // 1. Update Purchase Order status
    $uPO = $pdo->prepare("UPDATE purchase_orders SET order_status = 'received', grn_number = ?, received_date = ?, received_by = ? WHERE po_id = ?");
    $uPO->execute([$grnNumber, $receiveDate, $receivedBy, $poId]);

    // 2. Automatically update inventory records (add received quantities to existing stock)
    $invId = $po['inventory_id'];
    if ($invId) {
        $curr = $pdo->prepare("SELECT quantity, min_threshold FROM inventory WHERE inventory_id = ?");
        $curr->execute([$invId]);
        $invRow = $curr->fetch();
        if ($invRow) {
            $prevQty = (int)$invRow['quantity'];
            $newQty  = $prevQty + (int)$po['quantity'];
            $newStatus = $newQty <= 0 ? 'out_of_stock' : ($newQty <= (int)$invRow['min_threshold'] ? 'low_stock' : 'in_stock');

            $uInv = $pdo->prepare("UPDATE inventory SET quantity = ?, status = ? WHERE inventory_id = ?");
            $uInv->execute([$newQty, $newStatus, $invId]);

            // 3. Log stock movement transaction
            $mStmt = $pdo->prepare("INSERT INTO inventory_transactions (inventory_id, user_id, transaction_type, quantity, previous_quantity, new_quantity, reference, reason) VALUES (?, ?, 'stock_in', ?, ?, ?, ?, ?)");
            $mStmt->execute([$invId, $_SESSION['user_id'], $po['quantity'], $prevQty, $newQty, $grnNumber, "Shipment received via {$po['po_number']}"]);
        }
    }

    // 4. Record Finance expense transaction
    $fStmt = $pdo->prepare("INSERT INTO finance_transactions (type, category, description, amount, transaction_date, reference_no, po_id) VALUES ('expense', 'Supplies Restock', ?, ?, ?, ?, ?)");
    $fStmt->execute(["PO {$po['po_number']}: {$po['item_name']} x{$po['quantity']} (Received)", $po['total_cost'], $receiveDate, $grnNumber, $poId]);

    // 5. Notify Finance Module
    $pdo->prepare("INSERT INTO notifications (role_target, title, message) VALUES ('finance_officer', 'Shipment Received & GRN Generated', ?)")
        ->execute(["Inventory confirmed receipt of PO {$po['po_number']}. GRN: $grnNumber. KES " . number_format($po['total_cost'], 2) . " capitalized."]);

    // 6. Notify Supplier Module
    $supUser = $pdo->prepare("SELECT user_id FROM users WHERE supplier_id = ? AND role = 'supplier' LIMIT 1");
    $supUser->execute([$po['supplier_id']]);
    $suId = $supUser->fetchColumn();
    if ($suId) {
        $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'supplier', 'Delivery Confirmed Received', ?)")
            ->execute([$suId, "Steve's Massage Parlour confirmed delivery for PO {$po['po_number']}. GRN: $grnNumber."]);
    }

    $pdo->commit();
    header("Location: grn_receipt.php?po_id=" . $poId . "&received=1");
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    die("Error processing goods receipt: " . htmlspecialchars($e->getMessage()));
}
