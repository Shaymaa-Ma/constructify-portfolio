<?php

/**
 * /Server/api/admin/about/features/index.php
 *
 * ABOUT FEATURES ADMIN API
 *
 * GET
 *   Returns all About features.
 *
 * GET ?id=1
 *   Returns one About feature.
 *
 * POST
 *   Updates one About feature.
 *
 * Features are EDIT ONLY.
 * No CREATE.
 * No DELETE.
 *
 * Authentication:
 *   require_admin()
 */

require_once __DIR__ . '/../../_bootstrap.php';


/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

/*
 * Project structure:
 *
 * construction-portfolio/
 * ├── Server/
 * │   └── api/
 * │       └── admin/
 * │           └── about/
 * │               └── features/
 * │                   └── index.php
 * │
 * └── uploads/
 *     └── about/
 *         └── features/
 *
 * From:
 * Server/api/admin/about/features/
 *
 * dirname(__DIR__, 5)
 * = construction-portfolio/
 */

$uploadDir =
    dirname(__DIR__, 5) .
    '/uploads/about/features/';


/* =========================================================
   REQUEST METHOD
========================================================= */

$method = request_method();


/* =========================================================
   GET ALL FEATURES
========================================================= */

if (
    $method === 'GET' &&
    !isset($_GET['id'])
) {

    $result = $conn->query("
        SELECT *
        FROM about_features
        ORDER BY display_order ASC, id ASC
    ");


    if (!$result) {

        database_error(
            $conn,
            'Unable to load About features.'
        );
    }


    $features = [];


    while (
        $row = $result->fetch_assoc()
    ) {

        $features[] = $row;

    }


    admin_success([
        'data' => $features
    ]);
}


/* =========================================================
   GET ONE FEATURE
========================================================= */

if (
    $method === 'GET' &&
    isset($_GET['id'])
) {

    $id = integer_value(
        $_GET['id'],
        'id',
        1
    );


    $stmt = $conn->prepare("
        SELECT *
        FROM about_features
        WHERE id = ?
        LIMIT 1
    ");


    if (!$stmt) {

        database_error(
            $conn,
            'Unable to prepare About feature query.'
        );
    }


    $stmt->bind_param(
        'i',
        $id
    );


    if (!$stmt->execute()) {

        $stmt->close();

        database_error(
            $conn,
            'Unable to load About feature.'
        );
    }


    $result =
        $stmt->get_result();


    $feature =
        $result->fetch_assoc();


    $stmt->close();


    if (!$feature) {

        admin_error(
            'About feature not found.',
            404
        );
    }


    admin_success([
        'data' => $feature
    ]);
}


/* =========================================================
   UPDATE FEATURE
========================================================= */

if ($method === 'POST') {

    /*
     * Require authenticated admin.
     */
    $admin = require_admin();


    /* =====================================================
       FEATURE ID
    ===================================================== */

    $id = integer_value(
        $_POST['id'] ?? 0,
        'id',
        1
    );


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

        database_error(
            $conn,
            'Unable to prepare About feature query.'
        );
    }


    $existingStmt->bind_param(
        'i',
        $id
    );


    if (!$existingStmt->execute()) {

        $existingStmt->close();

        database_error(
            $conn,
            'Unable to load About feature.'
        );
    }


    $existingResult =
        $existingStmt->get_result();


    $existing =
        $existingResult->fetch_assoc();


    $existingStmt->close();


    if (!$existing) {

        admin_error(
            'About feature not found.',
            404
        );
    }


    /* =====================================================
       FEATURE FIELDS
    ===================================================== */

    $icon =
        string_value(
            $_POST['icon']
                ?? ($existing['icon'] ?? ''),
            'icon',
            100
        );


    $title =
        string_value(
            $_POST['title']
                ?? ($existing['title'] ?? ''),
            'title',
            255
        );


    $description =
        string_value(
            $_POST['description']
                ?? ($existing['description'] ?? ''),
            'description',
            2000
        );


    $displayOrder =
        integer_value(
            $_POST['display_order']
                ?? ($existing['display_order'] ?? 0),
            'display_order',
            0
        );


    /* =====================================================
       IMAGE
    ===================================================== */

    /*
     * Keep the existing image unless a new one is uploaded.
     *
     * This endpoint supports the image column if it exists.
     */

    $image =
        $existing['image'] ?? '';


    $oldImage =
        $image;


    $newImageUploaded = false;

    $newImageFilename = null;


    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    if (
        isset($_FILES['image']) &&
        $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE
    ) {

        $file =
            $_FILES['image'];


        /* -------------------------------------------------
           Upload error
        ------------------------------------------------- */

        if (
            $file['error'] !== UPLOAD_ERR_OK
        ) {

            admin_error(
                'Image upload failed.',
                400
            );
        }


        /* -------------------------------------------------
           File size
        ------------------------------------------------- */

        $maxFileSize =
            5 * 1024 * 1024;


        if (
            $file['size'] > $maxFileSize
        ) {

            admin_error(
                'Image must be smaller than 5 MB.',
                422
            );
        }


        /* -------------------------------------------------
           MIME validation
        ------------------------------------------------- */

        $finfo =
            finfo_open(
                FILEINFO_MIME_TYPE
            );


        if (!$finfo) {

            admin_error(
                'Unable to validate uploaded image.',
                500
            );
        }


        $mimeType =
            finfo_file(
                $finfo,
                $file['tmp_name']
            );


        finfo_close($finfo);


        $allowedMimeTypes = [

            'image/jpeg' => 'jpg',

            'image/png' => 'png',

            'image/webp' => 'webp',

            'image/gif' => 'gif',

        ];


        if (
            !isset(
                $allowedMimeTypes[$mimeType]
            )
        ) {

            admin_error(
                'Invalid image type. Allowed: JPG, PNG, WEBP, GIF.',
                422
            );
        }


        /* -------------------------------------------------
           Create upload directory
        ------------------------------------------------- */

        if (!is_dir($uploadDir)) {

            if (
                !mkdir(
                    $uploadDir,
                    0755,
                    true
                )
            ) {

                admin_error(
                    'Unable to create About features upload directory.',
                    500
                );
            }
        }


        /* -------------------------------------------------
           Check writable
        ------------------------------------------------- */

        if (!is_writable($uploadDir)) {

            admin_error(
                'About features upload directory is not writable.',
                500
            );
        }


        /* -------------------------------------------------
           Generate filename
        ------------------------------------------------- */

        $extension =
            $allowedMimeTypes[$mimeType];


        $newImageFilename =
            'about-feature-' .
            $id .
            '-' .
            bin2hex(
                random_bytes(8)
            ) .
            '.' .
            $extension;


        $destination =
            rtrim(
                $uploadDir,
                '/\\'
            ) .
            DIRECTORY_SEPARATOR .
            $newImageFilename;


        /* -------------------------------------------------
           Move file
        ------------------------------------------------- */

        if (
            !move_uploaded_file(
                $file['tmp_name'],
                $destination
            )
        ) {

            admin_error(
                'Unable to save uploaded image.',
                500
            );
        }


        /*
         * Store only the filename in the database.
         *
         * This follows the same approach as Hero.
         */

        $image =
            $newImageFilename;


        $newImageUploaded = true;
    }


    /* =====================================================
       DATABASE UPDATE
    ===================================================== */

    $conn->begin_transaction();


    try {

        /*
         * Determine whether the database actually contains
         * an image column.
         *
         * This is checked BEFORE preparing the UPDATE.
         */

        $columnsResult =
            $conn->query("
                SHOW COLUMNS
                FROM about_features
                LIKE 'image'
            ");


        $hasImageColumn =
            $columnsResult &&
            $columnsResult->num_rows > 0;


        /* =================================================
           UPDATE WITH IMAGE
        ================================================= */

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
                    'Unable to prepare About feature update.'
                );
            }


            $stmt->bind_param(
                'sssisi',
                $icon,
                $title,
                $description,
                $displayOrder,
                $image,
                $id
            );

        }


        /* =================================================
           UPDATE WITHOUT IMAGE
        ================================================= */

        else {

            /*
             * If the table has no image column,
             * update only the real feature fields.
             */

            if ($newImageUploaded) {

                /*
                 * A file was uploaded but the table does not
                 * have an image column.
                 *
                 * Do not silently leave an orphaned file.
                 */

                throw new Exception(
                    'The about_features table does not contain an image column.'
                );
            }


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
                    'Unable to prepare About feature update.'
                );
            }


            $stmt->bind_param(
                'sssii',
                $icon,
                $title,
                $description,
                $displayOrder,
                $id
            );
        }


        /* =================================================
           EXECUTE
        ================================================= */

        if (!$stmt->execute()) {

            $stmt->close();

            throw new Exception(
                'Unable to update About feature.'
            );
        }


        $stmt->close();


        /* =================================================
           COMMIT
        ================================================= */

        $conn->commit();


    } catch (
        Throwable $e
    ) {

        /* -------------------------------------------------
           Rollback
        ------------------------------------------------- */

        $conn->rollback();


        /* -------------------------------------------------
           Delete newly uploaded image
        ------------------------------------------------- */

        if (
            $newImageUploaded &&
            $newImageFilename
        ) {

            $newImagePath =
                rtrim(
                    $uploadDir,
                    '/\\'
                ) .
                DIRECTORY_SEPARATOR .
                $newImageFilename;


            if (
                is_file($newImagePath)
            ) {

                @unlink(
                    $newImagePath
                );
            }
        }


        error_log(
            'About feature update error: ' .
            $e->getMessage()
        );


        admin_error(
            'Unable to update About feature.',
            500
        );
    }


    /* =====================================================
       DELETE OLD IMAGE
       POST-COMMIT / BEST EFFORT
    ===================================================== */

    if (
        $newImageUploaded &&
        !empty($oldImage) &&
        $oldImage !== $image
    ) {

        try {

            delete_old_image(
                $oldImage,
                $uploadDir
            );

        } catch (
            Throwable $e
        ) {

            error_log(
                'About feature old-image cleanup warning: ' .
                $e->getMessage()
            );
        }
    }


    /* =====================================================
       RE-FETCH UPDATED FEATURE
    ===================================================== */

    $updatedFeature = null;


    try {

        $updatedStmt =
            $conn->prepare("
                SELECT *
                FROM about_features
                WHERE id = ?
                LIMIT 1
            ");


        if (!$updatedStmt) {

            throw new Exception(
                'Unable to prepare updated feature query.'
            );
        }


        $updatedStmt->bind_param(
            'i',
            $id
        );


        if (
            !$updatedStmt->execute()
        ) {

            $updatedStmt->close();

            throw new Exception(
                'Unable to load updated About feature.'
            );
        }


        $updatedResult =
            $updatedStmt->get_result();


        $updatedFeature =
            $updatedResult->fetch_assoc();


        $updatedStmt->close();


    } catch (
        Throwable $e
    ) {

        error_log(
            'About feature post-update fetch warning: ' .
            $e->getMessage()
        );


        /*
         * The database update already succeeded.
         * Return the values we know were saved.
         */

        $updatedFeature =
            array_merge(
                $existing,
                [
                    'id' =>
                        $id,

                    'icon' =>
                        $icon,

                    'title' =>
                        $title,

                    'description' =>
                        $description,

                    'display_order' =>
                        $displayOrder,

                    'image' =>
                        $image
                ]
            );
    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    admin_success([

        'message' =>
            'About feature updated successfully.',

        'data' =>
            $updatedFeature

    ]);
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

header(
    'Allow: GET, POST'
);

admin_error(
    'Method not allowed.',
    405
);
