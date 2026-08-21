<?php

require "../includes/cors.php";
require "../includes/db.php";

// get the main Services section data from db
$section = $conn->query(
    "SELECT * FROM services_section LIMIT 1"
)->fetch_assoc();

// get all services and order them by display order
$services = $conn->query(
    "SELECT icon, title, description
     FROM services
     ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// get the statistics for the Services section, Only counters with section_key = 'services' are selected
$stats = $conn->query(
    "SELECT icon, value, label
     FROM counters
     WHERE section_key = 'services'
     ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// add the services to the section data
$section["services"] = $services;

// add the statistics to the section data
$section["stats"] = $stats;

// convert the complete Services data to JSON for React
echo json_encode($section);