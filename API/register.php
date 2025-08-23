<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");
require_once 'config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (empty($data['firstName']) || empty($data['lastName']) || empty($data['email']) || 
    empty($data['password']) || empty($data['phone']) || empty($data['dateOfBirth'])) {
    http_response_code(400);
    echo json_encode(["message" => "All fields are required"]);
    exit;
}

// Check if email already exists
$email = $data['email'];
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["message" => "Email already exists"]);
    exit;
}

// Hash password
$passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

// Prepare and execute insert statement
$stmt = $conn->prepare("INSERT INTO users (username, email, password, first_name, last_name, phone, date_of_birth) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)");
$username = strtolower($data['firstName'] . $data['lastName']);
$stmt->bind_param("sssssss", 
    $username,
    $data['email'],
    $passwordHash,
    $data['firstName'],
    $data['lastName'],
    $data['phone'],
    $data['dateOfBirth']
);

if ($stmt->execute()) {
    $userId = $stmt->insert_id;
    $stmt->close();

    $stmt = $conn->prepare("SELECT id, username, email, first_name, last_name FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    http_response_code(201);
    echo json_encode(["message" => "Registration successful", "user" => $user]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Registration failed"]);
}

$stmt->close();
$conn->close();
?>