<?php
require_once('backend/config.php');
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}
$result = $conn->query('DESCRIBE villagelinks_faqs');
if ($result) {
    echo 'Table structure for villagelinks_faqs:' . PHP_EOL;
    while ($row = $result->fetch_assoc()) {
        echo $row['Field'] . ' ' . $row['Type'] . ' ' . ($row['Null'] == 'NO' ? 'NOT NULL' : 'NULL') . ' ' . ($row['Default'] ? 'DEFAULT ' . $row['Default'] : '') . ' ' . $row['Extra'] . PHP_EOL;
    }
} else {
    echo 'Error: ' . $conn->error;
}
$conn->close();
?>
