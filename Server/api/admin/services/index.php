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
   FATAL-ERROR SAFETY NET

   Uncaught Exceptions/Errors are already handled by the
   try/catch(Throwable) blocks below, but a TRUE fatal error
   (E_ERROR, a parse error, memory exhausted, etc.) can't be
   caught by any try/catch — PHP just stops, and with
   display_errors off the client gets a blank HTTP 200 body,
   which looks exactly like a silent success on the frontend.
   This shutdown handler catches that case and still emits
   valid JSON so a failure is always visible instead of
   invisible.
========================================================= */

register_shutdown_function(function () {

    $error = error_get_last();

    if (
        $error &&
        in_array(
            $error['type'],
            [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR],
            true
        )
    ) {

        if (!headers_sent()) {

            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }

        echo json_encode([
            'success' => false,
            'error' =>
                'Server error: ' . $error['message'] .
                ' in ' . $error['file'] .
                ' on line ' . $error['line'],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
});


/* =========================================================
   REQUEST METHOD
========================================================= */

$method = strtoupper($_SERVER['REQUEST_METHOD']);

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
 * Saved directly in the project-root /uploads/ folder — the
 * SAME folder hero, about, and projects save into — not a
 * uploads/services/ subfolder.
 *
 * The previous version used uploads/services/ but stored only
 * the bare filename in the DB (no "services/" prefix), and
 * getImageUrl() on the frontend only strips a leading
 * "uploads/", not "uploads/services/". So a freshly uploaded
 * image saved to disk fine but resolved to the wrong URL
 * everywhere it was displayed. Keeping everything in one flat
 * uploads/ folder (like every other section) avoids the whole
 * class of bug.
 *
 * construction-portfolio/
 * ├── Server/
 * │   └── api/
 * │       └── admin/
 * │           └── services/
 * │               └── index.php   (= __DIR__)
 * │
 * └── uploads/
 *
 * ../          -> admin/
 * ../../       -> api/
 * ../../../    -> Server/
 * ../../../../ -> construction-portfolio/
 */

$uploadDir = __DIR__ . '/../../../../uploads/';

$uploadUrl = '/construction-portfolio/uploads/';


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


    $panelImage =
        $section['panel_image'] ?? '';


    $panelImageUrl = null;


    if ($panelImage !== '') {

        if (
            str_starts_with($panelImage, 'http://') ||
            str_starts_with($panelImage, 'https://') ||
            str_starts_with($panelImage, '/')
        ) {

            $panelImageUrl = $panelImage;

        } else {

            $panelImageUrl =
                $uploadUrl .
                ltrim($panelImage, '/');
        }
    }


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

    require_admin();


    /* =====================================================
       OUTER SAFETY NET
       Wraps the ENTIRE handler below — including the
       existing-row lookup, which previously ran with no
       try/catch around it at all. Since PHP 8.1+ makes mysqli
       throw exceptions on DB errors by default, any query
       failure anywhere in this handler now surfaces as a
       proper JSON error response instead of an uncaught
       exception producing a blank body.
    ===================================================== */

    try {


    /* =====================================================
       READ INPUT
    ===================================================== */

    $contentType =
        $_SERVER['CONTENT_TYPE'] ??
        $_SERVER['HTTP_CONTENT_TYPE'] ??
        '';


    $input = [];


    if (
        stripos($contentType, 'multipart/form-data') !== false
    ) {

        $input = $_POST;

    } else {

        $rawBody = file_get_contents("php://input");


        if ($rawBody !== false && trim($rawBody) !== '') {

            $decoded = json_decode($rawBody, true);

            if (is_array($decoded)) {
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

    if ($id <= 0) {
        $id = 1;
    }


    /* =====================================================
       GET EXISTING SECTION
    ===================================================== */

    $existingStmt = $conn->prepare("
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


    $existingStmt->bind_param("i", $id);
    $existingStmt->execute();

    $existingResult = $existingStmt->get_result();
    $existing = $existingResult->fetch_assoc();

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
       (keep the current DB value when a field isn't supplied,
       so a partial update never blanks something out)
    ===================================================== */

    $title =
        array_key_exists('title', $input)
            ? trim((string)$input['title'])
            : ($existing['title'] ?? '');

    $subtitle =
        array_key_exists('subtitle', $input)
            ? trim((string)$input['subtitle'])
            : ($existing['subtitle'] ?? '');

    $panelTitle =
        array_key_exists('panel_title', $input)
            ? trim((string)$input['panel_title'])
            : ($existing['panel_title'] ?? '');

    $panelBtnText =
        array_key_exists('panel_btn_text', $input)
            ? trim((string)$input['panel_btn_text'])
            : ($existing['panel_btn_text'] ?? '');

    $panelBtnLink =
        array_key_exists('panel_btn_link', $input)
            ? trim((string)$input['panel_btn_link'])
            : ($existing['panel_btn_link'] ?? '');

    $statsBadgeText =
        array_key_exists('stats_badge_text', $input)
            ? trim((string)$input['stats_badge_text'])
            : ($existing['stats_badge_text'] ?? '');

    $statsTitle =
        array_key_exists('stats_title', $input)
            ? trim((string)$input['stats_title'])
            : ($existing['stats_title'] ?? '');

    $statsDescription =
        array_key_exists('stats_description', $input)
            ? trim((string)$input['stats_description'])
            : ($existing['stats_description'] ?? '');

    $statsBtnText =
        array_key_exists('stats_btn_text', $input)
            ? trim((string)$input['stats_btn_text'])
            : ($existing['stats_btn_text'] ?? '');

    $statsBtnLink =
        array_key_exists('stats_btn_link', $input)
            ? trim((string)$input['stats_btn_link'])
            : ($existing['stats_btn_link'] ?? '');


    /* =====================================================
       IMAGE
    ===================================================== */

    $panelImage = $existing['panel_image'] ?? '';
    $oldPanelImage = $panelImage;
    $newUploadedFile = null; // full path on disk, for cleanup
    $newImageFilename = null; // bare filename, for the DB


    /* =====================================================
       STEP 1 — IMAGE UPLOAD
       Happens before the DB transaction. Nothing has been
       written yet, so validation failures can exit directly.
    ===================================================== */

    if (
        isset($_FILES['panel_image']) &&
        is_array($_FILES['panel_image']) &&
        ($_FILES['panel_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES['panel_image'];


        if ($file['error'] !== UPLOAD_ERR_OK) {

            send_json([
                "success" => false,
                "error" => "Image upload failed."
            ], 400);
        }


        $maxFileSize = 5 * 1024 * 1024;

        if ($file['size'] > $maxFileSize) {

            send_json([
                "success" => false,
                "error" =>
                    "Image is too large. Maximum size is 5 MB."
            ], 422);
        }


        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);


        $allowedTypes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];


        if (!isset($allowedTypes[$mimeType])) {

            send_json([
                "success" => false,
                "error" =>
                    "Invalid image type. Allowed formats: JPG, PNG, WEBP and GIF."
            ], 422);
        }


        if (!is_dir($uploadDir)) {

            if (!mkdir($uploadDir, 0755, true)) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Unable to create image upload directory."
                ], 500);
            }
        }

        if (!is_writable($uploadDir)) {

            send_json([
                "success" => false,
                "error" => "Uploads directory is not writable."
            ], 500);
        }


        /* -------------------------------------------------
           Filename: original name (sanitized), extension
           forced to match the detected mime type, numeric
           suffix if that name is already taken.
        ------------------------------------------------- */

        $extension = $allowedTypes[$mimeType];

        $originalName =
            pathinfo($file['name'], PATHINFO_FILENAME);

        $safeName =
            preg_replace('/[^A-Za-z0-9_\-]+/', '-', $originalName);

        $safeName = trim($safeName, '-');

        if ($safeName === '') {
            $safeName = 'services-panel';
        }

        $filename = $safeName . '.' . $extension;

        $destination =
            rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $filename;

        $suffix = 1;

        while (is_file($destination)) {

            $filename = $safeName . '-' . $suffix . '.' . $extension;

            $destination =
                rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $filename;

            $suffix++;
        }


        if (!move_uploaded_file($file['tmp_name'], $destination)) {

            send_json([
                "success" => false,
                "error" => "Unable to save uploaded image."
            ], 500);
        }


        $panelImage = $filename;
        $newImageFilename = $filename;
        $newUploadedFile = $destination;
    }


    /* =====================================================
       COUNTERS
    ===================================================== */

    $counters = [];

    if (array_key_exists('counters', $input)) {

        $decodedCounters =
            is_string($input['counters'])
                ? json_decode($input['counters'], true)
                : $input['counters'];

        if (!is_array($decodedCounters)) {

            if (trim((string)$input['counters']) !== '') {

                if ($newUploadedFile && is_file($newUploadedFile)) {
                    @unlink($newUploadedFile);
                }

                send_json([
                    "success" => false,
                    "error" => "Invalid counters data."
                ], 422);
            }

        } else {

            $counters = $decodedCounters;
        }
    }


    /* =====================================================
       STEP 2 — DB TRANSACTION
       ONLY the section UPDATE + counter UPDATEs live in this
       try/catch. A failure here means the write genuinely
       failed, so rolling back and deleting the newly uploaded
       image is correct.
    ===================================================== */

    $conn->begin_transaction();

    try {

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

        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }

        $stmt->close();


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

                $counterId = (int)($counter['id'] ?? 0);

                if ($counterId <= 0) {
                    continue;
                }

                $icon = trim((string)($counter['icon'] ?? ''));
                $value = trim((string)($counter['value'] ?? ''));
                $label = trim((string)($counter['label'] ?? ''));
                $displayOrder = (int)($counter['display_order'] ?? 0);

                $counterStmt->bind_param(
                    "sssii",
                    $icon,
                    $value,
                    $label,
                    $displayOrder,
                    $counterId
                );

                if (!$counterStmt->execute()) {
                    throw new Exception($counterStmt->error);
                }
            }

            $counterStmt->close();
        }


        $conn->commit();


    } catch (Throwable $e) {

        $conn->rollback();

        if ($newUploadedFile && is_file($newUploadedFile)) {
            @unlink($newUploadedFile);
        }

        send_json([
            "success" => false,
            "error" => $e->getMessage()
        ], 500);
    }


    /* =====================================================
       STEP 3 — POST-COMMIT CLEANUP + RESPONSE
       The write already succeeded. Nothing below this point
       can turn that into a reported failure — each step is
       best-effort and only logs on failure.
    ===================================================== */

    if (
        $newImageFilename &&
        $oldPanelImage &&
        $oldPanelImage !== $panelImage
    ) {

        try {

            $oldFilename =
                basename(
                    parse_url($oldPanelImage, PHP_URL_PATH)
                        ?: $oldPanelImage
                );

            if ($oldFilename) {

                $oldPath =
                    rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $oldFilename;

                if (is_file($oldPath)) {
                    @unlink($oldPath);
                }
            }

        } catch (Throwable $e) {

            error_log(
                'Services old-image cleanup warning: ' . $e->getMessage()
            );
        }
    }


    $updatedSection = null;
    $imageUrl = null;

    try {

        $updatedStmt = $conn->prepare("
            SELECT *
            FROM services_section
            WHERE id = ?
            LIMIT 1
        ");

        if (!$updatedStmt) {
            throw new Exception($conn->error);
        }

        $updatedStmt->bind_param("i", $id);

        if (!$updatedStmt->execute()) {
            $updatedStmt->close();
            throw new Exception('Unable to load updated Services section.');
        }

        $updatedResult = $updatedStmt->get_result();
        $updatedSection = $updatedResult->fetch_assoc();

        $updatedStmt->close();

        $updatedImage = $updatedSection['panel_image'] ?? '';

        if ($updatedImage !== '') {

            if (
                str_starts_with($updatedImage, 'http://') ||
                str_starts_with($updatedImage, 'https://') ||
                str_starts_with($updatedImage, '/')
            ) {

                $imageUrl = $updatedImage;

            } else {

                $imageUrl = $uploadUrl . ltrim($updatedImage, '/');
            }
        }

    } catch (Throwable $e) {

        error_log(
            'Services post-update fetch warning: ' . $e->getMessage()
        );

        $updatedSection = array_merge(
            $existing,
            [
                'id'                 => $id,
                'title'              => $title,
                'subtitle'           => $subtitle,
                'panel_image'        => $panelImage,
                'panel_title'        => $panelTitle,
                'panel_btn_text'     => $panelBtnText,
                'panel_btn_link'     => $panelBtnLink,
                'stats_badge_text'   => $statsBadgeText,
                'stats_title'        => $statsTitle,
                'stats_description'  => $statsDescription,
                'stats_btn_text'     => $statsBtnText,
                'stats_btn_link'     => $statsBtnLink,
            ]
        );

        if ($panelImage !== '') {
            $imageUrl = $uploadUrl . ltrim($panelImage, '/');
        }
    }


    send_json([
        "success" => true,
        "message" =>
            "Services section updated successfully.",
        "data" => $updatedSection,
        "counters" => $counters,
        "image_url" => $imageUrl
    ]);


    } catch (Throwable $e) {

        /*
         * Catches anything that escaped the inner try/catch
         * blocks above — including the existing-row lookup,
         * which has no try/catch of its own. This is the
         * safety net that turns "blank response" into a real,
         * visible error.
         */

        error_log(
            'Services update — uncaught error: ' . $e->getMessage()
        );

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