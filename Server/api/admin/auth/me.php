
<?php
/**
 * Server/api/admin/auth/me.php
 *
 * GET
 *
 * Requires:
 * Authorization: Bearer <token>
 *
 * Returns the currently authenticated administrator.
 */

require_once __DIR__ . '/../_bootstrap.php';


/*
|--------------------------------------------------------------------------
| Request Method
|--------------------------------------------------------------------------
*/

require_method('GET');


/*
|--------------------------------------------------------------------------
| Authenticate Administrator
|--------------------------------------------------------------------------
*/

$authenticatedAdmin = authenticate_admin();


/*
|--------------------------------------------------------------------------
| Get Admin From Database
|--------------------------------------------------------------------------
*/

$adminId = (int) $authenticatedAdmin['id'];

$stmt = $conn->prepare(
    'SELECT id, name, email, role
     FROM admins
     WHERE id = ?
     LIMIT 1'
);

if (!$stmt) {
    database_error(
        $conn,
        'Unable to prepare administrator query.'
    );
}

$stmt->bind_param(
    'i',
    $adminId
);

if (!$stmt->execute()) {
    database_error(
        $conn,
        'Unable to retrieve administrator account.'
    );
}

$result = $stmt->get_result();

$admin = $result->fetch_assoc();

$stmt->close();


/*
|--------------------------------------------------------------------------
| Verify Account Still Exists
|--------------------------------------------------------------------------
*/

if (!$admin) {

    /*
     * Clear the invalid session.
     */
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {

        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();

    admin_error(
        'Account no longer exists.',
        401
    );
}


/*
|--------------------------------------------------------------------------
| Return Administrator
|--------------------------------------------------------------------------
*/

admin_success([
    'admin' => [
        'id' => (int) $admin['id'],
        'name' => $admin['name'],
        'email' => $admin['email'],
        'role' => $admin['role']
    ]
]);

