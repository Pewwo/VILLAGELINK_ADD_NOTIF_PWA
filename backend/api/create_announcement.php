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
$acc_id   = $_POST['acc_id']   ?? null;
$title    = $_POST['title']    ?? '';
$content  = $_POST['content']  ?? '';
$category = $_POST['category'] ?? '';
$image_path = null;

// Handle image upload
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

if (!$acc_id || !$title || !$content || !$category) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields.'
    ]);
    exit;
}

// Prepare and insert
$stmt = $conn->prepare("
    INSERT INTO villagelink_announcements
    (acc_id, title, content, category, image, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
");

$stmt->bind_param("sssss", $acc_id, $title, $content, $category, $image_path);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Announcement created successfully.',
        'announcement_id' => $stmt->insert_id,
        'image' => $image_path
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create announcement: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
