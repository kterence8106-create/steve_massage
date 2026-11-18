<?php
require '../config/database.php';
require '../includes/auth.php';
require_role('therapist');

$userId = (int)$_SESSION['user_id'];
$q = $pdo->prepare("SELECT t.*, u.full_name, u.phone, u.email FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.user_id = ?");
$q->execute([$userId]);
$therapist = $q->fetch();

if (!$therapist) {
    die("Therapist record not found for your account. Please contact the administrator.");
}

$page_title = "Therapist Clinical Portal - " . $therapist['full_name'];

// Handle Status Update or Clinical Notes Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_status'])) {
        $apptId = (int)$_POST['appointment_id'];
        $newStatus = $_POST['status'];
        $uStmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE appointment_id = ? AND therapist_id = ?");
        $uStmt->execute([$newStatus, $apptId, $therapist['therapist_id']]);
        header("Location: dashboard.php?updated=1");
        exit;
    }
    if (isset($_POST['save_treatment_notes'])) {
        $apptId = (int)$_POST['appointment_id'];
        $notes = trim($_POST['treatment_notes'] ?? '');
        $nStmt = $pdo->prepare("UPDATE appointments SET treatment_notes = ? WHERE appointment_id = ? AND therapist_id = ?");
        $nStmt->execute([$notes, $apptId, $therapist['therapist_id']]);
        header("Location: dashboard.php?notes_saved=1");
        exit;
    }
}

// Fetch Appointments strictly assigned to this therapist
$apptsStmt = $pdo->prepare("SELECT a.*, u.full_name as customer_name, u.phone as customer_phone, s.service_name, s.duration, p.payment_method, p.payment_status FROM appointments a JOIN users u ON a.customer_id = u.user_id JOIN services s ON a.service_id = s.service_id LEFT JOIN payments p ON a.appointment_id = p.appointment_id WHERE a.therapist_id = ? ORDER BY a.appointment_date DESC, a.appointment_time ASC");
$apptsStmt->execute([$therapist['therapist_id']]);
$appointments = $apptsStmt->fetchAll();

// Telemetry
$totalAssigned = count($appointments);
$completedCount = count(array_filter($appointments, fn($a) => $a['status'] === 'completed'));
$todayDate = date('Y-m-d');
$todayCount = count(array_filter($appointments, fn($a) => $a['appointment_date'] === $todayDate));

include '../includes/header.php';
?>

<div class="portal-header">
    <div>
        <h2><i class="fas fa-user-md text-gold"></i> Therapist Clinical Dashboard</h2>
        <p class="text-muted">Welcome, <strong><?= htmlspecialchars($therapist['full_name']) ?></strong> • <?= htmlspecialchars($therapist['specialization']) ?> (★ <?= $therapist['rating'] ?>/5.0)</p>
    </div>
    <div class="portal-actions">
        <a href="dashboard.php" class="btn btn-gold btn-sm"><i class="fas fa-sync-alt"></i> Refresh Schedule</a>
    </div>
</div>

<?php if (isset($_GET['updated'])): ?>
    <div class="alert alert-success"><i class="fas fa-check-circle"></i> Appointment session status updated!</div>
<?php endif; ?>

<?php if (isset($_GET['notes_saved'])): ?>
    <div class="alert alert-success"><i class="fas fa-notes-medical"></i> Clinical treatment notes saved successfully!</div>
<?php endif; ?>

