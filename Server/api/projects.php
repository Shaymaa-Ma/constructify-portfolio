<?php

require "../includes/db.php";
require "../includes/cors.php";

//get the main Projects section data from the database
$section = $conn->query(
    "SELECT id, name, slug
    FROM projects_categories
    ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

//GET all projects with their category info, JOIN connects each project to its category 
$projects = $conn->query(
    "SELECT 
    p.id,
    p.title,
    p.image,
    p.slug,
    c.slug AS category_slug,
    c.name AS category_name,
    FROM projects p
    JOIN projects_categories c ON p.category_id = c.id
    ORDER BY p.display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

//add the categories to the Projects section data 
$section["categories"] = $categories;

//add the projects to the Projects section data
$section["projects"] = $projects;

//convert all Projects data to JSON for React
echo json_encode($section);
    

?>