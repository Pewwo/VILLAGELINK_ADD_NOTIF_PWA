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
    // Query archived emergencies with author name and profile picture from users table
    $sql = "SELECT e.id as emergency_id, e.acc_id, CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
                   u.first_name, u.last_name, u.profile_picture AS user_profile_picture,
                   u.phone_number, e.sos_status, e.sos_remarks, e.created_at,
                   e.realtime_coords, u.profile_picture
            FROM villagelink_emergency_logs_archive e
            LEFT JOIN villagelink_users u ON e.acc_id = u.acc_id
            ORDER BY e.created_at DESC";

    $result = $conn->query($sql);

    if ($result) {
        $emergencies = [];
        while ($row = $result->fetch_assoc()) {
            if (!$row['reporter_name']) {
                $row['reporter_name'] = "Unknown Reporter";
            }

            // Use user profile picture if available, otherwise use archived profile picture
            $row['profile_picture'] = $row['user_profile_picture'] ?: $row['profile_picture'];

            // Remove the user_profile_picture field as it's not needed
            unset($row['user_profile_picture']);

            // ✅ Convert created_at to Philippine time
            if (!empty($row['created_at'])) {
                // Assume saved time is server time (UTC+7 - Indonesia)
                $date = new DateTime($row['created_at'], new DateTimeZone('Asia/Jakarta'));
                $date->setTimezone(new DateTimeZone('Asia/Manila'));
                $row['created_at_ph'] = $date->format('Y-m-d H:i:s');
            } else {
                $row['created_at_ph'] = null;
            }

            $emergencies[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => $emergencies
        ]);
    } else {
        // Check if table doesn't exist
        if (strpos($conn->error, "doesn't exist") !== false) {
            echo json_encode(["status" => "success", "data" => []]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to fetch archived emergencies: " . $conn->error]);
        }
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
