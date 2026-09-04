<?php

require_once __DIR__ . '/../_bootstrap.php';

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| Support method override
|--------------------------------------------------------------------------
|
| For multipart/form-data updates, React should send:
|
| POST
| _method=PUT
|
*/

if ($method === 'POST' && isset($_POST['_method'])) {

    $overrideMethod = strtoupper(trim($_POST['_method']));

    if (
        $overrideMethod === 'PUT' ||
        $overrideMethod === 'PATCH'
    ) {
        $method = $overrideMethod;
    }
}


/*
|--------------------------------------------------------------------------
| Upload configuration
|--------------------------------------------------------------------------
|
| Images are stored directly in:
|
| construction-portfolio/
| └── uploads/
|     ├── project-xxxx.jpg
|     ├── hero-xxxx.jpg
|     └── ...
|
*/

$uploadDirectory = __DIR__ . '/../../../../uploads';


/*
|--------------------------------------------------------------------------
| Helper: Get request data
|--------------------------------------------------------------------------
*/

function get_request_data(): array
{
    /*
     * Multipart/form-data
     */
    if (
        isset($_SERVER['CONTENT_TYPE']) &&
        stripos(
            $_SERVER['CONTENT_TYPE'],
            'multipart/form-data'
        ) !== false
    ) {
        return $_POST;
    }


    /*
     * JSON
     */
    $raw = file_get_contents("php://input");

    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}


/*
|--------------------------------------------------------------------------
| Helper: Upload project image
|--------------------------------------------------------------------------
*/

function upload_project_image(string $uploadDirectory): ?string
{
    /*
     * No image uploaded
     */
    if (
        !isset($_FILES['image']) ||
        !is_array($_FILES['image'])
    ) {
        return null;
    }


    $file = $_FILES['image'];


    /*
     * Check upload error
     */
    if ($file['error'] !== UPLOAD_ERR_OK) {

        throw new Exception(
            "Image upload failed. Error code: " .
            $file['error']
        );
    }


    /*
     * Maximum size: 5 MB
     */
    $maxSize = 5 * 1024 * 1024;

    if ($file['size'] > $maxSize) {

        throw new Exception(
            "Image must be smaller than 5 MB."
        );
    }


    /*
     * Validate MIME type
     */
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    $mime = $finfo->file(
        $file['tmp_name']
    );


    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];


    if (!isset($allowedTypes[$mime])) {

        throw new Exception(
            "Invalid image type. Allowed: JPG, PNG, WEBP, GIF."
        );
    }


    /*
     * Make sure uploads directory exists
     */
    if (!is_dir($uploadDirectory)) {

        if (!mkdir(
            $uploadDirectory,
            0755,
            true
        )) {

            throw new Exception(
                "Unable to create upload directory."
            );
        }
    }


    /*
     * Generate unique filename
     */
    $extension = $allowedTypes[$mime];

    $filename =
        'project-' .
        bin2hex(random_bytes(8)) .
        '.' .
        $extension;


    $destination =
        $uploadDirectory .
        DIRECTORY_SEPARATOR .
        $filename;


    /*
     * Move uploaded file
     */
    if (!move_uploaded_file(
        $file['tmp_name'],
        $destination
    )) {

        throw new Exception(
            "Unable to save uploaded image."
        );
    }


    /*
     * Store ONLY filename in database.
     *
     * Example:
     *
     * project-a1b2c3d4.jpg
     */
    return $filename;
}


/*
|--------------------------------------------------------------------------
| Helper: Delete project image
|--------------------------------------------------------------------------
*/

function delete_project_image(?string $image): void
{
    if (!$image) {
        return;
    }


    /*
     * Get only filename.
     *
     * This prevents paths such as:
     * ../../something
     */
    $filename = basename($image);


    if ($filename === '') {
        return;
    }


    /*
     * Images are directly inside uploads/
     */
    $filePath =
        __DIR__ .
        '/../../../../uploads/' .
        $filename;


    if (is_file($filePath)) {
        @unlink($filePath);
    }
}


/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| GET /projects/
| GET /projects/?id=1
|
| Returns ALL projects (available + unavailable) so the admin
| panel can list and toggle both states. The client site's own
| endpoint is responsible for filtering is_available = 1.
|
*/

