<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('customer');

$appt_id = isset($_GET['appt']) ? (int)$_GET['appt'] : 0;
$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("
    SELECT a.*, 
           u.full_name as customer_name, u.phone as customer_phone, u.email as customer_email,
           t_user.full_name as therapist_name,
           s.service_name, s.price as service_price, s.duration,
           p.payment_id, p.payment_method, p.amount as amount_paid, p.payment_status, 
           p.transaction_ref, p.finance_status, p.finance_reviewed_by, p.payment_date
    FROM appointments a
    JOIN users u ON a.customer_id = u.user_id
    LEFT JOIN therapists th ON a.therapist_id = th.therapist_id
    LEFT JOIN users t_user ON th.user_id = t_user.user_id
    LEFT JOIN services s ON a.service_id = s.service_id
    LEFT JOIN payments p ON p.appointment_id = a.appointment_id
    WHERE a.appointment_id = ? AND a.customer_id = ?
");
$stmt->execute([$appt_id, $user_id]);
$record = $stmt->fetch();

if (!$record) {
    die("Booking receipt not found or access denied.");
}

$page_title = "Official Booking Receipt - " . htmlspecialchars($record['reference_no'] ?? 'SMP-' . $record['appointment_id']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= $page_title ?></title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { background: #f4f6f8; padding: 30px; font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; }
        .receipt-card { max-width: 650px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 35px; border: 1px solid #e0e0e0; }
        .receipt-header { text-align: center; border-bottom: 2px solid #2D6A4F; padding-bottom: 16px; margin-bottom: 22px; }
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem; }
        .receipt-table td { padding: 8px 6px; }
        .receipt-table tr:nth-child(even) { background: #fcfcfc; }
        .total-box { background: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .badge-approved { background: #2E7D32; color: #fff; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }
        .badge-pending { background: #F39C12; color: #fff; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }
        @media print {
            body { background: #fff; padding: 0; }
            .receipt-card { box-shadow: none; border: none; padding: 15px; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>

<div class="receipt-card">
    <div class="receipt-header">
        <h2 style="margin:0; color:#1A472A; letter-spacing:1px;">STEVE'S MASSAGE PARLOUR LTD</h2>
        <p style="margin:4px 0; font-size:0.85rem; color:#555;">Valley Arcade, Gitanga Rd, Nairobi &bull; Telephone: +254 712 345 678</p>
        <p style="margin:2px 0; font-size:0.8rem; color:#777;">Licensed Wellness Sanctuary &bull; KRA PIN: P051234567Z</p>
        <div style="margin-top:10px;">
            <span style="background:#2D6A4F; color:#fff; font-size:0.8rem; padding:4px 14px; border-radius:15px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">
                Official Booking &amp; Payment Receipt
            </span>
        </div>
    </div>

    <div style="display:flex; justify-content:space-between; background:#F8F9FA; padding:12px 16px; border-radius:8px; margin-bottom:20px; font-size:0.9rem;">
        <div><span style="color:#666;">Booking Ref:</span> <strong style="color:#1A472A; font-family:monospace; font-size:1.05rem;"><?= htmlspecialchars($record['reference_no'] ?? 'SMP-' . $record['appointment_id']) ?></strong></div>
        <div><span style="color:#666;">Issue Date:</span> <strong><?= date('Y-m-d') ?></strong></div>
    </div>

    <table class="receipt-table">
        <tr>
            <td style="width:40%; color:#666;"><i class="fas fa-user" style="color:#D4AF37;"></i> Client Name:</td>
            <td><strong><?= htmlspecialchars($record['customer_name']) ?></strong></td>
        </tr>
        <tr>
            <td style="color:#666;"><i class="fas fa-phone" style="color:#D4AF37;"></i> Mobile Phone:</td>
            <td><?= htmlspecialchars($record['customer_phone'] ?? 'On File') ?></td>
        </tr>
        <tr>
            <td style="color:#666;"><i class="fas fa-spa" style="color:#D4AF37;"></i> Massage Service:</td>
            <td><strong><?= htmlspecialchars($record['service_name'] ?? 'Wellness Massage') ?></strong></td>
        </tr>
        <tr>
            <td style="color:#666;"><i class="fas fa-user-md" style="color:#D4AF37;"></i> Assigned Therapist:</td>
            <td><?= htmlspecialchars($record['therapist_name'] ?? 'Certified Specialist') ?></td>
        </tr>
        <tr>
            <td style="color:#666;"><i class="fas fa-calendar-alt" style="color:#D4AF37;"></i> Appointment Date &amp; Time:</td>
            <td><strong><?= htmlspecialchars($record['appointment_date']) ?> at <?= htmlspecialchars($record['appointment_time']) ?></strong></td>
        </tr>
        <tr>
            <td style="color:#666;"><i class="fas fa-wallet" style="color:#D4AF37;"></i> Payment Method:</td>
            <td><?= htmlspecialchars(strtoupper($record['payment_method'] ?? 'M-PESA')) ?></td>
        </tr>
        <tr>
            <td style="color:#666;"><i class="fas fa-barcode" style="color:#D4AF37;"></i> Transaction Reference:</td>
            <td><code><?= htmlspecialchars($record['transaction_ref'] ?? 'PENDING') ?></code></td>
        </tr>
    </table>

    <div class="total-box">
        <div>
            <div style="font-size:0.8rem; color:#2E7D32; font-weight:700; text-transform:uppercase;">Total Amount Settled</div>
            <div style="font-size:1.5rem; font-weight:800; color:#1B5E20;">KES <?= number_format($record['amount_paid'] ?? $record['total_price'] ?? 0, 2) ?></div>
        </div>
        <div>
            <?php if (($record['finance_status'] ?? '') === 'approved' || ($record['payment_status'] ?? '') === 'completed'): ?>
                <span class="badge-approved"><i class="fas fa-check-double"></i> FINANCE CLEARED</span>
                <div style="font-size:0.72rem; color:#2E7D32; margin-top:4px; text-align:right;">Patrick Mutua &bull; Finance Director</div>
            <?php else: ?>
                <span class="badge-pending"><i class="fas fa-clock"></i> PENDING FINANCE AUDIT</span>
            <?php endif; ?>
        </div>
    </div>

    <div style="background:#FAFAFA; border:1px solid #EEE; border-radius:8px; padding:12px 16px; font-size:0.8rem; color:#666; line-height:1.5; margin-bottom:24px;">
        <strong>Guest Policy:</strong> Please arrive 15 minutes before your treatment time. Complimentary green tea and luxury lockers are provided. Regulated under the Kenya Data Protection Act 2019. Thank you for choosing Steve's Massage Parlour!
    </div>

    <div class="no-print" style="display:flex; justify-content:center; gap:12px;">
        <button class="btn btn-gold" onclick="window.print()"><i class="fas fa-print"></i> Print Receipt</button>
        <a href="payments.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to Payments</a>
    </div>
</div>

</body>
</html>
