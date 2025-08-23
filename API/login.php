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

if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(["message" => "Email and password are required"]);
    exit;
}

$email = $data['email'];
$password = $data['password'];

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["message" => "Invalid credentials"]);
    exit;
}

$user = $result->fetch_assoc();

if (password_verify($password, $user['password'])) {
    unset($user['password']);
    
    // Generate token compatible with booking system
    $token = base64_encode($user['id'] . ':' . $user['email']);
    
    http_response_code(200);
    echo json_encode([
        "message" => "Login successful", 
        "user" => $user, 
        "token" => $token
    ]);
} else {
    http_response_code(401);
    echo json_encode(["message" => "Invalid credentials"]);
}

$stmt->close();
$conn->close();
?>