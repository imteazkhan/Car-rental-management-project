<?php
// Enable CORS for React frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'BaseAPI.php';

class AuthAPI extends BaseAPI {
    
    // User registration
    public function register() {
        try {
            $data = $this->getRequestData();
            
            // Debug: Log the received data
            error_log("Registration data received: " . json_encode($data));
            
            // Validate required fields
            $this->validateRequired($data, ['username', 'email', 'password', 'first_name', 'last_name']);
            
            // Sanitize input
            $data = $this->sanitizeInput($data);
            
            // Check database connection
            if (!$this->conn) {
                error_log("Database connection is null");
                $this->sendError('Database connection failed', 500);
            }
            
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
            
            // Bind parameters with proper null handling
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':first_name', $data['first_name']);
            $stmt->bindParam(':last_name', $data['last_name']);
            
            // Handle optional fields properly
            $phone = isset($data['phone']) && !empty($data['phone']) ? $data['phone'] : null;
            $address = isset($data['address']) && !empty($data['address']) ? $data['address'] : null;
            $date_of_birth = isset($data['date_of_birth']) && !empty($data['date_of_birth']) ? $data['date_of_birth'] : null;
            $license_number = isset($data['license_number']) && !empty($data['license_number']) ? $data['license_number'] : null;
            
            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':address', $address);
            $stmt->bindParam(':date_of_birth', $date_of_birth);
            $stmt->bindParam(':license_number', $license_number);
            
            // Execute the statement
            $result = $stmt->execute();
            
            if ($result) {
                $user_id = $this->conn->lastInsertId();
                error_log("User registered successfully with ID: " . $user_id);
                $this->sendSuccess(['user_id' => $user_id], 'User registered successfully');
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("SQL execution failed: " . json_encode($errorInfo));
                $this->sendError('Registration failed: ' . $errorInfo[2], 500);
            }
            
        } catch (PDOException $e) {
            error_log("PDO Exception in registration: " . $e->getMessage());
            $this->sendError('Database error: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            error_log("General Exception in registration: " . $e->getMessage());
            $this->sendError('Registration failed: ' . $e->getMessage(), 500);
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
