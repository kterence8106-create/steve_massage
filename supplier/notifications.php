<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('supplier');

$page_title = "Supplier Notifications - Steve's Massage Parlour";

// Handle Mark Read
if (isset($_GET['read_id'])) {
    $rId = (int)$_GET['read_id'];
    $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND (user_id = ? OR role_target = 'supplier')")->execute([$rId, $_SESSION['user_id']]);
    header("Location: notifications.php");
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? OR role_target = 'supplier' ORDER BY notification_id DESC LIMIT 30");
$stmt->execute([$_SESSION['user_id']]);
$notifs = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-bell text-gold"></i> Notifications & Dispatch Alerts</h2>
        <p class="text-muted">Real-time alerts for approved purchase orders and confirmed inventory deliveries.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Dashboard</a>
    </div>
</div>

<div class="card">
    <div style="padding:20px;">
        <?php if (empty($notifs)): ?>
            <div style="text-align:center; padding:40px;" class="text-muted">
                <i class="fas fa-bell-slash" style="font-size:2.5rem; opacity:0.3; margin-bottom:12px; display:block;"></i>
                <p>No notifications found.</p>
            </div>
        <?php else: foreach ($notifs as $n): ?>
            <div style="background:<?= $n['is_read'] ? '#FAFAFA' : '#F4F9F5' ?>; border:1px solid <?= $n['is_read'] ? 'var(--border)' : '#C8E6C9' ?>; border-radius:8px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="margin:0 0 4px; color:var(--primary);"><?= htmlspecialchars($n['title']) ?></h4>
                    <p style="margin:0; font-size:0.9rem; color:var(--text-dark);"><?= htmlspecialchars($n['message']) ?></p>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;"><i class="fas fa-clock"></i> <?= $n['created_at'] ?></div>
                </div>
                <?php if (!$n['is_read']): ?>
                    <a href="notifications.php?read_id=<?= $n['notification_id'] ?>" class="btn btn-sm btn-outline"><i class="fas fa-check"></i> Mark Read</a>
                <?php else: ?>
                    <span class="badge badge-success">Read</span>
                <?php endif; ?>
            </div>
        <?php endforeach; endif; ?>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
