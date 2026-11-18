<?php
require 'config/database.php';
$page_title = "Home";
include 'includes/header.php';
$services = $pdo->query("SELECT * FROM services WHERE status='available' ORDER BY service_id DESC")->fetchAll();
?>
<section class="hero">
    <div>
        <p class="eyebrow">RELAX • RESTORE • RECHARGE</p>
        <h1>Professional massage care for your body and mind.</h1>
        <p>Book a massage session with Steve's Massage Parlour and enjoy professional, comfortable treatment.</p>
        <a class="btn" href="register.php">Book a Session</a>
    </div>
</section>

<section id="services">
<h2>Our Services</h2>
<div class="cards">
<?php foreach ($services as $s): ?>
<div class="card">
    <h3><?= htmlspecialchars($s['service_name']) ?></h3>
    <p><?= htmlspecialchars($s['description']) ?></p>
    <strong>KSh <?= number_format($s['price'],2) ?></strong>
    <p><?= (int)$s['duration'] ?> minutes</p>
</div>
<?php endforeach; ?>
</div>
</section>

<section class="info-grid">
<div><h2>Why choose us?</h2><p>Professional therapists, convenient scheduling and a simple booking system.</p></div>
<div><h2>Contact</h2><p>Call: 0700 000 000<br>Email: info@stevesmassage.com</p></div>
</section>
<?php include 'includes/footer.php'; ?>
