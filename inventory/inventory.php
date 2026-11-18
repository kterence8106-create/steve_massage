<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['inventory_manager', 'admin']);

$page_title = "Stock Catalog & Levels - Steve's Massage Parlour";
$message = "";
$error = "";

// Handle New Item Addition
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_item') {
    $name     = trim($_POST['item_name'] ?? '');
    $sku      = trim($_POST['sku'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $qty      = max(0, (int)($_POST['quantity'] ?? 0));
    $unit     = trim($_POST['unit'] ?? 'Pieces');
    $min      = max(1, (int)($_POST['min_threshold'] ?? 5));
    $price    = max(0, (float)($_POST['unit_price'] ?? 0));
    $supId    = !empty($_POST['supplier_id']) ? (int)$_POST['supplier_id'] : null;
    $desc     = trim($_POST['description'] ?? '');

    if (!$name) {
        $error = "Item name is required.";
    } else {
        $supName = null;
        if ($supId) {
            $sStmt = $pdo->prepare("SELECT supplier_name FROM suppliers WHERE supplier_id = ?");
            $sStmt->execute([$supId]);
            $supName = $sStmt->fetchColumn();
        }
        $status = $qty <= 0 ? 'out_of_stock' : ($qty <= $min ? 'low_stock' : 'in_stock');

        $stmt = $pdo->prepare("INSERT INTO inventory (sku, item_name, category, description, quantity, unit, min_threshold, unit_price, supplier_id, supplier_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$sku, $name, $category, $desc, $qty, $unit, $min, $price, $supId, $supName, $status]);
        $message = "Inventory item \"$name\" registered successfully!";
    }
}

// Fetch all items
$items = $pdo->query("SELECT i.*, s.supplier_name FROM inventory i LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id ORDER BY i.item_name ASC")->fetchAll();
$suppliers = $pdo->query("SELECT * FROM suppliers ORDER BY supplier_name ASC")->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-warehouse text-gold"></i> Stock Catalog & Inventory Levels</h2>
        <p class="text-muted">Monitor stock balances, unit prices, storage categories, and minimum reorder thresholds.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
        <a href="create_po.php" class="btn btn-gold"><i class="fas fa-plus"></i> New Purchase Order</a>
    </div>
</div>

<?php if ($message): ?><div class="alert alert-success"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($message) ?></div><?php endif; ?>
<?php if ($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div><?php endif; ?>

<!-- Add Item Card -->
<div class="card" style="margin-bottom:24px;">
    <div class="card-header">
        <h3><i class="fas fa-plus-circle text-gold"></i> Register New Stock Item</h3>
    </div>
    <form method="post" style="padding:20px;">
        <input type="hidden" name="action" value="add_item">
        <div class="form-row">
            <div class="form-group">
                <label>SKU / Item Code</label>
                <input type="text" name="sku" placeholder="e.g. OIL-LAV-500">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select name="category">
                    <option value="Massage Oils">Massage Oils</option>
                    <option value="Carrier Oils">Carrier Oils</option>
                    <option value="Aromatherapy">Aromatherapy</option>
                    <option value="Linens">Linens & Bath Sheets</option>
                    <option value="Equipment">Spa Equipment</option>
                    <option value="Sanitation">Sanitation & Hygiene</option>
                </select>
            </div>
            <div class="form-group">
                <label>Item Name *</label>
                <input type="text" name="item_name" required placeholder="e.g. Organic Cold-Pressed Lavender Oil (500ml)">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Initial Quantity</label>
                <input type="number" name="quantity" value="10" min="0">
            </div>
            <div class="form-group">
                <label>Unit of Measure</label>
                <select name="unit">
                    <option value="Bottles">Bottles</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Jerricans">Jerricans</option>
                    <option value="Litres">Litres</option>
                    <option value="Millilitres">Millilitres</option>
                    <option value="Kilograms">Kilograms</option>
                    <option value="Grams">Grams</option>
                    <option value="Packs">Packs</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Sets">Sets</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Sachets">Sachets</option>
                    <option value="Tubes">Tubes</option>
                    <option value="Cans">Cans</option>
                </select>
            </div>
            <div class="form-group">
                <label>Min Safety Threshold</label>
                <input type="number" name="min_threshold" value="5" min="1">
            </div>
            <div class="form-group">
                <label>Cost per Unit (KES)</label>
                <input type="number" step="0.01" name="unit_price" placeholder="1500.00">
            </div>
        </div>
        <div class="form-group">
            <label>Designated Vendor / Supplier</label>
            <select name="supplier_id">
                <option value="">-- Select Preferred Supplier --</option>
                <?php foreach ($suppliers as $s): ?>
                    <option value="<?= $s['supplier_id'] ?>"><?= htmlspecialchars($s['supplier_name']) ?> (<?= htmlspecialchars($s['contact_person']) ?>)</option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="form-group">
            <label>Description & Storage Details</label>
            <input type="text" name="description" placeholder="e.g. Store in Main Store / Cabinet A">
        </div>
        <button type="submit" class="btn btn-gold"><i class="fas fa-save"></i> Save Item to Catalog</button>
    </form>
</div>

<!-- Stock Items Table -->
<div class="card">
    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3><i class="fas fa-boxes text-gold"></i> Active Inventory Catalog (<?= count($items) ?> Items)</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Safety Min</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $i): 
                    $isLow = $i['quantity'] <= $i['min_threshold'];
                    $val = $i['quantity'] * $i['unit_price'];
                ?>
                <tr style="<?= $isLow ? 'background:#FFF8F7;' : '' ?>">
                    <td><code><?= htmlspecialchars($i['sku'] ?? 'N/A') ?></code></td>
                    <td><strong><?= htmlspecialchars($i['item_name']) ?></strong></td>
                    <td><?= htmlspecialchars($i['category']) ?></td>
                    <td>
                        <strong style="color:<?= $isLow ? '#C0392B' : '#27AE60' ?>; font-size:1.05rem;">
                            <?= $i['quantity'] ?> <?= htmlspecialchars($i['unit']) ?>
                        </strong>
                    </td>
                    <td><?= $i['min_threshold'] ?> <?= htmlspecialchars($i['unit']) ?></td>
                    <td>KES <?= number_format($i['unit_price'], 2) ?></td>
                    <td><strong>KES <?= number_format($val, 2) ?></strong></td>
                    <td><?= htmlspecialchars($i['supplier_name'] ?? 'General') ?></td>
                    <td>
                        <span class="badge badge-<?= $i['quantity'] <= 0 ? 'danger' : ($isLow ? 'warning' : 'success') ?>">
                            <?= $i['quantity'] <= 0 ? 'OUT OF STOCK' : ($isLow ? 'LOW STOCK' : 'IN STOCK') ?>
                        </span>
                    </td>
                    <td>
                        <?php if ($isLow): ?>
                            <a href="shortage_request.php?item_id=<?= $i['inventory_id'] ?>" class="btn btn-sm btn-danger" title="Request shortage restock">
                                <i class="fas fa-exclamation-triangle"></i> Shortage Request
                            </a>
                        <?php else: ?>
                            <a href="create_po.php?item_id=<?= $i['inventory_id'] ?>" class="btn btn-sm btn-outline" title="Reorder this item">
                                <i class="fas fa-shopping-cart"></i> Reorder
                            </a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
