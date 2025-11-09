<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config.php");

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

try {
    $sql = "SELECT faq_id, question, answer, created_at, updated_at FROM villagelinks_faqs_archive ORDER BY updated_at DESC";
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

    echo json_encode(['status' => 'success', 'data' => $faqs]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
