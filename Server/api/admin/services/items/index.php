
<?php

/**
 * /Server/api/admin/services/items/index.php
 *
 * INDIVIDUAL SERVICES API
 *
 * GET:
 *   Get all services
 *
 * GET ?id=1:
 *   Get one service
 *
 * PUT / PATCH:
 *   Update one service using JSON
 *
 * POST + _method=PUT:
 *   Update one service using FormData
 *
 * Services are EDIT ONLY.
 * No CREATE.
 * No DELETE.
 */

require_once __DIR__ . '/../../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");


/* =========================================================
   REQUEST METHOD
========================================================= */

$method =
    strtoupper(
        $_SERVER['REQUEST_METHOD']
    );


/*
 * Support:
 *
 * POST + _method=PUT
 *
 * for FormData.
 */

if (
    $method === 'POST' &&
    isset($_POST['_method'])
) {

    $requestedMethod =
        strtoupper(
            trim(
                (string)$_POST['_method']
            )
        );


    if (
        $requestedMethod === 'PUT' ||
        $requestedMethod === 'PATCH'
    ) {

        $method =
            $requestedMethod;
    }
}


/* =========================================================
   HELPER
========================================================= */

function send_json(
    array $data,
    int $status = 200
): void {

    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_SLASHES |
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/* =========================================================
   GET ALL SERVICES
========================================================= */

if (
    $method === 'GET' &&
    !isset($_GET['id'])
) {

    $result =
        $conn->query("
            SELECT
                id,
                icon,
                title,
                description,
                display_order
            FROM services
            ORDER BY
                display_order ASC,
                id ASC
        ");


    if (!$result) {

        send_json([
            "success" => false,
            "error" =>
                $conn->error
        ], 500);
    }


    $services = [];


    while (
        $row =
        $result->fetch_assoc()
    ) {

        $services[] =
            $row;
    }


    send_json([
        "success" => true,
        "data" =>
            $services
    ]);
}


/* =========================================================
   GET ONE SERVICE
========================================================= */

if (
    $method === 'GET' &&
    isset($_GET['id'])
) {

    $id =
        (int)$_GET['id'];


    if (
        $id <= 0
    ) {

        send_json([
            "success" => false,
            "error" =>
                "Valid service ID is required."
        ], 422);
    }


    $stmt =
        $conn->prepare("
            SELECT
                id,
                icon,
                title,
                description,
                display_order
            FROM services
            WHERE id = ?
            LIMIT 1
        ");


    if (!$stmt) {

        send_json([
            "success" => false,
            "error" =>
                $conn->error
        ], 500);
    }


    $stmt->bind_param(
        "i",
        $id
    );


    $stmt->execute();


    $result =
        $stmt->get_result();


    $service =
        $result->fetch_assoc();


    $stmt->close();


    if (!$service) {

        send_json([
            "success" => false,
            "error" =>
                "Service not found."
        ], 404);
    }


    send_json([
        "success" => true,
        "data" =>
            $service
    ]);
}


/* =========================================================
   UPDATE SERVICE
========================================================= */

if (
    $method === 'PUT' ||
    $method === 'PATCH'
) {

    require_auth();


    /* =====================================================
       READ INPUT
    ===================================================== */

    $contentType =
        $_SERVER['CONTENT_TYPE'] ??
        $_SERVER['HTTP_CONTENT_TYPE'] ??
        '';


    $input = [];


    if (
        stripos(
            $contentType,
            'multipart/form-data'
        ) !== false
    ) {

        $input =
            $_POST;

    } else {

        $rawBody =
            file_get_contents(
                "php://input"
            );


        if (
            $rawBody !== false &&
            trim($rawBody) !== ''
        ) {

            $decoded =
                json_decode(
                    $rawBody,
                    true
                );


            if (
                is_array($decoded)
            ) {

                $input =
                    $decoded;
            }
        }
    }


    /* =====================================================
       SERVICE ID
    ===================================================== */

    $id =
        isset($_GET['id'])
            ? (int)$_GET['id']
            : (int)($input['id'] ?? 0);


    if (
        $id <= 0
    ) {

        send_json([
            "success" => false,
            "error" =>
                "Valid service ID is required."
        ], 422);
    }


    /* =====================================================
       GET EXISTING SERVICE
    ===================================================== */

    $existingStmt =
        $conn->prepare("
            SELECT
                id,
                icon,
                title,
                description,
                display_order
            FROM services
            WHERE id = ?
            LIMIT 1
        ");


    if (!$existingStmt) {

        send_json([
            "success" => false,
            "error" =>
                $conn->error
        ], 500);
    }


    $existingStmt->bind_param(
        "i",
        $id
    );


    $existingStmt->execute();


    $existingResult =
        $existingStmt->get_result();


    $existing =
        $existingResult->fetch_assoc();


    $existingStmt->close();


    if (!$existing) {

        send_json([
            "success" => false,
            "error" =>
                "Service not found."
        ], 404);
    }


    /* =====================================================
       SERVICE FIELDS
    ===================================================== */

    $icon =
        array_key_exists(
            'icon',
            $input
        )
            ? trim(
                (string)$input['icon']
            )
            : ($existing['icon'] ?? '');


    $title =
        array_key_exists(
            'title',
            $input
        )
            ? trim(
                (string)$input['title']
            )
            : ($existing['title'] ?? '');


    $description =
        array_key_exists(
            'description',
            $input
        )
            ? trim(
                (string)$input['description']
            )
            : ($existing['description'] ?? '');


    $displayOrder =
        array_key_exists(
            'display_order',
            $input
        )
            ? (int)$input['display_order']
            : (int)(
                $existing['display_order']
                ?? 0
            );


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
        $title === ''
    ) {

        send_json([
            "success" => false,
            "error" =>
                "Service title is required."
        ], 422);
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    $stmt =
        $conn->prepare("
            UPDATE services
            SET
                icon = ?,
                title = ?,
                description = ?,
                display_order = ?
            WHERE id = ?
        ");


    if (!$stmt) {

        send_json([
            "success" => false,
            "error" =>
                $conn->error
        ], 500);
    }


    $stmt->bind_param(
        "sssii",
        $icon,
        $title,
        $description,
        $displayOrder,
        $id
    );


    if (
        !$stmt->execute()
    ) {

        $error =
            $stmt->error;


        $stmt->close();


        send_json([
            "success" => false,
            "error" =>
                $error
        ], 500);
    }


    $stmt->close();


    /* =====================================================
       GET UPDATED SERVICE
    ===================================================== */

    $updatedStmt =
        $conn->prepare("
            SELECT
                id,
                icon,
                title,
                description,
                display_order
            FROM services
            WHERE id = ?
            LIMIT 1
        ");


    if (!$updatedStmt) {

        send_json([
            "success" => false,
            "error" =>
                $conn->error
        ], 500);
    }


    $updatedStmt->bind_param(
        "i",
        $id
    );


    $updatedStmt->execute();


    $updatedResult =
        $updatedStmt->get_result();


    $updatedService =
        $updatedResult->fetch_assoc();


    $updatedStmt->close();


    send_json([
        "success" => true,
        "message" =>
            "Service updated successfully.",
        "data" =>
            $updatedService
    ]);
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

send_json([
    "success" => false,
    "error" =>
        "Method not allowed."
], 405);
