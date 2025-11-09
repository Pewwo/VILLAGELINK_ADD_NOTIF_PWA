<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config.php");

// Connect to database using mysqli from config.php
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

// Check if ann_id is provided in the GET parameters
if (!isset($_GET['ann_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing announcement ID"
    ]);
    $conn->close();
    exit;
}

$ann_id = intval($_GET['ann_id']);

try {
    // Prepare SQL to fetch announcement and author name (if any)
    $sql = "
        SELECT 
            a.ann_id, 
            a.acc_id, 
            CONCAT(u.first_name, ' ', u.last_name) AS author, 
            a.title, 
            a.content, 
            a.category, 
            a.image, 
            a.created_at
        FROM villagelink_announcements a
        LEFT JOIN villagelink_users u ON a.acc_id = u.acc_id
        WHERE a.ann_id = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $stmt->bind_param("i", $ann_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Fallback author if NULL or empty string
        if (empty(trim($row['author']))) {
            $row['author'] = "Community Board";
        }

        echo json_encode([
            "success" => true,
            "announcement" => $row
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Announcement not found"
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>
