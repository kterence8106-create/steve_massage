<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){$q=$pdo->prepare("UPDATE payments SET payment_status=? WHERE payment_id=?");$q->execute([$_POST['payment_status'],$_POST['payment_id']]);}
$rows=$pdo->query("SELECT p.*,u.full_name customer_name FROM payments p JOIN users u ON p.customer_id=u.user_id ORDER BY p.payment_date DESC")->fetchAll();
$page_title="Payments"; include '../includes/header.php'; ?>
<h1>Payments</h1><table><tr><th>Customer</th><th>Appointment</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Update</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['customer_name']) ?></td><td><?= $r['appointment_id'] ?></td><td>KSh <?= number_format($r['amount'],2) ?></td><td><?= $r['payment_method'] ?></td><td><?= $r['payment_status'] ?></td><td><?= $r['payment_date'] ?></td><td><form method="post"><input type="hidden" name="payment_id" value="<?= $r['payment_id'] ?>"><select name="payment_status"><option>pending</option><option>completed</option><option>failed</option><option>refunded</option></select><button>Save</button></form></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
