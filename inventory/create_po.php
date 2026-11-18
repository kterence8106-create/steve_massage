<?php
require '../config/database.php';
require '../includes/auth.php';
require_role(['inventory_manager', 'admin']);

$page_title = "Issue Purchase Order - Steve's Massage Parlour";
$error = "";
$message = "";

// Pre-selected item if passed via GET
$selectedItemId = isset($_GET['item_id']) ? (int)$_GET['item_id'] : null;

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $supplierId      = (int)($_POST['supplier_id'] ?? 0);
    $itemId          = !empty($_POST['inventory_id']) ? (int)$_POST['inventory_id'] : null;
    $customItemName  = trim($_POST['item_name'] ?? '');
    $qty             = max(1, (int)($_POST['quantity'] ?? 0));
    $unitPrice       = max(0, (float)($_POST['unit_price'] ?? 0));
    $deliveryOption  = trim($_POST['delivery_option'] ?? 'Standard Courier (Nairobi Express Delivery - 24 to 48 Hours)');
    $deliveryAddress = trim($_POST['delivery_address'] ?? "Steve's Massage Parlour, 2nd Floor, Valley Arcade, Gitanga Rd, Nairobi");
    $notes           = trim($_POST['notes'] ?? '');

    // Get item name
    $finalItemName = $customItemName;
    if ($itemId) {
        $iStmt = $pdo->prepare("SELECT item_name, unit_price FROM inventory WHERE inventory_id = ?");
        $iStmt->execute([$itemId]);
        $itemRow = $iStmt->fetch();
        if ($itemRow) {
            $finalItemName = $itemRow['item_name'];
            if ($unitPrice <= 0) $unitPrice = (float)$itemRow['unit_price'];
        }
    }

    if (!$supplierId || !$finalItemName || $qty <= 0) {
        $error = "Please choose a certified vendor, an item from the catalog, and a valid quantity.";
    } else {
        $totalCost = $qty * $unitPrice;
        $poNumber  = "PO-" . date('Y') . "-" . rand(1000, 9999);
        $orderDate = date('Y-m-d');

        $stmt = $pdo->prepare("INSERT INTO purchase_orders (po_number, supplier_id, inventory_id, item_name, quantity, unit_price, total_cost, order_date, delivery_option, delivery_address, finance_status, order_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending_approval', ?)");
        $stmt->execute([$poNumber, $supplierId, $itemId, $finalItemName, $qty, $unitPrice, $totalCost, $orderDate, $deliveryOption, $deliveryAddress, $notes]);
        $poId = $pdo->lastInsertId();

        // Notify Finance Officer for review
        try {
            $nStmt = $pdo->prepare("INSERT INTO notifications (role_target, title, message) VALUES ('finance_officer', 'PO Approval Required', ?)");
            $nStmt->execute(["Purchase Order $poNumber for $finalItemName (Qty: $qty, Total: KES " . number_format($totalCost, 2) . ") requires your authorization."]);
        } catch (Exception $e) {}

        header("Location: purchase_orders.php?issued=" . urlencode($poNumber));
        exit;
    }
}

// Fetch suppliers and inventory items from database for functional dropdowns
$suppliers = $pdo->query("SELECT * FROM suppliers ORDER BY supplier_name ASC")->fetchAll();
$inventoryItems = $pdo->query("SELECT * FROM inventory ORDER BY item_name ASC")->fetchAll();

// Pre-defined delivery options
$deliveryOptions = [
    "Standard Courier (Nairobi Express Delivery - 24 to 48 Hours)",
    "Direct Dispatch (Supplier Fleet Vehicle - Scheduled Run)",
    "Expedited Van (Same-Day Urgent Delivery)",
    "Parlour Pickup (Self-Collect at Supplier Depot)"
];

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-file-invoice text-gold"></i> Issue New Purchase Order (PO)</h2>
        <p class="text-muted">Select catalog items and verified delivery details to route for Financial authorization.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
        <a href="purchase_orders.php" class="btn btn-outline"><i class="fas fa-list"></i> View All POs</a>
    </div>
</div>

