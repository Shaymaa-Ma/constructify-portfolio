
<?php

/**
 * /Server/api/admin/services/index.php
 *
 * SERVICES SECTION API
 *
 * GET:
 *   /admin/services/index.php
 *      -> Get Services section + counters
 *
 * PUT / PATCH:
 *   JSON body
 *      -> Update section without image
 *
 * POST + _method=PUT:
 *   multipart/form-data
 *      -> Update section with image
 *
 * Services section is EDIT ONLY.
 * No CREATE.
 * No DELETE.
 */

require_once __DIR__ . '/../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");


/* =========================================================
   REQUEST METHOD
========================================================= */

$method = strtoupper($_SERVER['REQUEST_METHOD']);


/*
 * For multipart/form-data we use:
 *
 * POST + _method=PUT
 *
 * because PHP handles multipart uploads through POST.
 *
 * This keeps the frontend compatible with normal PHP
 * file-upload handling.
 */

if (
    $method === 'POST' &&
    isset($_POST['_method'])
) {

    $requestedMethod =
        strtoupper(trim((string)$_POST['_method']));

    if (
        $requestedMethod === 'PUT' ||
        $requestedMethod === 'PATCH'
    ) {
        $method = $requestedMethod;
    }
}


/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

/*
 * Current structure:
 *
 * construction-portfolio/
 * ├── Server/
 * │   └── api/
 * │       └── admin/
 * │           └── services/
 * │               └── index.php
 * │
 * └── uploads/
 *     └── services/
 *
 * From services/index.php:
 *
 * __DIR__
 *   services
 *
 * ../../../
 *   Server
 *
 * ../../../../
 *   construction-portfolio
 */

$uploadDir =
    dirname(__DIR__, 4) .
    '/uploads/services';


$uploadUrl =
    '/construction-portfolio/uploads/services';


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
   GET SERVICES SECTION + COUNTERS
========================================================= */

