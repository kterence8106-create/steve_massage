<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){
 $q=$pdo->prepare("UPDATE inquiries SET status=?,admin_reply=?,replied_by=?,replied_at=NOW() WHERE inquiry_id=?");
 $q->execute([$_POST['status'],trim($_POST['admin_reply']),$_SESSION['user_id'],$_POST['inquiry_id']]);
}
$rows=$pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC")->fetchAll();
$page_title="Inquiries"; include '../includes/header.php'; ?>
<h1>Customer Inquiries</h1>
<?php foreach($rows as $r): ?><div class="inquiry"><h3><?= htmlspecialchars($r['subject']) ?></h3><p><b><?= htmlspecialchars($r['full_name']) ?></b> — <?= htmlspecialchars($r['email']) ?></p><p><?= nl2br(htmlspecialchars($r['message'])) ?></p><form method="post"><input type="hidden" name="inquiry_id" value="<?= $r['inquiry_id'] ?>"><textarea name="admin_reply" placeholder="Reply"><?= htmlspecialchars($r['admin_reply'] ?? '') ?></textarea><select name="status"><option>new</option><option>read</option><option>in_progress</option><option>resolved</option></select><button class="btn">Save Reply</button></form></div><?php endforeach; ?>
<?php include '../includes/footer.php'; ?>
