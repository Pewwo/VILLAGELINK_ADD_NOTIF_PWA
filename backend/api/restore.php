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
    'faqs' => 'villagelink_faqs_archive'
];

$main_tables = [
    'users' => 'villagelink_users',
    'announcements' => 'villagelink_announcements',
    'comreqs' => 'villagelink_comreqs',
    'emergencies' => 'villagelink_emergencies',
    'visitorslogs' => 'villagelink_visitorslogs',
    'feedback' => 'villagelink_feedback',
    'faqs' => 'villagelink_faqs'
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

if (!isset($archive_tables[$table]) || !isset($main_tables[$table]) || !isset($primary_keys[$table])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid table specified']);
    exit;
}

$main_table = $main_tables[$table];
$archive_table = $archive_tables[$table];
$primary_key = $primary_keys[$table];

$conn->begin_transaction();

try {
    // Get the record to restore
    $stmt = $conn->prepare("SELECT * FROM `$archive_table` WHERE `$primary_key` = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $record = $result->fetch_assoc();
    $stmt->close();

    if (!$record) {
        throw new Exception('Record not found in archive');
    }

    // Insert into main table
    $columns = array_keys($record);
    $placeholders = str_repeat('?,', count($columns) - 1) . '?';
    $columns_str = '`' . implode('`,`', $columns) . '`';

    $stmt = $conn->prepare("INSERT INTO `$main_table` ($columns_str) VALUES ($placeholders)");
    $types = str_repeat('s', count($columns));
    $values = array_values($record);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();
    $stmt->close();

    // Delete from archive table
    $stmt = $conn->prepare("DELETE FROM `$archive_table` WHERE `$primary_key` = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Record restored successfully']);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Failed to restore record: ' . $e->getMessage()]);
}

$conn->close();
?>
