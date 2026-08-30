<?php

/**
 * /Server/api/admin/categories/index.php
 *
 * PROJECT CATEGORIES API — full CRUD.
 *
 * GET                -> all categories, ordered
 * GET    ?id=1        -> one category
 * POST                -> create { name, slug?, display_order? }
 * PUT/PATCH ?id=1      -> update (JSON or multipart + _method=PUT)
 * DELETE ?id=1         -> delete (blocked if projects still reference it)
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
            INSERT INTO project_categories (name, slug, display_order)
            VALUES (?, ?, ?)
        ");

        if (!$stmt) {
            throw new Exception($conn->error);
        }

        $stmt->bind_param("ssi", $name, $slug, $displayOrder);

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

        $stmt = $conn->prepare("
            UPDATE project_categories
            SET name = ?, slug = ?, display_order = ?
            WHERE id = ?
        ");

        if (!$stmt) {
            throw new Exception($conn->error);
        }

        $stmt->bind_param("ssii", $name, $slug, $displayOrder, $id);

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


    /* =====================================================
       DELETE
       Blocked if any project still references this category.
    ===================================================== */

    if ($method === 'DELETE') {

        require_admin();

        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

        if ($id <= 0) {
            send_json(["success" => false, "error" => "Category ID is required."], 400);
        }

        $existing = fetch_category($conn, $id);

        if (!$existing) {
            send_json(["success" => false, "error" => "Category not found."], 404);
        }

        $inUseStmt = $conn->prepare("
            SELECT COUNT(*) AS cnt FROM projects WHERE category_id = ?
        ");

        if (!$inUseStmt) {
            throw new Exception($conn->error);
        }

        $inUseStmt->bind_param("i", $id);
        $inUseStmt->execute();

        $inUseRow = $inUseStmt->get_result()->fetch_assoc();
        $inUseStmt->close();

        if ((int)($inUseRow['cnt'] ?? 0) > 0) {
            send_json([
                "success" => false,
                "error" => "Cannot delete a category that still has projects assigned to it."
            ], 409);
        }

        $stmt = $conn->prepare("DELETE FROM project_categories WHERE id = ?");

        if (!$stmt) {
            throw new Exception($conn->error);
        }

        $stmt->bind_param("i", $id);

        if (!$stmt->execute()) {
            $err = $stmt->error;
            $stmt->close();
            throw new Exception($err);
        }

        $stmt->close();

        send_json(["success" => true, "message" => "Category deleted successfully."]);
    }


    send_json(["success" => false, "error" => "Method not allowed."], 405);


} catch (Throwable $e) {

    error_log('Categories endpoint — uncaught error: ' . $e->getMessage());

    send_json(["success" => false, "error" => $e->getMessage()], 500);
}