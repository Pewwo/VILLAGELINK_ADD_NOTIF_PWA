<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once("../config.php");

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // ✅ Get the 10 most recent officials based on updated_at
    $sql = "SELECT 
                official_id, 
                full_name, 
                position, 
                avatar, 
                off_contact, 
                created_at, 
                updated_at 
            FROM villagelink_officials 
            ORDER BY updated_at DESC 
            LIMIT 10";

    $result = $conn->query($sql);
    $officials = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $officials[] = [
                "official_id" => (int)$row["official_id"],
                "full_name" => $row["full_name"],
                "position" => $row["position"],
                "avatar" => $row["avatar"],
                "off_contact" => $row["off_contact"],
                "created_at" => $row["created_at"],
                "updated_at" => $row["updated_at"]
            ];
        }
    }

    echo json_encode(["status" => "success", "officials" => $officials]);
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
