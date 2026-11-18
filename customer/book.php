<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('customer');

$page_title = "Book a Massage Therapy Session - Steve's Massage Parlour";
$error = "";
$message = "";

// Fetch active services and therapists
$services = $pdo->query("SELECT * FROM services WHERE status = 'available' ORDER BY service_name ASC")->fetchAll();
$therapists = $pdo->query("SELECT t.therapist_id, t.specialization, t.rating, u.full_name FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.status = 'available' ORDER BY t.rating DESC")->fetchAll();

// Handle Booking Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $serviceId   = (int)($_POST['service_id'] ?? 0);
    $therapistId = !empty($_POST['therapist_id']) ? (int)$_POST['therapist_id'] : 0;
    $date        = trim($_POST['appointment_date'] ?? '');
    $time        = trim($_POST['appointment_time'] ?? '');
    $notes       = trim($_POST['notes'] ?? '');
    $payMethod   = trim($_POST['payment_method'] ?? 'mpesa');
    $mpesaPhone  = trim($_POST['mpesa_phone'] ?? '');

    // Validate Service
    $sStmt = $pdo->prepare("SELECT * FROM services WHERE service_id = ? AND status = 'available'");
    $sStmt->execute([$serviceId]);
    $service = $sStmt->fetch();

    if (!$service) {
        $error = "Please select a valid massage treatment offering.";
    } elseif (!$date || $date < date('Y-m-d')) {
        $error = "Please select a valid future appointment date.";
    } elseif (!$time) {
        $error = "Please choose a preferred appointment time slot.";
    } elseif ($payMethod === 'mpesa' && !validate_phone($mpesaPhone)) {
        $error = "Please enter a valid 10-digit M-Pesa phone number (e.g. 07XXXXXXXX or 01XXXXXXXX).";
    } else {
        // Auto-assign therapist if none selected or "any"
        if (!$therapistId) {
            $availT = $pdo->prepare("SELECT t.therapist_id FROM therapists t WHERE t.status = 'available' AND t.therapist_id NOT IN (
                SELECT therapist_id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled')
            ) ORDER BY t.rating DESC LIMIT 1");
            $availT->execute([$date, $time]);
            $therapistId = $availT->fetchColumn();
            
            if (!$therapistId && !empty($therapists[0])) {
                $therapistId = $therapists[0]['therapist_id'];
            }
        }

        // Verify that therapist is not already double-booked
        $conflict = $pdo->prepare("SELECT appointment_id FROM appointments WHERE therapist_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled')");
        $conflict->execute([$therapistId, $date, $time]);
        if ($conflict->fetch()) {
            $error = "The selected specialist is already scheduled at that time. Please pick another time slot or therapist.";
        } else {
            try {
                $pdo->beginTransaction();

                $refNo = "SMP-" . date('Y') . "-" . rand(1000, 9999);
                $totalPrice = (float)$service['price'];

                // 1. Insert Appointment
                $insA = $pdo->prepare("INSERT INTO appointments (reference_no, customer_id, therapist_id, service_id, appointment_date, appointment_time, total_price, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)");
                $insA->execute([$refNo, $_SESSION['user_id'], $therapistId, $serviceId, $date, $time, $totalPrice, $notes]);
                $apptId = $pdo->lastInsertId();

                // 2. Insert Payment Record
                $transRef = $payMethod === 'mpesa' ? "MPESA-" . strtoupper(bin2hex(random_bytes(4))) : "CASH-$refNo";
                $cleanMpesa = normalize_phone($mpesaPhone ?: $_SESSION['phone'] ?? '0700000000');
                
                $insP = $pdo->prepare("INSERT INTO payments (appointment_id, customer_id, amount, payment_method, transaction_ref, phone_number, payment_status) VALUES (?, ?, ?, ?, ?, ?, 'completed')");
                $insP->execute([$apptId, $_SESSION['user_id'], $totalPrice, $payMethod, $transRef, $cleanMpesa]);

                // 3. Record Finance Income Transaction
                $insF = $pdo->prepare("INSERT INTO finance_transactions (type, category, description, amount, transaction_date, reference_no) VALUES ('income', 'Service Revenue', ?, ?, ?, ?)");
                $insF->execute(["Appointment $refNo - {$service['service_name']}", $totalPrice, $date, $transRef]);

                // 4. Notifications
                // Customer SMS / In-App Notification
                $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'customer', 'Booking Confirmed!', ?)")
                    ->execute([$_SESSION['user_id'], "Your session for {$service['service_name']} on $date at $time is CONFIRMED. Ref: $refNo. Thank you for choosing Steve's Massage Parlour!"]);

                // Assigned Therapist Notification
                $tUser = $pdo->prepare("SELECT user_id FROM therapists WHERE therapist_id = ?");
                $tUser->execute([$therapistId]);
                $tuId = $tUser->fetchColumn();
                if ($tuId) {
                    $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'therapist', 'New Client Appointment Booked', ?)")
                        ->execute([$tuId, "Client {$_SESSION['full_name']} scheduled {$service['service_name']} with you on $date at $time. Ref: $refNo."]);
                }

                $pdo->commit();
                header("Location: dashboard.php?booked=1&ref=" . urlencode($refNo));
                exit;

            } catch (Exception $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                $error = "Error scheduling appointment: " . htmlspecialchars($e->getMessage());
            }
        }
    }
}

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-calendar-plus text-gold"></i> Book a Massage Therapy Session</h2>
        <p class="text-muted">Select your specialized treatment, choose a certified therapist, and schedule your appointment.</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> My Appointments</a>
    </div>
