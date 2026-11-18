<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){
 $pdo->beginTransaction();
 $q=$pdo->prepare("INSERT INTO users(full_name,email,phone,password,role) VALUES(?,?,?,?, 'therapist')");
 $q->execute([trim($_POST['full_name']),trim($_POST['email']),trim($_POST['phone']),password_hash($_POST['password'],PASSWORD_DEFAULT)]);
 $uid=$pdo->lastInsertId();
 $q=$pdo->prepare("INSERT INTO therapists(user_id,specialization,availability,status) VALUES(?,?,?,?)");
 $q->execute([$uid,trim($_POST['specialization']),trim($_POST['availability']),$_POST['status']]); $pdo->commit();
}
$rows=$pdo->query("SELECT t.*,u.full_name,u.email,u.phone FROM therapists t JOIN users u ON t.user_id=u.user_id ORDER BY t.therapist_id DESC")->fetchAll();
$page_title="Therapists"; include '../includes/header.php'; ?>
<h1>Therapists</h1><div class="form-box"><form method="post"><input name="full_name" placeholder="Full name" required><input type="email" name="email" placeholder="Email" required><input name="phone" placeholder="Phone" required><input type="password" name="password" placeholder="Login password" required><input name="specialization" placeholder="Specialization"><input name="availability" placeholder="Availability"><select name="status"><option>available</option><option>unavailable</option></select><button class="btn">Add Therapist</button></form></div>
<table><tr><th>Name</th><th>Specialization</th><th>Availability</th><th>Status</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['full_name']) ?></td><td><?= htmlspecialchars($r['specialization']) ?></td><td><?= htmlspecialchars($r['availability']) ?></td><td><?= $r['status'] ?></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
