<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('customer');
$message="";
if($_SERVER['REQUEST_METHOD']==='POST'){
    $q=$pdo->prepare("SELECT a.appointment_id, a.customer_id, COALESCE(SUM(aps.quantity*aps.price),0) total FROM appointments a LEFT JOIN appointment_services aps ON a.appointment_id=aps.appointment_id WHERE a.appointment_id=? AND a.customer_id=? GROUP BY a.appointment_id");
    $q->execute([(int)$_POST['appointment_id'],$_SESSION['user_id']]); $a=$q->fetch();
    if($a){
        $ref = 'PAY-' . strtoupper(substr(md5(uniqid()), 0, 10));
        try {
            $q=$pdo->prepare("INSERT INTO payments(appointment_id,customer_id,amount,payment_method,transaction_ref,payment_status,finance_status) VALUES(?,?,?,?,?,'pending','pending')");
            $q->execute([$a['appointment_id'],$_SESSION['user_id'],$a['total'],$_POST['payment_method'],$ref]);
        } catch(Exception $e) {
            $q=$pdo->prepare("INSERT INTO payments(appointment_id,customer_id,amount,payment_method,payment_status) VALUES(?,?,?,?,'pending')");
            $q->execute([$a['appointment_id'],$_SESSION['user_id'],$a['total'],$_POST['payment_method']]);
        }
        $message="Payment record submitted! It is now awaiting Finance Department verification and approval.";
    }
}
$q=$pdo->prepare("SELECT a.appointment_id,a.appointment_date,a.status,COALESCE(SUM(aps.quantity*aps.price),0) total FROM appointments a LEFT JOIN appointment_services aps ON a.appointment_id=aps.appointment_id WHERE a.customer_id=? GROUP BY a.appointment_id ORDER BY a.appointment_date DESC");
$q->execute([$_SESSION['user_id']]); $appointments=$q->fetchAll();
$q=$pdo->prepare("SELECT * FROM payments WHERE customer_id=? ORDER BY payment_date DESC");$q->execute([$_SESSION['user_id']]);$payments=$q->fetchAll();
$page_title="Payments"; include '../includes/header.php';
?>
<h1>Payments &amp; Billings</h1>
<?php if($message): ?><div class="success"><?= htmlspecialchars($message) ?></div><?php endif; ?>

<div style="background:linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%); color:#fff; border-radius:10px; padding:18px 24px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:center;">
    <div>
        <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:4px;"><i class="fas fa-university"></i> Business Receiving Account</div>
        <div style="font-size:1.1rem; font-weight:700;">Steve's Massage Parlour Ltd</div>
        <div style="font-size:0.85rem; opacity:0.9; margin-top:3px;">Equity Bank Kenya &mdash; Valley Arcade Branch</div>
        <div style="font-size:0.85rem; opacity:0.9;">Account No: <strong style="font-family:monospace; font-size:1rem; letter-spacing:1px;">0023456789</strong></div>
    </div>
    <div style="border-left:1px solid rgba(255,255,255,0.3); padding-left:20px;">
        <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:4px;"><i class="fas fa-mobile-alt"></i> M-Pesa Channels</div>
        <div style="font-size:0.88rem; opacity:0.95; margin-bottom:2px;"><span style="opacity:0.75;">Paybill:</span> <span style="font-family:monospace; font-size:1.25rem; font-weight:900; color:#A8EDBB;">400200</span></div>
        <div style="font-size:0.85rem; opacity:0.9;"><span style="opacity:0.75;">Account No:</span> <span style="font-family:monospace; font-weight:700;">Your Appointment Ref</span></div>
        <div style="font-size:0.82rem; opacity:0.75; margin-top:3px;">Buy Goods / Till: <strong style="font-family:monospace; color:#A8EDBB;">5278441</strong></div>
    </div>
</div>

<div class="form-box">
  <h2>Settle Payment Right After Booking</h2>
  <p class="text-muted" style="margin-bottom:14px; font-size:0.88rem;">Select your booked appointment and submit your settlement for immediate Finance Department verification.</p>
  <form method="post">
    <label>Select Booked Appointment</label>
    <select name="appointment_id" required>
      <option value="">Choose appointment...</option>
      <?php foreach($appointments as $a): ?>
        <option value="<?= $a['appointment_id'] ?>">Booking #<?= $a['appointment_id'] ?> | <?= $a['appointment_date'] ?> | KSh <?= number_format($a['total'],2) ?></option>
      <?php endforeach; ?>
    </select>
    <label>Payment Method</label>
    <select name="payment_method">
      <option value="mpesa">Safaricom M-Pesa (STK Push or Till/Paybill)</option>
      <option value="card">Credit / Debit Card</option>
      <option value="cash">Cash at Sanctuary Desk</option>
      <option value="bank">Bank Transfer (Equity Bank)</option>
    </select>
    <button class="btn btn-gold" style="margin-top:12px; width:100%;"><i class="fas fa-check-circle"></i> Submit Payment for Finance Clearance</button>
  </form>
</div>

<h2 style="margin-top:30px;">Payment History &amp; Clearance Status</h2>
<table class="custom-table" style="width:100%; margin-top:10px;">
  <thead>
    <tr>
      <th>Appointment</th>
      <th>Amount</th>
      <th>Method</th>
      <th>Status</th>
      <th>Finance Clearance</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach($payments as $p): ?>
      <tr>
        <td>#<?= $p['appointment_id'] ?></td>
        <td><strong>KSh <?= number_format($p['amount'],2) ?></strong></td>
        <td><?= htmlspecialchars($p['payment_method']) ?></td>
        <td><span class="badge"><?= htmlspecialchars($p['payment_status']) ?></span></td>
        <td>
          <span class="badge" style="<?= ($p['finance_status']??'') === 'pending' ? 'background:#fff3cd;color:#856404;' : 'background:#d4edda;color:#155724;' ?>">
            <?= htmlspecialchars(ucfirst($p['finance_status'] ?? 'approved')) ?>
          </span>
        </td>
        <td><?= $p['payment_date'] ?></td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php include '../includes/footer.php'; ?>