if ($method === 'GET') {


    /*
     * Get one project
     */
    if (isset($_GET['id'])) {

        $id = (int)$_GET['id'];


        if ($id <= 0) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "error" => "Invalid project ID."
            ]);

            exit;
        }


        $stmt = $conn->prepare("
            SELECT
                p.*,
                c.name AS category_name,
                c.slug AS category_slug
            FROM projects p
            LEFT JOIN project_categories c
                ON p.category_id = c.id
            WHERE p.id = ?
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

        $project =
            $result->fetch_assoc();


        $stmt->close();


        if (!$project) {

            http_response_code(404);

            echo json_encode([
                "success" => false,
                "error" => "Project not found."
            ]);

            exit;
        }


        echo json_encode([
            "success" => true,
            "data" => $project
        ]);

        exit;
    }


    /*
     * Get all projects
     */
    $result = $conn->query("
        SELECT
            p.*,
            c.name AS category_name,
            c.slug AS category_slug
        FROM projects p
        LEFT JOIN project_categories c
            ON p.category_id = c.id
        ORDER BY
            p.display_order ASC,
            p.id ASC
    ");


    if (!$result) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $projects = [];


    while ($row = $result->fetch_assoc()) {

        $projects[] = $row;
    }


    echo json_encode([
        "success" => true,
        "data" => $projects
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| POST - CREATE PROJECT
|--------------------------------------------------------------------------
*/

if ($method === 'POST') {

    require_admin();


    $input =
        get_request_data();


    /*
     * Fields
     */
    $category_id =
        (int)($input['category_id'] ?? 0);

    $title =
        trim($input['title'] ?? '');

    $description =
        trim($input['description'] ?? '');

    $display_order =
        (int)($input['display_order'] ?? 0);

    $is_available =
        array_key_exists('is_available', $input)
            ? (int)(bool)$input['is_available']
            : 1;


    /*
     * Validate category
     */
    if ($category_id <= 0) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Category is required."
        ]);

        exit;
    }


    /*
     * Validate title
     */
    if ($title === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Project title is required."
        ]);

        exit;
    }


    /*
     * Verify category exists
     */
    $categoryStmt = $conn->prepare("
        SELECT id
        FROM project_categories
        WHERE id = ?
        LIMIT 1
    ");


    if (!$categoryStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $categoryStmt->bind_param(
        "i",
        $category_id
    );

    $categoryStmt->execute();


    $categoryResult =
        $categoryStmt->get_result();


    $categoryExists =
        $categoryResult->fetch_assoc();


    $categoryStmt->close();


    if (!$categoryExists) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Selected category does not exist."
        ]);

        exit;
    }


    /*
     * Upload image
     */
    try {

        $image =
            upload_project_image(
                $uploadDirectory
            );

    } catch (Exception $e) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);

        exit;
    }


    /*
     * Insert project
     */
    $stmt = $conn->prepare("
        INSERT INTO projects
        (
            category_id,
            title,
            description,
            image,
            display_order,
            is_available
        )
        VALUES (?, ?, ?, ?, ?, ?)
    ");


    if (!$stmt) {

        if ($image) {
            delete_project_image($image);
        }


        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $stmt->bind_param(
        "isssii",
        $category_id,
        $title,
        $description,
        $image,
        $display_order,
        $is_available
    );


    if (!$stmt->execute()) {

        if ($image) {
            delete_project_image($image);
        }


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
        "message" => "Project created successfully.",
        "id" => $newId,
        "image" => $image
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| PUT / PATCH - UPDATE PROJECT
|--------------------------------------------------------------------------
|
| Because image uploads use multipart/form-data,
| React should send:
|
| POST
| _method=PUT
|
| All fields fall back to their existing value when omitted —
| this is what lets the Available / Unavailable toggle send just
| { id, is_available } without resending the whole form, same
| pattern as the categories endpoint.
|
*/

if (
    $method === 'PUT' ||
    $method === 'PATCH'
) {

    require_admin();


    $input =
        get_request_data();


    /*
     * Get project ID
     */
    $id = isset($_GET['id'])
        ? (int)$_GET['id']
        : (int)($input['id'] ?? 0);


    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "error" => "Project ID is required."
        ]);

        exit;
    }


    /*
     * Get existing project
     */
    $existingStmt = $conn->prepare("
        SELECT *
        FROM projects
        WHERE id = ?
        LIMIT 1
    ");


    if (!$existingStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $existingStmt->bind_param(
        "i",
        $id
    );

    $existingStmt->execute();


    $existingResult =
        $existingStmt->get_result();


    $existingProject =
        $existingResult->fetch_assoc();


    $existingStmt->close();


    if (!$existingProject) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Project not found."
        ]);

        exit;
    }


    /*
     * Fields — fall back to existing values when omitted so a
     * partial payload (e.g. just toggling availability) works.
     */
    $category_id =
        array_key_exists('category_id', $input) && (int)$input['category_id'] > 0
            ? (int)$input['category_id']
            : (int)$existingProject['category_id'];

    $title =
        array_key_exists('title', $input) && trim((string)$input['title']) !== ''
            ? trim((string)$input['title'])
            : $existingProject['title'];

    $description =
        array_key_exists('description', $input)
            ? trim((string)$input['description'])
            : $existingProject['description'];

    $display_order =
        array_key_exists('display_order', $input)
            ? (int)$input['display_order']
            : (int)$existingProject['display_order'];

    $is_available =
        array_key_exists('is_available', $input)
            ? (int)(bool)$input['is_available']
            : (int)$existingProject['is_available'];


    /*
     * Validate category
     */
    if ($category_id <= 0) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Category is required."
        ]);

        exit;
    }


    /*
     * Validate title
     */
    if ($title === '') {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Project title is required."
        ]);

        exit;
    }


    /*
     * Verify category
     */
    $categoryStmt = $conn->prepare("
        SELECT id
        FROM project_categories
        WHERE id = ?
        LIMIT 1
    ");


    if (!$categoryStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $categoryStmt->bind_param(
        "i",
        $category_id
    );

    $categoryStmt->execute();


    $categoryResult =
        $categoryStmt->get_result();


    $categoryExists =
        $categoryResult->fetch_assoc();


    $categoryStmt->close();


    if (!$categoryExists) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "error" => "Selected category does not exist."
        ]);

        exit;
    }


    /*
     * Keep old image by default
     */
    $image =
        $existingProject['image'];


    /*
     * Check for new image
     */
    $hasNewImage =
        isset($_FILES['image']) &&
        isset($_FILES['image']['error']) &&
        $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE;


    /*
     * Upload replacement image
     */
    if ($hasNewImage) {

        try {

            $newImage =
                upload_project_image(
                    $uploadDirectory
                );

        } catch (Exception $e) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "error" => $e->getMessage()
            ]);

            exit;
        }


        $image =
            $newImage;
    }


    /*
     * Update database
     */
    $stmt = $conn->prepare("
        UPDATE projects
        SET
            category_id = ?,
            title = ?,
            description = ?,
            image = ?,
            display_order = ?,
            is_available = ?
        WHERE id = ?
    ");


    if (!$stmt) {

        if ($hasNewImage && $image) {
            delete_project_image($image);
        }


        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $stmt->bind_param(
        "isssiii",
        $category_id,
        $title,
        $description,
        $image,
        $display_order,
        $is_available,
        $id
    );


    if (!$stmt->execute()) {

        if ($hasNewImage && $image) {
            delete_project_image($image);
        }


        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);

        $stmt->close();

        exit;
    }


    $stmt->close();


    /*
     * Delete old image after
     * successful database update.
     */
    if (
        $hasNewImage &&
        !empty($existingProject['image']) &&
        $existingProject['image'] !== $image
    ) {

        delete_project_image(
            $existingProject['image']
        );
    }


    echo json_encode([
        "success" => true,
        "message" => "Project updated successfully.",
        "image" => $image
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| DELETE PROJECT
|--------------------------------------------------------------------------
|
| Kept as-is — projects can still be permanently deleted, unlike
| categories which are only hidden via is_available.
|
*/

if ($method === 'DELETE') {

    require_admin();


    $id = isset($_GET['id'])
        ? (int)$_GET['id']
        : 0;


    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "error" => "Project ID is required."
        ]);

        exit;
    }


    /*
     * Get existing image
     */
    $existingStmt = $conn->prepare("
        SELECT image
        FROM projects
        WHERE id = ?
        LIMIT 1
    ");


    if (!$existingStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => $conn->error
        ]);

        exit;
    }


    $existingStmt->bind_param(
        "i",
        $id
    );

    $existingStmt->execute();


    $existingResult =
        $existingStmt->get_result();


    $existingProject =
        $existingResult->fetch_assoc();


    $existingStmt->close();


    if (!$existingProject) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "error" => "Project not found."
        ]);

        exit;
    }


    /*
     * Delete database record
     */
    $stmt = $conn->prepare("
        DELETE FROM projects
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


    /*
     * Delete associated image
     */
    if (!empty($existingProject['image'])) {

        delete_project_image(
            $existingProject['image']
        );
    }


    echo json_encode([
        "success" => true,
        "message" => "Project deleted successfully."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Unsupported Method
|--------------------------------------------------------------------------
*/

http_response_code(405);

echo json_encode([
    "success" => false,
    "error" => "Method not allowed."
]);