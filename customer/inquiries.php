<?php
require '../config/database.php'; require '../includes/auth.php'; require_role('customer');
$message="";
if($_SERVER['REQUEST_METHOD']==='POST'){
 $q=$pdo->prepare("INSERT INTO inquiries(user_id,full_name,email,phone,subject,message) SELECT user_id,full_name,email,phone,?,? FROM users WHERE user_id=?");
 $q->execute([trim($_POST['subject']),trim($_POST['message']),$_SESSION['user_id']]); $message="Your inquiry has been sent.";
}
$page_title="Inquiries"; include '../includes/header.php';
?>
<div class="form-box"><h2>Send an Inquiry</h2><?php if($message): ?><div class="success"><?= $message ?></div><?php endif; ?>
<form method="post"><label>Subject</label><input name="subject" required><label>Message</label><textarea name="message" rows="6" required></textarea><button class="btn">Send</button></form></div>
<?php include '../includes/footer.php'; ?>