<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-icon primary"><i class="fas fa-calendar-check"></i></div>
        <div class="kpi-info">
            <h4>Total Assigned Sessions</h4>
            <h2><?= $totalAssigned ?> Clients</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon gold"><i class="fas fa-clock"></i></div>
        <div class="kpi-info">
            <h4>Scheduled Today</h4>
            <h2><?= $todayCount ?> Sessions</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon success"><i class="fas fa-check-double"></i></div>
        <div class="kpi-info">
            <h4>Completed Therapies</h4>
            <h2><?= $completedCount ?> Sessions</h2>
        </div>
    </div>
    <div class="kpi-card">
        <div class="kpi-icon primary"><i class="fas fa-star"></i></div>
        <div class="kpi-info">
            <h4>Therapist Rating</h4>
            <h2 class="text-gold">★ <?= $therapist['rating'] ?> / 5.0</h2>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3><i class="fas fa-calendar-alt text-gold"></i> My Client Schedule & Treatment Records</h3>
        <span class="badge badge-primary"><?= $totalAssigned ?> Total</span>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Ref No</th>
                    <th>Client Name</th>
                    <th>Contact</th>
                    <th>Treatment Service</th>
                    <th>Date & Time</th>
                    <th>Client Request</th>
                    <th>Session Status</th>
                    <th>Clinical Notes</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($appointments)): ?>
                    <tr><td colspan="8" style="text-align:center; padding:40px;" class="text-muted">No appointments currently assigned to your schedule.</td></tr>
                <?php else: foreach ($appointments as $a): 
                    $isToday = $a['appointment_date'] === $todayDate;
                ?>
                    <tr style="<?= $isToday ? 'background:#F8FBF8;' : '' ?>">
                        <td>
                            <strong><?= htmlspecialchars($a['reference_no']) ?></strong>
                            <?php if ($isToday): ?><span class="badge badge-success" style="font-size:0.65rem;">TODAY</span><?php endif; ?>
                        </td>
                        <td><strong><?= htmlspecialchars($a['customer_name']) ?></strong></td>
                        <td><small><?= htmlspecialchars($a['customer_phone'] ?? '—') ?></small></td>
                        <td><?= htmlspecialchars($a['service_name']) ?> <small class="text-muted">(<?= $a['duration'] ?>m)</small></td>
                        <td>
                            <strong><?= $a['appointment_date'] ?></strong><br>
                            <small class="text-muted"><?= $a['appointment_time'] ?></small>
                        </td>
                        <td><small class="text-muted"><?= htmlspecialchars($a['notes'] ?: 'Standard service') ?></small></td>
                        <td>
                            <form method="post" style="display:inline;">
                                <input type="hidden" name="update_status" value="1">
                                <input type="hidden" name="appointment_id" value="<?= $a['appointment_id'] ?>">
                                <select name="status" onchange="this.form.submit()" style="padding:4px 8px; font-size:0.8rem; border-radius:4px;">
                                    <option value="pending" <?= $a['status'] === 'pending' ? 'selected' : '' ?>>Pending</option>
                                    <option value="confirmed" <?= $a['status'] === 'confirmed' ? 'selected' : '' ?>>Confirmed</option>
                                    <option value="in_session" <?= $a['status'] === 'in_session' ? 'selected' : '' ?>>In-Session</option>
                                    <option value="completed" <?= $a['status'] === 'completed' ? 'selected' : '' ?>>Completed</option>
                                    <option value="cancelled" <?= $a['status'] === 'cancelled' ? 'selected' : '' ?>>Cancelled</option>
                                </select>
                            </form>
                        </td>
                        <td>
                            <button type="button" class="btn btn-sm btn-gold" onclick="openNotesModal(<?= $a['appointment_id'] ?>, '<?= htmlspecialchars(addslashes($a['customer_name'])) ?>', '<?= htmlspecialchars(addslashes($a['treatment_notes'] ?? '')) ?>')">
                                <i class="fas fa-notes-medical"></i> <?= $a['treatment_notes'] ? 'Edit Notes' : 'Add Notes' ?>
                            </button>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal for Clinical Notes -->
<div id="notes-modal" class="modal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.5);">
    <div style="background:#fff; max-width:550px; margin:80px auto; border-radius:10px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.3);">
        <div style="background:var(--primary); color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; color:#fff;"><i class="fas fa-notes-medical text-gold"></i> Clinical Treatment Record</h3>
            <button type="button" onclick="closeNotesModal()" style="background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>
        <form method="post" style="padding:24px;">
            <input type="hidden" name="save_treatment_notes" value="1">
            <input type="hidden" name="appointment_id" id="modal-appt-id">
            <p>Document patient muscle findings, pressure tolerance, and aftercare guidance for <strong id="modal-client-name"></strong>:</p>
            <div class="form-group">
                <label>Treatment Observations & Recommendations</label>
                <textarea name="treatment_notes" id="modal-notes" rows="5" required placeholder="e.g. Applied firm trigger point pressure on rhomboids and upper traps. Recommended daily ergonomic stretching."></textarea>
            </div>
            <div style="text-align:right; margin-top:16px;">
                <button type="button" class="btn btn-outline" onclick="closeNotesModal()">Cancel</button>
                <button type="submit" class="btn btn-gold"><i class="fas fa-save"></i> Save Treatment Notes</button>
            </div>
        </form>
    </div>
</div>

<script>
function openNotesModal(apptId, clientName, existingNotes) {
    document.getElementById('modal-appt-id').value = apptId;
    document.getElementById('modal-client-name').textContent = clientName;
    document.getElementById('modal-notes').value = existingNotes;
    document.getElementById('notes-modal').style.display = 'block';
}

function closeNotesModal() {
    document.getElementById('notes-modal').style.display = 'none';
}
</script>

<?php include '../includes/footer.php'; ?>
