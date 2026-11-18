<?php
if (session_status() === PHP_SESSION_NONE) session_start();
$base = (isset($_SERVER['SCRIPT_NAME']) && strpos($_SERVER['SCRIPT_NAME'], '/steve_massage') === 0) ? '/steve_massage' : '';
$role = $_SESSION['role'] ?? null;
$userName = $_SESSION['full_name'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($page_title ?? "Steve's Massage Parlour") ?></title>
<link rel="stylesheet" href="<?= $base ?>/assets/css/style.css">
<!-- FontAwesome for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
<header class="topbar">
    <a class="brand" href="<?= $base ?>/index.php">
        <i class="fas fa-spa"></i> Steve's Massage Parlour
    </a>
    <nav class="nav-links">
        <a href="<?= $base ?>/index.php"><i class="fas fa-home"></i> Home</a>
        <a href="<?= $base ?>/index.php#services"><i class="fas fa-list"></i> Services</a>
        
        <?php if (!empty($_SESSION['user_id'])): ?>
            <?php if ($role === 'admin'): ?>
                <a href="<?= $base ?>/admin/dashboard.php"><i class="fas fa-user-shield"></i> Admin</a>
                <a href="<?= $base ?>/inventory/dashboard.php"><i class="fas fa-boxes"></i> Inventory</a>
                <a href="<?= $base ?>/finance/dashboard.php"><i class="fas fa-wallet"></i> Finance</a>
                <a href="<?= $base ?>/finance/supplier_payments.php"><i class="fas fa-money-check-alt"></i> Supplier Payments</a>
            <?php elseif ($role === 'inventory_manager'): ?>
                <a href="<?= $base ?>/inventory/dashboard.php"><i class="fas fa-boxes"></i> Inventory Dashboard</a>
                <a href="<?= $base ?>/inventory/inventory.php"><i class="fas fa-warehouse"></i> Stock Catalog</a>
                <a href="<?= $base ?>/inventory/purchase_orders.php"><i class="fas fa-file-invoice"></i> Purchase Orders</a>
            <?php elseif ($role === 'finance_officer'): ?>
                <a href="<?= $base ?>/finance/dashboard.php"><i class="fas fa-wallet"></i> Finance Dashboard</a>
                <a href="<?= $base ?>/finance/po_approvals.php"><i class="fas fa-clipboard-check"></i> PO Approvals</a>
                <a href="<?= $base ?>/finance/supplier_payments.php"><i class="fas fa-money-check-alt"></i> Supplier Payments</a>
                <a href="<?= $base ?>/finance/transactions.php"><i class="fas fa-receipt"></i> Transactions</a>
            <?php elseif ($role === 'supplier'): ?>
                <a href="<?= $base ?>/supplier/dashboard.php"><i class="fas fa-truck-loading"></i> Supplier Dashboard</a>
                <a href="<?= $base ?>/supplier/orders.php"><i class="fas fa-file-invoice-dollar"></i> My Orders</a>
                <a href="<?= $base ?>/supplier/notifications.php"><i class="fas fa-bell"></i> Alerts</a>
            <?php elseif ($role === 'therapist'): ?>
                <a href="<?= $base ?>/therapist/dashboard.php"><i class="fas fa-calendar-check"></i> My Schedule</a>
            <?php else: ?>
                <a href="<?= $base ?>/customer/dashboard.php"><i class="fas fa-user"></i> My Bookings</a>
                <a class="nav-btn" href="<?= $base ?>/customer/book.php"><i class="fas fa-plus-circle"></i> Book Session</a>
            <?php endif; ?>
            
            <span class="user-badge"><i class="fas fa-user-circle"></i> <?= htmlspecialchars($userName) ?> (<?= strtoupper($role) ?>)</span>
            <a href="<?= $base ?>/logout.php" class="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a>
        <?php else: ?>
            <a href="<?= $base ?>/login.php"><i class="fas fa-sign-in-alt"></i> Sign In</a>
            <a class="nav-btn" href="<?= $base ?>/register.php"><i class="fas fa-user-plus"></i> Register as Client</a>
        <?php endif; ?>
    </nav>
</header>
<main class="container">
