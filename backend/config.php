<?php
// -------------------------------------------------------------
// CONFIG.PHP - Environment-aware database configuration
// -------------------------------------------------------------

// Detect current environment based on hostname
$hostname = $_SERVER['HTTP_HOST'] ?? 'localhost';

// ✅ LOCAL DEVELOPMENT (e.g., localhost, 127.0.0.1, localhost:5173, etc.)
if (str_contains($hostname, 'localhost') || str_contains($hostname, '127.0.0.1')) {

    define("DB_HOST", "localhost");       // Localhost (XAMPP/WAMP)
    define("DB_USER", "root");            // Default MySQL user
    define("DB_PASS", "");                // No password by default - update if your MySQL has a password
    define("DB_NAME", "villagelink_db");  // Your local database name

    // Flag to indicate local environment
    define("IS_LOCAL", true);

} else {
    // ✅ HOSTED PRODUCTION (Hostinger)
    define("DB_HOST", "mysql.hostinger.com");
    define("DB_USER", "u503753529_pewwo");
    define("DB_PASS", "Pewwo@666"); // Updated password for Hostinger
    define("DB_NAME", "u503753529_villagelink_db");

    // Flag to indicate production
    define("IS_LOCAL", false);
}

// -------------------------------------------------------------
// OPTIONAL: Set timezone
// -------------------------------------------------------------
date_default_timezone_set('Asia/Manila');

// -------------------------------------------------------------
// MAIN DATABASE CONNECTION (used across backend)
// -------------------------------------------------------------
$main_conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($main_conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $main_conn->connect_error
    ]));
}

// -------------------------------------------------------------
// OPTIONAL: Dual Database Connection (Local + Hosted)
// Use only if you want to write to both simultaneously
// -------------------------------------------------------------
// Example usage:
// if (IS_LOCAL) {
//     $remote_conn = new mysqli("mysql.hostinger.com", "u503753529_pewwo", "", "u503753529_villagelink_db");
// }

?>
