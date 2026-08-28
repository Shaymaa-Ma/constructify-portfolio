<?php

/**
 * /Server/api/admin/services/index.php
 *
 * Services Section
 *
 * GET:
 *   Returns services section + services counters
 *
 * PUT / PATCH:
 *   Updates services section text/content + panel image
 *   Also updates services counters
 *
 * Image upload:
 *   panel_image is uploaded using multipart/form-data
 */

require_once __DIR__ . '/../../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];


/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

$uploadDir = __DIR__ . '/../../../uploads/services/';

$uploadUrl = '/construction-portfolio/uploads/services/';


/* =========================================================
   GET SERVICES SECTION + COUNTERS
========================================================= */

if ($method === 'GET') {

    /* -----------------------------------------------------
       Get Services Section
    ----------------------------------------------------- */

    $result = $conn->query("
        SELECT *
        FROM services_section
        ORDER BY id ASC
        LIMIT 1
    ");

    if (!$result) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }

    $section = $result->fetch_assoc();


    if (!$section) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Services section not found."
        ]);

        exit;
    }


    /* -----------------------------------------------------
       Get Services Counters
    ----------------------------------------------------- */

    $counterResult = $conn->query("
        SELECT
            id,
            section_key,
            icon,
            value,
            label,
            display_order
        FROM counters
        WHERE section_key = 'services'
        ORDER BY display_order ASC, id ASC
    ");

    if (!$counterResult) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $counters = [];

    while ($counter = $counterResult->fetch_assoc()) {
        $counters[] = $counter;
    }


    /* -----------------------------------------------------
       Return Section + Counters
    ----------------------------------------------------- */

    echo json_encode([
        "success" => true,
        "data" => $section,
        "counters" => $counters
    ]);

    exit;
}


/* =========================================================
   UPDATE SERVICES SECTION + IMAGE + COUNTERS
========================================================= */

