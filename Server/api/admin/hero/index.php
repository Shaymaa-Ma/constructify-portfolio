<?php

/**
 * /Server/api/admin/hero/index.php
 *
 * Hero Section Admin API
 *
 * GET
 *   Returns Hero section + Hero counters.
 *
 * POST
 *   Updates Hero section + counters.
 *   Supports image upload using multipart/form-data.
 *
 * Supported Hero fields:
 *   badge_text
 *   title_text
 *   title_highlight
 *   subtitle
 *   primary_btn_text
 *   primary_btn_link
 *   secondary_btn_text
 *   secondary_btn_link
 *
 * Image:
 *   background_image
 *
 * Counters:
 *   counters[id][icon]
 *   counters[id][value]
 *   counters[id][label]
 *   counters[id][display_order]
 */

require_once __DIR__ . '/../../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];


/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

/*
 * This should point to your public uploads folder.
 *
 * Example:
 *
 * construction-portfolio/
 * ├── Server/
 * │   └── api/
 * └── uploads/
 *
 * If your uploads folder is somewhere else,
 * change this path.
 */

$uploadDir = __DIR__ . '/../../../uploads/';


/* =========================================================
   UPLOAD URL
========================================================= */

$uploadUrl = '/construction-portfolio/uploads/';


/* =========================================================
   HELPER: JSON RESPONSE
========================================================= */

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );

    exit;
}


/* =========================================================
   HELPER: DELETE OLD IMAGE
========================================================= */

function delete_old_image(
    ?string $image,
    string $uploadDir
): void {

    if (!$image) {
        return;
    }

    /*
     * Extract only the filename.
     *
     * This prevents deleting arbitrary files if the
     * database accidentally contains a full URL.
     */

    $filename = basename(parse_url($image, PHP_URL_PATH));

    if (!$filename) {
        return;
    }

    /*
     * Only allow common image extensions.
     */

    $allowedExtensions = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg'
    ];

    $extension = strtolower(
        pathinfo($filename, PATHINFO_EXTENSION)
    );

    if (!in_array($extension, $allowedExtensions, true)) {
        return;
    }

    $filePath = rtrim($uploadDir, '/\\')
        . DIRECTORY_SEPARATOR
        . $filename;

    if (is_file($filePath)) {
        @unlink($filePath);
    }
}


/* =========================================================
   GET HERO + COUNTERS
========================================================= */

