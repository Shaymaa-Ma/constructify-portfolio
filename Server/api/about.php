<?php

// Allow requests from the React frontend
require "../includes/cors.php";
require "../includes/db.php";

// get the main About section data from db
$about = $conn->query(
    "SELECT * FROM about_section LIMIT 1"
)->fetch_assoc();

// get all About features and order them by display order
$features = $conn->query(
    "SELECT icon, title, description
     FROM about_features
     ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// add the features to the About section data
$about["features"] = $features;

// convert the About data to JSON for React
echo json_encode($about);