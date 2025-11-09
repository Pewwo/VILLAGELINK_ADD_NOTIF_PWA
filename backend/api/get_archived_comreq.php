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
    // Query archived comreq with author name and profile picture from users table
    $sql = "SELECT c.comreq_id, c.acc_id, CONCAT(u.first_name, ' ', u.last_name) AS author,
                   u.first_name, u.last_name, u.profile_picture AS user_profile_picture,
                   c.category, u.blk, u.lot, u.street, u.ph, u.subd, u.province, 
                   CONCAT('blk ', u.blk, ', ','lot ',  u.lot, ', ', u.street, ' street, ', 'ph ', u.ph, ', ', u.subd, ' ', u.province) AS address,
                   c.created_at, u.phone_number, c.description AS content, c.remarks, u.coordinates,
                   c.comreqs_upload,u.profile_picture, c.status
            FROM villagelink_comreq_archive c
            LEFT JOIN villagelink_users u ON c.acc_id = u.acc_id
            ORDER BY c.created_at DESC";
    $result = $conn->query($sql);

    if ($result) {
        $comreqs = [];
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

            $comreqs[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => $comreqs
        ]);
    } else {
        // Check if table doesn't exist
        if (strpos($conn->error, "doesn't exist") !== false) {
            echo json_encode(["status" => "success", "data" => []]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to fetch archived comreq: " . $conn->error]);
        }
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
