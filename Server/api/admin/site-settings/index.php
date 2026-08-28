<?php

require_once __DIR__ . '/../_bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get($pdo);
        break;

    case 'PUT':
        handle_update($pdo);
        break;

    default:
        send_error('Method not allowed', 405);
}

function handle_get(PDO $pdo): void
{
    $row = $pdo->query(
        'SELECT * FROM site_settings ORDER BY id ASC LIMIT 1'
    )->fetch();

    if (!$row) {
        send_error(
            'Site settings not configured yet',
            404
        );
    }

    send_success($row);
}

function handle_update(PDO $pdo): void
{
    require_auth();

    $input = sanitize_array(get_json_input());

    $fields = [
        'company_name',
        'phone',
        'email',
        'logo_icon',
        'cta_text',
        'cta_link'
    ];

    if (
        array_key_exists('email', $input) &&
        $input['email'] !== '' &&
        !filter_var(
            $input['email'],
            FILTER_VALIDATE_EMAIL
        )
    ) {
        send_error(
            'Invalid email address',
            422
        );
    }

    $existing = $pdo->query(
        'SELECT * FROM site_settings ORDER BY id ASC LIMIT 1'
    )->fetch();

    if (!$existing) {
        send_error(
            'Site settings not configured yet',
            404
        );
    }

    $set = [];
    $params = [];

    foreach ($fields as $field) {
        if (array_key_exists($field, $input)) {
            $set[] = "`$field` = :$field";
            $params[$field] = $input[$field];
        }
    }

    if (empty($set)) {
        send_error(
            'No fields provided to update',
            422
        );
    }

    $params['id'] = $existing['id'];

    $sql = 'UPDATE site_settings SET ' .
        implode(', ', $set) .
        ' WHERE id = :id';

    $pdo->prepare($sql)->execute($params);

    $row = $pdo->prepare(
        'SELECT * FROM site_settings WHERE id = :id'
    );

    $row->execute([
        'id' => $existing['id']
    ]);

    send_success(
        $row->fetch(),
        'Site settings updated'
    );
}