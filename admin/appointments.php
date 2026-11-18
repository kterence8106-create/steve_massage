<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
if($_SERVER['REQUEST_METHOD']==='POST'){$q=$pdo->prepare("UPDATE appointments SET status=? WHERE appointment_id=?");$q->execute([$_POST['status'],$_POST['appointment_id']]);}
$rows=$pdo->query("SELECT a.*,c.full_name customer_name,tuser.full_name therapist_name FROM appointments a JOIN users c ON a.customer_id=c.user_id JOIN therapists t ON a.therapist_id=t.therapist_id JOIN users tuser ON t.user_id=tuser.user_id ORDER BY a.appointment_date DESC,a.appointment_time DESC")->fetchAll();
$page_title="Appointments"; include '../includes/header.php'; ?>
<h1>Appointments</h1><table><tr><th>Customer</th><th>Therapist</th><th>Date</th><th>Time</th><th>Status</th><th>Update</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['customer_name']) ?></td><td><?= htmlspecialchars($r['therapist_name']) ?></td><td><?= $r['appointment_date'] ?></td><td><?= $r['appointment_time'] ?></td><td><?= $r['status'] ?></td><td><form method="post"><input type="hidden" name="appointment_id" value="<?= $r['appointment_id'] ?>"><select name="status"><option>pending</option><option>confirmed</option><option>completed</option><option>cancelled</option></select><button>Save</button></form></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
