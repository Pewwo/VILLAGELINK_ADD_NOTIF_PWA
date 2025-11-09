<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Connect to database
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

// Get POST data
$user_id = $_POST['user_id'] ?? null;

if (!$user_id) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required field: user_id.'
    ]);
    exit;
}

// Prepare and delete
$stmt = $conn->prepare("
    DELETE FROM villagelink_notifications
    WHERE user_id = ?
");

$stmt->bind_param("i", $user_id);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Notifications cleared successfully.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to clear notifications: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