<?php if ($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div><?php endif; ?>

<div class="card" style="max-width:850px; margin:0 auto;">
    <div class="card-header">
        <h3><i class="fas fa-edit text-gold"></i> Purchase Order Requisition Form</h3>
    </div>
    <form method="post" style="padding:24px;">
        <div class="form-row">
            <div class="form-group">
                <label><strong>1. Certified Vendor / Supplier *</strong></label>
                <select name="supplier_id" id="po-supplier" required onchange="updateSupplierCard()">
                    <option value="">-- Select Vendor from Database --</option>
                    <?php foreach ($suppliers as $s): ?>
                        <option value="<?= $s['supplier_id'] ?>" 
                            data-phone="<?= htmlspecialchars($s['phone']) ?>"
                            data-email="<?= htmlspecialchars($s['email']) ?>"
                            data-terms="<?= htmlspecialchars($s['payment_terms']) ?>"
                            data-contact="<?= htmlspecialchars($s['contact_person']) ?>">
                            ★ <?= $s['rating'] ?> | <?= htmlspecialchars($s['supplier_name']) ?> (<?= htmlspecialchars($s['contact_person']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
                <div id="sup-card" style="display:none; margin-top:8px; padding:10px; background:#F4F9F5; border:1px solid #C8E6C9; border-radius:6px; font-size:0.83rem;">
                    <!-- JS fills this -->
                </div>
            </div>

            <div class="form-group">
                <label><strong>2. Purchase Order Item (Database Catalog Dropdown) *</strong></label>
                <select name="inventory_id" id="po-item-select" onchange="onItemChange()">
                    <option value="">-- Choose Item from Inventory Database --</option>
                    <?php foreach ($inventoryItems as $item): ?>
                        <option value="<?= $item['inventory_id'] ?>" 
                            data-name="<?= htmlspecialchars($item['item_name']) ?>"
                            data-price="<?= $item['unit_price'] ?>"
                            data-unit="<?= htmlspecialchars($item['unit']) ?>"
                            <?= $selectedItemId == $item['inventory_id'] ? 'selected' : '' ?>>
                            [<?= htmlspecialchars($item['sku'] ?? 'SKU') ?>] <?= htmlspecialchars($item['item_name']) ?> (KES <?= number_format($item['unit_price'], 2) ?> / <?= htmlspecialchars($item['unit']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label><strong>Item Description / Specific Specifications</strong></label>
            <select name="item_name" id="po-item-name" required>
                <option value="">-- Select Item Specification --</option>

                <!-- Massage & Carrier Oils -->
                <optgroup label="🛢 Massage & Carrier Oils">
                    <option value="Lavender Essential Oil (500ml Bottle) – Cold-Pressed, Therapeutic Grade">Lavender Essential Oil (500ml) – Cold-Pressed, Therapeutic Grade</option>
                    <option value="Jojoba Carrier Oil (1L Bottle) – Organic, Unrefined">Jojoba Carrier Oil (1L) – Organic, Unrefined</option>
                    <option value="Sweet Almond Oil (1L Bottle) – Pure, Cold-Pressed">Sweet Almond Oil (1L) – Pure, Cold-Pressed</option>
                    <option value="Coconut Oil – Fractionated (500ml Bottle) – Odourless, Non-Greasy">Coconut Oil – Fractionated (500ml) – Odourless, Non-Greasy</option>
                    <option value="Eucalyptus Essential Oil (250ml Bottle) – Steam-Distilled, Grade A">Eucalyptus Essential Oil (250ml) – Steam-Distilled, Grade A</option>
                    <option value="Peppermint Essential Oil (250ml Bottle) – 100% Pure">Peppermint Essential Oil (250ml) – 100% Pure</option>
                    <option value="Rosehip Seed Oil (500ml Bottle) – Unrefined, Cold-Pressed">Rosehip Seed Oil (500ml) – Unrefined, Cold-Pressed</option>
                    <option value="Grapeseed Oil (1L Bottle) – Refined, Light Texture">Grapeseed Oil (1L) – Refined, Light Texture</option>
                </optgroup>

                <!-- Aromatherapy -->
                <optgroup label="🕯 Aromatherapy & Candles">
                    <option value="Aromatherapy Diffuser Reeds – Bamboo, 10-Pack (25cm)">Aromatherapy Reed Diffusers – Bamboo, 10-Pack (25cm)</option>
                    <option value="Scented Soy Wax Candles – Lavender & Eucalyptus Blend (200g)">Scented Soy Wax Candles – Lavender & Eucalyptus Blend (200g)</option>
                    <option value="Incense Sticks – Sandalwood, Box of 100 Sticks">Incense Sticks – Sandalwood, Box of 100</option>
                    <option value="Essential Oil Blend – Relaxation Mix (Lavender, Chamomile, Bergamot) 100ml">Essential Oil Blend – Relaxation Mix (100ml)</option>
                    <option value="Aromatherapy Nebulizing Diffuser – Ultrasonic, 300ml Capacity">Aromatherapy Ultrasonic Diffuser – 300ml</option>
                </optgroup>

                <!-- Linens & Towels -->
                <optgroup label="🛏 Linens, Towels & Draping">
                    <option value="Massage Table Sheets – 100% Egyptian Cotton, White, 190×90cm (Pack of 10)">Massage Table Sheets – 100% Cotton, White, 190×90cm (Pack of 10)</option>
                    <option value="Microfibre Bath Towels – 70×140cm, 450gsm, White (Pack of 12)">Microfibre Bath Towels – 70×140cm, 450gsm (Pack of 12)</option>
                    <option value="Disposable Massage Table Paper Roll – Non-Woven, 60cm×80m">Disposable Massage Table Paper Roll – 60cm×80m</option>
                    <option value="Plush Bathrobes – Waffle Weave, 100% Cotton, Sizes M/L (Pack of 6)">Plush Bathrobes – Waffle Weave, Cotton, M/L (Pack of 6)</option>
                    <option value="Disposable Non-Woven Face Rest Covers – Oval, Box of 100">Disposable Face Rest Covers – Non-Woven, Box of 100</option>
                    <option value="Pillow Cases – White, 100% Cotton, 50×75cm (Pack of 10)">Pillow Cases – White, Cotton, 50×75cm (Pack of 10)</option>
                </optgroup>

                <!-- Sanitation & Hygiene -->
                <optgroup label="🧴 Sanitation & Hygiene Supplies">
                    <option value="Antibacterial Hand Soap – Liquid, 5L Refill Jerrican, Lemon Scent">Antibacterial Hand Soap – Liquid, 5L Refill Jerrican</option>
                    <option value="Disinfectant Surface Spray – Hospital Grade, 500ml Trigger Bottle">Disinfectant Surface Spray – Hospital Grade, 500ml</option>
                    <option value="Disposable Vinyl Gloves – Powder-Free, Box of 100 (Size M)">Disposable Vinyl Gloves – Powder-Free, Box of 100 (Size M)</option>
                    <option value="Alcohol Hand Sanitiser – 70% Ethanol, 500ml Pump Dispenser">Alcohol Hand Sanitiser – 70% Ethanol, 500ml Pump</option>
                    <option value="Disposable Foot Covers – Non-Woven, Box of 200 Pairs">Disposable Foot Covers – Non-Woven, Box of 200 Pairs</option>
                    <option value="Laundry Detergent – Professional Grade, 10kg Bucket">Laundry Detergent – Professional Grade, 10kg Bucket</option>
                    <option value="Tissue / Facial Wipes – Soft, 2-Ply, Box of 200 Sheets">Facial Tissue Wipes – Soft, 2-Ply, Box of 200</option>
                </optgroup>

                <!-- Spa Equipment -->
                <optgroup label="⚙ Spa Equipment & Accessories">
                    <option value="Portable Massage Table – Aluminium Frame, 185×70cm, Max Load 250kg">Portable Massage Table – Aluminium Frame, 185×70cm</option>
                    <option value="Hot Stone Massage Set – 45 Basalt Stones, Carry Bag Included">Hot Stone Massage Set – 45 Basalt Stones + Carry Bag</option>
                    <option value="Massage Oil Warmer – Electric, Stainless Steel, 1.5L Capacity">Massage Oil Warmer – Electric, Stainless Steel, 1.5L</option>
                    <option value="Body Scrub Exfoliating Mitts – 100% Natural Sisal, Pack of 12">Body Scrub Exfoliating Mitts – Natural Sisal, Pack of 12</option>
                    <option value="Neck & Back Massager Cushion – Shiatsu, Heat Function, Portable">Shiatsu Neck & Back Massager Cushion – Heat Function</option>
                    <option value="Foot Soak Basin – Stainless Steel, 42cm Diameter">Foot Soak Basin – Stainless Steel, 42cm Diameter</option>
                    <option value="Digital Appointment Timer – Countdown/Count-Up, Backlit Display">Digital Appointment Timer – Countdown/Count-Up, Backlit</option>
                </optgroup>

                <!-- Refreshments -->
                <optgroup label="☕ Client Refreshments">
                    <option value="Herbal Tea Sachets – Chamomile & Mint Blend, Box of 100">Herbal Tea – Chamomile & Mint Sachets, Box of 100</option>
                    <option value="Mineral Water Bottles – 500ml, Still, Carton of 24">Mineral Water – 500ml Still, Carton of 24</option>
                    <option value="Infusion Cups & Saucers – Ceramic, White, Set of 12">Infusion Cups & Saucers – Ceramic White, Set of 12</option>
                </optgroup>

                <!-- Stationery -->
                <optgroup label="📋 Stationery & Administrative">
                    <option value="A4 Printing Paper – 80gsm, Ream of 500 Sheets (Box of 5 Reams)">A4 Printing Paper – 80gsm, 5-Ream Box (2,500 Sheets)</option>
                    <option value="Receipt/Till Roll – 57mm×40m Thermal, Box of 20 Rolls">Till/Receipt Rolls – 57mm×40m Thermal, Box of 20</option>
                    <option value="Ballpoint Pens – Blue Ink, Box of 50">Ballpoint Pens – Blue Ink, Box of 50</option>
                </optgroup>

                <option value="Other / Custom Specification">Other / Custom Specification (see Requisition Notes)</option>
            </select>
            <small class="text-muted" style="margin-top:4px; display:block;">
                <i class="fas fa-info-circle"></i> Selecting a Catalog Item above auto-fills this field. You may also select directly here.
            </small>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Order Quantity *</label>
                <input type="number" name="quantity" id="po-qty" value="5" min="1" required oninput="recalcTotal()">
            </div>
            <div class="form-group">
                <label>Agreed Unit Price (KES) *</label>
                <input type="number" step="0.01" name="unit_price" id="po-price" value="0.00" required oninput="recalcTotal()">
            </div>
            <div class="form-group">
                <label>Estimated Total Cost (KES)</label>
                <input type="text" id="po-total" readonly style="background:#F9FAF9; font-weight:700; color:#1C2E26;">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label><strong>3. Delivery Option (Database Dropdown) *</strong></label>
                <select name="delivery_option" required>
                    <?php foreach ($deliveryOptions as $opt): ?>
                        <option value="<?= htmlspecialchars($opt) ?>"><?= htmlspecialchars($opt) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group">
                <label>Delivery Destination Address</label>
                <input type="text" name="delivery_address" value="Steve's Massage Parlour, 2nd Floor, Valley Arcade, Gitanga Rd, Nairobi" required>
            </div>
        </div>

        <div class="form-group">
            <label>Requisition Notes / Instructions</label>
            <textarea name="notes" rows="3" placeholder="e.g. Inspect package seals upon arrival. Deliver directly to second-floor store bay."></textarea>
        </div>

        <div style="background:#FFF9E6; border:1px solid #FFE082; padding:12px 16px; border-radius:8px; font-size:0.85rem; color:#5D4037; margin-bottom:20px;">
            <i class="fas fa-shield-alt text-gold"></i> <strong>Integrated Finance Workflow:</strong>
            Submitting this purchase order routes it automatically to the Finance Module for review and budget authorization before supplier dispatch.
        </div>

        <button type="submit" class="btn btn-gold" style="padding:12px 24px; font-size:1rem;">
            <i class="fas fa-paper-plane"></i> Submit Purchase Order for Finance Approval
        </button>
    </form>
</div>

<script>
function onItemChange() {
    const sel = document.getElementById('po-item-select');
    const opt = sel.options[sel.selectedIndex];
    if (opt && opt.value) {
        const catalogName = (opt.dataset.name || '').toLowerCase();
        const specSel = document.getElementById('po-item-name');
        // Try to match catalog name against spec dropdown options
        let matched = false;
        for (let i = 0; i < specSel.options.length; i++) {
            const optVal = specSel.options[i].value.toLowerCase();
            const optTxt = specSel.options[i].text.split('–')[0].trim().toLowerCase();
            if (optVal.includes(catalogName) || catalogName.includes(optTxt)) {
                specSel.selectedIndex = i;
                matched = true;
                break;
            }
        }
        if (!matched) specSel.selectedIndex = 0;
        document.getElementById('po-price').value = opt.dataset.price || '0';
        recalcTotal();
    }
}

function recalcTotal() {
    const qty = parseFloat(document.getElementById('po-qty').value) || 0;
    const price = parseFloat(document.getElementById('po-price').value) || 0;
    const total = qty * price;
    document.getElementById('po-total').value = "KES " + total.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function updateSupplierCard() {
    const sel = document.getElementById('po-supplier');
    const card = document.getElementById('sup-card');
    const opt = sel.options[sel.selectedIndex];
    if (opt && opt.value) {
        card.style.display = 'block';
        card.innerHTML = "<strong>Contact:</strong> " + opt.dataset.contact + " | <strong>Phone:</strong> " + opt.dataset.phone + " | <strong>Terms:</strong> " + opt.dataset.terms;
    } else {
        card.style.display = 'none';
    }
}

// Initial calculation on load
window.addEventListener('DOMContentLoaded', () => {
    onItemChange();
    recalcTotal();
    updateSupplierCard();
});
</script>

<?php include '../includes/footer.php'; ?>
