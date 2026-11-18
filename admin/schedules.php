<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('admin');
$therapists=$pdo->query("SELECT t.therapist_id,u.full_name FROM therapists t JOIN users u ON t.user_id=u.user_id WHERE t.status='available'")->fetchAll();
if($_SERVER['REQUEST_METHOD']==='POST'){$q=$pdo->prepare("INSERT INTO schedules(therapist_id,schedule_date,start_time,end_time,status) VALUES(?,?,?,?,?)");$q->execute([$_POST['therapist_id'],$_POST['schedule_date'],$_POST['start_time'],$_POST['end_time'],$_POST['status']]);}
$rows=$pdo->query("SELECT s.*,u.full_name FROM schedules s JOIN therapists t ON s.therapist_id=t.therapist_id JOIN users u ON t.user_id=u.user_id ORDER BY s.schedule_date DESC,s.start_time DESC")->fetchAll();
$page_title="Schedules"; include '../includes/header.php'; ?>
<h1>Schedules</h1><div class="form-box"><form method="post"><select name="therapist_id" required><?php foreach($therapists as $t): ?><option value="<?= $t['therapist_id'] ?>"><?= htmlspecialchars($t['full_name']) ?></option><?php endforeach; ?></select><input type="date" name="schedule_date" required><input type="time" name="start_time" required><input type="time" name="end_time" required><select name="status"><option>available</option><option>unavailable</option></select><button class="btn">Add Schedule</button></form></div>
<table><tr><th>Therapist</th><th>Date</th><th>Start</th><th>End</th><th>Status</th></tr><?php foreach($rows as $r): ?><tr><td><?= htmlspecialchars($r['full_name']) ?></td><td><?= $r['schedule_date'] ?></td><td><?= $r['start_time'] ?></td><td><?= $r['end_time'] ?></td><td><?= $r['status'] ?></td></tr><?php endforeach; ?></table>
<?php include '../includes/footer.php'; ?>
