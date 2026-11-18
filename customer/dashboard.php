<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('customer');

$page_title = "My Appointments - Steve's Massage Parlour";

// Handle Appointment Cancellation
if (isset($_GET['cancel_id'])) {
    $cId = (int)$_GET['cancel_id'];
    $uStmt = $pdo->prepare("UPDATE appointments SET status = 'cancelled' WHERE appointment_id = ? AND customer_id = ? AND status NOT IN ('completed', 'cancelled')");
    $uStmt->execute([$cId, $_SESSION['user_id']]);
    header("Location: dashboard.php?cancelled=1");
    exit;
}

$stmt = $pdo->prepare("SELECT a.*, s.service_name, s.duration, t.specialization, u.full_name as therapist_name, p.payment_method, p.payment_status, p.transaction_ref FROM appointments a JOIN services s ON a.service_id = s.service_id JOIN therapists t ON a.therapist_id = t.therapist_id JOIN users u ON t.user_id = u.user_id LEFT JOIN payments p ON a.appointment_id = p.appointment_id WHERE a.customer_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC");
$stmt->execute([$_SESSION['user_id']]);
$appointments = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-calendar-alt text-gold"></i> My Appointments & Bookings</h2>
        <p class="text-muted">Welcome, <?= htmlspecialchars($_SESSION['full_name']) ?> • Registered Client</p>
    </div>
    <div class="portal-actions">
        <a href="book.php" class="btn btn-gold"><i class="fas fa-plus-circle"></i> Book New Session</a>
    </div>
</div>

<?php if (isset($_GET['booked'])): ?>
    <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> <strong>Appointment Confirmed!</strong> Your booking reference is <strong><?= htmlspecialchars($_GET['ref'] ?? '') ?></strong>. We have scheduled your therapist and sent you a confirmation alert.
    </div>
<?php endif; ?>

<?php if (isset($_GET['cancelled'])): ?>
    <div class="alert alert-warning"><i class="fas fa-info-circle"></i> Appointment session cancelled.</div>
<?php endif; ?>

<div class="card">
    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3>My Booked Massage Sessions</h3>
        <span class="badge badge-primary"><?= count($appointments) ?> Total Bookings</span>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Ref No</th>
                    <th>Treatment Service</th>
                    <th>Specialist Therapist</th>
                    <th>Date & Time</th>
                    <th>Total (KES)</th>
                    <th>Session Status</th>
                    <th>Payment</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($appointments)): ?>
                    <tr>
                        <td colspan="8" style="text-align:center; padding:40px;">
                            <i class="fas fa-calendar-times" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:12px; display:block;"></i>
                            <h4>No Appointments Found</h4>
                            <p class="text-muted">You haven't scheduled any massage therapy sessions yet.</p>
                            <a href="book.php" class="btn btn-gold btn-sm" style="margin-top:10px;">Book Your First Session</a>
                        </td>
                    </tr>
                <?php else: foreach ($appointments as $a): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($a['reference_no']) ?></strong></td>
                        <td><?= htmlspecialchars($a['service_name']) ?> <small class="text-muted">(<?= $a['duration'] ?>m)</small></td>
                        <td><?= htmlspecialchars($a['therapist_name']) ?></td>
                        <td><?= $a['appointment_date'] ?> at <?= $a['appointment_time'] ?></td>
                        <td><strong>KES <?= number_format($a['total_price'], 2) ?></strong></td>
                        <td>
                            <span class="badge badge-<?= $a['status'] === 'completed' ? 'success' : ($a['status'] === 'cancelled' ? 'danger' : 'primary') ?>">
                                <?= strtoupper(str_replace('_', ' ', $a['status'])) ?>
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-<?= $a['payment_status'] === 'completed' ? 'success' : 'warning' ?>">
                                <?= strtoupper($a['payment_method'] ?? 'M-Pesa') ?> (<?= strtoupper($a['payment_status'] ?? 'Completed') ?>)
                            </span>
                        </td>
                        <td>
                            <?php if ($a['status'] !== 'cancelled' && $a['status'] !== 'completed'): ?>
                                <a href="dashboard.php?cancel_id=<?= $a['appointment_id'] ?>" class="btn btn-sm btn-outline" style="color:#C0392B; border-color:#C0392B;" onclick="return confirm('Cancel this appointment?');">
                                    Cancel
                                </a>
                            <?php else: ?>
                                <span class="text-muted" style="font-size:0.8rem;">Session <?= ucfirst($a['status']) ?></span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