if ($method === 'PUT' || $method === 'PATCH') {

    require_auth();


    /* -----------------------------------------------------
       Read normal fields
    ----------------------------------------------------- */

    $id = (int)($_POST['id'] ?? 1);

    if ($id <= 0) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Valid Services section ID is required."
        ]);

        exit;
    }


    $title =
        trim($_POST['title'] ?? '');

    $subtitle =
        trim($_POST['subtitle'] ?? '');

    $panel_title =
        trim($_POST['panel_title'] ?? '');

    $panel_btn_text =
        trim($_POST['panel_btn_text'] ?? '');

    $panel_btn_link =
        trim($_POST['panel_btn_link'] ?? '');

    $stats_badge_text =
        trim($_POST['stats_badge_text'] ?? '');

    $stats_title =
        trim($_POST['stats_title'] ?? '');

    $stats_description =
        trim($_POST['stats_description'] ?? '');

    $stats_btn_text =
        trim($_POST['stats_btn_text'] ?? '');

    $stats_btn_link =
        trim($_POST['stats_btn_link'] ?? '');


    /* -----------------------------------------------------
       Get current image
    ----------------------------------------------------- */

    $currentStmt = $conn->prepare("
        SELECT panel_image
        FROM services_section
        WHERE id = ?
        LIMIT 1
    ");

    if (!$currentStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }

    $currentStmt->bind_param("i", $id);
    $currentStmt->execute();

    $currentResult = $currentStmt->get_result();
    $currentSection = $currentResult->fetch_assoc();

    $currentStmt->close();


    if (!$currentSection) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Services section not found."
        ]);

        exit;
    }


    $panelImage = $currentSection['panel_image'];


    /* =====================================================
       HANDLE NEW PANEL IMAGE
    ===================================================== */

    if (
        isset($_FILES['panel_image']) &&
        $_FILES['panel_image']['error'] !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES['panel_image'];


        /* -------------------------------------------------
           Check upload error
        ------------------------------------------------- */

        if ($file['error'] !== UPLOAD_ERR_OK) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "error" => "Image upload failed."
            ]);

            exit;
        }


        /* -------------------------------------------------
           Maximum size: 5 MB
        ------------------------------------------------- */

        if ($file['size'] > 5 * 1024 * 1024) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "error" => "Image must be smaller than 5 MB."
            ]);

            exit;
        }


        /* -------------------------------------------------
           Validate MIME type
        ------------------------------------------------- */

        $allowedTypes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp'
        ];

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);


        if (!isset($allowedTypes[$mimeType])) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "error" => "Only JPG, PNG and WEBP images are allowed."
            ]);

            exit;
        }


        /* -------------------------------------------------
           Create upload directory
        ------------------------------------------------- */

        if (!is_dir($uploadDir)) {

            if (!mkdir($uploadDir, 0755, true)) {

                http_response_code(500);

                echo json_encode([
                    "success" => false,
                    "error" => "Could not create upload directory."
                ]);

                exit;
            }
        }


        /* -------------------------------------------------
           Generate unique filename
        ------------------------------------------------- */

        $extension = $allowedTypes[$mimeType];

        $newFilename =
            'services-panel-' .
            bin2hex(random_bytes(8)) .
            '.' .
            $extension;


        $destination =
            $uploadDir . $newFilename;


        /* -------------------------------------------------
           Move uploaded file
        ------------------------------------------------- */

        if (!move_uploaded_file(
            $file['tmp_name'],
            $destination
        )) {

            http_response_code(500);

            echo json_encode([
                "success" => false,
                "error" => "Could not save uploaded image."
            ]);

            exit;
        }


        /* -------------------------------------------------
           Save new image filename
        ------------------------------------------------- */

        $panelImage = $newFilename;
    }


    /* =====================================================
       GET COUNTERS FROM FORM
    ===================================================== */

    $counters = [];

    if (isset($_POST['counters'])) {

        $decodedCounters =
            json_decode($_POST['counters'], true);

        if (!is_array($decodedCounters)) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "error" => "Invalid counters data."
            ]);

            exit;
        }

        $counters = $decodedCounters;
    }


    /* =====================================================
       START TRANSACTION
    ===================================================== */

    $conn->begin_transaction();


    try {

        /* =================================================
           UPDATE SERVICES SECTION
        ================================================= */

        $stmt = $conn->prepare("
            UPDATE services_section
            SET
                title = ?,
                subtitle = ?,
                panel_image = ?,
                panel_title = ?,
                panel_btn_text = ?,
                panel_btn_link = ?,
                stats_badge_text = ?,
                stats_title = ?,
                stats_description = ?,
                stats_btn_text = ?,
                stats_btn_link = ?
            WHERE id = ?
        ");

        if (!$stmt) {
            throw new Exception($conn->error);
        }


        $stmt->bind_param(
            "sssssssssssi",
            $title,
            $subtitle,
            $panelImage,
            $panel_title,
            $panel_btn_text,
            $panel_btn_link,
            $stats_badge_text,
            $stats_title,
            $stats_description,
            $stats_btn_text,
            $stats_btn_link,
            $id
        );


        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }


        $stmt->close();


        /* =================================================
           UPDATE COUNTERS
        ================================================= */

        if (!empty($counters)) {

            $counterStmt = $conn->prepare("
                UPDATE counters
                SET
                    icon = ?,
                    value = ?,
                    label = ?,
                    display_order = ?
                WHERE id = ?
                  AND section_key = 'services'
            ");

            if (!$counterStmt) {
                throw new Exception($conn->error);
            }


            foreach ($counters as $counter) {

                $counterId =
                    (int)($counter['id'] ?? 0);

                if ($counterId <= 0) {
                    continue;
                }


                $icon =
                    trim($counter['icon'] ?? '');

                $value =
                    trim($counter['value'] ?? '');

                $label =
                    trim($counter['label'] ?? '');

                $displayOrder =
                    (int)($counter['display_order'] ?? 0);


                $counterStmt->bind_param(
                    "sssii",
                    $icon,
                    $value,
                    $label,
                    $displayOrder,
                    $counterId
                );


                if (!$counterStmt->execute()) {
                    throw new Exception(
                        $counterStmt->error
                    );
                }
            }


            $counterStmt->close();
        }


        /* =================================================
           COMMIT
        ================================================= */

        $conn->commit();


        echo json_encode([
            "success" => true,
            "message" =>
                "Services section and statistics updated successfully.",
            "panel_image" => $panelImage,
            "image_url" =>
                $uploadUrl . $panelImage
        ]);

        exit;

    } catch (Exception $e) {

        $conn->rollback();

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);

        exit;
    }
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

http_response_code(405);

echo json_encode([
    "success" => false,
    "error" => "Only GET and PUT/PATCH are allowed."
]);