<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

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
$title = $_POST['title'] ?? '';
$message = $_POST['message'] ?? '';

if (!$user_id || !$title || !$message) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: user_id, title, message.'
    ]);
    exit;
}

// Prepare and insert
$stmt = $conn->prepare("
    INSERT INTO villagelink_notifications
    (user_id, title, message, created_at)
    VALUES (?, ?, ?, NOW())
");

$stmt->bind_param("iss", $user_id, $title, $message);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Notification added successfully.',
        'notification_id' => $stmt->insert_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to add notification: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
