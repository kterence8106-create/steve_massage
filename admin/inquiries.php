<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){
 $q=$pdo->prepare("UPDATE inquiries SET status=?,admin_reply=?,replied_by=?,replied_at=NOW() WHERE inquiry_id=?");
 $q->execute([$_POST['status'],trim($_POST['admin_reply']),$_SESSION['user_id'],$_POST['inquiry_id']]);
}
$rows=$pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC")->fetchAll();
$page_title="Inquiries"; include '../includes/header.php'; ?>
<h1>Customer Inquiries</h1>
<?php foreach($rows as $r): ?>
<div class="inquiry" style="border:1px solid #e0e0e0; border-radius:8px; padding:16px; margin-bottom:16px; background:#fff;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h3><?= htmlspecialchars($r['subject']) ?></h3>
    <span style="background:#e8f5e9; color:#1b5e20; padding:4px 10px; border-radius:4px; font-weight:600; font-size:0.85rem;">
      To: <?= htmlspecialchars($r['target_email'] ?? 'admin@stevesmassage.co.ke') ?>
    </span>
  </div>
  <p><b><?= htmlspecialchars($r['full_name']) ?></b> &mdash; <?= htmlspecialchars($r['email']) ?> <?php if(!empty($r['phone'])): ?> &bull; <?= htmlspecialchars($r['phone']) ?><?php endif; ?></p>
  <p><?= nl2br(htmlspecialchars($r['message'])) ?></p>
  <form method="post">
    <input type="hidden" name="inquiry_id" value="<?= $r['inquiry_id'] ?>">
    <textarea name="admin_reply" placeholder="Reply" rows="3" style="width:100%; margin-bottom:8px;"><?= htmlspecialchars($r['admin_reply'] ?? '') ?></textarea>
    <div style="display:flex; gap:10px;">
      <select name="status">
        <option value="new" <?= ($r['status']??'')==='new'?'selected':'' ?>>new</option>
        <option value="read" <?= ($r['status']??'')==='read'?'selected':'' ?>>read</option>
        <option value="in_progress" <?= ($r['status']??'')==='in_progress'?'selected':'' ?>>in_progress</option>
        <option value="resolved" <?= ($r['status']??'')==='resolved'?'selected':'' ?>>resolved</option>
      </select>
      <button class="btn">Save Reply</button>
    </div>
  </form>
</div>
<?php endforeach; ?>
<?php include '../includes/footer.php'; ?>
