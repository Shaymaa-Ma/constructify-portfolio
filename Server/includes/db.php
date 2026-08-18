<?php

/*
Database connection
*/

$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "constructify";

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$conn->set_charset("utf8mb4");
