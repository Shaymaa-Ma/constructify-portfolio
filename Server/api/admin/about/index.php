<?php

/**
 * /Server/api/admin/about/index.php
 *
 * About Section Admin API
 *
 * GET
 *   Returns the About section.
 *
 * POST
 *   Updates About section content.
 *   Supports image uploads using multipart/form-data.
 *
 * Images:
 *   image_primary
 *   image_secondary
 */

require_once __DIR__ . '/../../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];


/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

/*
 * Project structure:
 *
 * construction-portfolio/
 * ├── Server/
 * │   └── api/
 * │       └── admin/
 * │           └── about/
 * │               └── index.php
 * │
 * └── uploads/
 *
 * From:
 * Server/api/admin/about/
 *
 * ../../../.. = construction-portfolio/
 */

$uploadDir = __DIR__ . '/../../../uploads/';


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
     * If the database contains:
     *
     * image.jpg
     *
     * or:
     *
     * /uploads/image.jpg
     *
     * or:
     *
     * http://localhost/.../uploads/image.jpg
     *
     * basename() safely extracts only the filename.
     */

    $path = parse_url(
        $image,
        PHP_URL_PATH
    );

    $filename = basename(
        $path ?: $image
    );

    if (!$filename) {
        return;
    }


    /* -------------------------------------------------------
       Allowed extensions
    ------------------------------------------------------- */

    $allowedExtensions = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif'
    ];


    $extension = strtolower(
        pathinfo(
            $filename,
            PATHINFO_EXTENSION
        )
    );


    if (
        !in_array(
            $extension,
            $allowedExtensions,
            true
        )
    ) {
        return;
    }


    /* -------------------------------------------------------
       Build file path
    ------------------------------------------------------- */

    $filePath =
        rtrim(
            $uploadDir,
            '/\\'
        )
        . DIRECTORY_SEPARATOR
        . $filename;


    if (is_file($filePath)) {
        @unlink($filePath);
    }
}


/* =========================================================
   HELPER: UPLOAD IMAGE
========================================================= */

function upload_image(
    string $fieldName,
    string $uploadDir,
    string $prefix
): ?string {

    /*
     * No new image selected.
     *
     * Returning null means:
     * keep the existing database image.
     */

    if (
        !isset($_FILES[$fieldName]) ||
        $_FILES[$fieldName]['error'] === UPLOAD_ERR_NO_FILE
    ) {
        return null;
    }


    $file = $_FILES[$fieldName];


    /* -------------------------------------------------------
       Upload error
    ------------------------------------------------------- */

    if (
        $file['error'] !== UPLOAD_ERR_OK
    ) {

        throw new Exception(
            "Image upload failed for {$fieldName}."
        );
    }


    /* -------------------------------------------------------
       File size
       Maximum: 5 MB
    ------------------------------------------------------- */

    $maxFileSize =
        5 * 1024 * 1024;


    if (
        $file['size'] > $maxFileSize
    ) {

        throw new Exception(
            "The {$fieldName} image must be smaller than 5 MB."
        );
    }


    /* -------------------------------------------------------
       Validate MIME type
    ------------------------------------------------------- */

    $finfo = finfo_open(
        FILEINFO_MIME_TYPE
    );


    if (!$finfo) {

        throw new Exception(
            "Unable to validate uploaded image."
        );
    }


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


    if (
        !isset(
            $allowedMimeTypes[$mimeType]
        )
    ) {

        throw new Exception(
            "Invalid image type for {$fieldName}. Allowed: JPG, PNG, WEBP, GIF."
        );
    }


    /* -------------------------------------------------------
       Make sure upload directory exists
    ------------------------------------------------------- */

    if (!is_dir($uploadDir)) {

        if (
            !mkdir(
                $uploadDir,
                0755,
                true
            )
        ) {

            throw new Exception(
                "Unable to create uploads directory."
            );
        }
    }


    /* -------------------------------------------------------
       Generate unique filename
    ------------------------------------------------------- */

    $extension =
        $allowedMimeTypes[$mimeType];


    $filename =
        $prefix
        . '_'
        . bin2hex(
            random_bytes(8)
        )
        . '.'
        . $extension;


    $destination =
        rtrim(
            $uploadDir,
            '/\\'
        )
        . DIRECTORY_SEPARATOR
        . $filename;


    /* -------------------------------------------------------
       Move uploaded file
    ------------------------------------------------------- */

    if (
        !move_uploaded_file(
            $file['tmp_name'],
            $destination
        )
    ) {

        throw new Exception(
            "Unable to save uploaded {$fieldName} image."
        );
    }


    return $filename;
}


/* =========================================================
   GET ABOUT
========================================================= */

