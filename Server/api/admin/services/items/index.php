<?php

/**
 * /Server/api/admin/services/items/index.php
 *
 * Individual Services
 *
 * GET:
 *   Returns all services.
 *
 * PUT / PATCH:
 *   Updates one service.
 *
 * Services are edit-only.
 * No create/delete.
 */

require_once __DIR__ . '/../../../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];


/* =========================================================
   GET ALL SERVICES
========================================================= */

if ($method === 'GET') {

    $result = $conn->query("
        SELECT
            id,
            icon,
            title,
            description,
            display_order
        FROM services
        ORDER BY display_order ASC, id ASC
    ");


    if (!$result) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $services = [];

    while ($row = $result->fetch_assoc()) {
        $services[] = $row;
    }


    echo json_encode([
        "success" => true,
        "data" => $services
    ]);

    exit;
}


/* =========================================================
   UPDATE SERVICE
========================================================= */

if ($method === 'PUT' || $method === 'PATCH') {

    require_auth();


    /* -----------------------------------------------------
       Read JSON
    ----------------------------------------------------- */

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );


    if (!is_array($input)) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "error" => "Invalid JSON."
        ]);

        exit;
    }


    $id =
        (int)($input['id'] ?? 0);


    if ($id <= 0) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Valid service ID is required."
        ]);

        exit;
    }


    /* -----------------------------------------------------
       Check service exists
    ----------------------------------------------------- */

    $checkStmt = $conn->prepare("
        SELECT id
        FROM services
        WHERE id = ?
        LIMIT 1
    ");


    if (!$checkStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $checkStmt->bind_param(
        "i",
        $id
    );

    $checkStmt->execute();

    $checkResult =
        $checkStmt->get_result();


    if (!$checkResult->fetch_assoc()) {

        $checkStmt->close();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Service not found."
        ]);

        exit;
    }


    $checkStmt->close();


    /* -----------------------------------------------------
       Service fields
    ----------------------------------------------------- */

    $icon =
        trim($input['icon'] ?? '');

    $title =
        trim($input['title'] ?? '');

    $description =
        trim($input['description'] ?? '');

    $displayOrder =
        (int)($input['display_order'] ?? 0);


    /* -----------------------------------------------------
       Validate title
    ----------------------------------------------------- */

    if ($title === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Service title is required."
        ]);

        exit;
    }


    /* -----------------------------------------------------
       Update service
    ----------------------------------------------------- */

    $stmt = $conn->prepare("
        UPDATE services
        SET
            icon = ?,
            title = ?,
            description = ?,
            display_order = ?
        WHERE id = ?
    ");


    if (!$stmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $stmt->bind_param(
        "sssii",
        $icon,
        $title,
        $description,
        $displayOrder,
        $id
    );


    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);

        exit;
    }


    $stmt->close();


    echo json_encode([
        "success" => true,
        "message" => "Service updated successfully."
    ]);

    exit;
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

http_response_code(405);

echo json_encode([
    "success" => false,
    "error" => "Only GET and PUT/PATCH are allowed."
]);