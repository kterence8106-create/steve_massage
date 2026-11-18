<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
$message="";
if($_SERVER['REQUEST_METHOD']==='POST'){
    $iid=(int)$_POST['inventory_id']; $qty=(int)$_POST['quantity']; $type=$_POST['transaction_type'];
    $q=$pdo->prepare("SELECT quantity FROM inventory WHERE inventory_id=?");$q->execute([$iid]);$item=$q->fetch();
    if(!$item || $qty<1) $message="Invalid item or quantity.";
    else {
        $new=$type==='stock_in' ? $item['quantity']+$qty : ($type==='stock_out' ? max(0,$item['quantity']-$qty) : $qty);
        $status=$new<=0?'out_of_stock':($new<=5?'low_stock':'in_stock');
        $pdo->beginTransaction();
        $q=$pdo->prepare("INSERT INTO inventory_transactions(inventory_id,user_id,transaction_type,quantity,new_quantity,reference,reason) VALUES(?,?,?,?,?,?,?)");
        $q->execute([$iid,$_SESSION['user_id'],$type,$qty,$new,trim($_POST['reference']),trim($_POST['reason'])]);
        $q=$pdo->prepare("UPDATE inventory SET quantity=?,status=? WHERE inventory_id=?");$q->execute([$new,$status,$iid]);
        $pdo->commit(); $message="Inventory transaction recorded.";
    }
}
$items=$pdo->query("SELECT inventory_id,item_name,quantity FROM inventory ORDER BY item_name")->fetchAll();
$rows=$pdo->query("SELECT it.*,i.item_name,u.full_name FROM inventory_transactions it JOIN inventory i ON it.inventory_id=i.inventory_id JOIN users u ON it.user_id=u.user_id ORDER BY it.transaction_date DESC")->fetchAll();
$page_title="Inventory Transactions"; include '../includes/header.php';
?>
<h1>Inventory Transactions</h1>
<?php if($message): ?><div class="success"><?= htmlspecialchars($message) ?></div><?php endif; ?>
<div class="form-box"><form method="post"><select name="inventory_id" required><option value="">Select item</option><?php foreach($items as $i): ?><option value="<?= $i['inventory_id'] ?>"><?= htmlspecialchars($i['item_name']) ?> (<?= $i['quantity'] ?>)</option><?php endforeach; ?></select><select name="transaction_type"><option>stock_in</option><option>stock_out</option><option>adjustment</option></select><input type="number" name="quantity" min="1" required><input name="reference" placeholder="Reference"><textarea name="reason" placeholder="Reason"></textarea><button class="btn">Record Transaction</button></form></div>
<table><tr><th>Item</th><th>Type</th><th>Quantity</th><th>New Quantity</th><th>User</th><th>Date</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['item_name']) ?></td><td><?= $r['transaction_type'] ?></td><td><?= $r['quantity'] ?></td><td><?= $r['new_quantity'] ?></td><td><?= htmlspecialchars($r['full_name']) ?></td><td><?= $r['transaction_date'] ?></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
