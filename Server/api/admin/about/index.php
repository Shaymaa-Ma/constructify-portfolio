<?php

/**
 * /Server/api/admin/about/index.php
 *
 * About Section Admin API
 *
 * GET
 *   Returns About section.
 *
 * POST
 *   Updates About section.
 *   Supports image_primary and image_secondary uploads.
 *
 * Authentication:
 *   require_admin()
 */

require_once __DIR__ . '/../_bootstrap.php';


/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

$uploadDir = __DIR__ . '/../../../../uploads/';

$uploadUrl = '/construction-portfolio/uploads/';


/* =========================================================
   REQUEST METHOD
========================================================= */

$method = request_method();


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

        database_error(
            $conn,
            'Unable to load About section.'
        );
    }

    $about = $result->fetch_assoc();

    if (!$about) {

        admin_error(
            'About section not found.',
            404
        );
    }

    admin_success([
        'data' => $about
    ]);
}


/* =========================================================
   UPDATE ABOUT
========================================================= */

if ($method === 'POST') {

    /*
     * Require authenticated admin.
     */
    $admin = require_admin();


    /* =====================================================
       ABOUT ID
    ===================================================== */

    $id = integer_value(
        $_POST['id'] ?? 1,
        'id',
        1
    );


    /* =====================================================
       GET EXISTING ABOUT
    ===================================================== */

    $aboutStmt = $conn->prepare("
        SELECT *
        FROM about_section
        WHERE id = ?
        LIMIT 1
    ");

    if (!$aboutStmt) {

        database_error(
            $conn,
            'Unable to prepare About query.'
        );
    }

    $aboutStmt->bind_param(
        'i',
        $id
    );

    if (!$aboutStmt->execute()) {

        $aboutStmt->close();

        database_error(
            $conn,
            'Unable to load About section.'
        );
    }

    $aboutResult =
        $aboutStmt->get_result();

    $existingAbout =
        $aboutResult->fetch_assoc();

    $aboutStmt->close();


    if (!$existingAbout) {

        admin_error(
            'About section not found.',
            404
        );
    }


    /* =====================================================
       ABOUT FIELDS
    ===================================================== */

    $badge_text =
        string_value(
            $_POST['badge_text'] ?? '',
            'badge_text',
            255
        );

    $title =
        string_value(
            $_POST['title'] ?? '',
            'title',
            500
        );

    $description =
        string_value(
            $_POST['description'] ?? '',
            'description',
            5000
        );

    $overlay_badge_text =
        string_value(
            $_POST['overlay_badge_text'] ?? '',
            'overlay_badge_text',
            255
        );

    $primary_btn_text =
        string_value(
            $_POST['primary_btn_text'] ?? '',
            'primary_btn_text',
            255
        );

    $primary_btn_link =
        string_value(
            $_POST['primary_btn_link'] ?? '',
            'primary_btn_link',
            1000
        );

    $secondary_btn_text =
        string_value(
            $_POST['secondary_btn_text'] ?? '',
            'secondary_btn_text',
            255
        );

    $secondary_btn_link =
        string_value(
            $_POST['secondary_btn_link'] ?? '',
            'secondary_btn_link',
            1000
        );


    /* =====================================================
       CURRENT IMAGES
    ===================================================== */

    $image_primary =
        $existingAbout['image_primary'] ?? '';

    $image_secondary =
        $existingAbout['image_secondary'] ?? '';


    $newPrimaryUploaded = false;
    $newSecondaryUploaded = false;

    $newPrimaryFilename = null;
    $newSecondaryFilename = null;


    /* =====================================================
       IMAGE UPLOAD HELPER
    ===================================================== */

    $uploadImage = function (
        string $fieldName,
        string $defaultName
    ) use (
        $uploadDir
    ) {

        if (
            !isset($_FILES[$fieldName]) ||
            $_FILES[$fieldName]['error'] === UPLOAD_ERR_NO_FILE
        ) {

            return null;
        }


        $file = $_FILES[$fieldName];


        /* -------------------------------------------------
           Upload Error
        ------------------------------------------------- */

        if (
            $file['error'] !== UPLOAD_ERR_OK
        ) {

            admin_error(
                "Image upload failed for {$fieldName}.",
                400
            );
        }


        /* -------------------------------------------------
           File Size
        ------------------------------------------------- */

        $maxFileSize =
            5 * 1024 * 1024;

        if (
            $file['size'] > $maxFileSize
        ) {

            admin_error(
                "{$fieldName} must be smaller than 5 MB.",
                422
            );
        }


        /* -------------------------------------------------
           MIME Validation
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
           Make Upload Directory
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
                    'Unable to create uploads directory.',
                    500
                );
            }
        }


        if (!is_writable($uploadDir)) {

            admin_error(
                'Uploads directory is not writable.',
                500
            );
        }


        /* -------------------------------------------------
           Generate Filename
        ------------------------------------------------- */

        $extension =
            $allowedMimeTypes[$mimeType];


        $originalName =
            pathinfo(
                $file['name'],
                PATHINFO_FILENAME
            );


        $safeName =
            preg_replace(
                '/[^A-Za-z0-9_\-]+/',
                '-',
                $originalName
            );


        $safeName =
            trim(
                $safeName,
                '-'
            );


        if ($safeName === '') {

            $safeName =
                $defaultName;
        }


        $filename =
            $safeName .
            '.' .
            $extension;


        $destination =
            rtrim(
                $uploadDir,
                '/\\'
            ) .
            DIRECTORY_SEPARATOR .
            $filename;


        $suffix = 1;


        while (
            is_file($destination)
        ) {

            $filename =
                $safeName .
                '-' .
                $suffix .
                '.' .
                $extension;


            $destination =
                rtrim(
                    $uploadDir,
                    '/\\'
                ) .
                DIRECTORY_SEPARATOR .
                $filename;


            $suffix++;
        }


        /* -------------------------------------------------
           Move File
        ------------------------------------------------- */

        if (
            !move_uploaded_file(
                $file['tmp_name'],
                $destination
            )
        ) {

            admin_error(
                "Unable to save {$fieldName} image.",
                500
            );
        }


        return $filename;
    };


    /* =====================================================
       PRIMARY IMAGE
    ===================================================== */

    $newPrimaryFilename =
        $uploadImage(
            'image_primary',
            'about-primary'
        );


    if (
        $newPrimaryFilename !== null
    ) {

        $image_primary =
            $newPrimaryFilename;

        $newPrimaryUploaded =
            true;
    }


    /* =====================================================
       SECONDARY IMAGE
    ===================================================== */

    $newSecondaryFilename =
        $uploadImage(
            'image_secondary',
            'about-secondary'
        );


    if (
        $newSecondaryFilename !== null
    ) {

        $image_secondary =
            $newSecondaryFilename;

        $newSecondaryUploaded =
            true;
    }


    /* =====================================================
       DATABASE TRANSACTION
    ===================================================== */

    $conn->begin_transaction();


    try {

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
                'Unable to prepare About update.'
            );
        }


        $stmt->bind_param(
            'ssssssssssi',
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

            $stmt->close();

            throw new Exception(
                'Unable to update About section.'
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

        $conn->rollback();


        /* -----------------------------------------------
           Delete newly uploaded primary image
        ----------------------------------------------- */

        if (
            $newPrimaryUploaded &&
            $newPrimaryFilename
        ) {

            $newPath =
                rtrim(
                    $uploadDir,
                    '/\\'
                ) .
                DIRECTORY_SEPARATOR .
                $newPrimaryFilename;


            if (
                is_file($newPath)
            ) {

                @unlink(
                    $newPath
                );
            }
        }


        /* -----------------------------------------------
           Delete newly uploaded secondary image
        ----------------------------------------------- */

        if (
            $newSecondaryUploaded &&
            $newSecondaryFilename
        ) {

            $newPath =
                rtrim(
                    $uploadDir,
                    '/\\'
                ) .
                DIRECTORY_SEPARATOR .
                $newSecondaryFilename;


            if (
                is_file($newPath)
            ) {

                @unlink(
                    $newPath
                );
            }
        }


        error_log(
            'About update error: ' .
            $e->getMessage()
        );


        admin_error(
            'Unable to update About section.',
            500
        );
    }


    /* =====================================================
       DELETE OLD PRIMARY IMAGE
    ===================================================== */

    if (
        $newPrimaryUploaded &&
        !empty(
            $existingAbout['image_primary']
        ) &&
        $existingAbout['image_primary']
            !== $image_primary
    ) {

        try {

            delete_old_image(
                $existingAbout['image_primary'],
                $uploadDir
            );

        } catch (
            Throwable $e
        ) {

            error_log(
                'About primary image cleanup warning: ' .
                $e->getMessage()
            );
        }
    }


    /* =====================================================
       DELETE OLD SECONDARY IMAGE
    ===================================================== */

    if (
        $newSecondaryUploaded &&
        !empty(
            $existingAbout['image_secondary']
        ) &&
        $existingAbout['image_secondary']
            !== $image_secondary
    ) {

        try {

            delete_old_image(
                $existingAbout['image_secondary'],
                $uploadDir
            );

        } catch (
            Throwable $e
        ) {

            error_log(
                'About secondary image cleanup warning: ' .
                $e->getMessage()
            );
        }
    }


    /* =====================================================
       GET UPDATED ABOUT
    ===================================================== */

    $updatedAbout = null;


    try {

        $updatedStmt =
            $conn->prepare("
                SELECT *
                FROM about_section
                WHERE id = ?
                LIMIT 1
            ");


        if (!$updatedStmt) {

            throw new Exception(
                'Unable to prepare updated About query.'
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
                'Unable to load updated About.'
            );
        }


        $updatedResult =
            $updatedStmt->get_result();


        $updatedAbout =
            $updatedResult->fetch_assoc();


        $updatedStmt->close();


    } catch (
        Throwable $e
    ) {

        error_log(
            'About post-update fetch warning: ' .
            $e->getMessage()
        );


        $updatedAbout =
            array_merge(
                $existingAbout,
                [
                    'id' =>
                        $id,

                    'badge_text' =>
                        $badge_text,

                    'title' =>
                        $title,

                    'description' =>
                        $description,

                    'overlay_badge_text' =>
                        $overlay_badge_text,

                    'image_primary' =>
                        $image_primary,

                    'image_secondary' =>
                        $image_secondary,

                    'primary_btn_text' =>
                        $primary_btn_text,

                    'primary_btn_link' =>
                        $primary_btn_link,

                    'secondary_btn_text' =>
                        $secondary_btn_text,

                    'secondary_btn_link' =>
                        $secondary_btn_link,
                ]
            );
    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    admin_success([
        'message' =>
            'About section updated successfully.',

        'data' =>
            $updatedAbout
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