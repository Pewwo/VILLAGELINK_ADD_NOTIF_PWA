<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config.php");

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    $data = $_POST;
}

if (!$data || !isset($data['table']) || !isset($data['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request data']);
    exit;
}

$table = $data['table'];
$id = $data['id'];

$archive_tables = [
    'users' => 'villagelink_users_archive',
    'announcements' => 'villagelink_announcements_archive',
    'comreqs' => 'villagelink_comreq_archive',
    'emergencies' => 'villagelink_emergency_logs_archive',
    'visitorslogs' => 'villagelink_visitorslogs_archive',
    'feedback' => 'villagelink_feedback_archive',
    'faqs' => 'villagelinks_faqs_archive'
];

$primary_keys = [
    'users' => 'acc_id',
    'announcements' => 'id',
    'comreqs' => 'comreq_id',
    'emergencies' => 'emergency_id',
    'visitorslogs' => 'id',
    'feedback' => 'feedback_id',
    'faqs' => 'faq_id'
];

if (!isset($archive_tables[$table]) || !isset($primary_keys[$table])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid table specified']);
    exit;
}

$archive_table = $archive_tables[$table];
$primary_key = $primary_keys[$table];

try {
    // Check if record exists in archive
    $stmt = $conn->prepare("SELECT `$primary_key` FROM `$archive_table` WHERE `$primary_key` = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Record not found in archive']);
        exit;
    }
    $stmt->close();

    // Delete from archive table
    $stmt = $conn->prepare("DELETE FROM `$archive_table` WHERE `$primary_key` = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Record permanently deleted from archive']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete record']);
    }

    $stmt->close();

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to delete record: ' . $e->getMessage()]);
}

$conn->close();
?>
