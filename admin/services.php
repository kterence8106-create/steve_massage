<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){$q=$pdo->prepare("INSERT INTO services(service_name,description,price,duration,status) VALUES(?,?,?,?,?)");$q->execute([trim($_POST['service_name']),trim($_POST['description']),$_POST['price'],$_POST['duration'],$_POST['status']]);}
$rows=$pdo->query("SELECT * FROM services ORDER BY service_id DESC")->fetchAll();
$page_title="Services"; include '../includes/header.php'; ?>
<h1>Services</h1><div class="form-box"><form method="post"><input name="service_name" placeholder="Service name" required><textarea name="description" placeholder="Description"></textarea><input type="number" step="0.01" name="price" placeholder="Price" required><input type="number" name="duration" placeholder="Duration in minutes" required><select name="status"><option>available</option><option>unavailable</option></select><button class="btn">Add Service</button></form></div>
<table><tr><th>Service</th><th>Price</th><th>Duration</th><th>Status</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['service_name']) ?></td><td>KSh <?= number_format($r['price'],2) ?></td><td><?= $r['duration'] ?> min</td><td><?= $r['status'] ?></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
