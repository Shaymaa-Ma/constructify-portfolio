
<?php
/**
 * Server/api/admin/auth/register.php
 *
 * POST {
 *   name,
 *   email,
 *   password,
 *   invite_code?
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "...",
 *   "admin": {
 *      "id": 1,
 *      "name": "...",
 *      "email": "...",
 *      "role": "admin"
 *   }
 *
 * SECURITY:
 * This endpoint creates an administrator account.
 * If ADMIN_REGISTER_CODE is configured, the caller must
 * provide the correct invite_code.
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
    ['name', 'email', 'password']
);


$name = string_value(
    $input['name'],
    'name',
    100
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
        'Invalid email address.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate Password
|--------------------------------------------------------------------------
*/

if (strlen($password) < 8) {
    admin_error(
        'Password must be at least 8 characters.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate Registration Code
|--------------------------------------------------------------------------
*/

$requiredCode = getenv('ADMIN_REGISTER_CODE');

if (
    $requiredCode !== false &&
    $requiredCode !== '' &&
    ($input['invite_code'] ?? '') !== $requiredCode
) {
    admin_error(
        'Invalid or missing invite code.',
        403
    );
}


/*
|--------------------------------------------------------------------------
| Check Existing Account
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare(
    'SELECT id
     FROM admins
     WHERE email = ?
     LIMIT 1'
);

if (!$stmt) {
    database_error(
        $conn,
        'Unable to prepare account check.'
    );
}

$stmt->bind_param(
    's',
    $email
);

if (!$stmt->execute()) {
    database_error(
        $conn,
        'Unable to check existing account.'
    );
}

$result = $stmt->get_result();

if ($result->fetch_assoc()) {

    $stmt->close();

    admin_error(
        'An account with this email already exists.',
        409
    );
}

$stmt->close();


/*
|--------------------------------------------------------------------------
| Hash Password
|--------------------------------------------------------------------------
*/

$hashedPassword = password_hash(
    $password,
    PASSWORD_BCRYPT
);

if ($hashedPassword === false) {
    admin_error(
        'Unable to securely process the password.',
        500
    );
}


/*
|--------------------------------------------------------------------------
| Create Admin Account
|--------------------------------------------------------------------------
*/

$role = 'admin';

$stmt = $conn->prepare(
    'INSERT INTO admins
        (name, email, password, role)
     VALUES
        (?, ?, ?, ?)'
);

if (!$stmt) {
    database_error(
        $conn,
        'Unable to prepare account creation.'
    );
}

$stmt->bind_param(
    'ssss',
    $name,
    $email,
    $hashedPassword,
    $role
);

if (!$stmt->execute()) {

    /*
     * Handle duplicate email in case of a UNIQUE
     * database constraint.
     */
    if ($conn->errno === 1062) {

        $stmt->close();

        admin_error(
            'An account with this email already exists.',
            409
        );
    }

    database_error(
        $conn,
        'Unable to create administrator account.'
    );
}

$id = (int) $stmt->insert_id;

$stmt->close();


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
        'Token generation failed: ' . $e->getMessage()
    );

    admin_error(
        'Unable to create authentication token.',
        500
    );
}


/*
|--------------------------------------------------------------------------
| Store Authentication In Session
|--------------------------------------------------------------------------
*/

$_SESSION['admin_id'] =
    $id;

$_SESSION['admin_name'] =
    $name;

$_SESSION['admin_email'] =
    $email;

$_SESSION['admin_role'] =
    $role;

$_SESSION['admin_token'] =
    $token;


/*
|--------------------------------------------------------------------------
| Return Successful Response
|--------------------------------------------------------------------------
*/

admin_success(
    [
        'token' => $token,

        'admin' => [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'role' => $role
        ]
    ],
    201
);
