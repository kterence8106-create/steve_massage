<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){
 $q=$pdo->prepare("INSERT INTO users(full_name,email,phone,password,role) VALUES(?,?,?,?,?)");
 $q->execute([trim($_POST['full_name']),trim($_POST['email']),trim($_POST['phone']),password_hash($_POST['password'],PASSWORD_DEFAULT),$_POST['role']]);
}
$users=$pdo->query("SELECT user_id,full_name,email,phone,role,created_at FROM users ORDER BY user_id DESC")->fetchAll();
$page_title="Users"; include '../includes/header.php';
?>
<h1>Users</h1><div class="form-box"><form method="post"><input name="full_name" placeholder="Full name" required><input type="email" name="email" placeholder="Email" required><input name="phone" placeholder="Phone" required><input type="password" name="password" placeholder="Password" required><select name="role"><option>customer</option><option>therapist</option><option>admin</option></select><button class="btn">Add User</button></form></div>
<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th></tr><?php foreach($users as $u): ?><tr><td><?= $u['user_id'] ?></td><td><?= htmlspecialchars($u['full_name']) ?></td><td><?= htmlspecialchars($u['email']) ?></td><td><?= htmlspecialchars($u['phone']) ?></td><td><?= $u['role'] ?></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
