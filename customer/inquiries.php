<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('customer');
$message="";
if($_SERVER['REQUEST_METHOD']==='POST'){
 $target_email = !empty($_POST['target_email']) ? trim($_POST['target_email']) : 'admin@stevesmassage.co.ke';
 $q=$pdo->prepare("INSERT INTO inquiries(user_id,full_name,email,phone,target_email,subject,message) SELECT user_id,full_name,email,phone,?,?,? FROM users WHERE user_id=?");
 $q->execute([$target_email,trim($_POST['subject']),trim($_POST['message']),$_SESSION['user_id']]); 
 $message="Your inquiry has been sent to " . htmlspecialchars($target_email) . ".";
}
$page_title="Inquiries"; include '../includes/header.php';
?>
<div class="form-box"><h2>Send an Inquiry to Management</h2><?php if($message): ?><div class="success"><?= $message ?></div><?php endif; ?>
<form method="post">
<label>Direct Inquiry To (Management Email)</label>
<select name="target_email" class="form-control" required style="width:100%; padding:10px; margin-bottom:12px;">
  <option value="admin@stevesmassage.co.ke">Steve Mwangi — General Management &amp; Executive (admin@stevesmassage.co.ke)</option>
  <option value="services@stevesmassage.co.ke">Lucas Ochieng — Spa Services &amp; Treatment Desk (services@stevesmassage.co.ke)</option>
  <option value="finance@stevesmassage.co.ke">Patrick Mutua — Finance &amp; Accounts Department (finance@stevesmassage.co.ke)</option>
  <option value="inventory@stevesmassage.co.ke">Mercy Chebet — Inventory &amp; Supplies Desk (inventory@stevesmassage.co.ke)</option>
  <option value="info@stevesmassage.co.ke">Customer Front Sanctuary Desk (info@stevesmassage.co.ke)</option>
</select>
<label>Subject</label><input name="subject" required><label>Message</label><textarea name="message" rows="6" required></textarea><button class="btn">Send</button></form></div>
<?php include '../includes/footer.php'; ?>
