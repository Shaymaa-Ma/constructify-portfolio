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
 *   Supports background image upload using multipart/form-data.
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
   GET HERO + COUNTERS
========================================================= */

if ($method === 'GET') {

    /* -------------------------------------------------------
       Get Hero
    ------------------------------------------------------- */

    $result = $conn->query("
        SELECT *
        FROM hero_section
        ORDER BY id ASC
        LIMIT 1
    ");

    if (!$result) {

        database_error(
            $conn,
            'Unable to load Hero section.'
        );
    }

    $hero = $result->fetch_assoc();

    if (!$hero) {

        admin_error(
            'Hero section not found.',
            404
        );
    }


    /* -------------------------------------------------------
       Get Hero Counters
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

        database_error(
            $conn,
            'Unable to load Hero counters.'
        );
    }


    $counters = [];

    while (
        $row = $counterResult->fetch_assoc()
    ) {

        $counters[] = $row;

    }


    /* -------------------------------------------------------
       Attach Counters
    ------------------------------------------------------- */

    $hero['counters'] = $counters;


    /* -------------------------------------------------------
       Response
    ------------------------------------------------------- */

    admin_success([
        'data' => $hero
    ]);
}


/* =========================================================
   UPDATE HERO
========================================================= */

if ($method === 'POST') {

    /*
     * Require authenticated admin.
     */
    $admin = require_admin();


    /* =====================================================
       HERO ID
    ===================================================== */

    $id = integer_value(
        $_POST['id'] ?? 1,
        'id',
        1
    );


    /* =====================================================
       GET EXISTING HERO
    ===================================================== */

    $heroStmt = $conn->prepare("
        SELECT *
        FROM hero_section
        WHERE id = ?
        LIMIT 1
    ");

    if (!$heroStmt) {

        database_error(
            $conn,
            'Unable to prepare Hero query.'
        );
    }

    $heroStmt->bind_param(
        'i',
        $id
    );

    if (!$heroStmt->execute()) {

        $heroStmt->close();

        database_error(
            $conn,
            'Unable to load Hero section.'
        );
    }

    $heroResult =
        $heroStmt->get_result();

    $existingHero =
        $heroResult->fetch_assoc();

    $heroStmt->close();


    if (!$existingHero) {

        admin_error(
            'Hero section not found.',
            404
        );
    }


    /* =====================================================
       HERO FIELDS
    ===================================================== */

    $badge_text =
        string_value(
            $_POST['badge_text'] ?? '',
            'badge_text',
            255
        );

    $title_text =
        string_value(
            $_POST['title_text'] ?? '',
            'title_text',
            500
        );

    $title_highlight =
        string_value(
            $_POST['title_highlight'] ?? '',
            'title_highlight',
            255
        );

    $subtitle =
        string_value(
            $_POST['subtitle'] ?? '',
            'subtitle',
            2000
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
       CURRENT IMAGE
    ===================================================== */

    $background_image =
        $existingHero['background_image'] ?? '';


    $newImageUploaded = false;

    $newImageFilename = null;


    /* =====================================================
       IMAGE UPLOAD
========================================================= */

    if (
        isset($_FILES['background_image']) &&
        $_FILES['background_image']['error'] !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES['background_image'];


        /* -------------------------------------------------
           Upload Error
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
           File Size
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


        /* -------------------------------------------------
           Check Directory Writable
        ------------------------------------------------- */

        if (!is_writable($uploadDir)) {

            admin_error(
                'Uploads directory is not writable.',
                500
            );
        }


        /* -------------------------------------------------
           Generate Filename

           Uses the ORIGINAL filename from the admin's
           computer (sanitized for filesystem/URL safety),
           rather than a random hex name.

           - The extension always follows the DETECTED mime
             type above, never whatever the browser/client
             claims, so a renamed .php can't sneak through
             as "photo.jpg".
           - If a file with that exact sanitized name already
             exists in /uploads, a numeric suffix (-1, -2, ...)
             is appended so it can't silently overwrite an
             unrelated existing upload.
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
            trim($safeName, '-');

        if ($safeName === '') {

            $safeName = 'hero';

        }

        $newImageFilename =
            $safeName . '.' . $extension;

        $destination =
            rtrim(
                $uploadDir,
                '/\\'
            ) .
            DIRECTORY_SEPARATOR .
            $newImageFilename;

        $suffix = 1;

        while (is_file($destination)) {

            $newImageFilename =
                $safeName . '-' . $suffix . '.' . $extension;

            $destination =
                rtrim(
                    $uploadDir,
                    '/\\'
                ) .
                DIRECTORY_SEPARATOR .
                $newImageFilename;

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
                'Unable to save uploaded image.',
                500
            );
        }


        /*
         * Store only the filename in DB.
         */
        $background_image =
            $newImageFilename;

        $newImageUploaded = true;
    }


    /* =====================================================
       COUNTERS
    ===================================================== */

    $counters =
        $_POST['counters'] ?? [];


    if (
        !is_array($counters)
    ) {

        $counters = [];

    }


    /* =====================================================
       TRANSACTION
       (ONLY the two UPDATE statements live in here — nothing
       that runs after a successful commit belongs inside this
       try/catch, because a failure at that point would no
       longer mean the write failed, just that some follow-up
       step did.)
    ===================================================== */

    $conn->begin_transaction();

    try {

        /* =================================================
           UPDATE HERO
        ================================================= */

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
                'Unable to prepare Hero update.'
            );
        }


        $stmt->bind_param(
            'sssssssssi',
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

            $stmt->close();

            throw new Exception(
                'Unable to update Hero section.'
            );
        }


        $stmt->close();


        /* =================================================
           UPDATE COUNTERS
        ================================================= */

        if (
            !empty($counters)
        ) {

            $counterStmt =
                $conn->prepare("
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
                    'Unable to prepare counter update.'
                );
            }


            foreach (
                $counters as $counter
            ) {

                if (
                    !is_array($counter)
                ) {

                    continue;

                }


                $counterId =
                    integer_value(
                        $counter['id'] ?? 0,
                        'counter id',
                        0
                    );


                if (
                    $counterId <= 0
                ) {

                    continue;

                }


                $icon =
                    string_value(
                        $counter['icon'] ?? '',
                        'counter icon',
                        100
                    );


                $value =
                    string_value(
                        $counter['value'] ?? '',
                        'counter value',
                        100
                    );


                $label =
                    string_value(
                        $counter['label'] ?? '',
                        'counter label',
                        255
                    );


                $displayOrder =
                    integer_value(
                        $counter['display_order'] ?? 0,
                        'display_order',
                        0
                    );


                $counterStmt->bind_param(
                    'sssii',
                    $icon,
                    $value,
                    $label,
                    $displayOrder,
                    $counterId
                );


                if (
                    !$counterStmt->execute()
                ) {

                    $counterStmt->close();

                    throw new Exception(
                        'Unable to update Hero counter.'
                    );
                }

            }


            $counterStmt->close();

        }


        /* =================================================
           COMMIT
           (Everything below this point in the file is
           best-effort follow-up. Nothing after this line is
           allowed to make the request "fail" or delete the
           image that was just committed to the DB.)
        ================================================= */

        $conn->commit();


    } catch (
        Throwable $e
    ) {

        /* =================================================
           ROLLBACK
           (This branch only runs if the write itself failed —
           i.e. before commit() above ever executed — so it's
           still correct to delete the new image here.)
        ================================================= */

        $conn->rollback();


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
            'Hero update error: ' .
            $e->getMessage()
        );


        admin_error(
            'Unable to update Hero section.',
            500
        );

    }


    /* =========================================================
       POST-COMMIT CLEANUP + RESPONSE
       The write already succeeded at this point. Nothing from
       here on can turn that into a reported failure — cleanup
       and the re-fetch are both best-effort.
    ========================================================= */


    /* -----------------------------------------------------
       DELETE OLD IMAGE (best-effort — logged, never fatal)
    ----------------------------------------------------- */

    if (
        $newImageUploaded &&
        !empty(
            $existingHero['background_image']
        ) &&
        $existingHero['background_image']
            !== $background_image
    ) {

        try {

            delete_old_image(
                $existingHero['background_image'],
                $uploadDir
            );

        } catch (
            Throwable $e
        ) {

            // Old file cleanup failing (already missing,
            // permissions, etc.) must never be reported as
            // an update failure — the write already succeeded.
            error_log(
                'Hero old-image cleanup warning: ' .
                $e->getMessage()
            );

        }

    }


    /* -----------------------------------------------------
       RE-FETCH UPDATED HERO + COUNTERS
       (best-effort — falls back to values we already know
       rather than reporting failure if this select fails)
    ----------------------------------------------------- */

    $updatedHero = null;

    try {

        $updatedStmt =
            $conn->prepare("
                SELECT *
                FROM hero_section
                WHERE id = ?
                LIMIT 1
            ");


        if (!$updatedStmt) {

            throw new Exception(
                'Unable to prepare updated Hero query.'
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
                'Unable to load updated Hero.'
            );
        }


        $updatedResult =
            $updatedStmt->get_result();


        $updatedHero =
            $updatedResult->fetch_assoc();


        $updatedStmt->close();


        $updatedCounterResult =
            $conn->query("
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


        if (
            !$updatedCounterResult
        ) {

            throw new Exception(
                'Unable to load updated counters.'
            );
        }


        $updatedCounters = [];


        while (
            $counter =
                $updatedCounterResult->fetch_assoc()
        ) {

            $updatedCounters[] =
                $counter;

        }


        $updatedHero['counters'] =
            $updatedCounters;


    } catch (
        Throwable $e
    ) {

        error_log(
            'Hero post-update fetch warning: ' .
            $e->getMessage()
        );


        // Fall back to what we already know was written,
        // rather than failing a request whose write succeeded.
        $updatedHero = array_merge(
            $existingHero,
            [
                'id'                 => $id,
                'badge_text'         => $badge_text,
                'title_text'         => $title_text,
                'title_highlight'    => $title_highlight,
                'subtitle'           => $subtitle,
                'primary_btn_text'   => $primary_btn_text,
                'primary_btn_link'   => $primary_btn_link,
                'secondary_btn_text' => $secondary_btn_text,
                'secondary_btn_link' => $secondary_btn_link,
                'background_image'   => $background_image,
                'counters'           => [],
            ]
        );

    }


    /* =================================================
       SUCCESS
    ================================================= */

    admin_success([
        'message' =>
            'Hero section and statistics updated successfully.',

        'data' =>
            $updatedHero
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