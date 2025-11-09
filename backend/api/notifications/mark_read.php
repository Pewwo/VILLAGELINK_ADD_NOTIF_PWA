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
$notification_id = $_POST['notification_id'] ?? null;

if (!$notification_id) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required field: notification_id.'
    ]);
    exit;
}

// Prepare and update
$stmt = $conn->prepare("
    UPDATE villagelink_notifications
    SET read_status = '1'
    WHERE notification_id = ?
");

$stmt->bind_param("i", $notification_id);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Notification marked as read successfully.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to mark notification as read: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
