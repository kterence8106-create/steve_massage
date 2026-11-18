<?php
/**
 * Steve's Massage Parlour - Database Configuration & Helpers
 * DBIT 226 Research Project - Kenya Methodist University
 */

$host = "localhost";
$db   = "steve_massage";
$user = "root";
$pass = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false
        ]
    );
} catch (PDOException $e) {
    // If MySQL is not running or database is not yet created, display clear troubleshooting advice
    die("<div style='font-family:sans-serif; max-width:600px; margin:50px auto; padding:25px; border:2px solid #E74C3C; border-radius:10px; background:#FDF2E9;'>
        <h2 style='color:#C0392B; margin-top:0;'>⚠️ Database Connection Failed</h2>
        <p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>
        <hr style='border:none; border-top:1px solid #E0B4B4; margin:15px 0;'>
        <h4>Quick Fix for XAMPP:</h4>
        <ol>
            <li>Open the <strong>XAMPP Control Panel</strong> and click <strong>Start</strong> next to <strong>MySQL</strong>.</li>
            <li>Open your browser to <a href='http://localhost/phpmyadmin/' target='_blank'>http://localhost/phpmyadmin/</a></li>
            <li>Click <strong>Import</strong> and select <code>database/steve_massage.sql</code> to create the database and demo accounts.</li>
            <li>Refresh this page.</li>
        </ol>
    </div>");
}

/**
 * Normalizes Kenyan phone numbers to standard 10-digit format (07XXXXXXXX or 01XXXXXXXX)
 */
function normalize_phone($phone) {
    if (!$phone) return '';
    $p = preg_replace('/\s+/', '', trim((string)$phone));
    if (str_starts_with($p, '+254')) {
        $p = '0' . substr($p, 4);
    } elseif (str_starts_with($p, '254') && strlen($p) === 12) {
        $p = '0' . substr($p, 3);
    }
    return $p;
}

/**
 * Validates that a phone number is a valid 10-digit Kenyan phone number starting with 07 or 01
 */
function validate_phone($phone) {
    $clean = normalize_phone($phone);
    return (bool)preg_match('/^0[71]\d{8}$/', $clean);
}
?>
