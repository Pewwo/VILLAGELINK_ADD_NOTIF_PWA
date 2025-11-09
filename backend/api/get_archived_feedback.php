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
    // Query archived feedback with author name and profile picture from users table
    $sql = "SELECT f.feedback_id AS id, CONCAT(u.first_name, ' ', u.last_name) AS resident_name,
                   u.email, f.feedback_context, f.rating, f.submitted_at,
                   u.profile_picture
            FROM villagelink_feedback_archive f
            LEFT JOIN villagelink_users u ON f.acc_id = u.acc_id
            ORDER BY f.submitted_at DESC";
    $result = $conn->query($sql);

    if ($result) {
        $feedbacks = [];
        while ($row = $result->fetch_assoc()) {
            // Use user profile picture if available
            $row['profile_picture'] = $row['profile_picture'] ?? '';

            // ✅ Convert submitted_at to Philippine time
            if (!empty($row['submitted_at'])) {
                // Assume saved time is server time (UTC+7 - Indonesia)
                $date = new DateTime($row['submitted_at'], new DateTimeZone('Asia/Jakarta'));
                $date->setTimezone(new DateTimeZone('Asia/Manila'));
                $row['submitted_at_ph'] = $date->format('Y-m-d H:i:s');
            } else {
                $row['submitted_at_ph'] = null;
            }

            $feedbacks[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => $feedbacks
        ]);
    } else {
        // Check if table doesn't exist
        if (strpos($conn->error, "doesn't exist") !== false) {
            echo json_encode(["status" => "success", "data" => []]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to fetch archived feedback: " . $conn->error]);
        }
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
