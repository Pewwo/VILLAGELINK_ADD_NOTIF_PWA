<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");  // Allow CORS for all origins
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection config
$host = 'localhost';
$username = "u503753529_pewwo"; // Updated for Hostinger
$password = "Pewwo@666"; // Updated for Hostinger
$dbname = "u503753529_villagelink_db"; // Updated for Hostinger

try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$sql = "SELECT
        id,
        last_name,
        first_name,
        middle_name,
        id_number,
        address,
        purpose_of_visit,
        created_at,
        updated_at
        FROM villagelink_visitorslogs ORDER BY created_at DESC";

try {
    $stmt = $pdo->query($sql);
    $visitorLogs = $stmt->fetchAll();
    echo json_encode($visitorLogs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch visitor logs: ' . $e->getMessage()]);
}

$pdo = null;
?>
