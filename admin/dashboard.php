<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
$counts=[];
foreach(['users','services','therapists','appointments','inventory','payments','inquiries'] as $table){$counts[$table]=(int)$pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();}
$page_title="Admin Dashboard"; include '../includes/header.php';
?>
<h1>Admin Dashboard</h1>
<div class="stats"><?php foreach($counts as $name=>$count): ?><div class="stat"><strong><?= $count ?></strong><span><?= ucfirst($name) ?></span></div><?php endforeach; ?></div>
<div class="admin-grid">
<a class="card" href="users.php"><h3>Users</h3><p>Manage customer, therapist and admin accounts.</p></a>
<a class="card" href="services.php"><h3>Services</h3><p>Add and manage massage services.</p></a>
<a class="card" href="therapists.php"><h3>Therapists</h3><p>Register therapists and availability.</p></a>
<a class="card" href="schedules.php"><h3>Schedules</h3><p>Create available therapist slots.</p></a>
<a class="card" href="appointments.php"><h3>Appointments</h3><p>Review and manage bookings.</p></a>
<a class="card" href="inventory.php"><h3>Inventory</h3><p>Manage stock.</p></a><a class="card" href="inventory_transactions.php"><h3>Inventory Transactions</h3><p>Record stock in, stock out and adjustments.</p></a>
<a class="card" href="payments.php"><h3>Payments</h3><p>View payment records.</p></a>
<a class="card" href="inquiries.php"><h3>Inquiries</h3><p>Reply to customer inquiries.</p></a>
</div>
<?php include '../includes/footer.php'; ?>
