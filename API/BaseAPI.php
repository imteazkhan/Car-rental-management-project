<?php
// Determine which database config to use
if (file_exists('database/config.php')) {
    require_once 'database/config.php';
    $use_pdo = true;
} else {
    require_once 'config/database.php';
    $use_pdo = false;
}

class BaseAPI {
    protected $db;
    protected $conn;
    protected $use_pdo;

    public function __construct() {
        // Check which database config exists
        if (file_exists(__DIR__ . '/database/config.php')) {
            require_once __DIR__ . '/database/config.php';
            $this->use_pdo = true;
            $this->db = new Database();
            $this->conn = $this->db->getConnection();
        } else {
            require_once __DIR__ . '/config/database.php';
            $this->use_pdo = false;
            // Use the mysqli connection from config/database.php
            global $conn;
            $this->conn = $conn;
            
            // Verify mysqli connection
            if (!$this->conn || $this->conn->connect_error) {
                throw new Exception('Database connection failed: ' . ($this->conn->connect_error ?? 'Unknown error'));
            }
        }
    }

    // Send JSON response
    protected function sendResponse($data, $status_code = 200) {
        http_response_code($status_code);
        echo json_encode($data);
        exit();
    }

    // Send error response
    protected function sendError($message, $status_code = 400) {
        http_response_code($status_code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit();
    }

    // Send success response
    protected function sendSuccess($data = null, $message = 'Success') {
        $response = [
            'success' => true,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        $this->sendResponse($response);
    }

    // Validate required fields
    protected function validateRequired($data, $required_fields) {
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            $this->sendError('Missing required fields: ' . implode(', ', $missing_fields), 400);
        }
    }

    // Sanitize input data
    protected function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([$this, 'sanitizeInput'], $data);
        }
        return htmlspecialchars(strip_tags(trim($data)));
    }

    // Get request method
    protected function getRequestMethod() {
        return $_SERVER['REQUEST_METHOD'];
    }

    // Get request data
    protected function getRequestData() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?: [];
    }

    // Verify JWT token (basic implementation)
    protected function verifyToken($token) {
        // This is a basic implementation - in production, use a proper JWT library
        if (empty($token)) {
            return false;
        }
        
        // For this basic implementation, check if token is base64 encoded user info
        try {
            $decoded = base64_decode($token);
            if ($decoded === false) {
                // If not base64, check if it's a simple token
                return !empty($token) && strlen($token) > 10;
            }
            
            // Check if decoded token has the expected format (user_id:email)
            $parts = explode(':', $decoded);
            if (count($parts) >= 2 && !empty($parts[0]) && !empty($parts[1])) {
                return true;
            }
            
            // Fallback - any non-empty token is considered valid for basic auth
            return !empty($token);
        } catch (Exception $e) {
            return false;
        }
    }

    // Get authorization header
    protected function getAuthHeader() {
        // Try multiple ways to get the authorization header
        $headers = null;
        
        // Method 1: getallheaders()
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        }
        
        // Method 2: $_SERVER variables
        if (!$headers) {
            $headers = [];
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $header_key = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                    $headers[$header_key] = $value;
                }
            }
        }
        
        // Look for Authorization header
        $authHeader = null;
        foreach (['Authorization', 'authorization', 'AUTHORIZATION'] as $key) {
            if (isset($headers[$key])) {
                $authHeader = $headers[$key];
                break;
            }
        }
        
        if ($authHeader) {
            // Remove 'Bearer ' prefix if present
            if (strpos($authHeader, 'Bearer ') === 0) {
                return substr($authHeader, 7);
            }
            return $authHeader;
        }
        
        // Fallback: check for direct token in headers
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = $_SERVER['HTTP_AUTHORIZATION'];
            if (strpos($token, 'Bearer ') === 0) {
                return substr($token, 7);
            }
            return $token;
        }
        
        return null;
    }

    // Paginate results
    protected function paginate($query, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        $query .= " LIMIT $limit OFFSET $offset";
        return $query;
    }
}
?>
