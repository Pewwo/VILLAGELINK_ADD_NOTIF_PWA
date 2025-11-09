<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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

// Get POST data from FormData
$announcement_id   = $_POST['announcement_id']   ?? null;
$acc_id   = $_POST['acc_id']   ?? null;
$title    = $_POST['title']    ?? '';
$content  = $_POST['content']  ?? '';
$category = $_POST['category'] ?? '';
$image_path = null;

if (!$announcement_id || !$acc_id || !$title || !$content || !$category) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields.'
    ]);
    exit;
}

// Handle image upload (optional)
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $file_name = uniqid() . '_' . basename($_FILES['image']['name']);
    $target_file = $upload_dir . $file_name;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
        $image_path = 'uploads/' . $file_name;
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to upload image.'
        ]);
        exit;
    }
}

// Prepare and update
if ($image_path) {
    // Update with new image
    $stmt = $conn->prepare("
        UPDATE villagelink_announcements
        SET title = ?, content = ?, category = ?, image = ?
        WHERE ann_id = ? AND acc_id = ?
    ");
    $stmt->bind_param("ssssii", $title, $content, $category, $image_path, $announcement_id, $acc_id);
} else {
    // Update without changing image
    $stmt = $conn->prepare("
        UPDATE villagelink_announcements
        SET title = ?, content = ?, category = ?
        WHERE ann_id = ? AND acc_id = ?
    ");
    $stmt->bind_param("sssii", $title, $content, $category, $announcement_id, $acc_id);
}

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Announcement updated successfully.',
            'image' => $image_path
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No changes made or announcement not found.'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update announcement: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
