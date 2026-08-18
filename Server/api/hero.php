<?php

require "../includes/cors.php";
require "../includes/db.php";

// get the hero section data from the database
// LIMIT 1 means we only need one hero section record
$hero = $conn->query(
    "SELECT * FROM hero_section LIMIT 1"
)->fetch_assoc();

// get all counters that belong to the Hero section, they are ordered based on their display order
$counters = $conn->query(
    "SELECT icon, value, label
     FROM counters
     WHERE section_key = 'hero'
     ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// add the counters to the hero data
$hero["counters"] = $counters;

// convert the hero data to JSON, so React can receive it through the API.
echo json_encode($hero);