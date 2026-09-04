<?php

/**
 * /Server/api/admin/categories/index.php
 *
 * PROJECT CATEGORIES API
 *
 * GET                -> all categories, ordered
 * GET    ?id=1        -> one category
 * POST                -> create { name, slug?, display_order?, is_available? }
 * PUT/PATCH ?id=1      -> update (JSON or multipart + _method=PUT)
 *                         accepts partial payloads, incl. { is_available: 0|1 }
 *                         for the Available / Unavailable toggle.
 *
 * DELETE is intentionally NOT supported. Categories are hidden from the
 * client site by setting is_available = 0 instead of being removed, so
 * they stay intact in the DB and in the admin list.
 *
 * No image field — project_categories has none.
 */

require_once __DIR__ . '/../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");


/* =========================================================
   FATAL-ERROR SAFETY NET
   Same pattern used across hero/about/services/projects.
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


$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && isset($_POST['_method'])) {

    $overrideMethod = strtoupper(trim((string)$_POST['_method']));

    if ($overrideMethod === 'PUT' || $overrideMethod === 'PATCH') {
        $method = $overrideMethod;
    }
}


/* =========================================================
   HELPERS
========================================================= */

function send_json(array $data, int $status = 200): void
{
    http_response_code($status);

    $json = json_encode(
        $data,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );

    if ($json === false) {

        array_walk_recursive($data, function (&$value) {
            if (is_string($value)) {
                $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
            }
        });

        $json = json_encode(
            $data,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }

    if ($json === false) {

        $json = json_encode([
            'success' => false,
            'error' =>
                'A server error occurred and the response could not be encoded. Check the PHP error log.',
        ]);
    }

    echo $json;
    exit;
}


function get_request_data(): array
{
    if (
        isset($_SERVER['CONTENT_TYPE']) &&
        stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false
    ) {
        return $_POST;
    }

    $raw = file_get_contents("php://input");

    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}


function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}


function fetch_category(mysqli $conn, int $id): ?array
{
    $stmt = $conn->prepare("
        SELECT * FROM project_categories WHERE id = ? LIMIT 1
    ");

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Unable to load category.');
    }

    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}


/* =========================================================
   EVERYTHING BELOW RUNS INSIDE ONE OUTER SAFETY NET.
========================================================= */

