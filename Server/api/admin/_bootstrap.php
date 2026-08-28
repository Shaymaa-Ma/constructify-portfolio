<?php

/*
|--------------------------------------------------------------------------
| Admin API Bootstrap
|--------------------------------------------------------------------------
| Shared setup for all Admin API endpoints.
|
| Responsibilities:
| - CORS
| - Database connection
| - JSON responses
| - Request helpers
| - Admin authentication
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

require_once __DIR__ . '/../../includes/cors.php';


/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

require_once __DIR__ . '/../../includes/db.php';


/*
|--------------------------------------------------------------------------
| JSON Response Header
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');


/*
|--------------------------------------------------------------------------
| JSON Response Helper
|--------------------------------------------------------------------------
*/

function admin_json(array $data, int $status = 200): void
{
    http_response_code($status);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Error Response
|--------------------------------------------------------------------------
*/

function admin_error(
    string $message,
    int $status = 400,
    array $extra = []
): void {

    admin_json(
        array_merge(
            [
                'success' => false,
                'error' => $message
            ],
            $extra
        ),
        $status
    );
}


/*
|--------------------------------------------------------------------------
| Success Response
|--------------------------------------------------------------------------
*/

function admin_success(
    array $data = [],
    int $status = 200
): void {

    admin_json(
        array_merge(
            [
                'success' => true
            ],
            $data
        ),
        $status
    );
}


/*
|--------------------------------------------------------------------------
| Request Method
|--------------------------------------------------------------------------
*/

function request_method(): string
{
    return strtoupper(
        $_SERVER['REQUEST_METHOD'] ?? 'GET'
    );
}


/*
|--------------------------------------------------------------------------
| Require HTTP Method
|--------------------------------------------------------------------------
*/

function require_method(
    string|array $methods
): void {

    $methods = is_array($methods)
        ? $methods
        : [$methods];

    $methods = array_map(
        'strtoupper',
        $methods
    );

    if (
        !in_array(
            request_method(),
            $methods,
            true
        )
    ) {

        header(
            'Allow: ' .
            implode(', ', $methods)
        );

        admin_error(
            'Method not allowed.',
            405
        );
    }
}


/*
|--------------------------------------------------------------------------
| Get JSON Request Body
|--------------------------------------------------------------------------
*/

function get_json_body(): array
{
    $raw = file_get_contents(
        'php://input'
    );

    if (
        $raw === false ||
        trim($raw) === ''
    ) {
        return [];
    }

    $data = json_decode(
        $raw,
        true
    );

    if (!is_array($data)) {

        admin_error(
            'Invalid JSON request body.',
            400
        );
    }

    return $data;
}


/*
|--------------------------------------------------------------------------
| Get Request ID
|--------------------------------------------------------------------------
*/

function get_request_id(): ?int
{
    if (!isset($_GET['id'])) {
        return null;
    }

    $id = filter_var(
        $_GET['id'],
        FILTER_VALIDATE_INT
    );

    if (
        $id === false ||
        $id <= 0
    ) {

        admin_error(
            'Invalid ID.',
            400
        );
    }

    return $id;
}


/*
|--------------------------------------------------------------------------
| Authorization Header
|--------------------------------------------------------------------------
*/

function get_authorization_header(): string
{
    $header = '';


    /*
     * Normal Apache header
     */

    if (
        isset(
            $_SERVER['HTTP_AUTHORIZATION']
        )
    ) {

        $header = trim(
            $_SERVER['HTTP_AUTHORIZATION']
        );
    }


    /*
     * Apache redirect header
     */

    if (
        $header === '' &&
        isset(
            $_SERVER[
                'REDIRECT_HTTP_AUTHORIZATION'
            ]
        )
    ) {

        $header = trim(
            $_SERVER[
                'REDIRECT_HTTP_AUTHORIZATION'
            ]
        );
    }


    /*
     * getallheaders fallback
     */

    if (
        $header === '' &&
        function_exists('getallheaders')
    ) {

        $headers = getallheaders();

        foreach (
            $headers as $key => $value
        ) {

            if (
                strtolower($key) ===
                'authorization'
            ) {

                $header = trim($value);

                break;
            }
        }
    }


    return $header;
}


/*
|--------------------------------------------------------------------------
| Extract Bearer Token
|--------------------------------------------------------------------------
*/

function get_bearer_token(): ?string
{
    $header =
        get_authorization_header();

    if ($header === '') {
        return null;
    }

    if (
        preg_match(
            '/^Bearer\s+(.+)$/i',
            $header,
            $matches
        )
    ) {

        return trim(
            $matches[1]
        );
    }

    return null;
}


/*
|--------------------------------------------------------------------------
| Start Session
|--------------------------------------------------------------------------
*/

if (
    session_status() ===
    PHP_SESSION_NONE
) {

    session_start();
}


/*
|--------------------------------------------------------------------------
| Require Admin Authentication
|--------------------------------------------------------------------------
*/

function require_admin(): array
{
    $token =
        get_bearer_token();

    if (!$token) {

        admin_error(
            'Authentication required.',
            401
        );
    }


    /*
     * Check session
     */

    if (
        !isset(
            $_SESSION['admin_token']
        ) ||
        !isset(
            $_SESSION['admin_id']
        )
    ) {

        admin_error(
            'Invalid or expired authentication.',
            401
        );
    }


    /*
     * Compare token securely
     */

    if (
        !hash_equals(
            (string)
            $_SESSION['admin_token'],

            (string)
            $token
        )
    ) {

        admin_error(
            'Invalid or expired authentication.',
            401
        );
    }


    return [
        'id' =>
            (int)
            $_SESSION['admin_id'],

        'name' =>
            $_SESSION['admin_name']
            ?? null,

        'email' =>
            $_SESSION['admin_email']
            ?? null,

        'role' =>
            $_SESSION['admin_role']
            ?? 'admin'
    ];
}


/*
|--------------------------------------------------------------------------
| Alias
|--------------------------------------------------------------------------
*/

function authenticate_admin(): array
{
    return require_admin();
}


/*
|--------------------------------------------------------------------------
| Required Fields
|--------------------------------------------------------------------------
*/

function require_fields(
    array $data,
    array $fields
): void {

    foreach ($fields as $field) {

        if (
            !array_key_exists(
                $field,
                $data
            ) ||
            $data[$field] === null ||
            (
                is_string($data[$field]) &&
                trim($data[$field]) === ''
            )
        ) {

            admin_error(
                "The '{$field}' field is required.",
                422
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| Integer Helper
|--------------------------------------------------------------------------
*/

function integer_value(
    mixed $value,
    string $field,
    int $default = 0
): int {

    if (
        $value === null ||
        $value === ''
    ) {

        return $default;
    }

    if (
        filter_var(
            $value,
            FILTER_VALIDATE_INT
        ) === false
    ) {

        admin_error(
            "The '{$field}' field must be an integer.",
            422
        );
    }

    return (int)$value;
}


/*
|--------------------------------------------------------------------------
| String Helper
|--------------------------------------------------------------------------
*/

function string_value(
    mixed $value,
    string $field,
    int $maxLength = 0
): string {

    $value =
        trim((string)$value);

    if (
        $maxLength > 0 &&
        mb_strlen($value) > $maxLength
    ) {

        admin_error(
            "The '{$field}' field is too long.",
            422
        );
    }

    return $value;
}


/*
|--------------------------------------------------------------------------
| Database Error
|--------------------------------------------------------------------------
*/

function database_error(
    mysqli $conn,
    string $message =
        'Database operation failed.'
): void {

    error_log(
        $message .
        ' MySQL error: ' .
        $conn->error
    );

    admin_error(
        $message,
        500
    );
}