if ($method === 'GET') {

    /* -------------------------------------------------------
       Get Hero section
    ------------------------------------------------------- */

    $result = $conn->query("
        SELECT *
        FROM hero_section
        ORDER BY id ASC
        LIMIT 1
    ");

    if (!$result) {

        json_response([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }

    $hero = $result->fetch_assoc();

    if (!$hero) {

        json_response([
            "success" => false,
            "error" => "Hero section not found."
        ], 404);
    }


    /* -------------------------------------------------------
       Get Hero counters
    ------------------------------------------------------- */

    $counterResult = $conn->query("
        SELECT
            id,
            icon,
            value,
            label,
            display_order
        FROM counters
        WHERE section_key = 'hero'
        ORDER BY display_order ASC, id ASC
    ");

    if (!$counterResult) {

        json_response([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }


    $counters = [];

    while ($row = $counterResult->fetch_assoc()) {
        $counters[] = $row;
    }


    /* -------------------------------------------------------
       Add counters to Hero
    ------------------------------------------------------- */

    $hero["counters"] = $counters;


    json_response([
        "success" => true,
        "data" => $hero
    ]);
}


/* =========================================================
   UPDATE HERO + COUNTERS
========================================================= */

if ($method === 'POST') {

    /*
     * Only authenticated admins can update Hero.
     */

    require_auth();


    /* =======================================================
       HERO ID
    ======================================================= */

    $id = (int)($_POST['id'] ?? 1);

    if ($id <= 0) {

        json_response([
            "success" => false,
            "error" => "Valid Hero ID is required."
        ], 422);
    }


    /* =======================================================
       CHECK HERO EXISTS
    ======================================================= */

   $heroStmt = $conn->prepare("
        SELECT *
        FROM hero_section
        WHERE id = ?
        LIMIT 1
    ");

    if (!$heroStmt) {

        json_response([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }

    $heroStmt->bind_param("i", $id);
    $heroStmt->execute();

    $heroResult = $heroStmt->get_result();
    $existingHero = $heroResult->fetch_assoc();

    $heroStmt->close();


    if (!$existingHero) {

        json_response([
            "success" => false,
            "error" => "Hero section not found."
        ], 404);
    }


    /* =======================================================
       HERO FIELDS
    ======================================================= */

    $badge_text = trim(
        $_POST['badge_text'] ?? ''
    );

    $title_text = trim(
        $_POST['title_text'] ?? ''
    );

    $title_highlight = trim(
        $_POST['title_highlight'] ?? ''
    );

    $subtitle = trim(
        $_POST['subtitle'] ?? ''
    );

    $primary_btn_text = trim(
        $_POST['primary_btn_text'] ?? ''
    );

    $primary_btn_link = trim(
        $_POST['primary_btn_link'] ?? ''
    );

    $secondary_btn_text = trim(
        $_POST['secondary_btn_text'] ?? ''
    );

    $secondary_btn_link = trim(
        $_POST['secondary_btn_link'] ?? ''
    );


    /* =======================================================
       KEEP CURRENT IMAGE BY DEFAULT
    ======================================================= */

    $background_image =
        $existingHero['background_image'] ?? '';


    /* =======================================================
       IMAGE UPLOAD
    ======================================================= */

    $newImageUploaded = false;
    $newImageFilename = null;


    if (
        isset($_FILES['background_image']) &&
        $_FILES['background_image']['error'] !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES['background_image'];


        /* ---------------------------------------------------
           Upload error
        --------------------------------------------------- */

        if ($file['error'] !== UPLOAD_ERR_OK) {

            json_response([
                "success" => false,
                "error" => "Image upload failed."
            ], 400);
        }


        /* ---------------------------------------------------
           File size
           Maximum: 5 MB
        --------------------------------------------------- */

        $maxFileSize = 5 * 1024 * 1024;

        if ($file['size'] > $maxFileSize) {

            json_response([
                "success" => false,
                "error" => "Image must be smaller than 5 MB."
            ], 422);
        }


        /* ---------------------------------------------------
           Validate MIME type
        --------------------------------------------------- */

        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        $mimeType = finfo_file(
            $finfo,
            $file['tmp_name']
        );

        finfo_close($finfo);


        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif'
        ];


        if (!isset($allowedMimeTypes[$mimeType])) {

            json_response([
                "success" => false,
                "error" => "Invalid image type. Allowed: JPG, PNG, WEBP, GIF."
            ], 422);
        }


        /* ---------------------------------------------------
           Make sure upload directory exists
        --------------------------------------------------- */

        if (!is_dir($uploadDir)) {

            if (!mkdir(
                $uploadDir,
                0755,
                true
            )) {

                json_response([
                    "success" => false,
                    "error" => "Unable to create uploads directory."
                ], 500);
            }
        }


        /* ---------------------------------------------------
           Generate unique filename
        --------------------------------------------------- */

        $extension =
            $allowedMimeTypes[$mimeType];

        $newImageFilename =
            'hero_' .
            bin2hex(random_bytes(8)) .
            '.' .
            $extension;


        $destination =
            rtrim($uploadDir, '/\\') .
            DIRECTORY_SEPARATOR .
            $newImageFilename;


        /* ---------------------------------------------------
           Move uploaded file
        --------------------------------------------------- */

        if (!move_uploaded_file(
            $file['tmp_name'],
            $destination
        )) {

            json_response([
                "success" => false,
                "error" => "Unable to save uploaded image."
            ], 500);
        }


        $background_image =
            $newImageFilename;

        $newImageUploaded = true;
    }


    /* =======================================================
       COUNTERS
    ======================================================= */

    /*
     * FormData sends arrays like:
     *
     * counters[0][id]
     * counters[0][icon]
     * counters[0][value]
     * counters[0][label]
     * counters[0][display_order]
     */

    $counters = $_POST['counters'] ?? [];


    if (!is_array($counters)) {

        /*
         * If no counters were submitted, simply keep
         * existing counters unchanged.
         */

        $counters = [];
    }


    /* =======================================================
       START TRANSACTION
    ======================================================= */

    $conn->begin_transaction();


    try {

        /* =====================================================
           UPDATE HERO
        ===================================================== */

        $stmt = $conn->prepare("
            UPDATE hero_section
            SET
                badge_text = ?,
                title_text = ?,
                title_highlight = ?,
                subtitle = ?,
                primary_btn_text = ?,
                primary_btn_link = ?,
                secondary_btn_text = ?,
                secondary_btn_link = ?,
                background_image = ?
            WHERE id = ?
        ");


        if (!$stmt) {
            throw new Exception(
                $conn->error
            );
        }


        $stmt->bind_param(
            "sssssssssi",
            $badge_text,
            $title_text,
            $title_highlight,
            $subtitle,
            $primary_btn_text,
            $primary_btn_link,
            $secondary_btn_text,
            $secondary_btn_link,
            $background_image,
            $id
        );


        if (!$stmt->execute()) {

            throw new Exception(
                $stmt->error
            );
        }


        $stmt->close();


        /* =====================================================
           UPDATE COUNTERS
        ===================================================== */

        if (!empty($counters)) {

            $counterStmt = $conn->prepare("
                UPDATE counters
                SET
                    icon = ?,
                    value = ?,
                    label = ?,
                    display_order = ?
                WHERE id = ?
                  AND section_key = 'hero'
            ");


            if (!$counterStmt) {

                throw new Exception(
                    $conn->error
                );
            }


            foreach ($counters as $counter) {

                if (!is_array($counter)) {
                    continue;
                }


                $counterId =
                    (int)($counter['id'] ?? 0);


                if ($counterId <= 0) {
                    continue;
                }


                $icon = trim(
                    $counter['icon'] ?? ''
                );

                $value = trim(
                    $counter['value'] ?? ''
                );

                $label = trim(
                    $counter['label'] ?? ''
                );

                $displayOrder =
                    (int)(
                        $counter['display_order'] ?? 0
                    );


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


        /* =====================================================
           COMMIT
        ===================================================== */

        $conn->commit();


        /* =====================================================
           DELETE OLD IMAGE
        ===================================================== */

        /*
         * Delete the old image ONLY after the database
         * transaction succeeds.
         */

        if (
            $newImageUploaded &&
            !empty($existingHero['background_image']) &&
            $existingHero['background_image']
                !== $background_image
        ) {

            delete_old_image(
                $existingHero['background_image'],
                $uploadDir
            );
        }


        /* =====================================================
           GET UPDATED HERO
        ===================================================== */

        $updatedStmt = $conn->prepare("
            SELECT *
            FROM hero_section
            WHERE id = ?
            LIMIT 1
        ");

        $updatedStmt->bind_param(
            "i",
            $id
        );

        $updatedStmt->execute();

        $updatedResult =
            $updatedStmt->get_result();

        $updatedHero =
            $updatedResult->fetch_assoc();

        $updatedStmt->close();


        /* -----------------------------------------------------
           Get updated counters
        ----------------------------------------------------- */

        $updatedCounterResult = $conn->query("
            SELECT
                id,
                icon,
                value,
                label,
                display_order
            FROM counters
            WHERE section_key = 'hero'
            ORDER BY display_order ASC, id ASC
        ");


        $updatedCounters = [];


        while (
            $counter =
                $updatedCounterResult->fetch_assoc()
        ) {

            $updatedCounters[] = $counter;
        }


        $updatedHero['counters'] =
            $updatedCounters;


        /* =====================================================
           RESPONSE
        ===================================================== */

        json_response([
            "success" => true,
            "message" =>
                "Hero section and statistics updated successfully.",
            "data" => $updatedHero
        ]);
        

    } catch (Exception $e) {

        /* =====================================================
           ROLLBACK
        ===================================================== */

        $conn->rollback();


        /*
         * If a new image was uploaded but database update
         * failed, remove the new image because it is not
         * referenced by the database.
         */

        if (
            $newImageUploaded &&
            $newImageFilename
        ) {

            $newImagePath =
                rtrim($uploadDir, '/\\') .
                DIRECTORY_SEPARATOR .
                $newImageFilename;

            if (is_file($newImagePath)) {
                @unlink($newImagePath);
            }
        }


        json_response([
            "success" => false,
            "error" => $e->getMessage()
        ], 500);
    }
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

json_response([
    "success" => false,
    "error" => "Method not allowed."
], 405);