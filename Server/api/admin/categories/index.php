<?php

require_once __DIR__ . '/../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];


/*
|--------------------------------------------------------------------------
| Helper: Get JSON request data
|--------------------------------------------------------------------------
*/

function get_request_data(): array
{
    $raw = file_get_contents("php://input");

    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}


/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| GET /categories/
| GET /categories/?id=1
|
*/

if ($method === 'GET') {

    /*
     * Get one category
     */
    if (isset($_GET['id'])) {

        $id = (int)$_GET['id'];

        if ($id <= 0) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "error" => "Invalid category ID."
            ]);

            exit;
        }


        $stmt = $conn->prepare("
            SELECT
                id,
                name,
                slug,
                display_order
            FROM project_categories
            WHERE id = ?
            LIMIT 1
        ");


        if (!$stmt) {

            http_response_code(500);

            echo json_encode([
                "success" => false,
                "error" => $conn->error
            ]);

            exit;
        }


        $stmt->bind_param(
            "i",
            $id
        );

        $stmt->execute();


        $result =
            $stmt->get_result();

        $category =
            $result->fetch_assoc();


        $stmt->close();


        if (!$category) {

            http_response_code(404);

            echo json_encode([
                "success" => false,
                "error" => "Category not found."
            ]);

            exit;
        }


        echo json_encode([
            "success" => true,
            "data" => $category
        ]);

        exit;
    }


    /*
     * Get all categories
     */
    $result = $conn->query("
        SELECT
            id,
            name,
            slug,
            display_order
        FROM project_categories
        ORDER BY
            display_order ASC,
            id ASC
    ");


    if (!$result) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $categories = [];


    while ($row = $result->fetch_assoc()) {

        $categories[] = $row;
    }


    echo json_encode([
        "success" => true,
        "data" => $categories
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| POST - CREATE CATEGORY
|--------------------------------------------------------------------------
*/

if ($method === 'POST') {

    require_auth();


    $input =
        get_request_data();


    $name =
        trim($input['name'] ?? '');

    $slug =
        trim($input['slug'] ?? '');

    $display_order =
        (int)($input['display_order'] ?? 0);


    /*
     * Validate name
     */
    if ($name === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Category name is required."
        ]);

        exit;
    }


    /*
     * Validate slug
     */
    if ($slug === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Category slug is required."
        ]);

        exit;
    }


    /*
     * Validate slug format
     *
     * Example:
     * residential
     * commercial
     * infrastructure
     */
    if (!preg_match(
        '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
        $slug
    )) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Slug must contain only lowercase letters, numbers, and hyphens."
        ]);

        exit;
    }


    /*
     * Check duplicate slug
     */
    $check = $conn->prepare("
        SELECT id
        FROM project_categories
        WHERE slug = ?
        LIMIT 1
    ");


    if (!$check) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $check->bind_param(
        "s",
        $slug
    );

    $check->execute();


    $existing =
        $check->get_result()->fetch_assoc();


    $check->close();


    if ($existing) {

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "error" => "A category with this slug already exists."
        ]);

        exit;
    }


    /*
     * Create category
     */
    $stmt = $conn->prepare("
        INSERT INTO project_categories
        (
            name,
            slug,
            display_order
        )
        VALUES (?, ?, ?)
    ");


    if (!$stmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $stmt->bind_param(
        "ssi",
        $name,
        $slug,
        $display_order
    );


    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);

        $stmt->close();

        exit;
    }


    $newId =
        $stmt->insert_id;


    $stmt->close();


    echo json_encode([
        "success" => true,
        "message" => "Category created successfully.",
        "id" => $newId
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| PUT / PATCH - UPDATE CATEGORY
|--------------------------------------------------------------------------
|
| PUT /categories/?id=1
|
*/

if (
    $method === 'PUT' ||
    $method === 'PATCH'
) {

    require_auth();


    $id = isset($_GET['id'])
        ? (int)$_GET['id']
        : 0;


    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "error" => "Category ID is required."
        ]);

        exit;
    }


    $input =
        get_request_data();


    $name =
        trim($input['name'] ?? '');

    $slug =
        trim($input['slug'] ?? '');

    $display_order =
        (int)($input['display_order'] ?? 0);


    /*
     * Validate name
     */
    if ($name === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Category name is required."
        ]);

        exit;
    }


    /*
     * Validate slug
     */
    if ($slug === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Category slug is required."
        ]);

        exit;
    }


    /*
     * Validate slug format
     */
    if (!preg_match(
        '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
        $slug
    )) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Slug must contain only lowercase letters, numbers, and hyphens."
        ]);

        exit;
    }


    /*
     * Check category exists
     */
    $categoryCheck = $conn->prepare("
        SELECT id
        FROM project_categories
        WHERE id = ?
        LIMIT 1
    ");


    if (!$categoryCheck) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $categoryCheck->bind_param(
        "i",
        $id
    );

    $categoryCheck->execute();


    $categoryExists =
        $categoryCheck
            ->get_result()
            ->fetch_assoc();


    $categoryCheck->close();


    if (!$categoryExists) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Category not found."
        ]);

        exit;
    }


    /*
     * Check duplicate slug
     */
    $check = $conn->prepare("
        SELECT id
        FROM project_categories
        WHERE slug = ?
        AND id != ?
        LIMIT 1
    ");


    if (!$check) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $check->bind_param(
        "si",
        $slug,
        $id
    );

    $check->execute();


    $existing =
        $check->get_result()->fetch_assoc();


    $check->close();


    if ($existing) {

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "error" => "A different category already uses this slug."
        ]);

        exit;
    }


    /*
     * Update category
     */
    $stmt = $conn->prepare("
        UPDATE project_categories
        SET
            name = ?,
            slug = ?,
            display_order = ?
        WHERE id = ?
    ");


    if (!$stmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $stmt->bind_param(
        "ssii",
        $name,
        $slug,
        $display_order,
        $id
    );


    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);

        $stmt->close();

        exit;
    }


    $stmt->close();


    echo json_encode([
        "success" => true,
        "message" => "Category updated successfully."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
|
| DELETE /categories/?id=1
|
| IMPORTANT:
| Do not delete a category if projects are using it.
|
*/

if ($method === 'DELETE') {

    require_auth();


    $id = isset($_GET['id'])
        ? (int)$_GET['id']
        : 0;


    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "error" => "Category ID is required."
        ]);

        exit;
    }


    /*
     * Check category exists
     */
    $check = $conn->prepare("
        SELECT id
        FROM project_categories
        WHERE id = ?
        LIMIT 1
    ");


    if (!$check) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $check->bind_param(
        "i",
        $id
    );

    $check->execute();


    $exists =
        $check
            ->get_result()
            ->fetch_assoc();


    $check->close();


    if (!$exists) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Category not found."
        ]);

        exit;
    }


    /*
     * Check whether projects use this category.
     */
    $projectCheck = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM projects
        WHERE category_id = ?
    ");


    if (!$projectCheck) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $projectCheck->bind_param(
        "i",
        $id
    );

    $projectCheck->execute();


    $projectCount =
        $projectCheck
            ->get_result()
            ->fetch_assoc();


    $projectCheck->close();


    if ((int)$projectCount['total'] > 0) {

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "error" =>
                "This category cannot be deleted because it is assigned to " .
                $projectCount['total'] .
                " project(s). Please reassign or delete those projects first."
        ]);

        exit;
    }


    /*
     * Delete category
     */
    $stmt = $conn->prepare("
        DELETE FROM project_categories
        WHERE id = ?
    ");


    if (!$stmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $stmt->bind_param(
        "i",
        $id
    );


    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);

        $stmt->close();

        exit;
    }


    $stmt->close();


    echo json_encode([
        "success" => true,
        "message" => "Category deleted successfully."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| METHOD NOT ALLOWED
|--------------------------------------------------------------------------
*/

http_response_code(405);

echo json_encode([
    "success" => false,
    "error" => "Method not allowed."
]);