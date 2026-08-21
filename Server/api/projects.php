<?php

require "../includes/cors.php";
require "../includes/db.php";

// get the main Projects section data
$section = $conn->query(
    "SELECT * FROM projects_section LIMIT 1"
)->fetch_assoc();

// get all project categories and order them by display order
$categories = $conn->query(
    "SELECT id, name, slug
     FROM project_categories
     ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// get all projects with their category info, JOIN connects each project to its category
$projects = $conn->query(
    "SELECT
        p.id,
        p.title,
        p.description,
        p.image,
        c.slug AS category_slug,
        c.name AS category_name
     FROM projects p
     JOIN project_categories c ON p.category_id = c.id
     ORDER BY p.display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// add the categories to the Projects section data
$section["categories"] = $categories;

// add the projects to the Projects section data
$section["projects"] = $projects;

// convert all Projects data to JSON for React
echo json_encode($section);