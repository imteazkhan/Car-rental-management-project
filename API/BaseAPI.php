<?php
require_once 'database/config.php';

class BaseAPI {
    protected $db;
    protected $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
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
        
        // For now, we'll use a simple token validation
        // In production, implement proper JWT verification
        return true;
    }

    // Get authorization header
    protected function getAuthHeader() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            return str_replace('Bearer ', '', $headers['Authorization']);
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
