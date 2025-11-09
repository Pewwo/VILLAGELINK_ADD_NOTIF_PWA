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
    echo json_encode(['error' => 'Database connection failed', 'debug' => $e->getMessage()]);
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
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

// Get data
$last_name = $data['last_name'] ?? '';
$first_name = $data['first_name'] ?? '';
$middle_name = $data['middle_name'] ?? '';
$id_number = $data['id_number'] ?? '';
$address = $data['address'] ?? '';
$purpose_of_visit = $data['purpose_of_visit'] ?? '';

// Validate required fields
if (empty($last_name) || empty($first_name) || empty($id_number)) {
    http_response_code(400);
    echo json_encode(['error' => 'Last name, first name, and ID number are required']);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO villagelink_visistorslogs (last_name, first_name, middle_name, id_number, address, purpose_of_visit, created_at, updated_at)
                           VALUES (:last_name, :first_name, :middle_name, :id_number, :address, :purpose_of_visit, CURRENT_TIMESTAMP, NULL)");
    $stmt->execute([
        ':last_name' => $last_name,
        ':first_name' => $first_name,
        ':middle_name' => $middle_name,
        ':id_number' => $id_number,
        ':address' => $address,
        ':purpose_of_visit' => $purpose_of_visit,
    ]);
    echo json_encode(['success' => true, 'message' => 'Visitor log saved successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Failed to save visitor log: ' . $e->getMessage());
    echo json_encode(['error' => 'Failed to save visitor log', 'debug' => $e->getMessage()]);
}
?>
