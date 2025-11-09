<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once("../../config.php");

$response = ["success" => false, "message" => "Unknown error"];

try {
    // ✅ Use $main_conn from config.php
    global $main_conn;
    if ($main_conn->connect_error) {
        throw new Exception("Database connection failed: " . $main_conn->connect_error);
    }

    $user_id = $_GET['user_id'] ?? null;
    if (!$user_id) {
        throw new Exception("User ID is required");
    }

    // SQL to fetch notifications for the user
    $sql = "
        SELECT
            notification_id AS id,
            title,
            message,
            read_status,
            created_at AS timestamp
        FROM villagelink_notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ";

    $stmt = $main_conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            "id" => (int)$row["id"],
            "title" => $row["title"],
            "message" => $row["message"],
            "read_status" => $row["read_status"] == '1' ? true : false,
            "timestamp" => $row["timestamp"]
        ];
    }

    $response = [
        "success" => true,
        "data" => $notifications
    ];

    $stmt->close();
    $main_conn->close();

} catch (Exception $e) {
    $response = [
        "success" => false,
        "message" => $e->getMessage()
    ];
}

echo json_encode($response);
?>
