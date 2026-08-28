<?php

/*
|--------------------------------------------------------------------------
| Client API Bootstrap
|--------------------------------------------------------------------------
| Shared setup for all public Client API endpoints.
|
| Location:
| Server/api/client/_bootstrap.php
|
| Responsibilities:
| - CORS
| - Database connection
| - JSON response headers
| - Common response helpers
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
| JSON Header
|--------------------------------------------------------------------------
*/

header(
    'Content-Type: application/json; charset=utf-8'
);


/*
|--------------------------------------------------------------------------
| JSON Response
|--------------------------------------------------------------------------
*/

function client_json(
    array $data,
    int $status = 200
): void {

    http_response_code($status);

    header(
        'Content-Type: application/json; charset=utf-8'
    );

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Success Response
|--------------------------------------------------------------------------
*/

function client_success(
    array $data = [],
    int $status = 200
): void {

    client_json(
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
| Error Response
|--------------------------------------------------------------------------
*/

function client_error(
    string $message,
    int $status = 400,
    array $extra = []
): void {

    client_json(
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

        client_error(
            'Method not allowed.',
            405
        );
    }
}


/*
|--------------------------------------------------------------------------
| Get JSON Body
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

        client_error(
            'Invalid JSON request body.',
            400
        );
    }

    return $data;
}


/*
|--------------------------------------------------------------------------
| Get ID
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

        client_error(
            'Invalid ID.',
            400
        );
    }

    return $id;
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

            client_error(
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

        client_error(
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

    $value = trim(
        (string)$value
    );

    if (
        $maxLength > 0 &&
        mb_strlen($value) > $maxLength
    ) {

        client_error(
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

    client_error(
        $message,
        500
    );
}