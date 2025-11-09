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

$tables = [
    'villagelink_users' => 'villagelink_users_archive',
    'villagelink_announcements' => 'villagelink_announcements_archive',
    'villagelink_comreqs' => 'villagelink_comreq_archive',
    'villagelink_emergencies' => 'villagelink_emergency_logs_archive',
    'villagelink_visitorslogs' => 'villagelink_visitorslogs_archive',
    'villagelink_feedback' => 'villagelink_feedback_archive',
    'villagelinks_faqs' => 'villagelinks_faqs_archive'
];

$created = [];
$errors = [];

foreach ($tables as $main => $archive) {
    $sql = "CREATE TABLE IF NOT EXISTS `$archive` LIKE `$main`";
    if ($conn->query($sql) === TRUE) {
        $created[] = $archive;
    } else {
        $errors[] = "Error creating $archive: " . $conn->error;
    }
}

$conn->close();

if (empty($errors)) {
    echo json_encode(['status' => 'success', 'message' => 'Archive tables created successfully', 'created' => $created]);
} else {
    echo json_encode(['status' => 'partial', 'message' => 'Some tables created with errors', 'created' => $created, 'errors' => $errors]);
}
?>
