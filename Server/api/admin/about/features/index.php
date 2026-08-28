```php
<?php

/**
 * /Server/api/admin/about/features/index.php
 *
 * ABOUT FEATURES API
 *
 * GET:
 *   /admin/about/features/index.php
 *       -> Get all About features
 *
 * GET ?id=1:
 *   /admin/about/features/index.php?id=1
 *       -> Get one About feature
 *
 * PUT ?id=1:
 *   /admin/about/features/index.php?id=1
 *       -> Update one About feature
 *
 * PATCH ?id=1:
 *   Same as PUT
 *
 * Features are EDIT ONLY.
 * No CREATE.
 * No DELETE.
 */

require_once __DIR__ . '/../../../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];


/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

/*
 * About feature images, if your table has an image field,
 * will be stored here:
 *
 * construction-portfolio/
 * └── uploads/
 *     └── about/
 *         └── features/
 */

$uploadDir = dirname(__DIR__, 5) . '/uploads/about/features';

$uploadUrl =
    '/construction-portfolio/uploads/about/features';


/* =========================================================
   HELPER: JSON RESPONSE
========================================================= */

function send_json(array $data, int $status = 200): void
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_SLASHES |
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/* =========================================================
   GET ALL FEATURES
========================================================= */

if ($method === 'GET' && !isset($_GET['id'])) {

    $result = $conn->query("
        SELECT *
        FROM about_features
        ORDER BY display_order ASC, id ASC
    ");

    if (!$result) {

        send_json([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }

    $features = [];

    while ($row = $result->fetch_assoc()) {
        $features[] = $row;
    }

    send_json([
        "success" => true,
        "data" => $features
    ]);
}


/* =========================================================
   GET ONE FEATURE
========================================================= */

if ($method === 'GET' && isset($_GET['id'])) {

    $id = (int)$_GET['id'];

    if ($id <= 0) {

        send_json([
            "success" => false,
            "error" => "Valid feature ID is required."
        ], 422);
    }


    $stmt = $conn->prepare("
        SELECT *
        FROM about_features
        WHERE id = ?
        LIMIT 1
    ");

    if (!$stmt) {

        send_json([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }


    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    $feature = $result->fetch_assoc();

    $stmt->close();


    if (!$feature) {

        send_json([
            "success" => false,
            "error" => "About feature not found."
        ], 404);
    }


    send_json([
        "success" => true,
        "data" => $feature
    ]);
}


/* =========================================================
   UPDATE FEATURE
========================================================= */

if ($method === 'PUT' || $method === 'PATCH') {

    /*
     * Only authenticated admins can update About features.
     */
    require_auth();


    /* =====================================================
       GET ID
    ===================================================== */

    /*
     * Your adminApi currently sends the ID inside JSON:
     *
     * {
     *   id: 1,
     *   ...
     * }
     *
     * So we support both:
     *
     * ?id=1
     *
     * and
     *
     * JSON { "id": 1 }
     */

    $queryId = isset($_GET['id'])
        ? (int)$_GET['id']
        : 0;


    /* =====================================================
       READ REQUEST BODY
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

        /*
         * FormData request.
         */
        $input = $_POST;

    } else {

        /*
         * JSON request.
         */
        $rawBody = file_get_contents("php://input");

        if (
            $rawBody !== false &&
            trim($rawBody) !== ''
        ) {

            $decoded = json_decode(
                $rawBody,
                true
            );

            if (is_array($decoded)) {
                $input = $decoded;
            }
        }
    }


    /* =====================================================
       FEATURE ID
    ===================================================== */

    $id = $queryId > 0
        ? $queryId
        : (int)($input['id'] ?? 0);


    if ($id <= 0) {

        send_json([
            "success" => false,
            "error" => "Valid feature ID is required."
        ], 422);
    }


    /* =====================================================
       GET EXISTING FEATURE
    ===================================================== */

    $existingStmt = $conn->prepare("
        SELECT *
        FROM about_features
        WHERE id = ?
        LIMIT 1
    ");

    if (!$existingStmt) {

        send_json([
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

    $existing =
        $existingResult->fetch_assoc();

    $existingStmt->close();


    if (!$existing) {

        send_json([
            "success" => false,
            "error" => "About feature not found."
        ], 404);
    }


    /* =====================================================
       FEATURE FIELDS
    ===================================================== */

    /*
     * Keep the database value when a field is not supplied.
     *
     * This prevents an update from accidentally clearing
     * existing data.
     */

    $icon =
        array_key_exists('icon', $input)
            ? trim((string)$input['icon'])
            : ($existing['icon'] ?? '');

    $title =
        array_key_exists('title', $input)
            ? trim((string)$input['title'])
            : ($existing['title'] ?? '');

    $description =
        array_key_exists('description', $input)
            ? trim((string)$input['description'])
            : ($existing['description'] ?? '');

    $displayOrder =
        array_key_exists('display_order', $input)
            ? (int)$input['display_order']
            : (int)($existing['display_order'] ?? 0);


    /* =====================================================
       IMAGE
    ===================================================== */

    /*
     * If your about_features table contains an image column,
     * this code supports:
     *
     * image
     *
     * If there is no image column, the image section can be
     * removed later.
     */

    $image =
        $existing['image'] ?? '';

    $oldImage =
        $image;

    $newUploadedFile = null;


    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    if (
        isset($_FILES['image']) &&
        is_array($_FILES['image'])
    ) {

        $file = $_FILES['image'];


        if (
            isset($file['error']) &&
            $file['error'] === UPLOAD_ERR_OK
        ) {

            /* ---------------------------------------------
               Maximum file size: 5 MB
            --------------------------------------------- */

            $maxFileSize =
                5 * 1024 * 1024;

            if (
                $file['size'] >
                $maxFileSize
            ) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Image is too large. Maximum size is 5 MB."
                ], 422);
            }


            /* ---------------------------------------------
               Validate MIME type
            --------------------------------------------- */

            $finfo =
                new finfo(FILEINFO_MIME_TYPE);

            $mimeType =
                $finfo->file(
                    $file['tmp_name']
                );


            $allowedTypes = [
                'image/jpeg' => 'jpg',
                'image/png'  => 'png',
                'image/webp' => 'webp',
                'image/gif'  => 'gif',
            ];


            if (
                !isset(
                    $allowedTypes[$mimeType]
                )
            ) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Invalid image type. Allowed formats: JPG, PNG, WEBP and GIF."
                ], 422);
            }


            /* ---------------------------------------------
               Create upload directory
            --------------------------------------------- */

            if (!is_dir($uploadDir)) {

                if (!mkdir(
                    $uploadDir,
                    0755,
                    true
                )) {

                    send_json([
                        "success" => false,
                        "error" =>
                            "Unable to create image upload directory."
                    ], 500);
                }
            }


            /* ---------------------------------------------
               Generate safe filename
            --------------------------------------------- */

            $extension =
                $allowedTypes[$mimeType];

            $filename =
                'about_feature_' .
                $id .
                '_' .
                bin2hex(
                    random_bytes(8)
                ) .
                '.' .
                $extension;


            $destination =
                rtrim(
                    $uploadDir,
                    DIRECTORY_SEPARATOR
                ) .
                DIRECTORY_SEPARATOR .
                $filename;


            /* ---------------------------------------------
               Move uploaded image
            --------------------------------------------- */

            if (
                !move_uploaded_file(
                    $file['tmp_name'],
                    $destination
                )
            ) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Unable to save uploaded image."
                ], 500);
            }


            $image =
                'uploads/about/features/' .
                $filename;

            $newUploadedFile =
                $destination;
        }
    }


    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    /*
     * IMPORTANT:
     *
     * If your about_features table DOES NOT have an image
     * column, use the alternative query shown below.
     */

    $conn->begin_transaction();


    try {

        /*
         * Check whether the table has an image column.
         */
        $columnsResult =
            $conn->query("SHOW COLUMNS FROM about_features LIKE 'image'");

        $hasImageColumn =
            $columnsResult &&
            $columnsResult->num_rows > 0;


        if ($hasImageColumn) {

            $stmt = $conn->prepare("
                UPDATE about_features
                SET
                    icon = ?,
                    title = ?,
                    description = ?,
                    display_order = ?,
                    image = ?
                WHERE id = ?
            ");

            if (!$stmt) {
                throw new Exception(
                    $conn->error
                );
            }


            $stmt->bind_param(
                "sssisi",
                $icon,
                $title,
                $description,
                $displayOrder,
                $image,
                $id
            );

        } else {

            $stmt = $conn->prepare("
                UPDATE about_features
                SET
                    icon = ?,
                    title = ?,
                    description = ?,
                    display_order = ?
                WHERE id = ?
            ");

            if (!$stmt) {
                throw new Exception(
                    $conn->error
                );
            }


            $stmt->bind_param(
                "sssii",
                $icon,
                $title,
                $description,
                $displayOrder,
                $id
            );
        }


        if (!$stmt->execute()) {

            throw new Exception(
                $stmt->error
            );
        }


        $stmt->close();


        /* =================================================
           COMMIT
        ================================================= */

        $conn->commit();


        /* =================================================
           DELETE OLD IMAGE
        ================================================= */

        if (
            $newUploadedFile &&
            $oldImage &&
            $oldImage !== $image
        ) {

            $oldFilename =
                basename(
                    parse_url(
                        $oldImage,
                        PHP_URL_PATH
                    ) ?: $oldImage
                );


            if ($oldFilename) {

                $oldPath =
                    rtrim(
                        $uploadDir,
                        DIRECTORY_SEPARATOR
                    ) .
                    DIRECTORY_SEPARATOR .
                    $oldFilename;


                if (
                    is_file($oldPath)
                ) {

                    @unlink($oldPath);
                }
            }
        }


        /* =================================================
           GET UPDATED FEATURE
        ================================================= */

        $updatedStmt =
            $conn->prepare("
                SELECT *
                FROM about_features
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

        $updatedFeature =
            $updatedResult->fetch_assoc();

        $updatedStmt->close();


        send_json([
            "success" => true,
            "message" =>
                "About feature updated successfully.",
            "data" => $updatedFeature
        ]);


    } catch (Throwable $e) {

        $conn->rollback();


        /*
         * Remove newly uploaded image if the database
         * update failed.
         */
        if (
            $newUploadedFile &&
            is_file($newUploadedFile)
        ) {

            @unlink(
                $newUploadedFile
            );
        }


        send_json([
            "success" => false,
            "error" => $e->getMessage()
        ], 500);
    }
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

send_json([
    "success" => false,
    "error" => "Method not allowed."
], 405);
```
