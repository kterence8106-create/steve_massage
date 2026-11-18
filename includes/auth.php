<?php
if (session_status() === PHP_SESSION_NONE) session_start();

function require_login() {
    if (empty($_SESSION['user_id'])) {
        header("Location: /steve_massage/login.php");
        exit;
    }
}

/**
 * Enforce role access control. Accepts a string or an array of allowed roles.
 */
function require_role($roles) {
    require_login();
    $currentRole = $_SESSION['role'] ?? '';
    
    if (is_array($roles)) {
        if (!in_array($currentRole, $roles, true)) {
            http_response_code(403);
            exit("<div style='font-family:sans-serif; text-align:center; padding:50px;'>
                <h2 style='color:#C0392B;'>403 Access Restricted</h2>
                <p>This module requires authorized permissions. Your active role is <strong>" . htmlspecialchars(strtoupper($currentRole)) . "</strong>.</p>
                <p><a href='/steve_massage/login.php'>Sign in with an authorized account</a> | <a href='/steve_massage/index.php'>Back to Home</a></p>
            </div>");
        }
    } else {
        if ($currentRole !== $roles && $currentRole !== 'admin') {
            http_response_code(403);
            exit("<div style='font-family:sans-serif; text-align:center; padding:50px;'>
                <h2 style='color:#C0392B;'>403 Access Restricted</h2>
                <p>This module requires <strong>" . htmlspecialchars(strtoupper($roles)) . "</strong> permissions. Your active role is <strong>" . htmlspecialchars(strtoupper($currentRole)) . "</strong>.</p>
                <p><a href='/steve_massage/login.php'>Sign in with an authorized account</a> | <a href='/steve_massage/index.php'>Back to Home</a></p>
            </div>");
        }
    }
}

function has_role($role) {
    return ($_SESSION['role'] ?? '') === $role;
}
?>
