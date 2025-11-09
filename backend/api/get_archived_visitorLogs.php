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
    // Query archived visitor logs
    $sql = "SELECT
            id,
            last_name,
            first_name,
            middle_name,
            id_number,
            address,
            purpose_of_visit,
            created_at,
            updated_at
            FROM villagelink_visitorslogs_archive ORDER BY created_at DESC";
    $result = $conn->query($sql);

    if ($result) {
        $visitorLogs = [];
        while ($row = $result->fetch_assoc()) {
            // ✅ Convert created_at to Philippine time
            if (!empty($row['created_at'])) {
                // Assume saved time is server time (UTC+7 - Indonesia)
                $date = new DateTime($row['created_at'], new DateTimeZone('Asia/Jakarta'));
                $date->setTimezone(new DateTimeZone('Asia/Manila'));
                $row['created_at_ph'] = $date->format('Y-m-d H:i:s');
            } else {
                $row['created_at_ph'] = null;
            }

            // ✅ Convert updated_at to Philippine time
            if (!empty($row['updated_at'])) {
                // Assume saved time is server time (UTC+7 - Indonesia)
                $date = new DateTime($row['updated_at'], new DateTimeZone('Asia/Jakarta'));
                $date->setTimezone(new DateTimeZone('Asia/Manila'));
                $row['updated_at_ph'] = $date->format('Y-m-d H:i:s');
            } else {
                $row['updated_at_ph'] = null;
            }

            $visitorLogs[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => $visitorLogs
        ]);
    } else {
        // Check if table doesn't exist
        if (strpos($conn->error, "doesn't exist") !== false) {
            echo json_encode(["status" => "success", "data" => []]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to fetch archived visitor logs: " . $conn->error]);
        }
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
