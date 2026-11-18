<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){
 $qty=max(0,(int)$_POST['quantity']); $status=$qty<=0?'out_of_stock':($qty<=5?'low_stock':'in_stock');
 $q=$pdo->prepare("INSERT INTO inventory(item_name,category,description,quantity,unit,vendor_id,unit_price,supplier,status,added_by) VALUES(?,?,?,?,?,?,?,?,?,?)");
 $q->execute([trim($_POST['item_name']),trim($_POST['category']),trim($_POST['description']),$qty,trim($_POST['unit']),($_POST['vendor_id']!==''?$_POST['vendor_id']:null),$_POST['unit_price'],trim($_POST['supplier']),$status,$_SESSION['user_id']]);
}
$rows=$pdo->query("SELECT * FROM inventory ORDER BY inventory_id DESC")->fetchAll();
$page_title="Inventory"; include '../includes/header.php'; ?>
<h1>Inventory</h1><div class="form-box"><form method="post"><input name="item_name" placeholder="Item name" required><input name="category" placeholder="Category"><textarea name="description" placeholder="Description"></textarea><input type="number" name="quantity" placeholder="Quantity" required><input name="unit" placeholder="Unit e.g. pieces"><input type="number" name="vendor_id" placeholder="Vendor ID (optional)"><input type="number" step="0.01" name="unit_price" placeholder="Unit price"><input name="supplier" placeholder="Supplier"><button class="btn">Add Item</button></form></div>
<table><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Price</th><th>Status</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['item_name']) ?></td><td><?= htmlspecialchars($r['category']) ?></td><td><?= $r['quantity'] ?></td><td><?= htmlspecialchars($r['unit']) ?></td><td><?= number_format($r['unit_price'],2) ?></td><td><?= $r['status'] ?></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
