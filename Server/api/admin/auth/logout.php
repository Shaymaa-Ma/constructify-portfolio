
<?php
/**
 * Server/api/admin/auth/logout.php
 *
 * POST
 *
 * Requires:
 * Authorization: Bearer <token>
 *
 * Logs the administrator out by destroying the
 * current PHP authentication session.
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
| Verify Administrator
|--------------------------------------------------------------------------
*/

authenticate_admin();


/*
|--------------------------------------------------------------------------
| Clear Authentication Session
|--------------------------------------------------------------------------
*/

$_SESSION = [];


/*
 * Remove the PHP session cookie if one exists.
 */
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


/*
|--------------------------------------------------------------------------
| Destroy Session
|--------------------------------------------------------------------------
*/

session_destroy();


/*
|--------------------------------------------------------------------------
| Return Success
|--------------------------------------------------------------------------
*/

admin_success([
    'message' => 'Logged out successfully.'
]);

