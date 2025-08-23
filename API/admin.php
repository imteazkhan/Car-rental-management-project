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

class AdminAPI extends BaseAPI {
    
    // Verify admin access
    private function verifyAdmin() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Check if user is admin - handle both PDO and MySQLi
        $query = "SELECT role FROM users WHERE id = ?";
        
        if ($this->use_pdo) {
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$user_id]);
            
            if ($stmt->rowCount() == 0) {
                $this->sendError('User not found', 404);
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows == 0) {
                $this->sendError('User not found', 404);
            }
            
            $user = $result->fetch_assoc();
            $stmt->close();
        }
        
        if ($user['role'] !== 'admin') {
            $this->sendError('Admin access required', 403);
        }
        
        return $user_id;
    }
    
    // Get dashboard statistics
    public function getDashboardStats() {
        $this->verifyAdmin();
        
        // Total cars
        $cars_query = "SELECT COUNT(*) as total, 
                       SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                       SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
                       SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
                       FROM cars";
        
        if ($this->use_pdo) {
            $cars_stmt = $this->conn->prepare($cars_query);
            $cars_stmt->execute();
            $cars_stats = $cars_stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $cars_result = $this->conn->query($cars_query);
            $cars_stats = $cars_result ? $cars_result->fetch_assoc() : [];
        }
        
        // Total users
        $users_query = "SELECT COUNT(*) as total,
                        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
                        FROM users";
        
        if ($this->use_pdo) {
            $users_stmt = $this->conn->prepare($users_query);
            $users_stmt->execute();
            $users_stats = $users_stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $users_result = $this->conn->query($users_query);
            $users_stats = $users_result ? $users_result->fetch_assoc() : [];
        }
        
        // Bookings statistics
        $bookings_query = "SELECT COUNT(*) as total,
                          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                          FROM bookings";
        
        if ($this->use_pdo) {
            $bookings_stmt = $this->conn->prepare($bookings_query);
            $bookings_stmt->execute();
            $bookings_stats = $bookings_stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $bookings_result = $this->conn->query($bookings_query);
            $bookings_stats = $bookings_result ? $bookings_result->fetch_assoc() : [];
        }
        
        // Revenue statistics - handle case where payments table might not exist
        $revenue_stats = [
            'total_revenue' => 0,
            'today_revenue' => 0, 
            'week_revenue' => 0,
            'month_revenue' => 0
        ];
        
        $revenue_query = "SELECT 
                         SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
                         SUM(CASE WHEN p.status = 'completed' AND DATE(p.payment_date) = CURDATE() THEN p.amount ELSE 0 END) as today_revenue,
                         SUM(CASE WHEN p.status = 'completed' AND YEARWEEK(p.payment_date) = YEARWEEK(NOW()) THEN p.amount ELSE 0 END) as week_revenue,
                         SUM(CASE WHEN p.status = 'completed' AND MONTH(p.payment_date) = MONTH(NOW()) AND YEAR(p.payment_date) = YEAR(NOW()) THEN p.amount ELSE 0 END) as month_revenue
                         FROM payments p";
        
        try {
            if ($this->use_pdo) {
                $revenue_stmt = $this->conn->prepare($revenue_query);
                $revenue_stmt->execute();
                $revenue_result = $revenue_stmt->fetch(PDO::FETCH_ASSOC);
                if ($revenue_result) {
                    $revenue_stats = $revenue_result;
                }
            } else {
                $revenue_result = $this->conn->query($revenue_query);
                if ($revenue_result) {
                    $revenue_data = $revenue_result->fetch_assoc();
                    if ($revenue_data) {
                        $revenue_stats = $revenue_data;
                    }
                }
            }
        } catch (Exception $e) {
            // Payments table might not exist, use defaults
        }
        
        // Recent bookings
        $recent_bookings = [];
        $recent_bookings_query = "SELECT b.id, b.start_date, b.end_date, b.status, b.total_amount,
                                 u.first_name, u.last_name, c.make, c.model, c.year
                                 FROM bookings b
                                 JOIN users u ON b.user_id = u.id
                                 JOIN cars c ON b.car_id = c.id
                                 ORDER BY b.created_at DESC
                                 LIMIT 5";
        
        try {
            if ($this->use_pdo) {
                $recent_bookings_stmt = $this->conn->prepare($recent_bookings_query);
                $recent_bookings_stmt->execute();
                $recent_bookings = $recent_bookings_stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $recent_result = $this->conn->query($recent_bookings_query);
                if ($recent_result) {
                    while ($row = $recent_result->fetch_assoc()) {
                        $recent_bookings[] = $row;
                    }
                }
            }
        } catch (Exception $e) {
            // Tables might not exist, use empty array
        }
        
        $this->sendSuccess([
            'cars' => $cars_stats ?: ['total' => 0, 'available' => 0, 'rented' => 0, 'maintenance' => 0],
            'users' => $users_stats ?: ['total' => 0, 'customers' => 0, 'admins' => 0],
            'bookings' => $bookings_stats ?: ['total' => 0, 'pending' => 0, 'confirmed' => 0, 'active' => 0, 'completed' => 0, 'cancelled' => 0],
            'revenue' => $revenue_stats,
            'recent_bookings' => $recent_bookings
        ]);
    }
    
    // Get monthly revenue chart data
    public function getRevenueChart() {
        $this->verifyAdmin();
        
        $year = $_GET['year'] ?? date('Y');
        
        $query = "SELECT 
                  MONTH(p.payment_date) as month,
                  SUM(p.amount) as revenue,
                  COUNT(p.id) as transactions
                  FROM payments p 
                  WHERE p.status = 'completed' AND YEAR(p.payment_date) = ?
                  GROUP BY MONTH(p.payment_date)
                  ORDER BY MONTH(p.payment_date)";
        
        $data = [];
        try {
            if ($this->use_pdo) {
                $stmt = $this->conn->prepare($query);
                $stmt->execute([$year]);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("i", $year);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $data[] = $row;
                    }
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            // Payments table might not exist
        }
        
        // Fill missing months with zero values
        $months = [];
        for ($i = 1; $i <= 12; $i++) {
            $months[$i] = ['month' => $i, 'revenue' => 0, 'transactions' => 0];
        }
        
        foreach ($data as $row) {
            $months[$row['month']] = $row;
        }
        
        $this->sendSuccess(array_values($months));
    }
    
    // Get car utilization data
    public function getCarUtilization() {
        $this->verifyAdmin();
        
        $query = "SELECT c.id, c.make, c.model, c.year, c.license_plate,
                  COUNT(b.id) as total_bookings,
                  SUM(CASE WHEN b.status = 'completed' THEN DATEDIFF(b.end_date, b.start_date) ELSE 0 END) as total_days_rented,
                  AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating ELSE 0 END) as avg_rating
                  FROM cars c
                  LEFT JOIN bookings b ON c.id = b.car_id
                  LEFT JOIN reviews r ON c.id = r.car_id
                  GROUP BY c.id
                  ORDER BY total_bookings DESC";
        
        $data = [];
        try {
            if ($this->use_pdo) {
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $result = $this->conn->query($query);
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $data[] = $row;
                    }
                }
            }
        } catch (Exception $e) {
            // Tables might not exist, return empty array
        }
        
        $this->sendSuccess($data);
    }
    
    // Manage user roles
    public function updateUserRole($user_id) {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        
        if (!isset($data['role']) || !in_array($data['role'], ['customer', 'admin'])) {
            $this->sendError('Valid role required (customer or admin)', 400);
        }
        
        $query = "UPDATE users SET role = :role WHERE id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            $this->sendSuccess(null, 'User role updated successfully');
        } else {
            $this->sendError('User not found or update failed', 404);
        }
    }
    
    // Create new user
    public function createUser() {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['username', 'email', 'password', 'first_name', 'last_name']);
        
        $data = $this->sanitizeInput($data);
        
        // Check if username or email already exists
        $check_query = "SELECT id FROM users WHERE username = :username OR email = :email";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':username', $data['username']);
        $check_stmt->bindParam(':email', $data['email']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $this->sendError('Username or email already exists', 409);
        }
        
        // Hash password
        $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (username, email, password, first_name, last_name, phone, address, date_of_birth, license_number, role) 
                  VALUES (:username, :email, :password, :first_name, :last_name, :phone, :address, :date_of_birth, :license_number, :role)";
        
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
        $stmt->bindParam(':role', $data['role'] ?? 'customer');
        
        if ($stmt->execute()) {
            $user_id = $this->conn->lastInsertId();
            $this->sendSuccess(['user_id' => $user_id], 'User created successfully');
        } else {
            $this->sendError('Failed to create user', 500);
        }
    }
    
    // Update user
    public function updateUser($user_id) {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        $data = $this->sanitizeInput($data);
        
        // Build update query dynamically
        $fields = [];
        $params = [':id' => $user_id];
        
        $allowed_fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'address', 'date_of_birth', 'license_number', 'role'];
        
        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        // Handle password update separately
        if (isset($data['password']) && !empty($data['password'])) {
            $fields[] = "password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($fields)) {
            $this->sendError('No valid fields to update', 400);
        }
        
        $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            $this->sendSuccess(null, 'User updated successfully');
        } else {
            $this->sendError('Update failed', 500);
        }
    }
    
    // Delete user
    public function deleteUser($user_id) {
        $this->verifyAdmin();
        
        // Check if user has active bookings
        $check_query = "SELECT id FROM bookings WHERE user_id = :user_id AND status IN ('confirmed', 'active')";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $this->sendError('Cannot delete user with active bookings', 400);
        }
        
        $query = "DELETE FROM users WHERE id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            $this->sendSuccess(null, 'User deleted successfully');
        } else {
            $this->sendError('User not found or delete failed', 404);
        }
    }
    
    // Get single user
    public function getUser($user_id) {
        $this->verifyAdmin();
        
        $query = "SELECT id, username, email, first_name, last_name, phone, address, date_of_birth, license_number, role, created_at, updated_at
                  FROM users WHERE id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('User not found', 404);
        }
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->sendSuccess($user);
    }
    
    // Get all users with pagination
    public function getAllUsers() {
        $this->verifyAdmin();
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $search = $_GET['search'] ?? null;
        $role = $_GET['role'] ?? null;
        
        $query = "SELECT id, username, email, first_name, last_name, phone, role, created_at
                  FROM users WHERE 1=1";
        $params = [];
        
        if ($search) {
            $query .= " AND (first_name LIKE :search OR last_name LIKE :search OR email LIKE :search OR username LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if ($role) {
            $query .= " AND role = :role";
            $params[':role'] = $role;
        }
        
        $query .= " ORDER BY created_at DESC";
        
        // Get total count
        $count_query = str_replace("SELECT id, username, email, first_name, last_name, phone, role, created_at", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'users' => $users,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Add maintenance record
    public function addMaintenanceRecord() {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        
        $this->validateRequired($data, ['car_id', 'maintenance_type', 'maintenance_date']);
        
        $data = $this->sanitizeInput($data);
        
        $query = "INSERT INTO maintenance_records (car_id, maintenance_type, description, cost, maintenance_date, next_maintenance_date)
                  VALUES (:car_id, :maintenance_type, :description, :cost, :maintenance_date, :next_maintenance_date)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':car_id', $data['car_id']);
        $stmt->bindParam(':maintenance_type', $data['maintenance_type']);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':cost', $data['cost'] ?? null);
        $stmt->bindParam(':maintenance_date', $data['maintenance_date']);
        $stmt->bindParam(':next_maintenance_date', $data['next_maintenance_date'] ?? null);
        
        if ($stmt->execute()) {
            // Update car status to maintenance if specified
            if (isset($data['set_maintenance_status']) && $data['set_maintenance_status']) {
                $car_update = "UPDATE cars SET status = 'maintenance' WHERE id = :car_id";
                $car_stmt = $this->conn->prepare($car_update);
                $car_stmt->bindParam(':car_id', $data['car_id']);
                $car_stmt->execute();
            }
            
            $record_id = $this->conn->lastInsertId();
            $this->sendSuccess(['record_id' => $record_id], 'Maintenance record added successfully');
        } else {
            $this->sendError('Failed to add maintenance record', 500);
        }
    }
    
    // Bulk operations
    public function bulkAction() {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        
        $this->validateRequired($data, ['action', 'ids']);
        
        if (!is_array($data['ids']) || empty($data['ids'])) {
            $this->sendError('Valid IDs array required', 400);
        }
        
        $placeholders = str_repeat('?,', count($data['ids']) - 1) . '?';
        $results = [];
        
        switch ($data['action']) {
            case 'delete_users':
                $query = "DELETE FROM users WHERE id IN ($placeholders) AND id != ? AND role != 'admin'";
                $params = array_merge($data['ids'], [$this->verifyAdmin()]);
                break;
                
            case 'update_user_role':
                if (!isset($data['role']) || !in_array($data['role'], ['customer', 'admin'])) {
                    $this->sendError('Valid role required', 400);
                }
                $query = "UPDATE users SET role = ? WHERE id IN ($placeholders)";
                $params = array_merge([$data['role']], $data['ids']);
                break;
                
            case 'update_car_status':
                if (!isset($data['status']) || !in_array($data['status'], ['available', 'rented', 'maintenance'])) {
                    $this->sendError('Valid status required', 400);
                }
                $query = "UPDATE cars SET status = ? WHERE id IN ($placeholders)";
                $params = array_merge([$data['status']], $data['ids']);
                break;
                
            case 'cancel_bookings':
                $query = "UPDATE bookings SET status = 'cancelled' WHERE id IN ($placeholders) AND status IN ('pending', 'confirmed')";
                $params = $data['ids'];
                break;
                
            default:
                $this->sendError('Invalid bulk action', 400);
        }
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            $affected_rows = $stmt->rowCount();
            $this->sendSuccess(['affected_rows' => $affected_rows], "Bulk action completed. $affected_rows records affected.");
        } else {
            $this->sendError('Bulk action failed', 500);
        }
    }
}

// Handle API requests
$admin = new AdminAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'stats':
                    $admin->getDashboardStats();
                    break;
                case 'revenue-chart':
                    $admin->getRevenueChart();
                    break;
                case 'car-utilization':
                    $admin->getCarUtilization();
                    break;
                case 'users':
                    $admin->getAllUsers();
                    break;
                case 'user':
                    if (isset($_GET['user_id'])) {
                        $admin->getUser($_GET['user_id']);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'User ID required']);
                    }
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
        
    case 'POST':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'maintenance':
                    $admin->addMaintenanceRecord();
                    break;
                case 'user':
                    $admin->createUser();
                    break;
                case 'bulk':
                    $admin->bulkAction();
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
        
    case 'PUT':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'user-role':
                    if (isset($_GET['user_id'])) {
                        $admin->updateUserRole($_GET['user_id']);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'User ID required']);
                    }
                    break;
                case 'user':
                    if (isset($_GET['user_id'])) {
                        $admin->updateUser($_GET['user_id']);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'User ID required']);
                    }
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
        
    case 'DELETE':
        if (isset($_GET['action']) && $_GET['action'] === 'user' && isset($_GET['user_id'])) {
            $admin->deleteUser($_GET['user_id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

?>
