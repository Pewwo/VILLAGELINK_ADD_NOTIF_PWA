
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config.php");

// Connect to database using mysqli from config.php
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

try {
    // Query to get all feedback with resident names
    $sql = "SELECT f.feedback_id, CONCAT(u.first_name, ' ', u.last_name) AS resident_name,
                   f.feedback_context, f.submitted_at, f.rating, u.profile_picture
            FROM villagelink_feedback f
            LEFT JOIN villagelink_users u ON f.acc_id = u.acc_id
            ORDER BY f.submitted_at DESC";

    $result = $conn->query($sql);

    if ($result) {
        $feedbacks = [];
        while ($row = $result->fetch_assoc()) {
            $feedbacks[] = $row;
        }

        echo json_encode(["status" => "success", "data" => $feedbacks]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to fetch feedback data"]);
    }

    $result->free();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
