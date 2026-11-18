<?php
require 'config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

$page_title = "Create Client Account - Steve's Massage Parlour";
$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['full_name'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $rawPhone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$name || !$email || !$rawPhone || !$password) {
        $error = "Please fill in all required fields.";
    } elseif (!validate_phone($rawPhone)) {
        $error = "Please enter a valid 10-digit Kenyan phone number (e.g. 07XXXXXXXX or 01XXXXXXXX).";
    } elseif (strlen($password) < 6) {
        $error = "Password must be at least 6 characters long.";
    } else {
        $cleanPhone = normalize_phone($rawPhone);
        
        // Check if email already registered
        $check = $pdo->prepare("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)");
        $check->execute([$email]);
        if ($check->fetch()) {
            $error = "An account with this email address already exists. Please log in.";
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, 'customer')");
            $stmt->execute([$name, strtolower($email), $cleanPhone, $hash]);
            $newId = $pdo->lastInsertId();

            // Auto-login the new user so they continue immediately into booking
            session_regenerate_id(true);
            $_SESSION['user_id']   = $newId;
            $_SESSION['full_name'] = $name;
            $_SESSION['role']      = 'customer';
            $_SESSION['email']     = strtolower($email);

            // Welcome notification
            try {
                $nStmt = $pdo->prepare("INSERT INTO notifications (user_id, role_target, title, message) VALUES (?, 'customer', 'Welcome to Steve\'s Massage Parlour!', 'Your account has been created. Book your personalized therapy session online anytime.')");
                $nStmt->execute([$newId]);
            } catch (Exception $e) {}

            header("Location: customer/book.php?welcome=1");
            exit;
        }
    }
}

include 'includes/header.php';
?>

<div class="auth-container">
    <div class="form-box">
        <h2><i class="fas fa-user-plus"></i> Create Client Account</h2>
        <p class="text-muted">Register to schedule appointments, track therapy sessions, and view receipts.</p>

        <?php if ($error): ?>
            <div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="post">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="full_name" required placeholder="e.g. Terence Mwaaki" value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>">
            </div>
            <div class="form-group">
                <label>Phone Number (10 Digits)</label>
                <input type="tel" name="phone" required placeholder="07XXXXXXXX or 01XXXXXXXX" maxlength="10" value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>">
                <small class="text-muted" style="font-size:0.75rem;">Enter 10-digit number (e.g. 0712345678)</small>
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="name@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
            </div>
            <div class="form-group">
                <label>Create Password</label>
                <input type="password" name="password" required placeholder="At least 6 characters" minlength="6">
            </div>
            <button class="btn btn-gold" type="submit" style="width:100%; margin-top:10px;">
                <i class="fas fa-check-circle"></i> Create Account & Continue to Booking
            </button>
        </form>

        <p style="margin-top:20px; text-align:center;">
            Already have an account? <a href="login.php" style="color:var(--accent); font-weight:700;">Sign In</a>
        </p>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