if ($method === 'GET') {

    $result = $conn->query("
        SELECT *
        FROM about_section
        ORDER BY id ASC
        LIMIT 1
    ");


    if (!$result) {

        json_response([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }


    $about = $result->fetch_assoc();


    if (!$about) {

        json_response([
            "success" => false,
            "error" => "About section not found."
        ], 404);
    }


    json_response([
        "success" => true,
        "data" => $about
    ]);
}


/* =========================================================
   UPDATE ABOUT
========================================================= */

if ($method === 'POST') {

    /*
     * Only authenticated admins can update About.
     */

    require_auth();


    /* =======================================================
       ABOUT ID
    ======================================================= */

    $id = (int)(
        $_POST['id'] ?? 1
    );


    if ($id <= 0) {

        json_response([
            "success" => false,
            "error" => "Valid About ID is required."
        ], 422);
    }


    /* =======================================================
       GET EXISTING ABOUT
    ======================================================= */

    $existingStmt = $conn->prepare("
        SELECT *
        FROM about_section
        WHERE id = ?
        LIMIT 1
    ");


    if (!$existingStmt) {

        json_response([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }


    $existingStmt->bind_param(
        "i",
        $id
    );


    $existingStmt->execute();


    $existingResult =
        $existingStmt->get_result();


    $existingAbout =
        $existingResult->fetch_assoc();


    $existingStmt->close();


    if (!$existingAbout) {

        json_response([
            "success" => false,
            "error" => "About section not found."
        ], 404);
    }


    /* =======================================================
       TEXT FIELDS
    ======================================================= */

    $badge_text = trim(
        $_POST['badge_text'] ?? ''
    );


    $title = trim(
        $_POST['title'] ?? ''
    );


    $description = trim(
        $_POST['description'] ?? ''
    );


    $overlay_badge_text = trim(
        $_POST['overlay_badge_text'] ?? ''
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
       EXISTING IMAGES
    ======================================================= */

    $image_primary =
        $existingAbout['image_primary'] ?? '';


    $image_secondary =
        $existingAbout['image_secondary'] ?? '';


    /*
     * Track newly uploaded files so they can be deleted
     * if the database update fails.
     */

    $newPrimaryImage = null;
    $newSecondaryImage = null;


    /* =======================================================
       START
    ======================================================= */

    try {

        /* =====================================================
           UPLOAD PRIMARY IMAGE
        ===================================================== */

        $newPrimaryImage = upload_image(
            'image_primary',
            $uploadDir,
            'about_primary'
        );


        if ($newPrimaryImage !== null) {

            $image_primary =
                $newPrimaryImage;
        }


        /* =====================================================
           UPLOAD SECONDARY IMAGE
        ===================================================== */

        $newSecondaryImage = upload_image(
            'image_secondary',
            $uploadDir,
            'about_secondary'
        );


        if ($newSecondaryImage !== null) {

            $image_secondary =
                $newSecondaryImage;
        }


        /* =====================================================
           DATABASE TRANSACTION
        ===================================================== */

        $conn->begin_transaction();


        /* =====================================================
           UPDATE ABOUT
        ===================================================== */

        $stmt = $conn->prepare("
            UPDATE about_section
            SET
                badge_text = ?,
                title = ?,
                description = ?,
                overlay_badge_text = ?,
                image_primary = ?,
                image_secondary = ?,
                primary_btn_text = ?,
                primary_btn_link = ?,
                secondary_btn_text = ?,
                secondary_btn_link = ?
            WHERE id = ?
        ");


        if (!$stmt) {

            throw new Exception(
                $conn->error
            );
        }


        $stmt->bind_param(
            "ssssssssssi",
            $badge_text,
            $title,
            $description,
            $overlay_badge_text,
            $image_primary,
            $image_secondary,
            $primary_btn_text,
            $primary_btn_link,
            $secondary_btn_text,
            $secondary_btn_link,
            $id
        );


        if (!$stmt->execute()) {

            throw new Exception(
                $stmt->error
            );
        }


        $stmt->close();


        /* =====================================================
           COMMIT
        ===================================================== */

        $conn->commit();


        /* =====================================================
           DELETE OLD PRIMARY IMAGE
        ===================================================== */

        if (
            $newPrimaryImage !== null &&
            !empty(
                $existingAbout['image_primary']
            ) &&
            $existingAbout['image_primary']
                !== $image_primary
        ) {

            delete_old_image(
                $existingAbout['image_primary'],
                $uploadDir
            );
        }


        /* =====================================================
           DELETE OLD SECONDARY IMAGE
        ===================================================== */

        if (
            $newSecondaryImage !== null &&
            !empty(
                $existingAbout['image_secondary']
            ) &&
            $existingAbout['image_secondary']
                !== $image_secondary
        ) {

            delete_old_image(
                $existingAbout['image_secondary'],
                $uploadDir
            );
        }


        /* =====================================================
           GET UPDATED ABOUT
        ===================================================== */

        $updatedStmt = $conn->prepare("
            SELECT *
            FROM about_section
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


        $updatedAbout =
            $updatedResult->fetch_assoc();


        $updatedStmt->close();


        /* =====================================================
           SUCCESS
        ===================================================== */

        json_response([
            "success" => true,
            "message" =>
                "About section updated successfully.",
            "data" => $updatedAbout
        ]);


    } catch (Exception $e) {

        /* =====================================================
           ROLLBACK
        ===================================================== */

        if (
            $conn->errno ||
            $conn->in_transaction
        ) {

            $conn->rollback();
        }


        /* =====================================================
           DELETE NEW PRIMARY IMAGE
        ===================================================== */

        if ($newPrimaryImage) {

            $newPath =
                rtrim(
                    $uploadDir,
                    '/\\'
                )
                . DIRECTORY_SEPARATOR
                . $newPrimaryImage;


            if (is_file($newPath)) {
                @unlink($newPath);
            }
        }


        /* =====================================================
           DELETE NEW SECONDARY IMAGE
        ===================================================== */

        if ($newSecondaryImage) {

            $newPath =
                rtrim(
                    $uploadDir,
                    '/\\'
                )
                . DIRECTORY_SEPARATOR
                . $newSecondaryImage;


            if (is_file($newPath)) {
                @unlink($newPath);
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