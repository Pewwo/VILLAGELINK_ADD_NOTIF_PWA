<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once("../config.php");

// Connect to database using mysqli from config.php
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

try {
    $sql = "SELECT * FROM villagelink_announcements ORDER BY created_at DESC";
    $result = $conn->query($sql);
    $announcements = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $announcements[] = $row;
        }
        $result->free();
    }

    echo json_encode($announcements);
} catch (Exception $e) {
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
