
<?php
/**
 * Server/api/admin/auth/login.php
 *
 * POST { email, password }
 *
 * Returns:
 * {
 *     "success": true,
 *     "token": "...",
 *     "admin": {
 *         "id": 1,
 *         "name": "...",
 *         "email": "...",
 *         "role": "admin"
 *     }
 * }
 */

require_once __DIR__ . '/../_bootstrap.php';


/*
|--------------------------------------------------------------------------
| Request Method
|--------------------------------------------------------------------------
*/

require_method('POST');


/*
|--------------------------------------------------------------------------
| Get JSON Input
|--------------------------------------------------------------------------
*/

$input = get_json_body();


/*
|--------------------------------------------------------------------------
| Validate Required Fields
|--------------------------------------------------------------------------
*/

require_fields(
    $input,
    ['email', 'password']
);


$email = string_value(
    $input['email'],
    'email',
    255
);

$password = (string) $input['password'];


/*
|--------------------------------------------------------------------------
| Validate Email
|--------------------------------------------------------------------------
*/

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    admin_error(
        'Please provide a valid email address.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| Find Administrator
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare(
    'SELECT id, name, email, password, role
     FROM admins
     WHERE email = ?
     LIMIT 1'
);

if (!$stmt) {
    database_error(
        $conn,
        'Unable to prepare login query.'
    );
}


$stmt->bind_param(
    's',
    $email
);


if (!$stmt->execute()) {
    database_error(
        $conn,
        'Unable to execute login query.'
    );
}


$result = $stmt->get_result();

$admin = $result->fetch_assoc();

$stmt->close();


/*
|--------------------------------------------------------------------------
| Verify Credentials
|--------------------------------------------------------------------------
*/

if (
    !$admin ||
    !password_verify(
        $password,
        $admin['password']
    )
) {
    admin_error(
        'Invalid email or password.',
        401
    );
}


/*
|--------------------------------------------------------------------------
| Generate Authentication Token
|--------------------------------------------------------------------------
*/

try {

    $token = bin2hex(
        random_bytes(32)
    );

} catch (Throwable $e) {

    error_log(
        'Token generation failed: ' .
        $e->getMessage()
    );

    admin_error(
        'Unable to create authentication token.',
        500
    );
}


/*
|--------------------------------------------------------------------------
| Store Authentication In PHP Session
|--------------------------------------------------------------------------
*/

$_SESSION['admin_id'] =
    (int) $admin['id'];

$_SESSION['admin_name'] =
    $admin['name'];

$_SESSION['admin_email'] =
    $admin['email'];

$_SESSION['admin_role'] =
    $admin['role'];

$_SESSION['admin_token'] =
    $token;


/*
|--------------------------------------------------------------------------
| Return Successful Login
|--------------------------------------------------------------------------
*/

admin_success([
    'token' => $token,

    'admin' => [
        'id' => (int) $admin['id'],
        'name' => $admin['name'],
        'email' => $admin['email'],
        'role' => $admin['role']
    ]
]);
