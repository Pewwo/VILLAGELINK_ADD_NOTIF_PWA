<?php
header('Content-Type: application/json');

// Allow CORS for local development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database connection config
$host = 'localhost';
$username = "u503753529_pewwo";
$password = "Pewwo@666";
$dbname = "u503753529_villagelink_db";

try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Database connection failed: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed', 'debug' => $e->getMessage()]);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Debug: Log received JSON data
error_log('Received JSON data: ' . $input);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit();
}

// Get data
$id = $data['id'] ?? '';
$updated_at = $data['updated_at'] ?? '';

// Validate required fields
if (empty($id) || empty($updated_at)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID and updated_at are required']);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE villagelink_visitorslogs SET updated_at = :updated_at WHERE id = :id");
    $stmt->execute([
        ':id' => $id,
        ':updated_at' => $updated_at,
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Visitor log updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No record found with the provided ID']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Failed to update visitor log: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Failed to update visitor log', 'debug' => $e->getMessage()]);
}
?>
