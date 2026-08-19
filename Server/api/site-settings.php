<?php

require "../includes/db.php";
require "../includes/cors.php";

//get the site settings data from the database
$site_settings = $conn->query(
    "SELECT * FROM site_settings LIMIT 1"
)
?>