</div>

<?php if (isset($_GET['welcome'])): ?>
    <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> <strong>Account Created!</strong> Welcome, <?= htmlspecialchars($_SESSION['full_name']) ?>! You can now complete your first booking reservation below.
    </div>
<?php endif; ?>

<?php if ($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div><?php endif; ?>

<div class="card" style="max-width:800px; margin:0 auto;">
    <div class="card-header">
        <h3><i class="fas fa-spa text-gold"></i> Step-by-Step Therapy Reservation</h3>
    </div>
    <form method="post" style="padding:24px;">
        <div class="form-group">
            <label><strong>1. Select Massage Offering *</strong></label>
            <select name="service_id" id="service-select" required onchange="updateServiceInfo()">
                <option value="">-- Choose Treatment --</option>
                <?php foreach ($services as $s): ?>
                    <option value="<?= $s['service_id'] ?>" data-price="<?= $s['price'] ?>" data-duration="<?= $s['duration'] ?>" data-desc="<?= htmlspecialchars($s['description'] ?? '') ?>">
                        <?= htmlspecialchars($s['service_name']) ?> (<?= $s['duration'] ?> mins) - KES <?= number_format($s['price'], 2) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <div id="service-desc-box" style="display:none; margin-top:8px; padding:10px; background:#F4F9F5; border-radius:6px; font-size:0.85rem; color:#1C2E26;"></div>
        </div>

        <div class="form-group">
            <label><strong>2. Preferred Specialist / Therapist *</strong></label>
            <select name="therapist_id" required>
                <option value="0">Any Available Specialist (Recommended)</option>
                <?php foreach ($therapists as $t): ?>
                    <option value="<?= $t['therapist_id'] ?>">
                        ★ <?= $t['rating'] ?> | <?= htmlspecialchars($t['full_name']) ?> (<?= htmlspecialchars($t['specialization']) ?>)
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label><strong>3. Appointment Date *</strong></label>
                <input type="date" name="appointment_date" min="<?= date('Y-m-d') ?>" value="<?= date('Y-m-d') ?>" required>
            </div>
            <div class="form-group">
                <label><strong>4. Preferred Time Slot *</strong></label>
                <select name="appointment_time" required>
                    <option value="09:00">09:00 AM (Morning Session)</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="12:00">12:00 PM (Mid-Day)</option>
                    <option value="14:00" selected>02:00 PM (Afternoon)</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="17:00">05:00 PM (Evening Relaxation)</option>
                    <option value="18:30">06:30 PM</option>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label>Personal Health Preferences / Problem Focus Areas</label>
            <textarea name="notes" rows="2" placeholder="e.g. Chronic tension in neck & shoulders from computer desk work; prefer medium-firm pressure."></textarea>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Payment Method *</label>
                <select name="payment_method" id="pay-method" onchange="toggleMpesaField()">
                    <option value="mpesa">Safaricom M-Pesa STK (Instant)</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="cash">Pay Cash at Reception</option>
                </select>
            </div>
            <div class="form-group" id="mpesa-field">
                <label>M-Pesa Phone Number (10 Digits) *</label>
                <input type="tel" name="mpesa_phone" placeholder="07XXXXXXXX or 01XXXXXXXX" maxlength="10" value="0790123456">
                <small class="text-muted" style="font-size:0.75rem;">Instant M-Pesa prompt will be simulated</small>
            </div>
        </div>

        <!-- Business M-Pesa & Bank Payment Details -->
        <div id="mpesa-payment-info" style="background:#F0FFF4; border:1px solid #A9DFBF; border-radius:8px; padding:14px 18px; margin-bottom:16px; display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
                <div style="font-size:0.68rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:5px;"><i class="fas fa-mobile-alt"></i> Pay via M-Pesa Paybill</div>
                <div style="font-size:1.5rem; font-weight:900; color:#1a5c38; font-family:monospace; letter-spacing:2px;">400200</div>
                <div style="font-size:0.82rem; color:#333; margin-top:2px;">Account No: <strong>Your Booking Reference No.</strong></div>
                <div style="font-size:0.78rem; color:#555; margin-top:1px;">Buy Goods Till: <strong style="font-family:monospace;">5278441</strong></div>
            </div>
            <div style="border-left:1px solid #A9DFBF; padding-left:14px;">
                <div style="font-size:0.68rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:5px;"><i class="fas fa-university"></i> Bank Transfer</div>
                <div style="font-size:0.9rem; font-weight:700; color:#1a5c38;">Equity Bank Kenya</div>
                <div style="font-size:0.82rem; color:#333; margin-top:2px;">Branch: Valley Arcade, Nairobi</div>
                <div style="font-size:0.82rem; color:#333;">Account: <strong style="font-family:monospace;">0023456789</strong></div>
                <div style="font-size:0.78rem; color:#555; margin-top:1px;">Name: Steve's Massage Parlour Ltd</div>
            </div>
        </div>

        <div style="background:#FAFBF9; border:1px solid var(--border); padding:16px; border-radius:8px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span class="text-muted">Total Session Fee:</span>
                <h3 id="fee-display" style="margin:2px 0 0; color:var(--primary);">KES 3,500.00</h3>
            </div>
            <div>
                <span class="badge badge-success"><i class="fas fa-shield-alt"></i> Guaranteed Appointment</span>
            </div>
        </div>

        <button type="submit" class="btn btn-gold" style="width:100%; padding:14px; font-size:1.05rem;">
            <i class="fas fa-calendar-check"></i> Complete & Confirm Appointment Booking
        </button>
    </form>
</div>

<script>
function updateServiceInfo() {
    const sel = document.getElementById('service-select');
    const opt = sel.options[sel.selectedIndex];
    const box = document.getElementById('service-desc-box');
    const fee = document.getElementById('fee-display');
    if (opt && opt.value) {
        box.style.display = 'block';
        box.textContent = opt.dataset.desc;
        fee.textContent = "KES " + parseFloat(opt.dataset.price).toLocaleString('en-KE', {minimumFractionDigits: 2});
    } else {
        box.style.display = 'none';
        fee.textContent = "KES 0.00";
    }
}

function toggleMpesaField() {
    const method = document.getElementById('pay-method').value;
    const field = document.getElementById('mpesa-field');
    field.style.display = method === 'mpesa' ? 'block' : 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    updateServiceInfo();
});
</script>

<?php include '../includes/footer.php'; ?>