if ($method === 'GET') {


    /* -----------------------------------------------------
       GET SECTION
    ----------------------------------------------------- */

    $result = $conn->query("
        SELECT *
        FROM services_section
        ORDER BY id ASC
        LIMIT 1
    ");


    if (!$result) {

        send_json([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }


    $section =
        $result->fetch_assoc();


    if (!$section) {

        send_json([
            "success" => false,
            "error" =>
                "Services section not found."
        ], 404);
    }


    /* -----------------------------------------------------
       GET COUNTERS
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

        send_json([
            "success" => false,
            "error" => $conn->error
        ], 500);
    }


    $counters = [];


    while (
        $counter =
        $counterResult->fetch_assoc()
    ) {

        $counters[] = $counter;
    }


    /* -----------------------------------------------------
       IMAGE URL
    ----------------------------------------------------- */

    $panelImage =
        $section['panel_image'] ?? '';


    $panelImageUrl = null;


    if ($panelImage !== '') {

        /*
         * If database already contains a full URL,
         * preserve it.
         */

        if (
            str_starts_with(
                $panelImage,
                'http://'
            ) ||
            str_starts_with(
                $panelImage,
                'https://'
            ) ||
            str_starts_with(
                $panelImage,
                '/'
            )
        ) {

            $panelImageUrl =
                $panelImage;

        } else {

            $panelImageUrl =
                $uploadUrl .
                '/' .
                ltrim(
                    $panelImage,
                    '/'
                );
        }
    }


    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    send_json([
        "success" => true,
        "data" => $section,
        "counters" => $counters,
        "image_url" => $panelImageUrl
    ]);
}


/* =========================================================
   UPDATE SERVICES SECTION
========================================================= */

if (
    $method === 'PUT' ||
    $method === 'PATCH'
) {

    /*
     * Only authenticated admins can update.
     */

    require_auth();


    /* =====================================================
       READ INPUT
    ===================================================== */

    $contentType =
        $_SERVER['CONTENT_TYPE'] ??
        $_SERVER['HTTP_CONTENT_TYPE'] ??
        '';


    $input = [];


    /*
     * Multipart request
     *
     * React sends:
     *
     * POST
     * Content-Type: multipart/form-data
     *
     * _method=PUT
     */

    if (
        stripos(
            $contentType,
            'multipart/form-data'
        ) !== false
    ) {

        $input = $_POST;

    } else {

        /*
         * JSON request
         */

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

                $input = $decoded;
            }
        }
    }


    /* =====================================================
       SECTION ID
    ===================================================== */

    $id =
        isset($_GET['id'])
            ? (int)$_GET['id']
            : (int)($input['id'] ?? 0);


    /*
     * Your services section normally has one row.
     * If the frontend doesn't send an ID, use 1.
     */

    if ($id <= 0) {
        $id = 1;
    }


    /* =====================================================
       GET EXISTING SECTION
    ===================================================== */

    $existingStmt =
        $conn->prepare("
            SELECT *
            FROM services_section
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
            "error" =>
                "Services section not found."
        ], 404);
    }


    /* =====================================================
       SECTION FIELDS
    ===================================================== */

    /*
     * IMPORTANT:
     *
     * If a field is not supplied,
     * keep the current database value.
     */

    $title =
        array_key_exists(
            'title',
            $input
        )
            ? trim(
                (string)$input['title']
            )
            : ($existing['title'] ?? '');


    $subtitle =
        array_key_exists(
            'subtitle',
            $input
        )
            ? trim(
                (string)$input['subtitle']
            )
            : ($existing['subtitle'] ?? '');


    $panelTitle =
        array_key_exists(
            'panel_title',
            $input
        )
            ? trim(
                (string)$input['panel_title']
            )
            : ($existing['panel_title'] ?? '');


    $panelBtnText =
        array_key_exists(
            'panel_btn_text',
            $input
        )
            ? trim(
                (string)$input['panel_btn_text']
            )
            : ($existing['panel_btn_text'] ?? '');


    $panelBtnLink =
        array_key_exists(
            'panel_btn_link',
            $input
        )
            ? trim(
                (string)$input['panel_btn_link']
            )
            : ($existing['panel_btn_link'] ?? '');


    $statsBadgeText =
        array_key_exists(
            'stats_badge_text',
            $input
        )
            ? trim(
                (string)$input['stats_badge_text']
            )
            : ($existing['stats_badge_text'] ?? '');


    $statsTitle =
        array_key_exists(
            'stats_title',
            $input
        )
            ? trim(
                (string)$input['stats_title']
            )
            : ($existing['stats_title'] ?? '');


    $statsDescription =
        array_key_exists(
            'stats_description',
            $input
        )
            ? trim(
                (string)$input['stats_description']
            )
            : ($existing['stats_description'] ?? '');


    $statsBtnText =
        array_key_exists(
            'stats_btn_text',
            $input
        )
            ? trim(
                (string)$input['stats_btn_text']
            )
            : ($existing['stats_btn_text'] ?? '');


    $statsBtnLink =
        array_key_exists(
            'stats_btn_link',
            $input
        )
            ? trim(
                (string)$input['stats_btn_link']
            )
            : ($existing['stats_btn_link'] ?? '');


    /* =====================================================
       IMAGE
    ===================================================== */

    $panelImage =
        $existing['panel_image'] ?? '';


    $oldPanelImage =
        $panelImage;


    $newUploadedFile = null;


    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    if (
        isset($_FILES['panel_image']) &&
        is_array($_FILES['panel_image'])
    ) {

        $file =
            $_FILES['panel_image'];


        /*
         * If no file was selected,
         * do nothing.
         */

        if (
            ($file['error'] ?? UPLOAD_ERR_NO_FILE)
            !== UPLOAD_ERR_NO_FILE
        ) {


            /* ---------------------------------------------
               UPLOAD ERROR
            --------------------------------------------- */

            if (
                $file['error']
                !== UPLOAD_ERR_OK
            ) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Image upload failed."
                ], 400);
            }


            /* ---------------------------------------------
               SIZE
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
               MIME
            --------------------------------------------- */

            $finfo =
                new finfo(
                    FILEINFO_MIME_TYPE
                );


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
               DIRECTORY
            --------------------------------------------- */

            if (
                !is_dir($uploadDir)
            ) {

                if (
                    !mkdir(
                        $uploadDir,
                        0755,
                        true
                    )
                ) {

                    send_json([
                        "success" => false,
                        "error" =>
                            "Unable to create image upload directory."
                    ], 500);
                }
            }


            /* ---------------------------------------------
               SAFE FILENAME
            --------------------------------------------- */

            $extension =
                $allowedTypes[$mimeType];


            $filename =
                'services_panel_' .
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
               MOVE FILE
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


            /*
             * Store only filename in database.
             */

            $panelImage =
                $filename;


            $newUploadedFile =
                $destination;
        }
    }


    /* =====================================================
       COUNTERS
    ===================================================== */

    $counters = [];


    if (
        array_key_exists(
            'counters',
            $input
        )
    ) {

        /*
         * FormData sends counters as JSON string.
         */

        if (
            is_string(
                $input['counters']
            )
        ) {

            $decodedCounters =
                json_decode(
                    $input['counters'],
                    true
                );

        } else {

            /*
             * JSON request may already
             * contain an array.
             */

            $decodedCounters =
                $input['counters'];
        }


        if (
            !is_array(
                $decodedCounters
            )
        ) {

            /*
             * Empty counters is allowed.
             */

            if (
                trim(
                    (string)$input['counters']
                ) !== ''
            ) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Invalid counters data."
                ], 422);
            }

        } else {

            $counters =
                $decodedCounters;
        }
    }


    /* =====================================================
       TRANSACTION
    ===================================================== */

    $conn->begin_transaction();


    try {


        /* =================================================
           UPDATE SECTION
        ================================================= */

        $stmt =
            $conn->prepare("
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

            throw new Exception(
                $conn->error
            );
        }


        $stmt->bind_param(
            "sssssssssssi",
            $title,
            $subtitle,
            $panelImage,
            $panelTitle,
            $panelBtnText,
            $panelBtnLink,
            $statsBadgeText,
            $statsTitle,
            $statsDescription,
            $statsBtnText,
            $statsBtnLink,
            $id
        );


        if (
            !$stmt->execute()
        ) {

            throw new Exception(
                $stmt->error
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
                      AND section_key = 'services'
                ");


            if (!$counterStmt) {

                throw new Exception(
                    $conn->error
                );
            }


            foreach (
                $counters
                as $counter
            ) {

                $counterId =
                    (int)(
                        $counter['id']
                        ?? 0
                    );


                if (
                    $counterId <= 0
                ) {
                    continue;
                }


                $icon =
                    trim(
                        (string)(
                            $counter['icon']
                            ?? ''
                        )
                    );


                $value =
                    trim(
                        (string)(
                            $counter['value']
                            ?? ''
                        )
                    );


                $label =
                    trim(
                        (string)(
                            $counter['label']
                            ?? ''
                        )
                    );


                $displayOrder =
                    (int)(
                        $counter['display_order']
                        ?? 0
                    );


                $counterStmt->bind_param(
                    "sssii",
                    $icon,
                    $value,
                    $label,
                    $displayOrder,
                    $counterId
                );


                if (
                    !$counterStmt->execute()
                ) {

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


        /* =================================================
           DELETE OLD IMAGE
        ================================================= */

        if (
            $newUploadedFile &&
            $oldPanelImage &&
            $oldPanelImage !== $panelImage
        ) {

            /*
             * Database should contain only filename,
             * but this also safely handles an old full path.
             */

            $oldFilename =
                basename(
                    parse_url(
                        $oldPanelImage,
                        PHP_URL_PATH
                    )
                    ?: $oldPanelImage
                );


            if (
                $oldFilename
            ) {

                $oldPath =
                    rtrim(
                        $uploadDir,
                        DIRECTORY_SEPARATOR
                    ) .
                    DIRECTORY_SEPARATOR .
                    $oldFilename;


                if (
                    is_file(
                        $oldPath
                    )
                ) {

                    @unlink(
                        $oldPath
                    );
                }
            }
        }


        /* =================================================
           GET UPDATED SECTION
        ================================================= */

        $updatedStmt =
            $conn->prepare("
                SELECT *
                FROM services_section
                WHERE id = ?
                LIMIT 1
            ");


        if (!$updatedStmt) {

            throw new Exception(
                $conn->error
            );
        }


        $updatedStmt->bind_param(
            "i",
            $id
        );


        $updatedStmt->execute();


        $updatedResult =
            $updatedStmt->get_result();


        $updatedSection =
            $updatedResult->fetch_assoc();


        $updatedStmt->close();


        /* =================================================
           IMAGE URL
        ================================================= */

        $updatedImage =
            $updatedSection['panel_image']
            ?? '';


        $imageUrl = null;


        if (
            $updatedImage !== ''
        ) {

            if (
                str_starts_with(
                    $updatedImage,
                    'http://'
                ) ||
                str_starts_with(
                    $updatedImage,
                    'https://'
                ) ||
                str_starts_with(
                    $updatedImage,
                    '/'
                )
            ) {

                $imageUrl =
                    $updatedImage;

            } else {

                $imageUrl =
                    $uploadUrl .
                    '/' .
                    ltrim(
                        $updatedImage,
                        '/'
                    );
            }
        }


        /* =================================================
           RESPONSE
        ================================================= */

        send_json([
            "success" => true,
            "message" =>
                "Services section updated successfully.",
            "data" =>
                $updatedSection,
            "counters" =>
                $counters,
            "image_url" =>
                $imageUrl
        ]);


    } catch (
        Throwable $e
    ) {

        $conn->rollback();


        /*
         * If DB update failed after uploading
         * the new image, remove the new file.
         */

        if (
            $newUploadedFile &&
            is_file(
                $newUploadedFile
            )
        ) {

            @unlink(
                $newUploadedFile
            );
        }


        send_json([
            "success" => false,
            "error" =>
                $e->getMessage()
        ], 500);
    }
}


/* =========================================================
   METHOD NOT ALLOWED
========================================================= */

send_json([
    "success" => false,
    "error" =>
        "Method not allowed."
], 405);
