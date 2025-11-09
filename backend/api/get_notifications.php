<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once("../config.php");

$response = ["status" => "error", "message" => "Unknown error"];

try {
    // ✅ Use $main_conn from config.php
    global $main_conn;
    if ($main_conn->connect_error) {
        throw new Exception("Database connection failed: " . $main_conn->connect_error);
    }

    // SQL to fetch latest announcements
    $sql = "
        SELECT 
            announcemnt_id AS id,
            title,
            content AS message,
            category,
            image,
            created_at AS timestamp
        FROM villagelink_announcements
        ORDER BY created_at DESC
        LIMIT 20
    ";

    $notifications = [];
    if ($result = $main_conn->query($sql)) {
        while ($row = $result->fetch_assoc()) {
            $notifications[] = [
                "id" => (int)$row["id"],
                "title" => $row["title"],
                "message" => $row["message"],
                "category" => $row["category"],
                "image" => $row["image"],
                "timestamp" => $row["timestamp"],
                "read" => false
            ];
        }
    }

    $response = [
        "status" => "success",
        "notifications" => $notifications
    ];

    $main_conn->close();

} catch (Exception $e) {
    $response = [
        "status" => "error",
        "message" => $e->getMessage()
    ];
}

echo json_encode($response);
?>
