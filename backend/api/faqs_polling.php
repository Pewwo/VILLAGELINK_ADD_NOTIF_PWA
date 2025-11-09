<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once("../config.php");

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // ✅ Get the 10 most recent FAQs
    $sql = "SELECT faq_id, question, answer, created_at, updated_at 
            FROM villagelinks_faqs 
            ORDER BY updated_at DESC 
            LIMIT 10";

    $result = $conn->query($sql);
    $faqs = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $faqs[] = [
                "faq_id" => (int)$row["faq_id"],
                "question" => $row["question"],
                "answer" => $row["answer"],
                "created_at" => $row["created_at"],
                "updated_at" => $row["updated_at"]
            ];
        }
    }

    echo json_encode(["status" => "success", "faqs" => $faqs]);
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
