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
    // Query archived announcements with author name and profile picture from users table
    $sql = "SELECT a.id, a.acc_id, CONCAT(u.first_name, ' ', u.last_name) AS author,
                   u.first_name, u.last_name, u.profile_picture AS user_profile_picture,
                   a.category, u.blk, u.lot, u.street, u.ph, u.subd, u.province,
                   CONCAT('blk ', u.blk, ', ','lot ',  u.lot, ', ', u.street, ' street, ', 'ph ', u.ph, ', ', u.subd, ' ', u.province) AS address,
                   a.created_at, u.phone_number, a.content, a.title, a.image,
                   u.profile_picture, a.announcements_upload
            FROM villagelink_announcements_archive a
            LEFT JOIN villagelink_users u ON a.acc_id = u.acc_id
            ORDER BY a.created_at DESC";
    $result = $conn->query($sql);

    if ($result) {
        $announcements = [];
        while ($row = $result->fetch_assoc()) {
            if (!$row['author']) {
                $row['author'] = "Community Board";
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

            $announcements[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => $announcements
        ]);
    } else {
        // Check if table doesn't exist
        if (strpos($conn->error, "doesn't exist") !== false) {
            echo json_encode(["status" => "success", "data" => []]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to fetch archived announcements: " . $conn->error]);
        }
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
