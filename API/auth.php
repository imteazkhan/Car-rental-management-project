<?php
require_once 'BaseAPI.php';

class AuthAPI extends BaseAPI {
    
    // User registration
    public function register() {
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['username', 'email', 'password', 'first_name', 'last_name']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Check if user already exists
        $query = "SELECT id FROM users WHERE username = :username OR email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $data['username']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $this->sendError('User already exists with this username or email', 409);
        }
        
        // Hash password
        $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Insert new user
        $query = "INSERT INTO users (username, email, password, first_name, last_name, phone, address, date_of_birth, license_number) 
                  VALUES (:username, :email, :password, :first_name, :last_name, :phone, :address, :date_of_birth, :license_number)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $data['username']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':first_name', $data['first_name']);
        $stmt->bindParam(':last_name', $data['last_name']);
        $stmt->bindParam(':phone', $data['phone'] ?? null);
        $stmt->bindParam(':address', $data['address'] ?? null);
        $stmt->bindParam(':date_of_birth', $data['date_of_birth'] ?? null);
        $stmt->bindParam(':license_number', $data['license_number'] ?? null);
        
        if ($stmt->execute()) {
            $user_id = $this->conn->lastInsertId();
            $this->sendSuccess(['user_id' => $user_id], 'User registered successfully');
        } else {
            $this->sendError('Registration failed', 500);
        }
    }
    
    // User login
    public function login() {
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['username', 'password']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Find user
        $query = "SELECT id, username, email, password, first_name, last_name, role FROM users 
                  WHERE username = :username OR email = :username";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $data['username']);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Invalid credentials', 401);
        }
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password
        if (!password_verify($data['password'], $user['password'])) {
            $this->sendError('Invalid credentials', 401);
        }
        
        // Generate simple token (in production, use proper JWT)
        $token = base64_encode($user['id'] . ':' . time());
        
        // Remove password from response
        unset($user['password']);
        
        $this->sendSuccess([
            'user' => $user,
            'token' => $token
        ], 'Login successful');
    }
    
    // Get user profile
    public function getProfile() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID (basic implementation)
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        $query = "SELECT id, username, email, first_name, last_name, phone, address, date_of_birth, license_number, role, created_at 
                  FROM users WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $user_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('User not found', 404);
        }
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->sendSuccess($user);
    }
    
    // Update user profile
    public function updateProfile() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        $data = $this->sanitizeInput($data);
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Build update query dynamically
        $fields = [];
        $params = [':id' => $user_id];
        
        $allowed_fields = ['first_name', 'last_name', 'phone', 'address', 'date_of_birth', 'license_number'];
        
        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            $this->sendError('No valid fields to update', 400);
        }
        
        $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            $this->sendSuccess(null, 'Profile updated successfully');
        } else {
            $this->sendError('Update failed', 500);
        }
    }
}

// Handle API requests
$auth = new AuthAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'register':
                    $auth->register();
                    break;
                case 'login':
                    $auth->login();
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Action not found']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Action required']);
        }
        break;
        
    case 'GET':
        $auth->getProfile();
        break;
        
    case 'PUT':
        $auth->updateProfile();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
