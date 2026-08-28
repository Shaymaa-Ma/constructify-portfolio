<?php
/**
 * Server/includes/auth_token.php
 * Minimal stateless auth token: base64url(payload JSON) + '.' + HMAC-SHA256
 * signature. This is a lightweight hand-rolled scheme (not full JWT), which
 * is enough to protect the admin API without adding a Composer dependency.
 * If you'd rather use standard JWTs, swap this out for firebase/php-jwt —
 * every call site here only needs generate_token()/verify_token().
 *
 * SECURITY: set a real secret via the TOKEN_SECRET env var in production.
 * The fallback below is only for local development.
 */

define('TOKEN_SECRET', getenv('TOKEN_SECRET') ?: 'constructify-dev-secret-change-me');
define('TOKEN_TTL_SECONDS', 60 * 60 * 24 * 7); // 7 days

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Builds a signed token carrying $payload, expiring in $ttlSeconds.
 */
function generate_token(array $payload, int $ttlSeconds = TOKEN_TTL_SECONDS): string
{
    $payload['exp'] = time() + $ttlSeconds;
    $encodedPayload = base64url_encode(json_encode($payload));
    $signature      = base64url_encode(hash_hmac('sha256', $encodedPayload, TOKEN_SECRET, true));

    return $encodedPayload . '.' . $signature;
}

/**
 * Verifies a token's signature and expiry. Returns the decoded payload
 * array on success, or null if the token is missing, malformed, tampered
 * with, or expired.
 */
function verify_token(?string $token): ?array
{
    if (!$token || !str_contains($token, '.')) {
        return null;
    }

    [$encodedPayload, $signature] = explode('.', $token, 2);

    $expectedSignature = base64url_encode(hash_hmac('sha256', $encodedPayload, TOKEN_SECRET, true));
    if (!hash_equals($expectedSignature, $signature)) {
        return null;
    }

    $payload = json_decode(base64url_decode($encodedPayload), true);
    if (!is_array($payload) || !isset($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

/**
 * Reads the bearer token from the Authorization header, if present.
 */
function get_bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? null) : null)
        ?? null;

    if (!$header && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header  = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    }

    if (!$header || !preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return null;
    }

    return $m[1];
}

/**
 * Returns the decoded token payload for the current request, or null if
 * there's no valid token.
 */
function current_admin(): ?array
{
    return verify_token(get_bearer_token());
}