try {

    /* =====================================================
       GET
       Returns ALL categories (available + unavailable) so the
       admin panel can list and toggle both states. The client
       site's own endpoint is responsible for filtering
       is_available = 1.
    ===================================================== */

    if ($method === 'GET') {

        if (isset($_GET['id'])) {

            $id = (int)$_GET['id'];

            if ($id <= 0) {
                send_json(["success" => false, "error" => "Invalid category ID."], 400);
            }

            $category = fetch_category($conn, $id);

            if (!$category) {
                send_json(["success" => false, "error" => "Category not found."], 404);
            }

            send_json(["success" => true, "data" => $category]);
        }

        $result = $conn->query("
            SELECT * FROM project_categories
            ORDER BY display_order ASC, id ASC
        ");

        if (!$result) {
            throw new Exception($conn->error);
        }

        $categories = [];

        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }

        send_json(["success" => true, "data" => $categories]);
    }


    /* =====================================================
       POST — CREATE
    ===================================================== */

    if ($method === 'POST') {

        require_admin();

        $input = get_request_data();

        $name = trim((string)($input['name'] ?? ''));

        if ($name === '') {
            send_json(["success" => false, "error" => "Category name is required."], 422);
        }

        $rawSlug = trim((string)($input['slug'] ?? ''));
        $slug = $rawSlug !== '' ? slugify($rawSlug) : slugify($name);

        if ($slug === '') {
            send_json(["success" => false, "error" => "Could not generate a valid slug from the name."], 422);
        }

        $displayOrder = (int)($input['display_order'] ?? 0);

        $isAvailable = array_key_exists('is_available', $input)
            ? (int)(bool)$input['is_available']
            : 1;

        $checkStmt = $conn->prepare("SELECT id FROM project_categories WHERE slug = ?");

        if (!$checkStmt) {
            throw new Exception($conn->error);
        }

        $checkStmt->bind_param("s", $slug);
        $checkStmt->execute();

        $slugTaken = $checkStmt->get_result()->fetch_assoc();
        $checkStmt->close();

        if ($slugTaken) {
            send_json(["success" => false, "error" => "A category with this slug already exists."], 409);
        }

        $stmt = $conn->prepare("
            INSERT INTO project_categories (name, slug, display_order, is_available)
            VALUES (?, ?, ?, ?)
        ");

        if (!$stmt) {
            throw new Exception($conn->error);
        }

        $stmt->bind_param("ssii", $name, $slug, $displayOrder, $isAvailable);

        if (!$stmt->execute()) {
            $err = $stmt->error;
            $stmt->close();
            throw new Exception($err);
        }

        $newId = $stmt->insert_id;
        $stmt->close();

        $created = fetch_category($conn, $newId);

        send_json([
            "success" => true,
            "message" => "Category created successfully.",
            "data" => $created,
        ], 201);
    }


    /* =====================================================
       PUT / PATCH — UPDATE
       Accepts partial payloads. This is also how the
       Available / Unavailable toggle works: the frontend can
       send just { is_available: 0 | 1 } and every other field
       falls back to its current value.
    ===================================================== */

    if ($method === 'PUT' || $method === 'PATCH') {

        require_admin();

        $input = get_request_data();

        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);

        if ($id <= 0) {
            send_json(["success" => false, "error" => "Category ID is required."], 400);
        }

        $existing = fetch_category($conn, $id);

        if (!$existing) {
            send_json(["success" => false, "error" => "Category not found."], 404);
        }

        $name =
            array_key_exists('name', $input) && trim((string)$input['name']) !== ''
                ? trim((string)$input['name'])
                : $existing['name'];

        $slug = $existing['slug'];

        if (array_key_exists('slug', $input) && trim((string)$input['slug']) !== '') {

            $slug = slugify((string)$input['slug']);

            $checkStmt = $conn->prepare("
                SELECT id FROM project_categories WHERE slug = ? AND id != ?
            ");

            if (!$checkStmt) {
                throw new Exception($conn->error);
            }

            $checkStmt->bind_param("si", $slug, $id);
            $checkStmt->execute();

            $slugTaken = $checkStmt->get_result()->fetch_assoc();
            $checkStmt->close();

            if ($slugTaken) {
                send_json(["success" => false, "error" => "A category with this slug already exists."], 409);
            }
        }

        $displayOrder =
            array_key_exists('display_order', $input)
                ? (int)$input['display_order']
                : (int)$existing['display_order'];

        $isAvailable =
            array_key_exists('is_available', $input)
                ? (int)(bool)$input['is_available']
                : (int)$existing['is_available'];

        $stmt = $conn->prepare("
            UPDATE project_categories
            SET name = ?, slug = ?, display_order = ?, is_available = ?
            WHERE id = ?
        ");

        if (!$stmt) {
            throw new Exception($conn->error);
        }

        $stmt->bind_param("ssiii", $name, $slug, $displayOrder, $isAvailable, $id);

        if (!$stmt->execute()) {
            $err = $stmt->error;
            $stmt->close();
            throw new Exception($err);
        }

        $stmt->close();

        $updated = fetch_category($conn, $id);

        send_json([
            "success" => true,
            "message" => "Category updated successfully.",
            "data" => $updated,
        ]);
    }


    send_json(["success" => false, "error" => "Method not allowed."], 405);


} catch (Throwable $e) {

    error_log('Categories endpoint — uncaught error: ' . $e->getMessage());

    send_json(["success" => false, "error" => $e->getMessage()], 500);
}