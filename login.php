<?php
require 'config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

$message = isset($_GET['registered']) ? "Registration successful! Welcome to Steve's Massage Parlour. Please login to continue." : "";
$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$email || !$password) {
        $error = "Please enter both email and password.";
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$email]);
        $u = $stmt->fetch();

        if ($u && password_verify($password, $u['password'])) {
            session_regenerate_id(true);
            $_SESSION['user_id']     = $u['user_id'];
            $_SESSION['full_name']   = $u['full_name'];
            $_SESSION['role']        = $u['role'];
            $_SESSION['email']       = $u['email'];
            $_SESSION['supplier_id'] = $u['supplier_id'] ?? null;

            // Role-based dashboard dispatching
            switch ($u['role']) {
                case 'admin':
                    header("Location: admin/dashboard.php");
                    break;
                case 'inventory_manager':
                    header("Location: inventory/dashboard.php");
                    break;
                case 'finance_officer':
                    header("Location: finance/dashboard.php");
                    break;
                case 'supplier':
                    header("Location: supplier/dashboard.php");
                    break;
                case 'therapist':
                    header("Location: therapist/dashboard.php");
                    break;
                default:
                    // Customers redirect to booking if booking parameter is set, or customer dashboard
                    if (!empty($_GET['redirect']) && $_GET['redirect'] === 'book') {
                        header("Location: customer/book.php");
                    } else {
                        header("Location: customer/dashboard.php");
                    }
                    break;
            }
            exit;
        } else {
            $error = "Invalid email or password. Please try again.";
        }
    }
}

$page_title = "Sign In - Steve's Massage Parlour";
include 'includes/header.php';
?>

<div class="auth-container">
    <div class="form-box">
        <h2><i class="fas fa-sign-in-alt"></i> Sign In to Your Account</h2>
        <p class="text-muted">Access your personalized portal according to your assigned role.</p>

        <?php if ($message): ?>
            <div class="alert alert-success"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="post">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="name@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <button class="btn btn-gold" type="submit" style="width:100%; margin-top:10px;">
                <i class="fas fa-arrow-right"></i> Sign In
            </button>
        </form>

        <p style="margin-top:20px; text-align:center;">
            Don't have an account? <a href="register.php" style="color:var(--accent); font-weight:700;">Register as Client</a>
        </p>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
