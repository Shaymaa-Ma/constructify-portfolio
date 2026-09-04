<?php

require_once __DIR__ . '/_bootstrap.php';

// get the main Projects section data
$section = $conn->query(
    "SELECT * FROM projects_section LIMIT 1"
)->fetch_assoc();

// get all AVAILABLE project categories and order them by display order
// (categories marked unavailable in the admin panel are hidden here,
// but stay in the DB and in the admin list)
$categories = $conn->query(
    "SELECT id, name, slug
     FROM project_categories
     WHERE is_available = 1
     ORDER BY display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// get all AVAILABLE projects with their category info, JOIN connects each project to its category
// (projects marked unavailable in the admin panel are hidden here,
// but stay in the DB and in the admin list)
// Also only shows projects whose category is itself available, so a
// project can't appear under a category that was hidden.
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
     WHERE p.is_available = 1
       AND c.is_available = 1
     ORDER BY p.display_order ASC"
)->fetch_all(MYSQLI_ASSOC);

// add the categories to the Projects section data
$section["categories"] = $categories;

// add the projects to the Projects section data
$section["projects"] = $projects;

// convert all Projects data to JSON for React
echo json_encode($section);