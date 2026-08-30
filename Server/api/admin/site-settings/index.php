<?php

require_once __DIR__ . '/../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");


/* =========================================================
   FATAL ERROR SAFETY NET
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
            header("Content-Type: application/json; charset=utf-8");
        }

        echo json_encode([
            "success" => false,
            "error" =>
                "Server error: " .
                $error["message"] .
                " in " .
                $error["file"] .
                " on line " .
                $error["line"],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
});


/* =========================================================
   METHOD
========================================================= */

$method = $_SERVER["REQUEST_METHOD"];


/*
 * Support:
 *
 * POST + _method=PUT
 *
 * This is the same approach used by
 * Hero / About / Services.
 */

if (
    $method === "POST" &&
    isset($_POST["_method"])
) {

    $overrideMethod =
        strtoupper(
            trim($_POST["_method"])
        );

    if (
        $overrideMethod === "PUT" ||
        $overrideMethod === "PATCH"
    ) {

        $method = $overrideMethod;

    }

}


/* =========================================================
   SEND JSON
========================================================= */

function send_json(
    array $data,
    int $status = 200
): void {

    http_response_code($status);

    $json = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    if ($json === false) {

        $json = json_encode([
            "success" => false,
            "error" =>
                "Unable to encode server response."
        ]);

    }

    echo $json;

    exit;
}


/* =========================================================
   GET REQUEST
========================================================= */

function get_request_data(): array
{
    /*
     * Multipart/form-data
     */
    if (
        isset($_SERVER["CONTENT_TYPE"]) &&
        stripos(
            $_SERVER["CONTENT_TYPE"],
            "multipart/form-data"
        ) !== false
    ) {

        return $_POST;

    }


    /*
     * JSON
     */
    $raw =
        file_get_contents("php://input");

    if (!$raw) {
        return [];
    }

    $data =
        json_decode(
            $raw,
            true
        );

    return is_array($data)
        ? $data
        : [];
}


/* =========================================================
   GET SITE SETTINGS
========================================================= */

function fetch_site_settings(
    mysqli $conn
): ?array {

    $stmt = $conn->prepare("
        SELECT *
        FROM site_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    if (!$stmt) {
        throw new Exception(
            $conn->error
        );
    }

    if (!$stmt->execute()) {

        $error =
            $stmt->error;

        $stmt->close();

        throw new Exception(
            $error
        );
    }

    $result =
        $stmt->get_result();

    $row =
        $result->fetch_assoc();

    $stmt->close();

    return $row ?: null;
}


/* =========================================================
   MAIN
========================================================= */

try {


    /* =====================================================
       GET
    ===================================================== */

    if ($method === "GET") {

        $settings =
            fetch_site_settings($conn);

        if (!$settings) {

            send_json([
                "success" => false,
                "error" =>
                    "Site settings not configured yet."
            ], 404);

        }

        send_json([
            "success" => true,
            "data" => $settings
        ]);

    }


    /* =====================================================
       PUT / PATCH
    ===================================================== */

    if (
        $method === "PUT" ||
        $method === "PATCH"
    ) {

        require_admin();

        $input =
            get_request_data();


        /*
         * Fields that exist in the
         * site_settings table.
         */

        $fields = [
            "company_name",
            "phone",
            "email",
            "logo_icon",
            "cta_text",
            "cta_link",
        ];


        /* =================================================
           GET EXISTING ROW
        ================================================= */

        $existing =
            fetch_site_settings($conn);

        if (!$existing) {

            send_json([
                "success" => false,
                "error" =>
                    "Site settings not configured yet."
            ], 404);

        }


        /* =================================================
           VALIDATE EMAIL
        ================================================= */

        if (
            array_key_exists(
                "email",
                $input
            ) &&
            trim(
                (string)$input["email"]
            ) !== ""
        ) {

            $email =
                trim(
                    (string)$input["email"]
                );

            if (
                !filter_var(
                    $email,
                    FILTER_VALIDATE_EMAIL
                )
            ) {

                send_json([
                    "success" => false,
                    "error" =>
                        "Invalid email address."
                ], 422);

            }

        }


        /* =================================================
           BUILD UPDATE
        ================================================= */

        $set = [];

        $params = [];


        foreach (
            $fields
            as $field
        ) {

            if (
                array_key_exists(
                    $field,
                    $input
                )
            ) {

                $set[] =
                    "`$field` = ?";

                $params[] =
                    $input[$field];

            }

        }


        if (empty($set)) {

            send_json([
                "success" => false,
                "error" =>
                    "No fields provided to update."
            ], 422);

        }


        /* =================================================
           TYPES
        ================================================= */

        $types =
            str_repeat(
                "s",
                count($params)
            );

        $params[] =
            (int)$existing["id"];


        $types .= "i";


        /* =================================================
           SQL
        ================================================= */

        $sql = "
            UPDATE site_settings
            SET " .
            implode(
                ", ",
                $set
            ) .
            " WHERE id = ?
        ";


        $stmt =
            $conn->prepare($sql);

        if (!$stmt) {

            throw new Exception(
                $conn->error
            );

        }


        $stmt->bind_param(
            $types,
            ...$params
        );


        if (!$stmt->execute()) {

            $error =
                $stmt->error;

            $stmt->close();

            throw new Exception(
                $error
            );

        }


        $stmt->close();


        /* =================================================
           FETCH UPDATED ROW
        ================================================= */

        $updated =
            fetch_site_settings($conn);


        send_json([
            "success" => true,
            "message" =>
                "Site settings updated successfully.",
            "data" => $updated
        ]);

    }


    /* =====================================================
       METHOD NOT ALLOWED
    ===================================================== */

    send_json([
        "success" => false,
        "error" =>
            "Method not allowed."
    ], 405);


} catch (Throwable $e) {

    error_log(
        "Site settings endpoint error: " .
        $e->getMessage()
    );

    send_json([
        "success" => false,
        "error" =>
            $e->getMessage()
    ], 500);

}