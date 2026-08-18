<?php

require "../includes/cors.php";
require "../includes/db.php";

// get the website settings from db, LIMIT 1 means we only need one settings record
$settings = $conn->query(
    "SELECT * FROM site_settings LIMIT 1"
)->fetch_assoc();

// convert the settings to JSON so React can use them
echo json_encode($settings);